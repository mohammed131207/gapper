import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SearchX, Star } from 'lucide-react';
import { useCategoryName, useMeta } from '../auth.jsx';
import { useApi } from '../api.js';
import { useI18n } from '../i18n.jsx';
import {
  EmptyState, ErrorState, PageHeader, SkillIcon, Spinner, StatusBadge, useDocumentTitle,
} from '../components/ui.jsx';

export default function Library() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.library'));
  const { categories, levels } = useMeta();
  const catName = useCategoryName();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const level = params.get('level') || '';
  const q = params.get('q') || '';
  const [text, setText] = useState(q);

  useEffect(() => { setText(q); }, [q]);

  // Debounce typing into the URL so the list follows the search box.
  useEffect(() => {
    if (text === q) return undefined;
    const timer = setTimeout(() => update('q', text.trim()), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  const query = new URLSearchParams();
  if (category !== 'all') query.set('category', category);
  if (level) query.set('level', level);
  if (q) query.set('q', q);
  const { data, error, loading, reload } = useApi(`/skills?${query}`);

  return (
    <div className="page">
      <PageHeader title={t('nav.library')} subtitle={t('lib.sub')} />

      <div className="filters">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{t('lib.searchLabel')}</span>
          <input type="search" placeholder={t('lib.search')} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="select-pill">
          <span className="sr-only">{t('lib.level')}</span>
          <select value={level} onChange={(e) => update('level', e.target.value)}>
            <option value="">{t('lib.allLevels')}</option>
            {levels.map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
          </select>
        </label>
      </div>

      <div className="chip-row" role="group" aria-label={t('lib.category')}>
        <button type="button" className={`filter-chip ${category === 'all' ? 'is-active' : ''}`} onClick={() => update('category', 'all')} aria-pressed={category === 'all'}>{t('lib.all')}</button>
        {categories.map((c) => (
          <button
            key={c.slug} type="button" className={`filter-chip ${category === c.slug ? 'is-active' : ''}`}
            onClick={() => update('category', c.slug)} aria-pressed={category === c.slug}
          >
            {c.short}
          </button>
        ))}
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (data.skills.length === 0 ? (
        <EmptyState icon={SearchX} title={t('lib.none')}>{t('lib.noneText')}</EmptyState>
      ) : (
        <>
          <p className="muted small result-count" aria-live="polite">{t('common.skills', { n: data.skills.length })}</p>
          <div className="skill-cards">
            {data.skills.map((s) => (
              <Link key={s.slug} to={`/skills/${s.slug}`} className="skill-tile">
                <div className="skill-tile-top">
                  <SkillIcon icon={s.icon} category={s.category} size="lg" />
                  {s.recommended && <span className="rec-tag"><Star size={12} aria-hidden="true" /> {t('lib.forYou')}</span>}
                </div>
                <strong>{s.title}</strong>
                <small className="muted">{catName(s.category)} · {t(`level.${s.level}`)}</small>
                <p>{s.summary}</p>
                <div className="skill-tile-foot">
                  <StatusBadge status={s.status} />
                  {s.status === 'in_progress' && <span className="pct">{s.percent}%</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}
