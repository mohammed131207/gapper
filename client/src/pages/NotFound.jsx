import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { Logo, useDocumentTitle } from '../components/ui.jsx';
import { HillsIllustration } from '../components/Illustrations.jsx';

export default function NotFound() {
  const { t } = useI18n();
  useDocumentTitle(t('nf.title'));
  const { user } = useAuth();
  return (
    <div className="not-found">
      <Logo />
      <h1>{t('nf.heading')}</h1>
      <p className="muted">{t('nf.text')}</p>
      <Link to={user ? '/dashboard' : '/'} className="btn btn-primary">{user ? t('jour.back') : t('jour.home')}</Link>
      <HillsIllustration className="not-found-art" label={t('ill.hills')} />
    </div>
  );
}
