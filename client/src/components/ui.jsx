import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CircleAlert, Languages, LoaderCircle, X } from 'lucide-react';
import { Icon } from '../icons.jsx';
import { useI18n } from '../i18n.jsx';

export function Logo({ to = '/', light = false, size = 'md' }) {
  const { t } = useI18n();
  return (
    <Link to={to} className={`logo logo-${size} ${light ? 'logo-light' : ''}`} aria-label={t('app.home')}>
      <LogoMark />
      <span>Gapper</span>
    </Link>
  );
}

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <path d="M5 27C5 15.5 11.5 6.5 24.5 4.5 26 16.5 18.5 25 5 27Z" fill="var(--leaf-dark)" />
      <path d="M5 27 19.5 11" stroke="var(--leaf-vein)" strokeWidth="1.3" strokeLinecap="round" opacity=".55" />
      <path d="M13.5 28c4-6 9.5-8.5 15.5-8.5-2 6.5-8.5 9.5-15.5 8.5Z" fill="var(--leaf-light)" />
    </svg>
  );
}

// Switches between English and Arabic; the label is always written in the other language.
export function LangToggle({ light = false, compact = false }) {
  const { t, toggle, lang } = useI18n();
  return (
    <button
      type="button" className={`lang-toggle ${light ? 'lang-toggle-light' : ''} ${compact ? 'lang-toggle-compact' : ''}`}
      onClick={toggle} aria-label={t('lang.switch')} title={t('lang.switch')} lang={lang === 'ar' ? 'en' : 'ar'}
    >
      <Languages size={16} aria-hidden="true" />
      <span>{t('lang.other')}</span>
    </button>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  const s = status || 'not_started';
  return <span className={`badge badge-${s}`}>{t(`status.${s}`)}</span>;
}

export function StatusDot({ status, size = 34 }) {
  const { t } = useI18n();
  const s = status || 'not_started';
  return (
    <span className={`status-dot status-dot-${s}`} style={{ width: size, height: size }} role="img" aria-label={t(`status.${s}`)}>
      {s === 'completed' && <Check size={size * 0.5} strokeWidth={3} />}
      {s === 'in_progress' && <span className="status-dot-half" />}
    </span>
  );
}

export function SkillIcon({ icon, category, size = 'md' }) {
  const px = { sm: 16, md: 20, lg: 26 }[size];
  return (
    <span className={`skill-icon skill-icon-${size} cat-${category}`}>
      <Icon name={icon} size={px} strokeWidth={1.8} />
    </span>
  );
}

export function ProgressBar({ value, label, thin = false }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className={`progress ${thin ? 'progress-thin' : ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${v}%` }} />
    </div>
  );
}

export function Donut({ value, size = 150, stroke = 14, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        {v > 0 && <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke}
          strokeDasharray={`${(v / 100) * c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />}
      </svg>
      <div className="donut-center">{children}</div>
    </div>
  );
}

export function Spinner({ label }) {
  const { t } = useI18n();
  return (
    <div className="spinner" role="status">
      <LoaderCircle size={22} className="spin" aria-hidden="true" />
      <span>{label || t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="state-card state-error" role="alert">
      <CircleAlert size={22} aria-hidden="true" />
      <p>{error?.message || t('common.error')}</p>
      {onRetry && <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRetry()}>{t('common.retry')}</button>}
    </div>
  );
}

export function EmptyState({ icon: IconComponent, title, children, action }) {
  return (
    <div className="state-card">
      {IconComponent && <IconComponent size={24} aria-hidden="true" />}
      <p className="state-title">{title}</p>
      {children && <p className="state-text">{children}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Tabs({ items, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value} type="button" role="tab" aria-selected={value === item.value}
          className={`tab ${value === item.value ? 'is-active' : ''}`} onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count != null && <span className="tab-count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Toasts ----------

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const toast = useCallback((message, kind = 'success') => {
    const key = ++id.current;
    setToasts((list) => [...list, { key, message, kind }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.key !== key)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.key} className={`toast toast-${item.kind}`}>
            {item.kind === 'error' ? <CircleAlert size={18} /> : <Check size={18} />}
            <span>{item.message}</span>
            <button type="button" aria-label={t('common.dismiss')} onClick={() => setToasts((x) => x.filter((y) => y.key !== item.key))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function useDocumentTitle(title) {
  const { t } = useI18n();
  useEffect(() => {
    document.title = title ? `${title} · Gapper` : t('app.title');
  }, [title, t]);
}
