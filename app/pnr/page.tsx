'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ticket, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { checkPNR, PnrStatus, ApiError } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: '1.5px solid var(--border)', backgroundColor: 'var(--bg)',
  color: 'var(--text)', fontFamily: "var(--font-body), sans-serif",
  fontSize: 20, fontWeight: 800, letterSpacing: '0.1em', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em',
  display: 'block', marginBottom: 6,
};

const infoItem = (label: string, value: string, sub?: string) => (
  <div key={label}>
    <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 2px' }}>{label}</p>
    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: sub ? '0 0 1px' : 0 }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: 'var(--primary)', margin: 0 }}>{sub}</p>}
  </div>
);

function statusColor(s: string): string {
  const u = s.toUpperCase();
  if (u.includes('CNF')) return '#10B981';
  if (u.includes('CAN')) return '#EF4444';
  if (u.includes('WL') || u.includes('RAC')) return '#F59E0B';
  return 'var(--muted)';
}

function StatusIcon({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u.includes('CNF')) return <CheckCircle2 size={18} color="#10B981" />;
  if (u.includes('CAN')) return <XCircle size={18} color="#EF4444" />;
  return <Clock size={18} color="#F59E0B" />;
}

function PnrContent() {
  const searchParams = useSearchParams();
  const [pnr, setPnr] = useState(searchParams.get('pnr') ?? '');
  const [result, setResult] = useState<PnrStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = pnr.replace(/\D/g, '');
    if (c.length !== 10) { setError('Please enter a valid 10-digit PNR number.'); return; }
    setLoading(true); setError(''); setResult(null);
    try { setResult(await checkPNR(c)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not fetch PNR status.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', fontFamily: "var(--font-body), sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ticket size={20} color="#F59E0B" />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>PNR Status</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>Check your railway booking status instantly</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24, marginBottom: 16 }}>
        <form onSubmit={handleCheck}>
          <label style={labelStyle}>PNR Number</label>
          <input style={inputStyle} value={pnr}
            onChange={e => setPnr(e.target.value.replace(/\D/g,'').slice(0,10))}
            placeholder="0000000000" maxLength={10} />
          <button type="submit" disabled={loading} className="premium-btn"
            style={{ width: '100%', marginTop: 16, borderRadius: 12, padding: '13px 0', gap: 8 }}>
            {loading
              ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <><Ticket size={17} /> Check Status</>}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Train info card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(52,144,139,0.12)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 8 }}>
                  {result.trainNumber}
                </span>
                <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 2px' }}>{result.trainName}</h2>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>PNR: {result.pnr}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 2px' }}>Chart Status</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>{result.chartStatus || 'Not Prepared'}</p>
              </div>
            </div>

            {/* Journey grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              {infoItem('From', result.journey.source.name, result.journey.source.code)}
              {infoItem('To', result.journey.destination.name, result.journey.destination.code)}
              {infoItem('Date', result.journey.dateOfJourney)}
              {infoItem('Class / Quota', `${result.journey.travelClass} / ${result.journey.quota}`)}
              {result.journey.boardingPoint.code && result.journey.boardingPoint.code !== result.journey.source.code &&
                <div style={{ gridColumn: '1 / -1' }}>{infoItem('Boarding Point', result.journey.boardingPoint.name, result.journey.boardingPoint.code)}</div>}
            </div>

            {/* Fare */}
            {(result.booking.fare > 0 || result.booking.ticketFare > 0) && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,144,139,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Fare Paid</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>₹{result.booking.fare || result.booking.ticketFare}</span>
              </div>
            )}
          </div>

          {/* Passengers card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>
              Passenger Status
            </h3>
            {result.passengers.map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusIcon status={p.current.status} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 2px' }}>Passenger {p.serialNumber || i + 1}</p>
                    {p.booking.details && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Booked: {p.booking.details}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: statusColor(p.current.status), margin: '0 0 2px' }}>{p.current.status}</p>
                  {p.current.coach && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{p.current.coach} / Berth {p.current.berthNo}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PnrPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>Loading…</div>}>
      <PnrContent />
    </Suspense>
  );
}
