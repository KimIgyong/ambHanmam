import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';

interface EmailVerifyInlineProps {
  codeSent: boolean;
  verified: boolean;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  resendTimer: number;
  onSendCode: () => void;
  onVerify: (code: string) => void;
}

export function EmailVerifyInline({
  codeSent,
  verified,
  sending,
  verifying,
  error,
  resendTimer,
  onSendCode,
  onVerify,
}: EmailVerifyInlineProps) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (codeSent && !verified && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [codeSent, verified]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const newDigits = [...digits];
      newDigits[index] = value;
      setDigits(newDigits);

      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      // 4자리 모두 입력 시 자동 확인
      if (value && index === 3) {
        const code = newDigits.join('');
        if (code.length === 4) {
          onVerify(code);
        }
      }
    },
    [digits, onVerify],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
      if (!text) return;
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < text.length; i++) {
        newDigits[i] = text[i];
      }
      setDigits(newDigits);
      if (text.length === 4) {
        onVerify(text);
      } else {
        inputRefs.current[text.length]?.focus();
      }
    },
    [onVerify],
  );

  if (verified) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-medium text-green-600">{t('auth.signup_verified_badge')}</span>
      </div>
    );
  }

  return (
    <div>
      {/* 코드 입력 행 */}
      {codeSent && (
        <div className="flex gap-2 mt-2">
          <div className="flex gap-1.5 flex-1">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-10 h-10 text-center border border-blue-200 rounded-lg bg-blue-50 text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={verifying}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const code = digits.join('');
              if (code.length === 4) onVerify(code);
            }}
            disabled={digits.join('').length !== 4 || verifying}
            className="h-10 px-3.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {verifying ? '...' : t('auth.signup_verify_code')}
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* 재발송 타이머 */}
      {codeSent && !verified && (
        <div className="flex items-center gap-2 mt-1.5">
          {resendTimer > 0 ? (
            <span className="text-[11px] text-gray-400">
              {t('auth.signup_resend_in', { sec: resendTimer })}
            </span>
          ) : (
            <button
              type="button"
              onClick={onSendCode}
              disabled={sending}
              className="text-[11px] text-blue-600 font-medium hover:underline disabled:opacity-50"
            >
              {sending ? '...' : t('auth.signup_resend')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
