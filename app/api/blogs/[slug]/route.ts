import { NextRequest } from 'next/server';
import { clientIp, limited } from '@/lib/server/http';
import { getPublishedPost } from '@/lib/server/posts';
import { toPublicPost } from '@/lib/server/blogs-api';

export const dynamic = 'force-dynamic';

/** One live blog post, with its Markdown body, for the mobile app. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (limited(`blogs:${clientIp(req)}`, 120, 60_000)) {
    return Response.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': '30' } });
  }

  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
    return Response.json({ success: false, error: 'Not found.' }, { status: 404 });
  }
  const post = await getPublishedPost(slug);
  if (!post) return Response.json({ success: false, error: 'Not found.' }, { status: 404 });

  return Response.json(
    { success: true, data: toPublicPost(post) },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120', 'X-Content-Type-Options': 'nosniff' } },
  );
}
