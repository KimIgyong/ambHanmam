export const API_VERSION = 'v1';
export const API_PREFIX = `api/${API_VERSION}`;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export const TOKEN_EXPIRATION = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

export const BCRYPT_SALT_ROUNDS = 12;
