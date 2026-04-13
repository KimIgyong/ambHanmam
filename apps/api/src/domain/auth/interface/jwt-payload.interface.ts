/**
 * JWT 토큰에 포함되는 payload 구조
 * 사용자 레벨/역할/상태/조직 정보를 포함
 */
export interface JwtPayload {
  /** 사용자 ID (usr_id) */
  sub: string;
  /** 이메일 */
  email: string;
  /** 레벨: ADMIN_LEVEL | USER_LEVEL */
  level: string;
  /** 역할: SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER */
  role: string;
  /** 상태: PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN */
  status: string;
  /** 소속 조직 ID */
  companyId: string | null;
  /** 소속 조직이 HQ인지 여부 */
  isHq: boolean;
  /** 비밀번호 변경 필요 여부 */
  mustChangePw: boolean;
  /** USER_LEVEL 사용자의 소속 엔티티(법인) ID */
  entityId?: string;
  /** CLIENT_LEVEL 사용자의 소속 고객사 ID */
  cliId?: string;
  /** PARTNER_LEVEL 사용자의 소속 파트너사 ID */
  partnerId?: string;
  /** 토큰 버전 (refresh token 무효화용) */
  tokenVersion?: number;
  /** 사용자 타임존 (IANA timezone) */
  timezone?: string;
  /** UI 언어: vi | ko | en */
  locale?: string;
}
