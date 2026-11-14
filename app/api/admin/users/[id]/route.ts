import * as store from '@/lib/server/store';
import { route, bad, notFound, type User } from '@/lib/server/http';
import { hashPassword, randomPassword } from '@/lib/server/security';
import { roleList } from '@/lib/server/rbac';
import { publicUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

type P = { id: string };
const find = (id: string) => store.get<User[]>('users').find((u) => u.id === id);
const activeOwners = () => store.get<User[]>('users').filter((u) => u.role === 'owner' && u.active !== false);

export const PUT = route<P>({ perm: ['users.manage'], maxBodyKb: 8 }, async ({ user, ip, params, json }) => {
  const target = find(params.id);
  if (!target) throw notFound('User not found.');
  const body = await json<{ role?: unknown; active?: unknown; resetPassword?: unknown }>();

  if (target.role === 'owner' && user.role !== 'owner') throw bad('Only an owner can change an owner account.');
  const role = body.role === undefined ? target.role : String(body.role);
  if (!roleList.includes(role)) throw bad('Unknown role.');
  if (role === 'owner' && user.role !== 'owner') throw bad('Only an owner can promote to owner.');
  const active = body.active === undefined ? target.active !== false : body.active === true;

  // Never lock the site out of its last owner.
  const losesOwner = target.role === 'owner' && (role !== 'owner' || !active);
  if (losesOwner && activeOwners().length <= 1) throw bad('There must be at least one active owner.');
  if (target.id === user.id && !active) throw bad("You can't deactivate your own account.");

  let temporaryPassword: string | undefined;
  await store.update<User[]>('users', (list) => {
    const u = list.find((x) => x.id === target.id)!;
    u.role = role;
    u.active = active;
    if (!active || role !== target.role) u.tokenVersion = (u.tokenVersion || 0) + 1; // kicks active sessions
    if (body.resetPassword === true) {
      temporaryPassword = randomPassword();
      u.passwordHash = hashPassword(temporaryPassword);
      u.mustChangePassword = true;
      u.tokenVersion = (u.tokenVersion || 0) + 1;
      delete u.totp;
    }
  });
  audit({ user, ip }, 'user.update', target.email, `role=${role} active=${active}${temporaryPassword ? ' password-reset' : ''}`);
  return { user: publicUser(find(target.id)!), temporaryPassword };
});

export const DELETE = route<P>({ perm: ['users.manage'] }, async ({ user, ip, params }) => {
  const target = find(params.id);
  if (!target) throw notFound('User not found.');
  if (target.id === user.id) throw bad("You can't delete your own account.");
  if (target.role === 'owner' && (user.role !== 'owner' || activeOwners().length <= 1)) throw bad("This owner account can't be deleted.");
  await store.update<User[]>('users', (list) => list.filter((u) => u.id !== target.id));
  audit({ user, ip }, 'user.delete', target.email);
  return { ok: true };
});
