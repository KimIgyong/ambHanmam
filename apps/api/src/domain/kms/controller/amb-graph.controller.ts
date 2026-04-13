import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { AmbGraphService } from '../service/amb-graph.service';

@Controller('kms')
export class AmbGraphController {
  constructor(private readonly ambGraphService: AmbGraphService) {}

  @Get('amb-graph')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getAmbGraph(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('scope') scope: string = 'MY',
    @Query('types') types?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user!);
    const validScope = scope === 'ENTITY' ? 'ENTITY' : 'MY';
    const typeList = types ? types.split(',').map((t) => t.trim().toUpperCase()) : undefined;

    const data = await this.ambGraphService.getGraphData({
      entityId,
      userId: user!.userId,
      scope: validScope,
      types: typeList,
    });

    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
