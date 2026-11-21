import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Camera, ImagePlus, Trash2, RotateCcw } from 'lucide-react';
import { Button, Card, Skeleton, toast } from '../../components/ui';
import { functions } from '../../lib/firebase';
import { isNative } from '../../lib/platform';
import { ImageInputError, pickNativePhoto, prepareImage, type PreparedImage } from '../../lib/image';
import { createRecord } from '../../data/records';
import { useAskPermission } from '../permissions/PermissionPrimer';
import { useSession } from '../../data/session';
import { displayName, scaleNutrients, sumNutrients, type FoodItem } from '../../domain/nutrition';
import type { MealSlot, Nutrients } from '../../domain/models';

type Range = { min: number; max: number };
interface ScanItem {
  name: string;
  localName?: string;
  portion: string;
  grams: Range;
  calories: Range;
  proteinG: Range;
  carbsG: Range;
  fatG: Range;
  fiberG: Range;
  confidence: 'low' | 'medium' | 'high';
  match: (Pick<FoodItem, 'id' | 'name' | 'names' | 'source' | 'dataset' | 'per100g' | 'servings'>) | null;
}
interface ScanResult {
  isFood: boolean;
  quality: 'good' | 'dark' | 'blurry' | 'too_far' | 'partial';
  items: ScanItem[];
}
interface Row {
  item: ScanItem;
  grams: number;
  keep: boolean;
}

const mid = (r: Range) => (r.min + r.max) / 2;

/** Nutrients for a reviewed row: database values when matched, else the AI midpoint scaled to the grams. */
export function rowNutrients(row: { item: ScanItem; grams: number }): Nutrients {
  if (row.item.match) return scaleNutrients(row.item.match.per100g, row.grams);
  const g = mid(row.item.grams) || 1;
  const f = row.grams / g;
  return {
    calories: Math.round(mid(row.item.calories) * f),
    proteinG: Math.round(mid(row.item.proteinG) * f * 10) / 10,
    carbsG: Math.round(mid(row.item.carbsG) * f * 10) / 10,
    fatG: Math.round(mid(row.item.fatG) * f * 10) / 10,
    fiberG: Math.round(mid(row.item.fiberG) * f * 10) / 10,
  };
}

const wantsWebcam = () =>
  !isNative() && typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches && !!navigator.mediaDevices?.getUserMedia;

/** Desktop webcam preview with a capture button (mobile uses the system camera instead). */
function Webcam({ onShot, onClose }: { onShot: (b: Blob) => void; onClose: (error?: 'permission_denied' | 'no_camera') => void }) {
  const { t } = useTranslation();
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().then(() => setReady(true));
        }
      })
      .catch((e: DOMException) => onClose(e?.name === 'NotAllowedError' ? 'permission_denied' : 'no_camera'));
    return () => {
      stopped = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [onClose]);
  const shoot = () => {
    const v = video.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => b && onShot(b), 'image/jpeg', 0.9);
  };
  return (
    <div className="flex flex-col gap-3">
      <video ref={video} playsInline muted aria-label={t('scan.cameraPreview')} className="aspect-[4/3] w-full rounded-card bg-ink object-cover" />
      <div className="flex gap-2">
        <Button id="scan-capture" disabled={!ready} icon={<Camera className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={shoot}>
          {t('scan.capture')}
        </Button>
        <Button variant="ghost" onClick={() => onClose()}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

export function ScanFood({ slot, date, onDone }: { slot: MealSlot; date: string; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const profile = useSession((s) => s.profile);
  const ask = useAskPermission();
  const [stage, setStage] = useState<'pick' | 'webcam' | 'working' | 'review'>('pick');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const fail = (code: string) => {
    setError(code);
    setStage('pick');
  };

  const analyse = async (file: Blob) => {
    setError(null);
    setStage('working');
    let img: PreparedImage;
    try {
      img = await prepareImage(file, { maxSide: 1280, quality: 0.8 });
    } catch (e) {
      return fail(e instanceof ImageInputError ? e.code : 'decode_failed');
    }
    setPreview(URL.createObjectURL(img.blob));
    try {
      const call = httpsCallable<object, ScanResult>(functions(), 'analyzeFoodPhoto', { timeout: 70000 });
      const r = (
        await call({
          imageBase64: img.base64,
          mimeType: img.mimeType,
          ...(profile?.country && /^[A-Z]{2}$/.test(profile.country) ? { country: profile.country } : {}),
          language: i18n.language,
        })
      ).data;
      setResult(r);
      setRows(r.items.map((item) => ({ item, grams: Math.round(mid(item.grams)), keep: true })));
      if (!r.isFood || !r.items.length) return fail('not_food');
      setStage('review');
    } catch (e) {
      const code = (e as { code?: string; message?: string })?.code ?? '';
      const msg = (e as { message?: string })?.message ?? '';
      if (code === 'functions/permission-denied') return fail('locked');
      if (code === 'functions/resource-exhausted') return fail('limit');
      if (code === 'functions/invalid-argument') return fail('unsupported_format');
      if (!navigator.onLine || /network|internal/i.test(code + msg)) return fail('offline');
      return fail('failed');
    }
  };

  const take = async () => {
    setError(null);
    if (isNative() || wantsWebcam()) {
      const cam = await ask('camera');
      if (cam === 'blocked' || cam === 'denied') return fail('permission_denied');
    }
    if (isNative()) {
      try {
        const b = await pickNativePhoto('camera');
        if (b) void analyse(b);
      } catch (e) {
        fail(e instanceof ImageInputError ? e.code : 'failed');
      }
    } else if (wantsWebcam()) setStage('webcam');
    else cameraInput.current?.click();
  };
  const choose = async () => {
    setError(null);
    if (isNative()) {
      const ph = await ask('photos');
      if (ph === 'blocked' || ph === 'denied') return fail('permission_denied');
      try {
        const b = await pickNativePhoto('photos');
        if (b) void analyse(b);
      } catch (e) {
        fail(e instanceof ImageInputError ? e.code : 'failed');
      }
    } else galleryInput.current?.click();
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) void analyse(f);
  };

  const kept = rows.filter((r) => r.keep && r.grams > 0);
  const total = sumNutrients(kept.map(rowNutrients));

  const save = async () => {
    setSaving(true);
    try {
      for (const r of kept) {
        const m = r.item.match;
        await createRecord(
          'foodLogs',
          {
            slot,
            foodId: m?.id ?? null,
            name: m ? displayName(m, i18n.language) : r.item.localName || r.item.name,
            servingLabel: `${r.grams} g`,
            servings: 1,
            grams: r.grams,
            nutrients: rowNutrients(r),
            foodSource: m?.source ?? 'ai',
            ...(m ? { per100g: m.per100g } : {}),
          },
          { date, source: 'ai' },
        );
      }
      toast(t('scan.logged', { count: kept.length, slot: t(`slots.${slot}`) }), 'success');
      onDone();
    } catch {
      toast(t('errors.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="scan-food" className="flex flex-col gap-4">
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} aria-hidden tabIndex={-1} />
      <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={onFile} aria-hidden tabIndex={-1} />

      {error && (
        <p role="alert" id="scan-error" className="rounded-input bg-raised px-3 py-2 text-small text-ink">
          {t(`scan.errors.${error}`, { defaultValue: t('scan.errors.failed') })}{' '}
          {error === 'locked' && (
            <Link to="/plans" className="font-semibold text-primary-text hover:underline">
              {t('food.seePlans')}
            </Link>
          )}
        </p>
      )}

      {stage === 'pick' && (
        <>
          <p className="text-small text-muted">{t('scan.hint')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button id="scan-take" icon={<Camera className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void take()}>
              {t('scan.takePhoto')}
            </Button>
            <Button id="scan-choose" variant="secondary" icon={<ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void choose()}>
              {t('scan.choosePhoto')}
            </Button>
          </div>
          <p className="text-caption text-muted">{t('scan.privacy')}</p>
        </>
      )}

      {stage === 'webcam' && (
        <Webcam
          onShot={(b) => void analyse(b)}
          onClose={(err) => {
            if (err) fail(err);
            else setStage('pick');
          }}
        />
      )}

      {stage === 'working' && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {preview ? <img src={preview} alt="" className="max-h-56 w-full rounded-card object-cover" /> : <Skeleton className="h-40" />}
          <p className="text-small text-muted">{t('scan.analysing')}</p>
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      )}

      {stage === 'review' && result && (
        <>
          {preview && <img src={preview} alt={t('scan.yourPhoto')} className="max-h-48 w-full rounded-card object-cover" />}
          {result.quality !== 'good' && <p className="text-small text-accent">{t(`scan.quality.${result.quality}`)}</p>}
          <p className="text-small text-muted">{t('scan.reviewHint')}</p>
          <ul className="flex flex-col gap-2" id="scan-items">
            {rows.map((r, i) => {
              const n = rowNutrients(r);
              return (
                <li key={i}>
                  <Card tone={r.keep ? 'default' : 'subtle'} padding="sm" className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={r.keep ? 'text-body font-semibold text-ink' : 'text-body text-muted line-through'}>
                          {r.item.match ? displayName(r.item.match, i18n.language) : r.item.localName || r.item.name}
                        </p>
                        <p className="text-caption text-muted">
                          {r.item.match ? t('scan.matched', { source: t(`food.sources.${r.item.match.source}`, { defaultValue: r.item.match.source }) }) : t('scan.aiOnly')}
                          {' · '}
                          {t(`scan.confidence.${r.item.confidence}`)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={r.keep ? t('scan.remove', { name: r.item.name }) : t('scan.restore', { name: r.item.name })}
                        icon={r.keep ? <Trash2 className="h-4 w-4" strokeWidth={1.75} /> : <RotateCcw className="h-4 w-4" strokeWidth={1.75} />}
                        onClick={() => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x)))}
                      />
                    </div>
                    {r.keep && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-small text-muted">
                          {t('scan.grams')}
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={3000}
                            value={r.grams || ''}
                            onChange={(e) => {
                              const g = Math.max(0, Math.min(3000, Math.round(Number(e.target.value) || 0)));
                              setRows((rs) => rs.map((x, j) => (j === i ? { ...x, grams: g } : x)));
                            }}
                            className="h-10 w-24 rounded-input border border-line bg-surface px-2 text-body text-ink tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        <span className="text-caption text-muted">{t('scan.portionGuess', { portion: r.item.portion, min: Math.round(r.item.grams.min), max: Math.round(r.item.grams.max) })}</span>
                        <span className="ms-auto text-body font-semibold text-ink tabular-nums">
                          {n.calories} {t('common.kcal')}
                        </span>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
          <Card tone="subtle" padding="sm" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink tabular-nums" id="scan-total">
            <span className="font-semibold">{t('scan.total', { kcal: total.calories })}</span>
            <span>{t('scan.macros', { p: total.proteinG, c: total.carbsG, f: total.fatG })}</span>
          </Card>
          <p className="text-caption text-muted">{t('scan.estimateNote')}</p>
          <div className="flex flex-wrap gap-2">
            <Button id="scan-save" loading={saving} disabled={!kept.length} onClick={() => void save()}>
              {t('scan.addItems', { count: kept.length, slot: t(`slots.${slot}`) })}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setStage('pick');
                setResult(null);
                setRows([]);
              }}
            >
              {t('scan.retake')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
