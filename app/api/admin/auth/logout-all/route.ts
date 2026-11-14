import { NextResponse } from 'next/server';
import * as store from '@/lib/server/store';
import { route, type User } from '@/lib/server/http';
import { clearSession } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

/** Sign out everywhere: invalidates every existing session of this account. */
export const POST = route({}, async ({ user, ip }) => {
  await store.update<User[]>('users', (users) => {
    const u = users.find((x) => x.id === user.id)!;
    u.tokenVersion = (u.tokenVersion || 0) + 1;
  });
  audit({ user, ip }, 'logout-all', user.email);
  return clearSession(NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }));
});
