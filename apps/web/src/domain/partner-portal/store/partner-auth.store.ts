import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PartnerUser {
  userId: string;
  email: string;
  name: string;
  level: string;
  role: string;
  partnerId: string;
  partnerName?: string;
  partnerCode?: string;
  jobTitle?: string;
  phone?: string;
  status: string;
}

interface PartnerAuthState {
  user: PartnerUser | null;
  isAuthenticated: boolean;
  setUser: (user: PartnerUser) => void;
  login: (user: PartnerUser) => void;
  logout: () => void;
}

export const usePartnerAuthStore = create<PartnerAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'amb_partner_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
