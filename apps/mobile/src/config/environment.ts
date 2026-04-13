interface Environment {
  apiBaseUrl: string;
  webBaseUrl: string;
  portalUrl: string;
}

const environments: Record<string, Environment> = {
  development: {
    apiBaseUrl: 'http://localhost:3019/api/v1',
    webBaseUrl: 'http://localhost:5189',
    portalUrl: 'https://portal.amoeba.com',
  },
  staging: {
    apiBaseUrl: 'https://stg-ama.amoeba.site/api/v1',
    webBaseUrl: 'https://stg-ama.amoeba.site',
    portalUrl: 'https://stg-portal.amoeba.com',
  },
  production: {
    apiBaseUrl: 'https://mng.amoeba.com/api/v1',
    webBaseUrl: 'https://mng.amoeba.com',
    portalUrl: 'https://portal.amoeba.com',
  },
};

const mode = import.meta.env.MODE || 'development';

export const env: Environment = environments[mode] || environments.development;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || env.apiBaseUrl;
export const WEB_BASE_URL = env.webBaseUrl;
export const PORTAL_URL = env.portalUrl;
