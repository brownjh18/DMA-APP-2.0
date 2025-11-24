import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import { play, pause, close } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import VideoPlayer from './VideoPlayer';
import './MiniPlayer.css';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MiniPlayer: React.FC = () => {
  const { currentSermon, isPlaying, setIsPlaying, setCurrentSermon, togglePlay } = usePlayer();
  const location = useLocation();
  const history = useHistory();

  if (!currentSermon) return null;

  const handleClose = () => {
    setCurrentSermon(null);
    setIsPlaying(false);
  };

 return (
   <div className="mini-player">
     {/* Thumbnail */}
     <div className="mini-player-thumbnail">
       <img
         src={currentSermon.thumbnailUrl || 'https://via.placeholder.com/50x50'}
         alt={currentSermon.title}
       />
       {!isPlaying && (
         <div className="mini-player-play-overlay">
           <IonIcon icon={play} />
         </div>
       )}
     </div>

     {/* Content */}
     <div className="mini-player-content">
       <div className="mini-player-title">
         {currentSermon.title}
       </div>
       <div className="mini-player-duration">
         {currentSermon.duration || 'Live Stream'}
       </div>
     </div>

     {/* Controls */}
     <div className="mini-player-controls">
       <IonButton
         fill="clear"
         size="small"
         onClick={togglePlay}
       >
         <IonIcon icon={isPlaying ? pause : play} />
       </IonButton>
       <IonButton
         fill="clear"
         size="small"
         onClick={handleClose}
       >
         <IonIcon icon={close} />
       </IonButton>
     </div>
   </div>
 );
};

export default MiniPlayer;