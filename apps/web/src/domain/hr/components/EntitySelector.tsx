import { Building2, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useEntityStore } from '../store/entity.store';
import { useEntities } from '../hooks/useEntity';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { HrEntityResponse } from '@amb/types';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

export default function EntitySelector() {
  const { data: entities = [] } = useEntities();
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const setCurrentEntity = useEntityStore((s) => s.setCurrentEntity);
  const isUserLevel = useAuthStore((s) => s.user?.level === 'USER_LEVEL');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // USER_LEVEL: 법인 선택기 노출하지 않음 (법인 전환 = 로그아웃 후 재로그인)
  if (isUserLevel) {
    return null;
  }

  // ADMIN_LEVEL: 기존 드롭다운 법인 전환
  if (entities.length <= 1) return null;

  const handleSelect = (entity: HrEntityResponse) => {
    setCurrentEntity(entity);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="max-w-[160px] truncate font-medium">
          {currentEntity ? `${FLAG[currentEntity.country] || ''} ${currentEntity.name}` : 'Select Entity'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {entities.map((entity) => (
            <button
              key={entity.entityId}
              onClick={() => handleSelect(entity)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                currentEntity?.entityId === entity.entityId
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{entity.name}</div>
                <div className="text-xs text-gray-400">{entity.code} · {entity.country} · {entity.currency}</div>
              </div>
              {currentEntity?.entityId === entity.entityId && (
                <span className="text-teal-500 text-xs font-medium">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
