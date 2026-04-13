import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { entityApiService } from '@/domain/hr/service/entity.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { authService } from '@/domain/auth/service/auth.service';
import type { HrEntityResponse } from '@amb/types';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

export default function EntitySelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCurrentEntity = useEntityStore((s) => s.setCurrentEntity);
  const setEntities = useEntityStore((s) => s.setEntities);

  const isAdmin = useAuthStore((s) => s.isAdmin);

  const { data: apiEntities, isLoading } = useQuery({
    queryKey: ['hr-entities', 'list'],
    queryFn: () => entityApiService.getEntities(),
    enabled: isAuthenticated,
  });

  const defaultPath = isAdmin() ? '/admin' : '/today';
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || defaultPath;

  // 법인이 1개면 자동 선택
  useEffect(() => {
    if (!apiEntities) return;
    if (apiEntities.length === 1) {
      setEntities(apiEntities);
      setCurrentEntity(apiEntities[0]);
      navigate(fromPath, { replace: true });
    }
  }, [apiEntities, setEntities, setCurrentEntity, navigate, fromPath]);

  const handleSelect = (entity: HrEntityResponse) => {
    if (apiEntities) setEntities(apiEntities);
    setCurrentEntity(entity);
    navigate(fromPath, { replace: true });
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    useAuthStore.getState().logout();
    navigate('/user/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!apiEntities || apiEntities.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('selectEntity.noEntity')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('selectEntity.noEntityDesc')}</p>
          <button
            onClick={handleLogout}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            {t('selectEntity.logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-primary-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('selectEntity.title')}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {user?.email} · {t('selectEntity.subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {apiEntities.map((entity) => (
            <button
              key={entity.entityId}
              onClick={() => handleSelect(entity)}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
            >
              <span className="text-2xl">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900">{entity.name}</div>
                <div className="text-sm text-gray-500">
                  {entity.code} · {entity.country} · {entity.currency}
                </div>
              </div>
              <span className="text-gray-300">&rarr;</span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            {t('selectEntity.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
