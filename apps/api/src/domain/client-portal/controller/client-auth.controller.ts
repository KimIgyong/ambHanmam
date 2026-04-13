import {
  Controller, Post, Get, Patch, Body, Param, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { ClientAuthService } from '../service/client-auth.service';
import { ClientLoginRequest } from '../dto/client-login.request';
import { ClientRegisterRequest } from '../dto/client-register.request';
import { Public } from '../../../global/decorator/public.decorator';
import { ClientGuard } from '../guard/client.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Client Auth')
@Controller('client-auth')
export class ClientAuthController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '고객 로그인' })
  async login(
    @Body() dto: ClientLoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clientAuthService.login(dto.entity_code, dto.email, dto.password);

    // httpOnly 쿠키에 토큰 설정
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000, // 4h
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
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
    const data = await this.clientAuthService.verifyInvitation(token);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '고객 초대 기반 가입' })
  async register(
    @Body() dto: ClientRegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clientAuthService.register(
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
  @ApiOperation({ summary: '고객 비밀번호 재설정 이메일 발송' })
  async forgotPassword(@Body() body: { entity_code: string; email: string }) {
    await this.clientAuthService.forgotPassword(body.entity_code, body.email);
    return { success: true, data: { step: 'sent' }, timestamp: new Date().toISOString() };
  }

  @Get('me')
  @UseGuards(ClientGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '고객 프로필 조회' })
  async getMe(@CurrentUser() user: UserPayload) {
    const data = await this.clientAuthService.getProfile(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('profile')
  @UseGuards(ClientGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '고객 프로필 수정' })
  async updateProfile(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.clientAuthService.updateProfile(user.userId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('change-password')
  @UseGuards(ClientGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '고객 비밀번호 변경' })
  async changePassword(@CurrentUser() user: UserPayload, @Body() body: { current_password: string; new_password: string }) {
    const data = await this.clientAuthService.changePassword(
      user.userId, body.current_password, body.new_password,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('logout')
  @ApiOperation({ summary: '고객 로그아웃' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true, timestamp: new Date().toISOString() };
  }
}
