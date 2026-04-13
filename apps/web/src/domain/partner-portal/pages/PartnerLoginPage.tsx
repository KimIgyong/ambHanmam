import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { partnerPortalApiService } from '../service/partner-portal.service';
import { usePartnerAuthStore } from '../store/partner-auth.store';
import { toast } from 'sonner';

export default function PartnerLoginPage() {
  const { t } = useTranslation(['partnerPortal', 'auth']);
  const navigate = useNavigate();
  const { login } = usePartnerAuthStore();

  const [partnerCode, setPartnerCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCode.trim()) {
      toast.error(t('login.partnerCodeRequired'));
      return;
    }
    setLoading(true);
    try {
      const data = await partnerPortalApiService.login(partnerCode.trim(), email, password);
      login(data.user);
      navigate('/partner');
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: { message?: string; code?: string } } } };
      const code = error.response?.data?.error?.code;
      if (code === 'E1014') {
        toast.error(t('auth:loginErrorEmailNotFound'));
      } else if (code === 'E1015') {
        toast.error(t('auth:loginErrorPasswordIncorrect'));
      } else if (code === 'E1020') {
        toast.error(t('auth:loginErrorAccountLocked'));
      } else {
        toast.error(error.response?.data?.error?.message || t('auth:loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white">
            P
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Partner Code */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('login.partnerCode')}
            </label>
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              required
              maxLength={20}
              placeholder={t('login.partnerCodePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? '...' : t('login.submit')}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/partner/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
            {t('auth:forgotPassword')}
          </Link>
        </div>

        <p className="mt-3 text-center text-sm text-gray-500">
          {t('login.noAccount')}{' '}
          <Link to="/partner/register" className="font-medium text-emerald-600 hover:text-emerald-500">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
