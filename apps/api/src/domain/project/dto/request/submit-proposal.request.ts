import { IsOptional, IsString } from 'class-validator';

export class SubmitProposalRequest {
  @IsOptional()
  @IsString()
  comment?: string;
}
