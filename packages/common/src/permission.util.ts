import type { UserRole, UserLevelCode } from '@amb/types';
import { VALID_LEVEL_ROLES, MENU_PERMISSIONS, ROLE_DATA_SCOPE } from '@amb/types';
import type { DataScope } from '@amb/types';

/**
 * 레벨-역할 조합이 유효한지 검증
 */
export function isValidLevelRole(level: UserLevelCode, role: UserRole): boolean {
  return VALID_LEVEL_ROLES[level]?.includes(role) ?? false;
}

/**
 * 해당 역할이 접근 가능한 메뉴 목록 반환
 */
export function getAccessibleMenus(role: UserRole) {
  return MENU_PERMISSIONS.filter((menu) => menu.allowedRoles.includes(role));
}

/**
 * 해당 역할이 특정 메뉴에서 읽기 전용인지 확인
 */
export function isReadOnly(role: UserRole, menuKey: string): boolean {
  const menu = MENU_PERMISSIONS.find((m) => m.key === menuKey);
  if (!menu) return true;
  return menu.readOnlyRoles?.includes(role) ?? false;
}

/**
 * 해당 역할이 특정 메뉴에서 쓰기(CUD) 가능한지 확인
 */
export function canWrite(role: UserRole, menuKey: string): boolean {
  const menu = MENU_PERMISSIONS.find((m) => m.key === menuKey);
  if (!menu) return false;
  if (menu.writeRoles) return menu.writeRoles.includes(role);
  return !(menu.readOnlyRoles?.includes(role) ?? false);
}

/**
 * 해당 역할의 데이터 접근 범위 반환
 */
export function getDataScope(role: UserRole): DataScope {
  return ROLE_DATA_SCOPE[role] ?? 'OWN_ONLY';
}

/**
 * HQ(ROOT) 소속 사용자인지 판별
 */
export function isHqUser(levelCode: UserLevelCode): boolean {
  return levelCode === 'ADMIN_LEVEL';
}

/**
 * 특정 조직의 데이터에 접근 가능한지 검증
 */
export function canAccessOrgData(
  userLevelCode: UserLevelCode,
  userCompanyId: string,
  targetCompanyId: string,
): boolean {
  if (isHqUser(userLevelCode)) return true;
  return userCompanyId === targetCompanyId;
}
