/**
 * Production entry point for Node.js hosting panels (MilesWeb mPanel / cPanel "Setup Node.js App").
 *
 *   Application startup file:  server.js
 *
 * Passenger/PM2 provide PORT; locally it falls back to 3000. Run `npm run build` first.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('node:http');

/**
 * The panel has no "environment variables" screen, and the app folder (deploys/current) changes on
 * every deploy. So secrets live in ONE file outside the app: ~/livetrainstation.env (or ENV_FILE).
 * Real environment variables always win over the file. Must run before `next` is loaded.
 */
function loadEnvFile(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`[server] cannot read ${file}:`, err.message);
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  console.log(`[server] loaded settings from ${file}`);
}
loadEnvFile(process.env.ENV_FILE || path.join(os.homedir(), 'livetrainstation.env'));

const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error('[server] request failed:', err);
        if (!res.headersSent) { res.statusCode = 500; res.end('Internal Server Error'); }
      });
    });
    // Slow-loris protection (a reverse proxy / Cloudflare in front adds more).
    server.headersTimeout = 20_000;
    server.requestTimeout = 60_000;
    server.keepAliveTimeout = 65_000;
    server.listen(port, () => console.log(`[server] ready on port ${port} (${dev ? 'development' : 'production'})`));

    const stop = () => server.close(() => process.exit(0));
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
  })
  .catch((err) => {
    console.error('[server] failed to start:', err);
    process.exit(1);
  });
