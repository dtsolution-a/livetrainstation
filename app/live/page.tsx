import type { Metadata } from 'next';
import { loadShareSummary } from '@/lib/share';
import LiveClient from './LiveClient';

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

/**
 * Shared links (`/live?train=12951&date=2026-11-15`) get a preview that already says where
 * the train is, so the WhatsApp card is useful before anyone taps it.
 */
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const sp = await searchParams;
  const train = one(sp.train);
  if (!/^\d{5}$/.test(train)) return {};
  const dateRaw = one(sp.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : '';

  const s = await loadShareSummary(train, date);
  const title = s?.title ?? `Train ${train} — live status`;
  const description = s?.description ?? 'Track this train live on Live Train Station.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
    // Per-train, ever-changing pages: keep them out of search results.
    robots: { index: false, follow: true },
  };
}

export default function LivePage() {
  return <LiveClient />;
}
