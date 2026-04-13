import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partnerPortalApiService } from '../service/partner-portal.service';

export default function PartnerForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['partnerPortal', 'auth']);

  const schema = z.object({
    partnerCode: z.string().min(1, t('login.partnerCodeRequired')),
    email: z.string().email(t('auth:validation.emailInvalid')),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { partnerCode: '', email: '' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setError(null);
      await partnerPortalApiService.forgotPassword(data.partnerCode.trim(), data.email);
      setSent(true);
    } catch {
      setError(t('auth:loginFailedRetry'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white">
            P
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('auth:forgotPasswordTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('auth:forgotPasswordDesc')}</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {t('auth:resetLinkSent')}
            </div>
            <Link
              to="/partner/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-500"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('auth:backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Partner Code */}
              <div>
                <label htmlFor="partnerCode" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('login.partnerCode')}
                </label>
                <input
                  id="partnerCode"
                  type="text"
                  maxLength={20}
                  placeholder={t('login.partnerCodePlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  {...register('partnerCode')}
                />
                {errors.partnerCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.partnerCode.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('auth:email')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth:emailPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isSubmitting ? t('auth:sending') : t('auth:sendResetLink')}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                to="/partner/login"
                className="flex items-center justify-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth:backToLogin')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
