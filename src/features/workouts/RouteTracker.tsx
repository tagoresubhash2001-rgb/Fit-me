import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, Square } from 'lucide-react';
import { Button, Card, Tabs, toast } from '../../components/ui';
import { isNative } from '../../lib/platform';
import { createRecord } from '../../data/records';
import { useSession } from '../../data/session';
import { useAskPermission } from '../permissions/PermissionPrimer';
import { acceptFix, distanceMeters, paceSecPerKm, routeCalories, thin, type Fix, type RouteActivity } from '../../domain/route';
import { useFormat } from '../../lib/hooks';

type Stop = () => void;

/** Location updates while the app is open: Capacitor Geolocation on phones, the browser API on the web. */
async function watch(onFix: (f: Fix) => void, onError: (code: string) => void): Promise<Stop> {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }, (pos, err) => {
      if (err || !pos) return onError('unavailable');
      onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, t: pos.timestamp });
    });
    return () => void Geolocation.clearWatch({ id });
  }
  if (!('geolocation' in navigator)) {
    onError('unsupported');
    return () => undefined;
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, t: pos.timestamp }),
    (e) => onError(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

/** Route drawn as an SVG line in its own bounding box (no map tiles, no third-party map service). */
function RouteShape({ points }: { points: Fix[] }) {
  const path = useMemo(() => {
    if (points.length < 2) return '';
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const span = Math.max(maxLat - minLat, (maxLng - minLng) * Math.cos((minLat * Math.PI) / 180), 1e-6);
    return points
      .map((p, i) => {
        const x = 8 + (((p.lng - minLng) * Math.cos((minLat * Math.PI) / 180)) / span) * 184;
        const y = 192 - ((p.lat - minLat) / span) * 184;
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="" className="aspect-square w-full max-h-64 rounded-card bg-raised">
      {path && <path d={path} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function RouteTracker({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { n } = useFormat();
  const ask = useAskPermission();
  const profile = useSession((s) => s.profile);
  const [activity, setActivity] = useState<RouteActivity>('walk');
  const [state, setState] = useState<'idle' | 'tracking' | 'paused' | 'saving'>('idle');
  const [points, setPoints] = useState<Fix[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const stop = useRef<Stop | null>(null);
  const moving = useRef({ ms: 0, since: 0 });

  useEffect(() => {
    return () => stop.current?.();
  }, []);
  useEffect(() => {
    if (state !== 'tracking') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  const elapsed = moving.current.ms + (state === 'tracking' ? now - moving.current.since : 0);
  const meters = distanceMeters(points);
  const pace = paceSecPerKm(meters, elapsed);
  const weight = profile?.weightKg;

  const begin = async () => {
    setError(null);
    const s = await ask('location');
    if (s !== 'granted' && s !== 'limited') return setError(s === 'unsupported' ? 'unsupported' : 'denied');
    stop.current = await watch(
      (f) => {
        setAccuracy(Math.round(f.accuracy));
        setPoints((ps) => (acceptFix(ps[ps.length - 1] ?? null, f, activity) ? [...ps, f] : ps));
      },
      (code) => setError(code),
    );
    moving.current.since = Date.now();
    setNow(Date.now());
    setState('tracking');
  };
  const pause = () => {
    stop.current?.();
    stop.current = null;
    moving.current.ms += Date.now() - moving.current.since;
    setState('paused');
  };
  const finish = async () => {
    if (state === 'tracking') pause();
    setState('saving');
    const ms = moving.current.ms;
    const route = thin(points, 400).map((p) => ({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 }));
    await createRecord('workoutLogs', {
      name: t(`route.activity.${activity}`),
      durationMin: Math.max(1, Math.round(ms / 60000)),
      sets: [],
      caloriesEst: routeCalories(activity, ms, weight),
      activity,
      distanceKm: Math.round(meters) / 1000,
      route,
    });
    toast(t('route.saved', { km: n(meters / 1000, 2) }), 'success');
    onDone();
  };
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4" id="route-tracker">
      {state === 'idle' && (
        <Tabs
          value={activity}
          onChange={setActivity}
          items={(['walk', 'run', 'ride'] as const).map((a) => ({ id: a, label: t(`route.activity.${a}`) }))}
        />
      )}
      <RouteShape points={points} />
      <Card tone="subtle" padding="sm" className="grid grid-cols-3 gap-2 text-center tabular-nums">
        <div>
          <p className="text-title text-ink" id="route-time">{fmt(elapsed)}</p>
          <p className="text-caption text-muted">{t('route.time')}</p>
        </div>
        <div>
          <p className="text-title text-ink" id="route-km">{n(meters / 1000, 2)}</p>
          <p className="text-caption text-muted">{t('route.km')}</p>
        </div>
        <div>
          <p className="text-title text-ink">{activity === 'ride' ? (elapsed > 0 ? n(meters / 1000 / (elapsed / 3600000), 1) : '—') : pace ? fmt(pace * 1000) : '—'}</p>
          <p className="text-caption text-muted">{activity === 'ride' ? t('route.kmh') : t('route.pace')}</p>
        </div>
      </Card>
      {accuracy !== null && state === 'tracking' && <p className="text-caption text-muted">{t(accuracy > 35 ? 'route.weakGps' : 'route.gps', { m: accuracy })}</p>}
      {error && (
        <p role="alert" className="rounded-input bg-raised px-3 py-2 text-small text-ink">
          {t(`route.errors.${error}`)}
        </p>
      )}
      <p className="text-caption text-muted">{t('route.foregroundNote')}</p>
      <div className="flex flex-wrap gap-2">
        {state === 'idle' && (
          <Button id="route-start" icon={<Play className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void begin()}>
            {t('route.start')}
          </Button>
        )}
        {state === 'tracking' && (
          <Button variant="secondary" icon={<Pause className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={pause}>
            {t('route.pause')}
          </Button>
        )}
        {state === 'paused' && (
          <Button variant="secondary" icon={<Play className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void begin()}>
            {t('route.resume')}
          </Button>
        )}
        {(state === 'tracking' || state === 'paused' || state === 'saving') && (
          <Button id="route-finish" loading={state === 'saving'} disabled={elapsed < 5000} icon={<Square className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void finish()}>
            {t('route.finish')}
          </Button>
        )}
      </div>
    </div>
  );
}
