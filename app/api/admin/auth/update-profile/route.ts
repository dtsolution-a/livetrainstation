import * as store from '@/lib/server/store';
import { route, bad, str, isEmail, type User } from '@/lib/server/http';
import { publicUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const POST = route({ maxBodyKb: 8 }, async ({ user, ip, json }) => {
  const body = await json<{ name?: unknown; email?: unknown }>();
  const name = str(body.name, 80);
  const email = str(body.email, 254).toLowerCase();
  if (name.length < 2) throw bad('Enter your name.');
  if (!isEmail(email)) throw bad('Enter a valid email address.');
  if (store.get<User[]>('users').some((u) => u.email === email && u.id !== user.id)) throw bad('That email is already used by another account.');
  await store.update<User[]>('users', (users) => {
    const u = users.find((x) => x.id === user.id)!;
    u.name = name;
    u.email = email;
  });
  audit({ user, ip }, 'profile.update', email);
  return { user: publicUser(store.get<User[]>('users').find((u) => u.id === user.id)!) };
});
