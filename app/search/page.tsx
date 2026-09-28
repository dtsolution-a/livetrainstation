'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, ArrowLeftRight, Train, Clock, MapPin } from 'lucide-react';
import { searchTrains, TrainSearchResult, ApiError } from '@/lib/api';
import { stations } from '@/lib/stations';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  borderRadius: 12, border: '1.5px solid var(--border)',
  backgroundColor: 'var(--bg)', color: 'var(--text)',
  fontFamily: "var(--font-body), sans-serif", fontSize: 14, fontWeight: 700,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.07em', display: 'block', marginBottom: 6,
};

// Autocomplete Input Component
function StationInput({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value.trim() ? stations.filter(s => 
    s.name.toLowerCase().includes(value.toLowerCase()) || 
    s.code.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 6) : stations.slice(0, 4);

  return (
    <div style={{ position: 'relative' }} ref={wrapperRef}>
      <input 
        style={inputStyle} 
        value={value} 
        onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder} 
      />
      {show && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 50, overflow: 'hidden'
        }}>
          {filtered.length > 0 ? filtered.map(s => (
            <div 
              key={s.code} 
              onClick={() => { onChange(s.code); setShow(false); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)', transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'rgba(52,144,139,0.1)', padding: '2px 6px', borderRadius: 4 }}>{s.code}</span>
            </div>
          )) : (
            <div style={{ padding: '12px', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>No station found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState<TrainSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const swap = () => { setFrom(to); setTo(from); setResults(null); };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) {
      setError('Please enter both source and destination station codes.');
      return;
    }
    setLoading(true); setError(''); setResults(null);
    try {
      const data = await searchTrains(from.trim().toUpperCase(), to.trim().toUpperCase());
      setResults(data);
      if (data.length === 0) setError('No trains found for this route. Make sure you use exact station codes (e.g. ST for Surat, CNB for Kanpur).');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px', fontFamily: "var(--font-body), sans-serif" }}>
      <h1 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
        Search Trains
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>Enter station names or codes</p>

      {/* Search Card */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>From Station</label>
              <StationInput value={from} onChange={setFrom} placeholder="e.g. Surat or ST" />
            </div>
            <button type="button" onClick={swap}
              style={{
                background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                color: 'var(--primary)', flexShrink: 0, marginBottom: 0,
                display: 'flex', alignItems: 'center',
              }}>
              <ArrowLeftRight size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>To Station</label>
              <StationInput value={to} onChange={setTo} placeholder="e.g. Kanpur or CNB" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="premium-btn"
            style={{ width: '100%', marginTop: 16, borderRadius: 12, padding: '13px 0', fontSize: 15, gap: 8 }}>
            {loading
              ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <><Search size={17} /> Search Trains</>
            }
          </button>
        </form>
      </div>

      {/* Tip */}
      <div className="glass-card" style={{ padding: '10px 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          💡 Start typing the city name (e.g., Surat) and select the exact station code from the dropdown.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, fontWeight: 600 }}>
            {results.length} train{results.length !== 1 ? 's' : ''} found · {from.toUpperCase()} → {to.toUpperCase()}
          </p>
          {results.map((t) => (
            <div key={t.trainNumber} className="glass-card"
              style={{ padding: '16px 18px', marginBottom: 10, cursor: 'pointer' }}
              onClick={() => router.push(`/live?train=${t.trainNumber}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(52,144,139,0.12)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6 }}>
                      {t.trainNumber}
                    </span>
                    <strong style={{ fontSize: 14, color: 'var(--text)', fontFamily: "var(--font-heading), sans-serif" }}>
                      {t.trainName}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {t.fromTime} → {t.toTime}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ArrowRight size={12} /> {t.travelTime}</span>
                    {t.distance && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {t.distance} km</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Train size={12} /> {t.halts} halts</span>
                  </div>
                  {t.runningDays && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Runs: {t.runningDays}</p>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/live?train=${t.trainNumber}`); }}
                  style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                    border: '1.5px solid var(--primary)', borderRadius: 10,
                    padding: '6px 14px', cursor: 'pointer', background: 'none',
                    flexShrink: 0, whiteSpace: 'nowrap',
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
