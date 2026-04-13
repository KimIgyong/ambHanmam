import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class GoogleOnboardingRequest {
  @IsString()
  token: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  company_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  country: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number and special character (!@#$%^&*)',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsBoolean()
  terms_agreed: boolean;

  @IsBoolean()
  privacy_agreed: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_agreed?: boolean;
}
