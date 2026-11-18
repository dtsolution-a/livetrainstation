import { NextRequest, NextResponse } from 'next/server';
import { clientIp, limited } from '@/lib/server/http';
import { parseVoice } from '@/lib/voice/engine';

/**
 * POST /api/voice/parse   { "text": "jaipur se kanpur 13 dec", "lang": "hi" }
 *
 *  ok    → { ok:true, heard, from:{code,name,nameLocal?}, to:{…}, date:"YYYY-MM-DD", dateKind, dateAssumed }
 *  retry → { ok:false, retry:true, reason, missing:["from"|"to"], message }   (message is in `lang`)
 *
 * The phone sends only the text its speech recogniser produced; understanding it (stations, direction,
 * date) happens here. No account / AI key involved. Public, so it is size-limited and rate-limited.
 */
const headers = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (limited(`voice:${ip}`, 40, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please wait a moment.' }, { status: 429, headers: { ...headers, 'Retry-After': '30' } });
  }
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 4096) return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413, headers });

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400, headers });
  }
  if (typeof body.text !== 'string') {
    return NextResponse.json({ ok: false, error: 'Send the spoken text as "text".' }, { status: 400, headers });
  }

  try {
    return NextResponse.json(parseVoice(body.text, body.lang), { headers });
  } catch (e) {
    console.error('[voice] parse failed:', e);
    return NextResponse.json({ ok: false, error: 'Something went wrong on the server.' }, { status: 500, headers });
  }
}
