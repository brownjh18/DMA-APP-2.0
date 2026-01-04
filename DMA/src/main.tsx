import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LoadingAnimation from './components/LoadingAnimation';

const container = document.getElementById('root');
const root = createRoot(container!);

const MainApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time or wait for app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loading animation for at least 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.StrictMode>
      {isLoading ? <LoadingAnimation /> : <App />}
    </React.StrictMode>
  );
};

root.render(<MainApp />);