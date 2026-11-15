import { trackTrain, type LiveStatus } from './api';

/** A one-line, human summary of a live status, used for link previews (WhatsApp, Telegram, ...). */
export interface ShareSummary {
  title: string;
  description: string;
}

const IST: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
};

function clock(val?: string): string {
  if (!val) return '';
  if (!val.includes('T')) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleTimeString('en-US', IST).replace(' ', '').toUpperCase();
}

export function summarizeForShare(r: LiveStatus): ShareSummary {
  const idx = r.route.findIndex((s) => s.stationCode === r.currentLocation.stationCode);
  const cur = idx >= 0 ? r.route[idx] : undefined;
  const nextIdx = r.route.findIndex((s, i) => i > idx && (s.isHalt || i === r.route.length - 1));
  const next = idx >= 0 && nextIdx > -1 ? r.route[nextIdx] : undefined;
  const last = r.route[r.route.length - 1];

  const parts: string[] = [];
  if (cur) parts.push(`${r.currentLocation.isHalt ? 'At' : 'Left'} ${cur.stationName}`);
  const delay = cur?.delayDeparture ?? cur?.delayArrival;
  if (delay != null) parts.push(delay <= 0 ? 'on time' : `${delay} min late`);
  if (next) parts.push(`next ${next.stationName} ${clock(next.actualArrival || next.scheduledArrival)}`.trim());
  if (cur && last && last.distance > cur.distance) parts.push(`${Math.round(last.distance - cur.distance)} km to go`);

  return {
    title: `${r.trainNumber} ${r.trainName} — live status`,
    description: parts.length ? `${parts.join(' · ')}. Track it live on Live Train Station.` : 'Track this train live on Live Train Station.',
  };
}

/** Best-effort summary for generateMetadata: never throws, gives up after a few seconds. */
export async function loadShareSummary(train: string, date: string): Promise<ShareSummary | null> {
  try {
    const live = await Promise.race<LiveStatus | null>([
      trackTrain(train, date),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return live ? summarizeForShare(live) : null;
  } catch {
    return null;
  }
}
