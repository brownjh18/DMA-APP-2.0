import { MediaItem, Podcast } from '../contexts/PlayerContext';

export const isPodcast = (item: MediaItem): item is Podcast => {
  return 'audioUrl' in item;
};