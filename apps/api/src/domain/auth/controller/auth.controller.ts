import { Controller, Post, Get, Patch, Body, Req, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from '../service/auth.service';
import { LoginRequest } from '../dto/request/login.request';
import { RegisterRequest } from '../dto/request/register.request';
import { FindOrganizationsRequest } from '../dto/request/find-organizations.request';
import { ForgotPasswordRequest } from '../dto/request/forgot-password.request';
import { ResetPasswordRequest } from '../dto/request/reset-password.request';
import { ChangePasswordRequest } from '../dto/request/change-password.request';
import { InitialSetupRequest } from '../dto/request/initial-setup.request';
import { Public } from '../../../global/decorator/public.decorator';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('entities/search')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '법인 검색 (로그인 전 공개 API)' })
  async searchEntities(@Query('q') query: string) {
    return this.authService.searchEntities(query || '');
  }

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '로그인 (법인코드 + 이메일 + 비밀번호)' })
  async login(
    @Body() request: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      request,
      req.ip,
      req.headers['user-agent'],
    );

    this.authService.setTokenCookies(res, result.tokens);
    return result;
  }

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: '회원가입' })
  async register(
    @Body() request: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(request);
    this.authService.setTokenCookies(res, result);
    return result;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies?.refresh_token || req.body?.refresh_token;
    const result = await this.authService.refresh(refreshToken);
    this.authService.setTokenCookies(res, result);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.authService.clearTokenCookies(res);
    return { message: 'Logged out successfully.' };
  }

  @Public()
  @Post('find-organizations')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: '이메일로 소속 조직 목록 발송' })
  async findOrganizations(@Body() request: FindOrganizationsRequest) {
    await this.authService.findOrganizationsByEmail(request.email);
    return { sent: true };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: '비밀번호 재설정 이메일 발송' })
  async forgotPassword(@Body() request: ForgotPasswordRequest) {
    await this.authService.forgotPassword(request.email, request.entity_code);
    return { step: 'sent' };
  }

  @Public()
  @Get('verify-reset-token')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '비밀번호 재설정 토큰 검증 + Entity 정보 반환' })
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '토큰으로 비밀번호 재설정' })
  async resetPassword(@Body() request: ResetPasswordRequest) {
    await this.authService.resetPassword(request.token, request.new_password);
    return { message: 'Password has been reset successfully.' };
  }

  @Post('change-password')
  @ApiOperation({ summary: '비밀번호 변경 (로그인 상태)' })
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() request: ChangePasswordRequest,
  ) {
    await this.authService.changePassword(
      user.userId,
      request.current_password,
      request.new_password,
    );
    return { message: 'Password changed successfully.' };
  }

  @Public()
  @Post('auto-login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: '자동 로그인 (Portal 가입 후 One-Time Token)' })
  async autoLogin(
    @Body() body: { token: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.autoLogin(
      body.token,
      req.ip,
      req.headers['user-agent'],
    );
    this.authService.setTokenCookies(res, result.tokens);
    return result;
  }

  @Patch('initial-setup')
  @ApiOperation({ summary: '초기설정 (비밀번호+이름+회사+국가)' })
  async initialSetup(
    @CurrentUser() user: UserPayload,
    @Body() request: InitialSetupRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.initialSetup(user.userId, request);
    this.authService.setTokenCookies(res, result.tokens);
    return result;
  }

  @Get('me')
  @ApiOperation({ summary: '현재 로그인 사용자 정보' })
  async getMe(@CurrentUser() user: UserPayload) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      level: user.level,
      status: user.status,
      companyId: user.companyId,
      isHq: user.isHq,
      mustChangePw: user.mustChangePw,
      departmentId: user.departmentId,
      entityId: user.entityId,
    };
  }

  /**
   * Phase B (TODO): App Store 리다이렉트용 단기 JWT 발급.
   * 타겟 사이트(apps.amoeba.site)에서 이 토큰으로 사용자/법인 정보를 검증한다.
   * - 만료: 5분
   * - Payload: email, entityId, entityCode, entityName
   * - 양쪽 서버가 동일 JWT_SECRET 또는 RS256 공개키를 공유해야 함
   */
  @Get('store-redirect-token')
  @ApiOperation({ summary: 'App Store 리다이렉트용 단기 토큰 발급' })
  async getStoreRedirectToken(@CurrentUser() user: UserPayload) {
    return this.authService.generateStoreRedirectToken(user);
  }
}
