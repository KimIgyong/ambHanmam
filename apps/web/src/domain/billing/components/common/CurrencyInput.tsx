import { useRef, useCallback } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 천 단위 구분자(,)를 자동 표시하는 금액 입력 컴포넌트.
 * 내부적으로 number 타입을 유지하며, 표시만 포맷된 문자열로 처리.
 */
export default function CurrencyInput({
  value,
  onChange,
  className = '',
  placeholder,
  disabled,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseFormattedNumber = (str: string): number => {
    const cleaned = str.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const raw = input.value;

      // 숫자, 콤마, 소수점, 마이너스만 허용
      const cleaned = raw.replace(/[^0-9.,-]/g, '');
      const numericValue = parseFormattedNumber(cleaned);

      // 커서 위치 보정
      const prevLen = raw.length;
      const cursorPos = input.selectionStart || 0;

      onChange(numericValue);

      // 포맷 후 커서 위치 재계산
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const formatted = formatNumber(numericValue);
          const newLen = formatted.length;
          const diff = newLen - prevLen;
          const newPos = Math.max(0, cursorPos + diff);
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      });
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 허용: 숫자, 백스페이스, 삭제, 탭, 방향키, 소수점, 마이너스
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];
    if (allowed.includes(e.key)) return;
    if (e.key === '.' || e.key === '-') return;
    if (e.metaKey || e.ctrlKey) return; // Cmd+A, Cmd+C 등
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={formatNumber(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
