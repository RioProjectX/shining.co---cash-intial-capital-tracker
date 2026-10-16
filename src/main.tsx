import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with immediate updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available for shining.co, refreshing...');
  },
  onOfflineReady() {
    console.log('shining.co is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
