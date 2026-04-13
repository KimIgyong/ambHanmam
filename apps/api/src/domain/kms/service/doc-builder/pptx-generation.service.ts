import { Injectable, Logger } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { DocTypeEntity } from '../../entity/doc-type.entity';

interface SectionContent {
  code: string;
  name: string;
  order: number;
  content: string;
}

interface GenerateDto {
  audience: string;
  language: string;
  format: string;
  title?: string;
}

// Brand constants
const BRAND = {
  primary: 'F5841F', // amoeba orange
  secondary: '1E293B', // dark slate
  accent: '3B82F6', // blue
  background: 'FFFFFF',
  textDark: '1E293B',
  textLight: '64748B',
  fontTitle: 'Pretendard',
  fontBody: 'Pretendard',
};

@Injectable()
export class PptxGenerationService {
  private readonly logger = new Logger(PptxGenerationService.name);

  async generate(
    sections: SectionContent[],
    dto: GenerateDto,
    docType: DocTypeEntity,
  ): Promise<Buffer> {
    const pptx = new PptxGenJS();

    pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 });
    pptx.layout = 'CUSTOM';

    // Cover slide
    this.addCoverSlide(pptx, dto, docType);

    // Content slides
    for (const section of sections) {
      if (section.code === 'COVER') continue;
      this.addContentSlide(pptx, section);
    }

    // Thank you slide
    this.addClosingSlide(pptx, dto);

    const data = await pptx.write({ outputType: 'nodebuffer' });
    return data as Buffer;
  }

  private addCoverSlide(pptx: PptxGenJS, dto: GenerateDto, docType: DocTypeEntity): void {
    const slide = pptx.addSlide();

    // Background
    slide.background = { color: BRAND.secondary };

    // Logo placeholder
    slide.addText('amoeba', {
      x: 0.8,
      y: 0.5,
      w: 3,
      h: 0.5,
      fontSize: 18,
      color: BRAND.primary,
      fontFace: BRAND.fontTitle,
      bold: true,
    });

    // Title
    const title = dto.title || (dto.language === 'ko' ? docType.dtpNameKr : docType.dtpName);
    slide.addText(title, {
      x: 0.8,
      y: 2.5,
      w: 11,
      h: 1.5,
      fontSize: 36,
      color: BRAND.background,
      fontFace: BRAND.fontTitle,
      bold: true,
    });

    // Subtitle
    const audienceLabel = dto.audience.charAt(0) + dto.audience.slice(1).toLowerCase();
    slide.addText(`For ${audienceLabel} · ${new Date().getFullYear()}`, {
      x: 0.8,
      y: 4.2,
      w: 11,
      h: 0.6,
      fontSize: 16,
      color: BRAND.textLight,
      fontFace: BRAND.fontBody,
    });

    // Orange accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 4.0,
      w: 2,
      h: 0.05,
      fill: { color: BRAND.primary },
    });
  }

  private addContentSlide(pptx: PptxGenJS, section: SectionContent): void {
    const lines = section.content.split('\n').filter((l) => l.trim());

    // Split content into chunks that fit one slide
    const chunks = this.chunkContent(lines, 12);

    for (let i = 0; i < chunks.length; i++) {
      const slide = pptx.addSlide();

      // Header bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.05,
        fill: { color: BRAND.primary },
      });

      // Section title
      const titleSuffix = chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : '';
      slide.addText(section.name + titleSuffix, {
        x: 0.8,
        y: 0.4,
        w: 11,
        h: 0.6,
        fontSize: 22,
        color: BRAND.textDark,
        fontFace: BRAND.fontTitle,
        bold: true,
      });

      // Content - convert markdown lines to formatted text
      const textBody = this.markdownToSlideText(chunks[i]);
      slide.addText(textBody, {
        x: 0.8,
        y: 1.3,
        w: 11.5,
        h: 5.5,
        fontSize: 12,
        color: BRAND.textDark,
        fontFace: BRAND.fontBody,
        valign: 'top',
        paraSpaceBefore: 4,
        lineSpacingMultiple: 1.3,
      });

      // Page number
      slide.addText(`${section.order}`, {
        x: 12.0,
        y: 7.0,
        w: 0.8,
        h: 0.3,
        fontSize: 9,
        color: BRAND.textLight,
        align: 'right',
      });
    }
  }

  private addClosingSlide(pptx: PptxGenJS, dto: GenerateDto): void {
    const slide = pptx.addSlide();
    slide.background = { color: BRAND.secondary };

    const thankYou: Record<string, string> = {
      en: 'Thank You',
      ko: '감사합니다',
      vi: 'Cảm ơn',
    };

    slide.addText(thankYou[dto.language] || thankYou.en, {
      x: 0,
      y: 2.5,
      w: 13.33,
      h: 2,
      fontSize: 42,
      color: BRAND.background,
      fontFace: BRAND.fontTitle,
      bold: true,
      align: 'center',
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 5.66,
      y: 4.5,
      w: 2,
      h: 0.05,
      fill: { color: BRAND.primary },
    });
  }

  private markdownToSlideText(lines: string[]): string {
    return lines
      .map((line) => {
        // Remove markdown headers
        line = line.replace(/^#{1,4}\s+/, '');
        // Convert bold
        line = line.replace(/\*\*(.*?)\*\*/g, '$1');
        // Convert list items
        line = line.replace(/^[-*]\s+/, '• ');
        // Convert numbered lists
        line = line.replace(/^\d+\.\s+/, '• ');
        return line;
      })
      .join('\n');
  }

  private chunkContent(lines: string[], maxLines: number): string[][] {
    const chunks: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      current.push(line);
      if (current.length >= maxLines) {
        chunks.push(current);
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current);
    if (chunks.length === 0) chunks.push(['']);

    return chunks;
  }
}
