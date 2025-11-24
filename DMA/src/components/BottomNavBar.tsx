import React, { useContext, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { menu, homeOutline, playCircleOutline, bookOutline, add } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

interface BottomNavBarProps {
  onSidebarToggle: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onSidebarToggle }) => {
  const history = useHistory();
  const location = useLocation();
  const { isAdmin } = useContext(AuthContext);
  const [shineContainer, setShineContainer] = useState<string | null>(null);

  // Determine active based on current path
  const getActive = () => {
    switch (location.pathname) {
      case '/tab1': return 'home';
      case '/admin': return 'upload';
      case '/tab2': return 'sermons';
      case '/tab3': return 'devotions';
      default: return 'home';
    }
  };
  const active = getActive();

  // Use CSS variables for theming
  const theme = {
    background: 'rgba(var(--ion-background-color-rgb), 0.95)',
    text: 'var(--ion-text-color)',
    active: 'var(--ion-color-primary)',
  };

  // Dark frost 3D glassy design for both modes
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const frostedGlassStyle = isDarkMode ? {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1))',
    backdropFilter: 'blur(150px) saturate(350%) brightness(0.9) contrast(1.2)',
    WebkitBackdropFilter: 'blur(150px) saturate(350%) brightness(0.9) contrast(1.2)',
    border: '1px solid rgba(0, 0, 0, 0.3)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.6), 0 0 50px rgba(0, 0, 0, 0.4)',
    transform: 'translateZ(0)',
    transition: 'all 0.3s ease',
  } : {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.07))',
    backdropFilter: 'blur(150px) saturate(300%) brightness(0.95) contrast(1.1)',
    WebkitBackdropFilter: 'blur(150px) saturate(300%) brightness(0.95) contrast(1.1)',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 50px rgba(0, 0, 0, 0.2)',
    transform: 'translateZ(0)',
    transition: 'all 0.3s ease',
  };

  const sidebarItem = { name: 'sidebar', label: '', icon: menu };
  const primaryNavItems = [
    { name: 'home', label: 'Home', icon: homeOutline, path: '/tab1' },
    { name: 'sermons', label: 'Sermons', icon: playCircleOutline, path: '/tab2' },
    { name: 'devotions', label: 'Devotions', icon: bookOutline, path: '/tab3' },
  ];
  const uploadItem = isAdmin ? { name: 'upload', label: 'Upload', icon: add, path: '/admin' } : null;

  const handlePress = (item: any) => {
    if (item.name === 'sidebar') {
      onSidebarToggle();
      setShineContainer('sidebar');
    } else if (item.path) {
      history.push(item.path);
      if (item.name === 'upload') {
        setShineContainer('upload');
      } else {
        setShineContainer('primary');
      }
    }
    setTimeout(() => setShineContainer(null), 1000);
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes reflect {
          0% { filter: drop-shadow(0 0 0px rgba(0,123,255,0)); }
          50% { filter: drop-shadow(0 0 10px rgba(0,123,255,0.5)); }
          100% { filter: drop-shadow(0 0 0px rgba(0,123,255,0)); }
        }
        @keyframes snake {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
      {/* Sidebar */}
      <div style={{
        position: 'absolute',
        bottom: window.innerWidth <= 576 ? 10 : 20,
        left: window.innerWidth <= 576 ? 10 : 20,
        height: window.innerWidth <= 576 ? 55 : 70,
        borderRadius: window.innerWidth <= 576 ? 30 : 40,
        padding: window.innerWidth <= 576 ? 13 : 14,
        zIndex: 999,
        ...frostedGlassStyle,
      }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            marginTop: 0,
          }}
          onClick={() => handlePress(sidebarItem)}
        >
          <IonIcon
            icon={sidebarItem.icon}
            style={{
              fontSize: '29px',
              color: theme.text,
            }}
          />
        </div>
        {shineContainer === 'sidebar' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              borderRadius: 'inherit',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, white, transparent)',
                animation: 'snake 1s ease-out',
              }}
            />
          </div>
        )}
      </div>

      {/* Primary Navigations */}
      <div style={{
        position: 'absolute',
        bottom: window.innerWidth <= 576 ? 10 : 20,
        ...(isAdmin ? {
          left: '22%',
          transform: 'translateX(-50%)',
          width: window.innerWidth <= 576 ? 204 : 300,
        } : {
          right: window.innerWidth <= 576 ? 10 : 20,
          width: window.innerWidth <= 576 ? '75%' : '65%',
        }),
        height: window.innerWidth <= 576 ? 55 : 70,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        borderRadius: window.innerWidth <= 576 ? 30 : 40,
        paddingTop: window.innerWidth <= 576 ? 8 : 10,
        paddingBottom: window.innerWidth <= 576 ? 8 : 10,
        paddingLeft: window.innerWidth <= 576 ? 3 : 5,
        paddingRight: window.innerWidth <= 576 ? 3 : 5,
        zIndex: 999,
        ...frostedGlassStyle,
      }}>
        {primaryNavItems.map((item) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => handlePress(item)}
          >
            <IonIcon
              icon={item.icon}
              style={{
                fontSize: '22px',
                color: active === item.name ? theme.active : theme.text,
                animation: active === item.name ? 'pulse 1s infinite, reflect 2s infinite' : 'none',
              }}
            />
            {item.label ? (
              <span style={{
                fontSize: 11,
                marginTop: 1.5,
                color: active === item.name ? theme.active : theme.text,
              }}>
                {item.label}
              </span>
            ) : null}
          </div>
        ))}
        {shineContainer === 'primary' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              borderRadius: 'inherit',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                animation: 'snake 1s ease-out',
              }}
            />
          </div>
        )}
      </div>

      {/* Upload Navigation */}
      {uploadItem && (
        <div style={{
          position: 'absolute',
          bottom: window.innerWidth <= 576 ? 10 : 20,
          right: window.innerWidth <= 576 ? 10 : 20,
          height: window.innerWidth <= 576 ? 55 : 70,
          borderRadius: window.innerWidth <= 576 ? 30 : 40,
          padding: window.innerWidth <= 576 ? 10 : 10,
          zIndex: 999,
          ...frostedGlassStyle,
        }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              marginTop: -8,
            }}
            onClick={() => handlePress(uploadItem)}
          >
            <IonIcon
              icon={uploadItem.icon}
              style={{
                fontSize: '28px',
                color: active === uploadItem.name ? theme.active : theme.text,
                animation: active === uploadItem.name ? 'pulse 1s infinite, reflect 2s infinite' : 'none',
              }}
            />
            {uploadItem.label ? (
              <span style={{
                fontSize: 11,
                marginTop: 1.5,
                color: active === uploadItem.name ? theme.active : theme.text,
              }}>
                {uploadItem.label}
              </span>
            ) : null}
          </div>
          {shineContainer === 'upload' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                borderRadius: 'inherit',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  animation: 'snake 1s ease-out',
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BottomNavBar;