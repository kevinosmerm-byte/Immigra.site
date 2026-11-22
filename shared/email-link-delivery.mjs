// A resend is always an explicit user action. The server remains authoritative.
export const emailLinkCooldownMs = 60000;
export function createEmailLinkDelivery(now = Date.now) {
  let busy = false, retryAt = 0;
  return {
    remaining() { return Math.max(0, Math.ceil((retryAt - now()) / 1000)); },
    async send(request) {
      if (busy || this.remaining()) return {status: 'waiting'};
      busy = true;
      try {
        const result = await request();
        if (result?.error) throw result.error;
        retryAt = now() + emailLinkCooldownMs;
        return {status: 'sent'};
      } catch (error) {
        const limited = error?.status === 429 || error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit';
        if (limited) retryAt = now() + emailLinkCooldownMs;
        return {status: limited ? 'limited' : 'error'};
      } finally { busy = false; }
    }
  };
}
