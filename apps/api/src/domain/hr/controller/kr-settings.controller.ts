import {
  Controller, Get, Post, Delete,
  Query, Body, Req, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceParamsKrService } from '../service/insurance-params-kr.service';
import { TaxTableService } from '../service/tax-table.service';
import { UpdateInsuranceParamsKrRequest } from '../dto/request/update-insurance-params-kr.request';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - KR Settings')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/kr')
export class KrSettingsController {
  constructor(
    private readonly insuranceService: InsuranceParamsKrService,
    private readonly taxTableService: TaxTableService,
  ) {}

  // --- Insurance Params ---

  @Get('insurance-params')
  @ApiOperation({ summary: '4대보험 파라미터 목록' })
  async getInsuranceParams(@Req() req: any) {
    const data = await this.insuranceService.getParams(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('insurance-params')
  @ApiOperation({ summary: '4대보험 파라미터 추가/변경' })
  async createInsuranceParam(
    @Body() request: UpdateInsuranceParamsKrRequest,
    @Req() req: any,
  ) {
    const data = await this.insuranceService.createOrUpdate(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('insurance-params/:id')
  @ApiOperation({ summary: '4대보험 파라미터 삭제' })
  async deleteInsuranceParam(@Param('id') id: string, @Req() req: any) {
    await this.insuranceService.deleteParam(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // --- Tax Table ---

  @Get('tax-table')
  @ApiOperation({ summary: '간이세액표 요약 조회' })
  async getTaxTableSummary(@Req() req: any) {
    const data = await this.taxTableService.getTableSummary(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tax-table/:year')
  @ApiOperation({ summary: '간이세액표 연도별 조회' })
  async getTaxTableByYear(
    @Param('year') year: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const data = await this.taxTableService.getTableByYear(
      req.entityId,
      Number(year),
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('tax-table/import')
  @ApiOperation({ summary: '간이세액표 CSV 임포트' })
  async importTaxTable(
    @Body() body: { year: number; csv_content: string },
    @Req() req: any,
  ) {
    const count = await this.taxTableService.importCsv(req.entityId, body.year, body.csv_content);
    return { success: true, data: { importedCount: count }, timestamp: new Date().toISOString() };
  }

  @Delete('tax-table/:year')
  @ApiOperation({ summary: '간이세액표 연도별 삭제' })
  async deleteTaxTable(@Param('year') year: string, @Req() req: any) {
    const count = await this.taxTableService.deleteByYear(req.entityId, Number(year));
    return { success: true, data: { deletedCount: count }, timestamp: new Date().toISOString() };
  }
}
