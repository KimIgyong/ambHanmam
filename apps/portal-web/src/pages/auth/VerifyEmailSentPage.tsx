import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export function VerifyEmailSentPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.verify_email_sent_title')}</h1>
        <p className="mt-2 text-sm text-gray-600">{t('auth.verify_email_sent_desc')}</p>
        <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          {t('auth.back_to_login')}
        </Link>
      </div>
    </div>
  );
}
