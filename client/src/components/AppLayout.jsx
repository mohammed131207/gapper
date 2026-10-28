import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  House, Map, Library, ChartPie, BookMarked, Settings, LogOut, Search, Ellipsis, X, Sparkles,
} from 'lucide-react';
import { useAuth, useMeta } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { LangToggle, Logo } from './ui.jsx';

const NAV = [
  { to: '/dashboard', label: 'nav.home', icon: House },
  { to: '/roadmap', label: 'nav.roadmap', short: 'nav.roadmapShort', icon: Map },
  { to: '/library', label: 'nav.library', short: 'nav.libraryShort', icon: Library },
  { to: '/progress', label: 'nav.progress', icon: ChartPie },
  { to: '/resources', label: 'nav.resources', icon: BookMarked },
  { to: '/settings', label: 'nav.settings', icon: Settings },
];

export function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{initials}</span>;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { programs } = useMeta();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setMoreOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Skill pages live under /skills but belong to the library section.
  const inLibrary = (to) => to === '/library' && location.pathname.startsWith('/skills/');
  const programName = programs.find((p) => p.slug === user.program)?.short || '';
  const displayName = user.isGuest ? t('common.guest') : user.name;
  const subtitle = user.isGuest
    ? t('nav.guestAccount')
    : t('nav.student', { code: user.program.toUpperCase(), name: programName, year: user.year });

  // Leave the protected pages first, otherwise the route guard redirects to /login.
  async function handleLogout() {
    navigate('/', { replace: true });
    await logout();
  }

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
    setQuery('');
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link">{t('nav.skip')}</a>
      <aside className="sidebar" aria-label={t('nav.main')}>
        <Logo to="/dashboard" light />
        <nav className="side-nav">
          {NAV.map(({ to, label, icon: IconC }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive || inLibrary(to) ? 'is-active' : ''}`}>
              <IconC size={18} strokeWidth={1.8} aria-hidden="true" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/journey" className="side-journey">
          <Sparkles size={16} aria-hidden="true" />
          {t('nav.journey')}
        </NavLink>
        <div className="side-user">
          <Avatar name={user.isGuest ? 'G' : user.name} />
          <div className="side-user-text">
            <strong>{displayName}</strong>
            <span>{subtitle}</span>
          </div>
          <button type="button" className="icon-btn icon-btn-light" onClick={handleLogout} aria-label={t('nav.logout')} title={t('nav.logout')}>
            <LogOut size={17} className="flip-rtl" />
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <span className="topbar-logo"><Logo to="/dashboard" /></span>
          <form className="topbar-search" role="search" onSubmit={submitSearch}>
            <Search size={17} aria-hidden="true" />
            <input
              type="search" placeholder={t('nav.search')} value={query} onChange={(e) => setQuery(e.target.value)}
              aria-label={t('nav.searchLabel')}
            />
          </form>
          <LangToggle compact />
          <NavLink to="/settings" className="topbar-user" aria-label={t('nav.settings')}>
            <Avatar name={user.isGuest ? 'G' : user.name} size={34} />
          </NavLink>
        </header>

        {user.isGuest && (
          <div className="guest-bar">
            <span>{t('guest.bar')}</span>
            <NavLink to="/settings#account" className="btn btn-sm btn-primary">{t('guest.save')}</NavLink>
          </div>
        )}

        <main id="main" className="main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label={t('nav.main')}>
        {NAV.slice(0, 4).map(({ to, label, short, icon: IconC }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bottom-link ${isActive || inLibrary(to) ? 'is-active' : ''}`}>
            <IconC size={21} strokeWidth={1.8} aria-hidden="true" />
            <span>{t(short || label)}</span>
          </NavLink>
        ))}
        <button type="button" className={`bottom-link ${moreOpen ? 'is-active' : ''}`} onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
          <Ellipsis size={21} aria-hidden="true" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="sheet" role="dialog" aria-label={t('nav.more')} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <strong>{t('nav.more')}</strong>
              <button type="button" className="icon-btn" onClick={() => setMoreOpen(false)} aria-label={t('common.close')}><X size={18} /></button>
            </div>
            <NavLink to="/resources" className="sheet-link"><BookMarked size={18} /> {t('nav.resources')}</NavLink>
            <NavLink to="/settings" className="sheet-link"><Settings size={18} /> {t('nav.settings')}</NavLink>
            <NavLink to="/journey" className="sheet-link"><Sparkles size={18} /> {t('nav.journey')}</NavLink>
            <button type="button" className="sheet-link" onClick={handleLogout}><LogOut size={18} className="flip-rtl" /> {t('nav.logout')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
