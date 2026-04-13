# main 기준 변경분 요약 리포트

- **작성일**: 2026-03-11
- **비교 기준**: `main...HEAD` + 로컬 워킹트리(`git status --porcelain`)
- **현재 브랜치**: `main`
- **HEAD / main**: `542f976` / `542f976`

---

## 1. 요약

- 커밋 기준 차이: **없음**
  - `git log main..HEAD` 결과 없음
  - `git diff --name-status main...HEAD` 결과 없음
- 로컬 워킹트리 차이: **총 37건**
  - 추적 파일 변경: `3건`
  - 미추적 파일/디렉터리: `34건`

즉, 현재 `main`과의 차이는 모두 **미커밋 로컬 변경**이다.

---

## 2. 커밋 기준(main 대비) 변경

### 2.1 커밋 차이

- 없음

### 2.2 파일 차이

- 없음

---

## 3. 워킹트리 변경(미커밋)

### 3.1 추적 파일 변경 (3건)

- `M .claude/settings.local.json`
- `M goofy-dirac`
- `M peaceful-lovelace`

### 3.2 미추적 파일/디렉터리 (34건)

#### apps/mobile (25건)

- `apps/mobile/capacitor.config.d.ts`
- `apps/mobile/capacitor.config.js`
- `apps/mobile/capacitor.config.ts`
- `apps/mobile/index.html`
- `apps/mobile/package.json`
- `apps/mobile/postcss.config.js`
- `apps/mobile/src/App.tsx`
- `apps/mobile/src/components/`
- `apps/mobile/src/hooks/`
- `apps/mobile/src/i18n.ts`
- `apps/mobile/src/layouts/`
- `apps/mobile/src/lib/`
- `apps/mobile/src/main.tsx`
- `apps/mobile/src/pages/`
- `apps/mobile/src/router/`
- `apps/mobile/src/services/`
- `apps/mobile/src/stores/`
- `apps/mobile/src/styles/`
- `apps/mobile/src/tabs/`
- `apps/mobile/tailwind.config.js`
- `apps/mobile/tsconfig.json`
- `apps/mobile/tsconfig.node.json`
- `apps/mobile/vite.config.d.ts`
- `apps/mobile/vite.config.js`
- `apps/mobile/vite.config.ts`

#### docs (7건)

- `docs/analysis/REQ-초대이메일개선-20260311.md`
- `docs/analysis/REQ-파트너등록개선-20260311.md`
- `docs/implementation/RPT-모바일PWA-UI개선및푸시알림-작업완료보고-20260309.md`
- `docs/implementation/RPT-이메일템플릿관리-작업완료보고-20260311.md`
- `docs/plan/PLAN-이메일템플릿관리-작업계획-20260311.md`
- `docs/plan/PLAN-파트너등록개선-작업계획-20260311.md`
- `docs/test/TC-파트너등록개선-Test-20260311.md`

#### 기타 (2건)

- `gracious-mclean/`
- `interesting-mestorf/`

---

## 4. 판단 및 권고

- `main` 기준 릴리즈 관점에서는 추가 반영할 커밋 차이가 없다.
- 커밋 작업이 필요하면 주제별로 범위를 분리하는 것이 안전하다.
  - 문서만 커밋
  - 모바일 신규 파일 묶음 커밋
  - 서브모듈/포인터 변경 별도 검토
