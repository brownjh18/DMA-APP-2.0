import React from 'react';
import { IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface BackButtonProps {
  onClick?: () => void;
  style?: React.CSSProperties;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, style = {} }) => {
  const history = useHistory();
  const { isDarkMode } = useSettings();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      history.goBack();
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.8)';
      }}
      onMouseUp={(e) => {
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
          target.style.transform = 'scale(1)';
        }, 200);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        position: 'absolute',
        top: 'calc(var(--ion-safe-area-top) + 5px)',
        left: 20,
        width: 45,
        height: 45,
        borderRadius: 25,
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isDarkMode
          ? '1px solid rgba(255,255,255,0.15)'
          : '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 999,
        transition: 'transform 0.2s ease',
        ...style
      }}
    >
      <IonIcon icon={arrowBack} style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '20px' }} />
    </div>
  );
};

export default BackButton;