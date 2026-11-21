import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton, toast } from '../../components/ui';
import { PAGE_KINDS, PageDoc } from '../../domain/appConfig';
import { SUPPORTED_LANGUAGES } from '../../domain/locale';
import { act, errorCode, useAction } from './api';
import { Field, inputCls, Table, Td } from './ui';
import { MediaPicker } from './MediaLibrary';

const blank: PageDoc = { slug: '', kind: 'faq', published: false, order: 0, title: {}, body: {}, seoTitle: {}, seoDescription: {}, imageUrl: null };

/** FAQ, help articles, terms, privacy and tips / blog, per language, with SEO fields. Shown at /p/<slug>. */
export default function PagesEditor() {
  const { t } = useTranslation();
  const r = useAction<{ rows: Array<PageDoc & { id: string }> }>('pages.list', {});
  const [p, setP] = useState<PageDoc | null>(null);
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  if (p) {
    const valid = PageDoc.safeParse(p);
    const setMap = (k: 'title' | 'body' | 'seoTitle' | 'seoDescription', v: string) => setP({ ...p, [k]: { ...p[k], [lang]: v } });
    return (
      <Card className="flex flex-col gap-4" id="page-editor">
        <CardHeader title={p.slug || t('admin.pages.new')} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label={t('admin.pages.slug')} hint={t('admin.pages.slugHint')}>
            <input id="page-slug" className={inputCls} value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
          </Field>
          <Field label={t('admin.pages.kind')}>
            <select className={inputCls} value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as PageDoc['kind'] })}>
              {PAGE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`admin.pages.kinds.${k}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('admin.pages.order')}>
            <input type="number" min={0} className={inputCls} value={p.order} onChange={(e) => setP({ ...p, order: Number(e.target.value) })} />
          </Field>
          <Field label={t('admin.content.language')}>
            <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('admin.pages.title')}>
          <input id="page-title" className={inputCls} maxLength={140} value={p.title[lang] ?? ''} onChange={(e) => setMap('title', e.target.value)} />
        </Field>
        <Field label={t('admin.pages.bodyLabel')} hint={t('admin.pages.bodyHint')}>
          <textarea id="page-body" rows={12} maxLength={20000} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={p.body[lang] ?? ''} onChange={(e) => setMap('body', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label={t('admin.pages.seoTitle')}>
            <input className={inputCls} maxLength={70} value={p.seoTitle[lang] ?? ''} onChange={(e) => setMap('seoTitle', e.target.value)} />
          </Field>
          <Field label={t('admin.pages.seoDescription')}>
            <input className={inputCls} maxLength={160} value={p.seoDescription[lang] ?? ''} onChange={(e) => setMap('seoDescription', e.target.value)} />
          </Field>
        </div>
        <MediaPicker label={t('admin.content.image')} value={p.imageUrl} onChange={(url) => setP({ ...p, imageUrl: url })} />
        <label className="flex items-center gap-3 text-small text-ink">
          <input type="checkbox" checked={p.published} onChange={(e) => setP({ ...p, published: e.target.checked })} className="h-5 w-5" />
          {t('admin.pages.published')}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            id="page-save"
            loading={busy}
            disabled={!valid.success}
            onClick={async () => {
              setBusy(true);
              try {
                await act('pages.save', { page: p });
                toast(t('admin.saved'), 'success');
                setP(null);
                r.reload();
              } catch (e) {
                toast(errorCode(e), 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('admin.save')}
          </Button>
          {p.slug && p.published && (
            <a className="inline-flex min-h-11 items-center rounded-button px-3 text-small font-semibold text-primary-text" href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer">
              {t('admin.pages.view')}
            </a>
          )}
          <Button variant="ghost" onClick={() => setP(null)}>
            {t('common.cancel')}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-4" id="admin-pages">
      <CardHeader title={t('admin.pages.titleList')} subtitle={t('admin.pages.body')} action={<Button size="sm" id="page-new" onClick={() => setP(blank)}>{t('admin.pages.new')}</Button>} />
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.pages.none')} />
      ) : (
        <Table head={[t('admin.pages.title'), t('admin.pages.kind'), t('admin.finance.status'), '']} label={t('admin.pages.titleList')}>
          {r.data.rows.map((x) => (
            <tr key={x.slug}>
              <Td>{x.title.en ?? x.slug}</Td>
              <Td>{t(`admin.pages.kinds.${x.kind}`)}</Td>
              <Td>
                <Badge tone={x.published ? 'primary' : 'neutral'}>{x.published ? t('admin.pages.published') : t('admin.pages.draft')}</Badge>
              </Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => setP(PageDoc.parse(x))}>
                  {t('admin.edit')}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
