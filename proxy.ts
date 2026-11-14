import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/server/settings';

const isDev = process.env.NODE_ENV === 'development';
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-ls_admin' : 'ls_admin';

function csp(nonce: string) {
  return [
    `default-src 'self'`,
    // 'strict-dynamic' lets the nonce'd Next.js bootstrap load its chunks; host lists are for older browsers.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.clarity.ms${isDev ? " 'unsafe-eval'" : ''}`,
    // Inline style="" attributes are used across the UI (cannot carry a nonce).
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms`,
    `frame-src https://challenges.cloudflare.com https://www.googletagmanager.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Redirects managed in the admin panel (public pages only).
  if ((req.method === 'GET' || req.method === 'HEAD') && !/^\/(api|admin|uploads|_next)(\/|$)/.test(pathname)) {
    const norm = pathname.replace(/\/+$/, '') || '/';
    const hit = getSettings().redirects.find((r) => r.from === norm);
    if (hit) return NextResponse.redirect(new URL(hit.to, req.url), hit.code);
  }

  // 2. Optimistic admin gate (real authorisation is enforced in every API route).
  const inAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  if (inAdmin && pathname !== '/admin/login' && !req.cookies.get(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 3. Per-request CSP nonce + security headers.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = csp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('Content-Security-Policy', policy);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', policy);
  if (inAdmin || pathname.startsWith('/api/')) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (inAdmin || pathname.startsWith('/api/admin/')) res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|icon.svg|images/|data/|uploads/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
