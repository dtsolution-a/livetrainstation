'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import Combobox, { type Option } from './Combobox';
import { preloadLookup, searchStations, stationName } from '@/lib/lookup';
import { removeHistory, useHistory } from '@/lib/history';

const toOption = (s: { code: string; name: string }): Option => ({
  id: s.code, text: `${s.name} (${s.code})`, badge: s.code, title: s.name,
});

interface Props {
  /** Station code once picked, otherwise whatever the user is typing. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  large?: boolean;
  ariaLabel?: string;
}

export default function StationField({ value, onChange, placeholder, onEnter, large, ariaLabel }: Props) {
  const [text, setText] = useState('');
  const emitted = useRef<string | null>(null);
  const history = useHistory('station');
  const [recents, setRecents] = useState<Option[]>([]);

  // Keep the visible text in sync when the parent changes the value (swap, recent route, etc.).
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    if (!value) { setText(''); return; }
    if (/^[A-Z0-9-]{1,6}$/.test(value)) stationName(value).then((n) => setText(n === value ? value : `${n} (${value})`));
    else setText(value);
  }, [value]);

  useEffect(() => {
    let live = true;
    Promise.all(history.slice(0, 6).map(async (c) => toOption({ code: c, name: await stationName(c) })))
      .then((r) => { if (live) setRecents(r); });
    return () => { live = false; };
  }, [history]);

  return (
    <Combobox
      text={text}
      onText={(t) => { setText(t); emitted.current = t; onChange(t); }}
      onPick={(o) => { setText(o.text); emitted.current = o.id; onChange(o.id); }}
      search={async (q) => (await searchStations(q)).map(toOption)}
      recents={recents}
      onRemoveRecent={(o) => removeHistory('station', o.id)}
      placeholder={placeholder ?? 'Station name or code'}
      icon={<MapPin size={16} />}
      onFocus={preloadLookup}
      onEnter={onEnter}
      large={large}
      ariaLabel={ariaLabel}
    />
  );
}
