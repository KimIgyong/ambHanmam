import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemParamEntity } from '../entity/system-param.entity';
import { HolidayEntity } from '../entity/holiday.entity';

/**
 * HR 시스템 시드 데이터 (2026년 베트남 기준)
 * 서버 시작 시 파라미터/공휴일이 비어 있으면 자동 삽입
 */
@Injectable()
export class HrSeedService implements OnModuleInit {
  private readonly logger = new Logger(HrSeedService.name);

  constructor(
    @InjectRepository(SystemParamEntity)
    private readonly paramRepo: Repository<SystemParamEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
  ) {}

  async onModuleInit() {
    await this.seedParams();
    await this.seedHolidays();
  }

  private async seedParams() {
    const count = await this.paramRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding HR system parameters (2026 Vietnam)...');

    const params: Array<{
      key: string; value: string; from: string; description: string;
    }> = [
      // Insurance rates - Company
      { key: 'COMPANY_SI_SICKNESS', value: '3', from: '2026-01-01', description: 'Company SI - Sickness/Maternity (%)' },
      { key: 'COMPANY_SI_ACCIDENT', value: '0.5', from: '2026-01-01', description: 'Company SI - Occupational Accident (%)' },
      { key: 'COMPANY_SI_RETIREMENT', value: '14', from: '2026-01-01', description: 'Company SI - Retirement/Survivor (%)' },
      { key: 'COMPANY_HI', value: '3', from: '2026-01-01', description: 'Company Health Insurance (%)' },
      { key: 'COMPANY_UI', value: '1', from: '2026-01-01', description: 'Company Unemployment Insurance (%)' },
      { key: 'COMPANY_UNION', value: '2', from: '2026-01-01', description: 'Company Union Fee (%)' },

      // Insurance rates - Employee
      { key: 'EMPLOYEE_SI', value: '8', from: '2026-01-01', description: 'Employee Social Insurance (%)' },
      { key: 'EMPLOYEE_HI', value: '1.5', from: '2026-01-01', description: 'Employee Health Insurance (%)' },
      { key: 'EMPLOYEE_UI', value: '1', from: '2026-01-01', description: 'Employee Unemployment Insurance (%)' },

      // PIT Tax brackets (VND)
      { key: 'PIT_BRACKET_1', value: '5000000:5', from: '2026-01-01', description: 'PIT: Up to 5M → 5%' },
      { key: 'PIT_BRACKET_2', value: '10000000:10', from: '2026-01-01', description: 'PIT: 5M–10M → 10%' },
      { key: 'PIT_BRACKET_3', value: '18000000:15', from: '2026-01-01', description: 'PIT: 10M–18M → 15%' },
      { key: 'PIT_BRACKET_4', value: '32000000:20', from: '2026-01-01', description: 'PIT: 18M–32M → 20%' },
      { key: 'PIT_BRACKET_5', value: '52000000:25', from: '2026-01-01', description: 'PIT: 32M–52M → 25%' },
      { key: 'PIT_BRACKET_6', value: '80000000:30', from: '2026-01-01', description: 'PIT: 52M–80M → 30%' },
      { key: 'PIT_BRACKET_7', value: '0:35', from: '2026-01-01', description: 'PIT: Above 80M → 35%' },

      // Tax deductions
      { key: 'PIT_SELF_DEDUCTION', value: '11000000', from: '2026-01-01', description: 'PIT Self Deduction (VND/month)' },
      { key: 'PIT_DEPENDENT_DEDUCTION', value: '4400000', from: '2026-01-01', description: 'PIT Dependent Deduction (VND/person/month)' },

      // Regional minimum wages (2026)
      { key: 'MIN_WAGE_REGION_1', value: '4960000', from: '2026-01-01', description: 'Region 1 Minimum Wage (VND)' },
      { key: 'MIN_WAGE_REGION_2', value: '4410000', from: '2026-01-01', description: 'Region 2 Minimum Wage (VND)' },
      { key: 'MIN_WAGE_REGION_3', value: '3860000', from: '2026-01-01', description: 'Region 3 Minimum Wage (VND)' },
      { key: 'MIN_WAGE_REGION_4', value: '3450000', from: '2026-01-01', description: 'Region 4 Minimum Wage (VND)' },

      // Insurance salary cap
      { key: 'SI_SALARY_CAP', value: '46800000', from: '2026-01-01', description: 'SI Base Salary Cap = 20 × Base Salary Region 1' },
      { key: 'UI_SALARY_CAP', value: '99200000', from: '2026-01-01', description: 'UI Base Salary Cap = 20 × Min Wage Region 1' },

      // OT multipliers
      { key: 'OT_WEEKDAY', value: '150', from: '2026-01-01', description: 'OT Weekday Multiplier (%)' },
      { key: 'OT_WEEKDAY_NIGHT', value: '200', from: '2026-01-01', description: 'OT Weekday Night Multiplier (%)' },
      { key: 'OT_WEEKEND', value: '200', from: '2026-01-01', description: 'OT Weekend Multiplier (%)' },
      { key: 'OT_WEEKEND_NIGHT', value: '210', from: '2026-01-01', description: 'OT Weekend Night Multiplier (%)' },
      { key: 'OT_HOLIDAY', value: '300', from: '2026-01-01', description: 'OT Holiday Multiplier (%)' },
    ];

    const entities = params.map((p) => {
      const entity = new SystemParamEntity();
      entity.hspParamKey = p.key;
      entity.hspParamValue = p.value;
      entity.hspEffectiveFrom = p.from;
      entity.hspDescription = p.description;
      return entity;
    });

    await this.paramRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} HR system parameters.`);
  }

  private async seedHolidays() {
    const count = await this.holidayRepo.count({ where: { holYear: 2026 } });
    if (count > 0) return;

    this.logger.log('Seeding 2026 Vietnam public holidays...');

    const holidays: Array<{
      date: string; name: string; nameVi: string;
    }> = [
      { date: '2026-01-01', name: "New Year's Day", nameVi: 'Tết Dương lịch' },
      { date: '2026-02-16', name: 'Lunar New Year Eve', nameVi: 'Tất niên (29 Tết)' },
      { date: '2026-02-17', name: 'Lunar New Year Day 1', nameVi: 'Tết Nguyên đán (Mùng 1)' },
      { date: '2026-02-18', name: 'Lunar New Year Day 2', nameVi: 'Tết Nguyên đán (Mùng 2)' },
      { date: '2026-02-19', name: 'Lunar New Year Day 3', nameVi: 'Tết Nguyên đán (Mùng 3)' },
      { date: '2026-02-20', name: 'Lunar New Year Day 4', nameVi: 'Tết Nguyên đán (Mùng 4)' },
      { date: '2026-04-02', name: 'Hung Kings Day', nameVi: 'Giỗ Tổ Hùng Vương (10/3 ÂL)' },
      { date: '2026-04-30', name: 'Reunification Day', nameVi: 'Ngày Giải phóng miền Nam' },
      { date: '2026-05-01', name: 'International Labour Day', nameVi: 'Ngày Quốc tế Lao động' },
      { date: '2026-09-02', name: 'National Day', nameVi: 'Quốc khánh' },
      { date: '2026-09-03', name: 'National Day Holiday', nameVi: 'Nghỉ bù Quốc khánh' },
    ];

    const entities = holidays.map((h) => {
      const entity = new HolidayEntity();
      entity.holDate = h.date;
      entity.holName = h.name;
      entity.holNameVi = h.nameVi;
      entity.holYear = 2026;
      return entity;
    });

    await this.holidayRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} holidays for 2026.`);
  }
}
