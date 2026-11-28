import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Upload,
  Download,
  Users,
  AlertTriangle,
  FileDown,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button, Card, CardHeader, Input, Skeleton, toast } from '../../components/ui';
import { downloadCsv, fmtDate } from './api';
import { Table, Td } from './ui';

interface AndroidConfig {
  latestVersionName: string;
  latestVersionCode: number;
  minSupportedVersionCode: number;
  apkUrl: string;
  fileSizeMB: number;
  releaseNotes: string;
  releaseDate: string;
}

interface WaitlistEntry {
  id: string;
  email: string;
  createdAt?: { toMillis?: () => number; seconds?: number } | number;
  platform?: string;
  source?: string;
}

const DEFAULT_CONFIG: AndroidConfig = {
  latestVersionName: 'v2.0.1',
  latestVersionCode: 201,
  minSupportedVersionCode: 200,
  apkUrl: '/download/android',
  fileSizeMB: 24.5,
  releaseNotes: 'Precision Health Connect step sync, continuous heart rate analytics, and AI coaching updates.',
  releaseDate: 'November 26, 2026',
};

export default function ReleasesPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AndroidConfig>(DEFAULT_CONFIG);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);

  // Download counts
  const [downloadCount, setDownloadCount] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const firestore = await db();
      // Load Android config
      const docRef = doc(firestore, 'app_config', 'android');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as AndroidConfig);
      } else {
        // Initialize doc with default
        await setDoc(docRef, DEFAULT_CONFIG);
      }

      // Load iOS waitlist
      const waitlistRef = collection(firestore, 'ios_waitlist');
      const q = query(waitlistRef, orderBy('createdAt', 'desc'), limit(100));
      const waitlistSnap = await getDocs(q).catch(async () => {
        // Fallback without orderBy if index is creating
        return await getDocs(collection(firestore, 'ios_waitlist'));
      });
      const entries: WaitlistEntry[] = [];
      waitlistSnap.forEach((doc) => {
        entries.push({ id: doc.id, ...(doc.data() as Omit<WaitlistEntry, 'id'>) });
      });
      setWaitlist(entries);

      // Load download stats
      const dlSnap = await getDocs(collection(firestore, 'app_downloads')).catch(() => null);
      if (dlSnap) {
        setDownloadCount(dlSnap.size);
      }
    } catch (e) {
      console.error('Failed to load release data:', e);
      toast(t('admin.loadFailed') || 'Failed to load release data');
    } finally {
      setLoading(false);
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const firestore = await db();
      await setDoc(doc(firestore, 'app_config', 'android'), {
        ...config,
        latestVersionCode: Number(config.latestVersionCode),
        minSupportedVersionCode: Number(config.minSupportedVersionCode),
        fileSizeMB: Number(config.fileSizeMB),
      });
      toast('Release configuration saved successfully');
    } catch (e) {
      console.error(e);
      toast('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apk')) {
      setUploadError('Please select a valid .apk file');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);

    try {
      const storageInstance = await storage();
      const filename = `FitMe-${config.latestVersionName || 'release'}.apk`;
      const storageRef = ref(storageInstance, `releases/${filename}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: 'application/vnd.android.package-archive',
        cacheControl: 'public, max-age=31536000',
        contentDisposition: `attachment; filename="${filename}"`,
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadError('Failed to upload APK to Firebase Storage: ' + error.message);
          setUploadProgress(null);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const sizeMB = Number((file.size / (1024 * 1024)).toFixed(1));

          const updated = {
            ...config,
            apkUrl: downloadUrl,
            fileSizeMB: sizeMB,
            releaseDate: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
          };

          setConfig(updated);

          // Update Firestore
          const firestore = await db();
          await setDoc(doc(firestore, 'app_config', 'android'), updated);

          setUploadProgress(null);
          toast(`APK uploaded and published (${sizeMB} MB)!`);
        }
      );
    } catch (err: unknown) {
      console.error(err);
      setUploadError('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
      setUploadProgress(null);
    }
  };

  const handleExportWaitlist = () => {
    if (!waitlist.length) {
      toast('No entries to export');
      return;
    }
    const rows = waitlist.map((w) => {
      let created = '—';
      if (w.createdAt) {
        if (typeof w.createdAt === 'object' && 'toMillis' in w.createdAt && typeof w.createdAt.toMillis === 'function') {
          created = new Date(w.createdAt.toMillis()).toISOString();
        } else if (typeof w.createdAt === 'object' && 'seconds' in w.createdAt) {
          created = new Date((w.createdAt.seconds || 0) * 1000).toISOString();
        } else if (typeof w.createdAt === 'number') {
          created = new Date(w.createdAt).toISOString();
        }
      }
      return {
        Email: w.email,
        Platform: w.platform || 'iOS',
        Source: w.source || 'Website Waitlist',
        Date: created,
      };
    });
    downloadCsv('fitme-ios-waitlist', rows);
    toast('Waitlist exported as CSV');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="admin-releases">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">App Releases & Distribution</h1>
          <p className="text-small text-muted">
            Manage Android sideloaded APK updates, in-app updater thresholds, and view the iOS waitlist.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadData()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-caption font-medium">Latest Release</span>
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <span className="mt-2 text-[26px] font-bold text-ink">{config.latestVersionName}</span>
          <span className="text-caption text-muted">Build Code {config.latestVersionCode}</span>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-caption font-medium">Min Supported Version</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <span className="mt-2 text-[26px] font-bold text-ink">{config.minSupportedVersionCode}</span>
          <span className="text-caption text-muted">Older builds are force-updated</span>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-caption font-medium">Recorded APK Downloads</span>
            <Download className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="mt-2 text-[26px] font-bold text-ink">{downloadCount}</span>
          <span className="text-caption text-muted">Via landing page & redirect</span>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-caption font-medium">iOS Waitlist Signups</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <span className="mt-2 text-[26px] font-bold text-ink">{waitlist.length}</span>
          <span className="text-caption text-muted">Interested iPhone users</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Release Configuration Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <CardHeader
              title="Android Production Configuration"
              subtitle="This document (app_config/android) controls the native in-app updater and the landing page."
            />

            <form onSubmit={handleSaveConfig} className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-caption font-medium text-ink">Version Name (e.g. v2.0.1)</label>
                  <Input
                    value={config.latestVersionName}
                    onChange={(e) => setConfig({ ...config, latestVersionName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption font-medium text-ink">Version Code (integer, e.g. 201)</label>
                  <Input
                    type="number"
                    value={config.latestVersionCode}
                    onChange={(e) => setConfig({ ...config, latestVersionCode: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-caption font-medium text-ink">Minimum Supported Version Code</label>
                  <Input
                    type="number"
                    value={config.minSupportedVersionCode}
                    onChange={(e) => setConfig({ ...config, minSupportedVersionCode: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                  <span className="mt-1 block text-[11px] text-muted">
                    Builds below this code receive a blocking update screen.
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-caption font-medium text-ink">File Size (MB)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.fileSizeMB}
                    onChange={(e) => setConfig({ ...config, fileSizeMB: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-caption font-medium text-ink">Release Date</label>
                <Input
                  value={config.releaseDate}
                  onChange={(e) => setConfig({ ...config, releaseDate: e.target.value })}
                  placeholder="e.g. November 26, 2026"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-caption font-medium text-ink">APK Download URL</label>
                <div className="flex gap-2">
                  <Input
                    value={config.apkUrl}
                    onChange={(e) => setConfig({ ...config, apkUrl: e.target.value })}
                    placeholder="/download/android or https://storage..."
                    required
                  />
                  {config.apkUrl.startsWith('http') && (
                    <a
                      href={config.apkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-button border border-line px-3 text-muted hover:text-ink"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-caption font-medium text-ink">Release Notes / Changelog</label>
                <textarea
                  className="w-full rounded-input border border-line bg-surface p-3 text-small text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  value={config.releaseNotes}
                  onChange={(e) => setConfig({ ...config, releaseNotes: e.target.value })}
                  required
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Upload APK Card */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <CardHeader
              title="Upload New Release APK"
              subtitle="Upload signed universal release APK to Firebase Storage."
            />

            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-6 text-center hover:border-primary/50">
              <Upload className="h-10 w-10 text-muted" />
              <p className="mt-2 text-small font-medium text-ink">Select production release APK</p>
              <p className="mt-1 text-caption text-muted">Directly updates storage & config</p>

              <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-button bg-primary px-4 py-2 text-small font-semibold text-on-primary hover:opacity-90">
                <span>Browse APK File</span>
                <input
                  type="file"
                  accept=".apk"
                  className="sr-only"
                  onChange={handleFileUpload}
                  disabled={uploadProgress !== null}
                />
              </label>

              {uploadProgress !== null && (
                <div className="mt-4 w-full">
                  <div className="flex justify-between text-caption font-medium text-ink">
                    <span>Uploading APK...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="mt-3 text-caption text-red-500">{uploadError}</p>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-raised p-3 text-caption text-muted">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Always verify that the APK is signed with the production release keystore before publishing.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* iOS Waitlist Section */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-headline font-semibold text-ink">iOS Waitlist Signups</h2>
            <p className="text-small text-muted">
              Prospective users who requested a notification when the FitMe iPhone app launches.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportWaitlist}
            disabled={!waitlist.length}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" /> Export CSV ({waitlist.length})
          </Button>
        </div>

        <div className="mt-4">
          {waitlistLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : waitlist.length === 0 ? (
            <div className="py-8 text-center text-small text-muted">
              No waitlist signups recorded yet.
            </div>
          ) : (
            <Table
              label="iOS Waitlist Table"
              head={['Email', 'Platform', 'Source', 'Date Added']}
            >
              {waitlist.map((entry) => {
                let ms: number | null = null;
                if (entry.createdAt) {
                  if (typeof entry.createdAt === 'object' && 'toMillis' in entry.createdAt && typeof entry.createdAt.toMillis === 'function') {
                    ms = entry.createdAt.toMillis();
                  } else if (typeof entry.createdAt === 'object' && 'seconds' in entry.createdAt) {
                    ms = (entry.createdAt.seconds || 0) * 1000;
                  } else if (typeof entry.createdAt === 'number') {
                    ms = entry.createdAt;
                  }
                }
                return (
                  <tr key={entry.id}>
                    <Td className="font-medium">{entry.email}</Td>
                    <Td>{entry.platform || 'iOS'}</Td>
                    <Td className="text-muted">{entry.source || 'Website Waitlist'}</Td>
                    <Td className="text-muted">{fmtDate(ms, i18n.language)}</Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
