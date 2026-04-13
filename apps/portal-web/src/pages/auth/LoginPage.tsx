import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { PageHead } from '@/components/seo/PageHead';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/portal');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('auth.login_failed'));
    }
  };

  const onGoogleLogin = async () => {
    setError('');
    try {
      const { data } = await api.get('/portal/auth/google/start');
      const result = data.data || data;
      window.location.href = result.url;
    } catch {
      setError(t('auth.google_start_failed'));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <PageHead title={t('auth.login_title')} path="/login" noindex />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login_title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{t('auth.password_required')}</p>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
              {t('auth.forgot_password')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {t('auth.login_button')}
          </button>

          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('auth.continue_with_google')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
            {t('auth.signup_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
