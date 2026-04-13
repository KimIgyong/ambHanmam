import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserResponse } from '@amb/types';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { queryClient } from '@/App';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;

  // 파생 상태 헬퍼
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isMaster: () => boolean;
  isMasterOrAdmin: () => boolean;
  isPending: () => boolean;
  needsPasswordChange: () => boolean;
  hasRole: (...roles: string[]) => boolean;

  // 액션
  setUser: (user: UserResponse) => void;
  login: (user: UserResponse) => void;
  logout: () => void;
  updateUser: (partial: Partial<UserResponse>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      isAdmin: () => get().user?.level === 'ADMIN_LEVEL',
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
      isMaster: () => get().user?.role === 'MASTER',
      isMasterOrAdmin: () => {
        const role = get().user?.role;
        return role ? ['MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(role) : false;
      },
      isPending: () => get().user?.status === 'PENDING',
      needsPasswordChange: () => get().user?.mustChangePw === true,
      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },

      setUser: (user) => set({ user }),

      login: (user) => {
        // 로그인 시 서버에서 받은 timezone을 전역 store에 동기화
        if (user.timezone) {
          useTimezoneStore.getState().setTimezone(user.timezone);
        }
        set({
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        useEntityStore.getState().clear();
        queryClient.clear();
        // amb_recent_entities는 유지 (재로그인 시 법인 자동 선택용)
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'amb_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
