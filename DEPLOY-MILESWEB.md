# Deploying Live Train Station on MilesWeb (GitHub → mPanel)

The site is now **one Node.js app** (Next.js) that serves the public website **and** the admin panel (`/admin`).
Data (users, posts, media, SEO settings, activity log) is stored as JSON files in a **data folder outside the app**,
so redeploying code can never overwrite your content.

## 1. Which MilesWeb option?

From your mPanel screenshot you have *Applications → Node.js* and *GitHub* (auto-deploy). Use **Node.js app + GitHub**:

| Option | Verdict |
|---|---|
| **Node.js app, code from GitHub** | ✅ Recommended. Push to `main` → redeploy. Needs a writable data folder. |
| Static export / PHP | ❌ Not possible — the admin needs a server. |

> If the plan's Node.js app can't run `npm run build` (low RAM), build locally and upload — see "Build locally" below.

## 2. One-time setup

1. **mPanel → GitHub → Connect GitHub**, pick `dtsolution-a/livetrainstation`, branch `main`.
   Deploy path: a folder **outside** `public_html`, e.g. `/home/<user>/livetrainstation`.
2. **mPanel → Node.js** → create/point the app:

   | Field | Value |
   |---|---|
   | Node.js version | 20 or 22 |
   | Mode | Production |
   | App root | `livetrainstation` (the folder above) |
   | Startup file | `server.js` |

3. Open **Terminal** (or the app's "Run NPM install" button):
   ```bash
   cd ~/livetrainstation
   npm ci
   npm run build
   ```
4. **Create the data folder** (outside the app): `mkdir -p ~/livetrainstation-data`
5. **Environment variables** (Node.js app screen) — see `.env.example`:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `SITE_URL` | `https://livetrainstation.com` |
   | `DATA_DIR` | `/home/<user>/livetrainstation-data` |
   | `ADMIN_EMAIL` | your email (first owner account) |
   | `ADMIN_PASSWORD` | a strong password you choose *(or leave empty → a random one is written to `DATA_DIR/FIRST_RUN.txt`)* |
   | `SESSION_SECRET` | 40+ random characters |
   | `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | from Cloudflare (step 4) |

6. **Restart** the app → open `https://livetrainstation.com/admin` and sign in.
   Then: **My account → turn on two-step verification**, and delete `FIRST_RUN.txt` if it exists.

The six existing blog posts are imported automatically on first start.

## 3. Updating later

```bash
git pull           # (or let the mPanel GitHub auto-deploy do it)
npm ci && npm run build
# then Restart in the Node.js screen
```
`DATA_DIR` is never touched.

### Build locally (if the server can't build)
```bash
npm ci && npm run build
```
Upload the project **including `.next/`** (not `node_modules`, not `data/`), then `npm ci --omit=dev` on the server and restart.

## 4. Cloudflare (security + speed)

1. Add the domain to Cloudflare, change the nameservers at your registrar to the two Cloudflare ones.
   (Your current MilesWeb nameservers are only needed until this switch.)
2. **DNS**: `A  @  → 45.199.139.25` (shown on the mPanel overview) and `CNAME www → @`, both **Proxied (orange cloud)**.
3. **SSL/TLS → Full (strict)**; **Always Use HTTPS: On**; **Min TLS 1.2**; **HSTS** is already sent by the app.
4. **Turnstile** (Security → Turnstile → Add site, hostname `livetrainstation.com`) → paste the keys into the env vars above.
5. **Security → WAF → Custom rules** (free plan allows 5):
   - Block/challenge `/admin` and `/api/admin` for countries you don't use, or add an **IP allow-list** for your own IPs (strongest).
   - **Rate limiting rule**: `/api/admin/auth/login` → 10 requests / 10 min / IP → Block.
   - **Rate limiting rule**: `/api/rail/*` → 120 requests / min / IP → Managed challenge.
6. **Bot Fight Mode: On** (Security → Bots).
7. **Caching → Cache Rules**:
   - *Bypass cache*: URI path starts with `/admin`, `/api/`.
   - *Cache everything* (Edge TTL 1 month): `/_next/static/*`, `/uploads/*`, `/data/*`.
8. **Speed**: Brotli on, Early Hints on, Auto Minify off (Next already minifies).
9. The app reads the visitor's real IP from `CF-Connecting-IP`, so login rate-limits and the activity log are accurate.
   Lock the origin to Cloudflare if MilesWeb lets you (allow only Cloudflare IP ranges).

## 5. What is protected already

- Admin login: scrypt hashes, per-IP + per-account lockout, optional TOTP 2FA, Turnstile, signed `HttpOnly` / `SameSite=Strict` / `__Host-` cookie, "sign out everywhere".
- Every admin API call re-checks the session and the **role** (Owner / Admin / Editor / Writer / Viewer) on the server; writes also need a CSRF header + same-origin check.
- Uploads: real file-type sniffing (no SVG), random file names, `nosniff`, size limit.
- Blog content is HTML-escaped before rendering (no stored XSS); `javascript:` links are neutralised.
- CSP with a per-request nonce, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `noindex` on `/admin` and `/api`.
- The browser never talks to the railway data API directly — it goes through `/api/rail/*` (allow-listed paths, validated inputs, rate-limited, micro-cached).

## 6. Backups

- Admin → **Activity log → Export all data (JSON)** (owner only).
- Also include `DATA_DIR` (it holds `uploads/`) in MilesWeb's backup / your own periodic copy.

## 7. Lost access?

Stop the app, rename `DATA_DIR/users.json`, set `ADMIN_EMAIL`/`ADMIN_PASSWORD`, start the app (a fresh owner is created), then restore the rest.
