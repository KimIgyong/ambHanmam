import { Injectable, Logger } from '@nestjs/common';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
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

const BRAND_COLOR = 'F5841F';

@Injectable()
export class DocxGenerationService {
  private readonly logger = new Logger(DocxGenerationService.name);

  async generate(
    sections: SectionContent[],
    dto: GenerateDto,
    docType: DocTypeEntity,
  ): Promise<Buffer> {
    const title = dto.title || (dto.language === 'ko' ? docType.dtpNameKr : docType.dtpName);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Pretendard', size: 22, color: '1E293B' },
          },
          heading1: {
            run: { font: 'Pretendard', size: 32, bold: true, color: '1E293B' },
            paragraph: { spacing: { before: 400, after: 200 } },
          },
          heading2: {
            run: { font: 'Pretendard', size: 26, bold: true, color: BRAND_COLOR },
            paragraph: { spacing: { before: 300, after: 150 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'amoeba',
                      font: 'Pretendard',
                      bold: true,
                      color: BRAND_COLOR,
                      size: 16,
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                      font: 'Pretendard',
                      size: 16,
                      color: '94A3B8',
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [
            // Cover title
            new Paragraph({ spacing: { before: 2000 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  font: 'Pretendard',
                  size: 52,
                  bold: true,
                  color: '1E293B',
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 200 },
              children: [
                new TextRun({
                  text: `For ${dto.audience} · ${new Date().getFullYear()}`,
                  font: 'Pretendard',
                  size: 24,
                  color: '64748B',
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 100 },
              border: {
                bottom: { color: BRAND_COLOR, size: 6, style: BorderStyle.SINGLE, space: 1 },
              },
              children: [],
            }),
            new Paragraph({ spacing: { before: 800 } }),

            // Section contents
            ...sections.flatMap((section) =>
              section.code === 'COVER' ? [] : this.markdownToParagraphs(section),
            ),
          ],
        },
      ],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  private markdownToParagraphs(section: SectionContent): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.name, bold: true })],
      }),
    );

    // Parse markdown content
    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ spacing: { before: 100 } }));
        continue;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: trimmed.replace(/^#\s+/, '') })],
          }),
        );
      } else if (trimmed.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: trimmed.replace(/^##\s+/, '') })],
          }),
        );
      } else if (trimmed.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: trimmed.replace(/^###\s+/, ''),
                bold: true,
                size: 24,
              }),
            ],
          }),
        );
      }
      // Bullet points
      else if (trimmed.match(/^[-*]\s+/)) {
        const text = trimmed.replace(/^[-*]\s+/, '');
        paragraphs.push(
          new Paragraph({
            spacing: { before: 40 },
            children: [
              new TextRun({ text: '• ', bold: true, color: BRAND_COLOR }),
              ...this.parseInlineFormatting(text),
            ],
          }),
        );
      }
      // Numbered lists
      else if (trimmed.match(/^\d+\.\s+/)) {
        const text = trimmed.replace(/^\d+\.\s+/, '');
        const num = trimmed.match(/^(\d+)\./)?.[1] || '';
        paragraphs.push(
          new Paragraph({
            spacing: { before: 40 },
            children: [
              new TextRun({ text: `${num}. `, bold: true, color: BRAND_COLOR }),
              ...this.parseInlineFormatting(text),
            ],
          }),
        );
      }
      // Regular text
      else {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 60 },
            children: this.parseInlineFormatting(trimmed),
          }),
        );
      }
    }

    return paragraphs;
  }

  private parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*.*?\*\*)/g);

    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else if (part) {
        runs.push(new TextRun({ text: part }));
      }
    }

    return runs.length > 0 ? runs : [new TextRun({ text })];
  }
}
