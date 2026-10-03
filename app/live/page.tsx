'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Radio, Calendar, AlertCircle, Train, MapPin, Navigation, RefreshCw, Share2, Check, Info, LayoutGrid } from 'lucide-react';
import { trackTrain, LiveStatus, ApiError, RouteStation } from '@/lib/api';
import { resolveTrainNumber } from '@/lib/lookup';
import { addTrainHistory, clearHistory, parseTrainEntry, removeHistory, useHistory } from '@/lib/history';
import { useAutoRefresh } from '@/lib/useAutoRefresh';
import TrainField from '@/components/TrainField';
import RecentChips from '@/components/RecentChips';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)',
  color: 'var(--text)', fontFamily: "var(--font-body), sans-serif",
  fontSize: 14, fontWeight: 700, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em',
  display: 'flex', alignItems: 'center', gap: 5, height: 16, marginBottom: 6,
};

function delayColor(delay?: number): string {
  if (delay == null) return 'var(--muted)';
  if (delay <= 5) return '#10B981'; // Green for on-time or slight delay
  if (delay <= 15) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red for significant delay
}

function formatTime(val?: string): string {
  if (!val) return '—';
  if (val.includes('T')) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        // Formats to match Rail Radar style, e.g., "10:23PM"
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toUpperCase();
      }
    } catch (e) {
      // fallback
    }
  }
  return val; 
}

/** Remaining km from the train's current position to the end of the route. */
function remainingKm(r: LiveStatus): number | null {
  const idx = r.route.findIndex((s) => s.stationCode === r.currentLocation.stationCode);
  if (idx === -1 || r.route.length === 0) return null;
  const cur = r.route[idx].distance;
  const next = r.route[idx + 1];
  const pos = next ? cur + (next.distance - cur) * r.currentLocation.segmentProgress : cur;
  return Math.max(0, r.route[r.route.length - 1].distance - pos);
}

/** Like the app's adaptive polling: poll a bit faster as the train nears its destination. */
function pollInterval(r: LiveStatus | null): number {
  const km = r ? remainingKm(r) : null;
  if (km == null) return 30_000;
  if (km > 100) return 60_000;
  if (km > 20) return 45_000;
  return 30_000;
}

interface RefreshSummary {
  where: string;
  next?: string;
  eta?: string;
  delay?: number;
  km?: number;
  updated: string;
}

/** What the "just refreshed" card shows: current position + next stop. */
function summarize(r: LiveStatus): RefreshSummary {
  const idx = r.route.findIndex((s) => s.stationCode === r.currentLocation.stationCode);
  const cur = idx >= 0 ? r.route[idx] : undefined;
  const nextIdx = r.route.findIndex((s, i) => i > idx && (s.isHalt || i === r.route.length - 1));
  const next = idx >= 0 && nextIdx > -1 ? r.route[nextIdx] : undefined;
  let km: number | undefined;
  if (cur && next) {
    const pos = cur.distance + (r.route[idx + 1] ? (r.route[idx + 1].distance - cur.distance) * r.currentLocation.segmentProgress : 0);
    km = Math.max(0, next.distance - pos);
  }
  return {
    where: cur ? `${r.currentLocation.isHalt ? 'Halted at' : 'Departed from'} ${cur.stationName}` : r.statusNote || 'Position updated',
    next: next?.stationName,
    eta: next ? formatTime(next.actualArrival || next.scheduledArrival) : undefined,
    delay: next?.delayArrival,
    km,
    updated: formatTime(r.lastUpdate),
  };
}

function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)} min ago`;
}

function LiveContent() {
  const searchParams = useSearchParams();
  const [trainNo, setTrainNo] = useState(searchParams.get('train') ?? '');
  const [date, setDate] = useState(searchParams.get('date') ?? '');
  const [result, setResult] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [autoOn, setAutoOn] = useState(true);
  const [toast, setToast] = useState<RefreshSummary | null>(null);
  const [toastShown, setToastShown] = useState(false);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef<{ no: string; date: string } | null>(null);
  const history = useHistory('train');

  useEffect(() => {
    try { if (localStorage.getItem('ls_live_auto') === '0') setAutoOn(false); } catch { /* ignore */ }
  }, []);
  const toggleAuto = () => {
    setAutoOn((v) => { try { localStorage.setItem('ls_live_auto', v ? '0' : '1'); } catch { /* ignore */ } return !v; });
  };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  /** Fetch live status. `silent` keeps the current timeline on screen (auto/manual refresh). */
  const fetchLive = useCallback(async (no: string, dt: string, silent: boolean) => {
    if (silent) setRefreshing(true); else { setLoading(true); setResult(null); }
    setError('');
    try {
      const data = await trackTrain(no, dt);
      setResult(data);
      setFetchedAt(Date.now());
      active.current = { no, date: dt };
      // Refreshed while the controls are scrolled out of view → pop a short summary card.
      if (silent && window.scrollY > 240) {
        toastTimers.current.forEach(clearTimeout);
        setToast(summarize(data));
        toastTimers.current = [
          setTimeout(() => setToastShown(true), 30),
          setTimeout(() => setToastShown(false), 3200),
          setTimeout(() => setToast(null), 3700),
        ];
      }
      if (!silent) {
        addTrainHistory(no, data.trainName);
        // Bring the current station into view once per load, not on background refreshes.
        setTimeout(() => document.getElementById('current-station-node')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
      }
    } catch (err) {
      // A failed background refresh keeps the last good data on screen.
      if (!silent) setError(err instanceof ApiError ? err.message : 'Could not fetch live status.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const handleTrack = async (tn?: string, dt?: string) => {
    const no = await resolveTrainNumber(tn ?? trainNo);
    if (!no) { setError('Pick a train from the suggestions or enter a valid 5-digit train number.'); return; }
    setTrainNo(no);
    const tDate = dt ?? date;
    const q = new URLSearchParams({ train: no, ...(tDate ? { date: tDate } : {}) });
    window.history.replaceState(null, '', `/live?${q}`);
    await fetchLive(no, tDate, false);
  };

  useEffect(() => {
    const t = searchParams.get('train');
    if (t && t.length === 5) handleTrack(t, searchParams.get('date') ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = !!result && result.route.length > 0
    && result.route[result.route.length - 1].stationCode === result.currentLocation.stationCode
    && result.currentLocation.segmentProgress === 0
    && (remainingKm(result) ?? 1) === 0;

  const { secondsLeft, paused, reset } = useAutoRefresh({
    enabled: !!result && autoOn && !finished,
    getInterval: () => pollInterval(result),
    refresh: async () => { const a = active.current; if (a) await fetchLive(a.no, a.date, true); },
  });

  const manualRefresh = async () => {
    const a = active.current;
    if (!a || refreshing) return;
    await fetchLive(a.no, a.date, true);
    reset();
  };

  const share = async () => {
    const url = `${location.origin}/live?train=${active.current?.no ?? trainNo}`;
    const title = result ? `${result.trainNumber} ${result.trainName} — live status` : 'Live train status';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* user cancelled */ }
  };

  const currentIdx = result ? result.route.findIndex(s => s.stationCode === result.currentLocation.stationCode) : -1;
  const haltStations = result ? result.route.filter(s => s.isHalt || s.stationCode === result.currentLocation.stationCode) : [];

  const getStatus = (s: RouteStation) => {
    if (!result) return 'upcoming';
    const idx = result.route.indexOf(s);
    if (idx < currentIdx) return 'passed';
    if (idx === currentIdx) return 'current';
    return 'upcoming';
  };

  const getTrackStyle = (type: 'passed' | 'upcoming', half: 'top' | 'bottom'): React.CSSProperties => {
    const color = type === 'passed' ? 'var(--primary)' : 'var(--border)';
    return {
      position: 'absolute',
      left: '50%', transform: 'translateX(-50%)',
      width: '12px',
      top: half === 'top' ? 0 : '50%',
      bottom: half === 'top' ? '50%' : 0,
      borderLeft: `2px solid ${color}`,
      borderRight: `2px solid ${color}`,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 6px, ${color} 6px, ${color} 8px)`,
      zIndex: 1,
    };
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px', fontFamily: "var(--font-body), sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '0 8px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(52,144,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Radio size={20} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Live Train Status</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>Real-time GPS tracking & delay info</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="live-form">
          <div>
            <label style={labelStyle}>Train Number or Name</label>
            <TrainField value={trainNo} onChange={setTrainNo} placeholder="Number or name, e.g. Rajdhani" onEnter={() => handleTrack()} ariaLabel="Train number or name" />
          </div>
          <div>
            <label style={labelStyle}><Calendar size={12} />Journey Date <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>(auto if blank)</span></label>
            <input
              type="date"
              className="rail-input"
              style={{ fontWeight: 700 }}
              value={date}
              onChange={e => setDate(e.target.value)}
              aria-label="Journey date (blank = auto live running)"
              min={(() => { const d = new Date(); d.setDate(d.getDate()-4); return d.toISOString().split('T')[0]; })()}
              max={(() => { const d = new Date(); d.setDate(d.getDate()+4); return d.toISOString().split('T')[0]; })()}
            />
          </div>
          <div>
            <label className="live-form-spacer" style={{ ...labelStyle, visibility: 'hidden' }} aria-hidden>.</label>
            <button onClick={() => handleTrack()} disabled={loading} className="premium-btn live-form-btn" style={{ borderRadius: 12, gap: 8, width: '100%' }}>
              {loading
                ? <span style={{ width: 18, height: 18, border: '2px solid rgba(128,128,128,0.35)', borderTopColor: 'var(--on-primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                : <><Navigation size={16} /> Track Train</>}
            </button>
          </div>
        </div>
      </div>

      {!result && !loading && (
        <RecentChips
          title="Recent trains"
          onClear={() => clearHistory('train')}
          chips={history.slice(0, 8).map((e) => {
            const { number, name } = parseTrainEntry(e);
            return { key: e, label: number, sub: name, onClick: () => { setTrainNo(number); void handleTrack(number); }, onRemove: () => removeHistory('train', e) };
          })}
        />
      )}

      {loading && (
        <>
          <div className="glass-card skeleton" style={{ height: 150, marginBottom: 20 }} />
          <div className="glass-card skeleton" style={{ height: 320 }} />
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}
            {/^\d{5}$/.test(trainNo) && <> · <Link href={`/train-info?train=${trainNo}`} style={{ color: 'inherit', textDecoration: 'underline' }}>View schedule instead</Link></>}
          </span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in">
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 20, background: 'linear-gradient(to right, var(--surface), rgba(52,144,139,0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, background: 'var(--primary)', color: 'var(--on-primary)', padding: '4px 10px', borderRadius: 8 }}>
                    {result.trainNumber}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: finished ? 'rgba(100,116,139,0.12)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    <span className={finished ? undefined : 'live-indicator'} style={{ width: 8, height: 8, borderRadius: '50%', background: finished ? 'var(--muted)' : '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: finished ? 'var(--muted)' : '#10B981', fontWeight: 800, letterSpacing: '0.05em' }}>{finished ? 'JOURNEY ENDED' : 'LIVE'}</span>
                  </div>
                </div>
                <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
                  {result.trainName}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>{result.statusNote}</p>
              </div>
              <div style={{ textAlign: 'right', background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Last Updated</p>
                <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px', color: 'var(--primary)' }}>{formatTime(result.lastUpdate)}</p>
                {result.date && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{result.date}</p>}
                {fetchedAt > 0 && <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Checked {ago(fetchedAt, now)}</p>}
              </div>
            </div>
            
            {result.currentLocation.stationCode && (
              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(52,144,139,0.2)' }}>
                <MapPin size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {result.currentLocation.isHalt ? 'Halted at' : 'Departed from'}
                  <strong style={{ fontWeight: 800, marginLeft: 6, fontSize: 15 }}>
                    {result.route.find(s => s.stationCode === result.currentLocation.stationCode)?.stationName ?? result.currentLocation.stationCode}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Refresh controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <button onClick={manualRefresh} disabled={refreshing} className="premium-btn" style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, gap: 6 }}>
              <RefreshCw size={14} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} /> {refreshing ? 'Updating…' : 'Refresh'}
            </button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoOn} onChange={toggleAuto} style={{ accentColor: 'var(--primary)' }} />
              Auto-refresh
              {autoOn && !finished && (
                <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {paused ? 'paused' : `· ${secondsLeft}s`}
                </span>
              )}
            </label>
            <button onClick={share} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-body), sans-serif' }}>
              {copied ? <><Check size={14} /> Link copied</> : <><Share2 size={14} /> Share</>}
            </button>
            <Link href={`/train-info?train=${result.trainNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', textDecoration: 'none' }}>
              <Info size={14} /> Schedule
            </Link>
            <Link href={`/coach-position?train=${result.trainNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', textDecoration: 'none' }}>
              <LayoutGrid size={14} /> Coaches
            </Link>
          </div>

          {/* Rail Radar Style Route Timeline */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'flex', background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <div className="col-time" style={{ flexShrink: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arr<span className="hide-mobile">ival</span></div>
              <div className="col-track" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 12 }}>Station</div>
              <div className="col-time" style={{ flexShrink: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dep<span className="hide-mobile">arture</span></div>
            </div>

            <div style={{ padding: '12px 0' }}>
              {haltStations.map((station, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === haltStations.length - 1;
                const status = getStatus(station);
                
                const topTrackStatus = isFirst ? null : (status === 'upcoming' ? 'upcoming' : 'passed');
                const bottomTrackStatus = isLast ? null : (status === 'passed' ? 'passed' : 'upcoming');

                const delayArr = station.delayArrival;
                const delayDep = station.delayDeparture;

                return (
                  <div 
                    key={`${station.stationCode}-${idx}`} 
                    id={status === 'current' ? 'current-station-node' : undefined}
                    style={{ display: 'flex', position: 'relative', minHeight: '90px' }}
                  >
                    
                    {/* ARRIVAL COLUMN */}
                    <div className="col-time" style={{ flexShrink: 0, textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {station.scheduledArrival ? (
                         <>
                           <span style={{ fontSize: 'clamp(11px, 3.5vw, 13px)', fontWeight: 700, color: 'var(--text)' }}>
                             {formatTime(station.scheduledArrival)}
                           </span>
                           {station.actualArrival && station.actualArrival !== station.scheduledArrival && (
                             <span style={{ fontSize: 'clamp(11px, 3.5vw, 12px)', fontWeight: 800, color: delayColor(delayArr), marginTop: 4 }}>
                               {formatTime(station.actualArrival)}
                             </span>
                           )}
                         </>
                      ) : (
                         <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Src</span>
                      )}
                    </div>

                    {/* TRACK COLUMN */}
                    <div className="col-track" style={{ flexShrink: 0, position: 'relative' }}>
                       {topTrackStatus && <div style={getTrackStyle(topTrackStatus, 'top')} />}
                       {bottomTrackStatus && <div style={getTrackStyle(bottomTrackStatus, 'bottom')} />}
                       
                       {/* Current Station Node */}
                       {status === 'current' ? (
                         <div style={{
                           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                           width: 28, height: 28, borderRadius: '50%', backgroundColor: '#3B82F6',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                           boxShadow: '0 0 0 4px rgba(59,130,246,0.2)', animation: 'pulseBlue 2s infinite'
                         }}>
                            <Train size={14} color="#fff" />
                         </div>
                       ) : (
                         /* Passed/Upcoming Station Node */
                         <div style={{
                           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                           width: 14, height: 14, borderRadius: '50%',
                           backgroundColor: status === 'passed' ? 'var(--primary)' : 'var(--bg)',
                           border: `3px solid ${status === 'passed' ? 'var(--primary)' : 'var(--border)'}`,
                           zIndex: 2,
                         }} />
                       )}
                    </div>

                    {/* STATION INFO COLUMN */}
                    <div style={{ flex: 1, padding: '24px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 800, color: status === 'current' ? '#3B82F6' : 'var(--text)', fontFamily: "var(--font-heading), sans-serif", letterSpacing: '0.02em', wordBreak: 'break-word' }}>
                          {station.stationName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                         <span>{station.stationCode}</span>
                         {station.distance > 0 && (
                           <>
                             <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
                             <span>{station.distance} km</span>
                           </>
                         )}
                         {station.platform && (
                           <>
                             <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
                             <span style={{ color: 'var(--primary)', background: 'rgba(52,144,139,0.1)', padding: '2px 4px', borderRadius: 4, whiteSpace: 'nowrap' }}>PF {station.platform}</span>
                           </>
                         )}
                      </div>
                    </div>

                    {/* DEPARTURE COLUMN */}
                    <div className="col-time" style={{ flexShrink: 0, textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {station.scheduledDeparture ? (
                         <>
                           <span style={{ fontSize: 'clamp(11px, 3.5vw, 13px)', fontWeight: 700, color: 'var(--text)' }}>
                             {formatTime(station.scheduledDeparture)}
                           </span>
                           {station.actualDeparture && station.actualDeparture !== station.scheduledDeparture && (
                             <span style={{ fontSize: 'clamp(11px, 3.5vw, 12px)', fontWeight: 800, color: delayColor(delayDep), marginTop: 4 }}>
                               {formatTime(station.actualDeparture)}
                             </span>
                           )}
                         </>
                      ) : (
                         <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Dest</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {result && (
        <button onClick={manualRefresh} disabled={refreshing} aria-label="Refresh live status" className="live-fab">
          <RefreshCw size={22} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
        </button>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="live-toast" style={{ opacity: toastShown ? 1 : 0, transform: `translate(-50%, ${toastShown ? 0 : -8}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="live-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#10B981' }}>UPDATED · {toast.updated}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{toast.where}</p>
          {toast.next && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              Next: <strong style={{ color: 'var(--text)' }}>{toast.next}</strong>
              {toast.eta && toast.eta !== '—' && <> · {toast.eta}</>}
              {toast.km != null && <> · {Math.round(toast.km)} km</>}
              {toast.delay != null && toast.delay > 0 && <span style={{ color: toast.delay > 15 ? '#EF4444' : '#F59E0B', fontWeight: 800 }}> · {toast.delay} min late</span>}
              {toast.delay != null && toast.delay <= 0 && <span style={{ color: '#10B981', fontWeight: 800 }}> · on time</span>}
            </p>
          )}
        </div>
      )}
      <style>{`
        .live-fab {
          position: fixed; right: 18px; bottom: calc(18px + env(safe-area-inset-bottom)); z-index: 45;
          width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
          background: var(--primary); color: var(--on-primary);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28); transition: transform 0.15s ease, opacity 0.2s ease;
        }
        .live-fab:active { transform: scale(0.94); }
        .live-fab:disabled { opacity: 0.75; }
        .live-toast {
          position: fixed; top: 76px; left: 50%; z-index: 70; width: min(92vw, 420px);
          padding: 14px 16px; border-radius: 16px; pointer-events: none;
          background: var(--surface); border: 1px solid var(--border);
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseBlue {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .live-form { display: grid; grid-template-columns: minmax(0, 1fr) 210px 160px; gap: 12px; align-items: start; }
        .live-form .rail-input, .live-form-btn { height: 46px; }
        .live-form-btn { padding: 0 16px; }
        @media (max-width: 720px) {
          .live-form { grid-template-columns: 1fr; gap: 14px; }
          .live-form-spacer { display: none !important; }
        }
        .col-time { width: 90px; }
        .col-track { width: 50px; }
        .input-wrap { flex: 1 1 160px; }
        @media (max-width: 480px) {
          .col-time { width: 70px; }
          .col-track { width: 36px; }
          .input-wrap { flex: 1 1 120px; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>Loading…</div>}>
      <LiveContent />
    </Suspense>
  );
}
