import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { IconButton } from '../../components/ui';
import { useContent } from '../../data/appConfig';
import { liveFor, localized } from '../../domain/appConfig';
import { useSession } from '../../data/session';
import { useAnnouncements } from '../../data/announcements';

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
  const country = useSession((s) => s.profile?.country);
  const [hidden, setHidden] = useState<string[]>([]);
  const now = Date.now();
  const list = content.banners.filter((b) => liveFor(b, now, country) && !hidden.includes(b.id) && !seen(b.id) && localized(b.title, i18n.language));
  if (!list.length) return null;
  return (
    <>
      {list.map((b) => {
        const label = localized(b.linkLabel, i18n.language);
        const internal = b.linkUrl?.startsWith('/');
        return (
          <aside key={b.id} id={`banner-${b.id}`} className="card-enter flex items-start gap-3 rounded-card border border-card-border bg-surface p-4 shadow-card md:col-span-12">
            {b.imageUrl && <img src={b.imageUrl} alt="" loading="lazy" decoding="async" className="h-16 w-24 shrink-0 rounded-input object-cover" />}
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

/** Admin announcements (Notifications, Announcements) shown on Home to the targeted members; dismissible. */
export function Announcements() {
  const { t, i18n } = useTranslation();
  const list = useAnnouncements();
  const [hidden, setHidden] = useState<string[]>([]);
  const shown = list.filter((a) => !hidden.includes(a.id) && !seen(`a-${a.id}`) && localized(a.title, i18n.language));
  if (!shown.length) return null;
  return (
    <>
      {shown.map((a) => (
        <aside key={a.id} id={`announcement-${a.id}`} className="card-enter flex items-start gap-3 rounded-card border border-card-border bg-primary-subtle p-4 md:col-span-12">
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-ink">{localized(a.title, i18n.language)}</p>
            <p className="text-small text-ink">{localized(a.body, i18n.language)}</p>
          </div>
          <IconButton
            label={t('common.close')}
            onClick={() => {
              try {
                localStorage.setItem(`${KEY}a-${a.id}`, '1');
              } catch {
                /* per-device convenience only */
              }
              setHidden((h) => [...h, a.id]);
            }}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </IconButton>
        </aside>
      ))}
    </>
  );
}

/** One promotional ribbon across the top (newest live one for this country). */
export function PromoRibbon() {
  const { i18n } = useTranslation();
  const content = useContent();
  const country = useSession((s) => s.profile?.country);
  const r = [...content.ribbons].reverse().find((x) => liveFor(x, Date.now(), country) && localized(x.text, i18n.language));
  if (!r) return null;
  const text = localized(r.text, i18n.language);
  const cls = 'block w-full bg-primary px-4 py-2 text-center text-small font-semibold text-on-primary';
  if (!r.linkUrl) return <div className={cls} id="promo-ribbon">{text}</div>;
  return r.linkUrl.startsWith('/') ? (
    <Link to={r.linkUrl} className={cls} id="promo-ribbon">
      {text}
    </Link>
  ) : (
    <a href={r.linkUrl} target="_blank" rel="noopener noreferrer" className={cls} id="promo-ribbon">
      {text}
    </a>
  );
}
