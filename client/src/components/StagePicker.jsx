import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth, useMeta } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { useToast } from './ui.jsx';

// The "Computer Science · Year 1 · Semester 1" pill that lets students change their current stage.
export default function StagePicker({ onChange }) {
  const { user, updateProfile } = useAuth();
  const { programs, years } = useMeta();
  const { t, stage } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ program: user.program, year: user.year, semester: user.semester });
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setForm({ program: user.program, year: user.year, semester: user.semester });
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open, user]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(form);
      setOpen(false);
      onChange?.();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const programName = programs.find((p) => p.slug === user.program)?.name || '';

  return (
    <div className="stage-picker" ref={ref}>
      <button type="button" className="stage-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog">
        <span>
          <strong>{programName}</strong>
          <small>{stage(user.year, user.semester)}</small>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <form className="popover" role="dialog" aria-label={t('stage.change')} onSubmit={save}>
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
                {years.map((y) => <option key={y.year} value={y.year}>{y.title}</option>)}
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
          <button type="submit" className="btn btn-primary btn-block btn-sm" disabled={busy}>{busy ? t('common.saving') : t('stage.update')}</button>
        </form>
      )}
    </div>
  );
}
