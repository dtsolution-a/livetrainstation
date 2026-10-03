'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrainFront, RefreshCw, AlertCircle } from 'lucide-react';
import { getStationBoard, searchTrains, StationBoard, BoardTrain, TrainSearchResult, ApiError } from '@/lib/api';
import { resolveStationCode, stationName } from '@/lib/lookup';
import { addHistory, clearHistory, removeHistory, useHistory } from '@/lib/history';
import { useAutoRefresh } from '@/lib/useAutoRefresh';
import StationField from '@/components/StationField';
import RecentChips from '@/components/RecentChips';

const HOURS = [2, 4, 6, 8];

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.07em', display: 'block', marginBottom: 6,
};

function fmt12(t?: string): string {
  if (!t) return '--';
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function statusOf(t: BoardTrain): { label: string; color: string } {
  switch (t.liveType) {
    case 'at-station': return { label: 'At station', color: '#10B981' };
    case 'departed':   return { label: 'Departed', color: 'var(--muted)' };
    case 'upcoming':   return { label: 'Upcoming', color: 'var(--primary)' };
    default:           return { label: 'Scheduled', color: 'var(--muted)' };
  }
}

function BoardContent() {
  const router = useRouter();
  const params = useSearchParams();
  const recents = useHistory('station');

  const [station, setStation] = useState(params.get('code') ?? '');
  const [dest, setDest] = useState('');
  const [hours, setHours] = useState(4);
  const [showDeparted, setShowDeparted] = useState(false);
  const [board, setBoard] = useState<StationBoard | null>(null);
  const [toTrains, setToTrains] = useState<Record<string, TrainSearchResult> | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(0);
  const [recentNames, setRecentNames] = useState<Record<string, string>>({});
  const active = useRef<{ code: string; dest: string; hours: number } | null>(null);

  const load = useCallback(async (code: string, to: string, hrs: number, silent: boolean) => {
    if (silent) setRefreshing(true); else { setLoading(true); setBoard(null); }
    setError('');
    try {
      const [b, between] = await Promise.all([
        getStationBoard(code, hrs),
        to ? searchTrains(code, to) : Promise.resolve(null),
      ]);
      b.trains.sort((x, y) => (x.departure ?? x.arrival ?? '').localeCompare(y.departure ?? y.arrival ?? ''));
      const codes = new Set<string>([...b.trains.flatMap((t) => [t.sourceCode, t.destinationCode]), ...(to ? [to] : [])]);
      const pairs = await Promise.all([...codes].filter(Boolean).map(async (c) => [c, await stationName(c)] as const));
      setBoard(b);
      setToTrains(between ? Object.fromEntries(between.map((t) => [t.trainNumber, t])) : null);
      setNames(Object.fromEntries(pairs));
      setFetchedAt(Date.now());
      active.current = { code, dest: to, hours: hrs };
    } catch (err) {
      if (!silent) setError(err instanceof ApiError ? err.message : 'Could not load the station board.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const submit = async (e?: React.FormEvent, overrideHours?: number) => {
    e?.preventDefault();
    const code = await resolveStationCode(station);
    if (!code) { setError('Pick a station from the suggestions.'); return; }
    const to = dest.trim() ? await resolveStationCode(dest) : '';
    if (dest.trim() && !to) { setError("Couldn't find the destination station."); return; }
    setStation(code);
    addHistory('station', code);
    window.history.replaceState(null, '', `/station-board?code=${code}`);
    await load(code, to ?? '', overrideHours ?? hours, false);
  };

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (station) void submit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all(recents.slice(0, 8).map(async (c) => [c, await stationName(c)] as const))
      .then((p) => { if (live) setRecentNames(Object.fromEntries(p)); });
    return () => { live = false; };
  }, [recents]);

  // Same cadence as the app's board: every 60 s while the tab is visible.
  const { secondsLeft, paused, reset } = useAutoRefresh({
    enabled: !!board,
    getInterval: () => 60_000,
    refresh: async () => { const a = active.current; if (a) await load(a.code, a.dest, a.hours, true); },
  });

  const trains = useMemo(() => (board?.trains ?? [])
    .filter((t) => showDeparted || t.liveType !== 'departed')
    .filter((t) => !toTrains || toTrains[t.number]), [board, showDeparted, toTrains]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px', fontFamily: 'var(--font-body), sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '0 8px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrainFront size={20} color="#06B6D4" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Station Board</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>Live arrivals &amp; departures with platform and delay</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <form onSubmit={(e) => void submit(e)}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label style={labelStyle}>Station</label>
              <StationField value={station} onChange={setStation} placeholder="e.g. Kanpur or CNB" ariaLabel="Station" onEnter={() => void submit()} />
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <label style={labelStyle}>Going to <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>(optional)</span></label>
              <StationField value={dest} onChange={setDest} placeholder="Only trains reaching…" ariaLabel="Destination station" onEnter={() => void submit()} />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16 }}>
            {HOURS.map((h) => (
              <button type="button" key={h} aria-pressed={h === hours}
                onClick={() => { setHours(h); if (board) void submit(undefined, h); }}
                style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${h === hours ? 'var(--primary)' : 'var(--border)'}`,
                  background: h === hours ? 'var(--primary)' : 'transparent',
                  color: h === hours ? 'var(--on-primary)' : 'var(--text)', fontFamily: 'var(--font-body), sans-serif',
                }}>
                Next {h}h
              </button>
            ))}
            <label style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDeparted} onChange={(e) => setShowDeparted(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
              Include departed
            </label>
          </div>

          <button type="submit" disabled={loading} className="premium-btn" style={{ width: '100%', marginTop: 16, borderRadius: 12, padding: '13px 0', gap: 8 }}>
            {loading ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'var(--on-primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <><TrainFront size={17} /> Show Board</>}
          </button>
        </form>
      </div>

      {!board && !loading && (
        <RecentChips
          title="Recent stations"
          onClear={() => clearHistory('station')}
          chips={recents.slice(0, 8).map((c) => ({
            key: c, label: c, sub: recentNames[c],
            onClick: () => { setStation(c); void (async () => { addHistory('station', c); await load(c, '', hours, false); window.history.replaceState(null, '', `/station-board?code=${c}`); })(); },
            onRemove: () => removeHistory('station', c),
          }))}
        />
      )}

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 8, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{error}
        </div>
      )}

      {loading && [0, 1, 2, 3].map((i) => <div key={i} className="glass-card skeleton" style={{ height: 110, marginBottom: 10 }} />)}

      {board && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {board.name || names[board.code] || board.code} ({board.code})
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0', fontWeight: 600 }}>{trains.length} train{trains.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={async () => { const a = active.current; if (a) { await load(a.code, a.dest, a.hours, true); reset(); } }}
              disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary)', padding: '8px 12px', border: '1.5px solid var(--primary)', borderRadius: 10, background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body), sans-serif' }}>
              <RefreshCw size={14} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
              {refreshing ? 'Updating…' : `Auto-refresh ${paused ? 'paused' : `in ${secondsLeft}s`}`}
            </button>
          </div>

          {trains.length === 0 && (
            <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              No trains in this window. Try a longer range{!showDeparted ? ' or include departed trains' : ''}.
            </div>
          )}

          {trains.map((t) => {
            const st = statusOf(t);
            const late = t.delayMinutes > 0;
            const match = toTrains?.[t.number];
            return (
              <div key={`${t.number}-${t.arrival}-${t.departure}`} className="glass-card" role="link" tabIndex={0}
                onClick={() => router.push(`/live?train=${t.number}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/live?train=${t.number}`); }}
                style={{ padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(52,144,139,0.12)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 6 }}>{t.number}</span>
                  <strong style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-heading), sans-serif' }}>{t.name}</strong>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--muted)' }}>
                  {names[t.sourceCode] ?? t.sourceCode} → {names[t.destinationCode] ?? t.destinationCode}
                </p>
                {match && match.toTime && (
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                    Reaches {names[dest.toUpperCase()] ?? match.toStationName} at {fmt12(match.toTime)}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 8 }}>
                  <div><p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>ARR</p><p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{fmt12(t.arrival)}</p></div>
                  <div><p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>DEP</p><p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{fmt12(t.departure)}</p></div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {t.platform && <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: 'var(--border)', color: 'var(--text)' }}>PF {t.platform}</span>}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: st.color }}>{st.label}</p>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: late ? (t.delayMinutes > 30 ? '#EF4444' : '#F59E0B') : '#10B981' }}>
                        {late ? `${t.delayMinutes >= 60 ? `${Math.floor(t.delayMinutes / 60)}h ${t.delayMinutes % 60}m` : `${t.delayMinutes} min`} late` : 'On time'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {fetchedAt > 0 && <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function StationBoardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>Loading…</div>}>
      <BoardContent />
    </Suspense>
  );
}
