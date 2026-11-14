import * as store from './store';

const MAX = 3000;

export interface AuditEntry {
  id: string; at: string; userId: string | null; user: string; role: string | null;
  action: string; target: string; detail: string; ip: string;
}

/** Fire-and-forget: a failed audit write must never break the action itself. */
export function audit(
  who: { user?: { id: string; name?: string; email: string; role: string } | null; ip?: string },
  action: string, target = '', detail = '',
) {
  const u = who.user;
  const entry: AuditEntry = {
    id: store.newId(),
    at: new Date().toISOString(),
    userId: u?.id || null,
    user: u ? u.name || u.email : 'system',
    role: u?.role || null,
    action,
    target: String(target || '').slice(0, 200),
    detail: String(detail || '').slice(0, 500),
    ip: who.ip || '',
  };
  store
    .update<AuditEntry[]>('audit', (list) => {
      list.push(entry);
      return list.length > MAX ? list.slice(list.length - MAX) : list;
    })
    .catch((err) => console.error('[audit] failed:', err.message));
}
