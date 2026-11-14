/**
 * Production entry point for Node.js hosting panels (MilesWeb mPanel / cPanel "Setup Node.js App").
 *
 *   Application startup file:  server.js
 *
 * Passenger/PM2 provide PORT; locally it falls back to 3000. Run `npm run build` first.
 */
const { createServer } = require('node:http');
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
