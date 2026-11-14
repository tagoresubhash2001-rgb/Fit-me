import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { requireFeature } from '../lib/entitlements';
import { consume } from '../lib/rateLimit';
import { dailyLimit } from '../lib/limits';
import { loadUserContext, summarizeContext } from './context';
import { systemPrompt, type Coach } from './personas';
import { SAFETY_RULES, isUrgent, stripEmojis, URGENT_REPLY } from './safety';
import { provider, GEMINI_API_KEY } from './runtime';
import { AIUnavailableError, type ChatTurn } from './provider';

export const CoachInput = z.object({
  threadId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  coach: z.enum(['jai', 'jaya']),
  message: z.string().trim().min(1).max(2000),
});

/**
 * Jai & Jaya chat (Pro). The server loads the user's real data, applies safety rules,
 * calls the model, and stores both messages in users/{uid}/aiThreads/{threadId}/messages.
 * Nothing in a chat is ever written as a health record.
 */
export const coachChat = onCall(callableOptions({ secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '512MiB' }), async (req) => {
  const uid = requireAuth(req);
  const parsed = CoachInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_input');
  const { threadId, coach, message } = parsed.data;

  const plan = await requireFeature(uid, 'coachChat');
  await consume(uid, 'coachChat', await dailyLimit('coachChat', plan));

  const threadRef = db().doc(`users/${uid}/aiThreads/${threadId}`);
  const messages = threadRef.collection('messages');
  const ctx = await loadUserContext(uid);
  const language = (ctx.profile?.language as string) || 'en';

  await messages.add({ role: 'user', text: message, coach, createdAt: FieldValue.serverTimestamp() });

  let reply: string;
  let status: 'ok' | 'urgent' = 'ok';
  if (isUrgent(message)) {
    status = 'urgent';
    reply = URGENT_REPLY[language] ?? URGENT_REPLY.en;
  } else {
    const history = await messages.orderBy('createdAt', 'desc').limit(12).get();
    const turns: ChatTurn[] = history.docs
      .map((d) => d.data())
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, text: String(m.text) }));
    try {
      reply = stripEmojis(await provider().generate({ system: systemPrompt(coach as Coach, language, summarizeContext(ctx), SAFETY_RULES), turns }));
    } catch (e) {
      logger.warn('coachChat provider failure', { uid, error: (e as Error).message });
      if (e instanceof AIUnavailableError) throw new HttpsError('unavailable', 'ai_unavailable');
      throw e;
    }
  }

  await messages.add({ role: 'assistant', text: reply, coach, status, createdAt: FieldValue.serverTimestamp() });
  await threadRef.set({ uid, coach, updatedAt: FieldValue.serverTimestamp(), lastMessage: reply.slice(0, 140) }, { merge: true });
  await db().collection('aiUsage').add({ uid, feature: 'coachChat', plan, status, at: FieldValue.serverTimestamp() });
  return { reply, status };
});
