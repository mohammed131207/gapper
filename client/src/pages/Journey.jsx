import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useApi } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { LangToggle, LogoMark, useDocumentTitle } from '../components/ui.jsx';
import { HillsIllustration } from '../components/Illustrations.jsx';
import { FUTURE } from './Landing.jsx';

export default function Journey() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.journey'));
  const { user } = useAuth();
  const signedIn = user && user.onboarded;
  const { data } = useApi(signedIn ? '/progress' : null);

  return (
    <div className="journey">
      <div className="journey-inner">
        <div className="journey-top">
          <Link to={signedIn ? '/dashboard' : '/'} className="back-link">
            <ArrowLeft size={16} aria-hidden="true" className="flip-rtl" /> {signedIn ? t('jour.back') : t('jour.home')}
          </Link>
          <LangToggle compact />
        </div>
        <p className="journey-quote">{t('jour.q1')}<br />{t('jour.q2')}<br />{t('jour.q3')}<br />{t('jour.q4')}</p>
        <div className="journey-brand">
          <LogoMark size={40} />
          <span>Gapper</span>
        </div>
        <p className="journey-tag">{t('landing.h1a')}<br />{t('landing.h1b')}</p>

        {data && (
          <div className="journey-stats">
            <div><strong>{data.overall.completed}</strong><span>{t('jour.completed')}</span></div>
            <div><strong>{data.overall.inProgress}</strong><span>{t('jour.inProgress')}</span></div>
            <div><strong>{data.overall.total - data.overall.completed}</strong><span>{t('jour.ahead')}</span></div>
          </div>
        )}

        <section className="journey-future">
          <h2>{t('jour.heading')}</h2>
          <p className="small">{t('jour.note')}</p>
          <ul>
            {FUTURE.map(({ icon: I, key }) => (
              <li key={key}><I size={18} aria-hidden="true" /><span><strong>{t(key)}</strong> {t(`${key}Text`)}</span></li>
            ))}
          </ul>
        </section>
      </div>
      <HillsIllustration className="journey-hills" label={t('ill.hills')} />
    </div>
  );
}
