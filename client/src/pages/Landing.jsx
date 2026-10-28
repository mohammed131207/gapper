import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Map, ListChecks, ChartPie, BookMarked, Compass, Hammer, RefreshCcw, Route, Sparkles, Bell, Award,
} from 'lucide-react';
import { useAuth, useMeta } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { LangToggle, Logo, useToast, useDocumentTitle } from '../components/ui.jsx';
import { HeroIllustration } from '../components/Illustrations.jsx';
import { Icon } from '../icons.jsx';

const FEATURES = [
  { icon: Map, key: 'landing.f1' },
  { icon: ListChecks, key: 'landing.f2' },
  { icon: ChartPie, key: 'landing.f3' },
  { icon: BookMarked, key: 'landing.f4' },
];

const STEPS = [
  { icon: Compass, key: 'landing.s1' },
  { icon: Hammer, key: 'landing.s2' },
  { icon: RefreshCcw, key: 'landing.s3' },
];

export const FUTURE = [
  { icon: Route, key: 'future.1' },
  { icon: Sparkles, key: 'future.2' },
  { icon: Award, key: 'future.3' },
  { icon: Bell, key: 'future.4' },
];

const PRINCIPLES = ['landing.p1', 'landing.p2', 'landing.p3', 'landing.p4'];

export default function Landing() {
  useDocumentTitle('');
  const { user, startGuest } = useAuth();
  const { categories } = useMeta();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function tryAsGuest() {
    setBusy(true);
    try {
      await startGuest();
      navigate('/onboarding');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <header className="landing-nav container">
        <Logo />
        <nav className="landing-links" aria-label={t('landing.sections')}>
          <a href="#features">{t('landing.features')}</a>
          <a href="#how">{t('landing.how')}</a>
          <a href="#about">{t('landing.about')}</a>
        </nav>
        <div className="landing-actions">
          <LangToggle compact />
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">{t('landing.openDashboard')}</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">{t('auth.login')}</Link>
              <Link to="/signup" className="btn btn-primary">{t('landing.getStarted')}</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">{t('landing.eyebrow')}</span>
          <h1>{t('landing.h1a')}<br />{t('landing.h1b')}</h1>
          <p className="hero-lead">{t('landing.lead')}</p>
          <div className="hero-cta">
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
              {t('landing.getStarted')} <ArrowRight size={18} aria-hidden="true" className="flip-rtl" />
            </Link>
            {!user && (
              <button type="button" className="btn btn-link" onClick={tryAsGuest} disabled={busy}>
                {busy ? t('landing.settingUp') : t('landing.tryGuest')}
              </button>
            )}
          </div>
        </div>
        <HeroIllustration className="hero-art" label={t('ill.hero')} />
      </section>

      <section className="container cat-strip" aria-label={t('landing.categories')}>
        {categories.map((c) => (
          <div key={c.slug} className={`cat-card cat-${c.slug}`}>
            <span className="cat-card-icon"><Icon name={c.icon} size={26} strokeWidth={1.7} /></span>
            <strong>{c.short}</strong>
            <span>{c.description}</span>
          </div>
        ))}
      </section>

      <section id="features" className="container section">
        <div className="section-head">
          <span className="eyebrow">{t('landing.featuresEyebrow')}</span>
          <h2>{t('landing.featuresTitle')}</h2>
          <p>{t('landing.featuresText')}</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map(({ icon: I, key }) => (
            <article key={key} className="feature-card">
              <span className="feature-icon"><I size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              <h3>{t(key)}</h3>
              <p>{t(`${key}Text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('landing.how')}</span>
            <h2>{t('landing.howTitle')}</h2>
          </div>
          <ol className="steps-row">
            {STEPS.map(({ icon: I, key }, i) => (
              <li key={key} className="step-card">
                <span className="step-num">{i + 1}</span>
                <I size={22} strokeWidth={1.8} aria-hidden="true" className="step-icon" />
                <h3>{t(key)}</h3>
                <p>{t(`${key}Text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="container section about">
        <div>
          <span className="eyebrow">{t('landing.about')}</span>
          <h2>{t('landing.aboutTitle')}</h2>
          <p>{t('landing.aboutP1')}</p>
          <p>{t('landing.aboutP2')}</p>
        </div>
        <ul className="principles">
          {PRINCIPLES.map((key) => (
            <li key={key}><strong>{t(key)}</strong> {t(`${key}Text`)}</li>
          ))}
        </ul>
      </section>

      <section className="container section">
        <div className="future">
          <div className="section-head">
            <span className="eyebrow">{t('landing.futureEyebrow')}</span>
            <h2>{t('landing.futureTitle')}</h2>
            <p>{t('landing.futureText')}</p>
          </div>
          <div className="future-grid">
            {FUTURE.map(({ icon: I, key }) => (
              <div key={key} className="future-item">
                <I size={20} strokeWidth={1.8} aria-hidden="true" />
                <div><strong>{t(key)}</strong><span>{t(`${key}Text`)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container cta-band">
        <h2>{t('landing.ctaTitle')}</h2>
        <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
          {t('landing.ctaButton')} <ArrowRight size={18} aria-hidden="true" className="flip-rtl" />
        </Link>
      </section>

      <footer className="landing-footer container">
        <Logo />
        <p>{t('landing.footer')}</p>
        <Link to="/journey">{t('landing.vision')}</Link>
      </footer>
    </div>
  );
}
