import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/domain/auth/service/auth.service';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!token) {
      setTokenVerifying(false);
      return;
    }
    authService
      .verifyResetToken(token)
      .then((data) => {
        setTokenValid(true);
        setMaskedEmail(data.email);
        setEntityName(data.entityName);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
        const code = axiosErr?.response?.data?.error?.code;
        if (code === 'E1007') {
          setError(t('resetTokenExpired'));
        } else {
          setError(t('resetTokenInvalid'));
        }
      })
      .finally(() => setTokenVerifying(false));
  }, [token, t]);

  const schema = z
    .object({
      newPassword: z
        .string()
        .min(8, t('validation.passwordMinRegister'))
        .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, t('validation.passwordPattern')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    try {
      setError(null);
      await authService.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/user/login'), 3000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        setError(axiosErr.response?.data?.error?.message || t('resetTokenInvalid'));
      } else {
        setError(t('resetTokenInvalid'));
      }
    }
  };

  if (!token || (!tokenVerifying && !tokenValid)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white p-8 shadow-lg text-center">
            <p className="text-red-600 mb-4">{error || t('resetTokenInvalid')}</p>
            <Link
              to="/user/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tokenVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white p-8 shadow-lg text-center">
            <p className="text-gray-600">{t('resetPasswordVerifying')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {t('resetPasswordTitle')}
          </h2>

          {/* Entity Name + Email Info */}
          {(entityName || maskedEmail) && !success && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3 space-y-1.5">
              {entityName && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{t('resetPasswordEntityLabel')}:</span>
                  <span>{entityName}</span>
                </div>
              )}
              {maskedEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="ml-6">{maskedEmail}</span>
                </div>
              )}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {t('resetSuccess')}
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
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {t('newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('passwordRegisterPlaceholder')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      {...register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {t('confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('passwordRegisterPlaceholder')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.confirmPassword.message}
                    </p>
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
                    <KeyRound className="h-4 w-4" />
                  )}
                  {isSubmitting ? t('resetting') : t('resetPassword')}
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
    </div>
  );
}
