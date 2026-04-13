import { BadRequestException } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { UserPayload } from '../../../global/decorator/current-user.decorator';

/**
 * entity_id를 쿼리 파라미터 → JWT payload 순으로 resolve.
 * - ADMIN_LEVEL: query param 우선, 없으면 JWT entityId
 * - USER_LEVEL: JWT entityId 사용 (query param이 있으면 유효성만 검증)
 */
export function resolveEntityId(
  queryEntityId: string | undefined,
  user: UserPayload,
): string {
  const entityId = queryEntityId || user.entityId;

  if (!entityId) {
    throw new BadRequestException('entity_id is required');
  }

  if (!uuidValidate(entityId)) {
    throw new BadRequestException('entity_id must be a valid UUID');
  }

  return entityId;
}
