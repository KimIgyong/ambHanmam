# RPT-파일첨부-GoogleDrive연동-작업완료보고-20260329

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| **작업명** | 파일 첨부 + Google Drive 연동 개선 |
| **요청일** | 2026-03-29 |
| **완료일** | 2026-03-29 |
| **작업 범위** | 프론트엔드 Only (백엔드/DB 변경 없음) |

## 2. 구현 내용

### 2.1 이슈(Issues) - 로컬 업로드 폴백 (Phase 1)
- **문제**: Drive 미설정 법인에서 "Google Drive가 설정되지 않았습니다" 에러 발생, 파일 첨부 불가
- **해결**: `handleFileUpload`에 분기 로직 추가 — Drive 설정 시 Drive API, 미설정 시 로컬 서버 `/api/v1/files/upload` 사용
- **UI 개선**: 에러 메시지 블록 제거, 힌트 텍스트로 업로드 대상 안내

### 2.2 할일(Todos) - 파일 첨부 기능 추가 (Phase 2)
- **기존**: 파일 첨부 기능 없음
- **추가**: 설명 편집기 아래에 파일 첨부 섹션 (업로드/URL 탭)
- **기능**: 드래그 앤 드롭, 파일 브라우저, URL 직접 입력, 파일 삭제
- **저장**: 첨부파일 링크를 description HTML에 `<a>` 태그로 추가

### 2.3 DriveFilePickerModal 공통 컴포넌트 (Phase 3)
- **신규 생성**: `apps/web/src/components/common/DriveFilePickerModal.tsx`
- **기능**: 등록 폴더 기반 파일 브라우징, 폴더 탐색 (브레드크럼), 파일 검색, 다중 선택
- **활용**: RichTextEditor 툴바에 Drive 아이콘 버튼으로 통합

### 2.4 RichTextEditor Drive 연동 (Phase 3)
- **추가**: 툴바에 HardDrive 아이콘 버튼 (Drive 설정 시에만 표시)
- **동작**: 클릭 시 DriveFilePickerModal 오픈, 파일 선택 시 에디터에 `📎 파일명 (크기)` 링크 삽입

### 2.5 다국어 지원 (Phase 4)
- 이슈: `localUploadHint` (ko/en/vi)
- DriveFilePickerModal: `driveFilePicker.title/search/select/noFiles/selected` (ko/en/vi)

## 3. 변경 파일 목록

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/src/domain/issues/components/IssueFormModal.tsx` | 로컬 업로드 폴백, 에러 메시지 제거 |
| `apps/web/src/domain/todos/components/TodoFormModal.tsx` | 파일 첨부 UI/로직 전체 추가 |
| `apps/web/src/domain/meeting-notes/components/RichTextEditor.tsx` | Drive 파일 피커 버튼 + 모달 통합 |
| `apps/web/src/locales/ko/issues.json` | `localUploadHint` 추가 |
| `apps/web/src/locales/en/issues.json` | `localUploadHint` 추가 |
| `apps/web/src/locales/vi/issues.json` | `localUploadHint` 추가 |
| `apps/web/src/locales/ko/common.json` | `driveFilePicker` 섹션 추가 |
| `apps/web/src/locales/en/common.json` | `driveFilePicker` 섹션 추가 |
| `apps/web/src/locales/vi/common.json` | `driveFilePicker` 섹션 추가 |

### 신규 파일
| 파일 | 설명 |
|------|------|
| `apps/web/src/components/common/DriveFilePickerModal.tsx` | 재사용 가능한 Drive 파일 선택 모달 |

## 4. 빌드 결과

- **`npm run -w @amb/web build`**: ✅ 성공 (TypeScript + Vite 빌드)
- **에러**: 없음

## 5. 배포 상태

| 환경 | 상태 |
|------|------|
| 로컬 | ✅ 빌드 검증 완료 |
| 스테이징 | ⏳ 미배포 (커밋/푸시 후 배포 필요) |
| 프로덕션 | ⏳ 미배포 |

## 6. 설계 결정 사항

1. **백엔드 변경 없음**: 기존 `POST /api/v1/files/upload` + Drive API를 그대로 활용
2. **DB 변경 없음**: 이슈의 `iss_google_drive_link` 필드에 로컬 URL도 저장 (URL 형태 동일)
3. **할일 첨부파일 저장**: description HTML에 `<a>` 태그로 인라인 — 별도 테이블 없이 기존 description 필드 활용
4. **DriveFilePickerModal**: 공통 컴포넌트로 분리하여 향후 다른 모듈에서도 재사용 가능

## 7. 관련 문서

- 요구사항 분석: `docs/analysis/REQ-파일첨부-GoogleDrive연동-20260329.md`
- 작업 계획: `docs/plan/PLAN-파일첨부-GoogleDrive연동-작업계획-20260329.md`
- 테스트 케이스: `docs/test/TC-파일첨부-GoogleDrive연동-Test-20260329.md`
