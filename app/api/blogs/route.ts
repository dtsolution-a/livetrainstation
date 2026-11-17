import { NextRequest } from 'next/server';
import { clientIp, limited } from '@/lib/server/http';
import { getPublishedPosts } from '@/lib/server/posts';
import { toSummary } from '@/lib/server/blogs-api';
import { isVisibleFor } from '@/lib/blog-lang';
import { isLang } from '@/lib/langs';

export const dynamic = 'force-dynamic';

/**
 * Public list of live blog posts for the mobile app: the posts the website's /blogs page
 * shows, in the language the app is set to.
 *   GET /api/blogs?lang=gu           posts for Gujarati users (Gujarati text when written, else
 *                                    English, else Hindi; posts written only in other languages
 *                                    are left out)
 *   GET /api/blogs?lang=gu&limit=5   only the first 5 (for the app's home screen)
 * Without ?lang the English view is returned.
 */
export async function GET(req: NextRequest) {
  if (limited(`blogs:${clientIp(req)}`, 120, 60_000)) {
    return Response.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': '30' } });
  }

  const langParam = req.nextUrl.searchParams.get('lang') ?? '';
  const lang = isLang(langParam) ? langParam : 'en';
  const raw = Number(req.nextUrl.searchParams.get('limit'));
  const limit = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, 100) : 100;

  const posts = (await getPublishedPosts())
    .filter((p) => isVisibleFor(p, lang))
    .slice(0, limit)
    .map((p) => toSummary(p, lang))
    .filter((p) => !!p);

  return Response.json(
    { success: true, data: { lang, posts } },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120', 'X-Content-Type-Options': 'nosniff' } },
  );
}
