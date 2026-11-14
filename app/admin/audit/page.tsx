'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

interface Entry { id: string; at: string; user: string; role: string | null; action: string; target: string; detail: string; ip: string }

export default function AuditPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (can('audit.read')) api<{ entries: Entry[] }>('/audit').then((r) => setRows(r.entries)).catch((e) => setError(errMsg(e)));
  }, [can]);

  const exportData = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'X-Requested-With': 'ls-admin' }, credentials: 'same-origin' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Export failed.');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `livetrainstation-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  if (!can('audit.read')) return <div className="a-alert err">You don’t have access to the activity log.</div>;

  return (
    <>
      <div className="a-head">
        <div><h1 className="a-h1">Activity log</h1><p className="a-sub" style={{ margin: 0 }}>Who changed what, and from where (last 300 events).</p></div>
        {can('backup.manage') && <button className="a-btn" disabled={busy} onClick={exportData}>{busy ? 'Preparing…' : 'Export all data (JSON)'}</button>}
      </div>
      {error && <div className="a-alert err">{error}</div>}
      <div className="a-card a-scroll">
        <table className="a-table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="a-muted" style={{ whiteSpace: 'nowrap' }}>{new Date(r.at).toLocaleString('en-IN')}</td>
                <td>{r.user}{r.role && <span className="a-muted a-small"> · {r.role}</span>}</td>
                <td><span className={`a-pill ${r.action.includes('failed') ? 'red' : r.action.includes('delete') ? 'amber' : ''}`}>{r.action}</span></td>
                <td>{r.target}{r.detail && <span className="a-muted a-small"> · {r.detail}</span>}</td>
                <td className="a-muted">{r.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="a-muted">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
