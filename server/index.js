import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { loadUser, requireAppHeader } from './auth.js';
import { api } from './api.js';
import { langOf } from './i18n.js';

const root = path.join(import.meta.dirname, '..');
const dev = process.argv.includes('--dev') || process.env.GAPPER_DEV === '1';
const port = Number(process.env.PORT) || 3400;

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

const setLang = (req, _res, next) => { req.lang = langOf(req); next(); };
app.use('/api', setLang, express.json({ limit: '64kb' }), loadUser, requireAppHeader, api);

if (dev) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(root, 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('No build found. Run "npm run build" first, or "npm run dev" for development.');
    process.exit(1);
  }
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, () => {
  console.log(`Gapper is running at http://localhost:${port}${dev ? ' (development)' : ''}`);
});
