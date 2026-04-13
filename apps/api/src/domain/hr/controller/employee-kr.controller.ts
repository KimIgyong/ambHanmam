import {
  Controller, Get, Post, Patch, Param, Body, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeKrService } from '../service/employee-kr.service';
import { CreateEmployeeKrRequest } from '../dto/request/create-employee-kr.request';
import { UpdateEmployeeKrRequest } from '../dto/request/update-employee-kr.request';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - KR Employees')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/employees')
export class EmployeeKrController {
  constructor(private readonly employeeKrService: EmployeeKrService) {}

  @Get(':empId/kr')
  @ApiOperation({ summary: 'KR 직원 확장 정보 조회' })
  async getKrInfo(@Param('empId') empId: string) {
    const data = await this.employeeKrService.getByEmployeeId(empId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':empId/kr')
  @ApiOperation({ summary: 'KR 직원 확장 정보 등록' })
  async createKrInfo(
    @Param('empId') empId: string,
    @Body() request: CreateEmployeeKrRequest,
  ) {
    const data = await this.employeeKrService.create(empId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':empId/kr')
  @ApiOperation({ summary: 'KR 직원 확장 정보 수정' })
  async updateKrInfo(
    @Param('empId') empId: string,
    @Body() request: UpdateEmployeeKrRequest,
  ) {
    const data = await this.employeeKrService.update(empId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
