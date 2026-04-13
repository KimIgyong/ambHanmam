import type { HrEntityResponse } from '@amb/types';

/**
 * App Store iframe URL에 Entity + User 정보를 쿼리 파라미터로 추가한다.
 * 타겟 사이트(apps.amoeba.site)에서 referrer + 쿼리 파라미터로 사용자/법인 식별.
 *
 * Phase A: 쿼리 파라미터 (ent_id, ent_code, ent_name, email)
 * Phase B (TODO): 백엔드 리다이렉트 토큰 API로 JWT 전달 방식 전환
 */
export function buildStoreUrl(
  baseUrl: string,
  entity: HrEntityResponse | null,
  user: { email?: string; name?: string } | null,
): string {
  const url = new URL(baseUrl);

  if (entity) {
    url.searchParams.set('ent_id', entity.entityId);
    url.searchParams.set('ent_code', entity.code);
    url.searchParams.set('ent_name', entity.name);
  }

  if (user?.email) {
    url.searchParams.set('email', user.email);
  }

  return url.toString();
}
