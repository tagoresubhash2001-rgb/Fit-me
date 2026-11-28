import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LegalPage } from '../website/LegalPage';

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <LegalPage doc="privacy" metaKey="privacy" path="/privacy">
      <p className="px-2 text-small text-muted">
        <Link to="/delete-account" className="font-semibold text-primary-text underline-offset-2 hover:underline">
          {t('site.footer.deleteAccount')}
        </Link>
        {' · '}
        <Link to="/contact" className="font-semibold text-primary-text underline-offset-2 hover:underline">
          {t('site.nav.contact')}
        </Link>
      </p>
    </LegalPage>
  );
}
