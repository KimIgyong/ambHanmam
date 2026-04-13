/**
 * 사용자 타임존 기준 날짜 유틸리티
 */

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** 사용자 타임존 기준 오늘 날짜 (YYYY-MM-DD) */
export function getLocalToday(timezone?: string): string {
  const tz = timezone || DEFAULT_TIMEZONE;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

/** 사용자 타임존 기준 어제 날짜 (YYYY-MM-DD) */
export function getLocalYesterday(timezone?: string): string {
  const tz = timezone || DEFAULT_TIMEZONE;
  const now = new Date();
  // 타임존 기준 현재 날짜를 구한 뒤 하루 전으로
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
  const yesterday = new Date(todayStr + 'T00:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
