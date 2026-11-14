import path from 'node:path';

const env = process.env;

/** Runtime data (JSON db, uploads, backups). Keep OUTSIDE the deployed app folder in production. */
export const DATA_DIR = path.resolve(env.DATA_DIR || path.join(process.cwd(), 'data'));
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export const config = {
  isProd: env.NODE_ENV === 'production',
  siteUrl: (env.SITE_URL || 'https://livetrainstation.com').replace(/\/+$/, ''),
  sessionSecret: env.SESSION_SECRET || '',
  sessionHours: Number(env.SESSION_HOURS) || 12,
  adminEmail: (env.ADMIN_EMAIL || '').toLowerCase(),
  adminPassword: env.ADMIN_PASSWORD || '',
  adminName: env.ADMIN_NAME || 'Site Owner',
  maxUploadMb: Number(env.MAX_UPLOAD_MB) || 6,
  turnstileSiteKey: env.TURNSTILE_SITE_KEY || '',
  turnstileSecret: env.TURNSTILE_SECRET_KEY || '',
  /** Upstream railway API. Only the server talks to it (browser goes through /api/rail). */
  railApi: (env.RAIL_API_URL || 'https://squid-app-plx4l.ondigitalocean.app/api').replace(/\/+$/, ''),
  /** Set to "0" if the app is NOT behind Cloudflare / a reverse proxy. */
  trustProxy: env.TRUST_PROXY !== '0',
};

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.livetrainstation.raiilsaathi';
