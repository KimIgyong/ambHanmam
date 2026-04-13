import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { MenuConfigService } from '../service/menu-config.service';
import { UpdateMenuConfigRequest, PatchMenuConfigRequest } from '../dto/request/update-menu-config.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/menu-config')
@UseGuards(AdminGuard)
export class MenuConfigController {
  constructor(private readonly menuConfigService: MenuConfigService) {}

  @Get()
  findAll() {
    return this.menuConfigService.findAll();
  }

  @Put()
  bulkUpdate(
    @Body() dto: UpdateMenuConfigRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.menuConfigService.bulkUpdate(dto, user.userId);
  }

  @Patch(':menuCode')
  async patchOne(
    @Param('menuCode') menuCode: string,
    @Body() dto: PatchMenuConfigRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.menuConfigService.patchOne(menuCode, dto, user.userId);
    if (!result) {
      throw new NotFoundException(`Menu config not found: ${menuCode}`);
    }
    return result;
  }
}
