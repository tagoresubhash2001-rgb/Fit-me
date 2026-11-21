import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { Avatar, Button, Sheet, toast } from '../../components/ui';
import { useSession } from '../../data/session';
import { MAX_PROFILE_PHOTO_BYTES, removeProfilePhoto, saveProfilePhoto } from '../../data/profilePhoto';
import { ImageInputError, pickNativePhoto, prepareImage, validateImageFile } from '../../lib/image';
import { isNative } from '../../lib/platform';

const BOX = 260;

/** Square crop with drag and zoom; the output is a 512 px JPEG (EXIF and location removed). */
function Cropper({ file, onCancel, onSaved }: { file: Blob; onCancel: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [url] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const scale = natural ? Math.max(BOX / natural.w, BOX / natural.h) * zoom : 1;
  const clamp = (o: { x: number; y: number }, s = scale) => {
    if (!natural) return o;
    const mx = Math.max(0, (natural.w * s - BOX) / 2);
    const my = Math.max(0, (natural.h * s - BOX) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };

  const save = async () => {
    if (!natural) return;
    setSaving(true);
    try {
      const size = BOX / scale;
      const x = (natural.w * scale) / 2 - BOX / 2 - off.x;
      const y = (natural.h * scale) / 2 - BOX / 2 - off.y;
      const img = await prepareImage(file, { maxSide: 512, quality: 0.85, crop: { x: x / scale, y: y / scale, size } });
      await saveProfilePhoto(img.blob);
      toast(t('photo.saved'), 'success');
      onSaved();
    } catch (e) {
      toast(t(e instanceof ImageInputError ? `photo.errors.${e.code}` : 'photo.errors.uploadFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="photo-crop"
        className="relative touch-none overflow-hidden rounded-full bg-raised select-none"
        style={{ width: BOX, height: BOX, cursor: drag.current ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setOff(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        role="img"
        aria-label={t('photo.cropArea')}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
          style={natural ? { width: natural.w * scale, height: natural.h * scale, transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))` } : { opacity: 0 }}
        />
      </div>
      <label className="flex w-full max-w-[260px] flex-col gap-1 text-small text-muted">
        {t('photo.zoom')}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => {
            const z = Number(e.target.value);
            setZoom(z);
            if (natural) setOff((o) => clamp(o, Math.max(BOX / natural.w, BOX / natural.h) * z));
          }}
          className="accent-[var(--primary)]"
        />
      </label>
      <p className="text-caption text-muted">{t('photo.cropHint')}</p>
      <div className="flex w-full gap-2">
        <Button id="photo-save" fullWidth loading={saving} disabled={!natural} onClick={() => void save()}>
          {t('photo.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

/** Profile photo: add, change or remove (camera or gallery on phones, file on desktop). */
export function ProfilePhoto() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile) as (ReturnType<typeof useSession.getState>['profile'] & { photoURL?: string | null }) | null;
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<Blob | null>(null);
  const [removing, setRemoving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const accept = (f: Blob) => {
    try {
      validateImageFile(f);
      if (f.size > 20 * 1024 * 1024) throw new ImageInputError('too_large');
      setFile(f);
    } catch (e) {
      toast(t(e instanceof ImageInputError ? `photo.errors.${e.code}` : 'photo.errors.decode_failed'), 'error');
    }
  };
  const fromNative = async (source: 'camera' | 'photos') => {
    try {
      const b = await pickNativePhoto(source);
      if (b) accept(b);
    } catch (e) {
      toast(t(e instanceof ImageInputError ? `photo.errors.${e.code}` : 'photo.errors.decode_failed'), 'error');
    }
  };

  return (
    <>
      <button
        type="button"
        id="profile-photo"
        onClick={() => setOpen(true)}
        aria-label={profile?.photoURL ? t('photo.change') : t('photo.add')}
        className="group relative shrink-0 rounded-full transition-transform duration-150 active:scale-95"
      >
        <Avatar name={profile?.name} photoURL={profile?.photoURL} size={56} />
        <span className="absolute -end-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-card-border bg-surface text-ink shadow-card">
          <Camera className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setFile(null);
        }}
        closeLabel={t('common.close')}
        title={profile?.photoURL ? t('photo.change') : t('photo.add')}
      >
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) accept(f);
          }}
        />
        {file ? (
          <Cropper
            file={file}
            onCancel={() => setFile(null)}
            onSaved={() => {
              setFile(null);
              setOpen(false);
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar name={profile?.name} photoURL={profile?.photoURL} size={120} />
            <p className="text-center text-small text-muted">{t('photo.rules', { mb: MAX_PROFILE_PHOTO_BYTES / 1024 / 1024 })}</p>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {isNative() ? (
                <>
                  <Button id="photo-camera" icon={<Camera className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void fromNative('camera')}>
                    {t('photo.takePhoto')}
                  </Button>
                  <Button variant="secondary" icon={<ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void fromNative('photos')}>
                    {t('photo.choose')}
                  </Button>
                </>
              ) : (
                <Button id="photo-choose" icon={<ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => input.current?.click()}>
                  {t('photo.choose')}
                </Button>
              )}
              {profile?.photoURL && (
                <Button
                  id="photo-remove"
                  variant="ghost"
                  loading={removing}
                  icon={<Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                  onClick={() => {
                    setRemoving(true);
                    removeProfilePhoto()
                      .then(() => toast(t('photo.removed')))
                      .catch(() => toast(t('photo.errors.uploadFailed'), 'error'))
                      .finally(() => {
                        setRemoving(false);
                        setOpen(false);
                      });
                  }}
                >
                  {t('photo.remove')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
