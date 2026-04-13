import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useClientAuthStore } from '@/domain/client-portal/store/client-auth.store';

/** Talk 컴포넌트에서 현재 사용자 정보를 가져오는 hook (일반/클라이언트 모두 지원) */
export function useTalkUserId(): string | undefined {
  const authUserId = useAuthStore((s) => s.user?.userId);
  const clientUserId = useClientAuthStore((s) => s.user?.userId);
  return authUserId || clientUserId;
}

export function useTalkUserName(): string | undefined {
  const authName = useAuthStore((s) => s.user?.name);
  const clientName = useClientAuthStore((s) => s.user?.name);
  return authName || clientName;
}
