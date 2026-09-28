'use client';

import { useState } from 'react';
import { LayoutGrid, AlertCircle, Train } from 'lucide-react';
import { getCoachPosition, ApiError } from '@/lib/api';

interface CoachData {
  coaches?: Array<{ coach: string; type: string; position?: number }>;
  trainName?: string;
  trainNumber?: string;
  [key: string]: unknown;
}

const coachTypeColors: Record<string, string> = {
  'AC': 'bg-blue-100 text-blue-700 border-blue-200',
  '1A': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '2A': 'bg-blue-100 text-blue-700 border-blue-200',
  '3A': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'SL': 'bg-green-100 text-green-700 border-green-200',
  'CC': 'bg-purple-100 text-purple-700 border-purple-200',
  'GEN': 'bg-gray-100 text-gray-700 border-gray-200',
  'FC': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'EOG': 'bg-red-100 text-red-700 border-red-200',
  'ENGINE': 'bg-red-200 text-red-800 border-red-300',
  'LOCO': 'bg-red-200 text-red-800 border-red-300',
  'PANTRY': 'bg-orange-100 text-orange-700 border-orange-200',
  'DEFAULT': 'bg-[var(--border)] text-[var(--muted)] border-[var(--border)]',
};

function getCoachColor(type: string): string {
  const key = Object.keys(coachTypeColors).find(k => type.toUpperCase().includes(k));
  return coachTypeColors[key ?? 'DEFAULT'] ?? coachTypeColors.DEFAULT;
}

export default function CoachPositionPage() {
  const [trainNo, setTrainNo] = useState('');
  const [result, setResult] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainNo.trim() || trainNo.length !== 5) {
      setError('Please enter a valid 5-digit train number.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getCoachPosition(trainNo.trim()) as CoachData;
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not fetch coach data.');
    } finally {
      setLoading(false);
    }
  };

  const rawCoaches = (result?.rake || result?.coaches || []) as any[];
  const coaches = rawCoaches
    .map(c => ({
      coach: c.code || c.coach || '',
      type: c.classType || c.type || '',
    }))
    .filter(c => c.coach && c.type !== 'LOCO');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center">
          <LayoutGrid size={20} className="text-cyan-600" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold">Coach Position</h1>
      </div>
      <p className="text-[var(--muted)] mb-8">Find coach arrangement and positions for any train</p>

      {/* Input */}
      <div className="glass-card p-6 mb-8">
        <form onSubmit={handleFetch}>
          <label className="text-xs font-bold text-[var(--muted)] mb-1 block uppercase tracking-wider">Train Number</label>
          <div className="flex gap-3">
            <input
              value={trainNo}
              onChange={(e) => setTrainNo(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="5-digit train number"
              maxLength={5}
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold tracking-wider"
            />
            <button
              type="submit"
              disabled={loading}
              className="premium-btn flex items-center gap-2 px-6"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LayoutGrid size={18} /> Get Coaches</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in">
          {(result.trainName || result.trainNumber) && (
            <div className="glass-card p-4 mb-4 flex items-center gap-3">
              <Train size={20} className="text-[var(--primary)]" />
              <div>
                <p className="font-bold">{result.trainName ?? ''}</p>
                {result.trainNumber && <p className="text-xs text-[var(--muted)]">Train #{result.trainNumber}</p>}
              </div>
            </div>
          )}

          {coaches.length > 0 ? (
            <div className="glass-card p-6">
              <h3 className="font-heading font-bold text-lg mb-2">Coach Arrangement</h3>
              <p className="text-xs text-[var(--muted)] mb-6">← Engine end &nbsp; | &nbsp; Rear end →</p>
              
              {/* Visual coach diagram */}
              <div className="overflow-x-auto pb-4">
                <div className="flex items-center gap-1 min-w-max">
                  {/* Engine */}
                  <div className="flex-shrink-0 w-16 h-14 rounded-xl bg-red-200 border-2 border-red-300 flex items-center justify-center text-xs font-bold text-red-800">
                    LOCO
                  </div>
                  
                  {coaches.map((coach, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold ${getCoachColor(coach.type)}`}
                    >
                      <span>{coach.coach}</span>
                      <span className="text-[10px] opacity-70">{coach.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-2">
                {Object.entries({
                  '1A': 'First AC',
                  '2A': 'Second AC',
                  '3A': 'Third AC',
                  'SL': 'Sleeper',
                  'CC': 'Chair Car',
                  'GEN': 'General',
                }).map(([code, label]) => (
                  <span key={code} className={`text-xs px-2 py-0.5 rounded border font-semibold ${coachTypeColors[code]}`}>
                    {code} — {label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-[var(--muted)]">
              <LayoutGrid size={40} className="mx-auto mb-4 opacity-30" />
              <p>Coach position data not available for this train.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
