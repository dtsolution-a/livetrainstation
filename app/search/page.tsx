'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowRight, ArrowLeftRight, Train, Clock, MapPin, AlertCircle } from 'lucide-react';
import { searchTrains, TrainSearchResult, ApiError } from '@/lib/api';
import { resolveStationCode, stationName } from '@/lib/lookup';
import { addRouteHistory, clearHistory, parseRouteEntry, removeHistory, useHistory } from '@/lib/history';
import StationField from '@/components/StationField';
import RecentChips from '@/components/RecentChips';

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.07em', display: 'block', marginBottom: 6,
};

type Sort = 'departure' | 'duration' | 'name';

const toMinutes = (t: string) => {
  const m = t.match(/(\d+)h\s*(\d+)?m?/);
  return m ? Number(m[1]) * 60 + Number(m[2] ?? 0) : Number.MAX_SAFE_INTEGER;
};

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const routes = useHistory('route');

  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [results, setResults] = useState<TrainSearchResult[] | null>(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<Sort>('departure');
  const [filter, setFilter] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});

  const run = async (f: string, t: string) => {
    setError(''); setResults(null);
    const [fc, tc] = await Promise.all([resolveStationCode(f), resolveStationCode(t)]);
    if (!fc || !tc) { setError(`Couldn't find ${!fc ? 'the source' : 'the destination'} station. Pick one from the suggestions.`); return; }
    if (fc === tc) { setError('Source and destination are the same station.'); return; }
    setLoading(true);
    try {
      const data = await searchTrains(fc, tc);
      setResults(data);
      setRouteLabel(`${fc} → ${tc}`);
      setFilter('');
      addRouteHistory(fc, tc);
      router.replace(`/search?from=${fc}&to=${tc}`, { scroll: false });
      if (data.length === 0) setError('No direct trains found for this route.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  // Deep link (?from=&to=) → run once on load, and show friendly names in the fields.
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (from && to) void run(from, to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve recent-route station names for the chips.
  useEffect(() => {
    const codes = new Set(routes.flatMap((r) => { const x = parseRouteEntry(r); return [x.from, x.to]; }));
    let live = true;
    Promise.all([...codes].map(async (c) => [c, await stationName(c)] as const))
      .then((p) => { if (live) setNames(Object.fromEntries(p)); });
    return () => { live = false; };
  }, [routes]);

  const swap = () => { setFrom(to); setTo(from); setResults(null); setError(''); };
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!from.trim() || !to.trim()) { setError('Please enter both source and destination stations.'); return; }
    void run(from, to);
  };

  const shown = useMemo(() => {
    if (!results) return [];
    const q = filter.trim().toLowerCase();
    const list = q ? results.filter((t) => t.trainName.toLowerCase().includes(q) || t.trainNumber.includes(q)) : [...results];
    list.sort((a, b) =>
      sort === 'duration' ? toMinutes(a.travelTime) - toMinutes(b.travelTime)
      : sort === 'name' ? a.trainName.localeCompare(b.trainName)
      : a.fromTime.localeCompare(b.fromTime));
    return list;
  }, [results, sort, filter]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-body), sans-serif' }}>
      <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
        Search Trains
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>Type a station name or code — suggestions appear as you type</p>

      <div className="glass-card" style={{ padding: 24, marginBottom: 20, overflow: 'visible' }}>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={labelStyle}>From Station</label>
              <StationField value={from} onChange={setFrom} placeholder="e.g. Surat or ST" ariaLabel="From station" />
            </div>
            <button type="button" onClick={swap} aria-label="Swap stations"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', color: 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <ArrowLeftRight size={18} />
            </button>
            <div style={{ flex: '1 1 220px' }}>
              <label style={labelStyle}>To Station</label>
              <StationField value={to} onChange={setTo} placeholder="e.g. Kanpur or CNB" ariaLabel="To station" onEnter={() => submit()} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="premium-btn"
            style={{ width: '100%', marginTop: 16, borderRadius: 12, padding: '13px 0', fontSize: 15, gap: 8 }}>
            {loading
              ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <><Search size={17} /> Search Trains</>}
          </button>
        </form>
      </div>

      {!results && !loading && (
        <RecentChips
          title="Recent routes"
          onClear={() => { clearHistory('route'); clearHistory('station'); }}
          chips={routes.slice(0, 8).map((r) => {
            const { from: f, to: t } = parseRouteEntry(r);
            return {
              key: r, label: `${f} → ${t}`, sub: `${names[f] ?? ''}${names[t] ? ` · ${names[t]}` : ''}`.replace(/^ · /, ''),
              onClick: () => { setFrom(f); setTo(t); void run(f, t); },
              onRemove: () => removeHistory('route', r),
            };
          })}
        />
      )}

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 8, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{error}
        </div>
      )}

      {loading && [0, 1, 2].map((i) => (
        <div key={i} className="glass-card skeleton" style={{ height: 92, marginBottom: 10 }} />
      ))}

      {results && results.length > 0 && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 600 }}>
              {shown.length} train{shown.length !== 1 ? 's' : ''} · {routeLabel}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="rail-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name / no."
                aria-label="Filter results" style={{ width: 170, padding: '7px 12px', fontSize: 13 }} />
              <select className="rail-input" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort results"
                style={{ width: 'auto', padding: '7px 12px', fontSize: 13, fontWeight: 600 }}>
                <option value="departure">Earliest departure</option>
                <option value="duration">Shortest journey</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
          {shown.map((t) => (
            <div key={t.trainNumber} className="glass-card" style={{ padding: '16px 18px', marginBottom: 10, cursor: 'pointer' }}
              onClick={() => router.push(`/live?train=${t.trainNumber}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(52,144,139,0.12)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6 }}>{t.trainNumber}</span>
                    <strong style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-heading), sans-serif' }}>{t.trainName}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {t.fromTime} → {t.toTime}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ArrowRight size={12} /> {t.travelTime}</span>
                    {t.distance && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {t.distance} km</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Train size={12} /> {t.halts} halts</span>
                  </div>
                  {t.runningDays && <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Runs: {t.runningDays}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/live?train=${t.trainNumber}`); }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 10, padding: '6px 14px', cursor: 'pointer', background: 'none', fontFamily: 'var(--font-body), sans-serif' }}>
                    Track
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/train-info?train=${t.trainNumber}`); }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '6px 14px', cursor: 'pointer', background: 'none', fontFamily: 'var(--font-body), sans-serif' }}>
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
