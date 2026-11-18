import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { UpdatePrompt } from './app/UpdatePrompt';
import './index.css';
import { useThemeStore } from './stores/theme.store';
import { ToastViewport } from './components/ui';
import { initI18n } from './lib/i18n';
import { firebase } from './lib/firebase';
import { installGlobalErrorHandlers } from './lib/errors';

// Apply the saved theme before the first paint (light by default).
useThemeStore.getState().applyTheme();
firebase();
installGlobalErrorHandlers();

void initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <ToastViewport />
      <UpdatePrompt />
    </StrictMode>,
  );
});
