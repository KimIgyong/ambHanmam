import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useMenuTipForPage } from '@/domain/entity-settings/hooks/useSiteConfig';

interface MenuTipBannerProps {
  menuCode: string;
}

export default function MenuTipBanner({ menuCode }: MenuTipBannerProps) {
  const { data: tip } = useMenuTipForPage(menuCode);
  const [expanded, setExpanded] = useState(true);

  if (!tip) return null;

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <Lightbulb className="h-4 w-4" />
          {tip.title}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-blue-500" /> : <ChevronDown className="h-4 w-4 text-blue-500" />}
      </button>
      {expanded && (
        <div className="border-t border-blue-200 px-4 py-3 text-sm text-blue-600 whitespace-pre-wrap">
          {tip.content}
        </div>
      )}
    </div>
  );
}
