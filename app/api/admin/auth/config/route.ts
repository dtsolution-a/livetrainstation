import { route } from '@/lib/server/http';
import { config } from '@/lib/server/config';
import { turnstileEnabled } from '@/lib/server/turnstile';

export const GET = route({ public: true }, async () => ({
  turnstileSiteKey: turnstileEnabled() ? config.turnstileSiteKey : '',
}));
