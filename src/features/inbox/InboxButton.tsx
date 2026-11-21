import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trash2 } from 'lucide-react';
import { EmptyState, IconButton, Sheet } from '../../components/ui';
import { localized } from '../../domain/appConfig';
import { markRead, removeInboxItem, useInbox } from '../../data/inbox';
import { useSession } from '../../data/session';
import { useFormat } from '../../lib/hooks';

/** Header bell: messages from FitMe (admin notifications, support replies, free-period reminders). */
export function InboxButton() {
  const { t, i18n } = useTranslation();
  const { dateTime } = useFormat();
  const uid = useSession((s) => s.user?.uid);
  const items = useInbox();
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.readAt).length;
  if (!uid || !items.length) return null;
  return (
    <>
      <button
        type="button"
        id="inbox-button"
        onClick={() => {
          setOpen(true);
          for (const i of items) if (!i.readAt) void markRead(uid, i.id).catch(() => undefined);
        }}
        aria-label={unread ? t('inbox.titleUnread', { count: unread }) : t('inbox.title')}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 && <span className="absolute end-2 top-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" aria-hidden />}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} closeLabel={t('common.close')} title={t('inbox.title')}>
        {items.length === 0 ? (
          <EmptyState title={t('inbox.empty')} />
        ) : (
          <ul className="flex flex-col divide-y divide-line" id="inbox-list">
            {items.map((i) => (
              <li key={i.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-ink">{localized(i.title, i18n.language) ?? 'FitMe'}</p>
                  <p className="whitespace-pre-wrap text-small text-ink">{localized(i.body, i18n.language)}</p>
                  {i.createdAt && <p className="text-caption text-muted">{dateTime(i.createdAt)}</p>}
                </div>
                <IconButton label={t('inbox.delete')} onClick={() => void removeInboxItem(uid, i.id)}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
