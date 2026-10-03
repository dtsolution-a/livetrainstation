'use client';

import { useSyncExternalStore } from 'react';

// Persistent search history (localStorage), mirroring the app's HistoryService:
// most-recent-first, de-duplicated, capped per list.

export type HistoryKind = 'pnr' | 'train' | 'station' | 'route';

const CAPS: Record<HistoryKind, number> = { pnr: 10, train: 30, station: 10, route: 15 };
const KEY = (k: HistoryKind) => `ls_history_${k}`;
const EMPTY: string[] = [];

const cache: Partial<Record<HistoryKind, string[]>> = {};
const listeners = new Set<() => void>();

function read(kind: HistoryKind): string[] {
  try {
    const raw = localStorage.getItem(KEY(kind));
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function snapshot(kind: HistoryKind): string[] {
  return (cache[kind] ??= read(kind));
}

function write(kind: HistoryKind, list: string[]) {
  cache[kind] = list;
  try { localStorage.setItem(KEY(kind), JSON.stringify(list)); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('ls_history_')) {
      for (const k of Object.keys(CAPS) as HistoryKind[]) delete cache[k];
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}

/** Entry key used to de-duplicate: trains are "no|name", so match on the number. */
const sameEntry = (kind: HistoryKind, a: string, b: string) =>
  kind === 'train' ? a.split('|')[0] === b.split('|')[0] : a === b;

export function addHistory(kind: HistoryKind, entry: string) {
  if (!entry) return;
  const list = [entry, ...snapshot(kind).filter((e) => !sameEntry(kind, e, entry))];
  write(kind, list.slice(0, CAPS[kind]));
}

export function removeHistory(kind: HistoryKind, entry: string) {
  write(kind, snapshot(kind).filter((e) => e !== entry));
}

export function clearHistory(kind: HistoryKind) {
  write(kind, []);
}

export function useHistory(kind: HistoryKind): string[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(kind),
    () => EMPTY,
  );
}

// ---- Typed helpers ----

export const addTrainHistory = (no: string, name = '') => addHistory('train', `${no}|${name}`);
export const addRouteHistory = (from: string, to: string) => {
  addHistory('route', `${from}|${to}`);
  addHistory('station', from);
  addHistory('station', to);
};

export function parseTrainEntry(e: string): { number: string; name: string } {
  const [number, name = ''] = e.split('|');
  return { number, name };
}

export function parseRouteEntry(e: string): { from: string; to: string } {
  const [from, to = ''] = e.split('|');
  return { from, to };
}
