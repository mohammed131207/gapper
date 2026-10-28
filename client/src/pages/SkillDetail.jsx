import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark, BookmarkCheck, CalendarDays, ChevronLeft, ChevronRight, CircleCheckBig, Clock, ExternalLink,
  Lightbulb, ListChecks, Play, RotateCcw, Signal, Target, Map as MapIcon,
} from 'lucide-react';
import { api, useApi } from '../api.js';
import { useAuth } from '../auth.jsx';
import { formatDate, formatMonth, useI18n } from '../i18n.jsx';
import {
  ErrorState, ProgressBar, SkillIcon, Spinner, StatusBadge, Tabs, useDocumentTitle, useToast,
} from '../components/ui.jsx';
import { RESOURCE_TYPES } from '../icons.jsx';

function toggle(list, i) {
  return list.includes(i) ? list.filter((x) => x !== i) : [...list, i].sort((a, b) => a - b);
}

export function ResourceItem({ resource, compact = false }) {
  const { t } = useI18n();
  const TypeIcon = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.article;
  return (
    <a href={resource.url} className={`resource-item ${compact ? 'is-compact' : ''}`} target="_blank" rel="noopener noreferrer">
      <span className={`resource-icon type-${resource.type}`}><TypeIcon size={compact ? 16 : 20} strokeWidth={1.8} aria-hidden="true" /></span>
      <span className="resource-text">
        <strong>{resource.title}</strong>
        <small>{t(`type.${resource.type}`)} · {resource.source}</small>
        {!compact && <span className="resource-desc">{resource.description}</span>}
      </span>
      <ExternalLink size={15} aria-hidden="true" className="row-chevron" />
      <span className="sr-only">{t('common.newTab')}</span>
    </a>
  );
}

function Check({ checked, onChange, children, sub }) {
  return (
    <label className={`check-item ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check-box" aria-hidden="true"><CircleCheckBig size={14} /></span>
      <span className="check-text">
        <strong>{children}</strong>
        {sub && <span>{sub}</span>}
      </span>
    </label>
  );
}

export default function SkillDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { t, lang, stage, minutes } = useI18n();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const { data, error, loading, reload, setData } = useApi(`/skills/${slug}`);
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(data?.skill.title || t('skill.fallback'));

  useEffect(() => {
    if (data) {
      setReflection(data.progress.reflection);
      setReflectionSaved(true);
    }
    // Only when a different skill loads, so typing is never overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.skill.slug]);

  if (loading && !data) return <div className="page"><Spinner /></div>;
  if (error) {
    return (
      <div className="page">
        <Link to="/library" className="back-link"><ChevronLeft size={16} className="flip-rtl" /> {t('nav.library')}</Link>
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />
      </div>
    );
  }
  if (!data) return null;

  const { skill, progress, resources } = data;

  async function save(changes, optimistic = {}) {
    const before = data.progress;
    setData((d) => ({ ...d, progress: { ...d.progress, ...optimistic } }));
    try {
      const res = await api(`/progress/${skill.slug}`, { method: 'PUT', body: changes });
      setData((d) => ({ ...d, progress: res.progress }));
      return res.progress;
    } catch (err) {
      setData((d) => ({ ...d, progress: before }));
      toast(err.message, 'error');
      return null;
    }
  }

  async function setStatus(status) {
    setBusy(true);
    const p = await save({ status }, { status });
    setBusy(false);
    if (!p) return;
    if (status === 'completed') toast(t('skill.toastDone'));
    if (status === 'in_progress' && progress.status === 'not_started') toast(t('skill.toastStarted'));
  }

  async function toggleBookmark() {
    const next = !data.bookmarked;
    setData((d) => ({ ...d, bookmarked: next }));
    try {
      await api(`/bookmarks/${skill.slug}`, { method: next ? 'PUT' : 'DELETE' });
      toast(next ? t('skill.toastSaved') : t('skill.toastUnsaved'));
    } catch (err) {
      setData((d) => ({ ...d, bookmarked: !next }));
      toast(err.message, 'error');
    }
  }

  async function saveReflection() {
    const p = await save({ reflection }, { reflection });
    if (p) {
      setReflectionSaved(true);
      toast(t('skill.toastReflection'));
    }
  }

  const setTab = (value) => {
    const next = new URLSearchParams(params);
    if (value === 'overview') next.delete('tab'); else next.set('tab', value);
    setParams(next, { replace: true });
  };

  const ownPlacement = skill.placement.find((p) => p.program === user.program);
  const englishNote = t('skill.englishNote');

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label={t('skill.breadcrumb')}>
        <Link to="/library">{t('nav.library')}</Link>
        <ChevronRight size={14} aria-hidden="true" className="flip-rtl" />
        <span aria-current="page">{skill.title}</span>
      </nav>

      <article className="card skill-card">
        <header className="skill-head">
          <SkillIcon icon={skill.icon} category={skill.category} size="lg" />
          <div className="skill-head-text">
            <h1>{skill.title}</h1>
            <div className="chips">
              <Link to={`/library?category=${skill.category}`} className={`chip cat-chip cat-${skill.category}`}>{skill.categoryName}</Link>
              <span className="chip"><Signal size={13} aria-hidden="true" /> {t(`level.${skill.level}`)}</span>
              <span className="chip"><Clock size={13} aria-hidden="true" /> {t('skill.guide', { min: minutes(skill.minutes) })}</span>
              <StatusBadge status={progress.status} />
            </div>
          </div>
          <button
            type="button" className={`icon-btn bookmark ${data.bookmarked ? 'is-on' : ''}`} onClick={toggleBookmark}
            aria-pressed={data.bookmarked} aria-label={data.bookmarked ? t('skill.unsave') : t('skill.save')}
            title={data.bookmarked ? t('skill.unsave') : t('skill.save')}
          >
            {data.bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </header>

        <Tabs
          label={t('skill.sections')} value={tab} onChange={setTab}
          items={[
            { value: 'overview', label: t('skill.tabOverview') },
            { value: 'learn', label: t('skill.tabLearn') },
            { value: 'practice', label: t('skill.tabPractice') },
            { value: 'resources', label: t('skill.tabResources'), count: resources.length },
          ]}
        />

        <div className="skill-grid">
          <div className="skill-main">
            {tab === 'overview' && (
              <div className="prose-stack">
                <section>
                  <h2>{t('skill.why')}</h2>
                  <p>{skill.why}</p>
                </section>
                <section className="info-tile">
                  <CalendarDays size={20} aria-hidden="true" />
                  <div>
                    <h3>{t('skill.when')}</h3>
                    <p>{skill.when}</p>
                    {ownPlacement && (
                      <Link to={`/roadmap?year=${ownPlacement.year}`} className="link-sm">
                        <MapIcon size={13} aria-hidden="true" /> {t('skill.inRoadmap', { stage: stage(ownPlacement.year, ownPlacement.semester) })}
                      </Link>
                    )}
                  </div>
                </section>
                <section className="info-tile">
                  <ListChecks size={20} aria-hidden="true" />
                  <div>
                    <h3>{t('skill.how')}</h3>
                    <ol className="num-list">
                      {skill.steps.map((s) => <li key={s.title}>{s.title}</li>)}
                    </ol>
                    <button type="button" className="link-sm" onClick={() => setTab('learn')}>
                      {t('skill.openSteps')} <ChevronRight size={13} className="flip-rtl" />
                    </button>
                  </div>
                </section>
                <section className="info-tile">
                  <Target size={20} aria-hidden="true" />
                  <div>
                    <h3>{t('skill.mastery')}</h3>
                    <ul className="tick-list">
                      {skill.mastery.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                </section>
                {skill.prerequisites.length > 0 && (
                  <section>
                    <h3 className="h-sm">{t('skill.buildsOn')}</h3>
                    <div className="chips">
                      {skill.prerequisites.map((p) => (
                        <Link key={p.slug} to={`/skills/${p.slug}`} className={`chip chip-link ${p.status === 'completed' ? 'is-done' : ''}`}>
                          {p.status === 'completed' && <CircleCheckBig size={13} aria-hidden="true" />} {p.title}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {tab === 'learn' && (
              <div className="prose-stack">
                <p className="muted">{t('skill.learnIntro')}</p>
                <div className="check-list">
                  {skill.steps.map((s, i) => (
                    <Check
                      key={s.title} checked={progress.stepsDone.includes(i)} sub={s.detail}
                      onChange={() => { const v = toggle(progress.stepsDone, i); save({ stepsDone: v }, { stepsDone: v }); }}
                    >
                      <span className="step-index">{t('skill.step', { n: i + 1 })}</span> {s.title}
                    </Check>
                  ))}
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('practice')}>
                  {t('skill.nextPractice')} <ChevronRight size={16} aria-hidden="true" className="flip-rtl" />
                </button>
              </div>
            )}

            {tab === 'practice' && (
              <div className="prose-stack">
                <section className="practice-task">
                  <Lightbulb size={22} aria-hidden="true" />
                  <div>
                    <span className="eyebrow">{t('skill.task')}</span>
                    <h2>{skill.practice.title}</h2>
                    <p>{skill.practice.detail}</p>
                  </div>
                </section>
                <div className="check-list">
                  {skill.practice.checklist.map((item, i) => (
                    <Check
                      key={item} checked={progress.practiceDone.includes(i)}
                      onChange={() => { const v = toggle(progress.practiceDone, i); save({ practiceDone: v }, { practiceDone: v }); }}
                    >
                      {item}
                    </Check>
                  ))}
                </div>
                <section>
                  <label className="field" htmlFor="reflection">
                    <span>{t('skill.reflection')} <small className="muted">{t('skill.private')}</small></span>
                  </label>
                  <textarea
                    id="reflection" rows={4} value={reflection} maxLength={4000} dir="auto"
                    placeholder={t('skill.reflectionPh')}
                    onChange={(e) => { setReflection(e.target.value); setReflectionSaved(false); }}
                  />
                  <div className="row-end">
                    {!reflectionSaved && <span className="muted small">{t('skill.unsaved')}</span>}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={saveReflection} disabled={reflectionSaved}>{t('skill.saveReflection')}</button>
                  </div>
                </section>
              </div>
            )}

            {tab === 'resources' && (
              <div className="prose-stack">
                {resources.length === 0 ? (
                  <p className="muted">{t('skill.noResources')} <Link to="/resources">{t('skill.resourceLibrary')}</Link>.</p>
                ) : (
                  <div className="resource-list">
                    {resources.map((r) => <ResourceItem key={r.id} resource={r} />)}
                  </div>
                )}
                <p className="muted small">
                  {t('skill.reviewed', { date: formatMonth(resources[0]?.reviewed, lang) })}
                  {englishNote && ` ${englishNote}`}
                </p>
              </div>
            )}
          </div>

          <aside className="skill-side">
            <section className="side-box">
              <h2 className="h-sm">{t('skill.yourProgress')}</h2>
              <div className="continue-progress">
                <ProgressBar value={progress.percent} label={t('skill.progressAria')} />
                <span className="pct">{progress.percent}%</span>
              </div>
              {progress.status === 'not_started' && (
                <button type="button" className="btn btn-primary btn-block" onClick={() => setStatus('in_progress')} disabled={busy}>
                  <Play size={16} aria-hidden="true" className="flip-rtl" /> {t('skill.start')}
                </button>
              )}
              {progress.status === 'in_progress' && (
                <button type="button" className="btn btn-primary btn-block" onClick={() => setStatus('completed')} disabled={busy}>
                  <CircleCheckBig size={16} aria-hidden="true" /> {t('skill.complete')}
                </button>
              )}
              {progress.status === 'completed' && (
                <div className="done-box">
                  <CircleCheckBig size={18} aria-hidden="true" />
                  <span>{progress.completedAt ? t('skill.completedOn', { date: formatDate(progress.completedAt, lang) }) : t('status.completed')}</span>
                </div>
              )}
              <p className="tiny muted">{t('skill.disclaimer')}</p>
              {progress.status !== 'not_started' && (
                <div className="side-actions">
                  {progress.status === 'completed' && (
                    <button type="button" className="link-sm" onClick={() => setStatus('in_progress')}>{t('skill.keepWorking')}</button>
                  )}
                  <button type="button" className="link-sm link-muted" onClick={() => setStatus('not_started')}>
                    <RotateCcw size={12} aria-hidden="true" /> {t('skill.reset')}
                  </button>
                </div>
              )}
            </section>

            {resources.length > 0 && (
              <section className="side-box">
                <h2 className="h-sm">{t('skill.relatedResources')}</h2>
                {resources.slice(0, 3).map((r) => <ResourceItem key={r.id} resource={r} compact />)}
              </section>
            )}

            {skill.related.length > 0 && (
              <section className="side-box">
                <h2 className="h-sm">{t('skill.related')}</h2>
                {skill.related.map((s) => (
                  <Link key={s.slug} to={`/skills/${s.slug}`} className="mini-row">
                    <SkillIcon icon={s.icon} category={s.category} size="sm" />
                    <span className="mini-row-text"><strong>{s.title}</strong><small>{t(`level.${s.level}`)}</small></span>
                    <ChevronRight size={15} aria-hidden="true" className="row-chevron flip-rtl" />
                  </Link>
                ))}
              </section>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}
