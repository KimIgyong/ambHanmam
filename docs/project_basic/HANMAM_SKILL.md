# HANMAM by AMA - SKILL 개발 스킬 가이드

**문서버전:** v1.1
**작성일:** 2026-04-11
**적용 범위:** HANMAM by AMA 프로젝트 전체
**플랫폼 구성:** AMA 업무도구(AI·협업) + HANMAM 업무모듈(경영·영업·자금·서비스)

---

## 목차

1. [프로젝트 구성](#1-프로젝트-구성)
2. [기술 스택](#2-기술-스택)
3. [아키텍처 원칙](#3-아키텍처-원칙)
4. [백엔드 개발 스킬](#4-백엔드-개발-스킬)
5. [프론트엔드 개발 스킬](#5-프론트엔드-개발-스킬)
6. [AI 통합 개발 스킬 (AMA)](#6-ai-통합-개발-스킬-ama-)
7. [실시간 처리 - SSE](#7-실시간-처리---sse)
8. [데이터베이스 스킬](#8-데이터베이스-스킬)
9. [인증/인가](#9-인증인가)
10. [테스트 전략](#10-테스트-전략)
11. [보안 개발 스킬](#11-보안-개발-스킬)

---

## 1. 프로젝트 구성

### 1.1 플랫폼 이원화 구조

HANMAM by AMA는 두 개의 독립적 레이어로 구성됩니다.

```
┌──────────────────────────────────────────────────────────────────┐
│              HANMAM by AMA - 통합 플랫폼                          │
├───────────────────────────┬──────────────────────────────────────┤
│  AMA 업무도구 레이어        │  HANMAM 업무모듈 레이어               │
│  (AMA 베이스 기반 개발)      │  (HANMAM 신규 개발)                  │
│                           │                                      │
│  ✦ AI 채팅 (Claude SSE)   │  ✦ 경영정보                          │
│  ✦ 나의 업무               │  ✦ 영업업무                          │
│  ✦ 업무연락                │  ✦ 서비스업무                        │
│  ✦ 전자결재                │  ✦ 업무지원                          │
│  ✦ 쪽지                   │  ✦ 알림게시판                        │
│  ✦ 일정공유                │  ✦ 자금업무                         │
│  ✦ 공용자원 예약            │                                      │
│  ✦ 근태현황                │                                      │
└───────────────────────────┴──────────────────────────────────────┘
```

### 1.2 전체 디렉토리 구조

```
Hanmam/
├── frontend/
│   └── src/
│       ├── app/                     # Next.js App Router 페이지
│       ├── features/                # 도메인별 기능 레이어
│       ├── components/              # 공통 UI (AMA AI 채팅 UI 포함)
│       └── lib/                     # API 클라이언트, SSE 클라이언트
├── backend/
│   └── src/
│       ├── modules/                 # 도메인 모듈 (AMA + HANMAM 이원화)
│       │   ├── auth/
│       │   ├── ai/                  # ★ AMA AI 통합 (Claude, SSE)
│       │   ├── collaboration/       # AMA 협업 도구
│       │   ├── core-biz/            # HANMAM 경영·영업업무
│       │   ├── service-biz/         # HANMAM 서비스업무
│       │   ├── support/             # HANMAM 업무지원·알림게시판
│       │   └── finance/             # HANMAM 자금업무
│       └── global/
└── docs/
```

### 1.3 공통 커맨드

```bash
# 프론트엔드
cd frontend
npm run dev          # 개발 서버 (포트: 3001)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사

# 백엔드
cd backend
npm run start:dev    # 개발 서버 (포트: 3000, watch 모드)
npm run build        # 빌드
npm run test         # 단위 테스트
npm run test:e2e     # E2E 테스트

# DB
npm run db:up        # Docker PostgreSQL + Redis 시작
npm run db:down      # Docker 중지
npm run migration:run
npm run migration:generate
```

---

## 2. 기술 스택

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **FE** | Next.js | 14.x | React 기반 풀스택 (App Router) |
| | TypeScript | 5.x | 타입 시스템 |
| | Ant Design | 5.x | B2B 어드민 UI |
| | Zustand | 4.x | 전역 상태 관리 |
| | TanStack Query | 5.x | 서버 상태 관리 |
| | React Hook Form | 7.x | 폼 관리 |
| | Zod | 3.x | 스키마 검증 |
| | Axios | 1.x | HTTP 클라이언트 |
| | EventSource | - | SSE AI 스트리밍 클라이언트 |
| **BE** | NestJS | 10.x | 서버 프레임워크 |
| | TypeScript | 5.x | 타입 시스템 |
| | TypeORM | 0.3.x | ORM |
| | PostgreSQL | 15.x | 데이터베이스 |
| | Redis | 7.x | AI 세션 캐시 (선택) |
| | Passport + JWT | - | 인증 |
| | class-validator | 0.14.x | DTO 검증 |
| | Swagger | 7.x | API 문서화 |
| | **@anthropic-ai/sdk** | latest | **Claude AI (AMA 핵심)** |
| | RxJS (Observable) | - | SSE 스트리밍 |
| **DevOps** | Docker | - | 컨테이너 |
| | ESLint + Prettier | - | 코드 품질 |

---

## 3. 아키텍처 원칙

### 3.1 클린 아키텍처 (4-Layer)

```
Presentation Layer   → Controller, Request/Response DTO
        ↓
Application Layer    → Service, Mapper
        ↓
Domain Layer         → Entity, Repository Interface
        ↓
Infrastructure Layer → Repository Impl, DB, ClaudeService, External API
```

### 3.2 레이어 규칙

| 규칙 | 설명 |
|------|------|
| `controller` → `service` | 허용 |
| `service` → `entity`, `repository` | 허용 |
| `service` → `ClaudeService` | 허용 (AI 모듈 경유) |
| `entity` → `service`, `controller` | **금지** |
| 모듈 간 직접 import | **금지** (이벤트 또는 인터페이스 경유) |

### 3.3 도메인 모듈 구성

| 레이어 | 모듈 | 담당 |
|--------|------|------|
| **AMA 기반** | `auth` | 인증, 계정 관리 |
| | `ai` | Claude API 게이트웨이, AI 채팅, 쿼터관리 |
| | `collaboration` | 업무연락, 전자결재, 쪽지, 나의업무, 일정, 예약 |
| **HANMAM 특화** | `core-biz` | 경영정보, 고객사, 계약, 프로젝트, 매출/매입, 지출, 예산 |
| | `service-biz` | 상담 관리, IP 관리 |
| | `support` | 게시판, 설계문서, 문서대장 |
| | `finance` | 카드내역, 통장내역, 미처리 매칭 |

---

## 4. 백엔드 개발 스킬

### 4.1 도메인 모듈 구조

```
modules/{domain}/
├── presentation/
│   └── {domain}.controller.ts
├── application/
│   └── {domain}.service.ts
├── domain/
│   ├── entity/{domain}.entity.ts
│   └── repository/{domain}.repository.ts
├── dto/
│   ├── request/create-{domain}.request.ts
│   └── response/{domain}.response.ts
├── mapper/{domain}.mapper.ts
└── {domain}.module.ts
```

### 4.2 Controller 작성

```typescript
@Controller('contracts')
@ApiTags('계약관리')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '계약 목록 조회' })
  async findAll(
    @Query() query: ListContractRequest,
    @CurrentUser() user: UserPayload,
  ): Promise<BaseListResponse<ContractResponse>> {
    const [data, total] = await this.service.findAll(user.id, query);
    return {
      success: true,
      data: data.map(ContractMapper.toResponse),
      pagination: {
        page: query.page, size: query.size,
        totalCount: total, totalPages: Math.ceil(total / query.size),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 4.3 Mapper 패턴

```typescript
export class ContractMapper {
  static toResponse(entity: ContractEntity): ContractResponse {
    return {
      contractId: entity.ctrId,
      contractName: entity.ctrName,
      status: entity.ctrStatus,
      totalAmount: entity.ctrTotalAmount,
      startDate: entity.ctrStartDate?.toISOString() ?? null,
      createdAt: entity.ctrCreatedAt.toISOString(),
    };
  }
}
```

### 4.4 Entity 작성

```typescript
@Entity('hm_contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ctr_id' })
  ctrId: string;

  @Column({ name: 'ctr_name', length: 200 })
  ctrName: string;

  @Column({ name: 'ctr_status', type: 'varchar', length: 20 })
  ctrStatus: string; // CONTRACT | SUSPEND | END

  // ⚠️ nullable 컬럼은 반드시 type 명시 (TypeORM reflect-metadata 이슈)
  @Column({ name: 'ctr_description', type: 'text', nullable: true })
  ctrDescription: string | null;

  @CreateDateColumn({ name: 'ctr_created_at' })
  ctrCreatedAt: Date;

  @DeleteDateColumn({ name: 'ctr_deleted_at' })
  ctrDeletedAt: Date; // Soft Delete
}
```

### 4.5 에러 처리

```typescript
throw new BusinessException('E3001', '계약을 찾을 수 없습니다.');
// → { success: false, error: { code: 'E3001', message: '...' } }
```

---

## 5. 프론트엔드 개발 스킬

### 5.1 도메인별 기능 구조

```
features/{domain}/
├── components/                  # 도메인 전용 컴포넌트
├── api/{domain}.service.ts      # API 서비스 레이어
├── hooks/use{Domain}List.ts     # TanStack Query 훅
└── types/                       # TypeScript 타입 정의
```

### 5.2 API 서비스 레이어

```typescript
class ContractService {
  private readonly basePath = '/contracts';
  getList = (filter: ContractFilter) =>
    apiClient.get(this.basePath, { params: filter }).then(r => r.data);
  create = (data: CreateContractRequest) =>
    apiClient.post(this.basePath, data).then(r => r.data.data);
}
export const contractService = new ContractService();
```

### 5.3 TanStack Query 훅

```typescript
export const contractKeys = {
  all: ['contracts'] as const,
  list: (filter: ContractFilter) => [...contractKeys.all, 'list', filter] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
};

export const useContractList = (filter: ContractFilter) =>
  useQuery({ queryKey: contractKeys.list(filter), queryFn: () => contractService.getList(filter) });

export const useCreateContract = () =>
  useMutation({
    mutationFn: contractService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.all }),
  });
```

### 5.4 컴포넌트 작성 원칙

- 컴포넌트에서 `axios`/`fetch` 직접 호출 **금지** → Service 레이어 경유
- Page 컴포넌트: 데이터 패칭 + 레이아웃 조합
- Presentation 컴포넌트: props만으로 UI 렌더링

---

## 6. AI 통합 개발 스킬 (AMA) ★

AMA의 AI 기능은 **Claude API (Anthropic)**를 기반으로 하며, NestJS의 `ai` 모듈이 **싱글 게이트웨이**로 모든 AI 호출을 집중 관리합니다.

### 6.1 AI 서비스 아키텍처

```
사용자 요청
  └── Controller (@UseGuards(JwtAuthGuard))
       └── DomainService
            └── ClaudeService (싱글 게이트웨이)
                 ├── checkQuotaIfNeeded()  ── AiUsageService.checkQuota()
                 ├── sendMessage()         ── 동기 응답
                 └── streamMessage()       ── SSE 스트리밍 응답 (Observable)
```

### 6.2 ClaudeService 구현

```typescript
@Injectable()
export class ClaudeService {
  private client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiUsageService: AiUsageService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  // 동기 응답
  async sendMessage(userId: string, params: ChatParams): Promise<string> {
    await this.checkQuota(userId);
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens ?? 2048,
      system: params.systemPrompt,
      messages: params.messages,
    });
    await this.aiUsageService.recordUsage(userId, response.usage);
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  // SSE 스트리밍 응답 (RxJS Observable)
  streamMessage(userId: string, params: ChatParams): Observable<MessageEvent> {
    return new Observable((observer) => {
      (async () => {
        await this.checkQuota(userId);
        const stream = this.client.messages.stream({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: params.maxTokens ?? 2048,
          system: params.systemPrompt,
          messages: params.messages,
        });
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            observer.next({ data: JSON.stringify({ text: chunk.delta.text }) } as MessageEvent);
          }
        }
        const finalMsg = await stream.finalMessage();
        await this.aiUsageService.recordUsage(userId, finalMsg.usage);
        observer.complete();
      })().catch(err => observer.error(err));
    });
  }

  private async checkQuota(userId: string): Promise<void> {
    const exceeded = await this.aiUsageService.isQuotaExceeded(userId);
    if (exceeded.daily) throw new BusinessException('E4010', 'AI 일일 사용량을 초과했습니다.');
    if (exceeded.monthly) throw new BusinessException('E4011', 'AI 월간 사용량을 초과했습니다.');
  }
}
```

### 6.3 SSE 컨트롤러 (AI 채팅 스트리밍)

```typescript
@Controller('ai/chat')
@ApiTags('AI 채팅')
export class AiChatController {
  constructor(private readonly claudeService: ClaudeService) {}

  // SSE 스트리밍 엔드포인트
  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'AI 채팅 스트리밍 (SSE)' })
  stream(
    @Query() query: AiChatStreamRequest,
    @CurrentUser() user: UserPayload,
  ): Observable<MessageEvent> {
    const params: ChatParams = {
      systemPrompt: query.system_prompt,
      messages: [{ role: 'user', content: query.message }],
    };
    return this.claudeService.streamMessage(user.id, params);
  }
}
```

### 6.4 AI 쿼터 관리

```typescript
@Entity('hm_ai_usage')
export class AiUsageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aiu_id' })
  aiuId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'aiu_date', type: 'date' })
  aiuDate: string;                  // 일별 집계 기준 날짜

  @Column({ name: 'aiu_input_tokens', type: 'int', default: 0 })
  aiuInputTokens: number;

  @Column({ name: 'aiu_output_tokens', type: 'int', default: 0 })
  aiuOutputTokens: number;
}
```

### 6.5 HANMAM 특화 AI 활용 영역

| 영역 | 기능 | 설명 |
|------|------|------|
| 경영정보 | 경영성과 AI 분석 | 월별 매출/비용 데이터 기반 AI 요약 리포트 |
| 영업업무 | 계약서 요약 | 계약 내용 AI 요약 및 주요 조항 추출 |
| 서비스업무 | 상담 자동 분류 | 접수된 상담의 유형 자동 분류 및 담당자 추천 |
| 설계문서 | 문서 생성 | 템플릿 기반 설계 문서 AI 자동 생성 |
| 업무연락 | 내용 요약 | 업무 연락 스레드 AI 요약 |

---

## 7. 실시간 처리 - SSE

### 7.1 Backend SSE 패턴 (NestJS)

```typescript
// RxJS Observable 기반 SSE 응답
@Sse('stream/:id')
@UseGuards(JwtAuthGuard)
stream(@Param('id') id: string): Observable<MessageEvent> {
  return this.service.getStream(id).pipe(
    map(data => ({ data: JSON.stringify(data) } as MessageEvent)),
  );
}
```

### 7.2 Frontend SSE 클라이언트

```typescript
// lib/sse-client.ts
export function createSSEConnection(
  url: string,
  token: string,
  onMessage: (data: string) => void,
  onError?: () => void,
): EventSource {
  // ⚠️ 브라우저 기본 EventSource는 커스텀 헤더 미지원
  // → URL에 토큰 쿼리 파라미터로 전달하거나 fetch + ReadableStream 활용
  const eventSource = new EventSource(`${url}?token=${token}`);

  eventSource.onmessage = (e) => {
    const parsed = JSON.parse(e.data);
    onMessage(parsed.text ?? '');
  };

  eventSource.onerror = () => {
    eventSource.close();
    onError?.();
  };

  return eventSource;
}
```

### 7.3 React 훅 (AI 채팅 스트리밍)

```typescript
export const useAiChatStream = () => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback((message: string, systemPrompt?: string) => {
    setContent('');
    setIsStreaming(true);

    const token = useAuthStore.getState().accessToken;
    const url = `${API_BASE}/ai/chat/stream?message=${encodeURIComponent(message)}`;
    const es = createSSEConnection(url, token, (text) => {
      setContent(prev => prev + text);
    }, () => setIsStreaming(false));

    return () => { es.close(); setIsStreaming(false); };
  }, []);

  return { content, isStreaming, startStream };
};
```

---

## 8. 데이터베이스 스킬

### 8.1 스키마 변경 관리

| 환경 | 방식 |
|------|------|
| 개발 | TypeORM `synchronize: true` |
| 스테이징/프로덕션 | 수동 SQL (`synchronize: false`) |

### 8.2 네이밍 규칙

| 대상 | 패턴 | 예시 |
|------|------|------|
| 데이터베이스 | `db_hanmam` | - |
| 테이블 | `hm_{domain}_{name_plural}` | `hm_contracts`, `hm_ai_usage` |
| PK | `{col_prefix}_id` (UUID) | `ctr_id`, `aiu_id` |
| FK | 참조 테이블 PK명 그대로 | `usr_id`, `ctr_id` |
| Boolean | `{col_prefix}_is_{name}` | `ctr_is_active` |
| Soft Delete | `{col_prefix}_deleted_at` | `ctr_deleted_at` |

### 8.3 도메인별 테이블 구성

| 도메인 | 주요 테이블 |
|--------|---------|
| **인증** | `hm_users`, `hm_departments` |
| **AI (AMA)** | `hm_ai_usage`, `hm_ai_chat_sessions`, `hm_ai_chat_messages` |
| **협업 (AMA)** | `hm_approval_docs`, `hm_business_calls`, `hm_messages`, `hm_daily_tasks`, `hm_schedules`, `hm_reservations` |
| **경영·영업** | `hm_customers`, `hm_projects`, `hm_contracts`, `hm_products`, `hm_trade_records`, `hm_invoices`, `hm_expenses`, `hm_budgets` |
| **자금** | `hm_card_transactions`, `hm_bank_transactions` |
| **서비스** | `hm_consultations`, `hm_ip_allocations` |
| **공통** | `hm_boards`, `hm_doc_registers` |

---

## 9. 인증/인가

### 9.1 토큰 정책

| 항목 | Access Token | Refresh Token |
|------|-------------|---------------|
| 유효기간 | 8시간 | 7일 |
| 저장 위치 | Memory / Authorization Header | HttpOnly Cookie |

### 9.2 사용자 권한 체계

> ⚠️ 관리자(ADMIN)가 계정을 직접 생성하여 전달 — 자가 가입 없음

| 역할 | 주요 권한 |
|------|---------|
| `ADMIN` | 사용자 등록/관리, AI 쿼터 설정, 전체 모든 기능 |
| `MANAGER` | 결재 승인/반려, 팀원 업무 조회, 경영보고 접근, AI 기능 사용 |
| `USER` | 본인 업무 조회/등록, 결재 기안, AI 채팅 사용 |

### 9.3 인증 데코레이터

```typescript
// 일반 JWT 인증
@UseGuards(JwtAuthGuard)

// ADMIN 전용
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')

// JWT 페이로드
interface UserPayload {
  userId: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  departmentId: string;
}
```

---

## 10. 테스트 전략

| 테스트 유형 | 목표 |
|-------------|------|
| 단위 테스트 | 핵심 서비스 로직 80%+ |
| 통합 테스트 | 핵심 API 100% |
| AI 통합 테스트 | ClaudeService Mock 기반 단위 테스트 |

```typescript
describe('ClaudeService', () => {
  it('쿼터 초과 시 BusinessException을 던진다', async () => {
    aiUsageSvc.isQuotaExceeded.mockResolvedValue({ daily: true, monthly: false });
    await expect(service.sendMessage('user-id', params)).rejects.toThrow('E4010');
  });
});
```

---

## 11. 보안 개발 스킬

| 위협 | 대응 |
|------|------|
| SQL Injection | TypeORM 파라미터 바인딩 필수 |
| XSS | 사용자 입력 HTML 이스케이프, CSP 헤더 |
| AI 프롬프트 인젝션 | 사용자 입력을 system prompt에 직접 삽입 금지, 명확한 역할 경계 설정 |
| AI 쿼터 남용 | ClaudeService 싱글 게이트웨이에서 호출 전 쿼터 강제 검증 |
| API Key 유출 | `.env` 관리, 서버 사이드에서만 Claude API 호출 (클라이언트 직접 호출 금지) |
| 무차별 대입 | 로그인 5회 실패 → 30분 잠금 |
| HTTPS | 필수 (TLS 1.3) |
| 보안 헤더 | helmet 미들웨어 적용 |

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|---------|
| v1.0 | 2026-04-11 | 개발팀 | 최초 작성 |
| v1.1 | 2026-04-11 | 개발팀 | AMA AI 통합 섹션 추가 (Claude API, SSE, 쿼터 관리, 프롬프트 보안) |
