import * as store from '@/lib/server/store';
import { route, bad, type User } from '@/lib/server/http';
import { verifyTotp } from '@/lib/server/security';
import { publicUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const POST = route({ maxBodyKb: 4 }, async ({ user, ip, json }) => {
  const body = await json<{ code?: unknown }>();
  const secret = user.totp?.secret;
  if (!secret) throw bad('Start the setup first.');
  if (!verifyTotp(secret, body.code)) throw bad('That code is not valid. Check the time on your phone and try again.');
  await store.update<User[]>('users', (users) => {
    users.find((x) => x.id === user.id)!.totp!.enabled = true;
  });
  audit({ user, ip }, '2fa.enable', user.email);
  return { user: publicUser(store.get<User[]>('users').find((u) => u.id === user.id)!) };
});
