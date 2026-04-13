import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringExpenseService } from '../service/recurring-expense.service';
import { CreateRecurringExpenseRequest } from '../dto/request/create-recurring-expense.request';
import { UpdateRecurringExpenseRequest } from '../dto/request/update-recurring-expense.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Recurring Expenses')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('accounts/recurring-expenses')
export class RecurringExpenseController {
  constructor(private readonly service: RecurringExpenseService) {}

  @Get()
  @ApiOperation({ summary: '정기 지출 목록' })
  async getAll(@Req() req: any) {
    const data = await this.service.getRecurringExpenses(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('forecast')
  @ApiOperation({ summary: '정기 지출 예상 문서' })
  async getForecast(@Req() req: any, @Query('month') month: string) {
    const data = await this.service.getForecast(req.entityId, month);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '정기 지출 등록' })
  async create(
    @Body() dto: CreateRecurringExpenseRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.service.createRecurringExpense(dto, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '정기 지출 수정' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringExpenseRequest,
    @Req() req: any,
  ) {
    const data = await this.service.updateRecurringExpense(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '정기 지출 삭제' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.deleteRecurringExpense(id, req.entityId);
  }
}
