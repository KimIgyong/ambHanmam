import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,
  Res, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EntityService } from '../service/entity.service';
import { CreateEntityRequest } from '../dto/request/create-entity.request';
import { UpdateEntityRequest } from '../dto/request/update-entity.request';
import { AssignEntityRoleRequest } from '../dto/request/assign-entity-role.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('HR - Entity Management')
@ApiBearerAuth()
@Controller('hr/entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  @ApiOperation({ summary: '현재 사용자의 법인 목록' })
  async getMyEntities(@CurrentUser() user: UserPayload) {
    let data;
    if (user.level === 'USER_LEVEL' && user.companyId) {
      // USER_LEVEL: 자기 소속 법인만 반환 (타법인 정보 차단)
      data = [await this.entityService.getEntityById(user.companyId)];
    } else if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      data = await this.entityService.getAllEntities();
    } else {
      data = await this.entityService.getEntitiesForUser(user.userId);
    }
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '법인 상세 조회' })
  async getEntityById(@Param('id') id: string) {
    const data = await this.entityService.getEntityById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '법인 생성' })
  async createEntity(@Body() request: CreateEntityRequest) {
    const data = await this.entityService.createEntity(request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '법인 수정' })
  async updateEntity(
    @Param('id') id: string,
    @Body() request: UpdateEntityRequest,
  ) {
    const data = await this.entityService.updateEntity(id, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/users')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '법인에 사용자 역할 할당' })
  async assignUserRole(
    @Param('id') id: string,
    @Body() request: AssignEntityRoleRequest,
  ) {
    const data = await this.entityService.assignUserRole(id, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/users')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '법인의 사용자 역할 목록' })
  async getEntityRoles(@Param('id') id: string) {
    const data = await this.entityService.getEntityRoles(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Stamp Image Management ──

  @Post(':id/stamp')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '법인 도장 이미지 업로드' })
  async uploadStamp(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      throw new BadRequestException('Only PNG or JPEG files are allowed');
    }
    if (file.size > 512000) {
      throw new BadRequestException('File must be smaller than 500KB');
    }

    await this.entityService.updateStampImage(id, file.buffer);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get(':id/stamp')
  @ApiOperation({ summary: '법인 도장 이미지 조회' })
  async getStamp(@Param('id') id: string, @Res() res: Response) {
    const image = await this.entityService.getStampImage(id);
    if (!image) {
      return res.status(404).json({ success: false, error: 'Stamp image not found' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.send(image);
  }

  @Delete(':id/stamp')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '법인 도장 이미지 삭제' })
  async deleteStamp(@Param('id') id: string) {
    await this.entityService.updateStampImage(id, null);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
