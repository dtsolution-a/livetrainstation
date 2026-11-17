import { NextRequest } from 'next/server';
import { clientIp, limited } from '@/lib/server/http';
import { getPublishedPost } from '@/lib/server/posts';
import { toPublicPost } from '@/lib/server/blogs-api';
import { isLang } from '@/lib/langs';

export const dynamic = 'force-dynamic';

/**
 * One live blog post with its Markdown body. `?lang=` picks the language; if the post is not
 * written in it the English (else Hindi, else first written) text comes back, and `lang` /
 * `languages` in the response say what you got and what exists.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (limited(`blogs:${clientIp(req)}`, 120, 60_000)) {
    return Response.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': '30' } });
  }

  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
    return Response.json({ success: false, error: 'Not found.' }, { status: 404 });
  }
  const langParam = req.nextUrl.searchParams.get('lang') ?? '';
  const post = await getPublishedPost(slug);
  const out = post ? toPublicPost(post, isLang(langParam) ? langParam : 'en') : undefined;
  if (!out) return Response.json({ success: false, error: 'Not found.' }, { status: 404 });

  return Response.json(
    { success: true, data: out },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120', 'X-Content-Type-Options': 'nosniff' } },
  );
}
