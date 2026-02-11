// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { BACKEND_BASE_URL } from '../services/api';
import YouTubePlayer from './YouTubePlayer';

interface VideoPlayerProps {
  url: string;
  title?: string;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  mini?: boolean;
  miniWidth?: number;
  miniHeight?: number;
  fullScreen?: boolean;
  muted?: boolean;
  startTime?: number;
  onTimeUpdate?: (time: number) => void;
  thumbnailUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  playing = true,
  onPlay,
  onPause,
  mini = false,
  miniWidth = 40,
  miniHeight = 40,
  fullScreen = false,
  startTime = 0,
  onTimeUpdate,
  thumbnailUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine video type and source
  const isLocalVideo = url && url.startsWith('/uploads/');
  const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isExternal = !isLocalVideo && (isYouTube || url?.includes('http'));


  // Reset loading state when URL changes
  useEffect(() => {
    console.log('URL changed, resetting loading state for:', url);
    setIsLoading(!isExternal); // Don't show loading for external videos
    setShowFallback(false);
    setError(null);
  }, [url, isExternal]);

  // Auto-stop loading after 30 seconds as fallback
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, stopping loading state');
      setIsLoading(false);
      setError('Video loading timeout');
      setShowFallback(true);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  console.log('VideoPlayer:', {
    url,
    isLocalVideo,
    isYouTube,
    isExternal,
    playing,
    showFallback,
    isLoading,
    error
  });

  // Additional logging for debugging
  console.log('VideoPlayer render - fullScreen:', fullScreen, 'mini:', mini);


  // Handle local video playback
  useEffect(() => {
    if (isLocalVideo && videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(e => {
          console.log('Local video play failed:', e);
          setError('Failed to play video');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing, isLocalVideo]);

  // Seek to startTime for local videos
  const handleLoadedData = () => {
    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
    setIsLoading(false);
  };

  // Handle time updates for local videos
  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  // Render mini player
  if (mini) {
    return (
      <div style={{
        width: `${miniWidth}px`,
        height: `${miniHeight}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000'
      }}>
        {isExternal ? (
          isYouTube ? (
            <YouTubePlayer
              url={url}
              playing={playing}
              onPlay={onPlay}
              onPause={onPause}
              mini={true}
              miniWidth={miniWidth}
              miniHeight={miniHeight}
            />
          ) : (
            // Fallback for non-YouTube external videos
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
          )
        ) : (
          // HTML5 video for local files
          <video
            ref={videoRef}
            src={isLocalVideo ? `${BACKEND_BASE_URL}${url}` : url}
            autoPlay={playing}
            muted
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '10px'
            }}
            onPlay={onPlay}
            onPause={onPause}
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onError={() => {
              console.error('Mini local video error');
              setIsLoading(false);
              setError('Failed to load video');
            }}
          />
        )}
      </div>
    );
  }

  // Main player container
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

  return (
    <div style={containerStyle}>
      {isLoading && !showFallback && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '1.2em',
          zIndex: 10
        }}>
          Loading video...
        </div>
      )}

      {showFallback ? (
        // Fallback UI
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
            {error || 'Video Unavailable'}
          </h3>
          <p style={{ margin: '0 0 20px 0', opacity: 0.8, fontSize: '0.9em' }}>
            {isExternal ? 'This video is hosted externally.' : 'Unable to play this video.'}
          </p>
          {isExternal && (
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
              ▶️ {isYouTube ? 'Watch on YouTube' : 'Open Video'}
            </button>
          )}
        </div>
      ) : isExternal ? (
        isYouTube ? (
          <YouTubePlayer
            url={url}
            playing={playing}
            onPlay={onPlay}
            onPause={onPause}
            fullScreen={fullScreen}
          />
        ) : (
          // Fallback for non-YouTube external videos
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
              This video is hosted externally.
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
              ▶️ Open Video
            </button>
          </div>
        )
      ) : (
        // HTML5 video for local files
        <video
          ref={videoRef}
          key={`local-${url}`} // Force re-mount when URL changes
          src={isLocalVideo ? `${BACKEND_BASE_URL}${url}` : url}
          poster={thumbnailUrl}
          controls
          muted
          crossOrigin="anonymous"
          style={{
            ...playerStyle,
            objectFit: 'contain'
          }}
          onPlay={onPlay}
          onPause={onPause}
          onLoadStart={() => console.log('Local video loading:', url)}
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onCanPlay={() => { setIsLoading(false); if (playing) videoRef.current?.play(); }}
          onError={() => {
            console.error('Local video error');
            setIsLoading(false);
            setError('Failed to load video');
            setShowFallback(true);
          }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;