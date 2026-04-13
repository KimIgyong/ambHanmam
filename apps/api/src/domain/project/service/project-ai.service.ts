import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService, AiUsageContext } from '../../../infrastructure/external/claude/claude.service';
import {
  PROPOSAL_DRAFT_PROMPT,
  SIMILAR_PROJECTS_PROMPT,
  PRE_ANALYSIS_PROMPT,
  RECOMMENDATION_PROMPT,
} from './project-ai-prompt.constant';

export interface ProposalDraft {
  purpose: string;
  goal: string;
  summary: string;
  suggestedTags: string[];
  category: string;
  priority: string;
  estimatedDuration: string;
}

export interface SimilarProject {
  projectId: string;
  projectName: string;
  similarityScore: number;
  reason: string;
}

export interface PreAnalysis {
  feasibilityScore: number;
  risks: { category: string; description: string; severity: string; mitigation: string }[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  conditions: string[];
  estimatedROI: string;
  resourceRequirements: string;
}

export interface Recommendation {
  recommendation: string;
  confidence: number;
  rationale: string;
  keyConsiderations: string[];
  suggestedConditions: string[];
  riskSummary: string;
}

@Injectable()
export class ProjectAiService {
  private readonly logger = new Logger(ProjectAiService.name);

  constructor(private readonly claudeService: ClaudeService) {}

  async generateProposalDraft(
    title: string,
    briefDescription: string,
    category?: string,
    language?: string,
    usageContext?: AiUsageContext,
  ): Promise<ProposalDraft> {
    const userMessage = [
      `Project Title: ${title}`,
      `Brief Description: ${briefDescription}`,
      category ? `Preferred Category: ${category}` : '',
      `Language: ${language || 'English'}`,
    ].filter(Boolean).join('\n');

    try {
      const response = await this.claudeService.sendMessage(
        PROPOSAL_DRAFT_PROMPT,
        [{ role: 'user', content: userMessage }],
        { usageContext },
      );
      return this.parseJson<ProposalDraft>(response, {
        purpose: '',
        goal: '',
        summary: '',
        suggestedTags: [],
        category: category || 'OTHER',
        priority: 'MEDIUM',
        estimatedDuration: '3',
      });
    } catch (error) {
      this.logger.error(`Proposal draft generation failed: ${error}`);
      throw error;
    }
  }

  async findSimilarProjects(
    title: string,
    summary: string,
    existingProjects: { id: string; name: string; summary: string; category: string }[],
    usageContext?: AiUsageContext,
  ): Promise<SimilarProject[]> {
    if (!existingProjects.length) return [];

    const userMessage = [
      `New Project Title: ${title}`,
      `New Project Summary: ${summary}`,
      '',
      'Existing Projects:',
      ...existingProjects.map((p, i) =>
        `${i + 1}. ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Summary: ${p.summary?.slice(0, 200) || 'N/A'}`,
      ),
    ].join('\n');

    try {
      const response = await this.claudeService.sendMessage(
        SIMILAR_PROJECTS_PROMPT,
        [{ role: 'user', content: userMessage }],
        { usageContext },
      );
      const parsed = this.parseJson<{ similarProjects: SimilarProject[] }>(response, { similarProjects: [] });
      return parsed.similarProjects || [];
    } catch (error) {
      this.logger.error(`Similar projects search failed: ${error}`);
      return [];
    }
  }

  async generatePreAnalysis(
    name: string,
    purpose: string,
    goal: string,
    summary: string,
    budget?: number,
    duration?: string,
    usageContext?: AiUsageContext,
  ): Promise<PreAnalysis> {
    const userMessage = [
      `Project Name: ${name}`,
      `Purpose: ${purpose}`,
      `Goals: ${goal}`,
      `Summary: ${summary}`,
      budget ? `Budget: ${budget}` : '',
      duration ? `Estimated Duration: ${duration}` : '',
    ].filter(Boolean).join('\n');

    try {
      const response = await this.claudeService.sendMessage(
        PRE_ANALYSIS_PROMPT,
        [{ role: 'user', content: userMessage }],
        { usageContext },
      );
      return this.parseJson<PreAnalysis>(response, {
        feasibilityScore: 5,
        risks: [],
        strengths: [],
        weaknesses: [],
        recommendation: 'CONDITIONAL',
        conditions: [],
        estimatedROI: 'N/A',
        resourceRequirements: 'N/A',
      });
    } catch (error) {
      this.logger.error(`Pre-analysis generation failed: ${error}`);
      throw error;
    }
  }

  async generateRecommendation(
    name: string,
    summary: string,
    preAnalysis: PreAnalysis,
    reviewHistory: { action: string; comment: string; step: number }[],
    usageContext?: AiUsageContext,
  ): Promise<Recommendation> {
    const userMessage = [
      `Project Name: ${name}`,
      `Summary: ${summary}`,
      '',
      `Pre-Analysis:`,
      JSON.stringify(preAnalysis, null, 2),
      '',
      `Review History:`,
      ...reviewHistory.map((r) =>
        `Step ${r.step}: ${r.action} - ${r.comment || 'No comment'}`,
      ),
    ].join('\n');

    try {
      const response = await this.claudeService.sendMessage(
        RECOMMENDATION_PROMPT,
        [{ role: 'user', content: userMessage }],
        { usageContext },
      );
      return this.parseJson<Recommendation>(response, {
        recommendation: 'CONDITIONAL',
        confidence: 0.5,
        rationale: 'Unable to generate recommendation',
        keyConsiderations: [],
        suggestedConditions: [],
        riskSummary: 'N/A',
      });
    } catch (error) {
      this.logger.error(`Recommendation generation failed: ${error}`);
      throw error;
    }
  }

  private parseJson<T>(response: string, fallback: T): T {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return fallback;
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      this.logger.warn('Failed to parse AI JSON response');
      return fallback;
    }
  }
}
