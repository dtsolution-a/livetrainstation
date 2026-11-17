import { NextRequest } from 'next/server';
import { clientIp, limited } from '@/lib/server/http';
import { getPublishedPosts } from '@/lib/server/posts';
import { toSummary } from '@/lib/server/blogs-api';

export const dynamic = 'force-dynamic';

/**
 * Public list of live blog posts for the mobile app: the same posts the website's
 * /blogs page shows (published, or scheduled and now due), featured first, then newest.
 *   GET /api/blogs            all posts
 *   GET /api/blogs?limit=5    only the first 5 (for the app's home screen)
 */
export async function GET(req: NextRequest) {
  if (limited(`blogs:${clientIp(req)}`, 120, 60_000)) {
    return Response.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': '30' } });
  }

  const raw = Number(req.nextUrl.searchParams.get('limit'));
  const limit = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, 100) : 100;
  const posts = (await getPublishedPosts()).slice(0, limit);

  return Response.json(
    { success: true, data: { posts: posts.map(toSummary) } },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120', 'X-Content-Type-Options': 'nosniff' } },
  );
}
