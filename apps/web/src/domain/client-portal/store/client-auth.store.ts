import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientUser {
  userId: string;
  email: string;
  name: string;
  level: string;
  role: string;
  cliId: string;
  clientName?: string;
  jobTitle?: string;
  phone?: string;
  status: string;
  entityId?: string;
  entityCode?: string;
  entityName?: string;
}

interface ClientAuthState {
  user: ClientUser | null;
  isAuthenticated: boolean;
  setUser: (user: ClientUser) => void;
  login: (user: ClientUser) => void;
  logout: () => void;
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'amb_client_auth',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0 && state.user) {
          const u = state.user as Record<string, unknown>;
          // v0→v1: id→userId, clientId→cliId migration
          if (!u.userId && u.id) {
            u.userId = u.id;
            delete u.id;
          }
          if (!u.cliId && u.clientId) {
            u.cliId = u.clientId;
            delete u.clientId;
          }
        }
        return state as unknown as ClientAuthState;
      },
    },
  ),
);
