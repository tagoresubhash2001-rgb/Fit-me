import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type Language } from '../../domain/locale';
import { setLanguage } from '../../lib/i18n';
import { Select } from '../../components/ui';

export function LanguagePicker({ compact, onChange }: { compact?: boolean; onChange?: (l: Language) => void }) {
  const { t, i18n } = useTranslation();
  const select = (
    <Select
      aria-label={t('settings.language')}
      label={compact ? undefined : t('settings.language')}
      value={i18n.language}
      className={compact ? 'h-10 w-auto ps-9 text-small' : undefined}
      onChange={(e) => {
        const l = e.target.value as Language;
        void setLanguage(l);
        onChange?.(l);
      }}
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l} value={l}>
          {LANGUAGE_LABELS[l]}
        </option>
      ))}
    </Select>
  );
  if (!compact) return select;
  return (
    <div className="relative">
      <Languages className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
      {select}
    </div>
  );
}
