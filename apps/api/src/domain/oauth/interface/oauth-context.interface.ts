/**
 * OAuth Token Guard가 request에 주입하는 컨텍스트
 */
export interface OAuthTokenContext {
  /** 사용자 ID (usr_id) */
  userId: string;

  /** 법인 ID (ent_id) — 데이터 격리 키 */
  entityId: string;

  /** Partner App client_id */
  clientId: string;

  /** Partner App ID (pap_id) */
  appId: string;

  /** 승인된 scope 목록 */
  scopes: string[];
}
