// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';

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
  startTime?: number;
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
  fullScreen = false,
  startTime = 0
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getYouTubeEmbedUrl = useCallback((videoUrl: string): string => {
    if (!videoUrl) return '';
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0]?.split('?')[0] || '';
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtube.com/live/')) {
      videoId = videoUrl.split('live/')[1]?.split('?')[0]?.split('&')[0] || '';
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return videoUrl;
  }, []);

  const getYouTubeVideoId = useCallback((videoUrl: string): string => {
    if (!videoUrl) return '';
    if (videoUrl.includes('youtu.be/')) return videoUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    if (videoUrl.includes('youtube.com/watch?v=')) return videoUrl.split('v=')[1]?.split('&')[0]?.split('?')[0] || '';
    if (videoUrl.includes('youtube.com/embed/')) return videoUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
    if (videoUrl.includes('youtube.com/live/')) return videoUrl.split('live/')[1]?.split('?')[0]?.split('&')[0] || '';
    return '';
  }, []);

  const videoId = getYouTubeVideoId(url);
  const embedUrl = getYouTubeEmbedUrl(url);

  const buildEmbedParams = (forMini: boolean) => {
    const params = new URLSearchParams();
    params.set('enablejsapi', '1');
    params.set('autoplay', playing ? '1' : '0');
    if (forMini) {
      params.set('mute', '1');
    }
    params.set('modestbranding', '1');
    params.set('rel', '0');
    params.set('playsinline', '1');
    params.set('iv_load_policy', '3');
    if (startTime > 0) {
      params.set('start', String(Math.floor(startTime)));
    }
    return params.toString();
  };

  const iframeSrc = `${embedUrl}?${buildEmbedParams(false)}`;
  const miniIframeSrc = `${embedUrl}?${buildEmbedParams(true)}`;

  // Control playback via YouTube iframe API when playing prop changes dynamically
  useEffect(() => {
    if (mini || !videoId || !iframeRef.current) return;
    const command = playing ? 'playVideo' : 'pauseVideo';
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: command, args: '' }),
      '*'
    );
  }, [playing, mini, videoId]);

  // Listen for YouTube postMessage errors (Error 153, etc.)
  useEffect(() => {
    if (mini || !videoId) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onError' || data.event === 'initialDelivery') {
          if (data.info && data.info.errorCode) {
            console.log('YouTube player error detected:', data.info.errorCode, data.info.reason);
            setShowFallback(true);
          }
        }
        if (data.event === 'onReady') {
          console.log('YouTube player ready');
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    // Also detect errors by checking iframe state after a delay
    const errorCheck = setTimeout(() => {
      if (iframeRef.current) {
        try {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (iframeDoc) {
            const errorEl = iframeDoc.querySelector('.ytp-error-content-wrap-reason, .ytp-error');
            if (errorEl) {
              console.log('YouTube error element detected in iframe');
              setShowFallback(true);
            }
          }
        } catch {
          // Cross-origin, can't access iframe content — that's expected
        }
      }
    }, 5000);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(errorCheck);
    };
  }, [mini, videoId]);

  // Retry loading on error
  useEffect(() => {
    if (!loadError || !videoId) return;
    const retryTimeout = setTimeout(() => {
      setLoadError(false);
      setShowFallback(false);
    }, 3000);
    return () => clearTimeout(retryTimeout);
  }, [loadError, videoId]);

  const containerStyle = fullScreen ? {
    width: '100%',
    height: '100%',
    position: 'relative' as const
  } : {
    width: '100%',
    maxWidth: '100%',
    position: 'relative' as const,
    paddingBottom: '56.25%',
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

  const openOnYouTube = () => {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  if (mini) {
    if (showFallback || loadError) {
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
          onClick={openOnYouTube}
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
          ref={iframeRef}
          key={`mini-youtube-${url}`}
          src={miniIframeSrc}
          width="100%"
          height="100%"
          style={{ borderRadius: '10px', border: 'none' }}
          frameBorder="0"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => console.log('Mini YouTube iframe loaded:', url)}
        onError={() => {
            console.log('Mini YouTube iframe error, showing fallback');
            setLoadError(true);
            setShowFallback(true);
          }}
        />
      </div>
    );
  }

  if (showFallback || loadError) {
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
          This video cannot be embedded. Watch it on YouTube instead.
        </p>
        <button
          onClick={openOnYouTube}
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
        ref={iframeRef}
        key={`youtube-${url}`}
        src={iframeSrc}
        width="100%"
        height="100%"
        style={playerStyle}
        frameBorder="0"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => console.log('YouTube iframe loaded:', url)}
        onError={() => {
          console.log('YouTube iframe error, showing fallback');
          setLoadError(true);
          setShowFallback(true);
        }}
      />
    </div>
  );
};

export default YouTubePlayer;
