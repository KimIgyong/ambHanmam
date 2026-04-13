# 작업계획서: AI API 키 환경변수→DB 전환

- **문서번호**: PLAN-API키DB전환-20260318
- **작성일**: 2026-03-18
- **작성자**: AI Assistant

---

## 1. 개요

현재 시스템의 AI API 키가 환경변수(`CLAUDE_API_KEY`) 우선으로 동작하여, DB에 등록된 키(`amb_api_keys`)가 실질적으로 사용되지 않는 구조를 **DB 우선 조회**로 전환한다.

## 2. 현황 분석 (AS-IS)

### 2.1 키 조회 우선순위

```
ClaudeService 생성자:
  환경변수 CLAUDE_API_KEY 존재? → 즉시 Anthropic 클라이언트 생성 (DB 조회 안 함)

ensureClient() (매 요청마다 호출):
  클라이언트 이미 존재? → 바로 사용 (DB 조회 안 함)   ← ⚠️ 핵심 문제
  ↓ (클라이언트 없을 때만)
  DB 캐시 유효? → 사용
  DB 조회 → 성공 시 사용
  환경변수 폴백 → 성공 시 사용
  Mock Mode
```

**문제**: 생성자에서 환경변수로 클라이언트를 생성하면, `ensureClient()`의 첫 번째 조건 `this.client && !this.isMockMode`에서 `true`를 반환하여 **DB 조회 로직에 도달하지 않음**.

### 2.2 스테이징 현재 상태

| 구분 | 키 | 뒤4자리 | 상태 |
|------|-----|---------|------|
| 환경변수 `CLAUDE_API_KEY` | sk-ant-api03-... | GAAA | **현재 사용 중** |
| DB `amb_api_keys` ANTHROPIC | ama-key (ent_id=NULL) | GgAA | 활성이나 미사용 |

### 2.3 영향 범위

ClaudeService를 DI로 사용하는 모든 서비스 (변경 불필요):

| 도메인 | 서비스 | 용도 |
|--------|--------|------|
| Agent | base-agent.service.ts 외 9개 | 부서별 AI 에이전트 채팅 |
| Report | report-ai.service.ts | 일간/주간 업무 리포트 생성 |
| KMS | tag-extraction, doc-extraction, doc-generation, doc-diff | 문서 AI 기능 |
| Talk | message-translate.service.ts | 메시지 번역 |

## 3. 변경 설계 (TO-BE)

### 3.1 키 조회 우선순위 (변경 후)

```
ClaudeService 생성자:
  클라이언트 생성하지 않음 (ensureClient에 위임)

ensureClient() (매 요청마다 호출):
  1. DB 캐시 유효? → 바로 사용
  2. DB 조회 (법인별 → 시스템 공동) → 성공 시 캐시 후 사용
  3. 환경변수 폴백 → 성공 시 사용
  4. Mock Mode
```

### 3.2 수정 파일

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `apps/api/src/infrastructure/external/claude/claude.service.ts` | 생성자 + ensureClient() 로직 변경 |

**단 1개 파일만 수정.** 나머지 AI 서비스는 ClaudeService DI 사용이므로 자동 전환.

### 3.3 구체 변경사항

#### 3.3.1 생성자 변경

```typescript
// AS-IS
constructor(...) {
  const apiKey = this.configService.get<string>('CLAUDE_API_KEY', '');
  this.isMockMode = !apiKey || apiKey === 'your_claude_api_key_here';
  if (!this.isMockMode) {
    this.client = new Anthropic({ apiKey });  // ← 환경변수로 즉시 생성
  }
}

// TO-BE
constructor(...) {
  // 생성자에서는 클라이언트를 생성하지 않음
  // 첫 번째 API 호출 시 ensureClient()에서 DB 우선 조회
  this.isMockMode = true;
  this.logger.log('ClaudeService initialized. API key will be resolved from DB on first call.');
}
```

#### 3.3.2 ensureClient() 변경

```typescript
// TO-BE
private async ensureClient(): Promise<boolean> {
  const now = Date.now();

  // 1. 캐시된 키가 아직 유효하면 사용
  if (this.cachedApiKey && now < this.cacheExpiresAt) {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: this.cachedApiKey });
    }
    this.isMockMode = false;
    return true;
  }

  // 2. DB에서 키 조회 (법인별 → 시스템 공동)
  try {
    const dbKey = await this.apiKeyService.getDecryptedKey('ANTHROPIC');
    if (dbKey) {
      if (dbKey !== this.cachedApiKey) {
        this.client = new Anthropic({ apiKey: dbKey });
        this.logger.log('Loaded Anthropic API key from DB.');
      }
      this.cachedApiKey = dbKey;
      this.cacheExpiresAt = now + ClaudeService.CACHE_TTL;
      this.isMockMode = false;
      return true;
    }
  } catch (error) {
    this.logger.warn('Failed to query API key from DB, falling back to env.');
  }

  // 3. 환경변수 폴백
  const envKey = this.configService.get<string>('CLAUDE_API_KEY', '');
  if (envKey && envKey !== 'your_claude_api_key_here') {
    this.client = new Anthropic({ apiKey: envKey });
    this.cachedApiKey = envKey;
    this.cacheExpiresAt = now + ClaudeService.CACHE_TTL;
    this.isMockMode = false;
    this.logger.warn('Using env CLAUDE_API_KEY as fallback (DB key not found).');
    return true;
  }

  // 4. Mock Mode
  this.isMockMode = true;
  return false;
}
```

#### 3.3.3 keySource 기록 개선

`recordUsageIfContext()`의 `keySource` 값을 DB/ENV 구분하여 기록:

```typescript
// 클래스 필드 추가
private currentKeySource: 'DB' | 'ENV' | 'MOCK' = 'MOCK';

// ensureClient()에서 설정
// DB 조회 성공 시: this.currentKeySource = 'DB';
// 환경변수 폴백 시: this.currentKeySource = 'ENV';

// recordUsageIfContext()에서 사용
keySource: this.currentKeySource,
```

## 4. 안전 장치

| 항목 | 설명 |
|------|------|
| 환경변수 유지 | `CLAUDE_API_KEY` 삭제하지 않음 → DB 장애 시 폴백 |
| 캐시 TTL | 5분 유지 → DB 부하 최소화 |
| 로그 | DB/ENV/Mock 키 소스를 로그에 명시 |
| 무중단 | 기존 환경변수 키가 폴백으로 작동하므로 DB 설정 전에도 서비스 정상 |

## 5. 전제 조건

- [x] DB `amb_api_keys`에 활성 ANTHROPIC 키 등록 (현재 `ama-key` 존재)
- [x] `API_KEY_ENCRYPTION_SECRET` 환경변수 설정 (암/복호화용)
- [x] `SettingsModule` → `ClaudeModule` 의존성 이미 구성

## 6. 테스트 계획

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | DB 키 존재 + 환경변수 존재 | DB 키 사용 (로그: "Loaded Anthropic API key from DB") |
| 2 | DB 키 없음 + 환경변수 존재 | 환경변수 폴백 (로그: "Using env CLAUDE_API_KEY as fallback") |
| 3 | DB 키 없음 + 환경변수 없음 | Mock Mode 동작 |
| 4 | DB 키 변경 (5분 후 갱신) | 캐시 만료 후 새 키 자동 적용 |
| 5 | DB 쿼리 실패 (네트워크 오류) | 환경변수 폴백으로 무중단 |

## 7. 사이드 임팩트 분석

| 영향 대상 | 영향도 | 설명 |
|-----------|--------|------|
| Agent 채팅 | 없음 | ClaudeService DI 사용, 인터페이스 불변 |
| 업무 리포트 | 없음 | 동일 |
| KMS 문서 AI | 없음 | 동일 |
| 메시지 번역 | 없음 | 동일 |
| API 키 관리 UI | 없음 | 프론트엔드 변경 불필요 |
| 토큰 사용량 기록 | 개선 | keySource에 DB/ENV 구분 기록 |
| 환경변수 | 유지 | 삭제하지 않음 (폴백용) |

## 8. 배포 계획

1. `claude.service.ts` 수정
2. API 빌드 검증
3. 커밋/푸시
4. 스테이징 배포
5. API 로그에서 "Loaded Anthropic API key from DB" 확인
6. AI 채팅 기능 테스트 (실제 응답 확인)
