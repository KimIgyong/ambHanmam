import { Navigate, useParams } from 'react-router-dom';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';

const UNIT_TO_MENU: Record<string, string> = {
  management: 'CHAT_MANAGEMENT',
  accounting: 'CHAT_ACCOUNTING',
  hr: 'CHAT_HR',
  legal: 'CHAT_LEGAL',
  sales: 'CHAT_SALES',
  it: 'CHAT_IT',
  marketing: 'CHAT_MARKETING',
  'general-affairs': 'CHAT_GENERAL_AFFAIRS',
  planning: 'CHAT_PLANNING',
};

interface ChatMenuGuardProps {
  children: React.ReactNode;
}

export default function ChatMenuGuard({ children }: ChatMenuGuardProps) {
  const { unit } = useParams<{ unit: string }>();
  const { data: myMenus, isLoading } = useMyMenus();

  if (isLoading) return null;

  const menuCode = UNIT_TO_MENU[unit || ''];

  // Unknown unit or no permission
  if (!menuCode || (myMenus && !myMenus.find((m) => m.menuCode === menuCode))) {
    return <Navigate to="/agents" replace />;
  }

  return <>{children}</>;
}
