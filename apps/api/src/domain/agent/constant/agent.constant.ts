import { UnitCode } from '@amb/types';

export interface AgentInfo {
  unitCode: UnitCode;
  unitName: string;
  description: string;
  specialties: string[];
}

export const AGENT_INFO_MAP: Record<UnitCode, AgentInfo> = {
  LEGAL: {
    unitCode: 'LEGAL',
    unitName: 'Legal',
    description: 'AI agent for legal advisory, contract review, and compliance.',
    specialties: ['Contract Review', 'Privacy Law', 'Compliance', 'Legal Risk'],
  },
  ACCOUNTING: {
    unitCode: 'ACCOUNTING',
    unitName: 'Accounting',
    description: 'AI agent for accounting, tax, and budget management.',
    specialties: ['K-IFRS', 'Corporate/VAT Tax', 'Budget Management', 'Closing'],
  },
  TRANSLATION: {
    unitCode: 'TRANSLATION',
    unitName: 'Translation',
    description: 'AI agent for multilingual content translation and terminology management.',
    specialties: ['KO/EN/VI Translation', 'Business Documents', 'Localization', 'Terminology'],
  },
  PM: {
    unitCode: 'PM',
    unitName: 'Project Manager',
    description: 'AI agent for project management, WBS, and risk management.',
    specialties: ['WBS/Gantt', 'Agile/Scrum', 'Risk Management', 'Sprint Planning'],
  },
  DEVELOPMENT: {
    unitCode: 'DEVELOPMENT',
    unitName: 'Development',
    description: 'AI agent for software development, code review, and technical advisory.',
    specialties: ['Full-Stack Dev', 'Code Review', 'Architecture', 'DevOps'],
  },
  IT: {
    unitCode: 'IT',
    unitName: 'IT Supporter',
    description: 'AI agent for AMA product support, bug intake, and feature request triage.',
    specialties: ['AMA Product Guide', 'Bug Intake', 'Feature Request', 'User Support'],
  },
};
