import { config } from './config';

export const turnstileEnabled = () => Boolean(config.turnstileSiteKey && config.turnstileSecret);

/** Verifies a Cloudflare Turnstile token. When Turnstile isn't configured it is skipped. */
export async function verifyTurnstile(token: unknown, ip: string): Promise<{ ok: boolean; reason?: string }> {
  if (!turnstileEnabled()) return { ok: true };
  if (typeof token !== 'string' || !token || token.length > 2048) return { ok: false, reason: 'Please complete the bot check.' };
  try {
    const body = new URLSearchParams({ secret: config.turnstileSecret, response: token });
    if (ip && ip !== '0.0.0.0') body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, reason: 'Bot check failed. Please try again.' };
  } catch {
    return { ok: false, reason: 'Could not verify the bot check. Please try again.' };
  }
}
