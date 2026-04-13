import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendancePolicyEntity } from '../entity/attendance-policy.entity';
import { AttendancePolicyResponse } from '@amb/types';

@Injectable()
export class AttendancePolicyService {
  constructor(
    @InjectRepository(AttendancePolicyEntity)
    private readonly policyRepository: Repository<AttendancePolicyEntity>,
  ) {}

  async getPolicy(entityId: string): Promise<AttendancePolicyResponse> {
    let policy = await this.policyRepository.findOne({
      where: { entId: entityId },
    });

    if (!policy) {
      // Return defaults without saving
      return {
        policyId: '',
        entityId,
        remoteDefaultCount: 1,
        remoteExtraCount: 0,
        remoteBlockOnExceed: true,
        leaveAutoDeduct: false,
        halfLeaveAutoDeduct: false,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.toResponse(policy);
  }

  async upsertPolicy(
    entityId: string,
    data: {
      remote_default_count?: number;
      remote_extra_count?: number;
      remote_block_on_exceed?: boolean;
      leave_auto_deduct?: boolean;
      half_leave_auto_deduct?: boolean;
    },
  ): Promise<AttendancePolicyResponse> {
    let policy = await this.policyRepository.findOne({
      where: { entId: entityId },
    });

    if (!policy) {
      policy = this.policyRepository.create({ entId: entityId });
    }

    if (data.remote_default_count !== undefined) {
      policy.atpRemoteDefaultCount = data.remote_default_count;
    }
    if (data.remote_extra_count !== undefined) {
      policy.atpRemoteExtraCount = data.remote_extra_count;
    }
    if (data.remote_block_on_exceed !== undefined) {
      policy.atpRemoteBlockOnExceed = data.remote_block_on_exceed;
    }
    if (data.leave_auto_deduct !== undefined) {
      policy.atpLeaveAutoDeduct = data.leave_auto_deduct;
    }
    if (data.half_leave_auto_deduct !== undefined) {
      policy.atpHalfLeaveAutoDeduct = data.half_leave_auto_deduct;
    }

    const saved = await this.policyRepository.save(policy);
    return this.toResponse(saved);
  }

  /** Get raw policy entity for internal use (e.g. validation) */
  async getPolicyEntity(
    entityId: string,
  ): Promise<{ remoteDefaultCount: number; remoteExtraCount: number; remoteBlockOnExceed: boolean }> {
    const policy = await this.policyRepository.findOne({
      where: { entId: entityId },
    });

    return {
      remoteDefaultCount: policy?.atpRemoteDefaultCount ?? 1,
      remoteExtraCount: policy?.atpRemoteExtraCount ?? 0,
      remoteBlockOnExceed: policy?.atpRemoteBlockOnExceed ?? true,
    };
  }

  private toResponse(entity: AttendancePolicyEntity): AttendancePolicyResponse {
    return {
      policyId: entity.atpId,
      entityId: entity.entId,
      remoteDefaultCount: entity.atpRemoteDefaultCount,
      remoteExtraCount: entity.atpRemoteExtraCount,
      remoteBlockOnExceed: entity.atpRemoteBlockOnExceed,
      leaveAutoDeduct: entity.atpLeaveAutoDeduct,
      halfLeaveAutoDeduct: entity.atpHalfLeaveAutoDeduct,
      updatedAt: entity.atpUpdatedAt.toISOString(),
    };
  }
}
