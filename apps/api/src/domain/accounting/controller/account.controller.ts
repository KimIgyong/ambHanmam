import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AccountingService } from '../service/accounting.service';
import { ExcelImportService } from '../service/excel-import.service';
import { CreateAccountRequest } from '../dto/request/create-account.request';
import { UpdateAccountRequest } from '../dto/request/update-account.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly excelImportService: ExcelImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: '계좌 목록 조회' })
  async getAccounts(@Req() req: any) {
    const data = await this.accountingService.getAccounts(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('summary')
  @ApiOperation({ summary: '잔고 요약 (대시보드용)' })
  async getAccountSummary(@Req() req: any) {
    const data = await this.accountingService.getAccountSummary(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('stats/consolidated')
  @ApiOperation({ summary: '통합 월별 입출금 통계' })
  async getConsolidatedStats(
    @Req() req: any,
    @Query('account_ids') accountIdsStr: string,
    @Query('start_month') startMonth?: string,
    @Query('end_month') endMonth?: string,
  ) {
    const accountIds = accountIdsStr ? accountIdsStr.split(',') : [];
    const data = await this.accountingService.getConsolidatedMonthlyStats(
      accountIds, req.entityId, startMonth, endMonth,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/stats/monthly')
  @ApiOperation({ summary: '계좌별 월별 입출금 통계' })
  async getMonthlyStats(
    @Req() req: any,
    @Param('id') id: string,
    @Query('start_month') startMonth?: string,
    @Query('end_month') endMonth?: string,
  ) {
    const data = await this.accountingService.getMonthlyStats(id, req.entityId, startMonth, endMonth);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/stats/top-vendors')
  @ApiOperation({ summary: '주요 거래처 (출금 기준)' })
  async getTopVendors(
    @Req() req: any,
    @Param('id') id: string,
    @Query('start_month') startMonth?: string,
    @Query('end_month') endMonth?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.accountingService.getTopVendors(
      id, req.entityId, startMonth, endMonth, limit ? parseInt(limit, 10) : 5,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '계좌 상세 조회' })
  async getAccountById(@Req() req: any, @Param('id') id: string) {
    const data = await this.accountingService.getAccountById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '계좌 생성' })
  async createAccount(
    @Body() request: CreateAccountRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.accountingService.createAccount(request, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '계좌 수정' })
  async updateAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: UpdateAccountRequest,
  ) {
    const data = await this.accountingService.updateAccount(id, request, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '계좌 삭제' })
  async deleteAccount(@Req() req: any, @Param('id') id: string) {
    await this.accountingService.deleteAccount(id, req.entityId);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '엑셀 파일 전체 임포트' })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.excelImportService.importExcel(file.buffer, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
