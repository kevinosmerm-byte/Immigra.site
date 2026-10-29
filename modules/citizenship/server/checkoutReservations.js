import { createHash } from 'node:crypto';

const unavailable = () => Object.assign(new Error('Checkout needs reconciliation.'), { code: 'checkout_unavailable' });
// This coordinator never releases an uncertain attempt: a timeout may have
// created a payable session. Only Stripe-confirmed expiry permits rotation.
export async function reservedCheckout({ scope, payload, reserve, save, create, retrieve, now = Date.now }) {
  const scopeHash = createHash('sha256').update(`immigra-checkout-v1:${scope}`).digest('hex');
  let attempt = await reserve(scopeHash, payload);
  if (attempt.session_id) {
    const prior = await retrieve(attempt.session_id);
    if (prior.id !== attempt.session_id) throw unavailable();
    if (prior.status === 'open' && prior.url) {
      if (attempt.payload?.metadata?.interval !== payload.metadata?.interval) throw Object.assign(unavailable(), { code: 'checkout_in_progress' });
      return prior;
    }
    if (prior.status !== 'expired') throw Object.assign(unavailable(), { code: 'subscription_already_active' });
    attempt = await reserve(scopeHash, payload, prior.id);
    // A competing request may already have rotated and saved the next session.
    if (attempt.session_id) {
      const current = await retrieve(attempt.session_id);
      if (current.id === attempt.session_id && current.status === 'open' && current.url) {
        if (attempt.payload?.metadata?.interval !== payload.metadata?.interval) throw Object.assign(unavailable(), { code: 'checkout_in_progress' });
        return current;
      }
      throw unavailable();
    }
  }
  if (attempt.payload?.metadata?.interval !== payload.metadata?.interval) throw Object.assign(unavailable(), { code: 'checkout_in_progress' });
  // Stripe may discard keys after 24h. Never retry an unresolved older attempt.
  if (!attempt.attempt_id || !attempt.payload || !Number.isFinite(Date.parse(attempt.created_at))
      || now() - Date.parse(attempt.created_at) >= 23 * 60 * 60 * 1000) throw unavailable();
  const session = await create(attempt.payload, { idempotencyKey: `immigra-checkout-v1:${attempt.attempt_id}` });
  if (!session.id || !session.url || session.status !== 'open') throw unavailable();
  await save(scopeHash, attempt.attempt_id, session.id);
  return session;
}
