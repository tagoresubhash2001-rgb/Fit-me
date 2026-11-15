import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button, Card, Input, IconButton } from '../../components/ui';
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  startPhoneSignIn,
  authErrorKey,
  type PhoneVerification,
} from '../../data/auth';
import { isConfigured } from '../../lib/env';
import { LanguagePicker } from '../settings/LanguagePicker';

type Mode = 'choose' | 'email' | 'phone';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
      <path d="M16.4 12.6c0-2.5 2.1-3.7 2.2-3.8a4.7 4.7 0 0 0-3.7-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5a11 11 0 0 0 1.4-2.9 4.5 4.5 0 0 1-2.7-4.2zM13.9 5.2A4.5 4.5 0 0 0 15 1.8a4.6 4.6 0 0 0-3 1.5 4.3 4.3 0 0 0-1.1 3.3c1.1.1 2.3-.6 3-1.4z" />
    </svg>
  );
}

export default function SignInScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('choose');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState<PhoneVerification | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(null);
    }
  };

  const configured = isConfigured();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-4 pb-8 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex justify-end">
          <LanguagePicker compact />
        </div>
        <div className="mt-8 mb-6">
          <p className="text-display text-ink">
            FIT ME <span className="text-primary">AI</span>
          </p>
          <h1 className="mt-4 text-title text-ink">{t('auth.welcomeTitle')}</h1>
          <p className="mt-1 text-body text-muted">{t('auth.welcomeBody')}</p>
        </div>

        {!configured && (
          <Card tone="subtle" className="mb-4">
            <p className="text-small text-ink">{t('auth.notConfigured')}</p>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          {mode === 'choose' && (
            <>
              <Button
                variant="secondary"
                fullWidth
                icon={<GoogleMark />}
                loading={busy === 'google'}
                disabled={!configured || !!busy}
                onClick={() => run('google', signInWithGoogle)}
              >
                {t('auth.google')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                icon={<AppleMark />}
                loading={busy === 'apple'}
                disabled={!configured || !!busy}
                onClick={() => run('apple', signInWithApple)}
              >
                {t('auth.apple')}
              </Button>
              <div className="flex items-center gap-3 py-1 text-caption text-muted">
                <span className="h-px flex-1 bg-line" />
                {t('auth.or')}
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button
                variant="secondary"
                fullWidth
                icon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                disabled={!configured}
                onClick={() => setMode('email')}
              >
                {t('auth.email')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                icon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                disabled={!configured}
                onClick={() => setMode('phone')}
              >
                {t('auth.phone')}
              </Button>
            </>
          )}

          {mode !== 'choose' && (
            <div className="-ms-2 -mt-1">
              <IconButton
                label={t('common.back')}
                onClick={() => {
                  setMode('choose');
                  setError(null);
                  setVerification(null);
                }}
              >
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
              </IconButton>
            </div>
          )}

          {mode === 'email' && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void run('email', () => (isSignUp ? signUpWithEmail(email, password, name) : signInWithEmail(email, password)));
              }}
            >
              {isSignUp && <Input label={t('auth.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
              <Input
                label={t('auth.emailLabel')}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label={t('auth.passwordLabel')}
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" fullWidth loading={busy === 'email'}>
                {isSignUp ? t('auth.signUp') : t('auth.signIn')}
              </Button>
              <div className="flex flex-wrap justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsSignUp((v) => !v)}>
                  {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
                </Button>
                {!isSignUp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!email}
                    onClick={() =>
                      run('reset', async () => {
                        await resetPassword(email);
                        setInfo(t('auth.resetSent', { email }));
                      })
                    }
                  >
                    {t('auth.forgot')}
                  </Button>
                )}
              </div>
            </form>
          )}

          {mode === 'phone' && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!verification)
                  void run('phone', async () =>
                    setVerification(await startPhoneSignIn(phone.replace(/[\s-]/g, ''), 'recaptcha-container')),
                  );
                else void run('code', () => verification.confirm(code.trim()));
              }}
            >
              <Input
                label={t('auth.phoneLabel')}
                hint={t('auth.phoneHint')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                disabled={!!verification}
                onChange={(e) => setPhone(e.target.value)}
              />
              {verification && (
                <>
                  <p className="text-small text-muted">{t('auth.codeSent', { phone })}</p>
                  <Input
                    label={t('auth.codeLabel')}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </>
              )}
              <Button type="submit" fullWidth loading={busy === 'phone' || busy === 'code'}>
                {verification ? t('auth.verify') : t('auth.sendCode')}
              </Button>
              <div id="recaptcha-container" />
            </form>
          )}

          {error && (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-small text-primary">
              {info}
            </p>
          )}
        </Card>

        <p className="mt-6 text-center text-caption text-muted">{t('auth.terms')}</p>
        <p className="mt-2 text-center text-caption text-muted">{t('common.disclaimer')}</p>
      </div>
    </div>
  );
}
