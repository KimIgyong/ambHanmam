import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from '../entity/contract.entity';
import { GoogleSheetsService } from '../../../infrastructure/external/google-sheets/google-sheets.service';

export interface WorkReportItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface WorkReportResult {
  items: WorkReportItem[];
  total: number;
  sheetTabName: string;
}

@Injectable()
export class WorkReportService {
  private readonly logger = new Logger(WorkReportService.name);

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly sheetsService: GoogleSheetsService,
  ) {}

  /**
   * Fetch work report data from Google Sheets for a usage-based contract.
   */
  async fetchWorkReport(contractId: string, yearMonth: string): Promise<WorkReportResult | null> {
    const contract = await this.contractRepo.findOne({
      where: { ctrId: contractId },
      relations: ['partner'],
    });
    if (!contract?.ctrGsheetUrl) return null;
    if (!this.sheetsService.isConfigured()) {
      this.logger.warn('Google Sheets not configured, skipping work report fetch');
      return null;
    }

    const spreadsheetId = this.sheetsService.extractSpreadsheetId(contract.ctrGsheetUrl);
    if (!spreadsheetId) {
      this.logger.warn(`Invalid Google Sheets URL for contract ${contractId}`);
      return null;
    }

    const tabName = this.resolveTabName(contract.ctrGsheetTabPattern, yearMonth);

    try {
      // Verify the tab exists
      const sheetNames = await this.sheetsService.getSheetNames(spreadsheetId);
      if (!sheetNames.includes(tabName)) {
        this.logger.warn(`Sheet tab "${tabName}" not found in spreadsheet. Available: ${sheetNames.join(', ')}`);
        return null;
      }

      // Read all data from the tab
      const data = await this.sheetsService.readSheetData(spreadsheetId, tabName);
      if (!data || data.length < 2) {
        this.logger.warn(`No data found in sheet tab "${tabName}"`);
        return null;
      }

      const items = this.parseWorkReportData(data);
      const total = items.reduce((sum, item) => sum + item.amount, 0);

      return { items, total, sheetTabName: tabName };
    } catch (error) {
      this.logger.error(`Failed to fetch work report for contract ${contractId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Resolve the sheet tab name based on pattern and year-month.
   */
  private resolveTabName(pattern: string | null, yearMonth: string): string {
    if (!pattern) return yearMonth; // default: "2026-02"

    const [year, month] = yearMonth.split('-');

    switch (pattern) {
      case 'YYYY-MM':
        return `${year}-${month}`;
      case 'YYYY.MM':
        return `${year}.${month}`;
      case 'MM/YYYY':
        return `${month}/${year}`;
      case 'MMYYYY':
        return `${month}${year}`;
      default:
        // If pattern doesn't match any known format, use it as-is (fixed tab name)
        return pattern;
    }
  }

  /**
   * Parse raw sheet data into WorkReportItems.
   * Expects header row with columns like: Description, Quantity, Unit Price, Amount
   * Or similar variations. Tries to auto-detect columns.
   */
  private parseWorkReportData(data: string[][]): WorkReportItem[] {
    const headerRow = data[0].map((h) => String(h).toLowerCase().trim());
    const items: WorkReportItem[] = [];

    // Auto-detect column indices
    const descIdx = headerRow.findIndex((h) =>
      ['description', 'task', 'work', 'item', 'details', 'content'].some((k) => h.includes(k)),
    );
    const qtyIdx = headerRow.findIndex((h) =>
      ['qty', 'quantity', 'hours', 'count', 'manday', 'man-day', 'md'].some((k) => h.includes(k)),
    );
    const priceIdx = headerRow.findIndex((h) =>
      ['unit price', 'rate', 'price', 'unit_price', 'unitprice'].some((k) => h.includes(k)),
    );
    const amountIdx = headerRow.findIndex((h) =>
      ['amount', 'total', 'subtotal', 'cost'].some((k) => h.includes(k)),
    );

    // If we can't detect columns, try a simple fallback: col0=desc, col1=qty, col2=price, col3=amount
    const dIdx = descIdx >= 0 ? descIdx : 0;
    const qIdx = qtyIdx >= 0 ? qtyIdx : 1;
    const pIdx = priceIdx >= 0 ? priceIdx : 2;
    const aIdx = amountIdx >= 0 ? amountIdx : 3;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const description = String(row[dIdx] || '').trim();
      if (!description) continue;

      const quantity = Number(row[qIdx]) || 0;
      const unitPrice = Number(row[pIdx]) || 0;
      let amount = Number(row[aIdx]) || 0;

      // If amount is 0 but qty and price exist, calculate it
      if (amount === 0 && quantity > 0 && unitPrice > 0) {
        amount = quantity * unitPrice;
      }

      // Skip rows with no meaningful data
      if (amount === 0 && quantity === 0) continue;

      items.push({ description, quantity, unitPrice, amount });
    }

    return items;
  }
}
