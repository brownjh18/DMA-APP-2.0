import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Sermon {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

interface PlayerContextType {
  currentSermon: Sermon | null;
  isPlaying: boolean;
  setCurrentSermon: (sermon: Sermon | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <PlayerContext.Provider value={{
      currentSermon,
      isPlaying,
      setCurrentSermon,
      setIsPlaying,
      togglePlay
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