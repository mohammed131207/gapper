import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as content from './content.js';

const dataDir = process.env.DATA_DIR || path.join(import.meta.dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

// Locally the database is a plain SQLite file. When hosted, TURSO_DATABASE_URL points at a Turso database:
// the server keeps a local replica of it, so data survives restarts on hosts with a temporary disk.
export const HOSTED = Boolean(process.env.TURSO_DATABASE_URL);
const raw = await openDb();

async function openDb() {
  // DB_DRIVER=libsql tries the Turso driver on a local file, without a network.
  if (HOSTED || process.env.DB_DRIVER === 'libsql') {
    const { default: Libsql } = await import('libsql');
    if (!HOSTED) return new Libsql(path.join(dataDir, 'gapper-libsql.db'));
    const conn = new Libsql(path.join(dataDir, 'turso-replica.db'), {
      syncUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    conn.sync();
    return conn;
  }
  return new DatabaseSync(path.join(dataDir, 'gapper.db'));
}

// Same small API for both drivers. The Turso driver adds a `_metadata` field to rows, which is removed here.
const clean = (row) => {
  if (row && typeof row === 'object' && '_metadata' in row) delete row._metadata;
  return row;
};
export const db = {
  exec: (sql) => raw.exec(sql),
  prepare(sql) {
    const stmt = raw.prepare(sql);
    return {
      run: (...params) => stmt.run(...params),
      get: (...params) => clean(stmt.get(...params)),
      all: (...params) => stmt.all(...params).map(clean),
    };
  },
};

for (const pragma of ['journal_mode = WAL', 'foreign_keys = ON', 'busy_timeout = 3000']) {
  try { raw.exec(`PRAGMA ${pragma}`); } catch { /* Turso manages these itself */ }
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  is_guest      INTEGER NOT NULL DEFAULT 0,
  program       TEXT NOT NULL DEFAULT 'cs',
  year          INTEGER NOT NULL DEFAULT 1,
  semester      INTEGER NOT NULL DEFAULT 1,
  onboarded     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  short       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id             INTEGER PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL REFERENCES categories(slug),
  level          TEXT NOT NULL,
  minutes        INTEGER NOT NULL,
  icon           TEXT NOT NULL,
  summary        TEXT NOT NULL,
  why            TEXT NOT NULL,
  when_text      TEXT NOT NULL,
  steps          TEXT NOT NULL,
  practice       TEXT NOT NULL,
  mastery        TEXT NOT NULL,
  prerequisites  TEXT NOT NULL,
  related        TEXT NOT NULL,
  steps_count    INTEGER NOT NULL,
  practice_count INTEGER NOT NULL,
  active         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS programs (
  slug  TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  short TEXT NOT NULL,
  sort  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  program  TEXT NOT NULL REFERENCES programs(slug),
  year     INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  sort     INTEGER NOT NULL,
  PRIMARY KEY (program, skill_id)
);

CREATE TABLE IF NOT EXISTS resources (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL,
  source      TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_id    INTEGER REFERENCES skills(id),
  free        INTEGER NOT NULL DEFAULT 1,
  reviewed_at TEXT NOT NULL,
  sort        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id      INTEGER NOT NULL REFERENCES skills(id),
  status        TEXT NOT NULL DEFAULT 'not_started',
  steps_done    TEXT NOT NULL DEFAULT '[]',
  practice_done TEXT NOT NULL DEFAULT '[]',
  reflection    TEXT NOT NULL DEFAULT '',
  started_at    TEXT,
  completed_at  TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id   INTEGER NOT NULL REFERENCES skills(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS views (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id  INTEGER NOT NULL REFERENCES skills(id),
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating     INTEGER,
  message    TEXT NOT NULL,
  page       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_views_user ON views(user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

export function tx(fn) {
  if (typeof raw.transaction === 'function') return raw.transaction(fn)(); // Turso driver
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// The learning content lives in content.js (owned by the Product/Content role).
// A start re-syncs it when it changed, so editing content.js never touches users or their progress.
function syncContent() {
  const { categories, programs, skills, resources, roadmaps } = content;
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ categories, programs, skills, resources, roadmaps, reviewed: content.REVIEWED }))
    .digest('hex');
  if (db.prepare("SELECT value FROM meta WHERE key = 'content_hash'").get()?.value === hash) return;
  const slugs = new Set(skills.map((s) => s.slug));
  for (const s of skills) {
    for (const ref of [...s.prerequisites, ...s.related]) {
      if (!slugs.has(ref)) throw new Error(`content.js: skill "${s.slug}" references unknown skill "${ref}"`);
    }
  }

  tx(() => {
    const upCategory = db.prepare(`
      INSERT INTO categories (slug, name, short, description, icon, sort) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET name = excluded.name, short = excluded.short,
        description = excluded.description, icon = excluded.icon, sort = excluded.sort`);
    categories.forEach((c, i) => upCategory.run(c.slug, c.name, c.short, c.description, c.icon, i));

    db.exec('UPDATE skills SET active = 0');
    const upSkill = db.prepare(`
      INSERT INTO skills (slug, title, category, level, minutes, icon, summary, why, when_text, steps, practice,
        mastery, prerequisites, related, steps_count, practice_count, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(slug) DO UPDATE SET title = excluded.title, category = excluded.category, level = excluded.level,
        minutes = excluded.minutes, icon = excluded.icon, summary = excluded.summary, why = excluded.why,
        when_text = excluded.when_text, steps = excluded.steps, practice = excluded.practice, mastery = excluded.mastery,
        prerequisites = excluded.prerequisites, related = excluded.related, steps_count = excluded.steps_count,
        practice_count = excluded.practice_count, active = 1`);
    for (const s of skills) {
      upSkill.run(s.slug, s.title, s.category, s.level, s.minutes, s.icon, s.summary, s.why, s.when,
        JSON.stringify(s.steps), JSON.stringify(s.practice), JSON.stringify(s.mastery),
        JSON.stringify(s.prerequisites), JSON.stringify(s.related), s.steps.length, s.practice.checklist.length);
    }
    const idOf = Object.fromEntries(db.prepare('SELECT slug, id FROM skills').all().map((r) => [r.slug, r.id]));

    db.exec('DELETE FROM roadmap_items; DELETE FROM resources;');
    const upProgram = db.prepare(`
      INSERT INTO programs (slug, name, short, sort) VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET name = excluded.name, short = excluded.short, sort = excluded.sort`);
    programs.forEach((p, i) => upProgram.run(p.slug, p.name, p.short, i));

    const addItem = db.prepare('INSERT INTO roadmap_items (program, year, semester, skill_id, sort) VALUES (?, ?, ?, ?, ?)');
    for (const [program, years] of Object.entries(roadmaps)) {
      let sort = 0;
      for (const [key, list] of Object.entries(years)) {
        const [year, semester] = key.split('.').map(Number);
        for (const slug of list) {
          if (!idOf[slug]) throw new Error(`content.js: roadmap ${program} ${key} has unknown skill "${slug}"`);
          addItem.run(program, year, semester, idOf[slug], sort++);
        }
      }
    }

    const addResource = db.prepare(`
      INSERT INTO resources (title, url, type, source, description, skill_id, free, reviewed_at, sort)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    resources.forEach((r, i) => {
      if (r.skill && !idOf[r.skill]) throw new Error(`content.js: resource "${r.title}" has unknown skill "${r.skill}"`);
      addResource.run(r.title, r.url, r.type, r.source, r.description, r.skill ? idOf[r.skill] : null,
        r.free === false ? 0 : 1, r.reviewed || content.REVIEWED, i);
    });
    db.prepare(`INSERT INTO meta (key, value) VALUES ('content_hash', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(hash);
  });
}

syncContent();
db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
