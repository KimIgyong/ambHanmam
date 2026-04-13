import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, Loader2, Search, Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService, type EntitySearchItem } from '@/domain/auth/service/auth.service';
import { clientPortalApiService } from '@/domain/client-portal/service/client-portal.service';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useClientAuthStore } from '@/domain/client-portal/store/client-auth.store';
import { addRecentEntity } from '@/domain/auth/utils/recent-entities';
import EntitySearchModal from '@/domain/auth/components/EntitySearchModal';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

type LoginTab = 'user' | 'client';

export default function EntityLoginPage() {
  const { entCode } = useParams<{ entCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['auth', 'clientPortal']);

  const [entity, setEntity] = useState<EntitySearchItem | null>(null);
  const [entityLoading, setEntityLoading] = useState(true);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LoginTab>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const [autoLoginProcessing, setAutoLoginProcessing] = useState(false);

  // Entity 조회
  useEffect(() => {
    if (!entCode) {
      setEntityError(t('auth:entityLogin.entityNotFound'));
      setEntityLoading(false);
      return;
    }

    let cancelled = false;
    setEntityLoading(true);
    setEntityError(null);

    authService
      .searchEntities(entCode)
      .then((results) => {
        if (cancelled) return;
        const exact = results.find(
          (e) => e.code.toUpperCase() === entCode.toUpperCase(),
        );
        if (exact) {
          setEntity(exact);
        } else {
          setEntityError(t('auth:entityLogin.entityNotFound'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntityError(t('auth:entityLogin.entityNotFound'));
        }
      })
      .finally(() => {
        if (!cancelled) setEntityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entCode, t]);

  // Auto-login via token (from portal registration)
  useEffect(() => {
    const altToken = searchParams.get('alt');
    if (!altToken || autoLoginProcessing) return;

    setAutoLoginProcessing(true);
    authService
      .autoLogin(altToken)
      .then((result) => {
        useAuthStore.getState().login(result.tokens.user);
        navigate('/select-entity', { replace: true });
      })
      .catch(() => {
        setAutoLoginProcessing(false);
        // Token expired or invalid — show normal login form
      });
  }, [searchParams, navigate, autoLoginProcessing]);

  const loginSchema = z.object({
    email: z.string().email(t('auth:validation.emailInvalid', { defaultValue: 'Invalid email' })),
    password: z.string().min(8, t('auth:validation.passwordMin', { defaultValue: 'At least 8 characters' })),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!entity || !entCode) return;

    try {
      setError(null);

      if (activeTab === 'user') {
        const result = await authService.login(data.email, data.password, entity.code);
        addRecentEntity(entity);
        useAuthStore.getState().login(result.tokens.user);
        navigate('/select-entity', { state: { from: location.state?.from } });
      } else {
        const result = await clientPortalApiService.login(entity.code, data.email, data.password);
        addRecentEntity(entity);
        useClientAuthStore.getState().login(result.user);
        navigate('/client');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
        const code = axiosErr.response?.data?.error?.code;
        if (code === 'E1014') {
          setError(t('auth:loginErrorEmailNotFound'));
        } else if (code === 'E1015') {
          setError(t('auth:loginErrorPasswordIncorrect'));
        } else if (code === 'E1020') {
          setError(t('auth:loginErrorAccountLocked'));
        } else {
          setError(axiosErr.response?.data?.error?.message || t('auth:loginFailed'));
        }
      } else {
        setError(t('auth:loginFailedRetry'));
      }
    }
  };

  // Auto-login processing
  if (autoLoginProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-500">{t('auth:entityLogin.autoLoginProcessing', { defaultValue: 'Signing in...' })}</p>
        </div>
      </div>
    );
  }

  // Entity 로딩 중
  if (entityLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-500">{t('auth:entityLogin.loading')}</p>
        </div>
      </div>
    );
  }

  // Entity 선택 후 바로가기 URL 생성
  const getEntityLoginUrl = (code: string) => {
    const origin = window.location.origin;
    return `${origin}/${code}/login`;
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEntitySearchSelect = (ent: EntitySearchItem) => {
    setSelectedEntity(ent);
  };

  // Entity 오류 → 조직 선택 안내 화면
  if (entityError || !entity) {
    const shortcutUrl = selectedEntity ? getEntityLoginUrl(selectedEntity.code) : null;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="w-full max-w-md">
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('auth:title')}</h1>
            <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">{t('auth:subtitle')}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-lg sm:p-8">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <Building2 className="h-7 w-7 text-primary-600" />
              </div>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                {t('auth:entityLogin.selectOrgTitle')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('auth:entityLogin.selectOrgDesc')}
              </p>
            </div>

            {/* 조직 찾기 버튼 */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
            >
              <Search className="h-4 w-4" />
              {t('auth:entityLogin.findOrg')}
            </button>

            {/* 선택된 조직 + 바로가기 URL */}
            {selectedEntity && shortcutUrl && (
              <div className="mt-5 rounded-lg border border-primary-200 bg-primary-50 p-4">
                {/* 선택된 조직 정보 */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xl">{FLAG[selectedEntity.country] || '\uD83C\uDFE2'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {selectedEntity.code} — {selectedEntity.name}
                    </p>
                    {selectedEntity.nameEn && (
                      <p className="truncate text-xs text-gray-500">{selectedEntity.nameEn}</p>
                    )}
                  </div>
                </div>

                {/* 바로가기 안내 */}
                <p className="mb-2 text-xs font-medium text-gray-600">
                  {t('auth:entityLogin.shortcutGuide')}
                </p>
                <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono text-primary-700">{shortcutUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(shortcutUrl)}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-600 transition-colors hover:bg-gray-200"
                    title={t('auth:entityLogin.copyUrl')}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? t('auth:entityLogin.copied') : t('auth:entityLogin.copyUrl')}</span>
                  </button>
                </div>

                {/* 바로가기 이동 */}
                <Link
                  to={`/${selectedEntity.code}/login`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('auth:entityLogin.goToEntityLogin')}
                </Link>
              </div>
            )}

            {/* 일반 로그인 링크 */}
            <div className="mt-5 text-center">
              <Link to="/user/login" className="text-sm text-gray-500 hover:text-gray-700">
                {t('auth:entityLogin.goToLogin')}
              </Link>
            </div>
          </div>
        </div>

        <EntitySearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={handleEntitySearchSelect}
        />
      </div>
    );
  }

  const tabs: { key: LoginTab; label: string }[] = [
    { key: 'user', label: t('auth:entityLogin.userTab') },
    { key: 'client', label: t('auth:entityLogin.clientTab') },
  ];

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('auth:title')}</h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">{t('auth:subtitle')}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-lg sm:p-8">
          {/* Entity Info (read-only) */}
          <div className="mb-5 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-xl">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {entity.code} — {entity.name}
              </p>
              {entity.nameEn && (
                <p className="truncate text-xs text-gray-500">{entity.nameEn}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex rounded-lg border border-gray-200 bg-gray-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setError(null); }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('auth:email')}
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder={t('auth:emailPlaceholder')}
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-500">{formErrors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('auth:password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder={t('auth:passwordPlaceholder')}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
              {formErrors.password && (
                <p className="mt-1 text-xs text-red-500">{formErrors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth:loggingIn')}
                </>
              ) : (
                t('auth:login')
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 space-y-2 text-center">
            <Link
              to={activeTab === 'client' ? '/client/forgot-password' : '/forgot-password'}
              className="block text-sm text-primary-600 hover:text-primary-500"
            >
              {t('auth:forgotPassword')}
            </Link>
            <Link
              to="/user/login"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              {t('auth:entityLogin.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
