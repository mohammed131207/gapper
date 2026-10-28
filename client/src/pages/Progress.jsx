import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, History, Sparkles } from 'lucide-react';
import { useCategoryName } from '../auth.jsx';
import { useApi } from '../api.js';
import { timeAgo, useI18n } from '../i18n.jsx';
import {
  Donut, EmptyState, ErrorState, PageHeader, ProgressBar, SkillIcon, Spinner, StatusBadge, StatusDot, Tabs, useDocumentTitle,
} from '../components/ui.jsx';
import { Icon } from '../icons.jsx';

const FILTERS = [
  { value: 'all', label: 'prog.all' },
  { value: 'completed', label: 'dash.completed' },
  { value: 'in_progress', label: 'dash.inProgress' },
  { value: 'not_started', label: 'dash.notStarted' },
];

export default function Progress() {
  const { t, lang, stage } = useI18n();
  useDocumentTitle(t('nav.progress'));
  const catName = useCategoryName();
  const { data, error, loading, reload } = useApi('/progress');
  const [filter, setFilter] = useState('all');

  const list = data ? data.skills.filter((s) => filter === 'all' || s.status === filter) : [];
  const counts = data ? { all: data.overall.total, completed: data.overall.completed, in_progress: data.overall.inProgress, not_started: data.overall.notStarted } : {};
  const extra = data ? data.outsideRoadmap.completed + data.outsideRoadmap.inProgress : 0;
  const filterLabel = t(FILTERS.find((f) => f.value === filter).label);

  return (
    <div className="page">
      <PageHeader title={t('nav.progress')} subtitle={t('prog.sub')} />
      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          <Tabs label={t('prog.filter')} value={filter} onChange={setFilter} items={FILTERS.map((f) => ({ value: f.value, label: t(f.label), count: counts[f.value] }))} />

          <div className="progress-grid">
            <section className="card overall-card">
              <Donut value={data.overall.percent} size={160} stroke={16}>
                <small>{t('prog.overall')}</small>
                <strong>{data.overall.percent}%</strong>
              </Donut>
              <dl className="overall-stats">
                <div><dt>{t('dash.completed')}</dt><dd>{data.overall.completed}</dd></div>
                <div><dt>{t('dash.inProgress')}</dt><dd>{data.overall.inProgress}</dd></div>
                <div><dt>{t('dash.notStarted')}</dt><dd>{data.overall.notStarted}</dd></div>
                <div><dt>{t('prog.inRoadmap')}</dt><dd>{data.overall.total}</dd></div>
              </dl>
              {extra > 0 && <p className="tiny muted overall-extra">{t('prog.extra', { n: extra })}</p>}
            </section>

            <section className="card">
              <h2>{t('prog.bySemester')}</h2>
              <ul className="sem-bars">
                {data.bySemester.map((s) => (
                  <li key={`${s.year}.${s.semester}`}>
                    <Link to={`/roadmap?year=${s.year}`} title={stage(s.year, s.semester)}>
                      <span className="sem-label">{t('stage.short', { year: s.year, semester: s.semester })}</span>
                      <ProgressBar value={s.total ? (s.completed / s.total) * 100 : 0} label={stage(s.year, s.semester)} thin />
                      <span className="sem-count" dir="ltr">{s.completed}/{s.total}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="progress-grid">
            <section className="card">
              <h2>{t('prog.categories')}</h2>
              <ul className="cat-progress">
                {data.byCategory.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/library?category=${c.slug}`} className="cat-progress-row">
                      <span className={`skill-icon skill-icon-sm cat-${c.slug}`}><Icon name={c.icon} size={16} /></span>
                      <span className="cat-progress-body">
                        <span className="cat-progress-top"><strong>{c.name}</strong><span className="muted small" dir="ltr">{c.completed}/{c.total}</span></span>
                        <ProgressBar value={c.percent} label={c.name} thin />
                      </span>
                      <ChevronRight size={16} aria-hidden="true" className="row-chevron flip-rtl" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <h2 className="with-icon"><History size={16} aria-hidden="true" /> {t('prog.recent')}</h2>
              {data.recent.length === 0 ? (
                <EmptyState title={t('prog.noActivity')}>{t('prog.noActivityText')}</EmptyState>
              ) : (
                <ul className="activity">
                  {data.recent.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/skills/${r.slug}`} className="activity-row">
                        <SkillIcon icon={r.icon} category={r.category} size="sm" />
                        <span className="activity-text">
                          <strong>{r.title}</strong>
                          <small>{t(`status.${r.status}`)} · {timeAgo(r.at, lang)}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h2>{filterLabel}</h2>
              <span className="muted small">{t('common.skills', { n: list.length })}</span>
            </div>
            {list.length === 0 ? (
              <EmptyState title={t('prog.empty')}>
                {filter === 'completed' ? t('prog.emptyCompleted') : t('prog.emptyOther')}
              </EmptyState>
            ) : (
              <ul className="roadmap-list">
                {list.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/skills/${s.slug}`} className="roadmap-row">
                      <StatusDot status={s.status} />
                      <span className="roadmap-row-text">
                        <strong>{s.title}</strong>
                        <small>{catName(s.category)} · {stage(s.year, s.semester)}</small>
                      </span>
                      {s.status === 'in_progress' && <span className="pct">{s.percent}%</span>}
                      <StatusBadge status={s.status} />
                      <ChevronRight size={18} aria-hidden="true" className="row-chevron flip-rtl" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link to="/journey" className="journey-link card">
            <Sparkles size={20} aria-hidden="true" />
            <span><strong>{t('prog.bigPicture')}</strong><small>{t('landing.ctaTitle')}</small></span>
            <ChevronRight size={18} aria-hidden="true" className="flip-rtl" />
          </Link>
        </>
      )}
    </div>
  );
}
