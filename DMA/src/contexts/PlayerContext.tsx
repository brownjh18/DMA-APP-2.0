import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isPodcast } from '../utils/mediaUtils';

// Custom event for skip operations
const SKIP_FORWARD_EVENT = 'skip-forward';
const SKIP_BACKWARD_EVENT = 'skip-backward';


export interface Sermon {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  audioUrl: string;
  speaker?: string;
}

export type MediaItem = Sermon | Podcast;


interface PlayerContextType {
  currentMedia: MediaItem | null;
  isPlaying: boolean;
  setCurrentMedia: (media: MediaItem | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  // Keep backward compatibility
  currentSermon: Sermon | null;
  setCurrentSermon: (sermon: Sermon | null) => void;
  sourcePage: string | null;
  currentTime: number;
  setSourcePage: (page: string | null) => void;
  setCurrentTime: (time: number) => void;
  // New: save and restore playback position
  savePlaybackPosition: (time: number) => void;
  getPlaybackPosition: () => number;
  // Skip forward/backward
  skipForward: () => void;
  skipBackward: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(() => {
    // Restore current media from localStorage
    try {
      const saved = localStorage.getItem('player_currentMedia');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    // Auto-play if we have saved media (resume from where we left off)
    try {
      const saved = localStorage.getItem('player_currentMedia');
      return saved ? true : false;
    } catch { return false; }
  });

  const [sourcePage, setSourcePage] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);

  // Store playback positions per media item — persisted to localStorage
  const [playbackPositions, setPlaybackPositions] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('player_positions');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Persist currentMedia to localStorage
  useEffect(() => {
    if (currentMedia) {
      localStorage.setItem('player_currentMedia', JSON.stringify(currentMedia));
    } else {
      localStorage.removeItem('player_currentMedia');
    }
  }, [currentMedia]);

  // Persist playback positions to localStorage (debounced)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem('player_positions', JSON.stringify(playbackPositions));
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [playbackPositions]);

  // Periodically save current position to localStorage (for YouTube where onTimeUpdate doesn't fire)
  useEffect(() => {
    if (!isPlaying || !currentMedia) return;
    const interval = setInterval(() => {
      if (currentTime > 0 && currentMedia) {
        setPlaybackPositions(prev => ({
          ...prev,
          [currentMedia.id]: currentTime
        }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentMedia, currentTime]);

  // Save position immediately when pausing or when media changes
  const prevMediaRef = useRef<MediaItem | null>(null);
  useEffect(() => {
    // When media changes, save position of the previous media
    if (prevMediaRef.current && prevMediaRef.current.id !== currentMedia?.id) {
      if (currentTime > 0) {
        setPlaybackPositions(prev => ({
          ...prev,
          [prevMediaRef.current!.id]: currentTime
        }));
      }
    }
    prevMediaRef.current = currentMedia;
  }, [currentMedia]);

  // Save position when pausing
  useEffect(() => {
    if (!isPlaying && currentMedia && currentTime > 0) {
      setPlaybackPositions(prev => ({
        ...prev,
        [currentMedia.id]: currentTime
      }));
    }
  }, [isPlaying]);

  // Listen for forced save events (e.g., before page unload)
  useEffect(() => {
    const handleForceSave = () => {
      if (currentMedia && currentTime > 0) {
        const updated = { ...playbackPositions, [currentMedia.id]: currentTime };
        setPlaybackPositions(updated);
        // Write directly to localStorage immediately (bypass debounce)
        localStorage.setItem('player_positions', JSON.stringify(updated));
      }
    };
    const handleBeforeUnload = () => {
      handleForceSave();
    };
    window.addEventListener('save-playback-position', handleForceSave);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('save-playback-position', handleForceSave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentMedia, currentTime, playbackPositions]);

  // Backward compatibility - derive currentSermon from currentMedia
  const currentSermon = currentMedia && !isPodcast(currentMedia) ? currentMedia : null;

  const setCurrentSermon = (sermon: Sermon | null) => {
    setCurrentMedia(sermon);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const savePlaybackPosition = (time: number) => {
    if (currentMedia) {
      setPlaybackPositions(prev => ({
        ...prev,
        [currentMedia.id]: time
      }));
      setCurrentTime(time);
    }
  };

  const getPlaybackPosition = (): number => {
    if (currentMedia) {
      return playbackPositions[currentMedia.id] || 0;
    }
    return 0;
  };

  const skipForward = () => {
    console.log('Context: skipForward called');
    window.dispatchEvent(new CustomEvent(SKIP_FORWARD_EVENT));
  };

  const skipBackward = () => {
    console.log('Context: skipBackward called');
    window.dispatchEvent(new CustomEvent(SKIP_BACKWARD_EVENT));
  };

  return (
    <PlayerContext.Provider value={{
      currentMedia,
      currentSermon,
      isPlaying,
      setCurrentMedia,
      setCurrentSermon,
      setIsPlaying,
      togglePlay,
      sourcePage,
      setSourcePage,
      currentTime,
      setCurrentTime,
      savePlaybackPosition,
      getPlaybackPosition,
      skipForward,
      skipBackward
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};