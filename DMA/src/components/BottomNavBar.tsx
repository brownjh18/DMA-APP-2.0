import React, { useContext, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { book, home, menu, playCircle, radio } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

interface BottomNavBarProps {
  onSidebarToggle: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onSidebarToggle }) => {
  const history = useHistory();
  const location = useLocation();
  const { isAdmin } = useContext(AuthContext);
  const [transientActive, setTransientActive] = useState<string | null>(null);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const navigationItems = useMemo(() => [
    { name: 'sidebar', label: isAdmin ? 'Admin menu' : 'Menu', icon: menu, path: null, action: 'sidebar' },
    { name: 'home', label: 'Home', icon: home, path: '/tab1', action: 'nav' },
    { name: 'sermons', label: 'Sermons', icon: playCircle, path: '/tab2', action: 'nav' },
    { name: 'radio', label: 'Radio', icon: radio, path: '/tab4', action: 'nav' },
    { name: 'devotions', label: 'Devotions', icon: book, path: '/tab3', action: 'nav' },
  ], [isAdmin]);

  const routeActive = useMemo(() => {
    switch (location.pathname) {
      case '/tab2':
      case '/sermon-player':
        return 'sermons';
      case '/tab4':
      case '/podcast-player':
      case '/full-podcast-player':
        return 'radio';
      case '/tab3':
      case '/full-devotion':
        return 'devotions';
      case '/tab1':
      default:
        return 'home';
    }
  }, [location.pathname]);

  const selectedName = transientActive || routeActive;
  const activeIndex = Math.max(0, navigationItems.findIndex((item) => item.name === selectedName));

  const startLiquidTransition = (name: string) => {
    setTransientActive(name);
    setIsFlowing(false);
    setIsSettling(false);

    requestAnimationFrame(() => {
      setIsFlowing(true);
      window.setTimeout(() => {
        setIsFlowing(false);
        setIsSettling(true);
      }, 260);
      window.setTimeout(() => {
        setIsSettling(false);
        setTransientActive(null);
      }, 620);
    });
  };

  const handlePress = (item: typeof navigationItems[number]) => {
    startLiquidTransition(item.name);

    if (item.action === 'sidebar') {
      onSidebarToggle();
      return;
    }

    if (item.path && location.pathname !== item.path) {
      history.push(item.path);
    }
  };

  return (
    <nav
      className={`bottom-nav-bar liquid-tab-bar ${isFlowing ? 'is-flowing' : ''} ${isSettling ? 'is-settling' : ''}`}
      style={{ '--active-index': activeIndex } as React.CSSProperties}
      aria-label="Primary navigation"
    >
      <span className="liquid-selection-lens" aria-hidden="true" />
      {navigationItems.map((item) => {
        const isActive = selectedName === item.name;

        return (
          <button
            key={item.name}
            type="button"
            className={`liquid-tab-button ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive && item.action === 'nav' ? 'page' : undefined}
            onClick={() => handlePress(item)}
          >
            <IonIcon icon={item.icon} className="liquid-tab-icon" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
