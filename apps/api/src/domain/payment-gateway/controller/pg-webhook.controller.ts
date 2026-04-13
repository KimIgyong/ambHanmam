import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../../global/decorator/public.decorator';
import { MegapayService } from '../service/megapay.service';

@Controller('payment-gateway')
export class PgWebhookController {
  private readonly logger = new Logger(PgWebhookController.name);

  constructor(private readonly megapayService: MegapayService) {}

  /**
   * MegaPay Callback (GET) — 결제 후 사용자 브라우저 리다이렉트
   * Public 엔드포인트: JWT 인증 불필요
   */
  @Public()
  @Get('callback')
  async handleCallback(
    @Query() params: Record<string, string>,
    @Res() res: Response,
  ) {
    this.logger.log(`Callback received: invoiceNo=${params.invoiceNo}`);

    try {
      const result = await this.megapayService.handleCallback(params);

      // 프론트엔드 결제 결과 페이지로 리다이렉트
      const frontendUrl = process.env.FRONTEND_URL || '';
      const redirectUrl = `${frontendUrl}/payment/result?invoiceNo=${result.invoiceNo}&success=${result.success}&resultCd=${result.resultCd}`;
      return res.redirect(302, redirectUrl);
    } catch (error) {
      this.logger.error('Callback processing failed:', error);
      const frontendUrl = process.env.FRONTEND_URL || '';
      return res.redirect(
        302,
        `${frontendUrl}/payment/result?success=false&error=callback_failed`,
      );
    }
  }

  /**
   * MegaPay IPN (POST) — 서버 간 결제 결과 알림
   * Public 엔드포인트: JWT 인증 불필요
   * merchantToken SHA256 검증으로 보안 확보
   */
  @Public()
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleIpn(@Body() body: Record<string, string>) {
    this.logger.log(`IPN received: invoiceNo=${body.invoiceNo}`);

    try {
      await this.megapayService.handleIpn(body);
      return { resultCd: '00', resultMsg: 'OK' };
    } catch (error) {
      this.logger.error('IPN processing failed:', error);
      return { resultCd: '99', resultMsg: 'Internal error' };
    }
  }
}
