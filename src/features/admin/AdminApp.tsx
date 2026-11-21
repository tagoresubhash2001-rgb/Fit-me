import React, { Suspense, lazy, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, BadgePercent, Bell, CalendarClock, CreditCard, FileText, KeyRound, Layers, LayoutDashboard, LifeBuoy, LogOut, MessageSquareQuote, Salad, Settings, Shield, ToggleRight, Users } from 'lucide-react';
import { BrandLogo, Button, Card, Input, Skeleton } from '../../components/ui';
import { cn } from '../../components/ui/cn';
import { useSession } from '../../data/session';
import { signInWithEmail, signInWithGoogle, signOut } from '../../data/auth';
import { canOpen, useStaffRole, type AdminSection } from './api';
import i18n from '../../lib/i18n';
import adminEn from '../../locales/admin.en.json';

// Admin texts (English only) load with the dashboard, so members never download them.
i18n.addResourceBundle('en', 'translation', adminEn, true, false);

const Overview = lazy(() => import('./Overview'));
const UsersPage = lazy(() => import('./UsersPage'));
const FinancePage = lazy(() => import('./FinancePage'));
const PlansAccessPage = lazy(() => import('./PlansAccessPage'));
const TrialsPage = lazy(() => import('./TrialsPage'));
const CouponsPage = lazy(() => import('./CouponsPage'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const IntegrationsPage = lazy(() => import('./IntegrationsPage'));
const SupportPage = lazy(() => import('./SupportPage'));
const TestimonialsPage = lazy(() => import('./TestimonialsPage'));
const ContentPage = lazy(() => import('./ContentPage'));
const FeaturesPage = lazy(() => import('./FeaturesPage'));
const FoodsPage = lazy(() => import('./FoodsPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const AdminsPage = lazy(() => import('./AdminsPage'));
const LogsPage = lazy(() => import('./LogsPage'));

const NAV: Array<{ to: string; key: AdminSection; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = [
  { to: '', key: 'overview', icon: LayoutDashboard },
  { to: 'users', key: 'users', icon: Users },
  { to: 'finance', key: 'finance', icon: CreditCard },
  { to: 'plans', key: 'plans', icon: Layers },
  { to: 'trials', key: 'trials', icon: CalendarClock },
  { to: 'coupons', key: 'coupons', icon: BadgePercent },
  { to: 'content', key: 'content', icon: FileText },
  { to: 'foods', key: 'foods', icon: Salad },
  { to: 'testimonials', key: 'testimonials', icon: MessageSquareQuote },
  { to: 'notifications', key: 'notifications', icon: Bell },
  { to: 'features', key: 'features', icon: ToggleRight },
  { to: 'settings', key: 'settings', icon: Settings },
  { to: 'integrations', key: 'integrations', icon: KeyRound },
  { to: 'support', key: 'support', icon: LifeBuoy },
  { to: 'admins', key: 'admins', icon: Shield },
  { to: 'logs', key: 'logs', icon: Activity },
];

function AdminLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (kind: 'google' | 'email') => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'google') await signInWithGoogle();
      else await signInWithEmail(email, password);
    } catch {
      setError(t('admin.login.failed'));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <Card className="flex w-full max-w-sm flex-col gap-4" id="admin-login">
        <BrandLogo size={40} textClassName="text-title" />
        <div>
          <h1 className="text-title text-ink">{t('admin.login.title')}</h1>
          <p className="text-small text-muted">{t('admin.login.body')}</p>
        </div>
        <Button variant="secondary" loading={busy === 'google'} onClick={() => void run('google')}>
          {t('auth.google')}
        </Button>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run('email');
          }}
        >
          <Input label={t('admin.login.email')} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t('admin.login.password')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && (
            <p role="alert" className="text-small text-danger-text">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy === 'email'} disabled={!email || !password}>
            {t('admin.login.signIn')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function NotAuthorised({ email }: { email: string | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <Card className="flex w-full max-w-sm flex-col gap-3" id="admin-denied">
        <BrandLogo size={40} textClassName="text-title" />
        <h1 className="text-title text-ink">{t('admin.denied.title')}</h1>
        <p className="text-small text-muted">{t('admin.denied.body', { email: email ?? '' })}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void signOut()}>
            {t('admin.logout')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            {t('admin.denied.back')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Admin dashboard (/admin). The routes below are only a convenience: every action is checked on the server. */
export default function AdminApp() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user);
  const authReady = useSession((s) => s.authReady);
  const staff = useStaffRole();
  const [menu, setMenu] = useState(false);
  if (!authReady || (user && staff.loading)) return <Skeleton className="m-6 h-40" />;
  if (!user)
    return (
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  if (!staff.role) return <NotAuthorised email={staff.email} />;
  const role = staff.role;
  const items = NAV.filter((n) => canOpen(role, n.key));
  const nav = (
    <nav aria-label={t('admin.title')} className="flex flex-col gap-1">
      {items.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={key}
          to={to}
          end={to === ''}
          onClick={() => setMenu(false)}
          className={({ isActive }) => cn('flex min-h-11 items-center gap-3 rounded-button px-3 text-body transition-colors', isActive ? 'bg-primary-subtle font-semibold text-primary-text' : 'text-ink hover:bg-raised')}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          {t(`admin.nav.${key}`)}
        </NavLink>
      ))}
      <button type="button" onClick={() => void signOut()} className="mt-2 flex min-h-11 items-center gap-3 rounded-button px-3 text-body text-ink hover:bg-raised" id="admin-logout">
        <LogOut className="h-5 w-5 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} />
        {t('admin.logout')}
      </button>
    </nav>
  );
  return (
    <div className="flex min-h-dvh bg-canvas text-ink" id="admin-app">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-e border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-2">
          <BrandLogo size={32} textClassName="text-title" />
          <p className="mt-1 text-caption text-muted">{t('admin.title')}</p>
        </div>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 md:px-6">
          <button type="button" className="flex h-11 items-center rounded-button px-2 text-small font-semibold text-ink hover:bg-raised lg:hidden" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {t('admin.menu')}
          </button>
          <span className="lg:hidden">
            <BrandLogo size={28} wordmark={false} />
          </span>
          <div className="ms-auto min-w-0 text-end">
            <p className="truncate text-small font-semibold text-ink">{staff.email}</p>
            <p className="text-caption text-muted">{t(`admin.roles.${role}`)}</p>
          </div>
        </header>
        {menu && <div className="border-b border-line bg-surface px-3 py-3 lg:hidden">{nav}</div>}
        <main className="w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
          <Suspense fallback={<Skeleton className="h-40" />}>
            <Routes>
              <Route index element={<Overview />} />
              {canOpen(role, 'users') && <Route path="users" element={<UsersPage role={role} />} />}
              {canOpen(role, 'finance') && <Route path="finance" element={<FinancePage />} />}
              {canOpen(role, 'plans') && <Route path="plans" element={<PlansAccessPage />} />}
              {canOpen(role, 'trials') && <Route path="trials" element={<TrialsPage />} />}
              {canOpen(role, 'coupons') && <Route path="coupons" element={<CouponsPage />} />}
              {canOpen(role, 'content') && <Route path="content" element={<ContentPage />} />}
              {canOpen(role, 'foods') && <Route path="foods" element={<FoodsPage />} />}
              {canOpen(role, 'testimonials') && <Route path="testimonials" element={<TestimonialsPage />} />}
              {canOpen(role, 'notifications') && <Route path="notifications" element={<NotificationsPage />} />}
              {canOpen(role, 'features') && <Route path="features" element={<FeaturesPage />} />}
              {canOpen(role, 'settings') && <Route path="settings" element={<SettingsPage />} />}
              {canOpen(role, 'integrations') && <Route path="integrations" element={<IntegrationsPage />} />}
              {canOpen(role, 'support') && <Route path="support" element={<SupportPage />} />}
              {canOpen(role, 'admins') && <Route path="admins" element={<AdminsPage role={role} />} />}
              {canOpen(role, 'logs') && <Route path="logs" element={<LogsPage />} />}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
