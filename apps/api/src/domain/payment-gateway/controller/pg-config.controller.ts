import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { PgConfigService } from '../service/pg-config.service';
import { CreatePgConfigRequest } from '../dto/create-pg-config.request';
import { UpdatePgConfigRequest } from '../dto/update-pg-config.request';

@Controller('payment-gateway/configs')
@UseGuards(AdminGuard)
export class PgConfigController {
  constructor(private readonly pgConfigService: PgConfigService) {}

  @Get()
  async findAll(@Query('entity_id') entityId?: string) {
    const data = await this.pgConfigService.findAll(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.pgConfigService.findOne(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  async create(@Body() dto: CreatePgConfigRequest, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const data = await this.pgConfigService.create(dto, userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePgConfigRequest) {
    const data = await this.pgConfigService.update(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.pgConfigService.remove(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    const data = await this.pgConfigService.testConnection(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
