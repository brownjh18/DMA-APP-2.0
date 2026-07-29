import { MediaItem, Podcast } from '../contexts/PlayerContext';

export const isPodcast = (item: MediaItem): item is Podcast => {
  return 'audioUrl' in item;
};

export const parseDurationToSeconds = (duration: string): number => {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(duration) || 0;
};

export const formatRemainingTime = (remaining: number): string => {
  if (remaining <= 0) return '';
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = Math.floor(remaining % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} remaining`;
  return `${m}:${String(s).padStart(2, '0')} remaining`;
};