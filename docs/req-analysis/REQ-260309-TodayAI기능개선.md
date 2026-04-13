# 요구사항 분석서: Today AI 기능 개선

**문서번호**: REQ-TodayAI기능개선-20260309
**작성일**: 2026-03-09
**상태**: 분석 완료

---

## 1. 요구사항 요약

| # | 요구사항 | 유형 | 영향 범위 |
|---|---------|------|----------|
| R1 | AI Work Coaching / AI Workload Analysis — 사용자 언어 선택에 따라 응답 언어 변경 | 버그 수정 | Backend + Frontend |
| R2 | Saved Reports — 번역 기능 추가 | 신규 기능 | Frontend |
| R3 | Today's Tasks(미션) 작성 시 번역 기능 추가 | 신규 기능 | Frontend |
| R4 | 모든 AI 작성 시 마크다운 문서로 작성 | 개선 | Backend |
| R5 | 아이콘은 단색 아이콘만 사용 (이모지 제거) | UI 개선 | Frontend |
| R6 | 리치에디터 리스트/불릿 버튼 삭제 | 버그 대응 | Frontend |

---

## 2. AS-IS 현황 분석

### 2.1 AI 언어 설정 (R1)

**현재 상태**: AI 프롬프트에 한국어 고정

- `today.service.ts:520-521`:
  ```
  Write your response in Korean. Use markdown formatting.
  ```
- `today.service.ts:618-619`:
  ```
  Write your response in Korean. Use markdown formatting.
  ```
- User message도 한국어로 고정 (`마감`, `지연`, `없음` 등)
- 프론트엔드에서 `Accept-Language` 헤더를 전달하지 않음
- 백엔드 컨트롤러에서 언어 파라미터를 받지 않음

**문제**: 영어/베트남어 사용자도 무조건 한국어 AI 응답을 받음

### 2.2 Saved Reports 번역 (R2)

**현재 상태**: 번역 기능 없음

- `TodayAiAnalysis.tsx:190-279` (`ReportsModal`)
- 리포트 내용은 `ReactMarkdown`으로 렌더링
- 저장된 내용 그대로 표시, 번역 옵션 없음

### 2.3 Today's Tasks 번역 (R3)

**현재 상태**: 번역 기능 없음

- `MissionSection.tsx:34-218`
- RichTextEditor로 작성, HTML 저장
- 저장된 미션에 대한 번역 버튼 없음

### 2.4 AI 마크다운 출력 (R4)

**현재 상태**: 부분적으로 마크다운 사용

- System prompt에 `Use markdown formatting` 지시 있음
- User message 내의 섹션 제목은 `##` 마크다운 사용
- 프론트엔드에서 `ReactMarkdown`으로 렌더링
- **현재도 마크다운으로 작성 중** — 다만 프롬프트 강화로 더 구조화된 마크다운 출력 유도 필요

### 2.5 이모지 아이콘 사용 (R5)

**현재 상태**: 미션 달성도 평가에 이모지 사용

- `MissionSection.tsx:13-18` (`CHECK_OPTIONS`):
  - 😐 (50%), 🙂 (75%), ✅ (100%), 🔥 (110%)
- Team/All 패널의 MemberCard에서도 동일 이모지 사용 가능성

### 2.6 리치에디터 리스트/불릿 (R6)

**현재 상태**: 버튼 있으나 동작 불안정

- `RichTextEditor.tsx:244-249`: BulletList, OrderedList 버튼 존재
- TipTap StarterKit에 BulletList/OrderedList 포함
- **기능 자체는 TipTap에 구현되어 있으나 동작이 불안정한 것으로 보고됨**
- 사용자 요청: 버튼 제거

---

## 3. TO-BE 요구사항 상세

### 3.1 AI 응답 언어 다국어 지원 (R1)

- 프론트엔드에서 현재 선택된 언어(`localStorage amb-lang`)를 `Accept-Language` 헤더로 전송
- 백엔드 컨트롤러에서 `Accept-Language` 헤더 파싱
- AI 프롬프트의 언어 지시를 동적으로 변경:
  - `en` → `Write your response in English`
  - `ko` → `Write your response in Korean`
  - `vi` → `Write your response in Vietnamese`
- User message 내 한국어 레이블도 언어에 따라 변경 (or 영어로 통일하여 AI가 해석)

### 3.2 Saved Reports 번역 기능 (R2)

- 리포트 상세 보기에 "번역" 버튼 추가
- 기존 `amb_content_translations` 테이블 기반의 번역 시스템 활용 가능
- 또는 프론트엔드에서 Claude API로 직접 번역 요청
- 기존 Talk의 `MessageTranslateButton` 패턴 참고

### 3.3 Today's Tasks 번역 기능 (R3)

- 미션 작성 완료 후 표시 영역에 "번역" 버튼 추가
- 미션 HTML 내용을 번역 API로 전송
- 번역 결과를 인라인으로 표시

### 3.4 마크다운 출력 강화 (R4)

- System prompt에 마크다운 구조화 지시 추가:
  - 제목, 소제목, 리스트, 볼드, 테이블 활용
  - 이모지 사용 금지 (단색 텍스트만)

### 3.5 단색 아이콘 전환 (R5)

- `CHECK_OPTIONS`의 이모지를 lucide-react 아이콘으로 교체:
  - 😐 → `Minus` 또는 `CircleMinus`
  - 🙂 → `TrendingUp` 또는 `ArrowUp`
  - ✅ → `Check` 또는 `CheckCircle`
  - 🔥 → `Zap` 또는 `Star`

### 3.6 리치에디터 리스트 버튼 제거 (R6)

- `RichTextEditor.tsx`에서 BulletList, OrderedList 버튼 제거
- TipTap 확장은 유지 (키보드 단축키로는 여전히 사용 가능)

---

## 4. 기술 제약사항

| 항목 | 제약 |
|------|------|
| 언어 | en, ko, vi 3개 언어만 지원 |
| AI 모델 | claude-sonnet-4-20250514, max 4096 tokens |
| 번역 | 기존 `amb_content_translations` 테이블 + Claude 번역 인프라 활용 |
| SSE | AI 분석은 SSE 스트림으로 응답 |
| i18n | 프론트엔드 `useTranslation` 훅 사용 |

---

## 5. 사이드 임팩트 분석

| 변경 | 영향 | 위험도 |
|------|------|--------|
| AI 프롬프트 언어 변경 | AI 응답 품질 (비한국어) 검증 필요 | 중 |
| RichTextEditor 버튼 삭제 | Meeting Notes, Todo, Issue 등 공용 컴포넌트 | 높음 — 다른 도메인에도 영향 |
| 이모지 → 아이콘 | MissionSection + Team/All 패널 체크 표시 | 낮음 |
| Accept-Language 헤더 추가 | 프론트엔드 fetch 호출 수정 | 낮음 |

**주의**: RichTextEditor는 공용 컴포넌트이므로 리스트 버튼 삭제 시 Meeting Notes, Todo, Issue, Notice 등 모든 사용처에 영향.
→ **대안**: Today 미션 전용으로만 버튼을 숨기거나, 공용 에디터에서는 유지하고 미션용은 별도 설정

---

## 6. 참고 파일

### Backend
- `apps/api/src/domain/today/service/today.service.ts` (L495-689) — AI 프롬프트
- `apps/api/src/domain/today/controller/today.controller.ts` (L212-279) — AI 엔드포인트
- `apps/api/src/infrastructure/external/claude/claude.service.ts` — Claude API 연동

### Frontend
- `apps/web/src/domain/today/components/TodayAiAnalysis.tsx` — AI 분석/리포트 모달
- `apps/web/src/domain/today/components/mission/MissionSection.tsx` — 미션 섹션
- `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx` — 리치에디터 (공용)
- `apps/web/src/locales/{en,ko,vi}/today.json` — 번역 파일
