import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/** app_config/android (Admin -> Releases). Nothing is hard-coded: missing fields stay null. */
export interface AndroidRelease {
  version: string | null;
  versionCode: number | null;
  minSupportedVersionCode: number | null;
  apkUrl: string | null;
  sizeMB: number | null;
  releaseDate: string | null;
  releaseNotes: string | null;
}

/** app_config/ios: App Store link wins, then TestFlight, else the browser option. */
export interface IosRelease {
  appStoreUrl: string | null;
  testflightUrl: string | null;
  version: string | null;
  releaseNotes: string | null;
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const httpsUrl = (v: unknown, hosts: string[]) => {
  const s = str(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ? u.toString() : null;
  } catch {
    return null;
  }
};

export function parseAndroid(d: Record<string, unknown> | undefined): AndroidRelease {
  const v = str(d?.latestVersionName);
  return {
    version: v ? v.replace(/^v/i, '') : null,
    versionCode: num(d?.latestVersionCode),
    minSupportedVersionCode: num(d?.minSupportedVersionCode),
    apkUrl: str(d?.apkUrl),
    sizeMB: num(d?.fileSizeMB),
    releaseDate: str(d?.releaseDate),
    releaseNotes: str(d?.releaseNotes),
  };
}

export function parseIos(d: Record<string, unknown> | undefined): IosRelease {
  return {
    appStoreUrl: httpsUrl(d?.appStoreUrl, ['apps.apple.com']),
    testflightUrl: httpsUrl(d?.testflightUrl, ['testflight.apple.com']),
    version: str(d?.version),
    releaseNotes: str(d?.releaseNotes),
  };
}

export type IosMode = 'appstore' | 'testflight' | 'browser';
export const iosMode = (r: IosRelease | null): IosMode => (r?.appStoreUrl ? 'appstore' : r?.testflightUrl ? 'testflight' : 'browser');

type State<T> = { loading: boolean; value: T | null };

function useConfig<T>(id: 'android' | 'ios', parse: (d: Record<string, unknown> | undefined) => T): State<T> {
  const [state, setState] = useState<State<T>>({ loading: true, value: null });
  useEffect(() => {
    let live = true;
    getDoc(doc(db(), 'app_config', id))
      .then((s) => live && setState({ loading: false, value: parse(s.exists() ? s.data() : undefined) }))
      .catch(() => live && setState({ loading: false, value: parse(undefined) }));
    return () => {
      live = false;
    };
  }, [id, parse]);
  return state;
}

export const useAndroidRelease = () => useConfig('android', parseAndroid);
export const useIosRelease = () => useConfig('ios', parseIos);
