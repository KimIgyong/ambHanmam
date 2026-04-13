import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService, type EntitySearchItem } from '@/domain/auth/service/auth.service';
import EntitySearchModal from '@/domain/auth/components/EntitySearchModal';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchItem | null>(null);
  const { t } = useTranslation('auth');

  const schema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
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
    if (!selectedEntity) {
      setError(t('entityRequired', { defaultValue: 'Please select an organization.' }));
      return;
    }
    try {
      setError(null);
      await authService.forgotPassword(data.email, selectedEntity.code);
      setSent(true);
    } catch {
      setError(t('loginFailedRetry'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t('forgotPasswordTitle')}</h2>
          <p className="mb-6 text-sm text-gray-500">{t('forgotPasswordDesc')}</p>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {t('resetLinkSent')}
              </div>
              <Link
                to="/user/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Entity Code */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entityCode', { defaultValue: 'Organization' })}
                    <span className="ml-1 text-xs text-red-500">*</span>
                  </label>
                  {selectedEntity ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                      <span className="text-base">{FLAG[selectedEntity.country] || '\uD83C\uDFE2'}</span>
                      <span className="flex-1 truncate text-sm font-medium text-gray-900">
                        {selectedEntity.code} — {selectedEntity.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-xs">&times;</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-primary-400 hover:text-gray-600"
                    >
                      <Search className="h-4 w-4" />
                      {t('findEntity', { defaultValue: 'Find your organization' })}
                    </button>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    {t('email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('emailPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isSubmitting ? t('sending') : t('sendResetLink')}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link
                  to="/user/login"
                  className="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <EntitySearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={setSelectedEntity}
      />
    </div>
  );
}
