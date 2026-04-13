import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/domain/auth/service/auth.service';
import { membersService } from '@/domain/members/service/members.service';
import { UNITS } from '@/global/constant/unit.constant';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation_token');
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    unit: string;
    entityName?: string | null;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const { t } = useTranslation(['auth', 'units']);

  const registerSchema = z.object({
    email: z.string().email(t('auth:validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('auth:validation.passwordMinRegister'))
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        t('auth:validation.passwordPattern'),
      ),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, t('auth:validation.nameMin'))
      .max(50, t('auth:validation.nameMax')),
    unit: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth:validation.passwordMismatch'),
    path: ['confirmPassword'],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      unit: '',
    },
  });

  const invitedUnit = invitationData?.unit?.trim() || '';
  const hasInvitedUnit = invitedUnit.length > 0;
  const isInvitedUnitInPreset = hasInvitedUnit && UNITS.some((u) => u.code === invitedUnit);

  useEffect(() => {
    if (invitationToken) {
      membersService
        .validateInvitation(invitationToken)
        .then((data) => {
          if (data) {
            setInvitationData({
              email: data.email,
              role: data.role,
              unit: data.unit || '',
              entityName: data.entityName || null,
            });
            setValue('email', data.email);
            setValue('unit', data.unit || '');
          }
        })
        .catch(() => {
          setError(t('auth:invalidInvitation', { defaultValue: 'Invalid or expired invitation.' }));
        });
    }
  }, [invitationToken, setValue, t]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      const result = await authService.register(
        data.email,
        data.password,
        data.name,
        data.unit || undefined,
        invitationToken || undefined,
      );
      setSuccess(true);
      setResultMessage(
        result.user?.status === 'ACTIVE'
          ? t('auth:registerSuccessActive', { defaultValue: 'Registration complete. You can now log in.' })
          : t('auth:registerSuccessPending', { defaultValue: 'Registration complete. Your account is pending admin approval.' }),
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        setError(
          axiosErr.response?.data?.error?.message || t('auth:registerFailed'),
        );
      } else {
        setError(t('auth:registerFailedRetry'));
      }
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white p-8 shadow-lg text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('auth:registerSuccessTitle', { defaultValue: 'Registration Complete' })}
            </h2>
            <p className="text-gray-600 mb-6">{resultMessage}</p>
            <button
              onClick={() => navigate('/user/login', { replace: true })}
              className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              {t('auth:login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('auth:title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('auth:subtitle')}
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {t('auth:register')}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {invitationData?.entityName && (
            <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3">
              <p className="text-xs font-medium text-primary-700">
                {t('auth:invitedEntityLabel', { defaultValue: 'Invited Entity' })}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-900">
                {invitationData.entityName}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth:email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth:emailPlaceholder')}
                readOnly={!!invitationData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${invitationData ? 'bg-gray-100' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth:password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth:passwordRegisterPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth:confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth:confirmPassword')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth:name')}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder={t('auth:namePlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="unit"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth:unit')} <span className="text-gray-400">{t('auth:unitOptional')}</span>
              </label>
              <select
                id="unit"
                disabled={!!invitationData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${invitationData ? 'bg-gray-100' : ''}`}
                {...register('unit')}
              >
                <option value="">{t('auth:selectUnit')}</option>
                {hasInvitedUnit && !isInvitedUnitInPreset && (
                  <option value={invitedUnit}>{invitedUnit}</option>
                )}
                {UNITS.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {t(`units:${dept.nameKey}`)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isSubmitting ? t('auth:registering') : t('auth:register')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t('auth:hasAccount')}{' '}
            <Link
              to="/user/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth:login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
