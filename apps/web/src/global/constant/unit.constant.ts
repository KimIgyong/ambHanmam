import { UnitCode } from '@amb/types';
import {
  Scale,
  Calculator,
  Languages,
  Kanban,
  Code2,
  LucideIcon,
  Briefcase,
  Users,
  TrendingUp,
  Monitor,
  Megaphone,
  Building2,
  Lightbulb,
} from 'lucide-react';

export interface UnitInfo {
  code: UnitCode | string;
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const UNITS: UnitInfo[] = [
  {
    code: 'LEGAL',
    nameKey: 'LEGAL.name',
    descriptionKey: 'LEGAL.description',
    icon: Scale,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    code: 'ACCOUNTING',
    nameKey: 'ACCOUNTING.name',
    descriptionKey: 'ACCOUNTING.description',
    icon: Calculator,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    code: 'TRANSLATION',
    nameKey: 'TRANSLATION.name',
    descriptionKey: 'TRANSLATION.description',
    icon: Languages,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    code: 'PM',
    nameKey: 'PM.name',
    descriptionKey: 'PM.description',
    icon: Kanban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    code: 'DEVELOPMENT',
    nameKey: 'DEVELOPMENT.name',
    descriptionKey: 'DEVELOPMENT.description',
    icon: Code2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    code: 'MANAGEMENT',
    nameKey: 'MANAGEMENT.name',
    descriptionKey: 'MANAGEMENT.description',
    icon: Briefcase,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    code: 'HR',
    nameKey: 'HR.name',
    descriptionKey: 'HR.description',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    code: 'SALES',
    nameKey: 'SALES.name',
    descriptionKey: 'SALES.description',
    icon: TrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    code: 'IT',
    nameKey: 'IT.name',
    descriptionKey: 'IT.description',
    icon: Monitor,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    code: 'MARKETING',
    nameKey: 'MARKETING.name',
    descriptionKey: 'MARKETING.description',
    icon: Megaphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    code: 'GENERAL_AFFAIRS',
    nameKey: 'GENERAL_AFFAIRS.name',
    descriptionKey: 'GENERAL_AFFAIRS.description',
    icon: Building2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    code: 'PLANNING',
    nameKey: 'PLANNING.name',
    descriptionKey: 'PLANNING.description',
    icon: Lightbulb,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

/** AI Agent units (5 core agents) */
export const AGENT_UNITS: UnitInfo[] = UNITS.filter((d) =>
  ['LEGAL', 'ACCOUNTING', 'TRANSLATION', 'PM', 'DEVELOPMENT', 'IT'].includes(d.code),
);

export const getUnitInfo = (unitCode: string): UnitInfo | undefined => {
  return UNITS.find((d) => d.code === unitCode);
};
