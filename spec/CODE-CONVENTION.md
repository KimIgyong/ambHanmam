# Amoeba Code Convention v2.1

> **적용 대상**: AMA 및 아메바컴퍼니 전 프로젝트
> **최종 수정**: 2026-04-11
> **기반**: AMA 프로젝트 베스트 프랙티스 추출

---

## 1. 프로젝트 구조

### 1.1 모노레포 구조

```
{project}/
├── apps/
│   ├── api/              # NestJS 백엔드
│   ├── web/              # React 프론트엔드
│   ├── portal-api/       # (선택) SaaS 포털 API
│   ├── portal-web/       # (선택) SaaS 포털 웹
│   └── mobile/           # (선택) React Native
├── packages/
│   ├── types/            # 공유 TypeScript 타입
│   ├── common/           # 공유 유틸리티/상수
│   └── portal-shared/    # (선택) 포털 공유 코드
├── docker/
│   ├── dev/              # 개발 Docker 구성
│   ├── staging/          # 스테이징 Docker 구성
│   └── production/       # 프로덕션 Docker 구성
├── env/
│   ├── backend/          # 백엔드 환경변수
│   └── frontend/         # 프론트엔드 환경변수
├── spec/                 # 기술 명세 문서
├── docs/                 # 프로젝트 문서
│   ├── analysis/         # 요구사항 분석서
│   ├── plan/             # 작업 계획서
│   ├── implementation/   # 작업 완료 보고
│   ├── test/             # 테스트 케이스
│   └── log/              # 작업 로그 (git 제외)
├── sql/                  # DB 마이그레이션 SQL
├── scripts/              # 유틸리티 스크립트
├── turbo.json            # Turborepo 설정
├── package.json          # 루트 workspace 설정
├── SPEC.md               # 프로젝트 명세서
└── CLAUDE.md             # AI 에이전트 지침
```

### 1.2 백엔드 구조 (NestJS)

```
apps/api/src/
├── main.ts                      # 앱 부트스트랩
├── app.module.ts                # 루트 모듈
├── domain/                      # 비즈니스 도메인 모듈
│   └── {module}/
│       ├── {module}.module.ts   # 모듈 정의
│       ├── controller/          # REST 컨트롤러
│       ├── service/             # 비즈니스 로직
│       ├── entity/              # TypeORM 엔티티
│       ├── dto/
│       │   ├── request/         # 요청 DTO (snake_case)
│       │   └── response/        # 응답 DTO (camelCase)
│       └── interface/           # 인터페이스/타입
├── infrastructure/              # 외부 서비스 연동
│   ├── claude/                  # AI API
│   ├── mail/                    # 메일 발송
│   ├── file/                    # 파일 업로드
│   └── google-drive/            # Google Drive
├── global/                      # 전역 공유
│   ├── constant/                # 상수/에러코드
│   ├── decorator/               # 커스텀 데코레이터
│   ├── guard/                   # 가드 (인증/인가)
│   ├── filter/                  # 예외 필터
│   ├── interceptor/             # 인터셉터
│   └── pipe/                    # 파이프
└── database/                    # DB 설정/시드
```

### 1.3 프론트엔드 구조 (React)

```
apps/web/src/
├── App.tsx                      # 루트 컴포넌트
├── main.tsx                     # 엔트리포인트
├── i18n.ts                      # i18n 초기화
├── domain/                      # 도메인별 기능
│   └── {module}/
│       ├── components/          # 도메인 컴포넌트
│       ├── pages/               # 페이지 컴포넌트
│       ├── hooks/               # 커스텀 훅
│       ├── service/             # API 서비스
│       ├── store/               # Zustand 스토어
│       ├── guard/               # 라우트 가드
│       └── layout/              # 레이아웃
├── components/                  # 공통 UI 컴포넌트
│   ├── common/                  # 범용 컴포넌트
│   └── ui/                      # 기본 UI 요소
├── global/                      # 전역 설정
│   ├── store/                   # 전역 스토어
│   ├── layout/                  # 전역 레이아웃
│   └── error/                   # 에러 핸들링
├── router/                      # React Router 설정
├── lib/                         # 유틸리티 함수
│   ├── api-client.ts            # Axios 인스턴스
│   ├── sse-client.ts            # SSE 클라이언트
│   ├── format-utils.ts          # 포맷 유틸리티
│   ├── export-utils.ts          # 내보내기 유틸
│   ├── dayjs.ts                 # dayjs 설정
│   └── storage.ts               # localStorage 래퍼
└── locales/                     # i18n 번역 파일
    ├── en/                      # 영어
    ├── ko/                      # 한국어
    └── vi/                      # 베트남어
```

---

## 2. 네이밍 규칙

### 2.1 파일 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase.tsx | `ChatPage.tsx`, `IssueDetailModal.tsx` |
| React 페이지 | PascalCase + Page suffix | `DashboardPage.tsx`, `ProjectListPage.tsx` |
| NestJS 컨트롤러 | kebab-case.controller.ts | `auth.controller.ts`, `issue.controller.ts` |
| NestJS 서비스 | kebab-case.service.ts | `auth.service.ts`, `project-ai.service.ts` |
| NestJS 모듈 | kebab-case.module.ts | `auth.module.ts`, `client-portal.module.ts` |
| NestJS 엔티티 | kebab-case.entity.ts | `user.entity.ts`, `project-client.entity.ts` |
| NestJS DTO | kebab-case.request/response.ts | `login.request.ts`, `user.response.ts` |
| NestJS 가드 | kebab-case.guard.ts | `roles.guard.ts`, `client.guard.ts` |
| Zustand 스토어 | kebab-case.store.ts | `auth.store.ts`, `client-auth.store.ts` |
| 커스텀 훅 | use + PascalCase.ts | `useChat.ts`, `useProjectIssues.ts` |
| 유틸리티 | kebab-case.ts | `api-client.ts`, `format-utils.ts` |
| i18n 번역 | camelCase.json | `clientPortal.json`, `meetingNotes.json` |
| SQL 파일 | kebab-case.sql | `client-portal-migration.sql` |

### 2.2 DB 네이밍

```
테이블:     {project_prefix}_{domain}_{복수형_snake_case}
예시:      amb_users, amb_bil_contracts, kms_projects

컬럼:      {3자_접두사}_{snake_case}
예시:      usr_email, pjt_title, iss_status

기본키:    {접두사}_id (UUID v4)
예시:      usr_id, pjt_id, iss_id

외래키:    원본 테이블의 PK 컬럼명 그대로 사용
예시:      usr_id, ent_id, pjt_id

Soft Delete: {접두사}_deleted_at (TIMESTAMPTZ NULLABLE)
생성일:     {접두사}_created_at (TIMESTAMPTZ NOT NULL DEFAULT NOW())
수정일:     {접두사}_updated_at (TIMESTAMPTZ NOT NULL DEFAULT NOW())
```

**3자 접두사 규칙**:
- 테이블명의 의미 있는 약어 사용
- 프로젝트 내에서 유일해야 함
- 예시: `usr_`(users), `pjt_`(projects), `iss_`(issues), `ctr_`(contracts)

### 2.3 API 네이밍

```
기본 경로:      /api/v1/{resource}
복수형:        /api/v1/projects (NOT /api/v1/project)
중첩 리소스:    /api/v1/projects/:id/issues
액션형:        /api/v1/projects/:id/archive (POST)

Request DTO:   snake_case  (DB 컬럼과 동일)
Response DTO:  camelCase   (프론트엔드 변수 스타일)
```

### 2.4 코드 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스 | PascalCase | `UserService`, `ProjectController` |
| 인터페이스 | PascalCase | `JwtPayload`, `UserPayload` |
| 함수/메서드 | camelCase | `findById()`, `createProject()` |
| 변수 | camelCase | `userId`, `projectTitle` |
| 상수 | SCREAMING_SNAKE_CASE | `ERROR_CODE`, `ROLE_HIERARCHY` |
| 환경변수 | SCREAMING_SNAKE_CASE | `DB_HOST`, `VITE_API_BASE_URL` |
| Enum 값 | SCREAMING_SNAKE_CASE | `IN_PROGRESS`, `COMPLETED` |
| 타입 파라미터 | 단일 대문자 | `T`, `K`, `V` |

---

## 3. 백엔드 규칙 (NestJS + TypeORM)

### 3.1 모듈 패턴

```typescript
// {module}.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity1, Entity2]),
    AuthModule, // 인증 필요 시
  ],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService], // 다른 모듈에서 사용 시
})
export class MyModule {}
```

### 3.2 컨트롤러 패턴

```typescript
@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  async findAll(@CurrentUser() user: UserPayload, @Query() query: ListProjectRequest) {
    return this.projectService.findAll(user, query);
  }

  @Post()
  @Roles('MANAGER')
  @UseGuards(RolesGuard)
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateProjectRequest) {
    return this.projectService.create(user, dto);
  }
}
```

**필수 규칙**:
- `@ApiTags()` + `@ApiOperation()` Swagger 문서화
- `@CurrentUser()` 데코레이터로 사용자 정보 주입
- `@Roles()` + `RolesGuard`로 역할 기반 접근 제어
- `@Public()` 데코레이터로 인증 우회 (로그인/회원가입 등)
- `@Throttle()` Rate Limiting (로그인: 5req/60s, 일반: 60req/60s)

### 3.3 서비스 패턴

```typescript
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: string, user: UserPayload): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOne({ where: { pjtId: id } });
    if (!project) {
      throw new BusinessException(ERROR_CODE.PROJECT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return project;
  }
}
```

**필수 규칙**:
- `@InjectRepository()` — TypeORM 리포지토리 주입
- `BusinessException` — 비즈니스 에러 처리 (에러 코드 + HTTP 상태)
- 복잡한 쿼리는 QueryBuilder 사용, 단순 조회는 `find()/findOne()`
- 서비스 메서드는 `UserPayload`를 파라미터로 받아 접근 제어

### 3.4 엔티티 패턴

```typescript
@Entity('amb_projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pjt_id' })
  pjtId: string;

  @Column({ name: 'pjt_title', type: 'varchar', length: 200 })
  pjtTitle: string;

  @Column({ name: 'pjt_status', type: 'varchar', length: 20, default: 'ACTIVE' })
  pjtStatus: string;

  @CreateDateColumn({ name: 'pjt_created_at', type: 'timestamptz' })
  pjtCreatedAt: Date;

  @UpdateDateColumn({ name: 'pjt_updated_at', type: 'timestamptz' })
  pjtUpdatedAt: Date;

  @Column({ name: 'pjt_deleted_at', type: 'timestamptz', nullable: true })
  pjtDeletedAt: Date | null;

  // 관계
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'usr_id' })
  owner: UserEntity;
}
```

**필수 규칙**:
- `@Entity()` 테이블명은 snake_case, `amb_` prefix
- `@Column({ name: })` DB 컬럼명 명시 (snake_case)
- 프로퍼티명은 camelCase (3자 접두사 유지: `pjtTitle`, `usrEmail`)
- PK는 UUID v4 (`@PrimaryGeneratedColumn('uuid')`)
- Soft Delete는 `{prefix}_deleted_at` nullable timestamptz
- `type` 속성 명시 (TypeORM 자동 추론 방지)

### 3.5 DTO 패턴

```typescript
// Request DTO (snake_case)
export class CreateProjectRequest {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '프로젝트명' })
  pjt_title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  pjt_description?: string;
}

// Response DTO (camelCase)
export class ProjectResponse {
  pjtId: string;
  pjtTitle: string;
  pjtDescription: string;
  createdAt: string;
}
```

### 3.6 에러 처리

```typescript
// 에러 코드 정의 (global/constant/error.constant.ts)
export const ERROR_CODE = {
  // E1xxx: 인증/인가
  INVALID_CREDENTIALS: { code: 'E1001', message: 'Invalid credentials' },
  TOKEN_EXPIRED:       { code: 'E1002', message: 'Token expired' },
  FORBIDDEN:           { code: 'E1003', message: 'Forbidden' },

  // E{NN}xxx: 도메인별
  PROJECT_NOT_FOUND:   { code: 'E21001', message: 'Project not found' },
} as const;

// 사용
throw new BusinessException(ERROR_CODE.PROJECT_NOT_FOUND, HttpStatus.NOT_FOUND);
```

**에러 코드 체계**:
| 범위 | 도메인 |
|------|--------|
| E1xxx | 인증/인가 |
| E2xxx | 사용자 |
| E3xxx~E20xxx | 기존 도메인 |
| E21xxx~ | 신규 도메인 (순차 할당) |
| E9xxx | 시스템 |

### 3.7 표준 API 응답

```typescript
// 성공
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-21T10:30:00Z"
}

// 에러
{
  "success": false,
  "error": {
    "code": "E1001",
    "message": "Invalid credentials",
    "details": []  // Validation 에러 시
  },
  "timestamp": "2026-03-21T10:30:00Z"
}
```

- `TransformInterceptor`가 전역 적용하여 자동 래핑
- `HttpExceptionFilter`가 에러 응답 표준화

---

## 4. 프론트엔드 규칙 (React + TypeScript)

### 4.1 상태 관리 전략

| 도구 | 용도 | 예시 |
|------|------|------|
| **Zustand + persist** | 전역 영속 상태 (인증, 설정) | `auth.store.ts` (`amb_auth`) |
| **React Query (TanStack)** | 서버 상태 + 캐싱 | `useQuery(['projects'], fetchProjects)` |
| **localStorage** | 설정값 저장 | 언어(`amb-lang`), 타임존 |
| **Component State** | 로컬 UI 상태 | 폼 입력, 모달, 필터 |

```typescript
// Zustand 스토어 패턴
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'amb_auth',              // localStorage 키
      partialize: (state) => ({      // 선택적 저장
        user: state.user,
      }),
    },
  ),
);
```

### 4.2 API 클라이언트 패턴

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// 요청 인터셉터: 헤더 자동 추가
apiClient.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = getCurrentLanguage();
  config.headers['X-Timezone'] = getTimezone();
  config.headers['X-Entity-Id'] = getEntityId();
  return config;
});

// 응답 인터셉터: 401 자동 갱신 (Race Condition 방지)
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          error.config._retry = true;
          resolve(apiClient(error.config));
        });
      });
    }
    isRefreshing = true;
    // ... refresh logic
  }
});
```

### 4.3 i18n 규칙

```
규칙:
  1. 모든 UI 텍스트는 번역 파일 사용 (하드코딩 금지)
  2. 네임스페이스별 JSON 파일 분리
  3. 키는 dot notation 구조화: section.subsection.key
  4. 동적 값은 interpolation: t('greeting', { name: 'John' })
  5. 새 네임스페이스는 i18n.ts에 등록 필수
  6. 3개 언어 동시 작성: en, ko, vi
```

```typescript
// 사용 패턴
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation('auth');
  return <h1>{t('login.title')}</h1>;
}
```

### 4.4 라우팅 패턴

```typescript
// router/index.tsx
<Routes>
  {/* 공개 라우트 */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* 인증 필수 라우트 */}
  <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
    <Route index element={<DashboardPage />} />
    <Route path="/projects" element={<ProjectListPage />} />
    <Route path="/projects/:id" element={<ProjectDetailPage />} />
  </Route>

  {/* 관리자 전용 */}
  <Route element={<AuthGuard><AdminGuard><AdminLayout /></AdminGuard></AuthGuard>}>
    <Route path="/settings/*" element={<SettingsRoutes />} />
  </Route>
</Routes>
```

### 4.5 컴포넌트 패턴

```typescript
// 페이지 컴포넌트
function ProjectListPage() {
  const { t } = useTranslation('project');
  const [filter, setFilter] = useState('ALL');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('list.title')}</h1>
      {/* ... */}
    </div>
  );
}

export default ProjectListPage;
```

**규칙**:
- 함수형 컴포넌트 (클래스 컴포넌트 금지)
- `export default` 페이지 컴포넌트, `export` 공통 컴포넌트
- TailwindCSS 유틸리티 클래스 우선 (CSS 파일 최소화)
- lucide-react 아이콘 라이브러리 표준

### 4.6 타임존 처리

```
규칙:
  1. 서버: 항상 UTC 저장/처리 (TIMESTAMPTZ)
  2. 프론트→서버: 로컬 시간을 UTC로 변환 후 전송
  3. 서버→프론트: UTC를 사용자 타임존으로 변환 후 표시
  4. 타임존: X-Timezone 헤더로 전달
  5. 변환: Intl API 기반 (formatDateTimeInTz, toUtcIso)
```

---

## 5. 보안 규칙

### 5.1 인증/인가

| 항목 | 설정 |
|------|------|
| 비밀번호 해싱 | bcrypt (salt rounds: 12) |
| JWT Access Token | 15분 만료 |
| JWT Refresh Token | 7일 만료 (httpOnly cookie) |
| 토큰 저장 | Access: Bearer header, Refresh: httpOnly cookie |
| 비밀번호 재설정 | UUID 토큰, 1시간 만료, 1회 사용 |
| Rate Limiting | 로그인: 5req/60s, 일반: 60req/60s |

### 5.2 데이터 보안

| 항목 | 방법 |
|------|------|
| API 키 저장 | AES-256-GCM 암호화 (IV + AuthTag) |
| 메일 비밀번호 | AES-256-GCM 암호화 |
| 파일 업로드 | 10MB 제한, MIME 화이트리스트, UUID 파일명 |
| HTML 콘텐츠 | DOMPurify sanitize (XSS 방어) |
| CORS | 환경별 허용 도메인 명시 |
| SQL Injection | 파라미터 바인딩 (TypeORM QueryBuilder 기본) |

### 5.3 역할 계층

```
CLIENT_MEMBER < CLIENT_ADMIN < USER < MANAGER < ADMIN < SUPER_ADMIN
      0              0          1        2        3          4
```

- `@Roles('MANAGER')` → MANAGER 이상 접근 가능
- `RolesGuard`가 `ROLE_HIERARCHY` 숫자 비교
- `@Public()` → 인증 완전 우회
- `ClientGuard` → CLIENT_LEVEL 전용 격리
- `OwnEntityGuard` → USER_LEVEL 법인 범위 접근 제어 (ent_id 기반)

---

## 6. 코드 품질

### 6.1 ESLint 설정

```javascript
// .eslintrc.js
{
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',    // any 사용 금지
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  }
}
```

### 6.2 Prettier 설정

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "always",
  "bracketSpacing": true
}
```

### 6.3 TypeScript 설정

```
공통: strict mode 활성화
백엔드: CommonJS, ES2022 target, decorator metadata
프론트엔드: ESNext module, React JSX, DOM libs, bundler resolver
```

---

## 7. Git 규칙

### 7.1 브랜치 전략

| 브랜치 | 용도 | 배포 환경 |
|--------|------|-----------|
| `production` | 프로덕션 릴리즈 | 프로덕션 서버 |
| `main` | 개발 통합 (기본) | 스테이징 서버 |
| `feature/*` | 기능 개발 | 로컬 |
| `fix/*` | 버그 수정 | 로컬 |
| `hotfix/*` | 긴급 수정 | production+main |

### 7.2 커밋 메시지

```
{type}: {한글 또는 영어 설명}

type:
  feat:     새 기능
  fix:      버그 수정
  hotfix:   프로덕션 긴급 수정
  refactor: 리팩토링
  docs:     문서
  style:    코드 스타일
  test:     테스트
  chore:    빌드/설정

예시:
  feat: 프로젝트 관리 WBS 간트차트 구현
  fix: 이슈 상태 변경 시 타임존 오류 수정
  hotfix: 로그인 세션 만료 무한 루프 수정
```

### 7.3 PR 규칙

- feature/fix → main: Squash Merge
- main → production: Merge Commit
- 최소 1명 리뷰어 승인 필수
- `npm run build` 통과 확인

---

## 8. 배포 규칙

### 8.1 필수: deploy 스크립트 사용

```bash
# 올바른 방법
bash docker/{env}/deploy-{env}.sh

# 금지 (--env-file 누락됨)
docker compose build
docker compose -f ... up -d --build
```

**이유**: `VITE_*` 환경변수는 빌드 시점에 인라인되므로 `--env-file` 누락 시 잘못된 값이 프론트엔드에 영구 포함됨.

### 8.2 환경별 배포

| 환경 | 명령 | 실행 위치 |
|------|------|-----------|
| 개발 | `bash docker/dev/deploy-dev.sh` | 로컬 |
| 스테이징 | `ssh amb-staging "cd ~/project && bash docker/staging/deploy-staging.sh"` | 서버 |
| 프로덕션 | `ssh amb-production "cd ~/project && bash docker/production/deploy-production.sh"` | 서버 |

### 8.3 DB 마이그레이션

```
개발:      synchronize: true (자동)
스테이징:   synchronize: false → 수동 SQL 실행 필수
프로덕션:   synchronize: false → 수동 SQL 실행 필수

SQL 실행: docker exec {postgres-container} psql -U {user} -d {db} -c 'ALTER TABLE ...'
```

> ⚠️ 새 엔티티/컨럼 추가 시 코드 배포 **전에** DB 마이그레이션 먼저 실행. 누락 시 'column does not exist' 500 에러 발생.

---

## 9. 문서 체계

### 9.1 필수 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| SPEC.md | 루트 | 프로젝트 명세서 (테이블, API, 에러코드) |
| CLAUDE.md | 루트 | AI 에이전트 지침 |
| CODE-CONVENTION.md | spec/ | 코드 컨벤션 (본 문서) |
| GIT-BRANCH-STRATEGY.md | spec/ | Git 브랜치 전략 |
| INFRASTRUCTURE.md | spec/ | 인프라 구성 |
| DEPLOYMENT-GUIDE.md | spec/ | 배포 가이드 |

### 9.2 요구사항 작업 워크플로우

```
1. 요구사항 분석서  → docs/analysis/REQ-{제목}-{YYYYMMDD}.md
2. 작업 계획서     → docs/plan/PLAN-{제목}-작업계획-{YYYYMMDD}.md
3. 코드 구현       → 계획서 기반 구현
4. 테스트 케이스   → docs/test/TC-{제목}-Test-{YYYYMMDD}.md
5. 작업 완료 보고  → docs/implementation/RPT-{제목}-작업완료보고-{YYYYMMDD}.md
```

---

## 10. 기술 스택 표준

### 10.1 필수 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Runtime** | Node.js | 24.x |
| **패키지** | npm | 11.x |
| **모노레포** | Turborepo | 2.x |
| **Backend** | NestJS | 10.x |
| **ORM** | TypeORM | 0.3.x |
| **DB** | PostgreSQL | 15.x (+pgvector +pg_trgm) |
| **Frontend** | React | 18.x |
| **빌드** | Vite | 5.x |
| **스타일** | TailwindCSS | 3.x |
| **타입** | TypeScript | 5.x |
| **상태** | Zustand | 4.x |
| **서버상태** | TanStack React Query | 5.x |
| **폼** | React Hook Form + Zod | 7.x / 3.x |
| **라우팅** | React Router | 6.x |
| **i18n** | i18next + react-i18next | 25.x / 16.x |
| **아이콘** | lucide-react | - |
| **토스트** | sonner | - |
| **에디터** | Tiptap | 3.x |
| **AI** | Anthropic Claude API | @anthropic-ai/sdk |
| **컨테이너** | Docker + Docker Compose | 29.x |

### 10.2 코드 포맷/린트

| 도구 | 용도 |
|------|------|
| ESLint | 코드 품질 검사 |
| Prettier | 코드 포맷팅 |
| TypeScript strict | 타입 안전성 |

### 10.3 추가 라이브러리 (필요 시)

| 용도 | 라이브러리 |
|------|-----------|
| 리치텍스트 | Tiptap |
| 엑셀 | ExcelJS |
| PDF | PDFKit |
| 메일 | Nodemailer (SMTP), ImapFlow (IMAP) |
| 크론 | @nestjs/schedule |
| Rate Limit | @nestjs/throttler |
| 파일 업로드 | Multer |
| XSS 방어 | DOMPurify |
| 날짜 | dayjs |
| 차트 | recharts |
| 간트차트 | 커스텀 (TailwindCSS 기반) |

---

## 부록: 체크리스트

### 신규 도메인 모듈 추가 시
- [ ] `apps/api/src/domain/{module}/` 폴더 생성
- [ ] `{module}.module.ts` 작성 + `AppModule`에 등록
- [ ] Entity 작성 (3자 접두사 + UUID PK + soft delete)
- [ ] Request/Response DTO 작성
- [ ] Controller + Service 작성 (Swagger 데코레이터)
- [ ] 에러 코드 추가 (`ERROR_CODE`)
- [ ] SPEC.md 업데이트 (테이블, API 엔드포인트)
- [ ] 프론트엔드 domain 폴더 생성
- [ ] i18n 번역 파일 3개 (en/ko/vi) + i18n.ts 등록
- [ ] 라우트 추가 (router/index.tsx)
- [ ] 스테이징 SQL 마이그레이션 작성
