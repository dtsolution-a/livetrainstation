import * as store from '@/lib/server/store';
import { route, bad, str, isEmail, type User } from '@/lib/server/http';
import { hashPassword, passwordProblem, randomPassword } from '@/lib/server/security';
import { roleList, ROLES } from '@/lib/server/rbac';
import { publicUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

export const GET = route({ perm: ['users.manage'] }, async () => ({
  users: store.get<User[]>('users').map(publicUser),
  roles: Object.fromEntries(roleList.map((r) => [r, { label: ROLES[r].label, description: ROLES[r].description }])),
}));

export const POST = route({ perm: ['users.manage'], maxBodyKb: 8 }, async ({ user, ip, json }) => {
  const body = await json<{ email?: unknown; name?: unknown; role?: unknown; password?: unknown }>();
  const email = str(body.email, 254).toLowerCase();
  const name = str(body.name, 80);
  const role = String(body.role);
  if (!isEmail(email)) throw bad('Enter a valid email address.');
  if (name.length < 2) throw bad('Enter a name.');
  if (!roleList.includes(role)) throw bad('Choose a role.');
  if (role === 'owner' && user.role !== 'owner') throw bad('Only an owner can create another owner.');
  if (store.get<User[]>('users').some((u) => u.email === email)) throw bad('That email already has an account.');

  const supplied = typeof body.password === 'string' && body.password ? body.password : '';
  if (supplied) { const p = passwordProblem(supplied); if (p) throw bad(p); }
  const password = supplied || randomPassword();
  const created: User = {
    id: store.newId(), email, name, role, active: true,
    passwordHash: hashPassword(password), mustChangePassword: true, tokenVersion: 0,
    createdAt: new Date().toISOString(),
  };
  await store.update<User[]>('users', (list) => { list.push(created); });
  audit({ user, ip }, 'user.create', email, role);
  // The temporary password is shown once, here, and never stored in readable form.
  return { user: publicUser(created), temporaryPassword: password };
});
