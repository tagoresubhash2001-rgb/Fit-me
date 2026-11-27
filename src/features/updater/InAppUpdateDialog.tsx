import React, { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isNative, platform } from '../../lib/platform';
import { RefreshCw, AlertCircle, Download, CheckCircle2, ShieldCheck, ExternalLink, X, Loader2 } from 'lucide-react';

interface AndroidConfig {
  latestVersionName: string;
  latestVersionCode: number;
  minSupportedVersionCode: number;
  apkUrl: string;
  fileSizeMB: number;
  releaseNotes: string;
  releaseDate: string;
}

interface FitMeStepsPlugin {
  canRequestPackageInstalls(): Promise<{ granted: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  installApk(options: { url: string }): Promise<{ success: boolean }>;
}

const Native = registerPlugin<FitMeStepsPlugin>('FitMeSteps');

// Current App build info
const CURRENT_VERSION_CODE = 201; // Matches android/app/build.gradle versionCode
const CURRENT_VERSION_NAME = '2.0.1';

export function InAppUpdateDialog() {
  const [config, setConfig] = useState<AndroidConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    // Only active on native Android sideloaded builds
    if (!isNative() || platform() !== 'android') return;

    getDoc(doc(db(), 'app_config/android'))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as AndroidConfig;
          setConfig(data);
        }
      })
      .catch((e) => console.warn('Could not check for app updates:', e));
  }, []);

  if (!config) return null;

  const isCritical = CURRENT_VERSION_CODE < (config.minSupportedVersionCode || 0);
  const isUpdateAvailable = CURRENT_VERSION_CODE < (config.latestVersionCode || 0);

  if (!isUpdateAvailable || (dismissed && !isCritical)) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    setStatusMsg('Checking package install permissions...');

    try {
      const { granted } = await Native.canRequestPackageInstalls().catch(() => ({ granted: true }));
      if (!granted) {
        setNeedsPermission(true);
        setStatusMsg('Permission needed: Enable "Install unknown apps" for FitMe.');
        setUpdating(false);
        return;
      }

      setStatusMsg('Downloading latest APK package...');
      const apkDownloadUrl = config.apkUrl.startsWith('http')
        ? config.apkUrl
        : `${window.location.origin}${config.apkUrl}`;

      await Native.installApk({ url: apkDownloadUrl });
      setStatusMsg('Launching installer...');
    } catch (err) {
      console.error('Update failed:', err);
      setStatusMsg('Download failed. Tap to retry or download from fitme.ai.');
      setUpdating(false);
    }
  };

  const openPermissionSettings = async () => {
    await Native.openInstallPermissionSettings().catch(() => undefined);
    setNeedsPermission(false);
  };

  // 1. Critical Blocking Update Screen
  if (isCritical) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070B14] p-6 text-white text-center">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#0C1220] p-8 shadow-2xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Essential Update Required</h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              To protect your health records and keep syncing reliably with Android Health Connect, you must upgrade to FitMe{' '}
              <strong>{config.latestVersionName}</strong>.
            </p>
          </div>

          {config.releaseNotes && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left text-xs text-slate-300">
              <span className="font-semibold text-white block mb-1">What&apos;s New:</span>
              <p className="leading-relaxed">{config.releaseNotes}</p>
            </div>
          )}

          {statusMsg && (
            <div className="text-xs font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5">
              {statusMsg}
            </div>
          )}

          {needsPermission ? (
            <button
              type="button"
              onClick={openPermissionSettings}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-sm text-slate-950 transition hover:bg-amber-400"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Allow &quot;Install Unknown Apps&quot;</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={updating}
              onClick={handleUpdate}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1FA45B] font-semibold text-sm text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              <span>Update Now ({config.fileSizeMB || 24} MB)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Dismissible Update Available Modal
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fade-in_150ms_ease-out]">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0C1220] p-6 sm:p-7 shadow-2xl text-left">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-5 top-5 rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Dismiss update dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Update Available</h3>
            <span className="text-xs text-slate-400">
              Version {config.latestVersionName} ({config.fileSizeMB} MB)
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          A new version of FitMe is available with enhancements for background health synchronization and AI coaching.
        </p>

        {config.releaseNotes && (
          <div className="my-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300">
            <span className="font-semibold text-white block mb-1">Release Highlights:</span>
            <p className="leading-relaxed">{config.releaseNotes}</p>
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 text-xs font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5">
            {statusMsg}
          </div>
        )}

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 h-11 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Later
          </button>

          {needsPermission ? (
            <button
              type="button"
              onClick={openPermissionSettings}
              className="flex-1 h-11 rounded-xl bg-amber-500 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Allow Install</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={updating}
              onClick={handleUpdate}
              className="flex-1 h-11 rounded-xl bg-[#1FA45B] text-xs font-semibold text-white transition hover:bg-emerald-600 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Update ({config.latestVersionName})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
