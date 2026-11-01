import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserRound } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { LangToggle, Logo, useDocumentTitle, useToast } from '../components/ui.jsx';
import { HillsIllustration } from '../components/Illustrations.jsx';

export function PasswordInput({ id, value, onChange, autoComplete, placeholder, inputRef }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-with-btn">
      <input
        id={id} ref={inputRef} type={visible ? 'text' : 'password'} value={value} onChange={onChange}
        autoComplete={autoComplete} placeholder={placeholder} required minLength={autoComplete === 'new-password' ? 8 : undefined}
      />
      <button type="button" className="input-btn" onClick={() => setVisible((v) => !v)} aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}>
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

// /login and /signup each show their own form; a link at the bottom moves between them.
export default function Auth({ mode }) {
  const { t } = useI18n();
  const isLogin = mode === 'login';
  useDocumentTitle(isLogin ? t('auth.loginTitle') : t('auth.createTitle'));
  const { login, register, startGuest, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const nextQuery = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';

  const [form, setForm] = useState({ name: '', email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const firstField = useRef(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  useEffect(() => {
    setError('');
    // Only with a mouse: on phones, focusing a field would open the keyboard over the page.
    if (window.matchMedia('(pointer: fine)').matches) firstField.current?.focus();
  }, [mode]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy('form');
    try {
      if (isLogin) {
        const u = await login(form.email, form.password, form.remember);
        navigate(u.onboarded ? next : '/onboarding', { replace: true });
      } else {
        await register(form.name, form.email, form.password);
        toast(t('auth.welcomeToast'));
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function continueAsGuest() {
    setBusy('guest');
    try {
      const u = user?.isGuest ? user : await startGuest();
      navigate(u.onboarded ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="auth-page">
      <div className="page-corner"><LangToggle compact /></div>
      <div className="auth-card">
        <section className="auth-panel" aria-labelledby="auth-title">
          <Logo />
          <h1 id="auth-title" className="auth-title">{isLogin ? t('auth.welcomeBack') : t('auth.createTitle')}</h1>
          <p className="auth-sub">{isLogin ? t('auth.loginSub') : t('auth.createSub')}</p>

          <form onSubmit={submit} className="form">
            {!isLogin && (
              <label className="field">
                <span>{t('auth.fullName')}</span>
                <input
                  ref={firstField} type="text" autoComplete="name" placeholder={t('auth.namePh')} required minLength={2} maxLength={60}
                  value={form.name} onChange={set('name')}
                />
              </label>
            )}
            <label className="field">
              <span>{t('auth.email')}</span>
              <input
                ref={isLogin ? firstField : null} type="email" autoComplete="email" placeholder="you@example.com" required dir="ltr"
                value={form.email} onChange={set('email')}
              />
            </label>
            <label className="field" htmlFor="auth-password">
              <span>{t('auth.password')}</span>
              <PasswordInput
                id="auth-password" autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? t('auth.passwordPh') : t('auth.newPasswordPh')}
                value={form.password} onChange={set('password')}
              />
            </label>
            {isLogin && (
              <label className="check">
                <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
                <span>{t('auth.remember')}</span>
              </label>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={!!busy}>
              {isLogin
                ? (busy === 'form' ? t('auth.loggingIn') : t('auth.login'))
                : (busy === 'form' ? t('auth.creating') : t('auth.signup'))}
            </button>
          </form>

          {!isLogin && <p className="privacy-note">{t('auth.privacy')}</p>}

          <div className="divider"><span>{t('auth.or')}</span></div>
          <button type="button" className="btn btn-secondary btn-block" onClick={continueAsGuest} disabled={!!busy}>
            <UserRound size={17} aria-hidden="true" /> {busy === 'guest' ? t('landing.settingUp') : t('auth.guest')}
          </button>

          <p className="auth-switch">
            {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <Link to={`${isLogin ? '/signup' : '/login'}${nextQuery}`}>{isLogin ? t('auth.signup') : t('auth.login')}</Link>
          </p>
        </section>

        <aside className="auth-aside" aria-hidden="true">
          <p className="auth-tagline">{t('landing.h1a')}<br />{t('landing.h1b')}</p>
          <p>{t('landing.ctaTitle')}</p>
          <HillsIllustration className="auth-hills" />
        </aside>
      </div>
    </div>
  );
}
