import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, Headers,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminOnly } from '../../auth/decorator/auth.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { PortalBridgeService } from '../service/portal-bridge.service';
import { CreateInternalAccountRequest } from '../dto/create-internal-account.request';
import { PortalCustomerQueryRequest } from '../dto/portal-customer-query.request';
import { AutoProvisionPortalCustomerRequest } from '../dto/auto-provision-portal-customer.request';
import { PermanentDeleteRequest } from '../dto/permanent-delete.request';

@Controller('portal-bridge')
export class PortalBridgeController {
  constructor(
    private readonly portalBridgeService: PortalBridgeService,
    private readonly configService: ConfigService,
  ) {}

  @Get('customers')
  @AdminOnly()
  async getCustomers(@Query() query: PortalCustomerQueryRequest) {
    const data = await this.portalBridgeService.findPortalCustomers(query);
    return { success: true, data };
  }

  @Get('customers/countries')
  @AdminOnly()
  async getCountries() {
    const data = await this.portalBridgeService.getDistinctCountries();
    return { success: true, data };
  }

  @Get('customers/:pctId/deletion-preview')
  @AdminOnly()
  async getDeletionPreview(@Param('pctId', ParseUUIDPipe) pctId: string) {
    const data = await this.portalBridgeService.getDeletionPreview(pctId);
    return { success: true, data };
  }

  @Get('customers/:pctId')
  @AdminOnly()
  async getCustomerDetail(@Param('pctId', ParseUUIDPipe) pctId: string) {
    const data = await this.portalBridgeService.findPortalCustomerDetail(pctId);
    return { success: true, data };
  }

  @Delete('customers/:pctId/permanent')
  @AdminOnly()
  async deleteCustomerPermanent(
    @Param('pctId', ParseUUIDPipe) pctId: string,
    @Body() dto: PermanentDeleteRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.portalBridgeService.deleteCustomerPermanent(
      pctId,
      dto.level,
      dto.confirm_email,
      user.userId,
    );
    return { success: true, data };
  }

  @Delete('customers/:pctId')
  @AdminOnly()
  async deleteCustomer(
    @Param('pctId', ParseUUIDPipe) pctId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.portalBridgeService.deletePortalCustomer(pctId, user.userId);
    return { success: true, data };
  }

  @Post('customers/:pctId/create-account')
  @AdminOnly()
  async createInternalAccount(
    @Param('pctId', ParseUUIDPipe) pctId: string,
    @Body() dto: CreateInternalAccountRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.portalBridgeService.createInternalAccount(pctId, dto, user);
    return { success: true, data };
  }

  @Public()
  @Post('customers/:pctId/auto-provision')
  async autoProvisionPortalCustomer(
    @Param('pctId', ParseUUIDPipe) pctId: string,
    @Body() dto: AutoProvisionPortalCustomerRequest,
    @Headers('x-portal-bridge-token') internalToken?: string,
  ) {
    const expectedToken = this.configService.get<string>('PORTAL_BRIDGE_INTERNAL_TOKEN');
    if (!expectedToken || internalToken !== expectedToken) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const data = await this.portalBridgeService.autoProvisionPortalCustomer(pctId, dto);
    return { success: true, data };
  }

  @Public()
  @Post('auto-login-token')
  async generateAutoLoginToken(
    @Body() body: { pct_id: string },
    @Headers('x-portal-bridge-token') internalToken?: string,
  ) {
    const expectedToken = this.configService.get<string>('PORTAL_BRIDGE_INTERNAL_TOKEN');
    if (!expectedToken || internalToken !== expectedToken) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const token = await this.portalBridgeService.generateAutoLoginToken(body.pct_id);
    return { success: true, data: { token } };
  }

  @Get('mappings')
  @AdminOnly()
  async getMappings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.portalBridgeService.findMappings(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  @Patch('mappings/:pumId/revoke')
  @AdminOnly()
  async revokeMapping(
    @Param('pumId', ParseUUIDPipe) pumId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.portalBridgeService.revokeMapping(pumId, user);
    return { success: true, data };
  }
}
