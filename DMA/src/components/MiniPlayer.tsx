import React from 'react';
import {
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonProgressBar
} from '@ionic/react';
import { play, pause, playBack, playForward, close } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import { useHistory, useLocation } from 'react-router-dom';

// Helper function to parse duration string like "5:30" or "1:05:30" to seconds
const parseDurationToSeconds = (duration: string): number => {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else {
    seconds = Number(duration) || 0;
  }
  return seconds;
};

const MiniPlayer: React.FC = () => {
  const { currentMedia, isPlaying, setIsPlaying, getPlaybackPosition, skipForward, skipBackward, currentTime, setCurrentMedia } = usePlayer();
  const history = useHistory();
  const location = useLocation();
  
  const podcast = currentMedia && isPodcast(currentMedia) ? currentMedia : null;
  
  // Don't show on the full podcast player pages
  const isFullPlayerPage = location.pathname === '/full-podcast-player' || location.pathname === '/podcast-player';
  
  // Only show for podcasts (not video sermons) and not on full player pages
  if (!podcast || isFullPlayerPage) {
    return null;
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('MiniPlayer: skipBackward clicked');
    skipBackward();
  };

  const handleSkipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('MiniPlayer: skipForward clicked');
    skipForward();
  };

  const handleOpenPlayer = () => {
    history.push('/full-podcast-player');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMedia(null);
    setIsPlaying(false);
  };

  // Calculate progress
  const duration = podcast ? parseDurationToSeconds(podcast.duration) : 0;
  const progress = duration ? (currentTime || getPlaybackPosition()) / duration : 0;

  return (
    <>
      <style>{`
        .mini-player-ion-icon {
          font-size: 26px !important;
          width: 26px !important;
          height: 26px !important;
        }
        .mini-player-play-icon {
          font-size: 28px !important;
          width: 28px !important;
          height: 28px !important;
        }
        .mini-player-btn {
          --border-radius: 12px;
          transition: all 0.2s ease;
        }
        .mini-player-btn:hover {
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '85px',
          left: 8,
          right: 8,
          background: 'linear-gradient(135deg, rgba(30,30,35,0.98) 0%, rgba(20,20,25,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 9999,
          padding: '8px 12px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onClick={handleOpenPlayer}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 -6px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 -4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset';
        }}
      >
        {/* Progress Bar */}
        <IonProgressBar 
          value={progress} 
          style={{ 
            height: '3px', 
            '--progress-background': 'rgba(255,255,255,0.8)',
            '--background': 'rgba(255,255,255,0.1)',
            marginBottom: '2px',
            borderRadius: '2px',
            overflow: 'hidden'
          }} 
        />
        
        {/* Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Thumbnail */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundImage: `url(${podcast.thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
          </div>
          
          {/* Title & Speaker */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{
              fontSize: '0.85em',
              fontWeight: '600',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              letterSpacing: '0.2px'
            }}>
              {podcast.title}
            </div>
            <div style={{
              fontSize: '0.7em',
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px',
              fontWeight: '400'
            }}>
              {podcast?.speaker || 'Dove Ministries Africa'}
            </div>
          </div>
          
          {/* Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {/* Rewind */}
            <IonButton
              fill="clear"
              onClick={handleSkipBackward}
              className="mini-player-btn"
              style={{
                '--color': 'rgba(255,255,255,0.75)',
                '--ripple-color': 'rgba(255,255,255,0.3)',
                width: '32px',
                height: '32px',
                '--padding-start': '0px',
                '--padding-end': '0px'
              }}
            >
              <IonIcon icon={playBack} className="mini-player-ion-icon" />
            </IonButton>
            
            {/* Play/Pause - Simple clear button */}
            <IonButton
              fill="clear"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="mini-player-btn"
              style={{
                '--color': 'rgba(255,255,255,0.9)',
                '--ripple-color': 'rgba(255,255,255,0.3)',
                width: '32px',
                height: '32px',
                '--padding-start': '0px',
                '--padding-end': '0px'
              }}
            >
              <IonIcon icon={isPlaying ? pause : play} className="mini-player-play-icon" />
            </IonButton>
            
            {/* Forward */}
            <IonButton
              fill="clear"
              onClick={handleSkipForward}
              className="mini-player-btn"
              style={{
                '--color': 'rgba(255,255,255,0.75)',
                '--ripple-color': 'rgba(255,255,255,0.3)',
                width: '32px',
                height: '32px',
                '--padding-start': '0px',
                '--padding-end': '0px'
              }}
            >
              <IonIcon icon={playForward} className="mini-player-ion-icon" />
            </IonButton>
            
            {/* Close */}
            <IonButton
              fill="clear"
              onClick={handleClose}
              className="mini-player-btn"
              style={{
                '--color': 'rgba(255,255,255,0.5)',
                '--ripple-color': 'rgba(255,255,255,0.2)',
                width: '32px',
                height: '32px',
                '--padding-start': '0px',
                '--padding-end': '0px'
              }}
            >
              <IonIcon icon={close} className="mini-player-ion-icon" />
            </IonButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default MiniPlayer;
