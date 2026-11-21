import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, Skeleton } from '../../components/ui';
import { localized, type PageDoc } from '../../domain/appConfig';
import { getPage } from '../../data/pages';

/** Plain text with blank-line paragraphs, "# " headings and "- " lists (no HTML is ever rendered). */
export function PageBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        if (b.startsWith('# ')) return <h2 key={i} className="text-title text-ink">{b.slice(2)}</h2>;
        const lines = b.split('\n');
        if (lines.every((l) => l.startsWith('- ')))
          return (
            <ul key={i} className="list-disc ps-5 text-body text-ink">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="whitespace-pre-wrap text-body text-ink">
            {b}
          </p>
        );
      })}
    </div>
  );
}

/** /p/:slug — a published page, readable without an account (terms, privacy, help, tips). */
export default function PageView() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<PageDoc | null | undefined>(undefined);
  useEffect(() => {
    getPage(slug)
      .then(setPage)
      .catch(() => setPage(null));
  }, [slug]);
  useEffect(() => {
    if (!page) return;
    const title = localized(page.seoTitle, i18n.language) || localized(page.title, i18n.language);
    if (title) document.title = `${title} · FitMe`;
    const desc = localized(page.seoDescription, i18n.language);
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (desc) {
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = desc;
    }
  }, [page, i18n.language]);
  return (
    <div className="min-h-dvh bg-canvas px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Link to="/" className="text-small font-semibold text-primary-text">
          FitMe
        </Link>
        {page === undefined ? (
          <Skeleton className="h-64" />
        ) : page === null ? (
          <EmptyState title={t('pages.notFound')} description={t('pages.notFoundBody')} />
        ) : (
          <Card className="flex flex-col gap-4" id="page-view">
            {page.imageUrl && <img src={page.imageUrl} alt="" className="w-full rounded-card object-cover" loading="lazy" />}
            <h1 className="text-display text-ink">{localized(page.title, i18n.language)}</h1>
            <PageBody text={localized(page.body, i18n.language) ?? ''} />
          </Card>
        )}
      </div>
    </div>
  );
}
