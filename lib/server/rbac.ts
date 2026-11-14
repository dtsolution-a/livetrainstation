export const PERMISSIONS = [
  'dashboard.read',
  'posts.read', 'posts.write', 'posts.publish', 'posts.delete',
  'media.read', 'media.write', 'media.delete',
  'seo.read', 'seo.write',
  'settings.read', 'settings.write',
  'users.manage',
  'audit.read',
  'backup.manage',
] as const;
export type Perm = (typeof PERMISSIONS)[number];

const without = (list: readonly Perm[], ...drop: Perm[]) => list.filter((p) => !drop.includes(p));

export const ROLES: Record<string, { label: string; description: string; permissions: readonly Perm[] }> = {
  owner: { label: 'Owner', description: 'Full control, including users, backups and security.', permissions: PERMISSIONS },
  admin: { label: 'Admin', description: 'Everything except users and backups.', permissions: without(PERMISSIONS, 'users.manage', 'backup.manage') },
  editor: {
    label: 'Editor',
    description: 'Write and publish blog posts, upload media, edit SEO.',
    permissions: ['dashboard.read', 'posts.read', 'posts.write', 'posts.publish', 'media.read', 'media.write', 'seo.read', 'seo.write', 'settings.read'],
  },
  writer: {
    label: 'Writer',
    description: 'Write drafts and upload media; cannot publish.',
    permissions: ['dashboard.read', 'posts.read', 'posts.write', 'media.read', 'media.write'],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access.',
    permissions: ['dashboard.read', 'posts.read', 'media.read', 'seo.read'],
  },
};

export const roleList = Object.keys(ROLES);
export const permissionsFor = (role: string): readonly Perm[] => ROLES[role]?.permissions ?? [];
export const can = (user: { role: string } | null | undefined, perm: Perm) => Boolean(user && permissionsFor(user.role).includes(perm));
