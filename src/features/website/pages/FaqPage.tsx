import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, Reveal, spring } from '../ui';
import { list } from '../i18n';
import { cn } from '../../../components/ui/cn';

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="rounded-3xl border border-line bg-surface shadow-soft">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-start text-body font-semibold text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          {q}
          <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} aria-hidden />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={id} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
            <p className="px-5 pb-5 text-body text-muted">{a}</p>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function FaqPage() {
  const { t } = useTranslation();
  const items = list<{ q: string; a: string }>(t, 'site.faq.items');
  const [open, setOpen] = useState<number | null>(0);
  return (
    <WebsiteLayout metaKey="faq" path="/faq">
      <section className="site-mesh -mt-20 pt-32 pb-10 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.faq.title')}</h1>
          <p className="text-lg text-muted">
            {t('site.faq.subtitle')}{' '}
            <Link to="/contact" className="font-semibold text-primary-text underline-offset-2 hover:underline">
              {t('site.faq.contactLink')}
            </Link>
          </p>
        </Container>
      </section>
      <Container className="max-w-3xl py-10">
        <Reveal>
          <ul className="flex flex-col gap-3">
            {items.map((it, i) => (
              <Item key={it.q} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </ul>
        </Reveal>
      </Container>
    </WebsiteLayout>
  );
}
