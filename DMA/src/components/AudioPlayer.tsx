import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';

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
    console.log('AudioPlayer: Media changed to', currentMedia?.id, 'podcast=', podcast?.id);

    if (!currentMedia) {
      // Miniplayer closed - reset everything
      console.log('AudioPlayer: Miniplayer closed, resetting refs');
      loadedPodcastIdRef.current = undefined;
      needsReloadRef.current = false;
      return;
    }

    if (!isPodcast(currentMedia)) {
      // Not a podcast (it's a sermon), reset
      loadedPodcastIdRef.current = undefined;
      return;
    }

    const podcastId = currentMedia.id;
    console.log('AudioPlayer: Checking reload - current ref=', loadedPodcastIdRef.current, 'new id=', podcastId);

    // Always reload when podcast changes or when needsReload is set
    if (loadedPodcastIdRef.current !== podcastId || needsReloadRef.current) {
      console.log('AudioPlayer: Loading audio for', podcastId);
      loadedPodcastIdRef.current = podcastId;
      needsReloadRef.current = false;

      if (audioRef.current) {
        audioRef.current.src = currentMedia.audioUrl;
        audioRef.current.load();
        console.log('AudioPlayer: Audio source set and loaded');
      }
    }
  }, [currentMedia]);

  // Handle play/pause
  useEffect(() => {
    console.log('AudioPlayer: isPlaying=', isPlaying, 'podcast=', podcast?.id);

    if (!audioRef.current || !podcast) return;

    const audio = audioRef.current;

    const playAudio = () => {
      console.log('AudioPlayer: Attempting to play');
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log('AudioPlayer: Play started successfully');
        }).catch((error) => {
          console.warn('AudioPlayer: Play failed, retrying...', error);
          // Retry after a delay
          setTimeout(() => {
            if (isPlaying) {
              console.log('AudioPlayer: Retrying play');
              audio.play().catch(e => console.warn('AudioPlayer: Retry failed:', e));
            }
          }, 300);
        });
      }
    };

    const pauseAudio = () => {
      console.log('AudioPlayer: Pausing');
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
    console.log('AudioPlayer: Playback ended');
    setIsPlaying(false);
    savePlaybackPosition(0);
  }, [setIsPlaying, savePlaybackPosition]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('AudioPlayer: Audio error', e);
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleCanPlay = useCallback(() => {
    console.log('AudioPlayer: Can play event');
    // Force reload check on canPlay
    if (podcast && loadedPodcastIdRef.current !== podcast.id) {
      needsReloadRef.current = true;
    }
  }, [podcast]);

  // Set up event listeners for skip operations
  useEffect(() => {
    console.log('AudioPlayer: Setting up skip event listeners');
    window.addEventListener('skip-forward', () => {
      console.log('AudioPlayer: skipForward event received');
      if (audioRef.current) {
        audioRef.current.currentTime += SKIP_SECONDS;
        console.log('AudioPlayer: Skipped forward to', audioRef.current.currentTime);
      }
    });
    window.addEventListener('skip-backward', () => {
      console.log('AudioPlayer: skipBackward event received');
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - SKIP_SECONDS);
        console.log('AudioPlayer: Skipped backward to', audioRef.current.currentTime);
      }
    });
    window.addEventListener('audio-seek', (event: Event) => {
      const customEvent = event as CustomEvent<{ time: number }>;
      console.log('AudioPlayer: seek event received with time', customEvent.detail?.time);
      if (audioRef.current && customEvent.detail?.time !== undefined) {
        audioRef.current.currentTime = customEvent.detail.time;
        console.log('AudioPlayer: Seeked to', audioRef.current.currentTime);
      }
    });

    return () => {
      console.log('AudioPlayer: Removing skip event listeners');
      window.removeEventListener('skip-forward', () => {});
      window.removeEventListener('skip-backward', () => {});
      window.removeEventListener('audio-seek', () => {});
    };
  }, []);

  // Don't render if no podcast
  if (!podcast) {
    return null;
  }

  console.log('AudioPlayer: Rendering with podcast', podcast.id);

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
