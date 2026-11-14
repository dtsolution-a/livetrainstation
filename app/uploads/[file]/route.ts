import fsp from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '@/lib/server/config';

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([a-f0-9]{24})\.(jpg|png|webp|gif|avif)$/.exec(file);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const data = await fsp.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[m[2]],
        'Cache-Control': 'public, max-age=31536000, immutable', // random names never change
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
