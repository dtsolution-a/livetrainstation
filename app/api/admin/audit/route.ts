import * as store from '@/lib/server/store';
import { route } from '@/lib/server/http';
import type { AuditEntry } from '@/lib/server/audit';

export const GET = route({ perm: ['audit.read'] }, async () => ({
  entries: store.get<AuditEntry[]>('audit').slice(-300).reverse(),
}));
