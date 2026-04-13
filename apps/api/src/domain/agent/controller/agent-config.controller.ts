import {
  Controller, Get, Patch, Post, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentConfigService } from '../service/agent-config.service';
import { UpdateAgentConfigRequest } from '../dto/request/update-agent-config.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';

@ApiTags('에이전트 설정')
@ApiBearerAuth()
@Controller('agents/configs')
export class AgentConfigController {
  constructor(private readonly agentConfigService: AgentConfigService) {}

  @Get('visible')
  @ApiOperation({ summary: '내가 접근 가능한 에이전트 목록' })
  async getVisibleAgents(@CurrentUser() user: UserPayload) {
    const data = await this.agentConfigService.getVisibleAgents(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '전체 에이전트 설정 목록' })
  async getConfigs() {
    const data = await this.agentConfigService.getConfigs();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':deptCode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '특정 에이전트 설정 조회' })
  async getConfig(@Param('deptCode') deptCode: string) {
    const data = await this.agentConfigService.getConfig(deptCode);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':deptCode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '에이전트 프롬프트 수정' })
  async updateConfig(
    @Param('deptCode') deptCode: string,
    @Body() dto: UpdateAgentConfigRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.agentConfigService.updateConfig(deptCode, dto, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':deptCode/reset')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '기본 프롬프트 초기화' })
  async resetConfig(
    @Param('deptCode') deptCode: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.agentConfigService.resetConfig(deptCode, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
