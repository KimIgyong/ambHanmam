import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Building2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { authService } from '@/domain/auth/service/auth.service';
import { CountryIconGrid } from '@/components/common/CountryIconGrid';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function InitialSetupPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { updateUser, logout } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit =
    password.length >= 8 &&
    PASSWORD_REGEX.test(password) &&
    password === confirmPassword &&
    name.trim().length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('initialSetup.passwordMismatch'));
      return;
    }
    if (password.length < 8 || !PASSWORD_REGEX.test(password)) {
      setError(t('initialSetup.passwordTooShort'));
      return;
    }
    if (!name.trim()) {
      setError(t('initialSetup.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await authService.initialSetup({
        password,
        name: name.trim(),
        company_name: companyName.trim() || undefined,
        country_code: countryCode.trim() || undefined,
      });

      // Update auth store with fresh user data
      useAuthStore.getState().login(result.tokens.user);
      updateUser({ mustChangePw: false });
      window.gtag?.('event', 'initial_setup_complete');
      navigate('/today', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setError(
        axiosErr?.response?.data?.error?.message ||
        axiosErr?.response?.data?.message ||
        t('initialSetup.failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800 sm:p-8">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('initialSetup.title')}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('initialSetup.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('initialSetup.password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('initialSetup.passwordPlaceholder')}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && !PASSWORD_REGEX.test(password) && (
              <p className="mt-1 text-xs text-amber-600">{t('validation.passwordPattern')}</p>
            )}
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t('initialSetup.passwordRememberWarning')}
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('initialSetup.confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{t('initialSetup.passwordMismatch')}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('initialSetup.name')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('initialSetup.namePlaceholder')}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Company Name (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('initialSetup.companyName')}
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('initialSetup.companyNamePlaceholder')}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoComplete="organization"
              />
            </div>
          </div>

          {/* Country Code (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('initialSetup.countryCode')}
            </label>
            <CountryIconGrid value={countryCode} onChange={setCountryCode} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? t('initialSetup.submitting') : t('initialSetup.submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => logout()}
            className="text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            {t('selectEntity.logout', { defaultValue: 'Logout' })}
          </button>
        </div>
      </div>
    </div>
  );
}
