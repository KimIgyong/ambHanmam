import { useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authService } from '@/domain/auth/service/auth.service';
import { useAuthStore } from '@/domain/auth/store/auth.store';

/** SSO redirect_uri 허용 도메인 화이트리스트 */
const ALLOWED_REDIRECT_HOSTS = [
  'apps.amoeba.site',
  'stg-apps.amoeba.site',
  'localhost',
];

function isAllowedRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ALLOWED_REDIRECT_HOSTS.some(
      (h) => url.hostname === h || url.hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

export default function AdminLoginPage() {
  const { t } = useTranslation(['admin', 'auth']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUri = useMemo(() => {
    const raw = searchParams.get('redirect_uri');
    if (!raw) return null;
    // 프로토콜 없으면 https:// 붙이기
    const uri = raw.startsWith('http') ? raw : `https://${raw}`;
    return isAllowedRedirectUri(uri) ? uri : null;
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      const user = data.tokens.user;

      if (user.level !== 'ADMIN_LEVEL') {
        setError(t('adminLogin.errorAdminOnly'));
        setLoading(false);
        return;
      }

      // SSO: redirect_uri가 있으면 토큰을 붙여서 외부로 리다이렉트
      if (redirectUri) {
        const token = data.tokens.accessToken;
        const separator = redirectUri.includes('?') ? '&' : '?';
        window.location.href = `${redirectUri}${separator}token=${encodeURIComponent(token)}`;
        return;
      }

      useAuthStore.getState().login(user);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: { message?: string; code?: string } } } };
      const code = error.response?.data?.error?.code;
      if (code === 'E1014') {
        setError(t('auth:loginErrorEmailNotFound'));
      } else if (code === 'E1015') {
        setError(t('auth:loginErrorPasswordIncorrect'));
      } else if (code === 'E1020') {
        setError(t('auth:loginErrorAccountLocked'));
      } else {
        setError(error.response?.data?.error?.message || t('adminLogin.errorInvalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('adminLogin.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('adminLogin.subtitle')}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('adminLogin.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('adminLogin.emailPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('adminLogin.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('adminLogin.passwordPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '...' : t('adminLogin.submit')}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <Link
            to="/admin/forgot-password"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {t('auth:forgotPassword')}
          </Link>
        </div>

        {/* Back to main login link */}
        <div className="mt-6 text-center">
          <Link
            to="/user/login"
            className="text-sm text-gray-500 hover:text-indigo-600"
          >
            {t('adminLogin.backToMain')}
          </Link>
        </div>
      </div>
    </div>
  );
}
