import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from '../service/employee.service';
import { CreateEmployeeRequest } from '../dto/request/create-employee.request';
import { UpdateEmployeeRequest } from '../dto/request/update-employee.request';
import { CreateDependentRequest } from '../dto/request/create-dependent.request';
import { CreateSalaryRequest } from '../dto/request/create-salary.request';
import { LinkUserRequest } from '../dto/request/link-user.request';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Employees')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('employees')
  @ApiOperation({ summary: '직원 목록 조회' })
  async getEmployees(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    const data = await this.employeeService.getEmployees(req.entityId, status, department);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('employees/:id')
  @ApiOperation({ summary: '직원 상세 조회' })
  async getEmployeeById(@Req() req: any, @Param('id') id: string) {
    const data = await this.employeeService.getEmployeeById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('employees')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '직원 등록' })
  async createEmployee(@Req() req: any, @Body() request: CreateEmployeeRequest) {
    const data = await this.employeeService.createEmployee(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('employees/:id')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '직원 수정' })
  async updateEmployee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: UpdateEmployeeRequest,
  ) {
    const data = await this.employeeService.updateEmployee(id, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('employees/:id')
  @UseGuards(ManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '직원 삭제' })
  async deleteEmployee(@Req() req: any, @Param('id') id: string) {
    await this.employeeService.deleteEmployee(id, req.entityId);
  }

  @Patch('employees/:empId/link-user')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '직원에 사용자 연결' })
  async linkUser(
    @Req() req: any,
    @Param('empId') empId: string,
    @Body() request: LinkUserRequest,
  ) {
    const data = await this.employeeService.linkUser(empId, req.entityId, request.usr_id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('employees/:empId/unlink-user')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '직원에서 사용자 연결 해제' })
  async unlinkUser(@Req() req: any, @Param('empId') empId: string) {
    const data = await this.employeeService.unlinkUser(empId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // --- Dependents ---

  @Get('employees/:empId/dependents')
  @ApiOperation({ summary: '부양가족 목록 조회' })
  async getDependents(@Req() req: any, @Param('empId') empId: string) {
    const data = await this.employeeService.getDependents(empId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('employees/:empId/dependents')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '부양가족 등록' })
  async createDependent(
    @Req() req: any,
    @Param('empId') empId: string,
    @Body() request: CreateDependentRequest,
  ) {
    const data = await this.employeeService.createDependent(empId, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('dependents/:depId')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '부양가족 수정' })
  async updateDependent(
    @Req() req: any,
    @Param('depId') depId: string,
    @Body() request: CreateDependentRequest,
  ) {
    const data = await this.employeeService.updateDependent(depId, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('dependents/:depId')
  @UseGuards(ManagerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '부양가족 삭제' })
  async deleteDependent(@Req() req: any, @Param('depId') depId: string) {
    await this.employeeService.deleteDependent(depId, req.entityId);
  }

  // --- Salary History ---

  @Get('employees/:empId/salary-history')
  @ApiOperation({ summary: '급여 이력 조회' })
  async getSalaryHistory(@Req() req: any, @Param('empId') empId: string) {
    const data = await this.employeeService.getSalaryHistory(empId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('employees/:empId/salary-history')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '급여 변경 등록' })
  async createSalaryHistory(
    @Req() req: any,
    @Param('empId') empId: string,
    @Body() request: CreateSalaryRequest,
  ) {
    const data = await this.employeeService.createSalaryHistory(empId, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
