'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  enabled: boolean;
  /** Next poll delay in ms; re-evaluated after every refresh (adaptive polling). */
  getInterval: () => number;
  refresh: () => Promise<unknown>;
}

/**
 * Self-rescheduling poller (the web version of the app's `_scheduleNextRefresh`):
 * pauses while the tab is hidden, refreshes immediately when it becomes visible again,
 * and exposes the seconds left so the UI can show a countdown.
 */
export function useAutoRefresh({ enabled, getInterval, refresh }: Options) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const dueAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const getIntervalRef = useRef(getInterval);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    getIntervalRef.current = getInterval;
    refreshRef.current = refresh;
  });

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (tick.current) clearInterval(tick.current);
    timer.current = tick.current = null;
  }, []);

  const schedule = useCallback(() => {
    stop();
    const ms = Math.max(5_000, getIntervalRef.current());
    dueAt.current = Date.now() + ms;
    setSecondsLeft(Math.round(ms / 1000));
    tick.current = setInterval(() => setSecondsLeft(Math.max(0, Math.round((dueAt.current - Date.now()) / 1000))), 1000);
    timer.current = setTimeout(async () => {
      try { await refreshRef.current(); } finally { schedule(); }
    }, ms);
  }, [stop]);

  useEffect(() => {
    if (!enabled) { stop(); setSecondsLeft(0); return; }
    const onVis = () => {
      if (document.hidden) { stop(); setPaused(true); }
      else { setPaused(false); void refreshRef.current().finally(schedule); }
    };
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) schedule();
    return () => { document.removeEventListener('visibilitychange', onVis); stop(); };
  }, [enabled, schedule, stop]);

  /** Call after a manual refresh to restart the countdown. */
  const reset = useCallback(() => { if (enabled && !document.hidden) schedule(); }, [enabled, schedule]);

  return { secondsLeft, paused, reset };
}
