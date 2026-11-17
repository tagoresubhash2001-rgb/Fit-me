import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addWater } from '../features/health/waterActions';
import { useUnits } from '../features/common/useUnits';
import { useUi } from '../stores/ui.store';

/** Desktop keyboard shortcuts. Shown in the "?" help dialog. */
export const SHORTCUTS = [
  { id: 'addFood', key: 'n' },
  { id: 'addWater', key: 'w' },
  { id: 'search', key: '/' },
  { id: 'help', key: '?' },
] as const;

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function useShortcuts() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { vol } = useUnits();
  const setHelp = useUi((s) => s.setShortcutsOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (document.querySelector('[aria-modal="true"]')) return; // a dialog owns the keyboard
      const k = e.key.toLowerCase();
      if (k === 'n') {
        e.preventDefault();
        navigate('/food?add=auto');
      } else if (k === 'w') {
        e.preventDefault();
        void addWater(250, t, vol);
      } else if (e.key === '/') {
        e.preventDefault();
        const box = document.getElementById('global-search');
        if (box && box.offsetParent !== null) box.focus();
        else navigate('/food?add=auto');
      } else if (e.key === '?') {
        e.preventDefault();
        setHelp(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, t, vol, setHelp]);
}
