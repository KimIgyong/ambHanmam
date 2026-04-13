import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { CalendarService } from '../service/calendar.service';
import { CalendarAiService } from '../service/calendar-ai.service';
import { GoogleCalendarSyncService } from '../service/google-calendar-sync.service';
import { CreateCalendarRequest } from '../dto/request/create-calendar.request';
import { UpdateCalendarRequest } from '../dto/request/update-calendar.request';
import { CreateCalendarExceptionRequest } from '../dto/request/create-calendar-exception.request';
import { AddParticipantsRequest } from '../dto/request/add-participants.request';
import { RespondCalendarRequest } from '../dto/request/respond-calendar.request';

@ApiTags('Calendars')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('calendars')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly aiService: CalendarAiService,
    private readonly googleSyncService: GoogleCalendarSyncService,
  ) {}

  // ──────────────────────────────────────────────
  // CRUD (FR-SCH-001~007)
  // ──────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create calendar event' })
  async create(
    @Body() dto: CreateCalendarRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.create(dto, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: 'List calendar events (with visibility ACL)' })
  async findAll(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('category') category?: string,
    @Query('visibility') visibility?: string,
    @Query('filter_mode') filterMode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const role = req.entityRole || user.role;
    const data = await this.calendarService.findAll(user.userId, role, req.entityId, {
      start_date: startDate,
      end_date: endDate,
      category,
      visibility,
      filter_mode: filterMode,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Static routes BEFORE :cal_id ──

  @Post('ai/generate-today')
  @ApiOperation({ summary: 'AI: Generate today schedule (SSE stub)' })
  async aiGenerateToday(@CurrentUser() user: UserPayload, @Req() req: any) {
    const data = await this.aiService.generateToday(user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('ai/generate-wbs')
  @ApiOperation({ summary: 'AI: Generate WBS draft (SSE stub)' })
  async aiGenerateWbs(
    @Body() body: { project_id?: string; milestones?: string[]; deadline?: string },
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.aiService.generateWbs(user.userId, req.entityId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('ai/optimize-week')
  @ApiOperation({ summary: 'AI: Weekly optimization (SSE stub)' })
  async aiOptimizeWeek(
    @Body() body: { week_start?: string },
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.aiService.optimizeWeek(user.userId, req.entityId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('ai/analyze-team')
  @ApiOperation({ summary: 'AI: Team schedule analysis (SSE stub)' })
  async aiAnalyzeTeam(
    @Body() body: { department_id?: string },
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.aiService.analyzeTeam(user.userId, req.entityId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('google/connect')
  @ApiOperation({ summary: 'Connect Google Calendar account (OAuth)' })
  async googleConnect(
    @Body() body: { auth_code: string },
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.googleSyncService.connectGoogle(user.userId, body.auth_code);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('google/disconnect')
  @ApiOperation({ summary: 'Disconnect Google Calendar account' })
  async googleDisconnect(@CurrentUser() user: UserPayload) {
    const data = await this.googleSyncService.disconnectGoogle(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ──────────────────────────────────────────────
  // Dynamic :cal_id routes
  // ──────────────────────────────────────────────

  @Get(':cal_id')
  @ApiOperation({ summary: 'Get calendar event detail' })
  async findById(
    @Param('cal_id') calId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.findById(calId, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':cal_id')
  @ApiOperation({ summary: 'Update calendar event (optimistic lock)' })
  async update(
    @Param('cal_id') calId: string,
    @Body() dto: UpdateCalendarRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.update(calId, dto, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':cal_id')
  @ApiOperation({ summary: 'Delete calendar event (soft delete)' })
  async remove(
    @Param('cal_id') calId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.remove(calId, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Recurrence Exceptions (FR-SCH-010~013) ──

  @Post(':cal_id/exceptions')
  @ApiOperation({ summary: 'Create recurrence exception' })
  async createException(
    @Param('cal_id') calId: string,
    @Body() dto: CreateCalendarExceptionRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.createException(calId, dto, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':cal_id/exceptions')
  @ApiOperation({ summary: 'Get recurrence exceptions' })
  async getExceptions(
    @Param('cal_id') calId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.getExceptions(calId, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Participants (FR-SCH-020~025) ──

  @Post(':cal_id/participants')
  @ApiOperation({ summary: 'Add participants' })
  async addParticipants(
    @Param('cal_id') calId: string,
    @Body() dto: AddParticipantsRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.addParticipants(calId, dto, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':cal_id/participants/me')
  @ApiOperation({ summary: 'Respond to calendar invitation' })
  async respond(
    @Param('cal_id') calId: string,
    @Body() dto: RespondCalendarRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.respondToCalendar(calId, dto, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':cal_id/participants/:clp_id')
  @ApiOperation({ summary: 'Remove participant' })
  async removeParticipant(
    @Param('cal_id') calId: string,
    @Param('clp_id') clpId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.removeParticipant(calId, clpId, user.userId, req.entityId, req.entityRole || user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Google Calendar (FR-SCH-050~054) ──

  @Post(':cal_id/google/sync')
  @ApiOperation({ summary: 'Manual Google Calendar sync trigger' })
  async googleSync(
    @Param('cal_id') calId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.calendarService.triggerGoogleSync(calId, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
