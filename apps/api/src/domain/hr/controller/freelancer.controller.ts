import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Req, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FreelancerService } from '../service/freelancer.service';
import { CreateFreelancerRequest } from '../dto/request/create-freelancer.request';
import { UpdateFreelancerRequest } from '../dto/request/update-freelancer.request';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Freelancers')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/freelancers')
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @Get()
  @ApiOperation({ summary: '프리랜서 목록 조회' })
  async getFreelancers(@Req() req: any) {
    const data = await this.freelancerService.getFreelancers(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '프리랜서 상세 조회' })
  async getFreelancerById(@Param('id') id: string, @Req() req: any) {
    const data = await this.freelancerService.getFreelancerById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '프리랜서 등록' })
  async createFreelancer(@Body() request: CreateFreelancerRequest, @Req() req: any) {
    const data = await this.freelancerService.createFreelancer(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '프리랜서 수정' })
  async updateFreelancer(
    @Param('id') id: string,
    @Body() request: UpdateFreelancerRequest,
    @Req() req: any,
  ) {
    const data = await this.freelancerService.updateFreelancer(id, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '프리랜서 삭제' })
  async deleteFreelancer(@Param('id') id: string, @Req() req: any) {
    await this.freelancerService.deleteFreelancer(id, req.entityId);
  }
}
