import { IsString, IsOptional, IsIn } from 'class-validator';

export class AiDraftProposalRequest {
  @IsString()
  title: string;

  @IsString()
  brief_description: string;

  @IsOptional()
  @IsString()
  @IsIn(['TECH_BPO', 'SI_DEV', 'INTERNAL', 'R_AND_D', 'MARKETING', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
