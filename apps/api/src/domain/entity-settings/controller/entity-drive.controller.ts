import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { DriveSettingsService } from '../../settings/service/drive-settings.service';
import { UpdateDriveSettingsRequest } from '../../settings/dto/request/update-drive-settings.request';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings/drive')
export class EntityDriveController {
  constructor(private readonly driveSettingsService: DriveSettingsService) {}

  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityDriveSettings(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.driveSettingsService.getEntityOwnSettings(entityId);
    return { success: true, data };
  }

  @Put()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateEntityDriveSettings(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: UpdateDriveSettingsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.driveSettingsService.updateSettings(dto, user.userId, entityId);
    return { success: true, data };
  }

  @Post('test')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async testConnection(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.driveSettingsService.testConnectionForEntity(entityId);
    return { success: true, data };
  }

  @Delete()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteEntityDriveSettings(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.driveSettingsService.deleteEntitySettings(entityId);
    return { success: true, data };
  }
}
