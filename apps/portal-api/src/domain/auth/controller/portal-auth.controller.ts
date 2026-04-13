import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PortalAuthService } from '../service/portal-auth.service';
import { RegisterRequest } from '../dto/request/register.request';
import { SendVerifyCodeRequest } from '../dto/request/send-verify-code.request';
import { VerifyEmailCodeRequest } from '../dto/request/verify-email-code.request';
import { LoginRequest } from '../dto/request/login.request';
import { ForgotPasswordRequest } from '../dto/request/forgot-password.request';
import { ResetPasswordRequest } from '../dto/request/reset-password.request';
import { GoogleOnboardingRequest } from '../dto/request/google-onboarding.request';
import { PortalJwtAuthGuard } from '../guard/portal-jwt-auth.guard';

@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly authService: PortalAuthService) {}

  @Post('send-verify-code')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  sendVerifyCode(@Body() dto: SendVerifyCodeRequest) {
    return this.authService.sendVerifyCode(dto.email);
  }

  @Post('verify-email-code')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyEmailCode(@Body() dto: VerifyEmailCodeRequest) {
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterRequest) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('google/start')
  getGoogleAuthStartUrl() {
    return this.authService.getGoogleAuthStartUrl();
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.authService.handleGoogleCallback(code, state);
    return res.redirect(redirectUrl);
  }

  @Post('google/onboarding')
  completeGoogleOnboarding(@Body() dto: GoogleOnboardingRequest) {
    return this.authService.completeGoogleOnboarding(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginRequest) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordRequest) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordRequest) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  @UseGuards(PortalJwtAuthGuard)
  getProfile(@Request() req: { user: { customerId: string } }) {
    return this.authService.getProfile(req.user.customerId);
  }
}
