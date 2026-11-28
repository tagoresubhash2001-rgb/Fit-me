import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Quote } from 'lucide-react';
import { db } from '../../lib/firebase';
import { Container, Reveal, SectionHeading } from './ui';

interface Story {
  id: string;
  displayName: string;
  testimonial: string;
}

/**
 * Member stories: only testimonials a member submitted, consented to and staff approved (publicTestimonials,
 * written by the reviewTestimonial function). Nothing is shown when there are none, never placeholder reviews.
 */
export function Stories() {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  useEffect(() => {
    let live = true;
    getDocs(query(collection(db(), 'publicTestimonials'), orderBy('approvedAt', 'desc'), limit(6)))
      .then((snap) => {
        if (!live) return;
        setStories(
          snap.docs
            .map((d) => ({ id: d.id, displayName: String(d.get('displayName') ?? ''), testimonial: String(d.get('testimonial') ?? '') }))
            .filter((s) => s.displayName && s.testimonial),
        );
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!stories.length) return null;
  return (
    <section aria-labelledby="stories-title" className="py-16" id="stories">
      <Container>
        <SectionHeading id="stories-title" title={t('site.home.storiesTitle')} subtitle={t('site.home.storiesSubtitle')} />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 0.06} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <Quote className="h-6 w-6 text-brand" strokeWidth={1.9} aria-hidden />
              <blockquote className="flex-1 text-body text-ink">{s.testimonial}</blockquote>
              <p className="flex items-center gap-3 text-small font-semibold text-ink">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
                  {s.displayName.slice(0, 1).toUpperCase()}
                </span>
                {s.displayName}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
