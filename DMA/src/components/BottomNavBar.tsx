import React, { useContext, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { menu, homeOutline, playCircleOutline, bookOutline, add, radio } from 'ionicons/icons';
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
      case '/tab2': return 'sermons';
      case '/tab4': return 'radio';
      case '/tab3': return 'devotions';
      default: return 'home';
    }
  };
  const active = getActive();



  // Enhanced theme colors and styling
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = {
    background: 'rgba(var(--ion-background-color-rgb), 0.95)',
    text: 'var(--ion-text-color)',
    active: 'var(--ion-color-primary)',
    // Enhanced color palette
    primaryGradient: isDarkMode 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    surface: isDarkMode 
      ? 'linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
    border: isDarkMode 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.08)',
    shadow: isDarkMode
      ? '0 -8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(0, 0, 0, 0.3)'
      : '0 -8px 32px rgba(0, 0, 0, 0.12), 0 -4px 16px rgba(0, 0, 0, 0.08)',
  };

  const navigationItems = [
    { name: 'sidebar', label: 'Menu', icon: menu, path: null, action: 'sidebar' },
    { name: 'home', label: 'Home', icon: homeOutline, path: '/tab1', action: 'nav' },
    { name: 'sermons', label: 'Sermons', icon: playCircleOutline, path: '/tab2', action: 'nav' },
    { name: 'radio', label: 'Radio', icon: radio, path: '/tab4', action: 'nav' },
    { name: 'devotions', label: 'Devotions', icon: bookOutline, path: '/tab3', action: 'nav' },
  ];

  const getCurrentLabel = () => {
    const currentItem = navigationItems.find(item => 
      item.action === 'nav' ? active === item.name : shineContainer === item.name
    );
    return currentItem ? currentItem.label : '';
  };

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

  const currentLabel = getCurrentLabel();

  return (
    <>
      <style>{`
        @keyframes iconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes labelSlideIn {
          0% {
            transform: translateX(20px) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
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
        .label-container {
          position: fixed;
          bottom: 90px;
          right: 20px;
          z-index: 1000;
          pointer-events: none;
        }
        .nav-label {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: capitalize;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: labelSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
      
      {/* Icon-Only Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: window.innerWidth <= 576 ? '80px' : '90px',
        background: 'transparent',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderTop: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
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
      
      {/* Dynamic Label Display */}
      {currentLabel && (
        <div className="label-container">
          <div className="nav-label">
            {currentLabel}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavBar;