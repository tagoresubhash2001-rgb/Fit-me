import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UpdatePrompt } from './app/UpdatePrompt';
import './index.css';
import './lib/screenshotMode';
import { useThemeStore } from './stores/theme.store';
import { ToastViewport } from './components/ui';
import { initI18n } from './lib/i18n';
import { isNative } from './lib/platform';
import { isAppPath } from './lib/appPaths';
import { installGlobalErrorHandlers } from './lib/errors';

// Apply the saved theme before the first paint (light by default).
useThemeStore.getState().applyTheme();
installGlobalErrorHandlers();

// The marketing website loads without Firebase (its few data reads import it on demand); the member app
// (native shells, /app/*) and the admin area (/admin/*) start Firebase at once.
// The prerendered page markup (website) or the splash: shown again while lazy route chunks load (no flash).
(window as Window & { __FITME_STATIC__?: string }).__FITME_STATIC__ = document.getElementById('root')?.innerHTML ?? '';
const path = window.location.pathname;
const website = !isNative() && !isAppPath(path) && !/^\/(admin|vendor)(\/|$)/.test(path);
const root = website
  ? import('./app/WebsiteApp').then((m) => m.default)
  : Promise.all([import('./app/App'), import('./lib/firebase')]).then(([m, f]) => {
      f.firebase();
      return m.default;
    });

void Promise.all([initI18n(), root]).then(([, App]) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <ToastViewport />
      <UpdatePrompt />
    </StrictMode>,
  );
});
