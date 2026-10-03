'use client';

import { Clock, X } from 'lucide-react';

export interface Chip { key: string; label: string; sub?: string; onClick: () => void; onRemove?: () => void }

/** Horizontal "recent searches" row shown under search cards (app: recent_searches sheet). */
export default function RecentChips({ title = 'Recent searches', chips, onClear }: { title?: string; chips: Chip[]; onClear?: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <Clock size={12} /> {title}
        </span>
        {onClear && (
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            Clear
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((c) => (
          <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 999, overflow: 'hidden' }}>
            <button
              onClick={c.onClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body), sans-serif', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {c.label}
              {c.sub && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{c.sub}</span>}
            </button>
            {c.onRemove && (
              <button aria-label={`Remove ${c.label}`} onClick={c.onRemove} style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', padding: '7px 8px', color: 'var(--muted)', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
