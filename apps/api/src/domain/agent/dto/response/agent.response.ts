import { UnitCode } from '@amb/types';

export class AgentInfoResponse {
  unitCode: UnitCode;
  unitName: string;
  description: string;
  specialties: string[];
}
