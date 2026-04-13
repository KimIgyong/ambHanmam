import { IsOptional, IsString, IsIn, MinLength, IsUUID } from 'class-validator';

export class UpdatePartnerUserDto {
  @IsOptional()
  @IsIn(['PARTNER_ADMIN', 'PARTNER_MEMBER'])
  role?: 'PARTNER_ADMIN' | 'PARTNER_MEMBER';

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsUUID()
  partner_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
