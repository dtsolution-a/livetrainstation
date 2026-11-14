import { NextResponse } from 'next/server';
import { route, userFromRequest } from '@/lib/server/http';
import { clearSession } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const POST = route({ public: true }, async ({ req, ip }) => {
  const user = userFromRequest(req);
  if (user) audit({ user, ip }, 'logout', user.email);
  return clearSession(NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }));
});
