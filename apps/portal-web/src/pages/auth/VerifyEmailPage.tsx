import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api.get(`/portal/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">{t('auth.verifying_email')}</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.email_verified')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('auth.email_verified_desc')}</p>
            <Link to="/login" className="mt-6 btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              {t('auth.login_button')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.verification_failed')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('auth.verification_failed_desc')}</p>
            <Link to="/login" className="mt-6 inline-block text-primary-600 hover:text-primary-700">
              {t('auth.back_to_login')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
