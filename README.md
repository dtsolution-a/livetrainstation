# Live Train Station

Next.js 16 website for live train status, PNR, station board and more — with a built-in **admin panel** (`/admin`)
for blogs, SEO, media and users.

- Admin features: blog editor (draft / publish / schedule), per-page SEO, sitemap & robots, redirects, analytics IDs,
  media library, users & roles, 2FA, activity log, export.
- Deploy on MilesWeb: see **[DEPLOY-MILESWEB.md](DEPLOY-MILESWEB.md)**. Env vars: `.env.example`.

## Local development

```bash
npm install
# .env.local  →  ADMIN_EMAIL=you@example.com  ADMIN_PASSWORD=<a strong password>
npm run dev        # http://localhost:3000  (admin at /admin)
```

## Production

```bash
npm run build && npm start     # node server.js
```
Runtime data lives in `DATA_DIR` (default `./data`, git-ignored).
