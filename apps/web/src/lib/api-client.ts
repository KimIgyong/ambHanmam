import axios from 'axios';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { reportApiError } from '@/global/util/error-reporter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mobile WebView: mobile_token 쿼리 파라미터에서 JWT 토큰을 추출하여 Authorization 헤더로 전송
const mobileToken = new URLSearchParams(window.location.search).get('mobile_token');

apiClient.interceptors.request.use((config) => {
  const lang = localStorage.getItem('amb-lang') || 'en';
  config.headers['Accept-Language'] = lang;

  // Mobile WebView: Bearer 토큰 인증
  if (mobileToken) {
    config.headers['Authorization'] = `Bearer ${mobileToken}`;
  }

  // 사용자 타임존을 헤더로 전송 (서버사이드 날짜 처리에 활용)
  const { timezone } = useTimezoneStore.getState();
  config.headers['X-Timezone'] = timezone;

  // Inject entity context for HR API calls
  const currentEntity = useEntityStore.getState().currentEntity;
  if (currentEntity) {
    config.headers['X-Entity-Id'] = currentEntity.entityId;
  }

  return config;
});

// 동시 다중 401 발생 시 refresh를 한 번만 실행하기 위한 직렬화 처리
let refreshPromise: Promise<void> | null = null;

// 401 토큰 갱신 대상에서 제외할 인증 엔드포인트
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.endsWith(ep));

    if (error.response?.status === 401 && !error.config._retry && !isAuthEndpoint) {
      error.config._retry = true;
      try {
        // 이미 진행 중인 refresh가 있으면 그것을 재사용 (토큰 rotation race condition 방지)
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .then(() => { refreshPromise = null; })
            .catch((err) => { refreshPromise = null; throw err; });
        }
        await refreshPromise;
        return apiClient(error.config);
      } catch {
        useAuthStore.getState().logout();
        const loginPath = window.location.pathname.startsWith('/client') ? '/client/login' : '/user/login';
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  },
);

// 에러 보고 인터셉터 (기존 인터셉터 이후 추가)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    // 401 토큰 갱신 성공 케이스는 제외, 에러 보고 API 자체도 제외
    if (status && config?.url && !config.url.includes('/site-errors')) {
      const errData = error.response?.data?.error;
      reportApiError({
        url: config.url,
        method: config.method,
        status,
        errorCode: errData?.code,
        message: errData?.message || error.message || 'Unknown API error',
      });
    } else if (!error.response && error.code === 'ERR_NETWORK') {
      reportApiError({
        url: config?.url,
        method: config?.method,
        message: 'Network error: server unreachable',
      });
    }
    return Promise.reject(error);
  },
);

/**
 * API 표준 응답 { success, data, ... }에서 data를 안전하게 추출.
 * data가 null/undefined면 fallback(기본 빈 배열)을 반환하여 런타임 map/null 에러 방지.
 */
export function extractData<T>(res: { data?: { data?: T } }, fallback: T): T {
  return res?.data?.data ?? fallback;
}

/**
 * 목록 API용: data.data.data (페이지네이션 래핑) 안전 추출.
 */
export function extractList<T>(res: { data?: { data?: { data?: T[] } } }): T[] {
  return res?.data?.data?.data ?? [];
}
