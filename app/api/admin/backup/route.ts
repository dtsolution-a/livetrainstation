import * as store from '@/lib/server/store';
import { route } from '@/lib/server/http';
import { audit } from '@/lib/server/audit';
import type { User } from '@/lib/server/http';

/** Download a full JSON export (password hashes & 2FA secrets are stripped). */
export const POST = route({ perm: ['backup.manage'] }, async ({ user, ip }) => {
  const snap = store.snapshot() as Record<string, unknown>;
  snap.users = (snap.users as User[]).map(({ passwordHash: _p, totp: _t, tokenVersion: _v, ...u }) => u);
  audit({ user, ip }, 'backup.export');
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), data: snap }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="livetrainstation-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
