import { route, userFromRequest } from '@/lib/server/http';
import { sessionInfo } from '@/lib/server/auth';

export const GET = route({ public: true }, async ({ req }) => {
  const user = userFromRequest(req);
  return user ? sessionInfo(user) : { user: null };
});
