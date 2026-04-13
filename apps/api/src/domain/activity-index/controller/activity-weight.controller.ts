import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ActivityWeightService } from '../service/activity-weight.service';
import { UpdateWeightsDto } from '../dto/weight-config.dto';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

@Controller('entity-settings/activity-weights')
export class ActivityWeightController {
  constructor(private readonly weightService: ActivityWeightService) {}

  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getWeights(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.weightService.getWeights(entityId);
    return { success: true, data };
  }

  @Put()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateWeights(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: UpdateWeightsDto,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.weightService.updateWeights(entityId, user.userId, dto.weights);
    return { success: true, data };
  }
}
