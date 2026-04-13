import { Star } from 'lucide-react';

interface StarRatingProps {
  /** 현재 사용자의 별점 (interactive 모드) 또는 평균 점수 (readonly 모드) */
  value: number | null;
  /** 별점 변경 콜백 (0 = 삭제) */
  onChange?: (rating: number) => void;
  /** 읽기 전용 여부 */
  readonly?: boolean;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 평균 별점 (readonly 집계 표시용) */
  avgRating?: number | null;
  /** 평가 수 */
  ratingCount?: number;
  /** 자기 콘텐츠 여부 (true이면 별점 비활성) */
  isOwn?: boolean;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  avgRating,
  ratingCount,
  isOwn = false,
}: StarRatingProps) {
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const disabled = readonly || isOwn;

  // 표시할 별점 값: 평균 값이 있으면 그것을, 아니면 개인 별점
  const displayValue = readonly && avgRating != null ? avgRating : (value || 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled && onChange) {
                onChange(value === star ? 0 : star);
              }
            }}
            className={`${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            title={isOwn ? 'Cannot rate your own content' : undefined}
          >
            <Star
              className={`${starSize} ${
                star <= displayValue
                  ? 'fill-amber-400 text-amber-400'
                  : star - 0.5 <= displayValue
                    ? 'fill-amber-200 text-amber-400'
                    : 'fill-none text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {ratingCount != null && ratingCount > 0 && (
        <span className={`${textSize} text-gray-500 ml-0.5`}>
          {avgRating != null ? avgRating.toFixed(1) : ''} ({ratingCount})
        </span>
      )}
    </div>
  );
}
