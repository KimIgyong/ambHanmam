import { createHash } from 'crypto';

/**
 * MegaPay SHA256 해시 생성
 * 인자들을 순서대로 이어붙여 SHA256 해시를 생성한다.
 */
export function megapayHash(...parts: string[]): string {
  return createHash('sha256').update(parts.join('')).digest('hex');
}

/**
 * MegaPay invoiceNo 생성 (시스템 내 유일)
 * 형식: {merId}{YYYYMMDDHHmmss}{random4}
 */
export function generateInvoiceNo(merId: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${merId}${y}${m}${d}${h}${mi}${s}${random}`;
}

/**
 * MegaPay merTrxId 생성 (가맹점 거래 ID)
 * 형식: {merId}{timestamp}
 */
export function generateMerTrxId(merId: string): string {
  return `${merId}${Date.now()}`;
}

/**
 * 현재 시간을 MegaPay timestamp 형식으로 반환
 * 형식: YYYYMMDDHHmmss
 */
export function getMegapayTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${mi}${s}`;
}
