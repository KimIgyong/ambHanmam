import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HrEmployeeResponse } from '@amb/types';
import { useEntityStore } from '../../store/entity.store';

interface EmployeeBasicInfoTabProps {
  employee?: HrEmployeeResponse | null;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
  isAdmin: boolean;
  isKrEntity?: boolean;
}

const NATIONALITIES = ['VIETNAMESE', 'FOREIGNER', 'KOREAN'];
const EMPLOYEE_STATUSES = ['PROBATION', 'OFFICIAL', 'PARENTAL_LEAVE', 'TEMPORARY_LEAVE', 'RESIGNED'];
const FREELANCER_STATUSES = ['OFFICIAL', 'RESIGNED'];
const CONTRACT_TYPES = ['EMPLOYEE', 'FREELANCER'];
const REGIONS = ['REGION_1', 'REGION_2', 'REGION_3', 'REGION_4'];
const SALARY_TYPES = ['GROSS', 'NET'];
const SCHEDULES = ['MON_FRI', 'MON_SAT'];

export default function EmployeeBasicInfoTab({ employee, onSave, isSaving, isAdmin, isKrEntity }: EmployeeBasicInfoTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const isNew = !employee;

  const { entities, currentEntity } = useEntityStore();

  const [form, setForm] = useState({
    employee_code: '',
    entity_id: '',
    full_name: '',
    nationality: isKrEntity ? 'KOREAN' : 'VIETNAMESE',
    cccd_number: '',
    tax_code: '',
    si_number: '',
    hospital_code: '',
    start_date: '',
    end_date: '',
    status: 'PROBATION',
    contract_type: 'EMPLOYEE',
    department: '',
    position: '',
    region: isKrEntity ? '' : 'REGION_1',
    salary_type: 'GROSS',
    work_schedule: 'MON_FRI',
    memo: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        employee_code: employee.employeeCode,
        entity_id: employee.entityId || '',
        full_name: employee.fullName,
        nationality: employee.nationality,
        cccd_number: employee.cccdNumber || '',
        tax_code: employee.taxCode || '',
        si_number: employee.siNumber || '',
        hospital_code: employee.hospitalCode || '',
        start_date: employee.startDate,
        end_date: employee.endDate || '',
        status: employee.status,
        contract_type: employee.contractType || 'EMPLOYEE',
        department: employee.department,
        position: employee.position,
        region: employee.region || '',
        salary_type: employee.salaryType,
        work_schedule: employee.workSchedule,
        memo: employee.memo || '',
      });
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset status when contract type changes
      if (field === 'contract_type') {
        const validStatuses = value === 'FREELANCER' ? FREELANCER_STATUSES : EMPLOYEE_STATUSES;
        if (!validStatuses.includes(next.status)) {
          next.status = validStatuses[0];
        }
      }
      return next;
    });
  };

  const statuses = form.contract_type === 'FREELANCER' ? FREELANCER_STATUSES : EMPLOYEE_STATUSES;
  const statusKeyPrefix = form.contract_type === 'FREELANCER' ? 'hr:employee.freelancerStatus' : 'hr:employee.status';
  const isKorean = form.nationality === 'KOREAN';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Employee Code */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.code')} {!isNew && '*'}
          </label>
          {isNew ? (
            <input
              type="text"
              value={form.employee_code}
              onChange={(e) => handleChange('employee_code', e.target.value)}
              disabled
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder={t('hr:employee.form.autoGenerate')}
            />
          ) : (
            <input
              type="text"
              value={form.employee_code}
              disabled
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
          )}
        </div>

        {/* Entity */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.entity')}
          </label>
          {isNew ? (
            <input
              type="text"
              value={currentEntity?.name || ''}
              disabled
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
          ) : (
            <select
              value={form.entity_id}
              onChange={(e) => handleChange('entity_id', e.target.value)}
              disabled={!isAdmin}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            >
              <option value="">{t('common:select')}</option>
              {entities.map((ent) => (
                <option key={ent.entityId} value={ent.entityId}>{ent.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.fullName')} *
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            required
          />
        </div>

        {/* Nationality */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.nationality')}
          </label>
          <select
            value={form.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{t(`hr:employee.nationality.${n.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        {/* CCCD / Resident Registration No */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isKorean ? t('hr:employee.form.residentNo') : t('hr:employee.form.cccd')}
            {!isKorean && ' *'}
          </label>
          <input
            type="text"
            value={form.cccd_number}
            onChange={(e) => handleChange('cccd_number', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            required={!isKorean}
          />
        </div>

        {/* Tax Code */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.taxCode')}
          </label>
          <input
            type="text"
            value={form.tax_code}
            onChange={(e) => handleChange('tax_code', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        {/* SI Number */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.siNumber')}
          </label>
          <input
            type="text"
            value={form.si_number}
            onChange={(e) => handleChange('si_number', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        {/* Hospital */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.hospital')}
          </label>
          <input
            type="text"
            value={form.hospital_code}
            onChange={(e) => handleChange('hospital_code', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.startDate')} *
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.status')}
          </label>
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{t(`${statusKeyPrefix}.${s.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        {/* Contract Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.contractType')}
          </label>
          <select
            value={form.contract_type}
            onChange={(e) => handleChange('contract_type', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {CONTRACT_TYPES.map((ct) => (
              <option key={ct} value={ct}>{t(`hr:employee.contractType.${ct.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.endDate')}
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        {/* Department */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.department')} *
          </label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => handleChange('department', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            required
          />
        </div>

        {/* Position */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.position')} *
          </label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => handleChange('position', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            required
          />
        </div>

        {/* Region - conditional rendering */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.region')}
          </label>
          {isKrEntity ? (
            <input
              type="text"
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              disabled={!isAdmin}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            />
          ) : (
            <select
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              disabled={!isAdmin}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{t(`hr:employee.region.${r.toLowerCase()}`)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Salary Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.salaryType')}
          </label>
          <select
            value={form.salary_type}
            onChange={(e) => handleChange('salary_type', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {SALARY_TYPES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Work Schedule */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:employee.form.workSchedule')}
          </label>
          <select
            value={form.work_schedule}
            onChange={(e) => handleChange('work_schedule', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {SCHEDULES.map((s) => (
              <option key={s} value={s}>{t(`hr:employee.schedule.${s.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('hr:employee.form.memo')}
        </label>
        <textarea
          value={form.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
          disabled={!isAdmin}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
        />
      </div>

      {isAdmin && (
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('common:processing') : t('common:save')}
          </button>
        </div>
      )}
    </form>
  );
}
