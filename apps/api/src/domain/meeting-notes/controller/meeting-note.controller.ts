import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingNoteService } from '../service/meeting-note.service';
import { NoteLinkService } from '../service/note-link.service';
import { CreateMeetingNoteRequest } from '../dto/request/create-meeting-note.request';
import { UpdateMeetingNoteRequest } from '../dto/request/update-meeting-note.request';
import { CreateMeetingNoteCommentRequest } from '../dto/request/create-meeting-note-comment.request';
import { CreateFolderRequest } from '../dto/request/create-folder.request';
import { UpdateFolderRequest } from '../dto/request/update-folder.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('회의록')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('meeting-notes')
export class MeetingNoteController {
  constructor(
    private readonly meetingNoteService: MeetingNoteService,
    private readonly noteLinkService: NoteLinkService,
  ) {}

  @Get()
  @ApiOperation({ summary: '노트 목록 조회' })
  async getMeetingNotes(
    @CurrentUser() user: UserPayload,
    @Query('visibility') visibility?: string,
    @Query('type') type?: string,
    @Query('scope') scope?: string,
    @Query('search') search?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('folder_id') folderId?: string,
    @Query('exclude_daily') excludeDaily?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Req() req?: any,
  ) {
    const result = await this.meetingNoteService.getMeetingNotes(
      user.userId,
      { visibility, type, scope, search, date_from: dateFrom, date_to: dateTo, folder_id: folderId, exclude_daily: excludeDaily === 'true' },
      req?.entityId,
      Number(page) || 1,
      Number(size) || 20,
    );
    return { success: true, data: result.data, totalCount: result.totalCount, timestamp: new Date().toISOString() };
  }

  // ─── Full-text Search ─────────────────────────────────────────
  @Get('search')
  @ApiOperation({ summary: '노트 전문 검색 (FTS)' })
  async fullTextSearch(
    @Query('q') query: string,
    @Query('scope') scope: string | undefined,
    @Query('page') page: string | undefined,
    @Query('size') size: string | undefined,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    if (!query || !query.trim()) {
      return { success: true, data: [], totalCount: 0, timestamp: new Date().toISOString() };
    }
    const result = await this.meetingNoteService.fullTextSearch(
      query, user.userId, req?.entityId,
      scope, Number(page) || 1, Number(size) || 20,
    );
    return { success: true, data: result.data, totalCount: result.totalCount, timestamp: new Date().toISOString() };
  }

  // ─── Wiki Links ──────────────────────────────────────────────
  @Get('link-autocomplete')
  @ApiOperation({ summary: 'WikiLink 자동완성 검색' })
  async linkAutocomplete(
    @Query('q') query: string,
    @Query('type') type: string | undefined,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.noteLinkService.searchForAutocomplete(
      query || '', req?.entityId, user.userId, type,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('graph')
  @ApiOperation({ summary: '노트 관계 그래프 데이터' })
  async getGraph(
    @Query('scope') scope: string | undefined,
    @Query('center_id') centerId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.noteLinkService.getGraphData(
      req?.entityId, user.userId,
      scope === 'ENTITY' ? 'ENTITY' : 'MY',
      centerId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Folders ─────────────────────────────────────────────────
  @Get('folders')
  @ApiOperation({ summary: '폴더 목록 조회' })
  async getFolders(
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.meetingNoteService.getFolders(user.userId, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('folders')
  @ApiOperation({ summary: '폴더 생성' })
  async createFolder(
    @Body() body: CreateFolderRequest,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.meetingNoteService.createFolder(body, user.userId, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('folders/:folderId')
  @ApiOperation({ summary: '폴더 수정' })
  async updateFolder(
    @Param('folderId') folderId: string,
    @Body() body: UpdateFolderRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.meetingNoteService.updateFolder(folderId, body, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('folders/:folderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '폴더 삭제' })
  async deleteFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.meetingNoteService.deleteFolder(folderId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '회의록 상세 조회' })
  async getMeetingNoteById(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.meetingNoteService.getMeetingNoteById(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '회의록 생성' })
  async createMeetingNote(
    @Body() request: CreateMeetingNoteRequest,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.meetingNoteService.createMeetingNote(request, user.userId, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '회의록 수정' })
  async updateMeetingNote(
    @Param('id') id: string,
    @Body() request: UpdateMeetingNoteRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.meetingNoteService.updateMeetingNote(id, request, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회의록 삭제' })
  async deleteMeetingNote(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.meetingNoteService.deleteMeetingNote(id, user.userId);
  }

  // ─── Comments ────────────────────────────────────────────────
  @Get(':id/comments')
  @ApiOperation({ summary: '코멘트 목록 조회' })
  async getComments(@Param('id') id: string) {
    const data = await this.meetingNoteService.getComments(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '코멘트 작성' })
  async addComment(
    @Param('id') id: string,
    @Body() body: CreateMeetingNoteCommentRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.meetingNoteService.addComment(id, user.userId, body.content, body.parent_id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '코멘트 삭제' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.meetingNoteService.deleteComment(id, commentId, user.userId);
  }

  // ─── Ratings ─────────────────────────────────────────────────
  @Put(':id/rating')
  @ApiOperation({ summary: '별점 등록/수정' })
  async upsertRating(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.meetingNoteService.upsertRating(id, user.userId, rating);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete(':id/rating')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '별점 삭제' })
  async deleteRating(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.meetingNoteService.deleteRating(id, user.userId);
  }

  // ─── Backlinks ───────────────────────────────────────────────
  @Get(':id/backlinks')
  @ApiOperation({ summary: '백링크 목록 조회' })
  async getBacklinks(
    @Param('id') id: string,
    @Req() req?: any,
  ) {
    const data = await this.noteLinkService.getBacklinks(id, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
