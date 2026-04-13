import { IsString, IsOptional } from 'class-validator';

export class CreateGlossaryRequest {
  @IsString()
  term_en: string;

  @IsOptional()
  @IsString()
  term_ko?: string;

  @IsOptional()
  @IsString()
  term_vi?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class UpdateGlossaryRequest {
  @IsOptional()
  @IsString()
  term_en?: string;

  @IsOptional()
  @IsString()
  term_ko?: string;

  @IsOptional()
  @IsString()
  term_vi?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
