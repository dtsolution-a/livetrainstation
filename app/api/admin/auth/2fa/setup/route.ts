import QRCode from 'qrcode';
import * as store from '@/lib/server/store';
import { route, bad, type User } from '@/lib/server/http';
import { newTotpSecret, totpUri } from '@/lib/server/security';

export const POST = route({}, async ({ user }) => {
  if (user.totp?.enabled) throw bad('Two-step verification is already on.');
  const secret = newTotpSecret();
  await store.update<User[]>('users', (users) => {
    users.find((x) => x.id === user.id)!.totp = { secret, enabled: false };
  });
  const uri = totpUri(secret, user.email);
  return { secret, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
});
