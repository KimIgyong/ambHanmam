import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getItPrompt } from '../prompt/it.prompt';
import * as fs from 'fs';
import * as path from 'path';

interface PromptCache {
  expiresAt: number;
  context: string;
}

@Injectable()
export class ItAgentService extends BaseAgentService {
  private static cache: PromptCache | null = null;

  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }

  get unitCode(): UnitCode {
    return 'IT';
  }

  getSystemPrompt(): string {
    return getItPrompt(this.buildKnowledgeContext());
  }

  private buildKnowledgeContext(): string {
    const now = Date.now();
    if (ItAgentService.cache && now < ItAgentService.cache.expiresAt) {
      return ItAgentService.cache.context;
    }

    const docsRoot = path.resolve(process.cwd(), 'docs');
    const sourceDirs = ['plan', 'implementation', 'analysis'];
    const summaries: string[] = [];

    for (const dir of sourceDirs) {
      const fullDir = path.join(docsRoot, dir);
      if (!fs.existsSync(fullDir)) continue;

      const files = fs.readdirSync(fullDir)
        .filter((name) => name.endsWith('.md'))
        .map((name) => ({
          name,
          fullPath: path.join(fullDir, name),
          mtime: fs.statSync(path.join(fullDir, name)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 5);

      for (const file of files) {
        try {
          const content = fs.readFileSync(file.fullPath, 'utf-8');
          const headings = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('#'))
            .slice(0, 8)
            .join(' | ');

          if (headings) {
            summaries.push(`- ${dir}/${file.name}: ${headings}`);
          }
        } catch {
          // ignore unreadable docs
        }
      }
    }

    const context = summaries.length > 0
      ? summaries.join('\n')
      : 'No recent plan/implementation/analysis documents were indexed.';

    ItAgentService.cache = {
      context,
      expiresAt: now + 5 * 60 * 1000,
    };

    return context;
  }
}
