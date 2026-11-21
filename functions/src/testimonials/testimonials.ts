import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { bucket, db } from '../lib/admin';
import { requireEnabled } from '../lib/features';
import { callableOptions, requireAuth } from '../lib/callable';
import { logAdmin, requireSection } from '../lib/staff';

/**
 * Testimonials. Workflow: pending -> approved | rejected | changes_requested; changes_requested -> pending (edit
 * and resubmit); approved -> unpublished by staff or withdrawn by the user. Private data and photos stay in
 * `testimonials/{id}` and Storage `testimonials/{uid}/{id}/`, readable only by the author and staff. Only an
 * approval copies the published fields and photos to `publicTestimonials/{id}` and `public/testimonials/{id}/`.
 */
export type TStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'withdrawn' | 'unpublished';

const text = (max: number, min = 0) => z.string().trim().min(min).max(max);
export const TestimonialInput = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/),
  displayName: text(60, 1),
  experience: text(1500, 20),
  testimonial: text(600, 20),
  journey: text(2000).optional().default(''),
  details: z
    .object({
      durationWeeks: z.number().int().min(1).max(520).optional(),
      weightChangeKg: z.number().min(-200).max(200).optional(),
      goal: text(120).optional(),
      age: z.number().int().min(13).max(110).optional(),
      location: text(80).optional(),
    })
    .default({}),
  hasBefore: z.boolean(),
  hasAfter: z.boolean(),
  consent: z.literal(true),
});
export type TestimonialInput = z.infer<typeof TestimonialInput>;

export const photoPath = (uid: string, id: string, which: 'before' | 'after') => `testimonials/${uid}/${id}/${which}.jpg`;
export const publicPhotoPath = (id: string, which: 'before' | 'after') => `public/testimonials/${id}/${which}.jpg`;

/** Allowed status changes (pure, unit tested). */
export function canTransition(from: TStatus | null, to: TStatus, by: 'user' | 'staff'): boolean {
  if (by === 'user') {
    if (to === 'pending') return from === null || from === 'changes_requested' || from === 'pending';
    if (to === 'withdrawn') return from !== null && from !== 'withdrawn';
    return false;
  }
  if (to === 'approved' || to === 'rejected' || to === 'changes_requested') return from === 'pending' || from === 'approved' || from === 'unpublished';
  if (to === 'unpublished') return from === 'approved';
  return false;
}

async function fileExists(path: string): Promise<boolean> {
  const [ok] = await bucket().file(path).exists();
  return ok;
}

/** Create or resubmit (after "changes requested"). Always lands as pending; never public until approved. */
export const submitTestimonial = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  await requireEnabled('testimonials');
  const parsed = TestimonialInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_testimonial', { issues: parsed.error.issues.map((i) => i.path.join('.')) });
  const t = parsed.data;
  const ref = db().doc(`testimonials/${t.id}`);
  const snap = await ref.get();
  const prev = snap.exists ? (snap.data() as { uid: string; status: TStatus }) : null;
  if (prev && prev.uid !== uid) throw new HttpsError('permission-denied', 'not_yours');
  if (!canTransition(prev?.status ?? null, 'pending', 'user')) throw new HttpsError('failed-precondition', 'not_editable');
  const [before, after] = await Promise.all([
    t.hasBefore ? fileExists(photoPath(uid, t.id, 'before')) : Promise.resolve(false),
    t.hasAfter ? fileExists(photoPath(uid, t.id, 'after')) : Promise.resolve(false),
  ]);
  if (t.hasBefore !== before || t.hasAfter !== after) throw new HttpsError('failed-precondition', 'photos_missing');
  if (!prev) {
    const open = await db().collection('testimonials').where('uid', '==', uid).where('status', 'in', ['pending', 'changes_requested']).count().get();
    if (open.data().count >= 3) throw new HttpsError('resource-exhausted', 'too_many_open');
  }
  const user = (await db().doc(`users/${uid}`).get()).data() ?? {};
  await ref.set(
    {
      id: t.id,
      uid,
      status: 'pending',
      displayName: t.displayName,
      experience: t.experience,
      testimonial: t.testimonial,
      journey: t.journey,
      details: t.details,
      beforePath: before ? photoPath(uid, t.id, 'before') : null,
      afterPath: after ? photoPath(uid, t.id, 'after') : null,
      userPhotoURL: typeof user.photoURL === 'string' ? user.photoURL : null,
      consent: true,
      consentAt: FieldValue.serverTimestamp(),
      adminNote: prev ? FieldValue.delete() : null,
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(prev ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  return { status: 'pending' as const };
});

async function unpublish(id: string) {
  await db().doc(`publicTestimonials/${id}`).delete();
  await Promise.all((['before', 'after'] as const).map((w) => bucket().file(publicPhotoPath(id, w)).delete({ ignoreNotFound: true })));
}

/** The author withdraws consent: removed from public display at once; staff can no longer publish it. */
export const withdrawTestimonial = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const id = z.string().regex(/^[A-Za-z0-9_-]{8,40}$/).safeParse((req.data as { id?: unknown })?.id);
  if (!id.success) throw new HttpsError('invalid-argument', 'bad_request');
  const ref = db().doc(`testimonials/${id.data}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('uid') !== uid) throw new HttpsError('not-found', 'not_found');
  if (!canTransition(snap.get('status'), 'withdrawn', 'user')) throw new HttpsError('failed-precondition', 'already_withdrawn');
  await unpublish(id.data);
  await ref.update({ status: 'withdrawn', consent: false, consentWithdrawnAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { status: 'withdrawn' as const };
});

const ReviewInput = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/),
  decision: z.enum(['approve', 'reject', 'request_changes', 'unpublish']),
  note: z.string().trim().max(1000).optional(),
  /** Staff edits to the published text (typos, length). The author's original stays in the record. */
  edits: z.object({ displayName: text(60, 1).optional(), testimonial: text(600, 20).optional(), experience: text(1500, 20).optional() }).optional(),
  featured: z.boolean().optional(),
});

const TO: Record<z.infer<typeof ReviewInput>['decision'], TStatus> = { approve: 'approved', reject: 'rejected', request_changes: 'changes_requested', unpublish: 'unpublished' };

/** Staff review (moderator and above). Every decision is logged; approval is the only path to public display. */
export const reviewTestimonial = onCall(callableOptions({ timeoutSeconds: 60 }), async (req) => {
  const actor = await requireSection(req, 'testimonials');
  const parsed = ReviewInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { id, decision, note, edits, featured } = parsed.data;
  const ref = db().doc(`testimonials/${id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'not_found');
  const t = snap.data() as Record<string, unknown> & { uid: string; status: TStatus; consent: boolean; beforePath: string | null; afterPath: string | null };
  const to = TO[decision];
  if (!canTransition(t.status, to, 'staff')) throw new HttpsError('failed-precondition', 'bad_transition', { from: t.status, to });
  if (decision === 'request_changes' && !note) throw new HttpsError('invalid-argument', 'note_required');
  if (to === 'approved' && !t.consent) throw new HttpsError('failed-precondition', 'no_consent');

  if (to === 'approved') {
    const published: Record<string, unknown> = {
      id,
      displayName: edits?.displayName ?? t.displayName,
      testimonial: edits?.testimonial ?? t.testimonial,
      experience: edits?.experience ?? t.experience,
      journey: t.journey ?? '',
      details: t.details ?? {},
      userPhotoURL: t.userPhotoURL ?? null,
      featured: featured ?? false,
      beforeURL: null,
      afterURL: null,
      approvedAt: FieldValue.serverTimestamp(),
    };
    for (const which of ['before', 'after'] as const) {
      const src = which === 'before' ? t.beforePath : t.afterPath;
      if (!src) continue;
      const dest = bucket().file(publicPhotoPath(id, which));
      await bucket().file(src).copy(dest);
      await dest.setMetadata({ contentType: 'image/jpeg', cacheControl: 'public, max-age=86400' });
      published[`${which}URL`] = publicPhotoPath(id, which);
    }
    await db().doc(`publicTestimonials/${id}`).set(published);
  } else {
    await unpublish(id);
  }
  const after = { status: to, adminNote: note ?? null, ...(edits ? { edits } : {}) };
  await ref.update({ ...after, reviewedBy: actor.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await logAdmin(actor, `testimonial.${decision}`, { type: 'testimonial', id }, { status: t.status }, after, note);
  return { status: to };
});
