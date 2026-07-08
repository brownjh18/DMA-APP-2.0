import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import { BACKEND_BASE_URL } from '../services/api';

// Helper to resolve relative upload URLs to full backend URLs
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
  
  // Try treating it as a relative path
  const resolved = `${BACKEND_BASE_URL}/${url}`;
  console.log('AudioPlayer: Resolved relative to:', resolved);
  return resolved;
};

const SKIP_SECONDS = 10;
const AudioPlayer: React.FC = () => {
  const { currentMedia, isPlaying, setIsPlaying, savePlaybackPosition, getPlaybackPosition, setCurrentTime } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  // Use a ref that survives component re-renders but can be reset
  const loadedPodcastIdRef = useRef<string | undefined>(undefined);
  // Track if we need to reload audio
  const needsReloadRef = useRef<boolean>(false);

  const podcast = currentMedia && isPodcast(currentMedia) ? currentMedia : null;

  // Load audio when media changes
  useEffect(() => {
    if (!currentMedia) {
      // Miniplayer closed or media cleared - stop audio and reset everything
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      loadedPodcastIdRef.current = undefined;
      needsReloadRef.current = false;
      return;
    }

    if (!isPodcast(currentMedia)) {
      // Not a podcast (it's a sermon), stop any existing audio and reset
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      loadedPodcastIdRef.current = undefined;
      return;
    }

    const podcastId = currentMedia.id;

    // Always reload when podcast changes or when needsReload is set
    if (loadedPodcastIdRef.current !== podcastId || needsReloadRef.current) {
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
  }, [currentMedia]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !podcast) return;

    const audio = audioRef.current;

    const playAudio = () => {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          // Retry after a delay for autoplay policy
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

    // Small delay to ensure audio is loaded
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
    // Force reload check on canPlay
    if (podcast && loadedPodcastIdRef.current !== podcast.id) {
      needsReloadRef.current = true;
    }
  }, [podcast]);

  // Set up event listeners for skip operations
  useEffect(() => {
    const handleSkipForward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime += SKIP_SECONDS;
      }
    };
    const handleSkipBackward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - SKIP_SECONDS);
      }
    };
    const handleSeek = (event: Event) => {
      const customEvent = event as CustomEvent<{ time: number }>;
      if (audioRef.current && customEvent.detail?.time != null) {
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

  // Don't render if no podcast
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
