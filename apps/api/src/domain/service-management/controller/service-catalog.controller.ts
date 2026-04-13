import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceCatalogService } from '../service/service-catalog.service';
import { CreateServiceRequest } from '../dto/request/create-service.request';
import { UpdateServiceRequest } from '../dto/request/update-service.request';
import { CreatePlanRequest } from '../dto/request/create-plan.request';
import { UpdatePlanRequest } from '../dto/request/update-plan.request';
import { AdminGuard } from '../../settings/guard/admin.guard';

@ApiTags('Service Management - Services')
@ApiBearerAuth()
@Controller('service/services')
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  @ApiOperation({ summary: '서비스 목록 조회' })
  async findAll(@Query() query: any) {
    const data = await this.serviceCatalogService.findAll(query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '서비스 상세 조회' })
  async findById(@Param('id') id: string) {
    const data = await this.serviceCatalogService.findById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 등록' })
  async create(@Body() dto: CreateServiceRequest) {
    const data = await this.serviceCatalogService.create(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceRequest) {
    const data = await this.serviceCatalogService.update(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 삭제' })
  async remove(@Param('id') id: string) {
    await this.serviceCatalogService.delete(id);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get(':id/plans')
  @ApiOperation({ summary: '서비스 플랜 목록' })
  async findPlans(@Param('id') id: string) {
    const data = await this.serviceCatalogService.findPlans(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/plans')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 플랜 추가' })
  async createPlan(@Param('id') id: string, @Body() dto: CreatePlanRequest) {
    const data = await this.serviceCatalogService.createPlan(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/plans/:planId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 플랜 수정' })
  async updatePlan(@Param('id') id: string, @Param('planId') planId: string, @Body() dto: UpdatePlanRequest) {
    const data = await this.serviceCatalogService.updatePlan(id, planId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/plans/:planId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '서비스 플랜 삭제' })
  async deletePlan(@Param('id') id: string, @Param('planId') planId: string) {
    await this.serviceCatalogService.deletePlan(id, planId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
