import axios from 'axios';
import { reportApiError } from './error-reporter';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 보고 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.config;
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

export default api;
