import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpSettingsEntity } from '../entity/smtp-settings.entity';
import { CryptoService } from './crypto.service';
import { UpdateSmtpSettingsRequest } from '../dto/request/update-smtp-settings.request';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { SmtpSettingsResponse } from '@amb/types';

@Injectable()
export class SmtpSettingsService {
  private readonly logger = new Logger(SmtpSettingsService.name);

  constructor(
    @InjectRepository(SmtpSettingsEntity)
    private readonly smtpRepository: Repository<SmtpSettingsEntity>,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {}

  async getSettings(): Promise<SmtpSettingsResponse> {
    const entity = await this.smtpRepository.findOne({ where: {} });

    if (!entity) {
      return {
        host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
        port: Number(this.configService.get<string>('SMTP_PORT', '587')),
        user: this.configService.get<string>('SMTP_USER', ''),
        maskedPass: this.maskPassword(this.configService.get<string>('SMTP_PASS', '')),
        from: this.configService.get<string>('SMTP_FROM', 'AMB Management <noreply@amoeba.co.kr>'),
        secure: false,
        updatedAt: null,
      };
    }

    let plainPass = '';
    try {
      plainPass = this.cryptoService.decrypt(
        entity.smsPassEncrypted,
        entity.smsPassIv,
        entity.smsPassTag,
      );
    } catch {
      this.logger.error('Failed to decrypt SMTP password');
    }

    return {
      host: entity.smsHost,
      port: entity.smsPort,
      user: entity.smsUser,
      maskedPass: this.maskPassword(plainPass),
      from: entity.smsFrom,
      secure: entity.smsSecure,
      updatedAt: entity.smsUpdatedAt?.toISOString() ?? null,
    };
  }

  async updateSettings(
    dto: UpdateSmtpSettingsRequest,
    userId: string,
  ): Promise<SmtpSettingsResponse> {
    let entity = await this.smtpRepository.findOne({ where: {} });

    if (!entity) {
      entity = this.smtpRepository.create();
    }

    entity.smsHost = dto.host;
    entity.smsPort = dto.port;
    entity.smsUser = dto.user;
    entity.smsFrom = dto.from;
    entity.smsSecure = dto.secure;
    entity.smsUpdatedBy = userId;

    if (dto.pass) {
      const { encrypted, iv, tag } = this.cryptoService.encrypt(dto.pass);
      entity.smsPassEncrypted = encrypted;
      entity.smsPassIv = iv;
      entity.smsPassTag = tag;
    }

    const saved = await this.smtpRepository.save(entity);

    let plainPass = '';
    try {
      plainPass = this.cryptoService.decrypt(
        saved.smsPassEncrypted,
        saved.smsPassIv,
        saved.smsPassTag,
      );
    } catch {
      this.logger.error('Failed to decrypt SMTP password');
    }

    return {
      host: saved.smsHost,
      port: saved.smsPort,
      user: saved.smsUser,
      maskedPass: this.maskPassword(plainPass),
      from: saved.smsFrom,
      secure: saved.smsSecure,
      updatedAt: saved.smsUpdatedAt?.toISOString() ?? null,
    };
  }

  async testConnection(dto: UpdateSmtpSettingsRequest): Promise<{ success: boolean; message: string }> {
    let pass = dto.pass || '';

    if (!pass) {
      const entity = await this.smtpRepository.findOne({ where: {} });
      if (entity) {
        try {
          pass = this.cryptoService.decrypt(
            entity.smsPassEncrypted,
            entity.smsPassIv,
            entity.smsPassTag,
          );
        } catch {
          throw new BusinessException(
            ERROR_CODE.SMTP_TEST_FAILED.code,
            'Failed to decrypt stored SMTP password.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        pass = this.configService.get<string>('SMTP_PASS', '');
      }
    }

    try {
      const transporter = nodemailer.createTransport({
        host: dto.host,
        port: dto.port,
        secure: dto.secure,
        auth: {
          user: dto.user,
          pass,
        },
      });

      await transporter.verify();
      return { success: true, message: 'SMTP connection successful.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`SMTP test failed: ${message}`);
      throw new BusinessException(
        ERROR_CODE.SMTP_TEST_FAILED.code,
        `SMTP connection test failed: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getDecryptedSettings(): Promise<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
  } | null> {
    const entity = await this.smtpRepository.findOne({ where: {} });
    if (!entity) return null;

    try {
      const pass = this.cryptoService.decrypt(
        entity.smsPassEncrypted,
        entity.smsPassIv,
        entity.smsPassTag,
      );
      return {
        host: entity.smsHost,
        port: entity.smsPort,
        user: entity.smsUser,
        pass,
        from: entity.smsFrom,
        secure: entity.smsSecure,
      };
    } catch {
      this.logger.error('Failed to decrypt SMTP settings');
      return null;
    }
  }

  private maskPassword(pass: string): string {
    if (!pass) return '';
    if (pass.length <= 4) return '****';
    return '****' + pass.slice(-4);
  }
}
