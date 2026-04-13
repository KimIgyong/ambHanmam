import {
  Controller, Post, Get, Patch, Body, Param, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PartnerAuthService } from '../service/partner-auth.service';
import { PartnerLoginRequest } from '../dto/partner-login.request';
import { PartnerRegisterRequest } from '../dto/partner-register.request';
import { Public } from '../../../global/decorator/public.decorator';
import { PartnerGuard } from '../guard/partner.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Partner Auth')
@Controller('partner-auth')
export class PartnerAuthController {
  constructor(private readonly partnerAuthService: PartnerAuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '파트너 로그인' })
  async login(
    @Body() dto: PartnerLoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.partnerAuthService.login(dto.partner_code, dto.email, dto.password);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('invitation/:token')
  @ApiOperation({ summary: '초대 토큰 검증' })
  async verifyInvitation(@Param('token') token: string) {
    const data = await this.partnerAuthService.verifyInvitation(token);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '파트너 초대 기반 가입' })
  async register(
    @Body() dto: PartnerRegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.partnerAuthService.register(
      dto.token, dto.name, dto.password, dto.job_title, dto.phone,
    );

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: '파트너 비밀번호 재설정 이메일 발송' })
  async forgotPassword(@Body() body: { partner_code: string; email: string }) {
    await this.partnerAuthService.forgotPassword(body.partner_code, body.email);
    return { success: true, data: { step: 'sent' }, timestamp: new Date().toISOString() };
  }

  @Get('me')
  @UseGuards(PartnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파트너 프로필 조회' })
  async getMe(@CurrentUser() user: UserPayload) {
    const data = await this.partnerAuthService.getProfile(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('profile')
  @UseGuards(PartnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파트너 프로필 수정' })
  async updateProfile(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.partnerAuthService.updateProfile(user.userId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('change-password')
  @UseGuards(PartnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '파트너 비밀번호 변경' })
  async changePassword(@CurrentUser() user: UserPayload, @Body() body: { current_password: string; new_password: string }) {
    const data = await this.partnerAuthService.changePassword(
      user.userId, body.current_password, body.new_password,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('logout')
  @ApiOperation({ summary: '파트너 로그아웃' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true, timestamp: new Date().toISOString() };
  }
}
