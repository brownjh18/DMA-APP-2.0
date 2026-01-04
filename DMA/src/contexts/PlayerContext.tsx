import React, { createContext, useContext, useState, ReactNode } from 'react';
import { isPodcast } from '../utils/mediaUtils';

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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [sourcePage, setSourcePage] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);

  // Store playback positions per media item
  const [playbackPositions, setPlaybackPositions] = useState<Record<string, number>>({});

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
      getPlaybackPosition
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