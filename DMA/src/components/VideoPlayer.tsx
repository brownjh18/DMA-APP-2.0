// @ts-nocheck
import React from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  url: string;
  title?: string;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  mini?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, playing = true, onPlay, onPause, mini = false }) => {
  if (mini) {
    return (
      <div style={{
        width: '100%',
        height: '60px',
        backgroundColor: 'var(--ion-background-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center'
      }}>
        // @ts-ignore
        <ReactPlayer
          url={url}
          playing={playing}
          controls={true}
          width={300}
          height={180}
          style={{ borderRadius: '8px 0 0 8px' }}
          onPlay={onPlay}
          onPause={onPause}
        />
        <div style={{ flex: 1, padding: '8px', fontSize: '0.9em', fontWeight: '500' }}>
          {title}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      backgroundColor: 'var(--ion-background-color)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${url.split('v=')[1]}?autoplay=1&rel=0`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            border: 'none'
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoPlayer;