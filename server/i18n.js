// Localisation for API responses. English lives in content.js / the database, Arabic in content.ar.js.
import * as en from './content.js';
import * as ar from './content.ar.js';

export const LANGS = ['en', 'ar'];

export function langOf(req) {
  return req.get('X-Lang') === 'ar' ? 'ar' : 'en';
}

// Arabic skill text is only used when its lists line up with the English ones,
// because saved progress stores step and checklist positions.
const arSkills = {};
for (const s of en.skills) {
  const a = ar.skills[s.slug];
  if (!a) {
    console.warn(`content.ar.js: no Arabic translation for skill "${s.slug}", English will be shown.`);
    continue;
  }
  const matches = a.steps?.length === s.steps.length
    && a.practice?.checklist?.length === s.practice.checklist.length
    && a.mastery?.length === s.mastery.length;
  if (!matches) {
    console.warn(`content.ar.js: skill "${s.slug}" has a different number of steps, checklist items or mastery points than content.js, English will be shown.`);
    continue;
  }
  arSkills[s.slug] = a;
}

const parse = (json, fallback) => { try { return JSON.parse(json); } catch { return fallback; } };

export function skillText(row, lang) {
  const a = lang === 'ar' ? arSkills[row.slug] : null;
  if (a) return { title: a.title, summary: a.summary, why: a.why, when: a.when, steps: a.steps, practice: a.practice, mastery: a.mastery };
  return {
    title: row.title,
    summary: row.summary,
    why: row.why,
    when: row.when_text,
    steps: parse(row.steps, []),
    practice: parse(row.practice, {}),
    mastery: parse(row.mastery, []),
  };
}

export function skillTitle(row, lang) {
  return (lang === 'ar' && arSkills[row.slug]?.title) || row.title;
}

export function skillSummary(row, lang) {
  return (lang === 'ar' && arSkills[row.slug]?.summary) || row.summary;
}

export function categoryText(row, lang) {
  const a = lang === 'ar' ? ar.categories[row.slug] : null;
  return { ...row, ...(a || {}) };
}

export function programText(row, lang) {
  if (!row) return row;
  const a = lang === 'ar' ? ar.programs[row.slug] : null;
  return { ...row, ...(a || {}) };
}

export function yearThemes(lang) {
  return en.YEAR_THEMES.map((y) => ({ ...y, ...(lang === 'ar' ? ar.years[y.year] : {}) }));
}

export function resourceText(row, lang) {
  const a = lang === 'ar' ? ar.resources[row.url] : null;
  return a ? { ...row, ...a } : row;
}

// Loose matching for search: ignores case, Arabic diacritics and common letter variants.
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

// Light Arabic stemming so "المقابلة" also finds "المقابلات": drops a leading "ال" and one common suffix.
function stem(word) {
  let w = word;
  if (/^(وال|بال|كال|فال)/.test(w) && w.length > 5) w = w.slice(3);
  else if (w.startsWith('ال') && w.length > 4) w = w.slice(2);
  for (const suffix of ['ات', 'ون', 'ين', 'ه', 'ي']) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) { w = w.slice(0, -suffix.length); break; }
  }
  return w;
}

export function searchTerms(query) {
  return normalize(query).split(/\s+/).filter(Boolean).map(stem);
}

export function matchesSearch(text, terms) {
  return terms.every((term) => text.includes(term));
}

// Search covers both languages, so an Arabic UI still finds "Git" and an English UI finds "الشبكات".
export function skillSearchText(row) {
  const a = arSkills[row.slug];
  return normalize([row.title, row.summary, row.why, a?.title, a?.summary, a?.why].join(' '));
}
