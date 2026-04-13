# TC-프로젝트상세페이지-UX개선-Test-20260328

---

## 1. Phase 1: Overview 컴팩트 레이아웃 + TranslationPanel

### TC-1.1: 기본 정보 카드 레이아웃 확인
- **전제**: 프로젝트 상세 페이지 → Overview 탭 진입
- **기대 결과**: 
  - 각 필드가 "라벨 : 값" 가로 배치로 표시됨
  - 2칸 그리드 유지 (코드/상태, 카테고리/우선순위, 제안자/PM, 시작일/종료일)
  - 프로젝트명은 col-span-2로 한 줄 전체 차지
- **Pass/Fail**: [ ]

### TC-1.2: 편집 모드 동작
- **전제**: Overview 탭 → Edit 버튼 클릭
- **기대 결과**: 
  - 프로젝트명, 제안자, PM, 시작일, 종료일 필드가 인라인 입력으로 변경
  - Save → 저장 성공, Cancel → 편집 취소
  - 레이아웃이 가로형 유지됨 (편집 중에도)
- **Pass/Fail**: [ ]

### TC-1.3: Summary TranslationPanel 동작
- **전제**: Summary 필드가 있는 프로젝트
- **기대 결과**: 
  - Summary 텍스트 하단에 TranslationPanel 렌더링
  - ko/en/vi 번역 탭 표시
  - "Translate" 또는 "Translate All" 클릭 시 SSE 스트리밍 번역 수행
- **Pass/Fail**: [ ]

### TC-1.4: Summary 없는 경우
- **전제**: Summary 필드가 null인 프로젝트
- **기대 결과**: Summary 섹션 전체 미표시 (TranslationPanel 포함)
- **Pass/Fail**: [ ]

---

## 2. Phase 2: Import Issues 소스 선택 UX

### TC-2.1: 모달 초기 상태
- **전제**: Issues 탭 → Import Issues 버튼 클릭 → 모달 오픈
- **기대 결과**: 
  - Redmine/Asana 탭이 상단에 표시 (둘 다 미선택 상태)
  - 본문에 "가져올 소스를 선택하세요" 안내 메시지 + 아이콘 표시
  - Redmine 데이터 로딩이 자동으로 시작되지 않음
- **Pass/Fail**: [ ]

### TC-2.2: 소스 선택 후 동작
- **전제**: Import 모달 → Redmine 탭 클릭
- **기대 결과**: 
  - Redmine 탭이 활성화 (하단 보더)
  - Redmine 도구 목록/연결 확인 API 호출 시작
  - Redmine Import Content 렌더링
- **Pass/Fail**: [ ]

### TC-2.3: Asana 소스 전환
- **전제**: Redmine 선택 상태 → Asana 탭 클릭
- **기대 결과**: 
  - Asana Import Content로 전환
  - Asana 데이터 로딩 시작
- **Pass/Fail**: [ ]

---

## 3. Phase 3: Notes 탭

### TC-3.1: Notes 탭 표시
- **전제**: 프로젝트 상세 페이지 진입
- **기대 결과**: 
  - 탭 순서: Overview → **Notes** → Issues → Kanban → WBS → Gantt
  - Notes 탭에 StickyNote 아이콘 표시
- **Pass/Fail**: [ ]

### TC-3.2: 연결된 노트가 있는 경우
- **전제**: 회의록에서 해당 프로젝트를 Related Projects로 연결한 상태
- **기대 결과**: 
  - 노트 목록 표시 (제목, 유형 뱃지, 작성자, 작성일, visibility)
  - Meeting Note은 FileText 아이콘(파란색), Memo는 StickyNote 아이콘(앰버)
  - 노트 클릭 시 `/meeting-notes/:noteId`로 네비게이션
- **Pass/Fail**: [ ]

### TC-3.3: 연결된 노트가 없는 경우
- **전제**: 해당 프로젝트에 연결된 노트 없음
- **기대 결과**: 
  - "연결된 노트가 없습니다" 빈 상태 메시지 표시
  - FileText 아이콘(회색) + 텍스트
- **Pass/Fail**: [ ]

### TC-3.4: 삭제된 노트 필터링
- **전제**: 프로젝트에 연결된 노트 중 일부가 soft delete 된 상태
- **기대 결과**: soft delete된 노트는 목록에 표시되지 않음
- **Pass/Fail**: [ ]

---

## 4. Phase 4: 프로젝트 코멘트

### TC-4.1: 코멘트 입력 및 등록
- **전제**: Overview 탭 하단의 코멘트 섹션
- **기대 결과**: 
  - textarea에 텍스트 입력 가능
  - "등록" 버튼 클릭 또는 Ctrl+Enter → 코멘트 등록
  - 등록 후 입력 필드 초기화, 목록에 새 코멘트 표시
- **Pass/Fail**: [ ]

### TC-4.2: 빈 코멘트 제출 방지
- **전제**: textarea가 빈 상태
- **기대 결과**: "등록" 버튼이 비활성화 (disabled)
- **Pass/Fail**: [ ]

### TC-4.3: 코멘트 목록 표시
- **전제**: 코멘트가 등록된 프로젝트
- **기대 결과**: 
  - 코멘트별: 유저 아바타 (이름 첫 글자), 이름, 날짜, 내용 표시
  - 시간순 정렬 (ASC)
- **Pass/Fail**: [ ]

### TC-4.4: 본인 코멘트 삭제
- **전제**: 내가 작성한 코멘트에 마우스 호버
- **기대 결과**: 
  - 삭제 아이콘(Trash2) 표시
  - 클릭 시 confirm 다이얼로그 → 확인 시 soft delete
  - 목록에서 해당 코멘트 제거
- **Pass/Fail**: [ ]

### TC-4.5: 타인 코멘트 삭제 불가
- **전제**: 다른 사용자가 작성한 코멘트
- **기대 결과**: 삭제 아이콘 미표시
- **Pass/Fail**: [ ]

### TC-4.6: 코멘트 없는 초기 상태
- **전제**: 코멘트가 없는 프로젝트
- **기대 결과**: "코멘트가 없습니다" 안내 텍스트 표시
- **Pass/Fail**: [ ]

---

## 5. i18n 테스트

### TC-5.1: 한국어 표시
- **전제**: 언어 설정 ko
- **기대 결과**: "노트", "코멘트", "연결된 노트가 없습니다" 등 한국어 표시
- **Pass/Fail**: [ ]

### TC-5.2: 영어 표시
- **전제**: 언어 설정 en
- **기대 결과**: "Notes", "Comments", "No linked notes" 등 영어 표시
- **Pass/Fail**: [ ]

### TC-5.3: 베트남어 표시
- **전제**: 언어 설정 vi
- **기대 결과**: "Ghi chú", "Bình luận" 등 베트남어 표시
- **Pass/Fail**: [ ]

---

## 6. 엣지 케이스

### TC-6.1: 프로젝트 접근 권한
- **전제**: 타 법인 프로젝트 접근 시도
- **기대 결과**: EntityGuard에 의해 차단
- **Pass/Fail**: [ ]

### TC-6.2: 코멘트 API에 빈 content 전송
- **전제**: POST /project/projects/:id/comments body: `{ content: "" }`
- **기대 결과**: 400 BadRequest 에러 반환
- **Pass/Fail**: [ ]
