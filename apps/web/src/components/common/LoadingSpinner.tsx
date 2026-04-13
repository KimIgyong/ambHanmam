import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
} as const;

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className={`animate-spin rounded-full border-indigo-200 border-t-indigo-600 ${sizeClasses[size]}`}
      role="status"
      aria-label={t('loadingLabel')}
    >
      <span className="sr-only">{t('loadingText')}</span>
    </div>
  );
}
