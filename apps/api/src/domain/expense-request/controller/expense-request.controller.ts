import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, UseInterceptors,
  UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ExpenseRequestService } from '../service/expense-request.service';
import { ExpenseApprovalService } from '../service/expense-approval.service';
import { ExpenseAttachmentService } from '../service/expense-attachment.service';
import { CreateExpenseRequestDto } from '../dto/create-expense-request.dto';
import { UpdateExpenseRequestDto } from '../dto/update-expense-request.dto';
import {
  QueryExpenseRequestDto,
  ApproveExpenseRequestDto,
  RejectExpenseRequestDto,
} from '../dto/query-expense-request.dto';

@ApiTags('Expense Requests')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('expense-requests')
export class ExpenseRequestController {
  constructor(
    private readonly service: ExpenseRequestService,
    private readonly approvalService: ExpenseApprovalService,
    private readonly attachmentService: ExpenseAttachmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: '지출결의서 목록 조회' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: QueryExpenseRequestDto,
  ) {
    return this.service.findAll(user.entityId!, user, query);
  }

  @Get('stats')
  @ApiOperation({ summary: '지출결의서 통계' })
  getStats(@CurrentUser() user: UserPayload) {
    return this.service.getStats(user.entityId!);
  }

  @Get(':id')
  @ApiOperation({ summary: '지출결의서 상세 조회' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOneForApi(id, user.entityId!);
  }

  @Post()
  @ApiOperation({ summary: '지출결의서 작성' })
  create(@Body() dto: CreateExpenseRequestDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user, user.entityId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: '지출결의서 수정 (DRAFT/REJECTED 상태)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user, user.entityId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '지출결의서 삭제 (DRAFT 상태)' })
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.remove(id, user, user.entityId!);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '지출결의서 제출 (DRAFT→PENDING)' })
  submit(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.approvalService.submit(id, user, user.entityId!);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '지출결의서 승인' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveExpenseRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.approvalService.approve(id, dto, user, user.entityId!);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '지출결의서 반려' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectExpenseRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.approvalService.reject(id, dto, user, user.entityId!);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '지출결의서 취소' })
  cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.cancel(id, user, user.entityId!);
  }

  // 첨부파일
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '파일 첨부' })
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
  ) {
    return this.attachmentService.uploadFile(id, file, user, user.entityId!);
  }

  @Post(':id/attachments/link')
  @ApiOperation({ summary: '링크 첨부' })
  addLinkAttachment(
    @Param('id') id: string,
    @Body() body: { url: string; title?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.attachmentService.addLink(id, body.url, body.title, user, user.entityId!);
  }

  @Delete(':id/attachments/:aid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '첨부파일 삭제' })
  removeAttachment(
    @Param('id') id: string,
    @Param('aid') aid: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.attachmentService.remove(aid, user, user.entityId!);
  }
}
