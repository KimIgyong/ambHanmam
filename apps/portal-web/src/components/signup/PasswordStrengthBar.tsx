import { useTranslation } from 'react-i18next';

interface PasswordStrengthBarProps {
  password: string;
}

/** Backend-aligned password regex: uppercase + lowercase + digit + special (!@#$%^&*) */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

function calcStrength(pw: string): number {
  if (!pw || pw.length < 8) return 0;
  let types = 0;
  if (/[a-z]/.test(pw)) types++;
  if (/[A-Z]/.test(pw)) types++;
  if (/\d/.test(pw)) types++;
  if (/[!@#$%^&*]/.test(pw)) types++;

  if (types <= 1) return 1;
  if (types === 2) return 2;
  if (types === 3) return 3;
  if (types >= 4 && pw.length >= 12) return 4;
  return 3;
}

const COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];
const LABEL_KEYS = ['', 'auth.signup_pw_strength_1', 'auth.signup_pw_strength_2', 'auth.signup_pw_strength_3', 'auth.signup_pw_strength_4'];

const RULES: { key: string; test: (pw: string) => boolean }[] = [
  { key: 'auth.pw_rule_min_length', test: (pw) => pw.length >= 8 },
  { key: 'auth.pw_rule_lowercase', test: (pw) => /[a-z]/.test(pw) },
  { key: 'auth.pw_rule_uppercase', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'auth.pw_rule_digit', test: (pw) => /\d/.test(pw) },
  { key: 'auth.pw_rule_special', test: (pw) => /[!@#$%^&*]/.test(pw) },
];

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { t } = useTranslation();
  const strength = calcStrength(password);
  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              i <= strength ? COLORS[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          className={`text-[11px] mt-0.5 font-medium ${
            strength <= 1
              ? 'text-red-500'
              : strength === 2
                ? 'text-amber-500'
                : strength === 3
                  ? 'text-lime-600'
                  : 'text-green-600'
          }`}
        >
          {t(LABEL_KEYS[strength])}
        </p>
      )}
      <ul className="mt-1.5 space-y-0.5">
        {RULES.map((rule) => {
          const pass = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-1 text-[11px] ${
              pass ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{pass ? '✓' : '○'}</span>
              <span>{t(rule.key)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { calcStrength, PASSWORD_REGEX };
