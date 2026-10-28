import { Router } from 'express';
import { db, tx } from './db.js';
import {
  hashPassword, verifyPassword, startSession, endSession, requireUser, rateLimit, publicUser,
} from './auth.js';
import { msg } from './messages.js';
import {
  categoryText, matchesSearch, programText, searchTerms, resourceText, skillSearchText, skillSummary, skillText, skillTitle, yearThemes,
} from './i18n.js';

export const api = Router();

const STATUSES = ['not_started', 'in_progress', 'completed'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Errors carry a message key; the error handler translates it to the request's language.
class HttpError extends Error {
  constructor(status, key) {
    super(key);
    this.status = status;
    this.key = key;
  }
}
const fail = (status, key) => { throw new HttpError(status, key); };

function cleanName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60) fail(400, 'name_length');
  return name;
}
function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) fail(400, 'email_invalid');
  return email;
}
function cleanPassword(value) {
  const password = String(value ?? '');
  if (password.length < 8) fail(400, 'password_short');
  if (password.length > 200) fail(400, 'password_long');
  return password;
}

// ---------- Shared helpers ----------

const parse = (json, fallback) => { try { return JSON.parse(json); } catch { return fallback; } };

function percentOf(row) {
  if (row.status === 'completed') return 100;
  const total = row.steps_count + row.practice_count;
  if (!total) return 0;
  const done = parse(row.steps_done || '[]', []).length + parse(row.practice_done || '[]', []).length;
  return Math.min(100, Math.round((done / total) * 100));
}

function summary(row, lang) {
  return {
    slug: row.slug,
    title: skillTitle(row, lang),
    category: row.category,
    level: row.level,
    minutes: row.minutes,
    icon: row.icon,
    summary: skillSummary(row, lang),
    status: row.status || 'not_started',
    percent: percentOf(row),
  };
}

const SKILL_WITH_PROGRESS = `
  SELECT s.*, p.status, p.steps_done, p.practice_done, p.updated_at AS progress_updated
  FROM skills s LEFT JOIN progress p ON p.skill_id = s.id AND p.user_id = ?`;

function roadmapRows(userId, program) {
  return db.prepare(`
    SELECT s.*, p.status, p.steps_done, p.practice_done, ri.year, ri.semester
    FROM roadmap_items ri
    JOIN skills s ON s.id = ri.skill_id AND s.active = 1
    LEFT JOIN progress p ON p.skill_id = s.id AND p.user_id = ?
    WHERE ri.program = ?
    ORDER BY ri.year, ri.semester, ri.sort`).all(userId, program);
}

function counts(rows) {
  const out = { total: rows.length, completed: 0, inProgress: 0, notStarted: 0 };
  for (const r of rows) {
    if (r.status === 'completed') out.completed++;
    else if (r.status === 'in_progress') out.inProgress++;
    else out.notStarted++;
  }
  out.percent = out.total ? Math.round((out.completed / out.total) * 100) : 0;
  return out;
}

function getSkill(slug) {
  const skill = db.prepare('SELECT * FROM skills WHERE slug = ? AND active = 1').get(String(slug));
  if (!skill) fail(404, 'skill_not_found');
  return skill;
}

function getProgram(slug, lang) {
  return programText(db.prepare('SELECT slug, name, short FROM programs WHERE slug = ?').get(slug), lang);
}

// ---------- Auth ----------

const authLimit = rateLimit(20, 10 * 60 * 1000);

api.post('/auth/register', authLimit, (req, res) => {
  const name = cleanName(req.body?.name);
  const email = cleanEmail(req.body?.email);
  const password = cleanPassword(req.body?.password);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) fail(409, 'email_taken_login');
  const { lastInsertRowid } = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hashPassword(password));
  startSession(req, res, lastInsertRowid, true);
  res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)) });
});

api.post('/auth/login', authLimit, (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_guest = 0').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) fail(401, 'login_failed');
  startSession(req, res, user.id, req.body?.remember !== false);
  res.json({ user: publicUser(user) });
});

// A guest account lets students try Gapper before signing up; it can be upgraded later.
api.post('/auth/guest', authLimit, (req, res) => {
  const { lastInsertRowid } = db.prepare("INSERT INTO users (name, is_guest) VALUES ('Guest', 1)").run();
  startSession(req, res, lastInsertRowid, true);
  res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)) });
});

api.post('/auth/logout', (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

api.get('/auth/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

api.post('/auth/upgrade', requireUser, authLimit, (req, res) => {
  if (!req.user.is_guest) fail(400, 'already_account');
  const name = cleanName(req.body?.name);
  const email = cleanEmail(req.body?.email);
  const password = cleanPassword(req.body?.password);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) fail(409, 'email_taken');
  db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, is_guest = 0 WHERE id = ?')
    .run(name, email, hashPassword(password), req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

api.post('/auth/password', requireUser, authLimit, (req, res) => {
  if (req.user.is_guest) fail(400, 'guest_no_password');
  if (!verifyPassword(String(req.body?.current ?? ''), req.user.password_hash)) fail(400, 'current_password_wrong');
  const password = cleanPassword(req.body?.password);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), req.user.id);
  res.json({ ok: true });
});

// ---------- Profile ----------

api.patch('/me', requireUser, (req, res) => {
  const u = req.user;
  const body = req.body || {};
  const next = { name: u.name, program: u.program, year: u.year, semester: u.semester, onboarded: u.onboarded };
  if (body.name !== undefined) next.name = cleanName(body.name);
  if (body.program !== undefined) {
    if (!db.prepare('SELECT 1 FROM programs WHERE slug = ?').get(String(body.program))) fail(400, 'program_unknown');
    next.program = String(body.program);
  }
  if (body.year !== undefined) {
    const year = Number(body.year);
    if (![1, 2, 3, 4].includes(year)) fail(400, 'year_invalid');
    next.year = year;
  }
  if (body.semester !== undefined) {
    const semester = Number(body.semester);
    if (![1, 2].includes(semester)) fail(400, 'semester_invalid');
    next.semester = semester;
  }
  if (body.onboarded !== undefined) next.onboarded = body.onboarded ? 1 : 0;
  db.prepare('UPDATE users SET name = ?, program = ?, year = ?, semester = ?, onboarded = ? WHERE id = ?')
    .run(next.name, next.program, next.year, next.semester, next.onboarded, u.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)) });
});

api.delete('/me', requireUser, (req, res) => {
  if (!req.user.is_guest && !verifyPassword(String(req.body?.password ?? ''), req.user.password_hash)) {
    fail(400, 'password_wrong');
  }
  // Explicit deletes, because a hosted Turso database may not enforce ON DELETE CASCADE.
  tx(() => {
    for (const table of ['sessions', 'progress', 'bookmarks', 'views', 'feedback']) {
      db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(req.user.id);
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  });
  endSession(req, res);
  res.json({ ok: true });
});

// ---------- Content ----------

api.get('/meta', (req, res) => {
  const lang = req.lang;
  res.json({
    programs: db.prepare('SELECT slug, name, short FROM programs ORDER BY sort').all().map((p) => programText(p, lang)),
    categories: db.prepare('SELECT slug, name, short, description, icon FROM categories ORDER BY sort').all().map((c) => categoryText(c, lang)),
    years: yearThemes(lang),
    levels: LEVELS,
  });
});

api.get('/skills', requireUser, (req, res) => {
  const lang = req.lang;
  const { q, category, level } = req.query;
  let sql = `${SKILL_WITH_PROGRESS} WHERE s.active = 1`;
  const params = [req.user.id];
  if (category && category !== 'all') { sql += ' AND s.category = ?'; params.push(String(category)); }
  if (level && LEVELS.includes(level)) { sql += ' AND s.level = ?'; params.push(level); }
  let rows = db.prepare(sql).all(...params);

  const terms = searchTerms(String(q ?? '').slice(0, 80));
  if (terms.length) rows = rows.filter((r) => matchesSearch(skillSearchText(r), terms));

  const order = Object.fromEntries(db.prepare('SELECT slug, sort FROM categories').all().map((c) => [c.slug, c.sort]));
  const collator = new Intl.Collator(lang);
  const recommended = new Set(roadmapRows(req.user.id, req.user.program)
    .filter((r) => r.year === req.user.year && r.semester === req.user.semester).map((r) => r.slug));

  res.json({
    skills: rows
      .map((r) => ({ ...summary(r, lang), recommended: recommended.has(r.slug) }))
      .sort((a, b) => order[a.category] - order[b.category]
        || LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)
        || collator.compare(a.title, b.title)),
  });
});

api.get('/skills/:slug', requireUser, (req, res) => {
  const lang = req.lang;
  const skill = getSkill(req.params.slug);
  const uid = req.user.id;
  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ? AND skill_id = ?').get(uid, skill.id);
  const bookmarked = !!db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND skill_id = ?').get(uid, skill.id);
  db.prepare(`INSERT INTO views (user_id, skill_id) VALUES (?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET viewed_at = datetime('now')`).run(uid, skill.id);

  const linked = (slugs) => slugs.map((slug) => {
    const r = db.prepare(`${SKILL_WITH_PROGRESS} WHERE s.slug = ? AND s.active = 1`).get(uid, slug);
    return r ? summary(r, lang) : null;
  }).filter(Boolean);

  const placement = db.prepare(`
    SELECT ri.program, ri.year, ri.semester FROM roadmap_items ri
    JOIN programs p ON p.slug = ri.program WHERE ri.skill_id = ? ORDER BY p.sort`).all(skill.id);

  const text = skillText(skill, lang);
  const row = { ...skill, ...(progress || {}) };
  const category = db.prepare('SELECT slug, name, short, description, icon FROM categories WHERE slug = ?').get(skill.category);

  res.json({
    skill: {
      ...summary(row, lang),
      why: text.why,
      when: text.when,
      steps: text.steps,
      practice: text.practice,
      mastery: text.mastery,
      prerequisites: linked(parse(skill.prerequisites, [])),
      related: linked(parse(skill.related, [])),
      placement,
      categoryName: category ? categoryText(category, lang).name : skill.category,
    },
    progress: {
      status: progress?.status || 'not_started',
      stepsDone: parse(progress?.steps_done || '[]', []),
      practiceDone: parse(progress?.practice_done || '[]', []),
      reflection: progress?.reflection || '',
      startedAt: progress?.started_at || null,
      completedAt: progress?.completed_at || null,
      percent: percentOf(row),
    },
    bookmarked,
    resources: db.prepare(`SELECT id, title, url, type, source, description, free, reviewed_at AS reviewed
      FROM resources WHERE skill_id = ? ORDER BY sort`).all(skill.id).map((r) => resourceText(r, lang)),
  });
});

// ---------- Progress ----------

function indexList(value, max) {
  if (!Array.isArray(value)) fail(400, 'checklist_invalid');
  return [...new Set(value.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < max))].sort((a, b) => a - b);
}

api.put('/progress/:slug', requireUser, (req, res) => {
  const skill = getSkill(req.params.slug);
  const uid = req.user.id;
  const body = req.body || {};
  const cur = db.prepare('SELECT * FROM progress WHERE user_id = ? AND skill_id = ?').get(uid, skill.id) || {
    status: 'not_started', steps_done: '[]', practice_done: '[]', reflection: '', started_at: null, completed_at: null,
  };
  const next = { ...cur };

  if (body.stepsDone !== undefined) next.steps_done = JSON.stringify(indexList(body.stepsDone, skill.steps_count));
  if (body.practiceDone !== undefined) next.practice_done = JSON.stringify(indexList(body.practiceDone, skill.practice_count));
  if (body.reflection !== undefined) next.reflection = String(body.reflection).slice(0, 4000);

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) fail(400, 'status_unknown');
    next.status = body.status;
  } else if (next.status === 'not_started' && (parse(next.steps_done, []).length || parse(next.practice_done, []).length)) {
    next.status = 'in_progress';
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (next.status !== 'not_started' && !next.started_at) next.started_at = now;
  if (next.status === 'completed' && cur.status !== 'completed') next.completed_at = now;
  if (next.status !== 'completed') next.completed_at = null;
  if (next.status === 'not_started' && body.status === 'not_started') {
    next.steps_done = '[]';
    next.practice_done = '[]';
    next.started_at = null;
  }

  db.prepare(`
    INSERT INTO progress (user_id, skill_id, status, steps_done, practice_done, reflection, started_at, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET status = excluded.status, steps_done = excluded.steps_done,
      practice_done = excluded.practice_done, reflection = excluded.reflection, started_at = excluded.started_at,
      completed_at = excluded.completed_at, updated_at = excluded.updated_at`)
    .run(uid, skill.id, next.status, next.steps_done, next.practice_done, next.reflection, next.started_at, next.completed_at, now);

  const row = { ...skill, ...next };
  res.json({
    progress: {
      status: next.status,
      stepsDone: parse(next.steps_done, []),
      practiceDone: parse(next.practice_done, []),
      reflection: next.reflection,
      startedAt: next.started_at,
      completedAt: next.completed_at,
      percent: percentOf(row),
    },
  });
});

api.get('/progress', requireUser, (req, res) => {
  const lang = req.lang;
  const u = req.user;
  const rows = roadmapRows(u.id, u.program);
  const categories = db.prepare('SELECT slug, name, short, description, icon FROM categories ORDER BY sort').all();
  const byCategory = categories.map((c) => {
    const list = rows.filter((r) => r.category === c.slug);
    return { ...categoryText(c, lang), ...counts(list) };
  }).filter((c) => c.total > 0);

  const recent = db.prepare(`
    SELECT s.slug, s.title, s.icon, s.category, p.status, p.updated_at FROM progress p
    JOIN skills s ON s.id = p.skill_id WHERE p.user_id = ? AND s.active = 1
    ORDER BY p.updated_at DESC LIMIT 6`).all(u.id);

  const bySemester = [];
  for (const r of rows) {
    const key = `${r.year}.${r.semester}`;
    let group = bySemester.find((g) => g.key === key);
    if (!group) bySemester.push(group = { key, year: r.year, semester: r.semester, rows: [] });
    group.rows.push(r);
  }

  res.json({
    overall: counts(rows),
    byCategory,
    bySemester: bySemester.map((g) => ({ year: g.year, semester: g.semester, ...counts(g.rows) })),
    skills: rows.map((r) => ({ ...summary(r, lang), year: r.year, semester: r.semester })),
    recent: recent.map((r) => ({ slug: r.slug, title: skillTitle(r, lang), icon: r.icon, category: r.category, status: r.status, at: r.updated_at })),
    outsideRoadmap: counts(db.prepare(`
      SELECT p.status FROM progress p JOIN skills s ON s.id = p.skill_id
      WHERE p.user_id = ? AND s.active = 1 AND p.status != 'not_started'
        AND s.id NOT IN (SELECT skill_id FROM roadmap_items WHERE program = ?)`).all(u.id, u.program)),
  });
});

// ---------- Bookmarks ----------

api.put('/bookmarks/:slug', requireUser, (req, res) => {
  const skill = getSkill(req.params.slug);
  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, skill_id) VALUES (?, ?)').run(req.user.id, skill.id);
  res.json({ bookmarked: true });
});

api.delete('/bookmarks/:slug', requireUser, (req, res) => {
  const skill = getSkill(req.params.slug);
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND skill_id = ?').run(req.user.id, skill.id);
  res.json({ bookmarked: false });
});

// ---------- Roadmap ----------

api.get('/roadmap', requireUser, (req, res) => {
  const lang = req.lang;
  const program = String(req.query.program || req.user.program);
  const prog = getProgram(program, lang);
  if (!prog) fail(404, 'program_not_found');
  const rows = roadmapRows(req.user.id, program);
  const bySlug = Object.fromEntries(
    db.prepare(`${SKILL_WITH_PROGRESS} WHERE s.active = 1`).all(req.user.id).map((r) => [r.slug, r]),
  );

  const years = yearThemes(lang).map((theme) => ({
    ...theme,
    ...counts(rows.filter((r) => r.year === theme.year)),
    semesters: [1, 2].map((semester) => {
      const list = rows.filter((r) => r.year === theme.year && r.semester === semester);
      return {
        semester,
        ...counts(list),
        skills: list.map((r) => ({
          ...summary(r, lang),
          prerequisites: parse(r.prerequisites, []).filter((slug) => bySlug[slug]).map((slug) => ({
            slug,
            title: skillTitle(bySlug[slug], lang),
            done: bySlug[slug].status === 'completed',
          })),
        })),
      };
    }),
  }));
  res.json({ program: prog, years, overall: counts(rows) });
});

// ---------- Dashboard ----------

api.get('/dashboard', requireUser, (req, res) => {
  const lang = req.lang;
  const u = req.user;
  const rows = roadmapRows(u.id, u.program);
  const stage = u.year * 10 + u.semester;
  const current = rows.filter((r) => r.year === u.year && r.semester === u.semester);

  const continueLearning = db.prepare(`${SKILL_WITH_PROGRESS}
    WHERE s.active = 1 AND p.status = 'in_progress' ORDER BY p.updated_at DESC LIMIT 3`).all(u.id).map((r) => summary(r, lang));

  const upNext = rows
    .filter((r) => (r.status || 'not_started') === 'not_started' && r.year * 10 + r.semester >= stage)
    .slice(0, 4)
    .map((r) => ({ ...summary(r, lang), year: r.year, semester: r.semester, now: r.year === u.year && r.semester === u.semester }));

  const overdue = rows.filter((r) => r.status !== 'completed' && r.year * 10 + r.semester < stage).length;

  const listFrom = (table, orderBy) => db.prepare(`
    SELECT s.*, p.status, p.steps_done, p.practice_done FROM ${table} x
    JOIN skills s ON s.id = x.skill_id AND s.active = 1
    LEFT JOIN progress p ON p.skill_id = s.id AND p.user_id = x.user_id
    WHERE x.user_id = ? ORDER BY x.${orderBy} DESC LIMIT 4`).all(u.id).map((r) => summary(r, lang));

  const nextStep = continueLearning[0]
    ? { kind: 'continue', skill: continueLearning[0] }
    : upNext[0] ? { kind: 'start', skill: upNext[0] } : null;

  res.json({
    stage: {
      program: getProgram(u.program, lang),
      year: u.year,
      semester: u.semester,
      theme: yearThemes(lang).find((y) => y.year === u.year),
      ...counts(current),
    },
    stats: counts(rows),
    continueLearning,
    upNext,
    overdue,
    recentlyViewed: listFrom('views', 'viewed_at'),
    bookmarks: listFrom('bookmarks', 'created_at'),
    nextStep,
  });
});

// ---------- Resources ----------

api.get('/resources', requireUser, (req, res) => {
  const lang = req.lang;
  const rows = db.prepare(`SELECT r.id, r.title, r.url, r.type, r.source, r.description, r.free, r.reviewed_at AS reviewed,
      s.slug AS skill_slug, s.title AS skill_title, s.category
    FROM resources r LEFT JOIN skills s ON s.id = r.skill_id ORDER BY r.sort`).all();
  const types = db.prepare('SELECT type, COUNT(*) AS count FROM resources GROUP BY type').all();
  res.json({
    resources: rows.map((r) => ({
      ...resourceText(r, lang),
      skill_title: r.skill_slug ? skillTitle({ slug: r.skill_slug, title: r.skill_title }, lang) : null,
    })),
    types,
  });
});

// ---------- Feedback ----------

api.post('/feedback', requireUser, (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (message.length < 3) fail(400, 'feedback_short');
  const rating = req.body?.rating == null ? null : Number(req.body.rating);
  if (rating !== null && !(rating >= 1 && rating <= 5)) fail(400, 'rating_invalid');
  db.prepare('INSERT INTO feedback (user_id, rating, message, page) VALUES (?, ?, ?, ?)')
    .run(req.user.id, rating, message.slice(0, 2000), String(req.body?.page ?? '').slice(0, 120));
  res.status(201).json({ ok: true });
});

api.get('/health', (_req, res) => res.json({ ok: true }));

api.use((req, res) => res.status(404).json({ error: msg(req.lang, 'not_found') }));

// eslint-disable-next-line no-unused-vars
api.use((err, req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: msg(req.lang, err.key) });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: msg(req.lang, 'bad_json') });
  console.error(err);
  res.status(500).json({ error: msg(req.lang, 'server_error') });
});
