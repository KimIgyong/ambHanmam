import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateAgentConfigRequest {
  @IsString()
  system_prompt: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  visible_cell_ids?: string[] | null;
}
