/**
 * 날짜를 DD/MM/YYYY 형식으로 표시
 * 입력: YYYY-MM-DD (DB 저장 형식)
 * 출력: DD/MM/YYYY (UI 표시 형식)
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * VND 금액 포맷 (vi-VN 로케일)
 * 예: 39000000 → "39.000.000"
 */
export function formatVnd(amount: number): string {
  return Math.round(Number(amount)).toLocaleString('vi-VN');
}

/**
 * UTC ISO 문자열을 특정 타임존의 날짜+시간 문자열로 변환
 * 예: formatDateTimeInTz('2026-03-04T02:00:00Z', 'Asia/Ho_Chi_Minh') → '2026-03-04 09:00'
 */
export function formatDateTimeInTz(
  utcDateStr: string | null | undefined,
  timezone: string,
  format = 'YYYY-MM-DD HH:mm',
): string {
  if (!utcDateStr) return '';
  // 동적 import 방식 대신 Intl API 사용 (dayjs 미사용 환경 폴백)
  try {
    const date = new Date(utcDateStr);
    if (isNaN(date.getTime())) return utcDateStr;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(',', '')
      .replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/, (_, y, mo, d, h, mi) => {
        if (format === 'DD/MM/YYYY HH:mm') return `${d}/${mo}/${y} ${h}:${mi}`;
        if (format === 'DD/MM/YYYY') return `${d}/${mo}/${y}`;
        if (format === 'HH:mm') return `${h}:${mi}`;
        return `${y}-${mo}-${d} ${h}:${mi}`;
      });
  } catch {
    return utcDateStr;
  }
}

/**
 * 로컬 날짜 문자열을 UTC ISO 문자열로 변환 (서버 전송용)
 * 예: toUtcIso('2026-03-04 09:00', 'Asia/Ho_Chi_Minh') → '2026-03-04T02:00:00.000Z'
 *     toUtcIso('2026-03-15T09:00', 'Asia/Seoul')       → '2026-03-15T00:00:00.000Z'
 *
 * 원리: new Date(str)는 브라우저 로컬 타임존으로 해석하므로,
 *       지정 타임존과 브라우저 타임존의 오프셋 차이만큼 보정한다.
 */
export function toUtcIso(localDateStr: string, timezone: string): string {
  if (!localDateStr) return '';
  try {
    // 브라우저 로컬 타임존으로 파싱 (의도한 타임존과 다를 수 있음)
    const fake = new Date(localDateStr);
    if (isNaN(fake.getTime())) return localDateStr;

    // 지정 타임존의 UTC 오프셋 계산 (양수 = UTC 동쪽)
    const inUtc = new Date(fake.toLocaleString('en-US', { timeZone: 'UTC' }));
    const inTz = new Date(fake.toLocaleString('en-US', { timeZone: timezone }));
    const targetOffsetMs = inTz.getTime() - inUtc.getTime();

    // 브라우저 타임존의 UTC 오프셋 (getTimezoneOffset은 부호가 반대)
    const browserOffsetMs = -fake.getTimezoneOffset() * 60000;

    // 브라우저 해석 → 지정 타임존 해석으로 보정
    return new Date(fake.getTime() - (targetOffsetMs - browserOffsetMs)).toISOString();
  } catch {
    return new Date(localDateStr).toISOString();
  }
}
