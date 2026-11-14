import crypto from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import * as store from '@/lib/server/store';
import { route, bad, str, limited, HttpError } from '@/lib/server/http';
import { config, UPLOAD_DIR } from '@/lib/server/config';
import { audit } from '@/lib/server/audit';
import type { Post } from '@/lib/server/posts';

export interface Media { id: string; file: string; name: string; alt: string; mime: string; size: number; createdAt: string; by: string }

/** Detect the real image type from the file's first bytes — never trust the filename or Content-Type. */
function sniff(b: Buffer): { ext: string; mime: string } | null {
  if (b.length < 16) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (b.subarray(0, 6).toString() === 'GIF87a' || b.subarray(0, 6).toString() === 'GIF89a') return { ext: 'gif', mime: 'image/gif' };
  if (b.subarray(4, 8).toString() === 'ftyp' && /avif|avis/.test(b.subarray(8, 16).toString())) return { ext: 'avif', mime: 'image/avif' };
  return null; // SVG and everything else is refused
}

export const GET = route({ perm: ['media.read'] }, async () => {
  const media = store.get<Media[]>('media');
  const posts = store.get<Post[]>('posts');
  const items = [...media].reverse().map((m) => ({
    ...m,
    url: `/uploads/${m.file}`,
    usedIn: posts.filter((p) => p.coverImage === `/uploads/${m.file}` || p.content.includes(`/uploads/${m.file}`)).map((p) => p.title),
  }));
  return { media: items };
});

export const POST = route({ perm: ['media.write'] }, async ({ req, user, ip }) => {
  if (limited(`upload:${user.id}`, 60, 60 * 60 * 1000)) throw new HttpError(429, 'Too many uploads. Try again later.');
  const len = Number(req.headers.get('content-length') || 0);
  const max = config.maxUploadMb * 1024 * 1024;
  if (len > max + 64 * 1024) throw new HttpError(413, `Images can be up to ${config.maxUploadMb} MB.`);

  let form: FormData;
  try { form = await req.formData(); } catch { throw bad('Upload failed. Please try again.'); }
  const file = form.get('file');
  if (!(file instanceof File)) throw bad('Choose an image to upload.');
  if (file.size > max) throw new HttpError(413, `Images can be up to ${config.maxUploadMb} MB.`);

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) throw bad('Only JPG, PNG, WebP, GIF or AVIF images are allowed.');

  const name = `${crypto.randomBytes(12).toString('hex')}.${kind.ext}`;
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  await fsp.writeFile(path.join(UPLOAD_DIR, name), buf, { mode: 0o640 });

  const item: Media = {
    id: store.newId(), file: name, name: str(file.name, 120) || name, alt: str(form.get('alt'), 200),
    mime: kind.mime, size: buf.length, createdAt: new Date().toISOString(), by: user.name || user.email,
  };
  await store.update<Media[]>('media', (list) => { list.push(item); });
  audit({ user, ip }, 'media.upload', item.name);
  return { media: { ...item, url: `/uploads/${name}` } };
});
