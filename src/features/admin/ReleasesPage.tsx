import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, Download, FileDown, RefreshCw, Smartphone, Upload } from 'lucide-react';
import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button, Card, CardHeader, Skeleton, toast } from '../../components/ui';
import { downloadCsv, fmtDate } from './api';
import { Field, Table, Td, inputCls } from './ui';
import { iosMode, parseIos } from '../website/release';

type Android = { latestVersionName: string; latestVersionCode: string; minSupportedVersionCode: string; apkUrl: string; fileSizeMB: string; releaseDate: string; releaseNotes: string };
type Ios = { appStoreUrl: string; testflightUrl: string; version: string; releaseNotes: string };
type Waiter = { id: string; email: string; source: string; at: number | null };

const EMPTY_ANDROID: Android = { latestVersionName: '', latestVersionCode: '', minSupportedVersionCode: '', apkUrl: '', fileSizeMB: '', releaseDate: '', releaseNotes: '' };
const EMPTY_IOS: Ios = { appStoreUrl: '', testflightUrl: '', version: '', releaseNotes: '' };
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const okUrl = (v: string, host: string) => {
  if (!v.trim()) return true;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' && (u.hostname === host || u.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};
const intOrNull = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
const numOrNull = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Admin -> Releases: app_config/android (download page + in-app updater) and app_config/ios (download page), the
 * Android download count (app_downloads, written by the androidDownload function) and the old iOS waitlist.
 * Nothing is written until an admin presses Save; empty fields are stored as null, never invented.
 */
export default function ReleasesPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [android, setAndroid] = useState<Android>(EMPTY_ANDROID);
  const [ios, setIos] = useState<Ios>(EMPTY_IOS);
  const [downloads, setDownloads] = useState<number | null>(null);
  const [waitlist, setWaitlist] = useState<Waiter[]>([]);
  const [busy, setBusy] = useState<'android' | 'ios' | null>(null);
  const [upload, setUpload] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, i] = await Promise.all([getDoc(doc(db(), 'app_config', 'android')).catch(() => null), getDoc(doc(db(), 'app_config', 'ios')).catch(() => null)]);
    const ad = a?.data() ?? {};
    setAndroid({
      latestVersionName: s(ad.latestVersionName).replace(/^v/i, ''),
      latestVersionCode: s(ad.latestVersionCode),
      minSupportedVersionCode: s(ad.minSupportedVersionCode),
      apkUrl: s(ad.apkUrl),
      fileSizeMB: s(ad.fileSizeMB),
      releaseDate: s(ad.releaseDate),
      releaseNotes: s(ad.releaseNotes),
    });
    const id = i?.data() ?? {};
    setIos({ appStoreUrl: s(id.appStoreUrl), testflightUrl: s(id.testflightUrl), version: s(id.version), releaseNotes: s(id.releaseNotes) });
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const dl = await getDocs(query(collection(db(), 'app_downloads'), where('date', '>=', since))).catch(() => null);
    setDownloads(dl ? dl.docs.reduce((n, d) => n + (Number(d.get('android')) || 0), 0) : null);
    const wl = await getDocs(query(collection(db(), 'ios_waitlist'), orderBy('createdAt', 'desc'), limit(500))).catch(() => null);
    setWaitlist(
      wl?.docs.map((d) => {
        const c = d.get('createdAt');
        return { id: d.id, email: s(d.get('email')), source: s(d.get('source')), at: c instanceof Timestamp ? c.toMillis() : null };
      }) ?? [],
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAndroid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('android');
    try {
      await setDoc(doc(db(), 'app_config', 'android'), {
        latestVersionName: android.latestVersionName.trim().replace(/^v/i, '') || null,
        latestVersionCode: intOrNull(android.latestVersionCode),
        minSupportedVersionCode: intOrNull(android.minSupportedVersionCode),
        apkUrl: android.apkUrl.trim() || null,
        fileSizeMB: numOrNull(android.fileSizeMB),
        releaseDate: android.releaseDate.trim() || null,
        releaseNotes: android.releaseNotes.trim() || null,
      });
      toast(t('admin.releases.saved'));
    } catch {
      toast(t('admin.releases.saveFailed'));
    } finally {
      setBusy(null);
    }
  };

  const saveIos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!okUrl(ios.appStoreUrl, 'apps.apple.com') || !okUrl(ios.testflightUrl, 'testflight.apple.com')) return toast(t('admin.releases.invalidUrl'));
    setBusy('ios');
    try {
      await setDoc(doc(db(), 'app_config', 'ios'), {
        appStoreUrl: ios.appStoreUrl.trim() || null,
        testflightUrl: ios.testflightUrl.trim() || null,
        version: ios.version.trim() || null,
        releaseNotes: ios.releaseNotes.trim() || null,
      });
      toast(t('admin.releases.saved'));
    } catch {
      toast(t('admin.releases.saveFailed'));
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) return toast(t('admin.releases.uploadWrongFile'));
    const version = android.latestVersionName.trim().replace(/^v/i, '');
    if (!/^[0-9.]+$/.test(version)) return toast(t('admin.releases.uploadNeedsVersion'));
    const name = `FitMe-v${version}.apk`;
    const task = uploadBytesResumable(ref(await storage(), `releases/${name}`), file, {
      contentType: 'application/vnd.android.package-archive',
      cacheControl: 'public, max-age=86400',
      contentDisposition: `attachment; filename="${name}"`,
    });
    setUpload(0);
    task.on(
      'state_changed',
      (snap) => setUpload(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        setUpload(null);
        toast(t('admin.releases.uploadFailed', { msg: err.code }));
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const size = (file.size / 1048576).toFixed(1);
        setAndroid((a) => ({ ...a, apkUrl: url, fileSizeMB: size, releaseDate: a.releaseDate || new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date()) }));
        setUpload(null);
        toast(t('admin.releases.uploaded', { size }));
      },
    );
  };

  if (loading) return <Skeleton className="h-96" />;
  const mode = iosMode(parseIos(ios));
  const setA = (k: keyof Android) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAndroid({ ...android, [k]: e.target.value });
  const setI = (k: keyof Ios) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setIos({ ...ios, [k]: e.target.value });

  return (
    <div className="flex flex-col gap-6" id="admin-releases">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">{t('admin.releases.title')}</h1>
          <p className="text-small text-muted">{t('admin.releases.subtitle')}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
          {t('admin.releases.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="flex items-center gap-2 text-caption text-muted">
            <Download className="h-4 w-4" aria-hidden /> {t('admin.releases.downloads')}
          </p>
          <p className="mt-1 text-display text-ink tabular-nums">{downloads ?? '—'}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-caption text-muted">
            <Apple className="h-4 w-4" aria-hidden /> {t('admin.releases.iosMode', { mode: t(`admin.releases.modes.${mode}`) })}
          </p>
          <p className="mt-1 text-display text-ink tabular-nums">{android.latestVersionName || t('admin.releases.notSet')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('admin.releases.android')} />
          <p className="mb-4 text-small text-muted">{t('admin.releases.androidHelp')}</p>
          <form onSubmit={saveAndroid} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t('admin.releases.versionName')}>
              <input id="rel-version" className={inputCls} value={android.latestVersionName} onChange={setA('latestVersionName')} />
            </Field>
            <Field label={t('admin.releases.versionCode')}>
              <input id="rel-code" className={inputCls} inputMode="numeric" value={android.latestVersionCode} onChange={setA('latestVersionCode')} />
            </Field>
            <Field label={t('admin.releases.minCode')} hint={t('admin.releases.minHelp')}>
              <input id="rel-min" className={inputCls} inputMode="numeric" value={android.minSupportedVersionCode} onChange={setA('minSupportedVersionCode')} />
            </Field>
            <Field label={t('admin.releases.releaseDate')}>
              <input id="rel-date" className={inputCls} value={android.releaseDate} onChange={setA('releaseDate')} />
            </Field>
            <div className="md:col-span-2">
              <Field label={t('admin.releases.apkUrl')}>
                <input id="rel-url" className={inputCls} value={android.apkUrl} onChange={setA('apkUrl')} />
              </Field>
            </div>
            <Field label={t('admin.releases.size')}>
              <input id="rel-size" className={inputCls} inputMode="decimal" value={android.fileSizeMB} onChange={setA('fileSizeMB')} />
            </Field>
            <div className="flex items-end">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-button border border-line px-4 text-small font-semibold text-ink hover:bg-raised">
                <Upload className="h-4 w-4" aria-hidden />
                {upload !== null ? t('admin.releases.uploading', { pct: upload }) : t('admin.releases.upload')}
                <input type="file" accept=".apk,application/vnd.android.package-archive" className="sr-only" onChange={(e) => void onFile(e)} disabled={upload !== null} />
              </label>
            </div>
            <div className="md:col-span-2">
              <Field label={t('admin.releases.notes')}>
                <textarea id="rel-notes" className={`${inputCls} min-h-24`} value={android.releaseNotes} onChange={setA('releaseNotes')} />
              </Field>
            </div>
            <Button type="submit" loading={busy === 'android'} icon={<Smartphone className="h-4 w-4" />} className="md:col-span-2 md:justify-self-start">
              {t('admin.releases.save')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title={t('admin.releases.ios')} />
          <p className="mb-4 text-small text-muted">{t('admin.releases.iosHelp')}</p>
          <form onSubmit={saveIos} className="grid grid-cols-1 gap-4">
            <Field label={t('admin.releases.appStoreUrl')}>
              <input id="rel-appstore" className={inputCls} type="url" value={ios.appStoreUrl} onChange={setI('appStoreUrl')} />
            </Field>
            <Field label={t('admin.releases.testflightUrl')}>
              <input id="rel-testflight" className={inputCls} type="url" value={ios.testflightUrl} onChange={setI('testflightUrl')} />
            </Field>
            <Field label={t('admin.releases.iosVersion')}>
              <input id="rel-ios-version" className={inputCls} value={ios.version} onChange={setI('version')} />
            </Field>
            <Field label={t('admin.releases.notes')}>
              <textarea id="rel-ios-notes" className={`${inputCls} min-h-24`} value={ios.releaseNotes} onChange={setI('releaseNotes')} />
            </Field>
            <Button type="submit" loading={busy === 'ios'} icon={<Apple className="h-4 w-4" />} className="justify-self-start">
              {t('admin.releases.save')}
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardHeader title={`${t('admin.releases.waitlist')} (${waitlist.length})`} />
            <p className="text-small text-muted">{t('admin.releases.waitlistHelp')}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!waitlist.length}
            icon={<FileDown className="h-4 w-4" />}
            onClick={() => downloadCsv('fitme-ios-waitlist', waitlist.map((w) => ({ email: w.email, source: w.source, date: w.at ? new Date(w.at).toISOString() : '' })))}
          >
            {t('admin.releases.export')}
          </Button>
        </div>
        {waitlist.length ? (
          <Table label={t('admin.releases.waitlist')} head={[t('admin.releases.email'), t('admin.releases.source'), t('admin.releases.date')]}>
            {waitlist.map((w) => (
              <tr key={w.id}>
                <Td>{w.email}</Td>
                <Td>{w.source || '—'}</Td>
                <Td>{fmtDate(w.at, i18n.language)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-small text-muted">{t('admin.releases.empty')}</p>
        )}
      </Card>
    </div>
  );
}
