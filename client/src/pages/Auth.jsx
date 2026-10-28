import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserRound } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { LangToggle, Logo, useDocumentTitle, useToast } from '../components/ui.jsx';
import { CornerLeaves } from '../components/Illustrations.jsx';

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

export default function Auth({ mode }) {
  const { t } = useI18n();
  useDocumentTitle(mode === 'login' ? t('auth.loginTitle') : t('auth.createTitle'));
  const { login, register, startGuest, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: true });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [busy, setBusy] = useState('');
  const loginEmail = useRef(null);
  const signupName = useRef(null);

  useEffect(() => {
    (mode === 'login' ? loginEmail : signupName).current?.focus();
  }, [mode]);

  async function onLogin(e) {
    e.preventDefault();
    setLoginError('');
    setBusy('login');
    try {
      const u = await login(loginForm.email, loginForm.password, loginForm.remember);
      navigate(u.onboarded ? next : '/onboarding', { replace: true });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function onSignup(e) {
    e.preventDefault();
    setSignupError('');
    setBusy('signup');
    try {
      await register(signupForm.name, signupForm.email, signupForm.password);
      toast(t('auth.welcomeToast'));
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setSignupError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function onGuest() {
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
      <div className={`auth-card auth-${mode}`}>
        <section className="auth-panel auth-panel-login" aria-labelledby="login-title">
          <Logo />
          <h1 id="login-title" className="auth-title">{t('auth.welcomeBack')}</h1>
          <p className="auth-sub">{t('auth.loginSub')}</p>
          <form onSubmit={onLogin} className="form">
            <label className="field">
              <span>{t('auth.email')}</span>
              <input
                ref={loginEmail} type="email" autoComplete="email" placeholder="you@example.com" required dir="ltr"
                value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </label>
            <label className="field" htmlFor="login-password">
              <span>{t('auth.password')}</span>
              <PasswordInput
                id="login-password" autoComplete="current-password" placeholder={t('auth.passwordPh')}
                value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </label>
            <label className="check">
              <input type="checkbox" checked={loginForm.remember} onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })} />
              <span>{t('auth.remember')}</span>
            </label>
            {loginError && <p className="form-error" role="alert">{loginError}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={!!busy}>
              {busy === 'login' ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>
          <div className="divider"><span>{t('auth.or')}</span></div>
          <button type="button" className="btn btn-secondary btn-block" onClick={onGuest} disabled={!!busy}>
            <UserRound size={17} aria-hidden="true" /> {busy === 'guest' ? t('landing.settingUp') : t('auth.guest')}
          </button>
          <p className="auth-switch">
            {t('auth.noAccount')} <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>{t('auth.signup')}</Link>
          </p>
        </section>

        <section className="auth-panel auth-panel-signup" aria-labelledby="signup-title">
          <CornerLeaves className="auth-leaves" />
          <span className="auth-mobile-logo"><Logo /></span>
          <h2 id="signup-title" className="auth-title">{t('auth.createTitle')}</h2>
          <p className="auth-sub">{t('auth.createSub')}</p>
          <form onSubmit={onSignup} className="form">
            <label className="field">
              <span>{t('auth.fullName')}</span>
              <input
                ref={signupName} type="text" autoComplete="name" placeholder={t('auth.namePh')} required minLength={2} maxLength={60}
                value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{t('auth.email')}</span>
              <input
                type="email" autoComplete="email" placeholder="you@example.com" required dir="ltr"
                value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              />
            </label>
            <label className="field" htmlFor="signup-password">
              <span>{t('auth.password')}</span>
              <PasswordInput
                id="signup-password" autoComplete="new-password" placeholder={t('auth.newPasswordPh')}
                value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
              />
            </label>
            {signupError && <p className="form-error" role="alert">{signupError}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={!!busy}>
              {busy === 'signup' ? t('auth.creating') : t('auth.signup')}
            </button>
          </form>
          <p className="privacy-note">{t('auth.privacy')}</p>
          <p className="auth-switch">{t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link></p>
        </section>
      </div>
    </div>
  );
}
