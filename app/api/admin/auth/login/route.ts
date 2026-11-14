import { NextResponse } from 'next/server';
import * as store from '@/lib/server/store';
import { route, HttpError, bad, str, limited, type User } from '@/lib/server/http';
import { hashPassword, verifyPassword, verifyTotp } from '@/lib/server/security';
import { setSession, sessionInfo } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { verifyTurnstile } from '@/lib/server/turnstile';

// Per-account lockout on top of the per-IP limit.
const g = globalThis as unknown as { __lsFails?: Map<string, { n: number; until: number }> };
const fails = (g.__lsFails ??= new Map());
const MAX_FAILS = 6;
const LOCK_MS = 15 * 60 * 1000;

const lockedFor = (key: string) => {
  const f = fails.get(key);
  if (!f?.until) return 0;
  if (f.until > Date.now()) return f.until - Date.now();
  fails.delete(key);
  return 0;
};
const noteFail = (key: string) => {
  const f = fails.get(key) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= MAX_FAILS) { f.until = Date.now() + LOCK_MS; f.n = 0; }
  fails.set(key, f);
};

// Burn the same CPU for unknown accounts so timing doesn't reveal which emails exist.
const DUMMY = hashPassword('not-a-real-password-for-timing');

export const POST = route({ public: true, maxBodyKb: 8 }, async ({ ip, json }) => {
  if (limited(`login:${ip}`, 20, 15 * 60 * 1000)) {
    throw new HttpError(429, 'Too many sign-in attempts. Please wait a few minutes and try again.');
  }
  const body = await json<{ email?: unknown; password?: unknown; code?: unknown; turnstile?: unknown }>();
  const email = str(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password.slice(0, 300) : '';
  const code = str(body.code, 12);
  if (!email || !password) throw bad('Enter your email and password.');

  const t = await verifyTurnstile(body.turnstile, ip);
  if (!t.ok) throw new HttpError(400, t.reason || 'Bot check failed.');

  const wait = lockedFor(email);
  if (wait) throw new HttpError(429, `Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minute(s).`);

  const user = store.get<User[]>('users').find((u) => u.email === email);
  const passOk = verifyPassword(password, user ? user.passwordHash : DUMMY) && !!user && user.active !== false;
  if (!passOk || !user) {
    noteFail(email);
    audit({ ip }, 'login.failed', email);
    throw new HttpError(401, 'Incorrect email or password.');
  }

  if (user.totp?.enabled) {
    if (!code) return { needs2fa: true };
    if (!verifyTotp(user.totp.secret, code)) {
      noteFail(email);
      audit({ ip }, 'login.2fa-failed', email);
      throw new HttpError(401, 'That verification code is not valid.');
    }
  }

  fails.delete(email);
  await store.update<User[]>('users', (users) => {
    const u = users.find((x) => x.id === user.id)!;
    u.lastLoginAt = new Date().toISOString();
    u.lastLoginIp = ip;
  });
  const fresh = store.get<User[]>('users').find((u) => u.id === user.id)!;
  audit({ user: fresh, ip }, 'login', fresh.email);
  return setSession(NextResponse.json(sessionInfo(fresh), { headers: { 'Cache-Control': 'no-store' } }), fresh);
});
