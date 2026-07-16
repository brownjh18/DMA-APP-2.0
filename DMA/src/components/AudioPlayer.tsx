import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import { isPodcast } from '../utils/mediaUtils';
import { BACKEND_BASE_URL } from '../services/api';

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

const SKIP_SECONDS = 10;
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

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      savePlaybackPosition(currentTime);
      setCurrentTime(currentTime);
    }
  }, [savePlaybackPosition, setCurrentTime]);

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
