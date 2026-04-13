import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { PageHead } from '@/components/seo/PageHead';

const forgotSchema = z.object({
  email: z.string().email(),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    await api.post('/portal/auth/forgot-password', { email: data.email });
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.reset_email_sent')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.reset_email_sent_desc')}</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.back_to_login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <PageHead title={t('auth.forgot_title')} path="/forgot-password" noindex />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.forgot_title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.forgot_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{t('auth.invalid_email')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {t('auth.send_reset_link')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
