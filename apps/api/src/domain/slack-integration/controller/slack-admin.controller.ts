import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlackWorkspaceService } from '../service/slack-workspace.service';
import { CreateChannelMappingDto, UpdateChannelMappingDto, ImportHistoryDto } from '../dto/slack-channel-mapping.dto';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ApiKeyService } from '../../settings/service/api-key.service';

const SLACK_PROVIDERS = ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET', 'SLACK_SIGNING_SECRET'] as const;

@ApiTags('Slack Integration - Admin')
@ApiBearerAuth()
@Controller('entity-settings/slack')
export class SlackAdminController {
  private readonly logger = new Logger(SlackAdminController.name);

  constructor(
    private readonly workspaceService: SlackWorkspaceService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  // --- Slack App Config APIs ---

  @Get('config')
  @ApiOperation({ summary: 'Slack App 설정 키 조회 (masking된 값 반환)' })
  async getConfig(@CurrentUser() user: UserPayload) {
    const entityId = user.entityId!;
    const keys = await this.apiKeyService.findByEntity(entityId);
    const slackKeys = keys.filter((k) => SLACK_PROVIDERS.includes(k.provider as any));
    return { success: true, data: slackKeys, timestamp: new Date().toISOString() };
  }

  @Post('config')
  @ApiOperation({ summary: 'Slack App 설정 키 저장/수정' })
  async saveConfig(
    @Body() dto: { provider: string; value: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId!;
    if (!SLACK_PROVIDERS.includes(dto.provider as any)) {
      return { success: false, error: 'Invalid provider', timestamp: new Date().toISOString() };
    }

    // 기존 키가 있으면 업데이트, 없으면 생성
    const existingKeys = await this.apiKeyService.findByEntity(entityId);
    const existing = existingKeys.find((k) => k.provider === dto.provider);

    if (existing) {
      const data = await this.apiKeyService.update(existing.apiKeyId, {
        api_key: dto.value,
      });
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    const data = await this.apiKeyService.createForEntity(
      { provider: dto.provider, name: dto.provider, api_key: dto.value },
      user.userId,
      entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('config/:provider')
  @ApiOperation({ summary: 'Slack App 설정 키 삭제' })
  async deleteConfig(
    @Param('provider') provider: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId!;
    const keys = await this.apiKeyService.findByEntity(entityId);
    const target = keys.find((k) => k.provider === provider);
    if (target) {
      await this.apiKeyService.remove(target.apiKeyId);
    }
    return { success: true, timestamp: new Date().toISOString() };
  }

  // --- Workspace APIs ---

  @Get('workspaces')
  @ApiOperation({ summary: '연결된 워크스페이스 목록 조회' })
  async getWorkspaces(@CurrentUser() user: UserPayload) {
    const data = await this.workspaceService.getWorkspaces(user.entityId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('workspaces/connect-token')
  @ApiOperation({ summary: 'Bot Token으로 워크스페이스 직접 연결' })
  async connectWithBotToken(
    @Body() dto: { bot_token: string },
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.connectWithBotToken(
      user.entityId!,
      dto.bot_token,
      user.userId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('workspaces/:id')
  @ApiOperation({ summary: '워크스페이스 연결 해제' })
  async disconnectWorkspace(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.workspaceService.disconnectWorkspace(user.entityId!, id);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get('workspaces/:id/channels')
  @ApiOperation({ summary: 'Slack 채널 목록 조회 (워크스페이스별)' })
  async getSlackChannels(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.getSlackChannels(user.entityId!, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // --- Conversation History APIs ---

  @Get('workspaces/:workspaceId/channels/:channelId/messages')
  @ApiOperation({ summary: 'Slack 채널 대화 내역 조회' })
  async getChannelMessages(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('latest') latest?: string,
    @Query('oldest') oldest?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const data = await this.workspaceService.getChannelHistory(
      user!.entityId!,
      workspaceId,
      channelId,
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor || undefined,
        latest: latest || undefined,
        oldest: oldest || undefined,
      },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('workspaces/:workspaceId/channels/:channelId/threads/:threadTs')
  @ApiOperation({ summary: 'Slack 스레드 답글 조회' })
  async getThreadReplies(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @Param('threadTs') threadTs: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const data = await this.workspaceService.getThreadReplies(
      user!.entityId!,
      workspaceId,
      channelId,
      threadTs,
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor || undefined,
      },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // --- Channel Mapping APIs ---

  @Get('mappings')
  @ApiOperation({ summary: '채널 매핑 목록 조회' })
  async getMappings(@CurrentUser() user: UserPayload) {
    const data = await this.workspaceService.getMappings(user.entityId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('mappings')
  @ApiOperation({ summary: '채널 매핑 생성' })
  async createMapping(
    @Body() dto: CreateChannelMappingDto,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.createMapping(user.entityId!, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('mappings/:id')
  @ApiOperation({ summary: '채널 매핑 수정 (상태, 방향)' })
  async updateMapping(
    @Param('id') id: string,
    @Body() dto: UpdateChannelMappingDto,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.updateMapping(user.entityId!, id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('mappings/:id')
  @ApiOperation({ summary: '채널 매핑 삭제' })
  async deleteMapping(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.workspaceService.deleteMapping(user.entityId!, id);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // --- Import History ---

  @Post('mappings/:mappingId/import-history')
  @ApiOperation({ summary: 'Slack 채널 대화 내역을 AMA 채널로 임포트' })
  async importHistory(
    @Param('mappingId') mappingId: string,
    @Body() dto: ImportHistoryDto,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.importChannelHistory(
      user.entityId!,
      mappingId,
      { oldest: dto.oldest, latest: dto.latest, limit: dto.limit },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('mappings/:mappingId/sync-members')
  @ApiOperation({ summary: 'Slack 채널 참여자를 AMA 채널에 동기화' })
  async syncMembers(
    @Param('mappingId') mappingId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.workspaceService.syncChannelMembers(
      user.entityId!,
      mappingId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
