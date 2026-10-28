import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, LogOut, Star, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useAuth, useMeta } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { PageHeader, useDocumentTitle, useToast } from '../components/ui.jsx';
import { PasswordInput } from './Auth.jsx';

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="card settings-section">
      <div className="settings-intro">
        <h2>{title}</h2>
        {description && <p className="muted small">{description}</p>}
      </div>
      <div className="settings-body">{children}</div>
    </section>
  );
}

function LanguageChoice() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="choice-grid choice-grid-2" role="radiogroup" aria-label={t('set.language')}>
      {['ar', 'en'].map((code) => (
        <label key={code} className={`choice ${lang === code ? 'is-selected' : ''}`} lang={code}>
          <input type="radio" name="lang" value={code} checked={lang === code} onChange={() => setLang(code)} />
          <strong>{t(`lang.${code}`)}</strong>
          {lang === code && <Check size={18} className="choice-check" aria-hidden="true" />}
        </label>
      ))}
    </div>
  );
}

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const { programs, years } = useMeta();
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, program: user.program, year: user.year, semester: user.semester });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(user.isGuest ? { program: form.program, year: form.year, semester: form.semester } : form);
      toast(t('set.profileUpdated'));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      {!user.isGuest && (
        <label className="field">
          <span>{t('auth.fullName')}</span>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={60} autoComplete="name" />
        </label>
      )}
      <label className="field">
        <span>{t('stage.program')}</span>
        <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
          {programs.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
      </label>
      <div className="field-row">
        <label className="field">
          <span>{t('stage.yearField')}</span>
          <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
            {years.map((y) => <option key={y.year} value={y.year}>{t('set.yearOption', { title: y.title, subtitle: y.subtitle })}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('stage.semesterField')}</span>
          <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
            <option value={1}>{t('stage.semester', { n: 1 })}</option>
            <option value={2}>{t('stage.semester', { n: 2 })}</option>
          </select>
        </label>
      </div>
      <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</button></div>
    </form>
  );
}

function UpgradeForm() {
  const { setUser } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api('/auth/upgrade', { method: 'POST', body: form });
      setUser(d.user);
      toast(t('set.accountCreated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <p className="small">{t('set.upgradeText')}</p>
      <label className="field">
        <span>{t('auth.fullName')}</span>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={60} autoComplete="name" />
      </label>
      <label className="field">
        <span>{t('auth.email')}</span>
        <input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" placeholder="you@example.com" />
      </label>
      <label className="field" htmlFor="upgrade-password">
        <span>{t('auth.password')}</span>
        <PasswordInput id="upgrade-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" placeholder={t('auth.newPasswordPh')} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('set.creating') : t('set.createAccount')}</button></div>
    </form>
  );
}

function PasswordForm() {
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/password', { method: 'POST', body: form });
      setForm({ current: '', password: '' });
      toast(t('set.passwordChanged'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="field" htmlFor="pw-current">
        <span>{t('set.currentPassword')}</span>
        <PasswordInput id="pw-current" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} autoComplete="current-password" />
      </label>
      <label className="field" htmlFor="pw-new">
        <span>{t('set.newPassword')}</span>
        <PasswordInput id="pw-new" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" placeholder={t('auth.newPasswordPh')} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><button type="submit" className="btn btn-secondary" disabled={busy}>{busy ? t('common.saving') : t('set.changePassword')}</button></div>
    </form>
  );
}

function FeedbackForm() {
  const { t } = useI18n();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/feedback', { method: 'POST', body: { rating: rating || null, message, page: 'settings' } });
      setRating(0);
      setMessage('');
      toast(t('set.thanks'));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <fieldset className="stars">
        <legend className="small">{t('set.howUseful')}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" className={`star ${n <= rating ? 'is-on' : ''}`} onClick={() => setRating(n === rating ? 0 : n)}
            aria-label={t('set.stars', { n })} aria-pressed={n <= rating}
          >
            <Star size={22} />
          </button>
        ))}
      </fieldset>
      <label className="field">
        <span>{t('set.message')}</span>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={3} maxLength={2000} dir="auto"
          placeholder={t('set.messagePh')} />
      </label>
      <div><button type="submit" className="btn btn-secondary" disabled={busy}>{busy ? t('set.sending') : t('set.send')}</button></div>
    </form>
  );
}

function DangerZone() {
  const { user, logout, setUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function remove(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/me', { method: 'DELETE', body: { password } });
      navigate('/', { replace: true });
      setUser(null);
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className="form">
      <div className="row-wrap">
        <button type="button" className="btn btn-secondary" onClick={async () => { navigate('/', { replace: true }); await logout(); }}>
          <LogOut size={16} aria-hidden="true" className="flip-rtl" /> {t('nav.logout')}
        </button>
        {!confirming && (
          <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirming(true)}>
            <Trash2 size={16} aria-hidden="true" /> {t('set.delete')}
          </button>
        )}
      </div>
      {confirming && (
        <form className="danger-box" onSubmit={remove}>
          <p className="small"><strong>{t('set.deleteWarnA')}</strong> {t('set.deleteWarnB')}</p>
          {!user.isGuest && (
            <label className="field" htmlFor="delete-password">
              <span>{t('set.confirmPassword')}</span>
              <PasswordInput id="delete-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
          )}
          <div className="row-wrap">
            <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? t('set.deleting') : t('set.confirmDelete')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setConfirming(false); setPassword(''); }}>{t('common.cancel')}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Settings() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.settings'));
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div className="page settings">
      <PageHeader title={t('nav.settings')} subtitle={t('set.sub')} />
      <Section id="profile" title={t('set.stage')} description={t('set.stageDesc')}>
        <ProfileForm key={`${user.program}-${user.year}-${user.semester}`} />
      </Section>
      <Section id="language" title={t('set.language')} description={t('set.languageDesc')}>
        <LanguageChoice />
      </Section>
      <Section id="account" title={t('set.account')} description={user.isGuest ? t('set.accountGuest') : t('set.signedInAs', { email: user.email })}>
        {user.isGuest ? <UpgradeForm /> : <PasswordForm />}
      </Section>
      <Section id="feedback" title={t('set.feedback')} description={t('set.feedbackDesc')}>
        <FeedbackForm />
      </Section>
      <Section id="privacy" title={t('set.privacy')} description={t('set.privacyDesc')}>
        <ul className="tick-list small">
          <li>{t('set.privacy1')}</li>
          <li>{t('set.privacy2')}</li>
          <li>{t('set.privacy3')}</li>
        </ul>
        <p className="small muted with-icon"><ShieldCheck size={15} aria-hidden="true" /> {t('set.privacyNote')}</p>
      </Section>
      <Section id="danger" title={t('set.session')} description={t('set.sessionDesc')}>
        <DangerZone />
      </Section>
    </div>
  );
}
