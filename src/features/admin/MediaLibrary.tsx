import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, EmptyState, Sheet, Skeleton, toast } from '../../components/ui';
import { storage } from '../../lib/firebase';
import { prepareImage } from '../../lib/image';
import { Field, inputCls } from './ui';

interface Item {
  name: string;
  url: string;
}

/** Images in public/media (Storage rules: public read, content editors upload). Compressed before upload. */
function useMedia() {
  const [items, setItems] = useState<Item[] | null>(null);
  const load = useCallback(async () => {
    const { ref, listAll, getDownloadURL } = await import('firebase/storage');
    const res = await listAll(ref(await storage(), 'public/media'));
    const rows = await Promise.all(res.items.map(async (i) => ({ name: i.name, url: await getDownloadURL(i) })));
    setItems(rows.sort((a, b) => b.name.localeCompare(a.name)));
  }, []);
  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);
  const upload = async (file: File) => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const img = await prepareImage(file, { maxSide: 1600, quality: 0.82 });
    const name = `${Date.now()}-${file.name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9-]/g, '-').slice(0, 40) || 'image'}.jpg`;
    const r = ref(await storage(), `public/media/${name}`);
    await uploadBytes(r, img.blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
    const url = await getDownloadURL(r);
    await load();
    return url;
  };
  const remove = async (name: string) => {
    const { ref, deleteObject } = await import('firebase/storage');
    await deleteObject(ref(await storage(), `public/media/${name}`));
    await load();
  };
  return { items, upload, remove };
}

function Grid({ items, onPick, onRemove }: { items: Item[]; onPick?: (url: string) => void; onRemove?: (name: string) => void }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState title={t('admin.media.empty')} description={t('admin.media.emptyBody')} />;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((i) => (
        <li key={i.name} className="flex flex-col gap-1.5">
          <img src={i.url} alt="" loading="lazy" decoding="async" className="aspect-video w-full rounded-input border border-line object-cover" />
          <p className="truncate text-caption text-muted">{i.name}</p>
          <div className="flex gap-1">
            {onPick && (
              <Button size="sm" variant="secondary" onClick={() => onPick(i.url)}>
                {t('admin.media.use')}
              </Button>
            )}
            {onRemove && (
              <Button size="sm" variant="ghost" onClick={() => onRemove(i.name)}>
                {t('admin.remove')}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function UploadButton({ onFile }: { onFile: (f: File) => Promise<unknown> }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          try {
            await onFile(f);
            toast(t('admin.media.uploaded'), 'success');
          } catch {
            toast(t('admin.media.failed'), 'error');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button id="media-upload" variant="secondary" loading={busy} onClick={() => input.current?.click()}>
        {t('admin.media.upload')}
      </Button>
    </>
  );
}

/** Image field for editors: pick from the library or upload a new one. */
export function MediaPicker({ label, value, onChange }: { label: string; value: string | null; onChange: (url: string | null) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const m = useMedia();
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2">
        {value && <img src={value} alt="" className="h-12 w-20 rounded-input border border-line object-cover" />}
        <input className={`${inputCls} min-w-0 flex-1`} value={value ?? ''} onChange={(e) => onChange(e.target.value.trim() || null)} placeholder="https://" />
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          {t('admin.media.choose')}
        </Button>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
            {t('admin.remove')}
          </Button>
        )}
      </div>
      <Sheet mobileFull size="lg" className="admin-touch" open={open} onClose={() => setOpen(false)} closeLabel={t('common.close')} title={t('admin.media.title')} footer={<UploadButton onFile={async (f) => onChange(await m.upload(f))} />}>
        {m.items ? (
          <Grid
            items={m.items}
            onPick={(url) => {
              onChange(url);
              setOpen(false);
            }}
          />
        ) : (
          <Skeleton className="h-40" />
        )}
      </Sheet>
    </Field>
  );
}

export default function MediaLibraryPage() {
  const { t } = useTranslation();
  const m = useMedia();
  return (
    <Card className="flex flex-col gap-4" id="admin-media">
      <CardHeader title={t('admin.media.title')} subtitle={t('admin.media.body')} action={<UploadButton onFile={m.upload} />} />
      {m.items ? <Grid items={m.items} onRemove={(n) => void m.remove(n).catch(() => toast(t('admin.media.failed'), 'error'))} /> : <Skeleton className="h-40" />}
    </Card>
  );
}
