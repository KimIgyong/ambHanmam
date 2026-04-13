import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
  UseGuards, UseInterceptors, UploadedFiles, Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { NoticeService } from '../service/notice.service';
import { CreateNoticeRequest } from '../dto/request/create-notice.request';
import { UpdateNoticeRequest } from '../dto/request/update-notice.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Notices')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  @ApiOperation({ summary: '공지사항 목록 조회' })
  async getNotices(@CurrentUser() user: UserPayload, @Req() req: any, @Query() query: any) {
    const result = await this.noticeService.getNotices(user.userId, req.entityId, query);
    return { success: true, data: result.data, pagination: result.pagination, timestamp: new Date().toISOString() };
  }

  @Get('recent')
  @ApiOperation({ summary: '최근 공지사항 조회 (대시보드용)' })
  async getRecentNotices(
    @CurrentUser() user: UserPayload,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const data = await this.noticeService.getRecentNotices(user.userId, limitNum, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('attachments/:attachmentId')
  @UseGuards(ManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '첨부파일 삭제' })
  async deleteAttachment(@Param('attachmentId') attachmentId: string) {
    await this.noticeService.deleteAttachment(attachmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '공지사항 상세 조회' })
  async getNoticeById(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.noticeService.getNoticeById(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(ManagerGuard)
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '공지사항 생성' })
  async createNotice(
    @Body() request: CreateNoticeRequest,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: Express.Multer.File[],
    @Req() req?: any,
  ) {
    const data = await this.noticeService.createNotice(request, user.userId, files, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '공지사항 수정' })
  async updateNotice(
    @Param('id') id: string,
    @Body() request: UpdateNoticeRequest,
  ) {
    const data = await this.noticeService.updateNotice(id, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @UseGuards(ManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '공지사항 삭제' })
  async deleteNotice(@Param('id') id: string) {
    await this.noticeService.deleteNotice(id);
  }
}
