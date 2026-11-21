import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { IconButton } from '../../components/ui';
import { useContent } from '../../data/appConfig';
import { localized } from '../../domain/appConfig';

const KEY = 'fit_me_banner_dismissed_';
const seen = (id: string) => {
  try {
    return localStorage.getItem(KEY + id) === '1';
  } catch {
    return false;
  }
};

/** Admin-managed announcements on Home (appConfig/content). Only active, unexpired banners; each can be dismissed. */
export function ContentBanners() {
  const { t, i18n } = useTranslation();
  const content = useContent();
  const [hidden, setHidden] = useState<string[]>([]);
  const now = Date.now();
  const list = content.banners.filter((b) => b.active && (!b.endsAt || Date.parse(b.endsAt) > now) && !hidden.includes(b.id) && !seen(b.id) && localized(b.title, i18n.language));
  if (!list.length) return null;
  return (
    <>
      {list.map((b) => {
        const label = localized(b.linkLabel, i18n.language);
        const internal = b.linkUrl?.startsWith('/');
        return (
          <aside key={b.id} id={`banner-${b.id}`} className="card-enter flex items-start gap-3 rounded-card border border-card-border bg-surface p-4 shadow-card md:col-span-12">
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{localized(b.title, i18n.language)}</p>
              {localized(b.body, i18n.language) && <p className="text-small text-ink">{localized(b.body, i18n.language)}</p>}
              {b.linkUrl && label &&
                (internal ? (
                  <Link to={b.linkUrl} className="mt-1 inline-flex min-h-11 items-center text-small font-semibold text-primary-text hover:underline">
                    {label}
                  </Link>
                ) : (
                  <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-small font-semibold text-primary-text hover:underline">
                    {label}
                  </a>
                ))}
            </div>
            <IconButton
              label={t('common.close')}
              onClick={() => {
                try {
                  localStorage.setItem(KEY + b.id, '1');
                } catch {
                  /* per-device convenience only */
                }
                setHidden((h) => [...h, b.id]);
              }}
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
          </aside>
        );
      })}
    </>
  );
}
