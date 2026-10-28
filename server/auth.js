import crypto from 'node:crypto';
import { db } from './db.js';
import { msg } from './messages.js';

const COOKIE = 'gapper_session';
const DAY = 24 * 60 * 60 * 1000;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

// Only a hash of the token is stored, so a leaked database cannot be used to log in.
export function startSession(req, res, userId, remember = true) {
  const token = crypto.randomBytes(32).toString('base64url');
  const lifetime = remember ? 30 * DAY : DAY;
  const expires = new Date(Date.now() + lifetime);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, expires.toISOString().replace('T', ' ').slice(0, 19));
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (remember) parts.push(`Max-Age=${lifetime / 1000}`);
  if (req.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function endSession(req, res) {
  const token = readCookie(req, COOKIE);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function loadUser(req, _res, next) {
  const token = readCookie(req, COOKIE);
  req.user = null;
  if (token) {
    req.user = db.prepare(`
      SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')`).get(sha256(token)) || null;
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: msg(req.lang, 'login_required') });
  next();
}

// Cross-site forms cannot set custom headers, so requiring one blocks CSRF on cookie-authenticated writes.
export function requireAppHeader(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  if (req.get('X-Gapper') !== '1') return res.status(403).json({ error: msg(req.lang, 'blocked') });
  next();
}

// Small in-memory limiter for login/sign-up attempts per IP.
const attempts = new Map();
export function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.reset < now) {
      attempts.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: msg(req.lang, 'too_many') });
    }
    next();
  };
}

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    isGuest: !!u.is_guest,
    program: u.program,
    year: u.year,
    semester: u.semester,
    onboarded: !!u.onboarded,
    createdAt: u.created_at,
  };
}
