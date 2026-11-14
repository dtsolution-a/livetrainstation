import { NextResponse } from 'next/server';
import * as store from '@/lib/server/store';
import { route, bad, HttpError, limited, type User } from '@/lib/server/http';
import { hashPassword, verifyPassword, passwordProblem } from '@/lib/server/security';
import { setSession, sessionInfo } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const POST = route({ allowTempPassword: true, maxBodyKb: 8 }, async ({ user, ip, json }) => {
  if (limited(`pw:${user.id}`, 10, 15 * 60 * 1000)) throw new HttpError(429, 'Too many attempts. Try again later.');
  const body = await json<{ current?: unknown; next?: unknown }>();
  const current = typeof body.current === 'string' ? body.current : '';
  const next = typeof body.next === 'string' ? body.next : '';
  if (!verifyPassword(current, user.passwordHash)) throw new HttpError(400, 'Your current password is incorrect.');
  const problem = passwordProblem(next);
  if (problem) throw bad(problem);
  if (verifyPassword(next, user.passwordHash)) throw bad("Choose a password you haven't used before.");

  await store.update<User[]>('users', (users) => {
    const u = users.find((x) => x.id === user.id)!;
    u.passwordHash = hashPassword(next);
    u.mustChangePassword = false;
    u.tokenVersion = (u.tokenVersion || 0) + 1; // signs out other devices
  });
  const fresh = store.get<User[]>('users').find((u) => u.id === user.id)!;
  audit({ user: fresh, ip }, 'password.change', fresh.email);
  return setSession(NextResponse.json(sessionInfo(fresh), { headers: { 'Cache-Control': 'no-store' } }), fresh);
});
