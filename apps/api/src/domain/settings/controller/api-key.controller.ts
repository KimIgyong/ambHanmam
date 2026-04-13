import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiKeyService } from '../service/api-key.service';
import { CreateApiKeyRequest } from '../dto/request/create-api-key.request';
import { UpdateApiKeyRequest } from '../dto/request/update-api-key.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/api-keys')
@UseGuards(AdminGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  findAll() {
    return this.apiKeyService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateApiKeyRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.apiKeyService.create(dto, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApiKeyRequest,
  ) {
    return this.apiKeyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeyService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeyService.testConnection(id);
  }
}
