import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import { isPodcast } from '../utils/mediaUtils';
import { BACKEND_BASE_URL } from '../services/api';
import { Capacitor } from '@capacitor/core';

const resolveUrl = (url: string) => {
  if (!url || url.trim() === '') {
    console.warn('AudioPlayer: Empty audio URL detected');
    return null;
  }
  console.log('AudioPlayer: Resolving URL:', url);
  
  if (url.startsWith('/uploads/') || url.startsWith('/uploads')) {
    const resolved = `${BACKEND_BASE_URL}${url}`;
    console.log('AudioPlayer: Resolved to:', resolved);
    return resolved;
  }
  if (url.startsWith('http')) {
    console.log('AudioPlayer: Using full URL:', url);
    return url;
  }
  if (url.startsWith('/')) {
    const resolved = `${BACKEND_BASE_URL}${url}`;
    console.log('AudioPlayer: Resolved to:', resolved);
    return resolved;
  }
  
  const resolved = `${BACKEND_BASE_URL}/${url}`;
  console.log('AudioPlayer: Resolved relative to:', resolved);
  return resolved;
};

let AudioService: any = null;
if (Capacitor.isNativePlatform()) {
  AudioService = (Capacitor as any).Plugins?.AudioService;
}

const SKIP_SECONDS = 10;
const API_BASE = 'https://dove-church.onrender.com';

const resolveArtUri = (url?: string | null): string => {
  if (!url || url.trim() === '') return '';
  if (url.startsWith('http')) return url;
  const base = BACKEND_BASE_URL || API_BASE;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const AudioPlayer: React.FC = () => {
  const { currentMedia, isPlaying, setIsPlaying, savePlaybackPosition, setCurrentTime } = usePlayer();
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedPodcastIdRef = useRef<string | undefined>(undefined);
  const needsReloadRef = useRef<boolean>(false);

  // Live streaming refs
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const chunkQueueRef = useRef<Uint8Array[]>([]);
  const liveBroadcastIdRef = useRef<string | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm;codecs=opus');

  const podcast = currentMedia && isPodcast(currentMedia) ? currentMedia : null;

  // Cleanup live stream resources
  const cleanupLive = useCallback(() => {
    if (liveBroadcastIdRef.current && socket) {
      socket.emit('broadcast:leave-room', liveBroadcastIdRef.current);
      socket.off('broadcast:audio');
    }
    liveBroadcastIdRef.current = null;
    if (sourceBufferRef.current) {
      try { sourceBufferRef.current.abort(); } catch {}
      sourceBufferRef.current = null;
    }
    if (mediaSourceRef.current) {
      if (mediaSourceRef.current.readyState === 'open') {
        try { mediaSourceRef.current.endOfStream(); } catch {}
      }
      mediaSourceRef.current = null;
    }
    chunkQueueRef.current = [];
    mimeTypeRef.current = 'audio/webm;codecs=opus';
  }, [socket]);

  // Initialize live stream (MediaSource + Socket.IO)
  const initLiveStream = useCallback((broadcastId: string) => {
    if (!audioRef.current || !socket) return;

    cleanupLive();
    liveBroadcastIdRef.current = broadcastId;
    socket.emit('broadcast:join-room', broadcastId);

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audioRef.current.src = URL.createObjectURL(mediaSource);

    // For live streams, set duration to Infinity (no known end)
    audioRef.current.removeAttribute('duration');

    mediaSource.addEventListener('sourceopen', () => {
      try {
        const sb = mediaSource.addSourceBuffer(mimeTypeRef.current);
        sourceBufferRef.current = sb;

        sb.addEventListener('updateend', () => {
          while (chunkQueueRef.current.length > 0 && !sb.updating) {
            const chunk = chunkQueueRef.current.shift()!;
            sb.appendBuffer(chunk.buffer as ArrayBuffer);
          }
        });
      } catch (err) {
        console.error('AudioPlayer: MediaSource failed. Trying fallback.', err);
      }
    });

    socket.on('broadcast:audio', (data: { chunk: string; mimeType?: string }) => {
      if (!data.chunk) return;
      try {
        const binary = atob(data.chunk);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        if (data.mimeType) mimeTypeRef.current = data.mimeType;

        const sb = sourceBufferRef.current;
        if (sb && !sb.updating) {
          sb.appendBuffer(bytes.buffer as ArrayBuffer);
        } else {
          chunkQueueRef.current.push(bytes);
        }
      } catch (err) {
        console.error('AudioPlayer: Error processing audio chunk', err);
      }
    });
  }, [socket, cleanupLive]);

  // Load audio when media changes
  useEffect(() => {
    if (!currentMedia) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      cleanupLive();
      loadedPodcastIdRef.current = undefined;
      needsReloadRef.current = false;
      return;
    }

    if (!isPodcast(currentMedia)) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      cleanupLive();
      loadedPodcastIdRef.current = undefined;
      return;
    }

    // Live stream via MediaSource + socket
    if (currentMedia.isLive) {
      cleanupLive();
      initLiveStream(currentMedia.id);
      return;
    }

    const podcastId = currentMedia.id;

    if (loadedPodcastIdRef.current !== podcastId || needsReloadRef.current) {
      cleanupLive();
      loadedPodcastIdRef.current = podcastId;
      needsReloadRef.current = false;

      if (audioRef.current) {
        const audioUrl = resolveUrl(currentMedia.audioUrl);
        if (audioUrl) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        } else {
          console.error('AudioPlayer: Could not resolve audio URL for', currentMedia.audioUrl);
        }
      }
    }
  }, [currentMedia, cleanupLive, initLiveStream]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !podcast) return;

    const audio = audioRef.current;

    const playAudio = () => {
      if (podcast.isLive) {
        audio.play().catch(() => {});
        return;
      }
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          setTimeout(() => {
            if (isPlaying) {
              audio.play().catch(() => {});
            }
          }, 300);
        });
      }
    };

    const pauseAudio = () => {
      audio.pause();
    };

    const timer = setTimeout(() => {
      if (isPlaying) {
        playAudio();
      } else {
        pauseAudio();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isPlaying, podcast]);

  const lastPositionUpdateRef = useRef<number>(0);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      savePlaybackPosition(currentTime);
      setCurrentTime(currentTime);

      // Send position update to native notification (throttle to every 1 second)
      if (AudioService && podcast) {
        const now = Date.now();
        if (now - lastPositionUpdateRef.current >= 1000) {
          lastPositionUpdateRef.current = now;
          AudioService.updatePosition({
            position: currentTime * 1000,
            duration: (audioRef.current.duration || 0) * 1000,
            isPlaying,
          }).catch(() => {});
        }
      }
    }
  }, [savePlaybackPosition, setCurrentTime, AudioService, podcast, isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    savePlaybackPosition(0);
  }, [setIsPlaying, savePlaybackPosition]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('AudioPlayer: Audio error', e);
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleCanPlay = useCallback(() => {
    if (podcast && loadedPodcastIdRef.current !== podcast.id) {
      needsReloadRef.current = true;
    }
  }, [podcast]);

  // Media Session API: set up notification controls and background playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!podcast) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artworkUrl = podcast.thumbnailUrl
      ? (podcast.thumbnailUrl.startsWith('http') ? podcast.thumbnailUrl : `${BACKEND_BASE_URL}${podcast.thumbnailUrl}`)
      : `${BACKEND_BASE_URL}/api/placeholder/300/300`;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: podcast.title,
      artist: podcast.speaker || 'Dove Church',
      album: 'Podcast',
      artwork: [
        { src: artworkUrl, sizes: '300x300', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (audioRef.current) audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - SKIP_SECONDS);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + SKIP_SECONDS);
      }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch {}
    };
  }, [podcast, setIsPlaying]);

  // Update media session playback state on time updates
  useEffect(() => {
    if (!('mediaSession' in navigator) || !audioRef.current) return;
    const audio = audioRef.current;
    if (!podcast || !isFinite(audio.duration)) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    navigator.mediaSession.setPositionState({
      duration: audio.duration || 0,
      playbackRate: audio.playbackRate,
      position: audio.currentTime || 0,
    });
  }, [isPlaying, podcast, setCurrentTime]);

  // Start/stop native foreground service for background audio
  useEffect(() => {
    if (!AudioService || !podcast) return;

    if (isPlaying) {
      const currentTimeMs = (audioRef.current?.currentTime || 0) * 1000;
      const durationMs = (audioRef.current?.duration || 0) * 1000;

      AudioService.startService({
        title: podcast.title,
        subtitle: podcast.speaker || 'Dove Church',
        artUri: resolveArtUri(podcast.thumbnailUrl),
        position: currentTimeMs,
        duration: durationMs,
      }).catch(() => {});
    } else if (!isPlaying && podcast) {
      AudioService.sendControl({ action: 'pause' }).catch(() => {});
    }
  }, [isPlaying, podcast]);

  // Stop foreground service when no podcast is loaded
  useEffect(() => {
    if (!AudioService) return;
    if (!podcast) {
      AudioService.stopService().catch(() => {});
    }
  }, [podcast]);

  // Update notification metadata when podcast changes
  useEffect(() => {
    if (!AudioService || !podcast) return;
    const currentTimeMs = (audioRef.current?.currentTime || 0) * 1000;
    const durationMs = (audioRef.current?.duration || 0) * 1000;
    AudioService.updateMetadata({
      title: podcast.title,
      subtitle: podcast.speaker || 'Dove Church',
      artUri: resolveArtUri(podcast.thumbnailUrl),
      position: currentTimeMs,
      duration: durationMs,
      isPlaying,
    }).catch(() => {});
  }, [podcast, isPlaying]);

  // Listen for native notification controls (play/pause from notification)
  useEffect(() => {
    if (!AudioService) return;

    let listenerHandle: any = null;
    const setupListener = async () => {
      try {
        listenerHandle = await AudioService.addListener('audioControl', (data: { action: string; position?: string }) => {
          if (!audioRef.current) return;
          switch (data.action) {
            case 'play':
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
              break;
            case 'pause':
              audioRef.current.pause();
              setIsPlaying(false);
              break;
            case 'stop':
              audioRef.current.pause();
              setIsPlaying(false);
              AudioService?.stopService().catch(() => {});
              break;
            case 'next': {
              window.dispatchEvent(new Event('notification-next'));
              break;
            }
            case 'prev': {
              window.dispatchEvent(new Event('notification-prev'));
              break;
            }
            case 'seek': {
              const seekTime = parseFloat(data.position || '0') / 1000;
              if (seekTime > 0) {
                audioRef.current.currentTime = seekTime;
              }
              break;
            }
          }
        });
      } catch (e) {
        console.warn('AudioPlayer: Could not add native audio listener', e);
      }
    };
    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove().catch(() => {});
      }
    };
  }, [setIsPlaying]);

  // Set up event listeners for skip operations (not applicable for live)
  useEffect(() => {
    const handleSkipForward = () => {
      if (audioRef.current && !liveBroadcastIdRef.current) {
        audioRef.current.currentTime += SKIP_SECONDS;
      }
    };
    const handleSkipBackward = () => {
      if (audioRef.current && !liveBroadcastIdRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - SKIP_SECONDS);
      }
    };
    const handleSeek = (event: Event) => {
      const customEvent = event as CustomEvent<{ time: number }>;
      if (audioRef.current && customEvent.detail?.time != null && !liveBroadcastIdRef.current) {
        audioRef.current.currentTime = customEvent.detail.time;
      }
    };

    window.addEventListener('skip-forward', handleSkipForward);
    window.addEventListener('skip-backward', handleSkipBackward);
    window.addEventListener('audio-seek', handleSeek);

    return () => {
      window.removeEventListener('skip-forward', handleSkipForward);
      window.removeEventListener('skip-backward', handleSkipBackward);
      window.removeEventListener('audio-seek', handleSeek);
    };
  }, []);

  if (!podcast) {
    return null;
  }

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onError={handleError}
      onCanPlay={handleCanPlay}
      preload="metadata"
    />
  );
};

export default AudioPlayer;
