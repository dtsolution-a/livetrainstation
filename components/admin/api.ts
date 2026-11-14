export class AdminApiError extends Error {
  constructor(message: string, public status: number, public data: Record<string, unknown> = {}) {
    super(message);
  }
}

/** JSON call to the admin API. Sends the CSRF header the server requires on writes. */
export async function api<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'ls-admin' };
  let body: BodyInit | undefined;
  if (init.form) body = init.form;
  else if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, { method: init.method || 'GET', headers, body, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new AdminApiError('Could not reach the server. Check your connection.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError((data as { error?: string }).error || 'Request failed.', res.status, data);
  return data as T;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export interface AdminUser {
  id: string; email: string; name: string; role: string; active: boolean;
  mustChangePassword: boolean; twoFactor: boolean; createdAt: string; lastLoginAt: string | null;
}
