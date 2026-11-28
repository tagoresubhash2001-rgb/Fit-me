import { appPath } from '../lib/appPaths';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Home } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { isChunkLoadError, reportError } from '../lib/errors';

interface State {
  error: unknown;
}

/** One per route: a crash shows a friendly retry screen inside the shell instead of a blank page. */
export class RouteErrorBoundary extends React.Component<{ children: React.ReactNode; resetKey: string }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }
  componentDidCatch(error: unknown) {
    reportError(error, 'route', true);
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorScreen chunk={isChunkLoadError(this.state.error)} onRetry={() => this.setState({ error: null })} />;
  }
}

function ErrorScreen({ chunk, onRetry }: { chunk: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Card id="route-error" className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 text-center" role="alert">
      <RefreshCw className="h-8 w-8 text-primary-text" strokeWidth={1.75} />
      <h1 className="text-title text-ink">{chunk ? t('errors.newVersionTitle') : t('errors.screenTitle')}</h1>
      <p className="text-body text-muted">{chunk ? t('errors.newVersionBody') : t('errors.screenBody')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => (chunk ? window.location.reload() : onRetry())}>{chunk ? t('errors.reload') : t('common.retry')}</Button>
        <Button variant="secondary" icon={<Home className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => (window.location.href = appPath('/'))}>
          {t('nav.home')}
        </Button>
      </div>
    </Card>
  );
}
