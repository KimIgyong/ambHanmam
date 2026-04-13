import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AnalysisReportEntity } from '../entity/analysis-report.entity';
import { AnalysisPromptEntity } from '../entity/analysis-prompt.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(AnalysisReportEntity)
    private readonly reportRepo: Repository<AnalysisReportEntity>,
    @InjectRepository(AnalysisPromptEntity)
    private readonly promptRepo: Repository<AnalysisPromptEntity>,
  ) {}

  // ─── Reports ──────────────────────────────────────────

  async getReports(accountId: string, entityId: string) {
    const reports = await this.reportRepo.find({
      where: { bacId: accountId, entId: entityId, anrDeletedAt: IsNull() },
      order: { anrCreatedAt: 'DESC' },
    });
    return reports.map((r) => ({
      reportId: r.anrId,
      accountId: r.bacId,
      title: r.anrTitle,
      content: r.anrContent,
      dateFrom: r.anrDateFrom,
      dateTo: r.anrDateTo,
      promptId: r.anrPromptId,
      createdAt: r.anrCreatedAt,
    }));
  }

  async getReportById(reportId: string, entityId: string) {
    const report = await this.reportRepo.findOne({
      where: { anrId: reportId, entId: entityId, anrDeletedAt: IsNull() },
    });
    if (!report) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }
    return {
      reportId: report.anrId,
      accountId: report.bacId,
      title: report.anrTitle,
      content: report.anrContent,
      dateFrom: report.anrDateFrom,
      dateTo: report.anrDateTo,
      promptId: report.anrPromptId,
      createdAt: report.anrCreatedAt,
    };
  }

  async saveReport(data: {
    accountId: string;
    entityId: string;
    userId: string;
    title: string;
    content: string;
    dateFrom?: string;
    dateTo?: string;
    promptId?: string;
  }) {
    const report = this.reportRepo.create({
      entId: data.entityId,
      bacId: data.accountId,
      usrId: data.userId,
      anrTitle: data.title,
      anrContent: data.content,
      anrDateFrom: data.dateFrom || null,
      anrDateTo: data.dateTo || null,
      anrPromptId: data.promptId || null,
    });
    const saved = await this.reportRepo.save(report);
    return {
      reportId: saved.anrId,
      accountId: saved.bacId,
      title: saved.anrTitle,
      content: saved.anrContent,
      dateFrom: saved.anrDateFrom,
      dateTo: saved.anrDateTo,
      promptId: saved.anrPromptId,
      createdAt: saved.anrCreatedAt,
    };
  }

  async deleteReport(reportId: string, entityId: string) {
    const report = await this.reportRepo.findOne({
      where: { anrId: reportId, entId: entityId, anrDeletedAt: IsNull() },
    });
    if (!report) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }
    await this.reportRepo.softDelete(reportId);
  }

  // ─── Dashboard Chat Reports ─────────────────────────────

  async getChatReports(entityId: string) {
    const reports = await this.reportRepo.find({
      where: { bacId: IsNull() as any, entId: entityId, anrDeletedAt: IsNull() },
      order: { anrCreatedAt: 'DESC' },
    });
    return reports.map((r) => ({
      reportId: r.anrId,
      title: r.anrTitle,
      content: r.anrContent,
      createdAt: r.anrCreatedAt,
    }));
  }

  async saveChatReport(data: { entityId: string; userId: string; title: string; content: string }) {
    const report = this.reportRepo.create({
      entId: data.entityId,
      bacId: null,
      usrId: data.userId,
      anrTitle: data.title,
      anrContent: data.content,
    });
    const saved = await this.reportRepo.save(report);
    return {
      reportId: saved.anrId,
      title: saved.anrTitle,
      content: saved.anrContent,
      createdAt: saved.anrCreatedAt,
    };
  }

  // ─── Prompts ──────────────────────────────────────────

  async getPrompts(entityId: string) {
    const prompts = await this.promptRepo.find({
      where: { entId: entityId, anpDeletedAt: IsNull() },
      order: { anpSortOrder: 'ASC', anpCreatedAt: 'ASC' },
    });
    return prompts.map((p) => ({
      promptId: p.anpId,
      name: p.anpName,
      systemPrompt: p.anpSystemPrompt,
      userPrompt: p.anpUserPrompt,
      isDefault: p.anpIsDefault,
      sortOrder: p.anpSortOrder,
      createdAt: p.anpCreatedAt,
    }));
  }

  async createPrompt(data: {
    entityId: string;
    name: string;
    systemPrompt: string;
    userPrompt: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.promptRepo.update(
        { entId: data.entityId, anpDeletedAt: IsNull() },
        { anpIsDefault: false },
      );
    }
    const prompt = this.promptRepo.create({
      entId: data.entityId,
      anpName: data.name,
      anpSystemPrompt: data.systemPrompt,
      anpUserPrompt: data.userPrompt,
      anpIsDefault: data.isDefault || false,
    });
    const saved = await this.promptRepo.save(prompt);
    return {
      promptId: saved.anpId,
      name: saved.anpName,
      systemPrompt: saved.anpSystemPrompt,
      userPrompt: saved.anpUserPrompt,
      isDefault: saved.anpIsDefault,
      sortOrder: saved.anpSortOrder,
      createdAt: saved.anpCreatedAt,
    };
  }

  async updatePrompt(promptId: string, entityId: string, data: {
    name?: string;
    system_prompt?: string;
    user_prompt?: string;
    is_default?: boolean;
  }) {
    const prompt = await this.promptRepo.findOne({
      where: { anpId: promptId, entId: entityId, anpDeletedAt: IsNull() },
    });
    if (!prompt) {
      throw new HttpException('Prompt not found', HttpStatus.NOT_FOUND);
    }

    if (data.is_default) {
      await this.promptRepo.update(
        { entId: entityId, anpDeletedAt: IsNull() },
        { anpIsDefault: false },
      );
    }

    if (data.name !== undefined) prompt.anpName = data.name;
    if (data.system_prompt !== undefined) prompt.anpSystemPrompt = data.system_prompt;
    if (data.user_prompt !== undefined) prompt.anpUserPrompt = data.user_prompt;
    if (data.is_default !== undefined) prompt.anpIsDefault = data.is_default;

    const saved = await this.promptRepo.save(prompt);
    return {
      promptId: saved.anpId,
      name: saved.anpName,
      systemPrompt: saved.anpSystemPrompt,
      userPrompt: saved.anpUserPrompt,
      isDefault: saved.anpIsDefault,
      sortOrder: saved.anpSortOrder,
      createdAt: saved.anpCreatedAt,
    };
  }

  async deletePrompt(promptId: string, entityId: string) {
    const prompt = await this.promptRepo.findOne({
      where: { anpId: promptId, entId: entityId, anpDeletedAt: IsNull() },
    });
    if (!prompt) {
      throw new HttpException('Prompt not found', HttpStatus.NOT_FOUND);
    }
    await this.promptRepo.softDelete(promptId);
  }

  async getDefaultOrFirstPrompt(entityId: string): Promise<AnalysisPromptEntity | null> {
    const defaultPrompt = await this.promptRepo.findOne({
      where: { entId: entityId, anpIsDefault: true, anpDeletedAt: IsNull() },
    });
    if (defaultPrompt) return defaultPrompt;

    return this.promptRepo.findOne({
      where: { entId: entityId, anpDeletedAt: IsNull() },
      order: { anpSortOrder: 'ASC', anpCreatedAt: 'ASC' },
    });
  }

  async getPromptById(promptId: string, entityId: string): Promise<AnalysisPromptEntity | null> {
    return this.promptRepo.findOne({
      where: { anpId: promptId, entId: entityId, anpDeletedAt: IsNull() },
    });
  }
}
