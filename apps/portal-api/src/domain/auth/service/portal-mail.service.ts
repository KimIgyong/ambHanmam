import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { createDecipheriv, scryptSync } from 'crypto';
import { SmtpSettingsEntity } from '../../../shared-entities/smtp-settings.entity';

@Injectable()
export class PortalMailService {
  private readonly logger = new Logger(PortalMailService.name);
  private cachedTransporter: nodemailer.Transporter | null = null;
  private cacheExpiry = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SmtpSettingsEntity)
    private readonly smtpRepo: Repository<SmtpSettingsEntity>,
  ) {}

  private decryptPassword(encrypted: string, iv: string, tag: string): string {
    const secret = this.configService.get<string>('API_KEY_ENCRYPTION_SECRET');
    if (!secret) {
      throw new Error('API_KEY_ENCRYPTION_SECRET is not configured');
    }
    const key = scryptSync(secret, 'amb-key-derivation-salt', 32);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.cachedTransporter && Date.now() < this.cacheExpiry) {
      return this.cachedTransporter;
    }

    // 1. DB SMTP 설정 시도 (admin에서 설정한 Gmail SMTP)
    const dbSettings = await this.smtpRepo.findOne({ where: {} });
    if (dbSettings) {
      try {
        const pass = this.decryptPassword(
          dbSettings.smsPassEncrypted,
          dbSettings.smsPassIv,
          dbSettings.smsPassTag,
        );
        this.logger.log(`Using DB SMTP settings: ${dbSettings.smsHost}:${dbSettings.smsPort}`);
        this.cachedTransporter = nodemailer.createTransport({
          host: dbSettings.smsHost,
          port: dbSettings.smsPort,
          secure: dbSettings.smsSecure,
          auth: { user: dbSettings.smsUser, pass },
        });
        this.cacheExpiry = Date.now() + PortalMailService.CACHE_TTL;
        return this.cachedTransporter;
      } catch (err) {
        this.logger.error('Failed to decrypt DB SMTP password, falling back to env', err instanceof Error ? err.message : err);
      }
    }

    // 2. 환경변수 fallback
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    this.logger.log(`Using env SMTP settings: ${host}:${port}`);
    this.cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: user ? { user, pass } : undefined,
    });
    this.cacheExpiry = Date.now() + PortalMailService.CACHE_TTL;
    return this.cachedTransporter;
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    // DB에서 from 주소 가져오기 (fallback: env)
    const dbSettings = await this.smtpRepo.findOne({ where: {} });
    const from = dbSettings?.smsFrom
      || this.configService.get<string>('SMTP_FROM', 'noreply@amoeba.site');

    const html = `
      <div style="font-family: 'Pretendard', 'DM Sans', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1E3A8A; font-size: 20px; margin: 0;">amoeba</h2>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">이메일 인증코드</p>
          <p style="color: #475569; font-size: 14px; margin: 0 0 20px;">Email Verification Code</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563EB; margin: 0 0 20px;">
            ${code}
          </div>
          <p style="color: #94A3B8; font-size: 12px; margin: 0;">
            이 코드는 10분간 유효합니다. | This code expires in 10 minutes.
          </p>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 24px;">
          본인이 요청하지 않은 경우 이 이메일을 무시하세요.<br>
          If you did not request this, please ignore this email.
        </p>
      </div>
    `;

    try {
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: `"Amoeba" <${from}>`,
        to: email,
        subject: `[Amoeba] 인증코드: ${code} | Verification Code: ${code}`,
        html,
      });
      this.logger.log(`Verification code sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}`, error instanceof Error ? error.stack : error);
      return false;
    }
  }
}
