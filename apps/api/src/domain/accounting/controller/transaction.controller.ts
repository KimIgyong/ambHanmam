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
import { CreateTransactionRequest } from '../dto/request/create-transaction.request';
import { UpdateTransactionRequest } from '../dto/request/update-transaction.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('accounts/:accountId/transactions')
export class TransactionController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly excelImportService: ExcelImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: '거래 목록 조회' })
  async getTransactions(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('vendor') vendor?: string,
    @Query('description') description?: string,
    @Query('flow_type') flowType?: string,
    @Query('sort_order') sortOrder?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const sizeNum = size ? parseInt(size, 10) : 100;

    const { data, totalCount } = await this.accountingService.getTransactions(accountId, req.entityId, {
      date_from: dateFrom,
      date_to: dateTo,
      vendor,
      description,
      flow_type: flowType === 'DEPOSIT' || flowType === 'WITHDRAWAL' ? flowType : undefined,
      sort_order: sortOrder === 'ASC' ? 'ASC' : 'DESC',
      page: pageNum,
      size: sizeNum,
    });

    const totalPages = Math.ceil(totalCount / sizeNum);
    return {
      success: true,
      data,
      pagination: {
        page: pageNum,
        size: sizeNum,
        totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: '거래 생성' })
  async createTransaction(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Body() request: CreateTransactionRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.accountingService.createTransaction(accountId, req.entityId, request, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '거래 수정' })
  async updateTransaction(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() request: UpdateTransactionRequest,
  ) {
    const data = await this.accountingService.updateTransaction(accountId, id, request, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '거래 삭제' })
  async deleteTransaction(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    await this.accountingService.deleteTransaction(accountId, id, req.entityId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '특정 계좌에 거래 엑셀 임포트' })
  async importTransactions(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.excelImportService.importTransactionsForAccount(
      file.buffer,
      accountId,
      user.userId,
      req.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
