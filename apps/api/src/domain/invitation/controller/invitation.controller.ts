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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvitationService } from '../service/invitation.service';
import { CreateInvitationRequest } from '../dto/request/create-invitation.request';
import { AcceptInvitationRequest } from '../dto/request/accept-invitation.request';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Create invitation' })
  create(
    @Body() dto: CreateInvitationRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.invitationService.create(dto, user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'List invitations' })
  findAll() {
    return this.invitationService.findAll();
  }

  @Get('validate/:token')
  @Public()
  @ApiOperation({ summary: 'Validate invitation token' })
  validateToken(@Param('token') token: string) {
    return this.invitationService.validateToken(token);
  }

  @Post('token/:token/accept')
  @Public()
  @ApiOperation({ summary: 'Accept invitation and create account' })
  accept(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationRequest,
  ) {
    return this.invitationService.accept(token, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Cancel invitation' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invitationService.cancel(id);
  }

  @Post(':id/resend')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Resend invitation' })
  resend(@Param('id', ParseUUIDPipe) id: string) {
    return this.invitationService.resend(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Delete invitation (CANCELLED only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invitationService.remove(id);
  }
}
