/**
 * OAuth 2.0 Scope 정의
 */
export const OAuthScopes = {
  // 자산
  ASSETS_READ: 'assets:read',
  ASSETS_WRITE: 'assets:write',

  // 이슈
  ISSUES_READ: 'issues:read',
  ISSUES_WRITE: 'issues:write',

  // 프로젝트
  PROJECTS_READ: 'projects:read',

  // 사용자/조직
  USERS_READ: 'users:read',
  UNITS_READ: 'units:read',

  // 법인
  ENTITY_READ: 'entity:read',

  // 프로필
  PROFILE: 'profile',

  // Refresh Token
  OFFLINE_ACCESS: 'offline_access',
} as const;

export type OAuthScope = (typeof OAuthScopes)[keyof typeof OAuthScopes];

/** 모든 유효한 scope 목록 */
export const ALL_OAUTH_SCOPES: string[] = Object.values(OAuthScopes);

/** scope 문자열 유효성 검증 */
export function isValidScope(scope: string): boolean {
  return ALL_OAUTH_SCOPES.includes(scope);
}

/** scope 배열 유효성 검증 (모두 유효해야 true) */
export function areValidScopes(scopes: string[]): boolean {
  return scopes.every(isValidScope);
}
