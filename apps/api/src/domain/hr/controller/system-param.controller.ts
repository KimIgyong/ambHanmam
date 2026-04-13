import {
  Controller, Get, Post, Delete,
  Param, Body, Query, HttpCode, HttpStatus, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemParamService } from '../service/system-param.service';
import { UpdateSystemParamRequest } from '../dto/request/update-system-param.request';
import { CreateHolidayRequest } from '../dto/request/create-holiday.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Settings')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/settings')
export class SystemParamController {
  constructor(private readonly paramService: SystemParamService) {}

  @Get('params')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '시스템 파라미터 전체 목록' })
  async getAllParams(@Req() req: any) {
    const data = await this.paramService.getAllParams(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('params/current')
  @ApiOperation({ summary: '현재 유효 파라미터' })
  async getCurrentParams(@Req() req: any) {
    const data = await this.paramService.getCurrentParams(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('params')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '파라미터 추가/변경' })
  async upsertParam(@Req() req: any, @Body() request: UpdateSystemParamRequest) {
    const data = await this.paramService.upsertParam(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // --- Holidays ---

  @Get('holidays')
  @ApiOperation({ summary: '공휴일 목록' })
  async getHolidays(@Req() req: any, @Query('year') year: string) {
    const data = await this.paramService.getHolidays(req.entityId, parseInt(year, 10) || new Date().getFullYear());
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('holidays')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '공휴일 등록' })
  async createHoliday(@Req() req: any, @Body() request: CreateHolidayRequest) {
    const data = await this.paramService.createHoliday(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('holidays/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '공휴일 삭제' })
  async deleteHoliday(@Req() req: any, @Param('id') id: string) {
    await this.paramService.deleteHoliday(req.entityId, id);
  }
}
