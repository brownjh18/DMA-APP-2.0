import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🚀 Main.tsx: Starting app initialization');

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