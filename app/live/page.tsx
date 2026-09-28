'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Radio, Calendar, AlertCircle, Train, MapPin, Navigation } from 'lucide-react';
import { trackTrain, LiveStatus, ApiError, RouteStation } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)',
  color: 'var(--text)', fontFamily: "var(--font-body), sans-serif",
  fontSize: 14, fontWeight: 700, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em',
  display: 'block', marginBottom: 6,
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

function LiveContent() {
  const searchParams = useSearchParams();
  const [trainNo, setTrainNo] = useState(searchParams.get('train') ?? '');
  const [date, setDate] = useState('');
  const [result, setResult] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const handleTrack = async (tn?: string, dt?: string) => {
    const tNo = tn ?? trainNo;
    const tDate = dt ?? (date || getTodayISO());
    if (tNo.length !== 5) { setError('Please enter a valid 5-digit train number.'); return; }
    setLoading(true); setError(''); setResult(null);
    try { setResult(await trackTrain(tNo, tDate)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not fetch live status.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = searchParams.get('train');
    if (t && t.length === 5) { setTrainNo(t); handleTrack(t, ''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIdx = result ? result.route.findIndex(s => s.stationCode === result.currentLocation.stationCode) : -1;
  const haltStations = result ? result.route.filter(s => s.isHalt || s.stationCode === result.currentLocation.stationCode) : [];

  // Auto-scroll to current station
  useEffect(() => {
    if (result && currentIdx !== -1) {
      setTimeout(() => {
        const el = document.getElementById('current-station-node');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait for render
    }
  }, [result, currentIdx]);

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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Train Number</label>
            <input style={inputStyle} value={trainNo}
              onChange={e => setTrainNo(e.target.value.replace(/\D/g,'').slice(0,5))}
              placeholder="12345" maxLength={5} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}><Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Journey Date</label>
            <input
              type="date"
              style={inputStyle}
              value={date}
              onChange={e => setDate(e.target.value)}
              min={(() => { const d = new Date(); d.setDate(d.getDate()-4); return d.toISOString().split('T')[0]; })()}
              max={(() => { const d = new Date(); d.setDate(d.getDate()+4); return d.toISOString().split('T')[0]; })()}
            />
          </div>
          <button onClick={() => handleTrack()} disabled={loading} className="premium-btn"
            style={{ width: '100%', maxWidth: 220, borderRadius: 12, padding: '12px 0', gap: 8 }}>
            {loading
              ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <><Navigation size={16} /> Track Train</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{error}
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
                  <span style={{ fontSize: 14, fontWeight: 800, background: 'var(--primary)', color: '#fff', padding: '4px 10px', borderRadius: 8 }}>
                    {result.trainNumber}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    <span className="live-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 800, letterSpacing: '0.05em' }}>LIVE</span>
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
              </div>
            </div>
            
            {result.currentLocation.stationCode && (
              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(52,144,139,0.2)' }}>
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

          {/* Rail Radar Style Route Timeline */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'flex', background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <div style={{ width: '90px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arrival</div>
              <div style={{ width: '50px' }} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 12 }}>Station</div>
              <div style={{ width: '90px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departure</div>
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
                    <div style={{ width: '90px', flexShrink: 0, textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {station.scheduledArrival ? (
                         <>
                           <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                             {formatTime(station.scheduledArrival)}
                           </span>
                           {station.actualArrival && station.actualArrival !== station.scheduledArrival && (
                             <span style={{ fontSize: 12, fontWeight: 800, color: delayColor(delayArr), marginTop: 4 }}>
                               {formatTime(station.actualArrival)}
                             </span>
                           )}
                         </>
                      ) : (
                         <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Source</span>
                      )}
                    </div>

                    {/* TRACK COLUMN */}
                    <div style={{ width: '50px', flexShrink: 0, position: 'relative' }}>
                       {topTrackStatus && <div style={getTrackStyle(topTrackStatus, 'top')} />}
                       {bottomTrackStatus && <div style={getTrackStyle(bottomTrackStatus, 'bottom')} />}
                       
                       {/* Current Station Node */}
                       {status === 'current' ? (
                         <div style={{
                           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                           width: 34, height: 34, borderRadius: '50%', backgroundColor: '#3B82F6',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                           boxShadow: '0 0 0 6px rgba(59,130,246,0.2)', animation: 'pulseBlue 2s infinite'
                         }}>
                            <Train size={18} color="#fff" />
                         </div>
                       ) : (
                         /* Passed/Upcoming Station Node */
                         <div style={{
                           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                           width: 16, height: 16, borderRadius: '50%',
                           backgroundColor: status === 'passed' ? 'var(--primary)' : 'var(--bg)',
                           border: `3px solid ${status === 'passed' ? 'var(--primary)' : 'var(--border)'}`,
                           zIndex: 2,
                         }} />
                       )}
                    </div>

                    {/* STATION INFO COLUMN */}
                    <div style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: status === 'current' ? '#3B82F6' : 'var(--text)', fontFamily: "var(--font-heading), sans-serif", letterSpacing: '0.02em' }}>
                          {station.stationName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                         <span>{station.stationCode}</span>
                         {station.distance > 0 && (
                           <>
                             <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                             <span>{station.distance} km</span>
                           </>
                         )}
                         {station.platform && (
                           <>
                             <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                             <span style={{ color: 'var(--primary)', background: 'rgba(52,144,139,0.1)', padding: '2px 6px', borderRadius: 4 }}>PF {station.platform}</span>
                           </>
                         )}
                      </div>
                    </div>

                    {/* DEPARTURE COLUMN */}
                    <div style={{ width: '90px', flexShrink: 0, textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {station.scheduledDeparture ? (
                         <>
                           <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                             {formatTime(station.scheduledDeparture)}
                           </span>
                           {station.actualDeparture && station.actualDeparture !== station.scheduledDeparture && (
                             <span style={{ fontSize: 12, fontWeight: 800, color: delayColor(delayDep), marginTop: 4 }}>
                               {formatTime(station.actualDeparture)}
                             </span>
                           )}
                         </>
                      ) : (
                         <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Dest</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseBlue {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
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
