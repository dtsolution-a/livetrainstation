'use client';

import { useEffect, useRef, useState } from 'react';
import { Train } from 'lucide-react';
import Combobox, { type Option } from './Combobox';
import { preloadLookup, searchTrains, trainName, type TrainEntry } from '@/lib/lookup';
import { parseTrainEntry, removeHistory, useHistory } from '@/lib/history';

const toOption = (t: Pick<TrainEntry, 'number' | 'name'> & Partial<TrainEntry>): Option => ({
  id: t.number,
  text: t.number,
  badge: t.number,
  title: t.name || 'Train',
  subtitle: t.from && t.to ? `${t.from} → ${t.to}` : undefined,
});

interface Props {
  /** Train number (digits) or whatever the user is typing. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  large?: boolean;
  ariaLabel?: string;
  /** Called with the picked train's name so callers can store it in history. */
  onPickTrain?: (t: { number: string; name: string }) => void;
}

export default function TrainField({ value, onChange, placeholder, onEnter, large, ariaLabel, onPickTrain }: Props) {
  const [text, setText] = useState(value);
  const emitted = useRef(value);
  const history = useHistory('train');
  const [pickedName, setPickedName] = useState('');
  const recents = history.slice(0, 6).map((e) => {
    const { number, name } = parseTrainEntry(e);
    return toOption({ number, name });
  });

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setText(value);
  }, [value]);

  // Show the name of a fully-typed train number under the field.
  useEffect(() => {
    let live = true;
    if (/^\d{5}$/.test(text)) trainName(text).then((n) => { if (live) setPickedName(n); });
    else setPickedName('');
    return () => { live = false; };
  }, [text]);

  return (
    <div>
      <Combobox
        text={text}
        onText={(t) => { setText(t); emitted.current = t; onChange(t); }}
        onPick={(o) => { setText(o.id); emitted.current = o.id; onChange(o.id); onPickTrain?.({ number: o.id, name: o.title }); }}
        search={async (q) => (await searchTrains(q)).map(toOption)}
        recents={recents}
        onRemoveRecent={(o) => {
          const e = history.find((h) => parseTrainEntry(h).number === o.id);
          if (e) removeHistory('train', e);
        }}
        placeholder={placeholder ?? 'Train number or name'}
        icon={<Train size={16} />}
        onFocus={preloadLookup}
        onEnter={onEnter}
        large={large}
        ariaLabel={ariaLabel}
      />
      {pickedName && (
        <p style={{ margin: '6px 4px 0', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{pickedName}</p>
      )}
    </div>
  );
}
