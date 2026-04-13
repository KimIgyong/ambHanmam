import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ApiKeyService } from '../../settings/service/api-key.service';
import { CreateApiKeyRequest } from '../../settings/dto/request/create-api-key.request';
import { UpdateApiKeyRequest } from '../../settings/dto/request/update-api-key.request';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings/api-keys')
export class EntityApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityApiKeys(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.apiKeyService.findByEntity(entityId);
    return { success: true, data };
  }

  @Post()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async createEntityApiKey(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: CreateApiKeyRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.apiKeyService.createForEntity(dto, user.userId, entityId);
    return { success: true, data };
  }

  @Patch(':id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateEntityApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApiKeyRequest,
  ) {
    const data = await this.apiKeyService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteEntityApiKey(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.apiKeyService.remove(id);
    return { success: true };
  }
}
