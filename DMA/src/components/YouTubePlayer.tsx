// @ts-nocheck
import React, { useState } from 'react';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  mini?: boolean;
  miniWidth?: number;
  miniHeight?: number;
  fullScreen?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title,
  playing = true,
  onPlay,
  onPause,
  mini = false,
  miniWidth = 40,
  miniHeight = 40,
  fullScreen = false
}) => {
  const [showFallback, setShowFallback] = useState(false);

  // Extract YouTube video ID and create embed URL
  const getYouTubeEmbedUrl = (videoUrl: string): string => {
    if (!videoUrl) return '';

    let videoId = '';

    // Handle different YouTube URL formats
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0]?.split('?')[0] || '';
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtube.com/live/')) {
      videoId = videoUrl.split('live/')[1]?.split('?')[0]?.split('&')[0] || '';
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return videoUrl;
  };

  const containerStyle = fullScreen ? {
    width: '100%',
    height: '100%',
    position: 'relative' as const
  } : {
    width: '100%',
    maxWidth: '100%',
    position: 'relative' as const,
    paddingBottom: '56.25%', // 16:9 aspect ratio
    height: 0,
    backgroundColor: 'var(--ion-background-color)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  };

  const playerStyle = fullScreen ? {
    width: '100%',
    height: '100%',
    borderRadius: '8px'
  } : {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '8px'
  };

  if (mini) {
    if (showFallback) {
      return (
        <div
          style={{
            width: `${miniWidth}px`,
            height: `${miniHeight}px`,
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '1.5em',
            cursor: 'pointer',
            backgroundColor: '#333'
          }}
          onClick={() => {
            if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
              window.open(url, '_system');
            } else {
              window.location.href = url;
            }
          }}
        >
          ▶️
        </div>
      );
    }

    return (
      <div style={{
        width: `${miniWidth}px`,
        height: `${miniHeight}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000'
      }}>
        <iframe
          key={`mini-youtube-${url}-${Date.now()}`}
          src={`${getYouTubeEmbedUrl(url)}?autoplay=${playing ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&mute=1`}
          width="100%"
          height="100%"
          style={{ borderRadius: '10px', border: 'none' }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => console.log('Mini YouTube iframe loaded:', url)}
          onError={() => {
            console.log('Mini YouTube iframe error, showing fallback');
            setShowFallback(true);
          }}
        />
      </div>
    );
  }

  if (showFallback) {
    return (
      <div style={{
        ...playerStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '3em', marginBottom: '16px' }}>🎥</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2em' }}>
          Video Unavailable
        </h3>
        <p style={{ margin: '0 0 20px 0', opacity: 0.8, fontSize: '0.9em' }}>
          This YouTube video cannot be embedded.
        </p>
        <button
          onClick={() => {
            if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
              window.open(url, '_system');
            } else {
              window.location.href = url;
            }
          }}
          style={{
            backgroundColor: '#ff0000',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ▶️ Watch on YouTube
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <iframe
        key={`youtube-${url}-${Date.now()}`}
        src={`${getYouTubeEmbedUrl(url)}?autoplay=${playing ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`}
        width="100%"
        height="100%"
        style={playerStyle}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => console.log('YouTube iframe loaded:', url)}
        onError={() => {
          console.log('YouTube iframe error, showing fallback');
          setShowFallback(true);
        }}
      />
    </div>
  );
};

export default YouTubePlayer;