import React, { useContext, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { menu, homeOutline, playCircleOutline, bookOutline, add, radio } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { BACKEND_BASE_URL } from '../services/api';

interface BottomNavBarProps {
  onSidebarToggle: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onSidebarToggle }) => {
  const history = useHistory();
  const location = useLocation();
  const { isAdmin, user } = useContext(AuthContext);
  const [shineContainer, setShineContainer] = useState<string | null>(null);

  // Enhanced theme colors using CSS variables for instant updates
  const theme = {
    background: 'rgba(var(--ion-background-color-rgb), 0.95)',
    text: 'var(--ion-text-color)',
    active: 'var(--ion-color-primary)',
    primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'var(--ion-color-step-100, rgba(0, 0, 0, 0.08))',
    shadow: 'var(--ion-box-shadow, 0 -8px 32px rgba(0, 0, 0, 0.12))',
  };

  // Determine active based on current path
  const getActive = () => {
    switch (location.pathname) {
      case '/tab1': return 'home';
      case '/tab2': return 'sermons';
      case '/tab4': return 'radio';
      case '/tab3': return 'devotions';
      default: return 'home';
    }
  };
  const active = getActive();

  const navigationItems = [
    { name: 'sidebar', label: 'Menu', icon: menu, path: null, action: 'sidebar' },
    { name: 'home', label: 'Home', icon: homeOutline, path: '/tab1', action: 'nav' },
    { name: 'sermons', label: 'Sermons', icon: playCircleOutline, path: '/tab2', action: 'nav' },
    { name: 'radio', label: 'Radio', icon: radio, path: '/tab4', action: 'nav' },
    { name: 'devotions', label: 'Devotions', icon: bookOutline, path: '/tab3', action: 'nav' },
  ];

  const handlePress = (item: any) => {
    if (item.action === 'sidebar') {
      onSidebarToggle();
      setShineContainer(item.name);
    } else if (item.path) {
      history.push(item.path);
      setShineContainer(item.name);
    }
    setTimeout(() => setShineContainer(null), 1000);
  };

  return (
    <>
      <style>{`
        /* Bottom Nav Bar - Instant dark/light mode response */
        .bottom-nav-bar {
          border-top: 1px solid var(--ion-color-step-100, rgba(0, 0, 0, 0.08));
          box-shadow: var(--ion-box-shadow, 0 -8px 32px rgba(0, 0, 0, 0.12));
        }
        @media (prefers-color-scheme: dark) {
          .bottom-nav-bar {
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(0, 0, 0, 0.3) !important;
          }
        }
        @keyframes iconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes iconGlow {
          0% { 
            filter: drop-shadow(0 0 4px rgba(102, 126, 234, 0.4));
          }
          50% { 
            filter: drop-shadow(0 0 12px rgba(102, 126, 234, 0.8)) drop-shadow(0 0 24px rgba(102, 126, 234, 0.4));
          }
          100% { 
            filter: drop-shadow(0 0 4px rgba(102, 126, 234, 0.4));
          }
        }
        .nav-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 50%;
          padding: 12px;
          position: relative;
        }
        .nav-icon:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.05);
        }
        .nav-icon.active {
          animation: iconPulse 2s infinite;
        }
        .nav-icon.active .icon-element {
          animation: iconGlow 3s infinite;
        }
      `}</style>
      
      {/* Icon-Only Navigation Bar */}
      <div className="bottom-nav-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: window.innerWidth <= 576 ? '80px' : '90px',
        background: 'transparent',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: window.innerWidth <= 576 ? '10px' : '12px',
        padding: window.innerWidth <= 576 ? '0px 19px 8px 19px' : '8px 29px 3px 29px',
      }}>
        {navigationItems.map((item, index) => {
          const isActive = item.action === 'nav' ? active === item.name : shineContainer === item.name;
          
          return (
            <div
              key={item.name}
              className={`nav-icon ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: window.innerWidth <= 576 ? '0 0.25px' : '0 0.5px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => handlePress(item)}
            >
              <div className="icon-element" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: window.innerWidth <= 576 ? '48px' : '56px',
                height: window.innerWidth <= 576 ? '48px' : '56px',
                borderRadius: '50%',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                  : 'transparent',
                border: isActive
                  ? '2px solid rgba(102, 126, 234, 0.4)'
                  : '2px solid transparent',
                transition: 'all 0.3s ease',
              }}>
                <IonIcon
                  icon={item.icon}
                  style={{
                    fontSize: window.innerWidth <= 576 ? '22px' : '24px',
                    color: isActive
                      ? '#667eea'
                      : theme.text,
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default BottomNavBar;