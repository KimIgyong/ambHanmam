import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/domain/auth/service/auth.service';

export default function AdminForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['admin', 'auth']);

  const schema = z.object({
    email: z.string().email(t('auth:validation.emailInvalid')),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setError(null);
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch {
      setError(t('auth:loginFailedRetry'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            <ShieldCheck className="h-6 w-6" />
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
              to="/admin/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
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
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('auth:email')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth:emailPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
                to="/admin/login"
                className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
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
