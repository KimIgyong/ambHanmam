import { InvitationEntity } from '../entity/invitation.entity';

export class InvitationMapper {
  static toResponse(
    entity: InvitationEntity,
    inviterName: string,
    cellName: string | null = null,
    acceptedUserId: string | null = null,
  ) {
    return {
      invitationId: entity.invId,
      email: entity.invEmail,
      role: entity.invRole,
      unit: entity.invUnit,
      cellId: entity.invCellId,
      cellName,
      levelCode: entity.invLevelCode || null,
      companyId: entity.invCompanyId || null,
      autoApprove: entity.invAutoApprove ?? false,
      status: entity.invStatus,
      invitedBy: entity.invInvitedBy,
      inviterName,
      expiresAt: entity.invExpiresAt.toISOString(),
      acceptedAt: entity.invAcceptedAt?.toISOString() || null,
      acceptedUserId,
      lastSentAt: entity.invLastSentAt?.toISOString() || null,
      sendCount: entity.invSendCount ?? 0,
      createdAt: entity.invCreatedAt.toISOString(),
    };
  }
}
