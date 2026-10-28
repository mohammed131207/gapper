import { Link } from 'react-router-dom';
import {
  Sun, Moon, Sunrise, Layers, CircleCheck, Loader, CircleDashed, Map, Library, ChartPie, BookMarked, ChevronRight,
  ArrowRight, TriangleAlert, Bookmark, History,
} from 'lucide-react';
import { useAuth, useCategoryName } from '../auth.jsx';
import { useApi } from '../api.js';
import { useI18n } from '../i18n.jsx';
import {
  Donut, EmptyState, ErrorState, ProgressBar, SkillIcon, Spinner, StatusBadge, useDocumentTitle,
} from '../components/ui.jsx';
import StagePicker from '../components/StagePicker.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { key: 'dash.evening', icon: Moon };
  if (h < 12) return { key: 'dash.morning', icon: Sunrise };
  if (h < 18) return { key: 'dash.afternoon', icon: Sun };
  return { key: 'dash.evening', icon: Moon };
}

function StatCard({ icon: I, label, value, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span className="stat-icon"><I size={18} strokeWidth={1.9} aria-hidden="true" /></span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </div>
  );
}

function MiniSkillRow({ skill, meta }) {
  return (
    <Link to={`/skills/${skill.slug}`} className="mini-row">
      <SkillIcon icon={skill.icon} category={skill.category} size="sm" />
      <span className="mini-row-text">
        <strong>{skill.title}</strong>
        <small>{meta}</small>
      </span>
      <ChevronRight size={16} aria-hidden="true" className="row-chevron flip-rtl" />
    </Link>
  );
}

const QUICK = [
  { to: '/roadmap', label: 'dash.qRoadmap', icon: Map },
  { to: '/library', label: 'dash.qLibrary', icon: Library },
  { to: '/progress', label: 'dash.qProgress', icon: ChartPie },
  { to: '/resources', label: 'dash.qResources', icon: BookMarked },
];

export default function Dashboard() {
  const { t, stage, minutes } = useI18n();
  useDocumentTitle(t('nav.home'));
  const { user } = useAuth();
  const catName = useCategoryName();
  const { data, error, loading, reload } = useApi('/dashboard');
  const g = greeting();
  const hello = user.isGuest
    ? t('dash.greet', { greet: t(g.key) })
    : t('dash.greetName', { greet: t(g.key), name: user.name.split(' ')[0] });
  const meta = (s) => `${catName(s.category)} · ${t(`level.${s.level}`)}`;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="greeting">{hello} <g.icon size={24} className="greeting-icon" aria-hidden="true" /></h1>
          <p className="page-subtitle">{t('dash.sub')}</p>
        </div>
        <div className="page-actions"><StagePicker onChange={() => reload()} /></div>
      </header>

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          <section className="stats-grid" aria-label={t('dash.glance')}>
            <StatCard icon={Layers} label={t('dash.total')} value={data.stats.total} tone="total" />
            <StatCard icon={CircleCheck} label={t('dash.completed')} value={data.stats.completed} tone="completed" />
            <StatCard icon={Loader} label={t('dash.inProgress')} value={data.stats.inProgress} tone="progress" />
            <StatCard icon={CircleDashed} label={t('dash.notStarted')} value={data.stats.notStarted} tone="idle" />
          </section>

          {data.overdue > 0 && (
            <Link to="/roadmap" className="notice notice-warm">
              <TriangleAlert size={18} aria-hidden="true" />
              <span>{t('dash.overdue', { n: data.overdue })}</span>
              <ChevronRight size={16} aria-hidden="true" className="flip-rtl" />
            </Link>
          )}

          <div className="dash-grid">
            <div className="dash-main">
              <section className="card">
                <div className="card-head">
                  <h2>{t('dash.continue')}</h2>
                  {data.continueLearning.length > 0 && <Link to="/progress" className="link-sm">{t('dash.seeAll')}</Link>}
                </div>
                {data.continueLearning.length === 0 ? (
                  data.nextStep ? (
                    <div className="next-step">
                      <SkillIcon icon={data.nextStep.skill.icon} category={data.nextStep.skill.category} size="lg" />
                      <div>
                        <p className="muted small">{t('dash.suggested')}</p>
                        <strong className="next-step-title">{data.nextStep.skill.title}</strong>
                        <p className="small">{data.nextStep.skill.summary}</p>
                      </div>
                      <Link to={`/skills/${data.nextStep.skill.slug}`} className="btn btn-primary btn-sm">
                        {t('dash.start')} <ArrowRight size={16} aria-hidden="true" className="flip-rtl" />
                      </Link>
                    </div>
                  ) : (
                    <EmptyState icon={CircleCheck} title={t('dash.caughtUp')}>{t('dash.caughtUpText')}</EmptyState>
                  )
                ) : (
                  <div className="continue-list">
                    {data.continueLearning.map((s) => (
                      <div key={s.slug} className="continue-item">
                        <SkillIcon icon={s.icon} category={s.category} size="lg" />
                        <div className="continue-body">
                          <strong>{s.title}</strong>
                          <small className="muted">{catName(s.category)} · {minutes(s.minutes)}</small>
                          <div className="continue-progress">
                            <ProgressBar value={s.percent} label={s.title} />
                            <span className="pct">{s.percent}%</span>
                          </div>
                        </div>
                        <Link to={`/skills/${s.slug}`} className="btn btn-primary btn-sm">{t('dash.continueBtn')}</Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>{t('dash.upcoming')}</h2>
                  <Link to="/roadmap" className="link-sm">{t('dash.viewAll')}</Link>
                </div>
                {data.upNext.length === 0 ? (
                  <EmptyState icon={CircleCheck} title={t('dash.nothingLeft')}>{t('dash.nothingLeftText')}</EmptyState>
                ) : (
                  <ul className="upcoming-list">
                    {data.upNext.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/skills/${s.slug}`} className="upcoming-item">
                          <SkillIcon icon={s.icon} category={s.category} />
                          <span className="upcoming-text">
                            <strong>{s.title}</strong>
                            <small>{meta(s)}</small>
                          </span>
                          <span className={`when ${s.now ? 'when-now' : ''}`}>{s.now ? t('dash.thisSemester') : stage(s.year, s.semester)}</span>
                          <ChevronRight size={16} aria-hidden="true" className="row-chevron flip-rtl" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <aside className="dash-side">
              <section className="card semester-card">
                <h2>{t('dash.thisSemester')}</h2>
                <div className="semester-body">
                  <Donut value={data.stage.total ? (data.stage.completed / data.stage.total) * 100 : 0} size={104} stroke={10}>
                    <strong dir="ltr">{data.stage.completed}/{data.stage.total}</strong>
                  </Donut>
                  <div>
                    <p className="semester-label">{stage(data.stage.year, data.stage.semester)}</p>
                    <p className="muted small">{data.stage.theme?.subtitle}</p>
                    <p className="small">
                      {data.stage.total === 0 ? t('dash.noneThisStage')
                        : data.stage.completed === data.stage.total ? t('dash.semesterDone')
                          : t('dash.left', { n: data.stage.total - data.stage.completed })}
                    </p>
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>{t('dash.quick')}</h2>
                <nav className="quick-list" aria-label={t('dash.quick')}>
                  {QUICK.map(({ to, label, icon: I }) => (
                    <Link key={to} to={to} className="quick-link">
                      <I size={17} strokeWidth={1.8} aria-hidden="true" /> {t(label)}
                      <ChevronRight size={15} aria-hidden="true" className="row-chevron flip-rtl" />
                    </Link>
                  ))}
                </nav>
              </section>

              {data.bookmarks.length > 0 && (
                <section className="card">
                  <h2 className="with-icon"><Bookmark size={16} aria-hidden="true" /> {t('dash.saved')}</h2>
                  {data.bookmarks.map((s) => <MiniSkillRow key={s.slug} skill={s} meta={<StatusBadge status={s.status} />} />)}
                </section>
              )}

              {data.recentlyViewed.length > 0 && (
                <section className="card">
                  <h2 className="with-icon"><History size={16} aria-hidden="true" /> {t('dash.recent')}</h2>
                  {data.recentlyViewed.map((s) => <MiniSkillRow key={s.slug} skill={s} meta={meta(s)} />)}
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
