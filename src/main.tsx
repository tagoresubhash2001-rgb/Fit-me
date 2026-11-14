import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useThemeStore } from './stores/theme.store';
import { ToastViewport } from './components/ui';

// Apply the saved theme before the first paint (light by default).
useThemeStore.getState().applyTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastViewport />
  </StrictMode>,
);
