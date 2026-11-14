import { NextRequest } from 'next/server';
import { config } from '@/lib/server/config';
import { clientIp, limited } from '@/lib/server/http';

/**
 * Same-origin gateway to the railway data API.
 *  - the browser never talks to the upstream host (no CORS, upstream URL stays private)
 *  - strict allow-list of paths + query parameters (nothing else can be forwarded)
 *  - per-IP rate limit, request coalescing and a tiny micro-cache so a busy train page
 *    can't hammer the upstream with identical requests
 */

const CODE = /^[A-Z0-9-]{1,12}$/;
const TRAIN = /^\d{5}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const WORD = /^[A-Za-z0-9]{1,8}$/;

type Check = (v: string) => boolean;
interface Rule { re: RegExp; query: Record<string, Check>; live: boolean }

const RULES: Rule[] = [
  { re: /^pnr\/\d{10}$/, query: {}, live: false },
  { re: /^train\/\d{5}$/, query: {}, live: false },
  { re: /^train\/\d{5}\/track$/, query: { date: (v) => DATE.test(v) }, live: true },
  { re: /^train\/\d{5}\/coaches$/, query: {}, live: false },
  { re: /^train\/\d{5}\/history$/, query: { date: (v) => DATE.test(v) }, live: false },
  { re: /^search$/, query: { from: (v) => CODE.test(v), to: (v) => CODE.test(v) }, live: false },
  { re: /^station\/[A-Z0-9-]{1,12}\/live$/, query: { hours: (v) => /^\d{1,2}$/.test(v) && +v >= 1 && +v <= 24 }, live: true },
  {
    re: /^(availability|fare)$/,
    query: {
      trainNo: (v) => TRAIN.test(v), from: (v) => CODE.test(v), to: (v) => CODE.test(v),
      date: (v) => DATE.test(v), coach: (v) => WORD.test(v), class: (v) => WORD.test(v), quota: (v) => WORD.test(v),
    },
    live: false,
  },
];

interface Cached { at: number; status: number; body: string }
const g = globalThis as unknown as { __lsRail?: { cache: Map<string, Cached>; inflight: Map<string, Promise<Cached>> } };
const state = (g.__lsRail ??= { cache: new Map(), inflight: new Map() });

async function fetchUpstream(url: string): Promise<Cached> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.text();
    return { at: Date.now(), status: res.status, body };
  } catch {
    return { at: Date.now(), status: 502, body: JSON.stringify({ success: false, error: 'The railway data service is not responding. Please try again.' }) };
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ip = clientIp(req);
  if (limited(`rail:${ip}`, 90, 60_000)) {
    return Response.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': '30' } });
  }

  const { path } = await params;
  const joined = path.join('/');
  const rule = RULES.find((r) => r.re.test(joined));
  if (!rule) return Response.json({ success: false, error: 'Not found.' }, { status: 404 });

  const qs = new URLSearchParams();
  for (const [k, v] of req.nextUrl.searchParams) {
    const ok = rule.query[k];
    if (!ok || !ok(v)) return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    qs.set(k, v);
  }
  const query = qs.toString();
  const url = `${config.railApi}/${joined}${query ? `?${query}` : ''}`;

  // Live data: ≤5s microcache (coalesces bursts). Static lookups: 60s.
  const ttl = rule.live ? 5_000 : 60_000;
  const hit = state.cache.get(url);
  let out: Cached;
  if (hit && Date.now() - hit.at < ttl) out = hit;
  else {
    let p = state.inflight.get(url);
    if (!p) {
      p = fetchUpstream(url).finally(() => state.inflight.delete(url));
      state.inflight.set(url, p);
    }
    out = await p;
    if (out.status === 200) {
      if (state.cache.size > 500) state.cache.clear();
      state.cache.set(url, out);
    }
  }

  return new Response(out.body, {
    status: out.status,
    headers: {
      'Content-Type': 'application/json',
      // Never let a CDN (Cloudflare) cache live positions; static lookups may be cached briefly.
      'Cache-Control': rule.live ? 'no-store' : 'public, max-age=30, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
