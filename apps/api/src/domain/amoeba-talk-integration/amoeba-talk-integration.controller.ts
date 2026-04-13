import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../auth/decorator/auth.decorator';
import { CurrentUser, UserPayload } from '../../global/decorator/current-user.decorator';
import { AmoebaTalkIntegrationService } from './amoeba-talk-integration.service';

@ApiTags('AmoebaTalk Integration')
@Controller('integration/amoeba-talk')
export class AmoebaTalkIntegrationController {
  constructor(private readonly service: AmoebaTalkIntegrationService) {}

  /**
   * Generate signed connect token for AmoebaTalk registration
   * Available to all authenticated users
   */
  @Post('connect-token')
  @Auth()
  @ApiOperation({ summary: 'Generate AmoebaTalk connect token' })
  async generateConnectToken(@CurrentUser() user: UserPayload) {
    return this.service.generateConnectToken(user);
  }

  /**
   * Check if current user has linked AmoebaTalk account
   */
  @Get('status')
  @Auth()
  @ApiOperation({ summary: 'Check AmoebaTalk connection status' })
  async getConnectionStatus(@CurrentUser() user: UserPayload) {
    return this.service.getConnectionStatus(user);
  }
}
