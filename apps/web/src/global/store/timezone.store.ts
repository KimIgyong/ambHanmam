import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 지원 타임존 목록 */
export const SUPPORTED_TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (UTC+7)', locale: 'vi' },
  { value: 'Asia/Seoul', label: 'Korea (UTC+9)', locale: 'ko' },
  { value: 'UTC', label: 'UTC', locale: 'en' },
] as const;

interface TimezoneState {
  timezone: string;
  setTimezone: (tz: string) => void;
}

/**
 * 사용자 타임존 상태 관리
 * - 로그인 시 서버에서 받은 timezone으로 초기화
 * - localStorage에 유지 (새로고침 후에도 보존)
 *
 * 기본값: Asia/Ho_Chi_Minh (베트남)
 */
export const useTimezoneStore = create<TimezoneState>()(
  persist(
    (set) => ({
      timezone: 'Asia/Ho_Chi_Minh',
      setTimezone: (tz: string) => set({ timezone: tz }),
    }),
    {
      name: 'amb-timezone',
    },
  ),
);
