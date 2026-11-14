import { onRequest } from 'firebase-functions/v2/https';

/** Health check used by uptime monitoring and CI smoke tests. */
export const healthCheck = onRequest({ region: 'asia-south1', cors: false }, (_req, res) => {
  res.status(200).json({ ok: true, service: 'fitmeai-functions', time: new Date().toISOString() });
});
