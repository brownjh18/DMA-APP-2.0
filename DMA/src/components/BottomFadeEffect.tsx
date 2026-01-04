import React from 'react';

const BottomFadeEffect: React.FC = () => {
  // Calculate the height for the fade effect - from bottom to midway up the nav bar
  const navBarHeight = window.innerWidth <= 576 ? 55 : 70; // Match BottomNavBar height
  const navBarBottom = window.innerWidth <= 576 ? 15 : 30; // Match BottomNavBar bottom position
  const fullNavBarTop = navBarBottom + navBarHeight; // Top of nav bar from bottom
  const totalHeight = fullNavBarTop; // Effect extends from bottom to top of nav bar

  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${totalHeight}px`,
        background: isDarkMode
          ? 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.97) 15%, rgba(0, 0, 0, 0.95) 30%,rgba(0, 0, 0, 0.90) 45%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0.05) 75%, transparent 100%)'
          : 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.97) 15%, rgba(255, 255, 255, 0.95) 30%, rgba(255, 255, 255, 0.90) 45%, rgba(255, 255, 255, 0.6) 60%,rgba(255, 255, 255, 0.05) 75%, transparent 100%)',
        zIndex: 998, // Behind BottomNavBar (which is 999)
        pointerEvents: 'none', // Allow interactions through the effect
      }}
    />
  );
};

export default BottomFadeEffect;