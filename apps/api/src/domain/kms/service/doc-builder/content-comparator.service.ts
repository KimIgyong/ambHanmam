import { Injectable, Logger } from '@nestjs/common';

export interface SectionDiff {
  sectionCode: string;
  sectionName: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  originalText: string;
  uploadedText: string;
  similarity: number; // 0-1
  changes: LineChange[];
}

export interface LineChange {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumber?: number;
}

export interface DataUpdateProposal {
  categoryCode: string;
  categoryName: string;
  field: string;
  currentValue: any;
  proposedValue: any;
  reason: string;
  confidence: number; // 0-1
  source: 'DIFF_DETECTED' | 'AI_SUGGESTED';
}

@Injectable()
export class ContentComparatorService {
  private readonly logger = new Logger(ContentComparatorService.name);

  compareSections(
    originalSections: { code: string; name: string; content: string }[],
    uploadedSections: { code: string; name: string; content: string }[],
  ): SectionDiff[] {
    const diffs: SectionDiff[] = [];
    const uploadedMap = new Map(uploadedSections.map((s) => [s.code, s]));
    const originalMap = new Map(originalSections.map((s) => [s.code, s]));

    // Check original sections
    for (const orig of originalSections) {
      const uploaded = uploadedMap.get(orig.code);
      if (!uploaded) {
        diffs.push({
          sectionCode: orig.code,
          sectionName: orig.name,
          changeType: 'REMOVED',
          originalText: orig.content,
          uploadedText: '',
          similarity: 0,
          changes: orig.content.split('\n').map((line) => ({ type: 'removed', text: line })),
        });
        continue;
      }

      const similarity = this.calculateSimilarity(orig.content, uploaded.content);
      const changes = this.diffLines(orig.content, uploaded.content);
      const changeType = similarity === 1 ? 'UNCHANGED' : 'MODIFIED';

      diffs.push({
        sectionCode: orig.code,
        sectionName: orig.name,
        changeType,
        originalText: orig.content,
        uploadedText: uploaded.content,
        similarity,
        changes,
      });
    }

    // Check for added sections
    for (const uploaded of uploadedSections) {
      if (!originalMap.has(uploaded.code)) {
        diffs.push({
          sectionCode: uploaded.code,
          sectionName: uploaded.name,
          changeType: 'ADDED',
          originalText: '',
          uploadedText: uploaded.content,
          similarity: 0,
          changes: uploaded.content.split('\n').map((line) => ({ type: 'added', text: line })),
        });
      }
    }

    return diffs;
  }

  extractTextFromContent(content: string): string {
    // Strip markdown formatting for clean text comparison
    return content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .trim();
  }

  calculateSimilarity(textA: string, textB: string): number {
    if (textA === textB) return 1;
    if (!textA || !textB) return 0;

    const wordsA = textA.toLowerCase().split(/\s+/);
    const wordsB = textB.toLowerCase().split(/\s+/);

    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    const intersection = new Set([...setA].filter((w) => setB.has(w)));
    const union = new Set([...setA, ...setB]);

    return union.size === 0 ? 1 : intersection.size / union.size;
  }

  diffLines(original: string, uploaded: string): LineChange[] {
    const origLines = original.split('\n');
    const upLines = uploaded.split('\n');
    const changes: LineChange[] = [];

    // Simple line-by-line diff (LCS-based)
    const lcs = this.longestCommonSubsequence(origLines, upLines);
    let oi = 0;
    let ui = 0;
    let li = 0;

    while (oi < origLines.length || ui < upLines.length) {
      if (li < lcs.length && oi < origLines.length && origLines[oi] === lcs[li]) {
        if (ui < upLines.length && upLines[ui] === lcs[li]) {
          changes.push({ type: 'unchanged', text: lcs[li], lineNumber: ui + 1 });
          oi++;
          ui++;
          li++;
        } else if (ui < upLines.length) {
          changes.push({ type: 'added', text: upLines[ui], lineNumber: ui + 1 });
          ui++;
        }
      } else if (oi < origLines.length) {
        changes.push({ type: 'removed', text: origLines[oi], lineNumber: oi + 1 });
        oi++;
      } else if (ui < upLines.length) {
        changes.push({ type: 'added', text: upLines[ui], lineNumber: ui + 1 });
        ui++;
      }
    }

    return changes;
  }

  private longestCommonSubsequence(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    const result: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }
}
