import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';

interface LocalDateTimeProps {
  /** UTC ISO 문자열 (예: '2026-03-04T02:00:00Z') */
  value: string | null | undefined;
  /** 표시 포맷 (기본: 'YYYY-MM-DD HH:mm') */
  format?: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'DD/MM/YYYY HH:mm' | 'DD/MM/YYYY' | 'HH:mm';
  /** 값이 없을 때 표시할 텍스트 */
  fallback?: string;
  className?: string;
}

/**
 * UTC 날짜/시간을 사용자의 로컬 타임존으로 변환하여 표시하는 컴포넌트
 *
 * 사용 예:
 *   <LocalDateTime value="2026-03-04T02:00:00Z" />
 *   베트남 사용자: "2026-03-04 09:00" (UTC+7)
 *   한국 사용자:   "2026-03-04 11:00" (UTC+9)
 */
export function LocalDateTime({
  value,
  format = 'YYYY-MM-DD HH:mm',
  fallback = '-',
  className,
}: LocalDateTimeProps) {
  const { timezone } = useTimezoneStore();

  if (!value) return <span className={className}>{fallback}</span>;

  const formatted = formatDateTimeInTz(value, timezone, format);

  return (
    <time dateTime={value} title={`UTC: ${value}`} className={className}>
      {formatted}
    </time>
  );
}
