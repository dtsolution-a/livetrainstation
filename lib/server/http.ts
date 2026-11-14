import { NextRequest, NextResponse } from 'next/server';
import { config } from './config';
import { verifyToken } from './security';
import { can, type Perm } from './rbac';
import * as store from './store';
import { ensureReady } from './bootstrap';

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}
export const bad = (msg: string, extra?: Record<string, unknown>) => new HttpError(400, msg, extra);
export const forbidden = (msg = "You don't have permission to do that.") => new HttpError(403, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);

/* ---------- helpers ---------- */

export const str = (v: unknown, max = 500) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

export const isEmail = (s: string) =>
  /^[^\s@<>()[\]\\,;:]+@[^\s@<>()[\]\\,;:]+\.[^\s@<>()[\]\\,;:]{2,}$/.test(s) && s.length <= 254;

export const slugify = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

export function clientIp(req: Request): string {
  const h = req.headers;
  if (config.trustProxy) {
    const cf = h.get('cf-connecting-ip');
    if (cf) return cf.trim();
    const xff = h.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    const real = h.get('x-real-ip');
    if (real) return real.trim();
  }
  return '0.0.0.0';
}

/* ---------- in-memory rate limiter (per process) ---------- */

const gl = globalThis as unknown as { __lsRate?: Map<string, { n: number; reset: number }> };
const buckets = (gl.__lsRate ??= new Map());

/** Returns true when the caller is over the limit. */
export function limited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > limit;
}

/* ---------- sessions / users ---------- */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active?: boolean;
  passwordHash: string;
  mustChangePassword?: boolean;
  tokenVersion?: number;
  totp?: { secret: string; enabled: boolean };
  createdAt: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string;
}

export const COOKIE_SECURE = config.isProd;
export const COOKIE_NAME = COOKIE_SECURE ? '__Host-ls_admin' : 'ls_admin';

export function userFromRequest(req: NextRequest): User | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token && verifyToken(token);
  if (!payload) return null;
  const user = store.get<User[]>('users').find((u) => u.id === payload.u);
  if (!user || user.active === false || (user.tokenVersion || 0) !== payload.v) return null;
  return user;
}

function csrfCheck(req: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  if (req.headers.get('x-requested-with') !== 'ls-admin') throw forbidden('Missing security header.');
  const origin = req.headers.get('origin');
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { /* fallthrough */ }
    const allowed = new Set<string>();
    const reqHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (reqHost) allowed.add(reqHost);
    try { allowed.add(new URL(config.siteUrl).host); } catch { /* ignore */ }
    if (!allowed.has(host)) throw forbidden('Cross-site request blocked.');
  }
}

/* ---------- route wrapper ---------- */

export interface Ctx<P = Record<string, string>> {
  req: NextRequest;
  ip: string;
  user: User;
  params: P;
  json: <T = Record<string, unknown>>() => Promise<T>;
}
interface Opts { perm?: Perm[]; public?: boolean; allowTempPassword?: boolean; maxBodyKb?: number }

export function route<P = Record<string, string>>(opts: Opts, fn: (ctx: Ctx<P>) => Promise<Response | object>) {
  return async (req: NextRequest, rc: { params: Promise<P> }): Promise<Response> => {
    try {
      await ensureReady();
      const ip = clientIp(req);
      csrfCheck(req);
      let user: User | null = null;
      if (!opts.public) {
        user = userFromRequest(req);
        if (!user) throw new HttpError(401, 'Please sign in.');
        if (user.mustChangePassword && !opts.allowTempPassword) {
          throw new HttpError(403, 'Please change your password to continue.', { code: 'PASSWORD_CHANGE_REQUIRED' });
        }
        if (opts.perm && !opts.perm.every((p) => can(user, p))) throw forbidden();
      }
      const params = (rc?.params ? await rc.params : {}) as P;
      const json = async <T,>() => {
        const len = Number(req.headers.get('content-length') || 0);
        if (len > (opts.maxBodyKb ?? 2048) * 1024) throw new HttpError(413, 'That request is too large.');
        try { return (await req.json()) as T; } catch { throw bad('Malformed request.'); }
      };
      const out = await fn({ req, ip, user: user as User, params, json });
      if (out instanceof Response) return out;
      return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status, headers: { 'Cache-Control': 'no-store' } });
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}:`, e);
      return NextResponse.json({ error: 'Something went wrong on the server.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
