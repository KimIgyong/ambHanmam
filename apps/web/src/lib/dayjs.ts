/**
 * dayjs 전역 설정
 * - utc: UTC 기준 파싱/변환
 * - timezone: IANA 타임존 변환 (Asia/Seoul, Asia/Ho_Chi_Minh 등)
 *
 * 사용법:
 *   import { dayjs } from '@/lib/dayjs';
 *   dayjs.utc('2026-03-04T02:00:00Z').tz('Asia/Seoul').format('YYYY-MM-DD HH:mm')
 *   // → '2026-03-04 11:00'
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/ko';
import 'dayjs/locale/vi';

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
