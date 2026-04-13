# 요구사항 분석서: 파일 첨부 — Google Drive 연동 강화

**문서번호**: REQ-파일첨부-GoogleDrive연동-20260329  
**작성일**: 2026-03-29  
**요청자**: 관리자  

---

## 1. 요구사항 요약

### 1-1. 이슈(Issues) 파일 첨부
- **현상**: 이슈 생성/수정 시 파일 업로드 탭에서 "Google Drive가 설정되지 않았습니다. 관리자에게 문의하세요." 메시지 노출
- **원인**: `IssueFormModal`이 Google Drive가 미설정이면 파일 업로드 자체를 차단 (Fallback 없음)
- **요구**: 법인 Entity 전용 Drive 설정(`/entity-settings/drive`)이 되어있으면 해당 드라이브로 연결, Drive 미설정 시에도 로컬 파일 업로드 Fallback 제공

### 1-2. 미팅노트(Meeting Notes) 파일 첨부
- **현상**: RichTextEditor에 이미지/파일 업로드 기능은 있으나, 별도 첨부파일 관리 UI 없음
- **요구**: Google Drive 파일 첨부 기능 추가 (Drive 브라우저에서 파일 선택 또는 업로드)

### 1-3. 할일(Todos) 파일 첨부  
- **현상**: 파일 첨부 기능 자체가 없음
- **요구**: Google Drive 파일 첨부 기능 추가

---

## 2. AS-IS 현황 분석

### 2-1. Google Drive 인프라 (이미 구축 완료)

| 계층 | 파일/모듈 | 상태 |
|------|-----------|------|
| **Infrastructure** | `google-drive.service.ts` — Service Account 인증, 파일 업로드/다운로드/검색, 폴더 관리 | ✅ 완성 |
| **Drive Settings** | `amb_drive_settings` 테이블 — 법인별/계층별 설정 (Own → Parent → Global) | ✅ 완성 |
| **Drive Folders** | `amb_drive_folders` 테이블 — 등록된 폴더 관리 | ✅ 완성 |
| **Drive Controller** | `/api/v1/drive/*` — status, upload, files, folders, search 등 11개 엔드포인트 | ✅ 완성 |
| **Entity Settings** | `/api/v1/entity-settings/drive` — 법인별 Drive 설정 CRUD + 연결 테스트 | ✅ 완성 |
| **Frontend Service** | `drive.service.ts` + `useDrive.ts` — 14개 API 메서드 + 12개 React 훅 | ✅ 완성 |
| **Drive UI** | `DocumentsPage.tsx` — 파일 브라우저, 폴더 탐색, 업로드, 검색 | ✅ 완성 |

### 2-2. 로컬 파일 업로드 인프라

| 계층 | 파일/모듈 | 상태 |
|------|-----------|------|
| **File Controller** | `/api/v1/files/upload` (POST), `/files/:filename` (GET), `/files/:filename/download` (GET) | ✅ 완성 |
| **저장 위치** | `process.cwd()/uploads` 로컬 파일시스템 | ✅ 동작 |
| **제한** | 10MB, 이미지/문서/압축파일 MIME 타입 허용 | ✅ |

### 2-3. 모듈별 파일 첨부 현황

| 모듈 | Drive 업로드 | 로컬 업로드 | 별도 Attachment 엔티티 | 첨부 UI |
|------|:---:|:---:|:---:|:---:|
| **이슈 생성/수정** (`IssueFormModal`) | ⚠️ Drive 필수, Fallback 없음 | ❌ | ❌ (HTML embed) | ✅ 탭 UI (Upload/URL) |
| **이슈 상세 코멘트** (`IssueDetailModal`) | ✅ RichTextEditor 사용 | ✅ Fallback | ❌ (HTML embed) | ✅ 에디터 내장 |
| **미팅노트 본문** (`RichTextEditor`) | ✅ 이미지 Drive 업로드 | ✅ 파일 로컬 Fallback | ❌ (HTML embed) | ✅ 드래그&드롭, 버튼 |
| **할일** (`TodoDetailModal`) | ❌ | ❌ | ❌ | ❌ 없음 |
| **공지사항** (`NoticeFormModal`) | ❌ 로컬만 | ✅ | ✅ `amb_notice_attachments` | ✅ 파일 목록 |
| **경비 요청** | ❌ 로컬만 | ✅ | ✅ `amb_expense_attachments` | ✅ FILE/LINK |
| **채팅** (`Amoeba Talk`) | ❌ 로컬만 | ✅ | ✅ `amb_talk_attachments` | ✅ |
| **빌링 문서** | ✅ Drive + 로컬 Fallback | ✅ | ✅ 별도 엔티티 | 자동 |

### 2-4. 이슈 파일 첨부 문제점 상세

**`IssueFormModal.tsx` (라인 73)**:
```typescript
const driveConfigured = driveStatus?.configured && registeredFolders.length > 0;
const uploadFolderId = registeredFolders.length > 0 ? registeredFolders[0].folderId : '';
```

- `driveConfigured === false`일 때: "Google Drive가 설정되지 않았습니다" 메시지만 표시
- **문제점**: 로컬 파일 업로드(`/files/upload`)로의 Fallback이 없음
- **비교**: `RichTextEditor`는 Drive 미설정 시 로컬 업로드를 Fallback으로 사용

**`drive.controller.ts` (라인 35-47) — `/api/v1/drive/status`**:
```typescript
if (entityId && user?.level === 'USER_LEVEL') {
  const settings = await this.driveSettingsService.getSettings(entityId);
  return { success: true, data: { configured: settings.configured } };
}
return { success: true, data: { configured: this.driveService.isConfigured() } };
```

- 법인별 Drive 설정이 있으면 `configured: true` 반환
- 환경변수 미설정 + 법인별 설정 미완료 = `configured: false`

### 2-5. 기존 첨부 패턴 비교

**패턴 A: 별도 Attachment 엔티티** (공지사항, 경비, 채팅)
- `amb_notice_attachments`: `ntaOriginalName, ntaStoredName, ntaFileSize, ntaMimeType`
- 장점: 구조화된 관리, 개별 첨부파일 삭제/조회 가능
- 단점: 별도 테이블/API 필요

**패턴 B: HTML 콘텐츠 내장** (미팅노트, 이슈 코멘트)
- `<a href="/api/v1/files/{uuid}/download?name=...">📎 filename (size)</a>`
- 장점: 추가 테이블 불필요, 에디터에서 자연스러운 UX
- 단점: 첨부파일만 따로 관리 불가

**패턴 C: Google Drive 직접 업로드** (이슈 생성, 빌링)
- Drive API로 업로드 → `webViewLink` 저장
- 장점: 대용량 파일 지원, Drive 내 관리
- 단점: Drive 설정 필수, 미설정 시 사용 불가

---

## 3. TO-BE 요구사항

### 3-1. 이슈 파일 첨부 개선

| 항목 | 내용 |
|------|------|
| **Drive 설정 시** | 기존 Drive 업로드 동작 유지 |
| **Drive 미설정 시** | 로컬 파일 업로드(`/files/upload`)로 Fallback |
| **업로드 결과 표시** | Drive → `webViewLink`, 로컬 → `/files/download` URL |
| **첨부 파일 목록** | 기존 UI 유지 (Drive/로컬 혼합 가능) |

### 3-2. 미팅노트 파일 첨부 강화

| 항목 | 내용 |
|------|------|
| **현재** | RichTextEditor 내 드래그&드롭/버튼으로 파일 업로드 (이미 동작) |
| **추가** | Drive 파일 브라우저에서 기존 파일 선택하여 링크 첨부 |
| **UI** | 에디터 툴바에 "Google Drive에서 선택" 버튼 추가 |

### 3-3. 할일 파일 첨부 추가

| 항목 | 내용 |
|------|------|
| **현재** | 파일 첨부 기능 없음 |
| **추가** | TodoDetailModal/TodoFormModal에 파일 첨부 섹션 추가 |
| **방식** | IssueFormModal과 동일 패턴 (Upload/URL 탭) + Drive Fallback |

---

## 4. 갭 분석 (AS-IS → TO-BE)

### 4-1. 이슈 (Gap: 작음)

| AS-IS | TO-BE | 변경량 |
|-------|-------|--------|
| Drive 미설정 시 업로드 차단 | Drive 미설정 시 로컬 Fallback | 프론트 IssueFormModal 수정 |
| Drive만 사용 | Drive 우선 + 로컬 Fallback | handleFileUpload 함수 분기 추가 |
| Drive 전용 파일 목록 UI | Drive/로컬 통합 표시 | UploadedFile 인터페이스 확장 |

### 4-2. 미팅노트 (Gap: 중간)

| AS-IS | TO-BE | 변경량 |
|-------|-------|--------|
| 드래그&드롭/버튼 업로드만 | + Drive 파일 선택 브라우저 | 파일 선택 모달 컴포넌트 신규 |
| 이미지 → Drive, 파일 → 로컬 | 동작 유지 + Drive 기존 파일 링크 첨부 | RichTextEditor 툴바 버튼 추가 |

### 4-3. 할일 (Gap: 큼)

| AS-IS | TO-BE | 변경량 |
|-------|-------|--------|
| 첨부 기능 없음 | Upload/URL 탭 + Drive Fallback | TodoDetailModal에 첨부 섹션 추가 |
| 코멘트에 텍스트만 | 코멘트에 파일 첨부 가능 (RichTextEditor) | 코멘트 에디터 전환 |

---

## 5. 사용자 플로우

### 5-1. 이슈 파일 업로드 — Drive 설정됨
```
사용자 → 이슈 생성 → 파일 첨부 탭 클릭
→ Drive 설정 확인 (configured: true)
→ 파일 선택/드래그 → Google Drive API 업로드
→ webViewLink 저장 → 파일 목록에 Drive 아이콘과 함께 표시
```

### 5-2. 이슈 파일 업로드 — Drive 미설정 (신규)
```
사용자 → 이슈 생성 → 파일 첨부 탭 클릭
→ Drive 설정 확인 (configured: false)
→ 파일 선택/드래그 → 로컬 /files/upload API 업로드
→ storedName + originalName 저장 → 파일 목록에 로컬 아이콘과 함께 표시
```

### 5-3. 미팅노트 Drive 파일 선택 (신규)
```
사용자 → 미팅노트 작성 → 에디터 툴바 "Drive에서 선택" 클릭
→ Drive 설정 확인 (configured: true) → 파일 브라우저 모달 열림
→ 등록된 폴더 → 파일 목록 → 파일 선택
→ 에디터에 다운로드 링크 삽입: 📎 filename (size)
```

### 5-4. 할일 파일 첨부 (신규)
```
사용자 → 할일 상세 → 파일 첨부 섹션
→ Upload 탭: 파일 선택/드래그 → Drive 또는 로컬 업로드
→ URL 탭: Google Drive URL 직접 입력
→ 첨부 파일 목록 표시
```

---

## 6. 기술 제약사항

### 6-1. 보안
- 로컬 파일 업로드: 기존 MIME 타입 필터링 + 10MB 제한 유지
- Drive 업로드: 기존 50MB 제한 유지
- 파일 접근: `ent_id` 기반 격리 필요 (Drive 폴더가 법인별로 관리됨)

### 6-2. 호환성
- IssueFormModal의 `UploadedFile` 인터페이스 확장 시 기존 Drive 업로드 데이터와 호환 유지
- RichTextEditor의 기존 드래그&드롭 동작에 영향 없어야 함
- TodoDetailModal에 첨부 추가 시 기존 코멘트 UX 유지

### 6-3. DB 변경
- **이슈/할일**: 별도 Attachment 엔티티 추가 여부 결정 필요
  - 옵션 A: `amb_issue_attachments`, `amb_todo_attachments` 테이블 신규 (권장)
  - 옵션 B: HTML 콘텐츠에 `<a>` 태그 임베드 (현재 미팅노트 방식)
- **옵션 A 권장 이유**: 이슈/할일은 별도 첨부파일 관리(삭제, 다운로드 카운트 등)가 필요, 기존 공지사항 패턴과 일관성

### 6-4. 스테이징/프로덕션 DB
- TypeORM synchronize 비활성화 → 새 테이블 추가 시 수동 SQL 필요
- `CREATE TABLE amb_issue_attachments ...` + `CREATE TABLE amb_todo_attachments ...`

---

## 7. 구현 우선순위 제안

| 순번 | 작업 | 난이도 | 임팩트 |
|:---:|------|:---:|:---:|
| 1 | 이슈 파일 업로드 로컬 Fallback 추가 | 낮음 | 높음 |
| 2 | 이슈 Attachment 엔티티 + API | 중간 | 중간 |
| 3 | 할일 파일 첨부 기능 추가 | 중간 | 중간 |
| 4 | 미팅노트 Drive 파일 선택 모달 | 중간 | 중간 |
| 5 | 할일 Attachment 엔티티 + API | 중간 | 중간 |

---

## 8. 변경 대상 파일 (예상)

### Backend (신규)
- `apps/api/src/domain/issues/entity/issue-attachment.entity.ts`
- `apps/api/src/domain/todo/entity/todo-attachment.entity.ts`

### Backend (수정)
- `apps/api/src/domain/issues/issue.module.ts` — 엔티티 등록
- `apps/api/src/domain/issues/service/issue.service.ts` — 첨부파일 CRUD
- `apps/api/src/domain/issues/controller/issue.controller.ts` — 첨부 엔드포인트
- `apps/api/src/domain/todo/todo.module.ts`
- `apps/api/src/domain/todo/service/todo.service.ts`
- `apps/api/src/domain/todo/controller/todo.controller.ts`

### Frontend (수정)
- `apps/web/src/domain/issues/components/IssueFormModal.tsx` — 로컬 Fallback
- `apps/web/src/domain/todos/components/TodoDetailModal.tsx` — 첨부 섹션
- `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx` — Drive 선택 버튼

### Frontend (신규)
- `apps/web/src/shared/components/DriveFilePickerModal.tsx` — Drive 파일 선택 모달 (공통)

### i18n (수정)
- `apps/web/src/locales/{ko,en,vi}/issues.json` — Fallback 관련 텍스트
- `apps/web/src/locales/{ko,en,vi}/todos.json` — 첨부 관련 텍스트
- `apps/web/src/locales/{ko,en,vi}/common.json` — 공통 첨부 텍스트

### SQL (신규)
- `sql/migration_issue_attachments.sql`
- `sql/migration_todo_attachments.sql`
