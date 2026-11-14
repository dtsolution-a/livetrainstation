import * as store from '@/lib/server/store';
import { route } from '@/lib/server/http';
import { getSettings, sanitizeSettings, SEO_PAGES } from '@/lib/server/settings';
import { audit } from '@/lib/server/audit';
import { config } from '@/lib/server/config';
import { turnstileEnabled } from '@/lib/server/turnstile';

export const GET = route({ perm: ['seo.read'] }, async () => ({
  settings: getSettings(),
  pages: SEO_PAGES,
  siteUrl: config.siteUrl,
  turnstile: turnstileEnabled(),
}));

export const PUT = route({ perm: ['seo.write'], maxBodyKb: 256 }, async ({ user, ip, json }) => {
  const next = sanitizeSettings(await json());
  // Session length is a security setting: owner/admin only.
  if (!['owner', 'admin'].includes(user.role)) next.security = getSettings().security;
  await store.set('settings', next);
  audit({ user, ip }, 'settings.update', 'SEO & site settings');
  return { settings: getSettings() };
});
