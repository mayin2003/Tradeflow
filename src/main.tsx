import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Globally catch and silence 'Failed to fetch' errors to prevent browser noise
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (event.reason?.message?.includes('Failed to fetch') || event.reason?.name === 'TypeError') {
    event.preventDefault();
    console.debug('Suppressed global fetch rejection:', event.reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
