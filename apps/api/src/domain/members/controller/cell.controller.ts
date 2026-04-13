import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CellService } from '../service/cell.service';
import { CreateCellRequest } from '../dto/request/create-cell.request';
import { UpdateCellRequest } from '../dto/request/update-cell.request';
import { AssignCellMemberRequest } from '../dto/request/assign-cell-member.request';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { AdminLevelGuard } from '../../../global/guard/admin-level.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Cells')
@Controller('cells')
@UseGuards(EntityGuard, RolesGuard)
export class CellController {
  constructor(private readonly cellService: CellService) {}

  @Get()
  @Roles('MANAGER')
  @ApiOperation({ summary: 'List groups' })
  @ApiQuery({ name: 'all', required: false, description: 'Return all groups regardless of entity (ADMIN only)' })
  findAll(@Req() req: any, @Query('all') all?: string) {
    // ADMIN/SUPER_ADMIN can request all groups regardless of entity context
    if (all === 'true' && (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN')) {
      return this.cellService.findAll();
    }
    return this.cellService.findAll(req.entityId);
  }

  @Post()
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create group' })
  create(@Body() dto: CreateCellRequest) {
    return this.cellService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update group' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCellRequest,
  ) {
    return this.cellService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete group' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cellService.remove(id);
  }

  @Get(':id/members')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Get group members' })
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.cellService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add member to group' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCellMemberRequest,
  ) {
    return this.cellService.addMember(id, dto.user_id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove member from group' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.cellService.removeMember(id, userId);
  }
}
