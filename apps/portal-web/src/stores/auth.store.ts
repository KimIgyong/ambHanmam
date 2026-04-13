import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface Customer {
  customerId: string;
  email: string;
  name: string;
  companyName?: string;
  emailVerified: boolean;
  clientId?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ customerId: string; email: string; entityCode?: string; entityName?: string; autoLoginToken?: string | null }>;  
  logout: () => void;
  refreshAuth: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  verify_token: string;
  terms_agreed: boolean;
  privacy_agreed: boolean;
  marketing_agreed?: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      customer: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/portal/auth/login', { email, password });
        const result = data.data || data;
        set({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          customer: result.customer,
          isAuthenticated: true,
        });
        api.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
      },

      register: async (registerData) => {
        const { data } = await api.post('/portal/auth/register', registerData);
        const result = data.data || data;
        return result;
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          customer: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const { data } = await api.post('/portal/auth/refresh', { refresh_token: refreshToken });
          const result = data.data || data;
          set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
        } catch {
          get().logout();
        }
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/portal/auth/me');
          const result = data.data || data;
          set({ customer: result });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'portal-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Set auth header on app load if token exists
const token = useAuthStore.getState().accessToken;
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor for 401 - auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await useAuthStore.getState().refreshAuth();
        const newToken = useAuthStore.getState().accessToken;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
