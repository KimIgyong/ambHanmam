import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpSettingsService } from '../../../domain/settings/service/smtp-settings.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cachedTransporter: nodemailer.Transporter | null = null;
  private cacheExpiry = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpSettingsService: SmtpSettingsService,
  ) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.cachedTransporter && Date.now() < this.cacheExpiry) {
      return this.cachedTransporter;
    }

    const dbSettings = await this.smtpSettingsService.getDecryptedSettings();

    let transportConfig: nodemailer.TransportOptions;
    if (dbSettings) {
      this.logger.log(`Using DB SMTP settings: ${dbSettings.host}:${dbSettings.port}`);
      transportConfig = {
        host: dbSettings.host,
        port: dbSettings.port,
        secure: dbSettings.secure,
        auth: {
          user: dbSettings.user,
          pass: dbSettings.pass,
        },
      } as nodemailer.TransportOptions;
    } else {
      const smtpHost = this.configService.get<string>('SMTP_HOST', '');
      const smtpUser = this.configService.get<string>('SMTP_USER', '');
      const smtpPass = this.configService.get<string>('SMTP_PASS', '');

      if (smtpHost && smtpUser) {
        this.logger.log(`Using env SMTP settings: ${smtpHost}`);
        transportConfig = {
          host: smtpHost,
          port: this.configService.get<number>('SMTP_PORT', 587),
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        } as nodemailer.TransportOptions;
      } else {
          this.logger.error('No usable SMTP configuration found. DB settings decryption failed, env vars empty.');
          transportConfig = {
            host: 'localhost',
            port: 587,
            secure: false,
          } as nodemailer.TransportOptions;
      }
    }

    this.cachedTransporter = nodemailer.createTransport(transportConfig);
    this.cacheExpiry = Date.now() + MailService.CACHE_TTL;
    return this.cachedTransporter;
  }

  private async getFromAddress(): Promise<string> {
    const dbSettings = await this.smtpSettingsService.getDecryptedSettings();
    if (dbSettings) {
      return dbSettings.from;
    }
    const envFrom = this.configService.get<string>('SMTP_FROM', '');
    return envFrom || 'AMB Management <noreply@amoebaglobal.com>';
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    role: string,
    department: string,
    token: string,
    companyInfo?: { name: string; color?: string; logoUrl?: string },
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5189',
    );
    const inviteLink = `${frontendUrl}/register?invitation_token=${token}`;

    const companyName = companyInfo?.name || 'AMB Management';
    const brandColor = companyInfo?.color || '#4F46E5';
    const logoHtml = companyInfo?.logoUrl
      ? `<img src="${companyInfo.logoUrl}" alt="${companyName}" style="height:48px; margin-bottom:16px; display:block;" />`
      : `<h2 style="color: ${brandColor}; font-size:22px; margin:0 0 16px 0;">${companyName}</h2>`;

    try {
      const transporter = await this.getTransporter();
      const from = await this.getFromAddress();

      await transporter.sendMail({
        from,
        to,
        subject: `[${companyName}] AMB Management - Invitation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
            ${logoHtml}
            <p style="font-size:15px; color:#111827;">You have been invited by <strong>${inviterName}</strong> to join <strong>${companyName}</strong>.</p>
            <table style="border-left:3px solid ${brandColor}; padding-left:12px; margin:16px 0; border-spacing:0;">
              <tr><td style="color:#6B7280; padding:2px 8px 2px 0;"><strong>Role:</strong></td><td style="color:#111827;">${role}</td></tr>
              <tr><td style="color:#6B7280; padding:2px 8px 2px 0;"><strong>Department:</strong></td><td style="color:#111827;">${department}</td></tr>
            </table>
            <p style="color:#374151; font-size:14px;">Click the link below to complete your registration:</p>
            <a href="${inviteLink}" style="display:inline-block; background:${brandColor}; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; margin:8px 0 24px 0;">
              Accept Invitation
            </a>
            <p style="color: #6B7280; font-size: 13px;">This invitation expires in 7 days.</p>
            <hr style="border:none; border-top:1px solid #E5E7EB; margin:20px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">This email was sent by AMB Management on behalf of ${companyName}.<br/>If the button doesn't work, copy and paste this link: ${inviteLink}</p>
          </div>
        `,
      });
      this.logger.log(`Invitation email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${to}`, error);
      return false;
    }
  }

  async sendRawEmail(options: {
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  }): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const from = await this.getFromAddress();

      await transporter.sendMail({
        from,
        to: options.to.join(', '),
        cc: options.cc?.join(', ') || undefined,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType || 'application/pdf',
        })),
      });
      this.logger.log(`Raw email sent to ${options.to.join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send raw email to ${options.to.join(', ')}`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5189',
    );
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      const transporter = await this.getTransporter();
      const from = await this.getFromAddress();

      await transporter.sendMail({
        from,
        to,
        subject: 'AMB Management - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">AMB Management</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #6B7280; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #6B7280; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
            <p style="color: #9CA3AF; font-size: 12px;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      return false;
    }
  }

  async sendTemporaryPasswordEmail(
    to: string,
    userName: string,
    tempPassword: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5189',
    );

    try {
      const transporter = await this.getTransporter();
      const from = await this.getFromAddress();

      await transporter.sendMail({
        from,
        to,
        subject: 'AMB Management - Your Password Has Been Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">AMB Management</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your password has been reset by an administrator. Please use the temporary password below to log in:</p>
            <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
              <code style="font-size: 18px; font-weight: bold; color: #1F2937; letter-spacing: 2px;">${tempPassword}</code>
            </div>
            <p style="color: #DC2626; font-size: 14px; font-weight: bold;">⚠ You will be required to change your password upon first login.</p>
            <a href="${frontendUrl}/login" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
              Go to Login
            </a>
            <p style="color: #6B7280; font-size: 14px;">For security, please change your password immediately after logging in.</p>
            <p style="color: #9CA3AF; font-size: 12px;">If you did not expect this email, please contact your administrator.</p>
          </div>
        `,
      });
      this.logger.log(`Temporary password email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send temporary password email to ${to}`, error);
      return false;
    }
  }
}
