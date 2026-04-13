import { IsString, MaxLength } from 'class-validator';

export class CreatePostCategoryRequest {
  @IsString()
  @MaxLength(100)
  name: string;
}
