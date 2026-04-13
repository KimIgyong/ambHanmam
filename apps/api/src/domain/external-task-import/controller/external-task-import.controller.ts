import {
  Controller, Get, Post, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ExternalTaskImportService } from '../service/external-task-import.service';
import { ImportTasksRequest } from '../dto/import-tasks.dto';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

@Controller('issues/external')
export class ExternalTaskImportController {
  constructor(
    private readonly importService: ExternalTaskImportService,
  ) {}

  /** 사용 가능한 프로바이더 목록 */
  @Get('providers')
  @Auth()
  async getProviders(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.getAvailableProviders(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 프로젝트 목록 */
  @Get(':provider/projects')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getProjects(
    @Param('provider') provider: string,
    @Query('app_id') appId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.fetchProjects(provider, appId, entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 그룹/섹션 목록 */
  @Get(':provider/projects/:projectId/groups')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getGroups(
    @Param('provider') provider: string,
    @Param('projectId') projectId: string,
    @Query('app_id') appId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.fetchGroups(provider, appId, entityId, projectId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 태스크 목록 */
  @Get(':provider/groups/:groupId/tasks')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getTasks(
    @Param('provider') provider: string,
    @Param('groupId') groupId: string,
    @Query('app_id') appId: string,
    @Query('cursor') cursor: string | undefined,
    @Query('only_incomplete') onlyIncomplete: string | undefined,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.fetchTasks(provider, appId, entityId, groupId, {
      cursor,
      onlyIncomplete: onlyIncomplete === 'true',
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 태스크 가져오기 */
  @Post(':provider/import')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async importTasks(
    @Param('provider') provider: string,
    @Body() dto: ImportTasksRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);

    // Fetch task details from the provider using group_id
    let tasks: any[] = [];
    if (dto.group_id) {
      const result = await this.importService.fetchTasks(provider, dto.app_id, entityId, dto.group_id, {});
      tasks = result.data;
      // If paginated, fetch all pages to find requested tasks
      let cursor = result.nextCursor;
      while (cursor && result.hasMore) {
        const page = await this.importService.fetchTasks(provider, dto.app_id, entityId, dto.group_id, { cursor });
        tasks = [...tasks, ...page.data];
        cursor = page.nextCursor;
        if (!page.hasMore) break;
      }
    }

    const data = await this.importService.importTasks(
      provider,
      dto.app_id,
      entityId,
      user.userId,
      dto.task_ids,
      tasks,
      dto.defaults || {},
      dto.project_name,
      dto.group_name,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 가져온 태스크 목록 */
  @Get('imported')
  @Auth()
  async getImportedTasks(
    @Query('provider') provider: string | undefined,
    @Query('page') page: string | undefined,
    @Query('size') size: string | undefined,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.getImportedTasks(
      entityId,
      provider,
      parseInt(page || '1', 10),
      parseInt(size || '20', 10),
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 가져오기 이력 */
  @Get('logs')
  @Auth()
  async getImportLogs(
    @Query('page') page: string | undefined,
    @Query('size') size: string | undefined,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.getImportLogs(
      entityId,
      parseInt(page || '1', 10),
      parseInt(size || '20', 10),
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
