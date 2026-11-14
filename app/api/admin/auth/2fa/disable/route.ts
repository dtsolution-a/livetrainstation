import * as store from '@/lib/server/store';
import { route, bad, type User } from '@/lib/server/http';
import { verifyPassword, verifyTotp } from '@/lib/server/security';
import { publicUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const POST = route({ maxBodyKb: 4 }, async ({ user, ip, json }) => {
  const body = await json<{ password?: unknown; code?: unknown }>();
  if (!verifyPassword(String(body.password || ''), user.passwordHash)) throw bad('Password is incorrect.');
  if (user.totp?.enabled && !verifyTotp(user.totp.secret, body.code)) throw bad('That code is not valid.');
  await store.update<User[]>('users', (users) => {
    delete users.find((x) => x.id === user.id)!.totp;
  });
  audit({ user, ip }, '2fa.disable', user.email);
  return { user: publicUser(store.get<User[]>('users').find((u) => u.id === user.id)!) };
});
