import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme/variables.css';

console.log('🚀 Main.tsx: Starting app initialization');

// Global error handler to capture uncaught errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error captured:', { message, source, lineno, colno, error });
  if (error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
};

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

const container = document.getElementById('root');
console.log('📦 Main.tsx: Root container found:', container);
const root = createRoot(container!);

const MainApp: React.FC = () => {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

root.render(<MainApp />);