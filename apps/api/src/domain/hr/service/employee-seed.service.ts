import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entity/employee.entity';
import { DependentEntity } from '../entity/dependent.entity';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

interface ParsedDependent {
  depName: string;
  depDateOfBirth: string;
  depCccdNumber: string | null;
  depTaxCode: string | null;
  depRelationship: string;
  depEffectiveFrom: string;
  depEffectiveTo: string | null;
}

interface ParsedEmployee {
  empCode: string;
  empFullName: string;
  empTaxCode: string | null;
  empCccdNumber: string;
  empSiNumber: string | null;
  empHospitalCode: string | null;
  empNationality: string;
  empStatus: string;
  empContractType: string;
  empStartDate: string;
  empEndDate: string | null;
  empDepartment: string;
  empPosition: string;
  empRegion: string;
  empSalaryType: string;
  empWorkSchedule: string;
  dependents: ParsedDependent[];
}

@Injectable()
export class EmployeeSeedService implements OnModuleInit {
  private readonly logger = new Logger(EmployeeSeedService.name);

  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(DependentEntity)
    private readonly dependentRepo: Repository<DependentEntity>,
  ) {}

  async onModuleInit() {
    await this.seedEmployeesFromExcel();
  }

  private async seedEmployeesFromExcel() {
    const count = await this.employeeRepo.count();
    if (count > 0) {
      this.logger.log('Employees already seeded, skipping.');
      return;
    }

    const candidates = [
      path.resolve(process.cwd(), 'reference/amoeba_worker_info.xlsx'),
      path.resolve(process.cwd(), '../../reference/amoeba_worker_info.xlsx'),
    ];
    const excelPath = candidates.find((p) => fs.existsSync(p));
    if (!excelPath) {
      this.logger.warn(
        `Excel file not found in: ${candidates.join(', ')}. Skipping employee seed.`,
      );
      return;
    }

    this.logger.log('Seeding employees from amoeba_worker_info.xlsx...');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.worksheets[0];

    const parsed = this.parseEmployeeSheet(worksheet);
    await this.insertEmployees(parsed);

    const resignedCount = parsed.filter(
      (e) => e.empStatus === 'RESIGNED',
    ).length;
    const freelancerCount = parsed.filter(
      (e) => e.empContractType === 'FREELANCER',
    ).length;
    const foreignerCount = parsed.filter(
      (e) => e.empNationality === 'FOREIGNER',
    ).length;
    const depCount = parsed.reduce((sum, e) => sum + e.dependents.length, 0);

    this.logger.log(
      `Seeded ${parsed.length} employees with ${depCount} dependents.`,
    );
    this.logger.log(
      `Verification: ${parsed.length} employees (${resignedCount} resigned, ${freelancerCount} freelancers, ${foreignerCount} foreigners), ${depCount} dependents.`,
    );
  }

  private parseEmployeeSheet(ws: ExcelJS.Worksheet): ParsedEmployee[] {
    const employees: ParsedEmployee[] = [];
    let currentEmployee: ParsedEmployee | null = null;
    let employeeIndex = 0;

    for (let r = 2; r <= ws.rowCount; r++) {
      const cccd = this.getCellStringOrNull(ws, r, 4);
      const fullName = this.getCellStringOrNull(ws, r, 2);

      if (cccd && fullName) {
        if (!currentEmployee || cccd !== currentEmployee.empCccdNumber) {
          employeeIndex++;
          const taxCode = this.getCellStringOrNull(ws, r, 3);
          const siNumber = this.getCellStringOrNull(ws, r, 5);
          const rawHospital = this.getCellStringOrNull(ws, r, 6);
          const hospitalCode = rawHospital
            ? rawHospital.slice(0, 100)
            : null;
          const hddvFlag = this.getCellStringOrNull(ws, r, 16);
          const isRedFont = this.isCellRedFont(ws, r, 2);
          const status = isRedFont ? 'RESIGNED' : 'OFFICIAL';
          const contractType =
            hddvFlag && hddvFlag.toUpperCase() === 'HDDV'
              ? 'FREELANCER'
              : 'EMPLOYEE';

          currentEmployee = {
            empCode: `AMB-${String(employeeIndex).padStart(3, '0')}`,
            empFullName: fullName,
            empTaxCode: taxCode,
            empCccdNumber: cccd,
            empSiNumber: siNumber ? siNumber.trim() : null,
            empHospitalCode: hospitalCode,
            empNationality: this.detectNationality(cccd),
            empStatus: status,
            empContractType: contractType,
            empStartDate: '2024-01-01',
            empEndDate: status === 'RESIGNED' ? '2025-12-31' : null,
            empDepartment: 'UNASSIGNED',
            empPosition: 'STAFF',
            empRegion: 'REGION_1',
            empSalaryType: 'GROSS',
            empWorkSchedule: 'MON_FRI',
            dependents: [],
          };
          employees.push(currentEmployee);
        }
      }

      if (currentEmployee) {
        const depName = this.getCellStringOrNull(ws, r, 8);
        if (depName) {
          const depDob = this.parseExcelDate(this.getCellValue(ws, r, 9));
          const depCccd = this.getCellStringOrNull(ws, r, 10);
          const depTaxCode = this.getCellStringOrNull(ws, r, 11);
          const depRelationship =
            this.getCellStringOrNull(ws, r, 12) || 'Khác';
          const depFrom = this.parseExcelDate(this.getCellValue(ws, r, 13));
          const depTo = this.parseExcelDate(this.getCellValue(ws, r, 14));

          currentEmployee.dependents.push({
            depName,
            depDateOfBirth: depDob || '2000-01-01',
            depCccdNumber: depCccd,
            depTaxCode: depTaxCode,
            depRelationship: depRelationship,
            depEffectiveFrom: depFrom || '2024-01-01',
            depEffectiveTo: depTo || null,
          });
        }
      }
    }

    return employees;
  }

  private async insertEmployees(parsed: ParsedEmployee[]) {
    for (const emp of parsed) {
      try {
        const entity = new EmployeeEntity();
        entity.empCode = emp.empCode;
        entity.empFullName = emp.empFullName;
        entity.empTaxCode = emp.empTaxCode ?? undefined as any;
        entity.empCccdNumber = emp.empCccdNumber;
        entity.empSiNumber = emp.empSiNumber ?? undefined as any;
        entity.empHospitalCode = emp.empHospitalCode ?? undefined as any;
        entity.empNationality = emp.empNationality;
        entity.empStatus = emp.empStatus;
        entity.empContractType = emp.empContractType;
        entity.empStartDate = emp.empStartDate;
        entity.empEndDate = emp.empEndDate ?? undefined as any;
        entity.empDepartment = emp.empDepartment;
        entity.empPosition = emp.empPosition ?? undefined as any;
        entity.empRegion = emp.empRegion ?? undefined as any;
        entity.empSalaryType = emp.empSalaryType;
        entity.empWorkSchedule = emp.empWorkSchedule ?? undefined as any;

        const saved = await this.employeeRepo.save(entity);

        for (const dep of emp.dependents) {
          const depEntity = new DependentEntity();
          depEntity.empId = saved.empId;
          depEntity.depName = dep.depName;
          depEntity.depDateOfBirth = dep.depDateOfBirth;
          depEntity.depCccdNumber = dep.depCccdNumber ?? undefined as any;
          depEntity.depTaxCode = dep.depTaxCode ?? undefined as any;
          depEntity.depRelationship = dep.depRelationship;
          depEntity.depEffectiveFrom = dep.depEffectiveFrom;
          depEntity.depEffectiveTo = dep.depEffectiveTo ?? undefined as any;
          await this.dependentRepo.save(depEntity);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to seed employee ${emp.empCode} (${emp.empFullName}): ${error.message}`,
        );
      }
    }
  }

  private getCellValue(
    ws: ExcelJS.Worksheet,
    row: number,
    col: number,
  ): unknown {
    const cell = ws.getRow(row).getCell(col);
    const value = cell.value;
    if (value && typeof value === 'object' && 'result' in value) {
      return (value as ExcelJS.CellFormulaValue).result;
    }
    return value;
  }

  private getCellStringOrNull(
    ws: ExcelJS.Worksheet,
    row: number,
    col: number,
  ): string | null {
    const value = this.getCellValue(ws, row, col);
    if (value === null || value === undefined || value === '') return null;
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }

  private isCellRedFont(
    ws: ExcelJS.Worksheet,
    row: number,
    col: number,
  ): boolean {
    const cell = ws.getRow(row).getCell(col);
    const font = cell.font;
    if (!font || !font.color) return false;
    const argb = font.color.argb;
    if (!argb) return false;
    // FFFF0000 = opaque red
    return argb.toUpperCase() === 'FFFF0000';
  }

  private parseExcelDate(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    return null;
  }

  private detectNationality(cccd: string): string {
    return cccd.startsWith('M') ? 'FOREIGNER' : 'VIETNAMESE';
  }
}
