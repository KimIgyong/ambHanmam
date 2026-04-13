import { HrFreelancerResponse } from '@amb/types';
import { FreelancerEntity } from '../entity/freelancer.entity';

export class FreelancerMapper {
  static toResponse(entity: FreelancerEntity): HrFreelancerResponse {
    return {
      freelancerId: entity.frlId,
      entityId: entity.entId,
      code: entity.frlCode,
      fullName: entity.frlFullName,
      nationality: entity.frlNationality || null,
      contractStart: entity.frlContractStart || null,
      contractEnd: entity.frlContractEnd || null,
      contractAmount: Number(entity.frlContractAmount),
      monthlyAmount: Number(entity.frlMonthlyAmount),
      paymentType: entity.frlPaymentType,
      taxRate: Number(entity.frlTaxRate),
      status: entity.frlStatus,
    };
  }
}
