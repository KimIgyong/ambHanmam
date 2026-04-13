import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Search, Building2, Mail, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService, type EntitySearchItem } from '@/domain/auth/service/auth.service';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import EntitySearchModal from '@/domain/auth/components/EntitySearchModal';
import { getRecentEntities, addRecentEntity } from '@/domain/auth/utils/recent-entities';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [findOrgOpen, setFindOrgOpen] = useState(false);
  const [findOrgEmail, setFindOrgEmail] = useState('');
  const [findOrgSending, setFindOrgSending] = useState(false);
  const [findOrgSent, setFindOrgSent] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchItem | null>(
    () => getRecentEntities()[0] || null,
  );
  const { t } = useTranslation('auth');

  const recentEntities = getRecentEntities();

  // Handle URL params from email link (entityCode & entityName)
  useEffect(() => {
    const entityCode = searchParams.get('entityCode');
    const entityName = searchParams.get('entityName');
    if (entityCode && entityName) {
      setSelectedEntity({
        entityId: '',
        code: entityCode,
        name: entityName,
        nameEn: null,
        country: '',
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loginSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordMin')),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleEntitySelect = (entity: EntitySearchItem) => {
    setSelectedEntity(entity);
    setError(null);
  };

  const handleFindOrganizations = async () => {
    if (!findOrgEmail || !findOrgEmail.includes('@')) return;
    try {
      setFindOrgSending(true);
      await authService.findOrganizations(findOrgEmail);
      setFindOrgSent(true);
    } catch {
      setFindOrgSent(true);
    } finally {
      setFindOrgSending(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (!selectedEntity) {
      setError(t('entityCodeRequired', { defaultValue: 'Please select your organization first.' }));
      return;
    }

    try {
      setError(null);
      const result = await authService.login(
        data.email,
        data.password,
        selectedEntity.code,
      );

      if (selectedEntity) {
        addRecentEntity(selectedEntity);
      }
      useAuthStore.getState().login(result.tokens.user);
      navigate('/select-entity', { state: { from: location.state?.from } });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
        const code = axiosErr.response?.data?.error?.code;
        if (code === 'E1010') {
          setError(t('entityCodeRequired', { defaultValue: 'Please select your organization first.' }));
        } else if (code === 'E1014') {
          setError(t('loginErrorEmailNotFound'));
        } else if (code === 'E1015') {
          setError(t('loginErrorPasswordIncorrect'));
        } else if (code === 'E1020') {
          setError(t('loginErrorAccountLocked'));
        } else {
          setError(axiosErr.response?.data?.error?.message || t('loginFailed'));
        }
      } else {
        setError(t('loginFailedRetry'));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">{t('subtitle')}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-lg sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 sm:mb-6 sm:text-xl">{t('login')}</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Entity Code */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('entityCode', { defaultValue: 'Organization' })}
              </label>
              {selectedEntity ? (
                <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                  <span className="text-base">{FLAG[selectedEntity.country] || '\uD83C\uDFE2'}</span>
                  <span className="flex-1 truncate text-sm font-medium text-gray-900 sm:text-base">
                    {selectedEntity.code} — {selectedEntity.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEntity(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <span className="text-sm">&times;</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="flex min-h-[44px] flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-primary-400 hover:text-gray-600"
                    >
                      <Search className="h-4 w-4" />
                      {t('findEntity', { defaultValue: 'Find your organization' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFindOrgOpen(true); setFindOrgSent(false); setFindOrgEmail(''); }}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
                      title={t('findOrganization')}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 최근 사용한 법인 빠른 선택 */}
                  {recentEntities.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {t('entitySearch.recent', { defaultValue: 'Recent' })}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentEntities.map((entity) => (
                          <button
                            key={entity.entityId || entity.code}
                            type="button"
                            onClick={() => handleEntitySelect(entity)}
                            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100"
                          >
                            <span className="text-sm">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
                            {entity.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email — text-base(16px) prevents iOS auto-zoom */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:py-2 sm:text-sm"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-base transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:py-2 sm:text-sm"
                  {...register('password')}
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-500">
                  {t('forgotPassword')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedEntity}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 active:bg-primary-700"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isSubmitting ? t('loggingIn') : t('login')}
            </button>
          </form>
        </div>
      </div>

      <EntitySearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleEntitySelect}
      />

      {/* Find Organization Modal */}
      {findOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900">{t('findOrganization')}</h3>
            </div>

            {findOrgSent ? (
              <div>
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {t('findOrgSent')}
                </div>
                <button
                  type="button"
                  onClick={() => setFindOrgOpen(false)}
                  className="min-h-[44px] w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {t('backToLogin')}
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm text-gray-600">{t('findOrgDesc')}</p>
                <input
                  type="email"
                  value={findOrgEmail}
                  onChange={(e) => setFindOrgEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:py-2 sm:text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFindOrganizations(); }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFindOrgOpen(false)}
                    className="min-h-[44px] flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {t('backToLogin')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFindOrganizations}
                    disabled={findOrgSending || !findOrgEmail.includes('@')}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {findOrgSending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {findOrgSending ? t('findOrgSending') : t('findOrgSend')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
