import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if user prefers dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Generate random particles for background
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 8 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 15,
  }));

  return (
    <div className={`loading-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="particle-background">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="loading-content">
        <div className="sod-logo-container">
          <div className="sod-logo-background" />
          <img src="/SOD.png" alt="SOD Logo" className={`sod-logo ${isDarkMode ? 'dark-mode' : 'light-mode'}`} />
          <div className={`sod-logo-ring ${isDarkMode ? 'dark-mode' : 'light-mode'}`} />
        </div>

        <div className={`loading-text ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <span>D</span>
          <span>M</span>
          <span>A</span>
        </div>

        <div className={`progress-dots ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <div className="progress-dot" />
          <div className="progress-dot" />
          <div className="progress-dot" />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;