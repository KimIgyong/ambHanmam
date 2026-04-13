import { Injectable, Logger } from '@nestjs/common';

interface VerifyCodeEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  firstSentAt: number;
}

@Injectable()
export class EmailVerifyStore {
  private readonly logger = new Logger(EmailVerifyStore.name);
  private readonly store = new Map<string, VerifyCodeEntry>();

  private readonly CODE_TTL_MS = 10 * 60 * 1000; // 10분
  private readonly MAX_ATTEMPTS = 5;
  private readonly MAX_SEND_PER_HOUR = 5;
  private readonly HOUR_MS = 60 * 60 * 1000;

  generateCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  canSend(email: string): { allowed: boolean; reason?: string } {
    const key = email.toLowerCase();
    const entry = this.store.get(key);
    if (!entry) return { allowed: true };

    const now = Date.now();
    // 1시간 내 발송 한도 초과
    if (now - entry.firstSentAt < this.HOUR_MS && entry.sendCount >= this.MAX_SEND_PER_HOUR) {
      return { allowed: false, reason: 'TOO_MANY_REQUESTS' };
    }

    return { allowed: true };
  }

  saveCode(email: string, code: string): void {
    const key = email.toLowerCase();
    const now = Date.now();
    const existing = this.store.get(key);

    const isWithinHour = existing && now - existing.firstSentAt < this.HOUR_MS;

    this.store.set(key, {
      code,
      expiresAt: now + this.CODE_TTL_MS,
      attempts: 0,
      sendCount: isWithinHour ? existing.sendCount + 1 : 1,
      firstSentAt: isWithinHour ? existing.firstSentAt : now,
    });
  }

  verify(email: string, code: string): { valid: boolean; reason?: string } {
    const key = email.toLowerCase();
    const entry = this.store.get(key);

    if (!entry) {
      return { valid: false, reason: 'CODE_NOT_FOUND' };
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return { valid: false, reason: 'CODE_EXPIRED' };
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(key);
      return { valid: false, reason: 'TOO_MANY_ATTEMPTS' };
    }

    entry.attempts++;

    if (entry.code !== code) {
      return { valid: false, reason: 'CODE_MISMATCH' };
    }

    // 성공 — 코드 삭제
    this.store.delete(key);
    return { valid: true };
  }

  /** 만료된 항목 정리 (10분마다 자동 실행) */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt + this.HOUR_MS) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired verify code entries`);
    }
  }
}
