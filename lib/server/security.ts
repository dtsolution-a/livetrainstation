import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, config } from './config';
import { ensureDirs } from './store';

/* ---------- secret ---------- */

let secret: string | null = null;
export function getSecret(): string {
  if (secret) return secret;
  if (config.sessionSecret.length >= 16) return (secret = config.sessionSecret);
  ensureDirs();
  const file = path.join(DATA_DIR, 'secret.key');
  if (fs.existsSync(file)) secret = fs.readFileSync(file, 'utf8').trim();
  else {
    secret = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, secret, { mode: 0o600 });
  }
  return secret;
}

/* ---------- passwords (scrypt) ---------- */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N: Number(n), r: SCRYPT.r, p: SCRYPT.p,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password must be at least 10 characters.';
  if (pw.length > 200) return 'Password is too long.';
  if (pw.length >= 16) return null;
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return 'Use upper and lower case letters and a number (or a passphrase of 16+ characters).';
  }
  return null;
}

export function randomPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (const b of crypto.randomBytes(18)) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 6)}-${out.slice(6, 12)}-${out.slice(12, 18)}9a`;
}

/* ---------- signed session tokens ---------- */

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

export interface SessionPayload { u: string; v: number; t: number; e: number }

export function signToken(payload: SessionPayload): string {
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: unknown): SessionPayload | null {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest();
  let given: Buffer;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.e || payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- TOTP (RFC 6238) ---------- */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function newTotpSecret(): string {
  let bits = '';
  for (const b of crypto.randomBytes(20)) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(str: string): Buffer {
  let bits = '';
  for (const ch of str.replace(/=+$/, '').toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error('bad base32');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', key).update(buf).digest();
  const off = h[h.length - 1] & 0xf;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

export function verifyTotp(secretB32: string, code: unknown): boolean {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  let key: Buffer;
  try { key = base32Decode(secretB32); } catch { return false; }
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) => crypto.timingSafeEqual(Buffer.from(hotp(key, step + d)), Buffer.from(clean)));
}

export const totpUri = (secretB32: string, account: string, issuer = 'Live Train Station Admin') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
