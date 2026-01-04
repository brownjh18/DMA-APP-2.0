import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

/**
 * Custom hook for tracking navigation history and providing smart back navigation
 * Stores the previous route so back button always knows where to go
 */
export const useNavigation = () => {
  const history = useHistory();
  const location = useLocation();
  const previousPathRef = useRef<string>('/tab1');
  const pathHistoryRef = useRef<string[]>(['/tab1']);

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't add duplicate consecutive paths
    if (pathHistoryRef.current[pathHistoryRef.current.length - 1] !== currentPath) {
      previousPathRef.current = pathHistoryRef.current[pathHistoryRef.current.length - 1];
      pathHistoryRef.current.push(currentPath);
      
      // Keep history to reasonable size (prevent memory leak)
      if (pathHistoryRef.current.length > 50) {
        pathHistoryRef.current.shift();
      }
    }
  }, [location.pathname]);

  return {
    /**
     * Get the previous route in navigation history
     * @param defaultPath - Fallback path if no previous route available
     */
    getPreviousPath: (defaultPath: string = '/tab1'): string => {
      const path = previousPathRef.current;
      return path && path !== location.pathname ? path : defaultPath;
    },

    /**
     * Navigate to previous page with fallback
     * @param defaultPath - Fallback path if no previous route available
     */
    goBack: (defaultPath: string = '/tab1') => {
      const previousPath = previousPathRef.current;
      
      if (previousPath && previousPath !== location.pathname) {
        history.push(previousPath);
      } else {
        history.push(defaultPath);
      }
    },

    /**
     * Navigate forward to a specific path
     */
    navigate: (path: string) => {
      history.push(path);
    },

    /**
     * Replace current route (no history entry)
     */
    replace: (path: string) => {
      history.replace(path);
    },

    /**
     * Get full navigation history (useful for debugging)
     */
    getHistory: () => [...pathHistoryRef.current],

    /**
     * Clear history and reset to initial state
     */
    resetHistory: () => {
      pathHistoryRef.current = ['/tab1'];
      previousPathRef.current = '/tab1';
    },

    /**
     * Get current path
     */
    currentPath: location.pathname
  };
};
