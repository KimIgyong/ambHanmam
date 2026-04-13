# 작업 계획서: Today AI 기능 개선

**문서번호**: PLAN-TodayAI기능개선-작업계획-20260309
**작성일**: 2026-03-09
**기반**: REQ-TodayAI기능개선-20260309

---

## 작업 단계 요약

| Phase | 작업 | 파일 수 | 난이도 |
|-------|------|---------|--------|
| 1 | AI 응답 언어 다국어 지원 | 4 | 중 |
| 2 | 이모지 → 단색 아이콘 전환 | 1 | 낮 |
| 3 | 리치에디터 리스트 버튼 제거 | 1 | 낮 |
| 4 | AI 마크다운 출력 강화 + 이모지 금지 | 1 | 낮 |
| 5 | Saved Reports 번역 기능 | 3 | 중 |
| 6 | Today's Tasks(미션) 번역 기능 | 3 | 중 |

---

## Phase 1: AI 응답 언어 다국어 지원

### 1.1 프론트엔드 — Accept-Language 헤더 전송

**파일**: `apps/web/src/domain/today/components/TodayAiAnalysis.tsx`

- `handleAnalysis()` 내 fetch 호출 시 `Accept-Language` 헤더 추가
- `localStorage.getItem('amb-lang')` 또는 `i18n.language`에서 현재 언어 가져오기

```typescript
const lang = localStorage.getItem('amb-lang') || 'en';
// fetch headers에 추가:
'Accept-Language': lang,
```

### 1.2 백엔드 — 컨트롤러에서 언어 파라미터 전달

**파일**: `apps/api/src/domain/today/controller/today.controller.ts`

- `@Req()` 또는 `@Headers('accept-language')` 데코레이터로 언어 수신
- `todayService.myAiAnalysis()` 및 `todayService.aiAnalysis()`에 `lang` 파라미터 추가

```typescript
@Post('ai-analysis/me')
async myAiAnalysis(
  @CurrentUser() user: UserPayload,
  @Req() req: any,
  @Res() res: Response,
  @Headers('accept-language') lang?: string,
) {
  // lang을 service에 전달
  const stream$ = this.todayService.myAiAnalysis(myData, myIssues, req.entityId, user.userId, lang);
}
```

### 1.3 백엔드 — AI 프롬프트 언어 동적 변경

**파일**: `apps/api/src/domain/today/service/today.service.ts`

- `myAiAnalysis()` 및 `aiAnalysis()` 메서드에 `lang` 파라미터 추가
- 언어 맵핑 헬퍼 함수 추가:

```typescript
private getLanguageInstruction(lang?: string): string {
  const langMap: Record<string, string> = {
    ko: 'Korean',
    en: 'English',
    vi: 'Vietnamese',
  };
  const langName = langMap[lang || 'en'] || 'English';
  return `Write your response in ${langName}.`;
}
```

- System prompt 수정:
  - 기존: `Write your response in Korean.`
  - 변경: `${this.getLanguageInstruction(lang)}`

- User message: 영어로 통일 (AI가 자체적으로 지정 언어로 응답하게)
  - `마감` → `Due today`
  - `지연` → `Overdue`
  - `없음` → `None`
  - 섹션 제목: `## 업무 요약 통계` → `## Work Summary Statistics` 등

### 1.4 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/today/components/TodayAiAnalysis.tsx` | Accept-Language 헤더 추가 |
| `apps/api/src/domain/today/controller/today.controller.ts` | lang 파라미터 수신 및 전달 |
| `apps/api/src/domain/today/service/today.service.ts` | 프롬프트 언어 동적 변경, 영어 기반 데이터 |

---

## Phase 2: 이모지 → 단색 아이콘 전환

### 2.1 MissionSection CHECK_OPTIONS 수정

**파일**: `apps/web/src/domain/today/components/mission/MissionSection.tsx`

기존:
```typescript
{ result: 'HALF', score: 50, label: '50%', emoji: '😐', ... },
{ result: 'PARTIAL', score: 75, label: '75%', emoji: '🙂', ... },
{ result: 'ALL_DONE', score: 100, label: '100%', emoji: '✅', ... },
{ result: 'EXCEED', score: 110, label: '110%', emoji: '🔥', ... },
```

변경:
```typescript
{ result: 'HALF', score: 50, label: '50%', icon: 'Minus', ... },
{ result: 'PARTIAL', score: 75, label: '75%', icon: 'TrendingUp', ... },
{ result: 'ALL_DONE', score: 100, label: '100%', icon: 'CheckCircle', ... },
{ result: 'EXCEED', score: 110, label: '110%', icon: 'Zap', ... },
```

- `emoji` 필드를 `icon` 컴포넌트로 교체
- `<span>{opt.emoji}</span>` → `<Icon className="h-3.5 w-3.5" />`
- lucide-react import 추가: `Minus, TrendingUp, CheckCircle, Zap`

---

## Phase 3: 리치에디터 리스트 버튼 제거

### 3.1 RichTextEditor 수정

**파일**: `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx`

- L244-249의 BulletList, OrderedList 버튼 JSX 제거
- import에서 `List`, `ListOrdered` 제거
- TipTap StarterKit의 BulletList/OrderedList 확장은 유지 (키보드 단축키 지원)

**사이드 임팩트**: 이 에디터는 Meeting Notes, Todo, Issue, Notice 등에서도 사용됨. 사용자 요청이 명확하므로 전체 적용.

---

## Phase 4: AI 마크다운 출력 강화 + 이모지 금지

### 4.1 프롬프트 강화

**파일**: `apps/api/src/domain/today/service/today.service.ts`

System prompt에 추가 지시:
```
Use well-structured markdown formatting with headings (##, ###), bullet points, bold text, and tables where appropriate.
Do NOT use any emojis or colored icons in the output. Use plain text markers only (e.g., [HIGH], [WARNING], etc.).
```

myAiAnalysis 및 aiAnalysis 양쪽 모두 적용.

---

## Phase 5: Saved Reports 번역 기능

### 5.1 번역 API 엔드포인트 활용

기존 번역 인프라 확인:
- `apps/api/src/domain/translation/` 또는 `apps/api/src/domain/amoeba-talk/` 내 번역 서비스
- Claude API 기반 번역

### 5.2 프론트엔드 — ReportsModal에 번역 버튼 추가

**파일**: `apps/web/src/domain/today/components/TodayAiAnalysis.tsx`

- `ReportsModal` 내 리포트 상세 뷰에 "번역" 버튼 추가
- 언어 선택 드롭다운 (EN / KO / VI)
- 번역 요청 → 결과를 기존 내용 아래에 인라인 표시

### 5.3 백엔드 — 리포트 번역 엔드포인트

**파일**: `apps/api/src/domain/today/controller/today.controller.ts`

- `POST /today/reports/:id/translate` 엔드포인트 추가
- Claude API로 마크다운 텍스트 번역
- 캐시 가능 (`amb_content_translations` 테이블 활용)

**파일**: `apps/api/src/domain/today/service/today.service.ts`

- `translateReport(reportId, targetLang)` 메서드 추가

### 5.4 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/today/components/TodayAiAnalysis.tsx` | 번역 버튼 UI + 번역 결과 표시 |
| `apps/web/src/domain/today/hooks/useMyToday.ts` | `useTranslateReport` 훅 추가 |
| `apps/web/src/domain/today/service/today.service.ts` | `translateReport()` API 함수 |
| `apps/api/src/domain/today/controller/today.controller.ts` | 번역 엔드포인트 |
| `apps/api/src/domain/today/service/today.service.ts` | 번역 로직 |
| `apps/web/src/locales/{en,ko,vi}/today.json` | 번역 관련 키 추가 |

---

## Phase 6: Today's Tasks(미션) 번역 기능

### 6.1 미션 번역 UI

**파일**: `apps/web/src/domain/today/components/mission/MissionSection.tsx`

- 미션 표시 영역(L144-195)에 번역 버튼 추가
- 언어 선택 → 번역 요청 → 인라인 결과 표시

### 6.2 백엔드 — 미션 번역 엔드포인트

**파일**: `apps/api/src/domain/today/controller/today.controller.ts`

- `POST /today/mission/translate` 엔드포인트 추가
- HTML 콘텐츠를 번역 (마크다운 형식 유지)

### 6.3 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/today/components/mission/MissionSection.tsx` | 번역 버튼 + 결과 표시 |
| `apps/web/src/domain/today/hooks/useMyToday.ts` | `useTranslateMission` 훅 |
| `apps/web/src/domain/today/service/today.service.ts` | `translateMission()` API |
| `apps/api/src/domain/today/controller/today.controller.ts` | 번역 엔드포인트 |
| `apps/api/src/domain/today/service/today.service.ts` | 미션 번역 로직 |

---

## 전체 변경 파일 요약

### Backend (apps/api)
| 파일 | Phase |
|------|-------|
| `domain/today/controller/today.controller.ts` | 1, 5, 6 |
| `domain/today/service/today.service.ts` | 1, 4, 5, 6 |

### Frontend (apps/web)
| 파일 | Phase |
|------|-------|
| `domain/today/components/TodayAiAnalysis.tsx` | 1, 5 |
| `domain/today/components/mission/MissionSection.tsx` | 2, 6 |
| `domain/meeting-notes/components/RichTextEditor.tsx` | 3 |
| `domain/today/hooks/useMyToday.ts` | 5, 6 |
| `domain/today/service/today.service.ts` | 5, 6 |
| `locales/{en,ko,vi}/today.json` | 5, 6 |

---

## 구현 순서 및 의존성

```
Phase 1 (AI 언어) ─────┐
Phase 2 (이모지 제거) ──┤
Phase 3 (에디터 버튼) ──┼── 독립, 병렬 가능
Phase 4 (마크다운 강화) ─┘
Phase 5 (리포트 번역) ──── Phase 1 이후 (번역 인프라 공유)
Phase 6 (미션 번역) ────── Phase 5와 병렬 (동일 패턴)
```
