'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Clock, X } from 'lucide-react';

export interface Option {
  id: string;
  /** Text placed in the input once picked. */
  text: string;
  badge: string;
  title: string;
  subtitle?: string;
}

interface Props {
  text: string;
  onText: (text: string) => void;
  onPick: (opt: Option) => void;
  search: (q: string) => Promise<Option[]>;
  /** Shown (with a clock icon + remove button) when the field is focused and empty. */
  recents?: Option[];
  onRemoveRecent?: (opt: Option) => void;
  placeholder?: string;
  icon?: ReactNode;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  onFocus?: () => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  large?: boolean;
  ariaLabel?: string;
}

/**
 * Accessible autocomplete: debounce-free (lookups are in-memory), keyboard
 * navigation, recent searches when empty — the web counterpart of the app's
 * StationField / TrainField.
 */
export default function Combobox({
  text, onText, onPick, search, recents = [], onRemoveRecent, placeholder, icon,
  inputMode = 'text', maxLength, onFocus, onEnter, autoFocus, large, ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Option[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const reqRef = useRef(0);

  const showingRecents = !text.trim();
  const options = showingRecents ? recents : results;

  useEffect(() => {
    const q = text.trim();
    if (!q) { setResults([]); return; }
    const req = ++reqRef.current;
    search(q).then((r) => { if (req === reqRef.current) { setResults(r); setActive(-1); } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (o: Option) => { onPick(o); setOpen(false); setActive(-1); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setOpen(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && options[active]) { e.preventDefault(); pick(options[active]); }
      else onEnter?.();
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Tab' && open && options.length > 0 && !showingRecents) {
      // Tab accepts the top suggestion, like most search boxes.
      const o = options[active >= 0 ? active : 0];
      if (o && text.trim().toUpperCase() !== o.text.toUpperCase()) pick(o);
    }
  };

  const show = open && options.length > 0;
  const noMatch = open && !showingRecents && results.length === 0 && text.trim().length > 1;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex', pointerEvents: 'none' }}>
          {icon}
        </span>
      )}
      <input
        className="rail-input"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel ?? placeholder}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        spellCheck={false}
        inputMode={inputMode}
        maxLength={maxLength}
        value={text}
        placeholder={placeholder}
        onChange={(e) => { onText(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); onFocus?.(); }}
        onKeyDown={onKeyDown}
        style={{
          fontWeight: 700,
          fontSize: large ? 16 : 14,
          padding: large ? '16px 16px 16px 44px' : icon ? '12px 16px 12px 40px' : '12px 16px',
        }}
      />

      {(show || noMatch) && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, padding: 4,
            listStyle: 'none', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 60,
            maxHeight: 320, overflowY: 'auto', textAlign: 'left',
          }}
        >
          {showingRecents && (
            <li style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent
            </li>
          )}
          {show && options.map((o, i) => (
            <li
              key={`${o.id}-${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer',
                borderRadius: 10, background: i === active ? 'rgba(52,144,139,0.12)' : 'transparent',
              }}
            >
              {showingRecents && <Clock size={14} color="var(--muted)" style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'rgba(52,144,139,0.12)', padding: '2px 7px', borderRadius: 6, flexShrink: 0, minWidth: 44, textAlign: 'center' }}>
                {o.badge}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</span>
                {o.subtitle && <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.subtitle}</span>}
              </span>
              {showingRecents && onRemoveRecent && (
                <button
                  type="button"
                  aria-label="Remove from history"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); onRemoveRecent(o); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4 }}
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
          {noMatch && <li style={{ padding: '12px', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>No match found</li>}
        </ul>
      )}
    </div>
  );
}
