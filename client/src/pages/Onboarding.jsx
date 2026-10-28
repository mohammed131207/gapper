import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useAuth, useMeta } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { LangToggle, Logo, useDocumentTitle, useToast } from '../components/ui.jsx';

export default function Onboarding() {
  const { t } = useI18n();
  useDocumentTitle(t('onb.title'));
  const { user, updateProfile } = useAuth();
  const { programs, years } = useMeta();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ program: user.program, year: user.year, semester: user.semester });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ ...form, onboarded: true });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="page-corner"><LangToggle compact /></div>
      <form className="onboarding-card" onSubmit={submit}>
        <Logo />
        <h1>{user.isGuest ? t('onb.welcome') : t('onb.welcomeName', { name: user.name.split(' ')[0] })} {t('onb.question')}</h1>
        <p className="muted">{t('onb.sub')}</p>

        <fieldset className="choice-group">
          <legend>{t('onb.program')}</legend>
          <div className="choice-grid choice-grid-2">
            {programs.map((p) => (
              <label key={p.slug} className={`choice ${form.program === p.slug ? 'is-selected' : ''}`}>
                <input type="radio" name="program" value={p.slug} checked={form.program === p.slug} onChange={() => setForm({ ...form, program: p.slug })} />
                <strong>{p.name}</strong>
                {form.program === p.slug && <Check size={18} className="choice-check" aria-hidden="true" />}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>{t('onb.year')}</legend>
          <div className="choice-grid choice-grid-4">
            {years.map((y) => (
              <label key={y.year} className={`choice ${form.year === y.year ? 'is-selected' : ''}`}>
                <input type="radio" name="year" value={y.year} checked={form.year === y.year} onChange={() => setForm({ ...form, year: y.year })} />
                <strong>{y.title}</strong>
                <span>{y.subtitle}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>{t('onb.semester')}</legend>
          <div className="choice-grid choice-grid-2">
            {[1, 2].map((s) => (
              <label key={s} className={`choice ${form.semester === s ? 'is-selected' : ''}`}>
                <input type="radio" name="semester" value={s} checked={form.semester === s} onChange={() => setForm({ ...form, semester: s })} />
                <strong>{t('stage.semester', { n: s })}</strong>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? t('onb.submitting') : t('onb.submit')} <ArrowRight size={18} aria-hidden="true" className="flip-rtl" />
        </button>
      </form>
    </div>
  );
}
