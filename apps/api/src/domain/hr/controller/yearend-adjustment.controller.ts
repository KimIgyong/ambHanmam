import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  Req, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { YearendAdjustmentService } from '../service/yearend-adjustment.service';
import { CreateYearendAdjustmentRequest } from '../dto/request/create-yearend-adjustment.request';
import { UpdateYearendAdjustmentRequest } from '../dto/request/update-yearend-adjustment.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Year-End Adjustment')
@ApiBearerAuth()
@Controller('hr/yearend')
@UseGuards(EntityGuard)
export class YearendAdjustmentController {
  constructor(private readonly service: YearendAdjustmentService) {}

  @Get()
  @ApiOperation({ summary: '연말정산 목록 조회' })
  async getList(
    @Req() req: Request,
    @Query('tax_year') taxYear: string,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const year = Number(taxYear) || new Date().getFullYear() - 1;
    const data = await this.service.getList(entityId, year);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '연말정산 상세 조회' })
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연말정산 등록' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateYearendAdjustmentRequest,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const data = await this.service.create(entityId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연말정산 수정' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateYearendAdjustmentRequest,
  ) {
    const data = await this.service.update(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연말정산 삭제' })
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  @Post(':id/apply/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연말정산 개별 급여 반영' })
  async applyToPayroll(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('periodId') periodId: string,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const data = await this.service.applyToPayroll(entityId, id, periodId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('apply-batch')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연말정산 일괄 급여 반영' })
  async applyBatch(
    @Req() req: Request,
    @Body() body: { tax_year: number; period_id: string },
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const data = await this.service.applyBatchToPayroll(entityId, body.tax_year, body.period_id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('import')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '연말정산 Excel Import' })
  async importExcel(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const results = await this.service.importExcel(entityId, file.buffer);
    res.json({ success: true, data: results, timestamp: new Date().toISOString() });
  }
}
