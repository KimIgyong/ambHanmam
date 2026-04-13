import { Injectable, Logger } from '@nestjs/common';

export interface ParsedDocument {
  type: 'docx' | 'pptx' | 'pdf';
  rawText: string;
  sections?: { title: string; content: string; level: number }[];
  slides?: { slideNumber: number; title: string; content: string; notes?: string }[];
  metadata?: { author?: string; title?: string; created?: string };
}

@Injectable()
export class DocParserService {
  private readonly logger = new Logger(DocParserService.name);

  /**
   * Route to the appropriate parser based on MIME type or file extension.
   */
  async parse(buffer: Buffer, mimeType: string): Promise<ParsedDocument> {
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'docx'
    ) {
      return this.parseDocx(buffer);
    }
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      mimeType === 'pptx'
    ) {
      return this.parsePptx(buffer);
    }
    if (mimeType === 'application/pdf' || mimeType === 'pdf') {
      return this.parsePdf(buffer);
    }
    // Fallback: treat as plain text
    return {
      type: 'docx',
      rawText: this.fallbackTextExtraction(buffer),
    };
  }

  /**
   * Parse DOCX using mammoth (dynamic import to avoid hard dependency).
   */
  async parseDocx(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const mammoth = await import('mammoth');
      const [rawResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer }),
      ]);

      const rawText = rawResult.value;
      const sections = this.extractSectionsFromDocx(rawText);
      const metadata = this.extractMetadataFromHtml(htmlResult.value);

      return { type: 'docx', rawText, sections, metadata };
    } catch (error) {
      this.logger.warn(`mammoth parsing failed, falling back: ${error}`);
      return {
        type: 'docx',
        rawText: this.fallbackTextExtraction(buffer),
      };
    }
  }

  /**
   * Parse PPTX using jszip + XML <a:t> tag extraction.
   */
  async parsePptx(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);

      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
        .sort();

      const slides: ParsedDocument['slides'] = [];
      const allTexts: string[] = [];

      for (let i = 0; i < slideFiles.length; i++) {
        const slideName = slideFiles[i];
        const content = await zip.files[slideName].async('string');

        // Extract text from <a:t> tags
        const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        const texts = textMatches
          ? textMatches.map((m) => m.replace(/<\/?a:t>/g, ''))
          : [];
        const slideText = texts.join(' ');
        const firstLine = texts[0] || `Slide ${i + 1}`;

        // Try to extract notes
        const noteFile = `ppt/notesSlides/notesSlide${i + 1}.xml`;
        let notes: string | undefined;
        if (zip.files[noteFile]) {
          const noteContent = await zip.files[noteFile].async('string');
          const noteMatches = noteContent.match(/<a:t>([^<]*)<\/a:t>/g);
          if (noteMatches) {
            notes = noteMatches.map((m) => m.replace(/<\/?a:t>/g, '')).join(' ');
          }
        }

        slides.push({
          slideNumber: i + 1,
          title: firstLine.substring(0, 200),
          content: slideText,
          notes,
        });
        allTexts.push(slideText);
      }

      return {
        type: 'pptx',
        rawText: allTexts.join('\n\n'),
        slides,
      };
    } catch (error) {
      this.logger.warn(`PPTX parsing failed, falling back: ${error}`);
      return {
        type: 'pptx',
        rawText: this.fallbackTextExtraction(buffer),
      };
    }
  }

  /**
   * Parse PDF using pdf-parse.
   */
  async parsePdf(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);

      const sections = this.extractSectionsFromText(data.text);
      const metadata: ParsedDocument['metadata'] = {};
      if (data.info) {
        metadata.author = data.info.Author;
        metadata.title = data.info.Title;
        metadata.created = data.info.CreationDate;
      }

      return { type: 'pdf', rawText: data.text, sections, metadata };
    } catch (error) {
      this.logger.warn(`PDF parsing failed, falling back: ${error}`);
      return {
        type: 'pdf',
        rawText: this.fallbackTextExtraction(buffer),
      };
    }
  }

  /**
   * Extract heading-based sections from plain text (DOCX/PDF).
   */
  private extractSectionsFromDocx(text: string): ParsedDocument['sections'] {
    return this.extractSectionsFromText(text);
  }

  private extractSectionsFromText(text: string): ParsedDocument['sections'] {
    const sections: NonNullable<ParsedDocument['sections']> = [];
    // Match lines that look like headings: start with uppercase, length 3-80
    const lines = text.split('\n');
    let currentSection: { title: string; content: string; level: number } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentSection) currentSection.content += '\n';
        continue;
      }

      // Detect heading-like lines
      const isHeading =
        trimmed.length >= 3 &&
        trimmed.length <= 80 &&
        /^[A-Z0-9\u3131-\uD79D]/.test(trimmed) &&
        !trimmed.endsWith('.') &&
        !trimmed.endsWith(',');

      if (isHeading && trimmed.length < 60) {
        if (currentSection && currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed, content: '', level: 1 };
      } else if (currentSection) {
        currentSection.content += trimmed + '\n';
      } else {
        currentSection = { title: 'Introduction', content: trimmed + '\n', level: 1 };
      }
    }

    if (currentSection && currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : undefined;
  }

  private extractMetadataFromHtml(html: string): ParsedDocument['metadata'] {
    const metadata: ParsedDocument['metadata'] = {};
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) metadata.title = titleMatch[1];
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  /**
   * Fallback: extract readable strings from buffer.
   */
  fallbackTextExtraction(buffer: Buffer): string {
    const text = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    return text.substring(0, 10000);
  }
}
