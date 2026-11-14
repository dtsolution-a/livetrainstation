'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg, type AdminUser } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

export default function UsersPage() {
  const { session, can } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Record<string, { label: string; description: string }>>({});
  const [error, setError] = useState('');
  const [secret, setSecret] = useState<{ email: string; pw: string } | null>(null);
  const [form, setForm] = useState({ email: '', name: '', role: 'editor' });

  const load = useCallback(() => {
    api<{ users: AdminUser[]; roles: typeof roles }>('/users').then((r) => { setUsers(r.users); setRoles(r.roles); }).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { if (can('users.manage')) load(); }, [can, load]);

  if (!can('users.manage')) return <div className="a-alert err">Only an owner can manage users.</div>;

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const r = await api<{ temporaryPassword: string }>('/users', { method: 'POST', body: form });
      setSecret({ email: form.email, pw: r.temporaryPassword });
      setForm({ email: '', name: '', role: 'editor' });
      load();
    } catch (err) { setError(errMsg(err)); }
  };
  const patch = async (u: AdminUser, body: Record<string, unknown>) => {
    setError('');
    try {
      const r = await api<{ temporaryPassword?: string }>(`/users/${u.id}`, { method: 'PUT', body });
      if (r.temporaryPassword) setSecret({ email: u.email, pw: r.temporaryPassword });
      load();
    } catch (err) { setError(errMsg(err)); }
  };
  const del = async (u: AdminUser) => {
    if (!confirm(`Delete ${u.email}?`)) return;
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <h1 className="a-h1">Users & roles</h1>
      <p className="a-sub">Give each person only the access they need.</p>
      {error && <div className="a-alert err">{error}</div>}
      {secret && (
        <div className="a-alert warn">
          Temporary password for <b>{secret.email}</b> (shown once — share it securely; they must change it at first sign-in):
          <code className="a-code" style={{ marginTop: 6 }}>{secret.pw}</code>
          <button className="a-btn sm" style={{ marginTop: 8 }} onClick={() => setSecret(null)}>Done</button>
        </div>
      )}

      <div className="a-card">
        <h2>Add a user</h2>
        <form onSubmit={add} className="a-actions">
          <input className="a-in" style={{ flex: 1, minWidth: 160 }} placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="a-in" style={{ flex: 1, minWidth: 200 }} type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="a-sel" style={{ width: 160 }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.entries(roles).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
          </select>
          <button className="a-btn primary">Create</button>
        </form>
        <p className="a-muted a-small">{roles[form.role]?.description}</p>
      </div>

      <div className="a-card a-scroll">
        <table className="a-table">
          <thead><tr><th>User</th><th>Role</th><th>2FA</th><th>Last sign-in</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b>{u.id === session.user.id && ' (you)'}<br /><span className="a-muted a-small">{u.email}</span></td>
                <td>
                  <select className="a-sel" style={{ width: 130 }} value={u.role} disabled={u.id === session.user.id} onChange={(e) => patch(u, { role: e.target.value })}>
                    {Object.entries(roles).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                  </select>
                  {!u.active && <span className="a-pill red" style={{ marginLeft: 6 }}>disabled</span>}
                </td>
                <td>{u.twoFactor ? <span className="a-pill green">on</span> : <span className="a-pill amber">off</span>}</td>
                <td className="a-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'never'}</td>
                <td>
                  {u.id !== session.user.id && (
                    <div className="a-actions">
                      <button className="a-btn sm" onClick={() => patch(u, { active: !u.active })}>{u.active ? 'Disable' : 'Enable'}</button>
                      <button className="a-btn sm" onClick={() => confirm(`Reset password for ${u.email}? Their 2FA will also be removed.`) && patch(u, { resetPassword: true })}>Reset password</button>
                      <button className="a-btn sm danger" onClick={() => del(u)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
