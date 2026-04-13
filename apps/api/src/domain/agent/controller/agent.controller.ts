import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitCode, UNIT_CODE } from '@amb/types';
import { AGENT_INFO_MAP } from '../constant/agent.constant';
import { AgentInfoResponse } from '../dto/response/agent.response';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HttpStatus } from '@nestjs/common';

@ApiTags('에이전트')
@ApiBearerAuth()
@Controller('agents')
export class AgentController {
  @Get()
  @ApiOperation({ summary: '부서 에이전트 목록 조회' })
  getAgents(): AgentInfoResponse[] {
    return Object.values(AGENT_INFO_MAP);
  }

  @Get(':department')
  @ApiOperation({ summary: '부서 에이전트 정보 조회' })
  getAgent(@Param('department') department: string): AgentInfoResponse {
    const deptCode = department.toUpperCase() as UnitCode;
    const validCodes = Object.values(UNIT_CODE) as string[];

    if (!validCodes.includes(deptCode)) {
      throw new BusinessException(
        ERROR_CODE.INVALID_DEPARTMENT.code,
        ERROR_CODE.INVALID_DEPARTMENT.message,
        HttpStatus.NOT_FOUND,
      );
    }

    return AGENT_INFO_MAP[deptCode];
  }
}
