import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class InitialSetupRequest {
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number and special character (!@#$%^&*)',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  company_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country_code?: string;
}
