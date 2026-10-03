import { stations as popularStations } from './stations';

// Offline station/train lookup — same datasets and ranking as the mobile app
// (public/data/*.json, copied from the app's assets). Loaded lazily, once.

export interface StationEntry { code: string; name: string }
export interface TrainEntry { number: string; name: string; from: string; to: string }

const POPULAR = new Set(popularStations.map((s) => s.code));

let stationsP: Promise<StationEntry[]> | null = null;
let trainsP: Promise<TrainEntry[]> | null = null;

function load<T>(url: string): Promise<T[]> {
  return fetch(url).then((r) => r.json() as Promise<T[]>).catch(() => [] as T[]);
}

export function loadStations(): Promise<StationEntry[]> {
  return (stationsP ??= load<StationEntry>('/data/stations.json'));
}

export function loadTrains(): Promise<TrainEntry[]> {
  return (trainsP ??= load<TrainEntry>('/data/trains.json'));
}

/** Kick off the downloads early (e.g. on first focus) so suggestions feel instant. */
export function preloadLookup() {
  void loadStations();
  void loadTrains();
}

function rank<T>(
  all: T[],
  q: string,
  limit: number,
  id: (t: T) => string,
  name: (t: T) => string,
  boosted?: Set<string>,
): T[] {
  const byId: T[] = [];
  const byName: T[] = [];
  const contains: T[] = [];
  for (const t of all) {
    const i = id(t).toUpperCase();
    const n = name(t).toUpperCase();
    if (i === q) byId.unshift(t);
    else if (n === q) byName.unshift(t);
    else if (i.startsWith(q)) byId.push(t);
    else if (n.startsWith(q)) byName.push(t);
    else if (n.includes(q)) contains.push(t);
  }
  if (boosted) {
    const lift = (arr: T[]) => [...arr.filter((t) => boosted.has(id(t))), ...arr.filter((t) => !boosted.has(id(t)))];
    return [...lift(byId), ...lift(byName), ...lift(contains)].slice(0, limit);
  }
  return [...byId, ...byName, ...contains].slice(0, limit);
}

export async function searchStations(query: string, limit = 8): Promise<StationEntry[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return rank(await loadStations(), q, limit, (s) => s.code, (s) => s.name, POPULAR);
}

export async function searchTrains(query: string, limit = 8): Promise<TrainEntry[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return rank(await loadTrains(), q, limit, (t) => t.number, (t) => t.name);
}

export async function stationName(code: string): Promise<string> {
  const all = await loadStations();
  return all.find((s) => s.code === code.toUpperCase())?.name ?? code;
}

export async function trainName(number: string): Promise<string> {
  const all = await loadTrains();
  return all.find((t) => t.number === number)?.name ?? '';
}

/** Turn whatever the user typed ("Surat", "ST", "Surat (ST)") into a station code. */
export async function resolveStationCode(text: string): Promise<string | null> {
  const t = text.trim();
  if (!t) return null;
  const paren = t.match(/\(([A-Za-z0-9-]+)\)\s*$/);
  const all = await loadStations();
  const wanted = (paren ? paren[1] : t).toUpperCase();
  if (all.some((s) => s.code === wanted)) return wanted;
  const hit = (await searchStations(paren ? paren[1] : t, 1))[0];
  return hit?.code ?? null;
}

/** Turn "Rajdhani" / "12301" / "12301 — Howrah Rajdhani" into a train number. */
export async function resolveTrainNumber(text: string): Promise<string | null> {
  const t = text.trim();
  const m = t.match(/^(\d{5})\b/);
  if (m) return m[1];
  if (!t) return null;
  return (await searchTrains(t, 1))[0]?.number ?? null;
}
