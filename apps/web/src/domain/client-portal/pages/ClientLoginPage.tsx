import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Eye, EyeOff, Clock } from 'lucide-react';
import { clientPortalApiService } from '../service/client-portal.service';
import { useClientAuthStore } from '../store/client-auth.store';
import EntitySearchModal from '@/domain/auth/components/EntitySearchModal';
import { getRecentEntities, addRecentEntity } from '@/domain/auth/utils/recent-entities';
import type { EntitySearchItem } from '@/domain/auth/service/auth.service';
import { toast } from 'sonner';

const FLAG: Record<string, string> = { KR: '🇰🇷', VN: '🇻🇳' };

export default function ClientLoginPage() {
  const { t } = useTranslation(['clientPortal', 'auth']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useClientAuthStore();

  const [selectedEntity, setSelectedEntity] = useState<EntitySearchItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const recentEntities = getRecentEntities();

  // URL 파라미터에서 초대 Entity 자동 세팅
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
    }
  }, [searchParams]);

  const handleEntitySelect = (entity: EntitySearchItem) => {
    setSelectedEntity(entity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) {
      toast.error(t('login.entityCodeRequired'));
      return;
    }
    setLoading(true);
    try {
      const data = await clientPortalApiService.login(selectedEntity.code, email, password);
      addRecentEntity({
        entityId: selectedEntity.entityId,
        code: selectedEntity.code,
        name: selectedEntity.name,
        nameEn: selectedEntity.nameEn,
        country: selectedEntity.country,
      });
      login(data.user);
      navigate('/client');
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            A
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entity Code Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('login.entityCode')}
            </label>
            {selectedEntity ? (
              <div className="flex min-h-[42px] items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                <span className="text-base">{FLAG[selectedEntity.country] || '🏢'}</span>
                <span className="flex-1 truncate text-sm font-medium text-gray-900">
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
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-indigo-400 hover:text-gray-600"
                >
                  <Search className="h-4 w-4" />
                  {t('login.findEntity')}
                </button>

                {recentEntities.length > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {t('login.entityRecent')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentEntities.map((entity) => (
                        <button
                          key={entity.entityId || entity.code}
                          type="button"
                          onClick={() => handleEntitySelect(entity as EntitySearchItem)}
                          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <span className="text-sm">{FLAG[entity.country] || '🏢'}</span>
                          {entity.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '...' : t('login.submit')}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/client/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
            {t('auth:forgotPassword')}
          </Link>
        </div>

        <p className="mt-3 text-center text-sm text-gray-500">
          {t('login.noAccount')}{' '}
          <Link to="/client/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t('login.register')}
          </Link>
        </p>
      </div>

      <EntitySearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleEntitySelect}
      />
    </div>
  );
}
