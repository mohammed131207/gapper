import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX, ExternalLink, Info } from 'lucide-react';
import { useApi } from '../api.js';
import { formatMonth, matchesSearch, normalize, searchTerms, useI18n } from '../i18n.jsx';
import { EmptyState, ErrorState, PageHeader, Spinner, Tabs, useDocumentTitle } from '../components/ui.jsx';
import { RESOURCE_TYPES } from '../icons.jsx';

export default function Resources() {
  const { t, lang } = useI18n();
  useDocumentTitle(t('nav.resources'));
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useApi('/resources');

  const terms = searchTerms(q);
  const list = data ? data.resources.filter((r) => (type === 'all' || r.type === type)
    && matchesSearch(normalize([r.title, r.description, r.source, r.skill_title].join(' ')), terms)) : [];
  const countOf = (name) => data?.types.find((x) => x.type === name)?.count || 0;
  const tabs = [
    { value: 'all', label: t('lib.all'), count: data?.resources.length },
    ...Object.keys(RESOURCE_TYPES).filter((name) => countOf(name) > 0).map((name) => ({ value: name, label: t(`types.${name}`), count: countOf(name) })),
  ];
  const englishNote = t('skill.englishNote');

  return (
    <div className="page">
      <PageHeader title={t('nav.resources')} subtitle={t('res.sub')} />
      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <Tabs label={t('res.type')} value={type} onChange={setType} items={tabs} />
          <label className="search-box search-box-wide">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t('res.searchLabel')}</span>
            <input type="search" placeholder={t('res.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          {list.length === 0 ? (
            <EmptyState icon={SearchX} title={t('res.none')}>{t('res.noneText')}</EmptyState>
          ) : (
            <ul className="card resource-table">
              {list.map((r) => {
                const TypeIcon = RESOURCE_TYPES[r.type] || RESOURCE_TYPES.article;
                return (
                  <li key={r.id} className="resource-row">
                    <span className={`resource-icon type-${r.type}`}><TypeIcon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                    <div className="resource-row-text">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-title">
                        {r.title} <ExternalLink size={13} aria-hidden="true" />
                        <span className="sr-only">{t('common.newTab')}</span>
                      </a>
                      <small className="muted">{t(`type.${r.type}`)} · {r.source}{r.free ? ` · ${t('common.free')}` : ''}</small>
                      <p>{r.description}</p>
                    </div>
                    {r.skill_slug && (
                      <Link to={`/skills/${r.skill_slug}`} className={`chip cat-chip cat-${r.category}`}>{r.skill_title}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="notice notice-quiet">
            <Info size={16} aria-hidden="true" />
            <span>
              {englishNote && <>{englishNote} </>}
              {t('res.note', { date: formatMonth(data.resources[0]?.reviewed, lang) })} <Link to="/settings#feedback">{t('res.tellUs')}</Link>.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
