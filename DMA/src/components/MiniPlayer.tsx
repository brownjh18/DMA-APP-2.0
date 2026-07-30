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
import { BACKEND_BASE_URL } from '../services/api';
import './MiniPlayer.css';

// Helper function to resolve thumbnail URLs to full backend URLs
const resolveThumbnailUrl = (url: string) => {
  if (!url || url.trim() === '') {
    return '/bible.JPG'; // Default fallback
  }
  if (url.startsWith('/uploads/') || url.startsWith('/uploads')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  if (url.startsWith('http')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url || '/bible.JPG';
};

// Helper function to format seconds to mm:ss or hh:mm:ss
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
  const { currentMedia, isPlaying, setIsPlaying, getPlaybackPosition, skipForward, skipBackward, currentTime, setCurrentTime, clearPlayer } = usePlayer();
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
    if (podcast && podcast.id) {
      history.push(`/podcast-player?id=${encodeURIComponent(podcast.id)}`);
    } else {
      history.push('/podcast-player');
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearPlayer();
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
      `}</style>
      <div
        className="mini-player"
        onClick={handleOpenPlayer}
      >
        {/* Progress Bar with Time */}
        {!podcast.isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonProgressBar 
              value={progress} 
              className="mp-progress-bar"
              style={{ 
                flex: 1,
                height: '3px', 
                borderRadius: '2px',
                overflow: 'hidden'
              }} 
            />
            <span className="mp-time" style={{
              fontSize: '0.65em',
              fontWeight: '500',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              minWidth: '35px',
              textAlign: 'right',
              letterSpacing: '0.3px'
            }}>
              {formatTime(currentTime || getPlaybackPosition())}
            </span>
          </div>
        )}
        
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
            backgroundImage: `url(${resolveThumbnailUrl(podcast.thumbnailUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {podcast.isLive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#ff4444',
                color: 'white',
                fontSize: '0.55em',
                fontWeight: '700',
                textAlign: 'center',
                padding: '1px 0',
                letterSpacing: '0.5px'
              }}>
                LIVE
              </div>
            )}
          </div>
          
          {/* Title & Speaker */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div className="mp-title" style={{
              fontSize: '0.85em',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {podcast.isLive && (
                <span style={{
                  background: '#ff4444',
                  color: 'white',
                  fontSize: '0.65em',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  lineHeight: '1.4'
                }}>
                  LIVE
                </span>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{podcast.title}</span>
            </div>
            <div className="mp-speaker" style={{
              fontSize: '0.7em',
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
