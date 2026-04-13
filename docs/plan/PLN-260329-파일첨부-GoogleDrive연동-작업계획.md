# 작업 계획서: 파일 첨부 — Google Drive 연동 강화

**문서번호**: PLAN-파일첨부-GoogleDrive연동-작업계획-20260329  
**작성일**: 2026-03-29  
**기반 분석서**: REQ-파일첨부-GoogleDrive연동-20260329  

---

## 1. 구현 전략 요약

**핵심 원칙**: 기존 인프라(Drive + 로컬 업로드) 최대 활용, 최소 변경으로 최대 효과

| Phase | 목표 | 변경 범위 |
|-------|------|-----------|
| 1 | 이슈 파일 업로드 — Drive 미설정 시 로컬 Fallback | 프론트엔드만 |
| 2 | 할일 파일 첨부 UI 추가 | 프론트엔드만 |
| 3 | 미팅노트 Drive 파일 선택 모달 | 프론트엔드 (공통 컴포넌트) |
| 4 | i18n 번역 추가 | 프론트엔드 (ko/en/vi) |

> **DB 변경 없음**: 이슈는 `iss_google_drive_link` (text) 필드에 URL들을 저장하는 기존 방식 유지. 할일은 `tdo_description` (HTML) 내 `<a>` 태그로 파일 링크 삽입하는 RichTextEditor 패턴 활용. 별도 Attachment 엔티티/테이블 생성 불필요.

---

## 2. Phase 1: 이슈 파일 업로드 로컬 Fallback

### 목표
- Drive 미설정 시에도 로컬 `/files/upload` API로 파일 업로드 가능하게 변경

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/src/domain/issues/components/IssueFormModal.tsx` | `handleFileUpload` 함수에 Drive/로컬 분기 추가, UI Fallback 메시지 → 업로드 UI로 전환 |

### 구현 상세
1. `UploadedFile` 인터페이스에 `source: 'drive' | 'local'` 필드 추가
2. `handleFileUpload` 함수 분기:
   - `driveConfigured && uploadFolderId` → 기존 Drive 업로드
   - else → `/api/v1/files/upload` 로컬 업로드, `webViewLink` = `/api/v1/files/{storedName}/download?name={originalName}`
3. Upload 탭 UI: `driveConfigured` 여부 무관하게 드래그&드롭 영역 항상 표시
4. 힌트 텍스트 분기: Drive 설정됨 → "Google Drive에 자동 업로드됩니다" / 미설정 → "서버에 업로드됩니다"

### 사이드 임팩트
- `handleSubmit`에서 `uploadedFiles.map(f => f.webViewLink).join('\n')` → Drive/로컬 URL 모두 동일하게 처리됨 (URL 문자열이므로 호환)
- 기존 Drive 업로드 동작에 영향 없음

---

## 3. Phase 2: 할일 파일 첨부 UI

### 목표
- TodoDetailModal에 파일 첨부 섹션 추가

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/src/domain/todos/components/TodoDetailModal.tsx` | Description 영역 아래에 파일 첨부 섹션(Upload + URL) 추가 |

### 구현 상세
- 이미 RichTextEditor를 코멘트 섹션에서 사용 중 → 코멘트에서 파일 첨부 가능
- TodoDetailModal의 Description 아래에 간이 파일 업로드 영역 추가 (Drive 우선 + 로컬 Fallback)
- 업로드된 파일 링크를 Description에 `<a>` 태그로 append하는 방식 (별도 필드 불필요)
- **단, todo 수정 API에 description 업데이트를 포함해야 함** → 이미 기존 TodoFormModal에서 description 수정 가능

### 사이드 임팩트
- 없음. 기존 코멘트 RichTextEditor 파일 업로드 유지

---

## 4. Phase 3: 미팅노트 Drive 파일 선택 모달

### 목표
- RichTextEditor 툴바에 "Drive에서 선택" 버튼 추가
- 재사용 가능한 DriveFilePickerModal 공통 컴포넌트 생성

### 변경/신규 파일
| 파일 | 유형 | 변경 내용 |
|------|------|-----------|
| `apps/web/src/shared/components/DriveFilePickerModal.tsx` | **신규** | Drive 폴더 탐색 + 파일 선택 모달 |
| `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx` | 수정 | 툴바에 Drive 파일 선택 버튼 추가 |

### DriveFilePickerModal 구현
- Props: `isOpen`, `onClose`, `onSelect(files: DriveFile[])`, `multiple?: boolean`
- 기존 `useDriveFiles`, `useRegisteredFolders`, `useDriveSearch` 훅 활용
- 폴더 탐색 + 검색 + 파일 선택 UI
- Drive 미설정 시 버튼 비노출 (RichTextEditor에서 `driveConfigured` 체크)

### RichTextEditor 변경
- 툴바에 Google Drive 아이콘 버튼 추가 (driveConfigured일 때만 표시)
- 파일 선택 시 `<a href="webViewLink">📎 filename (size)</a>` 형태로 에디터에 삽입

### 사이드 임팩트
- RichTextEditor를 사용하는 다른 모듈(이슈 코멘트, 할일 코멘트 등)에서도 Drive 파일 선택 가능해짐 (긍정적 효과)

---

## 5. Phase 4: i18n 번역 추가

### 변경 파일
| 파일 | 추가 키 |
|------|---------|
| `apps/web/src/locales/{ko,en,vi}/issues.json` | `form.localUploadHint`, `form.uploadToServer` |
| `apps/web/src/locales/{ko,en,vi}/todos.json` | `detail.fileAttachment`, `detail.attachFile`, `detail.attachedFiles` |
| `apps/web/src/locales/{ko,en,vi}/common.json` | `driveFilePicker.title`, `driveFilePicker.search`, `driveFilePicker.select`, `driveFilePicker.noFiles`, `driveFilePicker.selectFromDrive` |

---

## 6. 변경 대상 파일 총정리

### 신규 파일
- `apps/web/src/shared/components/DriveFilePickerModal.tsx`

### 수정 파일
- `apps/web/src/domain/issues/components/IssueFormModal.tsx`
- `apps/web/src/domain/todos/components/TodoDetailModal.tsx`
- `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx`
- `apps/web/src/locales/ko/issues.json`
- `apps/web/src/locales/en/issues.json`
- `apps/web/src/locales/vi/issues.json`
- `apps/web/src/locales/ko/todos.json`
- `apps/web/src/locales/en/todos.json`
- `apps/web/src/locales/vi/todos.json`
- `apps/web/src/locales/ko/common.json`
- `apps/web/src/locales/en/common.json`
- `apps/web/src/locales/vi/common.json`

### 백엔드 변경: 없음
### DB 변경: 없음

---

## 7. 사이드 임팩트 분석

| 영역 | 영향도 | 설명 |
|------|--------|------|
| Issue 생성/수정 | 낮음 | Drive URL과 로컬 URL이 동일하게 `iss_google_drive_link`에 저장. 기존 이슈 데이터 호환 |
| Issue 상세 보기 | 없음 | `googleDriveLink`를 URL로 렌더링 → 로컬/Drive URL 모두 동작 |
| RichTextEditor | 낮음 | 기존 파일/이미지 업로드 동작 유지, Drive 선택 버튼만 추가 |
| Todo 코멘트 | 없음 | 기존 RichTextEditor 동작 유지 |
| 빌드 | 낮음 | 프론트엔드만 변경, 타입 호환 |
