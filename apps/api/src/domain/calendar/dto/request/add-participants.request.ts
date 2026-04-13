import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddParticipantsRequest {
  @ApiProperty({ type: [String], description: 'User IDs to invite' })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  participant_ids: string[];
}
