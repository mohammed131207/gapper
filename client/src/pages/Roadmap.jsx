import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Info, MapPin, Lock } from 'lucide-react';
import { useAuth, useCategoryName, useMeta } from '../auth.jsx';
import { useApi } from '../api.js';
import { useI18n } from '../i18n.jsx';
import {
  ErrorState, PageHeader, ProgressBar, Spinner, StatusBadge, StatusDot, useDocumentTitle,
} from '../components/ui.jsx';

function SkillRow({ skill }) {
  const { t, list } = useI18n();
  const catName = useCategoryName();
  const missing = skill.prerequisites.filter((p) => !p.done);
  return (
    <li>
      <Link to={`/skills/${skill.slug}`} className="roadmap-row">
        <StatusDot status={skill.status} />
        <span className="roadmap-row-text">
          <strong>{skill.title}</strong>
          <small>
            {catName(skill.category)} · {t(`level.${skill.level}`)}
            {missing.length > 0 && skill.status !== 'completed' && (
              <span className="prereq-hint">
                <Lock size={12} aria-hidden="true" /> {t('road.buildsOn', { list: list(missing.map((p) => p.title)) })}
              </span>
            )}
          </small>
        </span>
        {skill.status !== 'completed' && <StatusBadge status={skill.status} />}
        <ChevronRight size={18} aria-hidden="true" className="row-chevron flip-rtl" />
      </Link>
    </li>
  );
}

export default function Roadmap() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.roadmap'));
  const { user } = useAuth();
  const { programs } = useMeta();
  const [params, setParams] = useSearchParams();
  const program = params.get('program') || user.program;
  const year = Number(params.get('year')) || user.year;
  const { data, error, loading, reload } = useApi(`/roadmap?program=${program}`);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const current = data?.years.find((y) => y.year === year);
  const isOwnProgram = program === user.program;

  return (
    <div className="page">
      <PageHeader
        title={t('road.title')}
        subtitle={t('road.sub')}
        actions={(
          <div className="select-row">
            <label className="select-pill">
              <span className="sr-only">{t('stage.program')}</span>
              <select value={program} onChange={(e) => setParam('program', e.target.value)}>
                {programs.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
            <label className="select-pill">
              <span className="sr-only">{t('stage.yearField')}</span>
              <select value={year} onChange={(e) => setParam('year', e.target.value)}>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{t('stage.year', { n: y })}</option>)}
              </select>
            </label>
          </div>
        )}
      />

      <p className="notice">
        <Info size={17} aria-hidden="true" />
        <span>{t('road.provA')}<strong>{t('road.provB')}</strong>{t('road.provC')}</span>
      </p>

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          <div className="year-tabs" role="tablist" aria-label={t('stage.yearField')}>
            {data.years.map((y) => (
              <button
                key={y.year} type="button" role="tab" aria-selected={y.year === year}
                className={`year-tab ${y.year === year ? 'is-active' : ''}`} onClick={() => setParam('year', y.year)}
              >
                <strong>{y.title}</strong>
                <small>{y.subtitle}</small>
                <span className="year-tab-count" dir="ltr">{y.completed}/{y.total}</span>
                {isOwnProgram && y.year === user.year && <span className="you-dot" title={t('road.here')} />}
              </button>
            ))}
          </div>

          {current?.semesters.map((sem) => {
            const here = isOwnProgram && year === user.year && sem.semester === user.semester;
            return (
              <section key={sem.semester} className={`card semester-section ${here ? 'is-current' : ''}`}>
                <div className="semester-head">
                  <h2>
                    {t('stage.semester', { n: sem.semester })}
                    {here && <span className="here-tag"><MapPin size={13} aria-hidden="true" /> {t('road.here')}</span>}
                  </h2>
                  <span className="muted small">{t('road.completedOf', { done: sem.completed, total: sem.total })}</span>
                </div>
                <ProgressBar value={sem.total ? (sem.completed / sem.total) * 100 : 0} label={t('stage.semester', { n: sem.semester })} />
                {sem.skills.length === 0 ? (
                  <p className="muted small pad-top">{t('road.emptySem')}</p>
                ) : (
                  <ul className="roadmap-list">
                    {sem.skills.map((s) => <SkillRow key={s.slug} skill={s} />)}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
