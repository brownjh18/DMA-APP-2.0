// @ts-nocheck
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import { close, play, pause } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import { useLocation, useHistory } from 'react-router-dom';
import { isPodcast } from '../utils/mediaUtils';
import VideoPlayer from './VideoPlayer';
import { BACKEND_BASE_URL } from '../services/api';

const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url || '';
};

const getThumbnailUrl = (sermon: any) => {
  if (sermon.thumbnailUrl) {
    const url = sermon.thumbnailUrl;
    if (url.startsWith('/uploads')) return `${BACKEND_BASE_URL}${url}`;
    if (url.startsWith('http')) return url;
    return url;
  }
  const videoUrl = sermon.videoUrl || sermon.streamUrl || '';
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoUrl.includes('live/')) {
      videoId = videoUrl.split('live/')[1]?.split('?')[0];
    } else if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    }
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return '/Bible.JPG';
};

const SermonMiniPlayer: React.FC = () => {
  const { currentMedia, isPlaying, setIsPlaying, savePlaybackPosition, getPlaybackPosition, clearPlayer } = usePlayer();
  const location = useLocation();
  const history = useHistory();

  // Memoize startTime so YouTube iframe src doesn't change mid-playback
  const savedStartTime = useMemo(() => getPlaybackPosition(), [currentMedia?.id]);

  // Stable callback
  const stableOnTimeUpdate = useCallback((time: number) => {
    savePlaybackPosition(time);
  }, []);

  // Only show for sermons (not podcasts), not on Tab2, and not on the full sermon player page
  const isSermon = currentMedia && !isPodcast(currentMedia);
  const isOnTab2 = location.pathname === '/tab2' || location.pathname.startsWith('/tab2');
  const isOnFullSermonPage = location.pathname === '/sermon-player';
  const show = isSermon && isPlaying && !isOnTab2 && !isOnFullSermonPage;

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes sermonMiniSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
      className="sermon-mini-player-global"
      onClick={() => {
        if (currentMedia?.id) {
          history.push(`/sermon-player?id=${encodeURIComponent(currentMedia.id)}`);
        } else {
          history.push('/sermon-player');
        }
      }}
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '10px',
        width: '200px',
        borderRadius: '12px',
        overflow: 'hidden',
        zIndex: 9998,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#000',
        animation: 'sermonMiniSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <VideoPlayer
        key={`global-mini-${currentMedia.id}`}
        url={getFullUrl((currentMedia as any).videoUrl || (currentMedia as any).streamUrl || '')}
        title={currentMedia.title}
        playing={isPlaying}
        mini={true}
        miniWidth={200}
        miniHeight={112}
        startTime={savedStartTime}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={stableOnTimeUpdate}
      />
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        padding: '20px 8px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <IonIcon icon={isPlaying ? pause : play} style={{ fontSize: '12px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: '600',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.3',
          }}>
            {currentMedia.title}
          </p>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            clearPlayer();
          }}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <IonIcon icon={close} style={{ fontSize: '12px', color: '#fff' }} />
        </div>
      </div>
      </div>
    </>
  );
};

export default SermonMiniPlayer;
