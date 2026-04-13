import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private getAuthConfig(): { keyFile?: string; credentials?: Record<string, unknown> } | null {
    const keyPath = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
    if (keyPath) return { keyFile: keyPath };

    const keyJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
    if (keyJson) {
      try {
        return { credentials: JSON.parse(keyJson) };
      } catch {
        try {
          return { credentials: JSON.parse(Buffer.from(keyJson, 'base64').toString()) };
        } catch {
          this.logger.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
          return null;
        }
      }
    }
    return null;
  }

  private initialize(): void {
    const authConfig = this.getAuthConfig();
    if (!authConfig) {
      this.logger.warn('Google Sheets not configured: Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
      return;
    }

    try {
      const impersonateEmail = this.configService.get<string>('GOOGLE_DRIVE_IMPERSONATE_EMAIL');
      const auth = new google.auth.GoogleAuth({
        ...authConfig,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        ...(impersonateEmail ? { clientOptions: { subject: impersonateEmail } } : {}),
      });
      this.sheets = google.sheets({ version: 'v4', auth });
      this.logger.log('Google Sheets service initialized successfully');
    } catch (error) {
      this.logger.warn(`Google Sheets initialization failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return this.sheets !== null;
  }

  /**
   * Extract spreadsheet ID from a Google Sheets URL.
   * Supports formats like:
   * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
   */
  extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get all sheet (tab) names in a spreadsheet.
   */
  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    const sheets = this.ensureConfigured();

    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    return res.data.sheets?.map((s: sheets_v4.Schema$Sheet) => s.properties?.title || '') || [];
  }

  /**
   * Read data from a specific sheet range.
   * @param spreadsheetId The spreadsheet ID
   * @param range The A1 notation range (e.g. "Sheet1!A1:E10" or just "Sheet1")
   * @returns 2D array of cell values
   */
  async readSheetData(spreadsheetId: string, range: string): Promise<string[][]> {
    const sheets = this.ensureConfigured();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    return (res.data.values as string[][]) || [];
  }

  private ensureConfigured(): sheets_v4.Sheets {
    if (!this.sheets) {
      throw new Error('Google Sheets is not configured');
    }
    return this.sheets;
  }
}
