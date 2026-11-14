import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, UPLOAD_DIR, BACKUP_DIR } from './config';

/**
 * Tiny JSON-file database (no native modules, works on any Node host).
 *
 *  - one file per collection in DATA_DIR
 *  - reads are cached per-process and revalidated by file mtime
 *  - writes are serialised per collection and atomic (tmp file -> rename) with a .bak copy
 *  - state lives on globalThis so every Next.js route bundle shares one cache/lock set
 */
export const COLLECTIONS = {
  users: [] as unknown[],
  posts: [] as unknown[],
  media: [] as unknown[],
  audit: [] as unknown[],
  settings: {} as Record<string, unknown>,
  meta: {} as Record<string, unknown>,
};
export type CollectionName = keyof typeof COLLECTIONS;

interface Entry { mtime: number; value: unknown }
const g = globalThis as unknown as { __lsStore?: { cache: Map<string, Entry>; locks: Map<string, Promise<unknown>> } };
const state = (g.__lsStore ??= { cache: new Map(), locks: new Map() });

const fileOf = (name: string) => path.join(DATA_DIR, `${name}.json`);
const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function ensureDirs() {
  for (const d of [DATA_DIR, UPLOAD_DIR, BACKUP_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function readSync(name: CollectionName): unknown {
  const file = fileOf(name);
  for (const candidate of [file, `${file}.bak`]) {
    try {
      const raw = fs.readFileSync(candidate, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && candidate === file) console.error(`[store] ${name}.json unreadable — trying backup copy`);
    }
  }
  return clone(COLLECTIONS[name]);
}

/** Synchronous read. Treat the result as read-only. */
export function get<T = unknown[]>(name: CollectionName): T {
  const file = fileOf(name);
  let mtime = 0;
  try { mtime = fs.statSync(file).mtimeMs; } catch { /* missing */ }
  const hit = state.cache.get(name);
  if (hit && hit.mtime === mtime) return hit.value as T;
  const value = readSync(name);
  state.cache.set(name, { mtime, value });
  return value as T;
}

async function persist(name: string, value: unknown) {
  ensureDirs();
  const file = fileOf(name);
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  if (fs.existsSync(file)) {
    try { await fsp.copyFile(file, `${file}.bak`); } catch { /* best effort */ }
  }
  await fsp.rename(tmp, file);
  return fs.statSync(file).mtimeMs;
}

/**
 * Read-modify-write inside the collection's lock. `fn` gets a deep copy and either
 * mutates it or returns a replacement.
 */
export function update<T = unknown[]>(name: CollectionName, fn: (draft: T) => T | void | Promise<T | void>): Promise<T> {
  const prev = state.locks.get(name) || Promise.resolve();
  const run = prev.then(async () => {
    const draft = clone(get<T>(name));
    const result = await fn(draft);
    const next = (result === undefined ? draft : result) as T;
    const mtime = await persist(name, next);
    state.cache.set(name, { mtime, value: next });
    return next;
  });
  state.locks.set(name, run.catch(() => {}));
  return run;
}

export const set = <T,>(name: CollectionName, value: T) => update<T>(name, () => value);

export function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function snapshot() {
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(COLLECTIONS) as CollectionName[]) out[name] = clone(get(name));
  return out;
}
