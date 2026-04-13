import { IsOptional, IsString, IsIn, MinLength } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsIn(['ADMIN', 'SUPER_ADMIN'])
  role?: 'ADMIN' | 'SUPER_ADMIN';

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
