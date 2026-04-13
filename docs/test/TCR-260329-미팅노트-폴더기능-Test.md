# TC-미팅노트-폴더기능-Test-20260329

## 테스트 케이스

### 1. 백엔드 API

| # | 테스트 | 방법 | 기대 결과 |
|---|--------|------|-----------|
| B-1 | 폴더 생성 | `POST /meeting-notes/folders` `{ name: "프로젝트 회의" }` | 201, folderId 반환 |
| B-2 | 폴더 목록 | `GET /meeting-notes/folders` | 본인 폴더 목록 + noteCount |
| B-3 | 폴더 수정 | `PATCH /meeting-notes/folders/:id` `{ name: "변경됨" }` | 이름 변경 확인 |
| B-4 | 폴더 삭제 | `DELETE /meeting-notes/folders/:id` | 204, 소속 노트 folder_id → NULL |
| B-5 | 타인 폴더 수정 시도 | `PATCH /meeting-notes/folders/:otherId` | 403 Forbidden |
| B-6 | 타인 폴더 삭제 시도 | `DELETE /meeting-notes/folders/:otherId` | 403 Forbidden |
| B-7 | 노트 생성+폴더 | `POST /meeting-notes` `{ ..., folder_id: "..." }` | 생성된 노트에 folderId 포함 |
| B-8 | 노트 수정+폴더 | `PATCH /meeting-notes/:id` `{ folder_id: "..." }` | 폴더 변경 확인 |
| B-9 | 노트 수정+폴더 해제 | `PATCH /meeting-notes/:id` `{ folder_id: null }` | folderId → null |
| B-10 | 폴더별 목록 조회 | `GET /meeting-notes?folder_id=<uuid>` | 해당 폴더 노트만 |
| B-11 | 미분류 목록 조회 | `GET /meeting-notes?folder_id=uncategorized` | folder_id IS NULL 노트만 |
| B-12 | 전체 목록 조회 | `GET /meeting-notes` (folder_id 없음) | 모든 노트 |

### 2. 프론트엔드 UI

| # | 테스트 | 조작 | 기대 결과 |
|---|--------|------|-----------|
| F-1 | 폴더 사이드바 표시 | 페이지 로드 | "전체", "미분류" 기본 항목 + 사용자 폴더 목록 |
| F-2 | 새 폴더 추가 | + 버튼 → 이름 입력 → Enter | 폴더 생성, 목록에 추가 |
| F-3 | 폴더 선택으로 필터 | 폴더 클릭 | 해당 폴더 노트만 표시 |
| F-4 | "전체" 선택 | "전체" 클릭 | 모든 노트 표시 |
| F-5 | "미분류" 선택 | "미분류" 클릭 | 폴더 미지정 노트만 표시 |
| F-6 | 폴더 이름 수정 | ⋯ → 수정 → 이름 변경 → Enter | 이름 변경 반영 |
| F-7 | 폴더 삭제 | ⋯ → 삭제 → 확인 | 폴더 삭제, 노트 → 미분류 |
| F-8 | 노트 생성 시 폴더 선택 | 새 노트 모달 → 폴더 드롭다운 | 선택 폴더에 노트 생성 |
| F-9 | 노트 수정 시 폴더 변경 | 수정 모달 → 폴더 드롭다운 변경 | 폴더 변경 반영 |
| F-10 | 폴더+타입 필터 조합 | 폴더 선택 + 타입 필터 | 교차 필터링 정상 |
| F-11 | 폴더+검색 조합 | 폴더 선택 + 검색 | 폴더 내 검색 결과 |
| F-12 | 폴더 noteCount | 노트 추가/삭제 | 카운트 갱신 |

### 3. 엣지 케이스

| # | 시나리오 | 기대 결과 |
|---|---------|-----------|
| E-1 | 빈 폴더명으로 생성 시도 | 생성 안됨 (프론트 검증) |
| E-2 | 100자 초과 폴더명 | 400 Bad Request |
| E-3 | 존재하지 않는 folder_id로 노트 생성 | FK 에러 or 무시 |
| E-4 | 폴더 삭제 후 해당 폴더 선택 상태 | "전체"로 자동 이동 |
| E-5 | 폴더가 0개일 때 사이드바 | "전체"/"미분류"만 표시, 폴더 드롭다운 미표시 |
