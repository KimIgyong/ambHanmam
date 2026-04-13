import {
  Controller, Get, Post, Patch, Delete, Param, Body, Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GlossaryService } from '../service/glossary.service';
import { CreateGlossaryRequest, UpdateGlossaryRequest } from '../dto/request/glossary.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';

@ApiTags('용어집')
@ApiBearerAuth()
@Controller('glossary')
export class GlossaryController {
  constructor(private readonly glossaryService: GlossaryService) {}

  @Get()
  @ApiOperation({ summary: '용어집 목록 조회' })
  async getTerms(@Headers('x-entity-id') entityId?: string) {
    const data = await this.glossaryService.getTerms(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '용어 등록' })
  async createTerm(
    @Body() dto: CreateGlossaryRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId?: string,
  ) {
    const data = await this.glossaryService.createTerm(dto, user.userId, entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':glsId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '용어 수정' })
  async updateTerm(
    @Param('glsId') glsId: string,
    @Body() dto: UpdateGlossaryRequest,
  ) {
    const data = await this.glossaryService.updateTerm(glsId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':glsId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '용어 삭제' })
  async deleteTerm(@Param('glsId') glsId: string) {
    await this.glossaryService.deleteTerm(glsId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
