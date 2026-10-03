'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Train, MapPin, Clock, Info, Radio, LayoutGrid } from 'lucide-react';
import { getTrainInfo, TrainInfo, ApiError } from '@/lib/api';
import { resolveTrainNumber } from '@/lib/lookup';
import { addTrainHistory, clearHistory, parseTrainEntry, removeHistory, useHistory } from '@/lib/history';
import TrainField from '@/components/TrainField';
import RecentChips from '@/components/RecentChips';

function TrainInfoContent() {
  const searchParams = useSearchParams();
  const [trainNo, setTrainNo] = useState(searchParams.get('train') ?? '');
  const [result, setResult] = useState<TrainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const history = useHistory('train');

  const fetchInfo = async (value: string) => {
    if (!value.trim()) {
      setError('Please enter a train number or name.');
      return;
    }
    const no = await resolveTrainNumber(value);
    if (!no) { setError('No train found. Pick one from the suggestions.'); return; }
    setTrainNo(no);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getTrainInfo(no);
      setResult(data);
      addTrainHistory(no, data.trainName);
      window.history.replaceState(null, '', `/train-info?train=${no}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not fetch train info. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = (e: React.FormEvent) => { e.preventDefault(); void fetchInfo(trainNo); };

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const q = searchParams.get('train');
    if (q) void fetchInfo(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
          <Info size={20} className="text-purple-600" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold">Train Info</h1>
      </div>
      <p className="text-[var(--muted)] mb-8">Complete schedule, route, and stop details</p>

      {/* Input */}
      <div className="glass-card p-6 mb-8">
        <form onSubmit={handleFetch}>
          <label className="text-xs font-bold text-[var(--muted)] mb-1 block uppercase tracking-wider">
            Train Number or Name
          </label>
          <TrainField value={trainNo} onChange={setTrainNo} placeholder="e.g. 12301 or Rajdhani" onEnter={() => void fetchInfo(trainNo)} />
          <button
            type="submit"
            disabled={loading}
            className="premium-btn w-full mt-5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Train size={18} /> Get Train Info</>
            )}
          </button>
        </form>
      </div>

      {!result && !loading && (
        <RecentChips
          title="Recent trains"
          onClear={() => clearHistory('train')}
          chips={history.slice(0, 8).map((e) => {
            const { number, name } = parseTrainEntry(e);
            return { key: e, label: number, sub: name, onClick: () => void fetchInfo(number), onRemove: () => removeHistory('train', e) };
          })}
        />
      )}
      {loading && <div className="glass-card skeleton" style={{ height: 260 }} />}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in space-y-4">
          {/* Header */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-lg">
                {result.trainNumber}
              </span>
              {result.type && (
                <span className="text-xs bg-[var(--border)] px-2 py-0.5 rounded font-bold text-[var(--muted)]">
                  {result.type}
                </span>
              )}
            </div>
            <h2 className="font-heading font-extrabold text-2xl">{result.trainName}</h2>
            {result.runningDays && result.runningDays.length > 0 && (
              <p className="text-sm text-[var(--muted)] mt-2">
                Runs on: <strong className="text-[var(--text)]">{result.runningDays.map(d => d.substring(0, 3)).join(', ')}</strong>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href={`/live?train=${result.trainNumber}`} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-[1.5px] border-[var(--primary)] text-[var(--primary)]" style={{ textDecoration: 'none' }}>
                <Radio size={14} /> Live status
              </Link>
              <Link href={`/coach-position?train=${result.trainNumber}`} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)]" style={{ textDecoration: 'none' }}>
                <LayoutGrid size={14} /> Coach position
              </Link>
            </div>
            {result.source && result.destination && (
              <div className="flex items-center gap-2 mt-3 text-sm">
                <span className="font-bold text-[var(--primary)]">{result.source.name} ({result.source.code})</span>
                <span className="text-[var(--muted)]">→</span>
                <span className="font-bold text-[var(--primary)]">{result.destination.name} ({result.destination.code})</span>
              </div>
            )}
          </div>

          {/* Route */}
          {result.route && result.route.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-heading font-bold text-lg mb-6 flex items-center gap-2">
                <MapPin size={18} className="text-[var(--primary)]" />
                Route — {result.route.filter(s => s.isHalt).length} stops
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[var(--muted)] uppercase tracking-wider">
                      <th className="text-left pb-3 font-bold">#</th>
                      <th className="text-left pb-3 font-bold">Station</th>
                      <th className="text-left pb-3 font-bold hidden sm:table-cell">
                        <Clock size={12} className="inline mr-1" />Arrival
                      </th>
                      <th className="text-left pb-3 font-bold hidden sm:table-cell">Departure</th>
                      <th className="text-right pb-3 font-bold">km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.route.filter(s => s.isHalt).map((s, idx) => (
                      <tr
                        key={`${s.stationCode}-${s.sequence}-${idx}`}
                        className={`border-t border-[var(--border)] ${idx === 0 || idx === result.route!.filter(st => st.isHalt).length - 1 ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--border)]/30'}`}
                      >
                        <td className="py-3 pr-3 text-[var(--muted)] font-mono text-xs">{s.sequence}</td>
                        <td className="py-3 pr-4">
                          <p className="font-bold">{s.stationName}</p>
                          <p className="text-xs text-[var(--muted)]">{s.stationCode}</p>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell font-mono text-xs">
                          {s.scheduledArrival || '—'}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell font-mono text-xs">
                          {s.scheduledDeparture || '—'}
                        </td>
                        <td className="py-3 text-right text-xs text-[var(--muted)]">{s.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrainInfoPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-10 text-[var(--muted)]">Loading...</div>}>
      <TrainInfoContent />
    </Suspense>
  );
}
