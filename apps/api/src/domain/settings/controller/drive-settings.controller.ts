import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DriveSettingsService } from '../service/drive-settings.service';
import { UpdateDriveSettingsRequest } from '../dto/request/update-drive-settings.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/drive')
@UseGuards(AdminGuard)
export class DriveSettingsController {
  constructor(private readonly driveSettingsService: DriveSettingsService) {}

  @Get()
  async getSettings() {
    const data = await this.driveSettingsService.getSettings();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put()
  async updateSettings(
    @Body() dto: UpdateDriveSettingsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.driveSettingsService.updateSettings(dto, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('test')
  async testConnection() {
    const data = await this.driveSettingsService.testConnection();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('shared-drives')
  async listSharedDrives() {
    try {
      const data = await this.driveSettingsService.listSharedDrives();
      return { success: true, data, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('folders')
  async listFolders(@Query('parentId') parentId: string) {
    try {
      const data = await this.driveSettingsService.listFolders(parentId);
      return { success: true, data, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
