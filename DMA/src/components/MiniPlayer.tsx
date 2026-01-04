import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import { close, play, pause } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import VideoPlayer from './VideoPlayer';
import { BACKEND_BASE_URL } from '../services/api';
import './MiniPlayer.css';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  return url;
};

// Helper function to parse duration string to seconds
const parseDuration = (duration: string): number => {
  if (!duration) return 0;

  // Handle different duration formats
  const timeRegex = /(\d+):(\d+)(?::(\d+))?/;
  const match = duration.match(timeRegex);

  if (match) {
    const hours = parseInt(match[3] || '0');
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
};

const MiniPlayer: React.FC = () => {
  const { currentMedia, currentSermon, isPlaying, setIsPlaying, setCurrentMedia, setCurrentSermon, togglePlay, getPlaybackPosition, savePlaybackPosition } = usePlayer();
  const location = useLocation();
  const history = useHistory();

  // Use currentMedia if available (for podcasts), otherwise fall back to currentSermon
  const currentItem = currentMedia || currentSermon;

  // Progress bar state
  const [progress, setProgress] = useState(0);

  // Update progress bar continuously during playback
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (currentItem && currentItem.duration && isPlaying) {
      intervalId = setInterval(() => {
        const currentPos = getPlaybackPosition();
        const duration = parseDuration(currentItem.duration);
        if (duration > 0) {
          setProgress((currentPos / duration) * 100);
        }
      }, 1000); // Update every second
    } else if (currentItem && currentItem.duration) {
      // Update once when not playing
      const currentPos = getPlaybackPosition();
      const duration = parseDuration(currentItem.duration);
      if (duration > 0) {
        setProgress((currentPos / duration) * 100);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentItem, isPlaying, getPlaybackPosition]);

  // Don't show miniplayer on full player pages or if no media is playing
  if (!currentItem || location.pathname === '/podcast-player') return null;

  // On Tab2, don't show miniplayer if it's the same video being played in full
  if (location.pathname.startsWith('/tab2')) {
    const urlParams = new URLSearchParams(location.search);
    const videoId = urlParams.get('videoId');
    if (videoId && currentItem.id === videoId) return null;
  }

  const isPodcastMedia = isPodcast(currentItem);

  // Only show miniplayer for videos, not podcasts
  if (isPodcastMedia) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the tap handler
    setCurrentMedia(null);
    setCurrentSermon(null);
    setIsPlaying(false);
  };

  const handleTap = () => {
    // For sermons, navigate to tab2 with videoId
    history.push(`/tab2?videoId=${currentItem!.id}`);
  };

 return (
   <div className="mini-player" onClick={handleTap}>
     {/* Progress Bar at top */}
     <div className="mini-player-progress">
       <div className="mini-player-progress-bar" style={{ width: `${progress}%` }}></div>
     </div>

     <div className="mini-player-content">
       {/* Thumbnail */}
       <div className="mini-player-thumbnail">
         <img
           src={currentItem!.thumbnailUrl || 'https://via.placeholder.com/60x60'}
           alt={currentItem!.title}
         />
       </div>

       {/* Media Info */}
       <div className="mini-player-info">
         <div className="mini-player-title">{currentItem!.title}</div>
         <div className="mini-player-subtitle">Sermon</div>
       </div>

       {/* Controls */}
       <div className="mini-player-controls">
         <button className="mini-player-control-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
           <IonIcon icon={isPlaying ? pause : play} />
         </button>
         <button className="mini-player-close-btn" onClick={handleClose}>
           <IonIcon icon={close} />
         </button>
       </div>
     </div>
   </div>
 );
};

export default MiniPlayer;