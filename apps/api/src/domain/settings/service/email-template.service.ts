import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EmailTemplateEntity } from '../entity/email-template.entity';
import { UpsertEmailTemplateRequest } from '../dto/request/upsert-email-template.request';

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  ACCOUNT_CREATED: {
    subject: '[AMB Management] Your account has been created',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
  <h2 style="color: #4F46E5; margin: 0 0 16px 0;">AMB Management</h2>
  <p style="font-size:15px; color:#111827;">Hello <strong>{{userName}}</strong>,</p>
  <p style="color:#374151;">Your account has been created based on your portal subscription.</p>
  <table style="border-left:3px solid #4F46E5; padding-left:12px; margin:16px 0; border-spacing:0;">
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Login Email:</strong></td><td style="color:#111827;">{{userEmail}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Temporary Password:</strong></td><td style="color:#111827; font-family:monospace;">{{tempPassword}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Company Code:</strong></td><td style="color:#111827; font-family:monospace; font-weight:bold;">{{entityCode}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Entity:</strong></td><td style="color:#111827;">{{entityName}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Role:</strong></td><td style="color:#111827;">{{role}}</td></tr>
  </table>
  <p style="color:#374151; font-size:14px;">Please login and change your password after the first login:</p>
  <a href="{{loginUrl}}" style="display:inline-block; background:#4F46E5; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; margin:8px 0 24px 0;">
    Login Now
  </a>
  <p style="color:#6B7280; font-size:13px;">If the button doesn't work, copy and paste this link: {{loginUrl}}</p>
  <hr style="border:none; border-top:1px solid #E5E7EB; margin:20px 0;" />
  <p style="color:#9CA3AF; font-size:12px;">This email was sent by AMB Management System.</p>
</div>`,
  },
  SETUP_COMPLETE: {
    subject: '[AMB Management] Your account setup is complete',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
  <h2 style="color: #4F46E5; margin: 0 0 16px 0;">AMB Management</h2>
  <p style="font-size:15px; color:#111827;">Hello <strong>{{userName}}</strong>,</p>
  <p style="color:#374151;">Your account setup has been completed successfully.<br/>Here are your login details:</p>
  <table style="border-left:3px solid #4F46E5; padding-left:12px; margin:16px 0; border-spacing:0;">
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Login Email:</strong></td><td style="color:#111827;">{{userEmail}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Password:</strong></td><td style="color:#111827; font-family:monospace;">{{maskedPassword}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Company Code:</strong></td><td style="color:#111827; font-family:monospace; font-weight:bold;">{{entityCode}}</td></tr>
    <tr><td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Company:</strong></td><td style="color:#111827;">{{entityName}}</td></tr>
  </table>
  <p style="color:#DC2626; font-size:13px; margin:8px 0 16px 0;">⚠ For security, please memorize your password and delete this email.</p>
  <a href="{{loginUrl}}" style="display:inline-block; background:#4F46E5; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; margin:8px 0 24px 0;">Login Now</a>
  <p style="color:#6B7280; font-size:13px;">If the button doesn't work, copy and paste this link: {{loginUrl}}</p>
  <hr style="border:none; border-top:1px solid #E5E7EB; margin:20px 0;" />
  <p style="color:#9CA3AF; font-size:12px;">This email was sent by AMB Management System.</p>
</div>`,
  },
  INVITATION: {
    subject: '[{{companyName}}] AMB Management - Invitation',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
  <h2 style="color: #4F46E5; font-size:22px; margin:0 0 16px 0;">{{companyName}}</h2>
  <p style="font-size:15px; color:#111827;">You have been invited by <strong>{{inviterName}}</strong> to join <strong>{{companyName}}</strong>.</p>
  <table style="border-left:3px solid #4F46E5; padding-left:12px; margin:16px 0; border-spacing:0;">
    <tr><td style="color:#6B7280; padding:2px 8px 2px 0;"><strong>Role:</strong></td><td style="color:#111827;">{{role}}</td></tr>
    <tr><td style="color:#6B7280; padding:2px 8px 2px 0;"><strong>Department:</strong></td><td style="color:#111827;">{{department}}</td></tr>
  </table>
  <p style="color:#374151; font-size:14px;">Click the link below to complete your registration:</p>
  <a href="{{inviteLink}}" style="display:inline-block; background:#4F46E5; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; margin:8px 0 24px 0;">
    Accept Invitation
  </a>
  <p style="color:#6B7280; font-size:13px;">This invitation expires in 7 days.</p>
  <hr style="border:none; border-top:1px solid #E5E7EB; margin:20px 0;" />
  <p style="color:#9CA3AF; font-size:12px;">This email was sent by AMB Management on behalf of {{companyName}}.<br/>If the button doesn't work, copy and paste this link: {{inviteLink}}</p>
</div>`,
  },
};

const SAMPLE_VARIABLES: Record<string, Record<string, string>> = {
  ACCOUNT_CREATED: {
    userName: 'Hong Gil-dong',
    userEmail: 'hong@example.com',
    tempPassword: 'Abc123xyz',
    loginUrl: 'https://ama.amoeba.site/VN01/login',
    entityCode: 'VN01',
    entityName: 'Amoeba Global',
    role: 'STAFF',
  },
  SETUP_COMPLETE: {
    userName: 'Hong Gil-dong',
    userEmail: 'hong@example.com',
    maskedPassword: 'M********4',
    loginUrl: 'https://ama.amoeba.site/VN01/login',
    entityCode: 'VN01',
    entityName: 'Amoeba Global',
  },
  INVITATION: {
    userName: 'Hong Gil-dong',
    inviterName: 'Admin',
    companyName: 'Amoeba Global',
    role: 'STAFF',
    department: 'Engineering',
    inviteLink: 'https://ama.amoeba.site/register?invitation_token=sample-token',
  },
};

@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly repo: Repository<EmailTemplateEntity>,
  ) {}

  /** {{변수명}} 패턴 치환 */
  renderTemplate(source: string, variables: Record<string, string>): string {
    return source.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  getDefaultTemplate(code: string): { subject: string; body: string } {
    return DEFAULT_TEMPLATES[code] ?? { subject: `[AMB] ${code}`, body: '' };
  }

  /** DB 템플릿 또는 기본값으로 변수 치환된 {subject, html} 반환 */
  async resolve(
    code: string,
    variables: Record<string, string>,
    entId?: string | null,
  ): Promise<{ subject: string; html: string }> {
    const template = entId
      ? (await this.repo.findOne({ where: { entId, emtCode: code } })) ??
        (await this.repo.findOne({ where: { entId: IsNull(), emtCode: code } }))
      : await this.repo.findOne({ where: { entId: IsNull(), emtCode: code } });

    const { subject, body } = template
      ? { subject: template.emtSubject, body: template.emtBody }
      : this.getDefaultTemplate(code);

    return {
      subject: this.renderTemplate(subject, variables),
      html: this.renderTemplate(body, variables),
    };
  }

  // ── ADMIN 전역 템플릿 관리 (ent_id = NULL) ──

  async getGlobalTemplate(code: string) {
    return this.repo.findOne({ where: { entId: IsNull(), emtCode: code } });
  }

  async upsertGlobalTemplate(
    code: string,
    dto: UpsertEmailTemplateRequest,
    userId: string,
  ): Promise<EmailTemplateEntity> {
    let entity = await this.repo.findOne({ where: { entId: IsNull(), emtCode: code } });
    if (entity) {
      entity.emtSubject = dto.subject;
      entity.emtBody = dto.body;
      entity.emtUpdatedBy = userId;
    } else {
      entity = this.repo.create({
        entId: null,
        emtCode: code,
        emtSubject: dto.subject,
        emtBody: dto.body,
        emtUpdatedBy: userId,
      });
    }
    return this.repo.save(entity);
  }

  async deleteGlobalTemplate(code: string): Promise<void> {
    await this.repo.delete({ entId: IsNull(), emtCode: code });
  }

  // ── MASTER 법인별 템플릿 관리 (ent_id = 법인UUID) ──

  async getEntityTemplate(code: string, entId: string) {
    return this.repo.findOne({ where: { entId, emtCode: code } });
  }

  async upsertEntityTemplate(
    code: string,
    entId: string,
    dto: UpsertEmailTemplateRequest,
    userId: string,
  ): Promise<EmailTemplateEntity> {
    let entity = await this.repo.findOne({ where: { entId, emtCode: code } });
    if (entity) {
      entity.emtSubject = dto.subject;
      entity.emtBody = dto.body;
      entity.emtUpdatedBy = userId;
    } else {
      entity = this.repo.create({
        entId,
        emtCode: code,
        emtSubject: dto.subject,
        emtBody: dto.body,
        emtUpdatedBy: userId,
      });
    }
    return this.repo.save(entity);
  }

  async deleteEntityTemplate(code: string, entId: string): Promise<void> {
    await this.repo.delete({ entId, emtCode: code });
  }

  /** 미리보기용: DB 또는 기본값을 샘플 데이터로 렌더링 */
  async preview(code: string, entId?: string | null) {
    const variables = SAMPLE_VARIABLES[code] ?? {};
    return this.resolve(code, variables, entId);
  }

  toResponse(entity: EmailTemplateEntity | null, code: string) {
    if (!entity) {
      const def = this.getDefaultTemplate(code);
      return { code, subject: def.subject, body: def.body, isCustom: false, updatedAt: null };
    }
    return {
      code: entity.emtCode,
      subject: entity.emtSubject,
      body: entity.emtBody,
      isCustom: true,
      updatedAt: entity.emtUpdatedAt?.toISOString() ?? null,
    };
  }
}
