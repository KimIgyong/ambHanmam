# TC-LobbyChat개선 테스트 케이스

- **작성일**: 2026-03-02
- **관련 작업**: Lobby Chat 개선: 번역 DB 저장 + 초대 UI + 명칭 변경

---

## 1. 번역 결과 DB 저장

### T-1. AI 번역 시 DB 저장 확인

| 항목 | 내용 |
|------|------|
| **전제 조건** | 사용자가 채널 멤버, 메시지가 존재, DB에 해당 번역 캐시 없음 |
| **테스트 절차** | 1. POST `/api/v1/talk/channels/:channelId/messages/:messageId/translate` body: `{ "target_lang": "Korean" }` |
| **기대 결과** | 1. Claude API 호출됨 2. amb_content_translations에 `trn_source_type='TALK_MESSAGE'`, `trn_source_id=messageId`, `trn_target_lang='ko'` 레코드 생성 3. 응답에 `id`(trnId), `translatedContent`, `detectedLanguage` 포함 |

### T-2. DB 캐시 히트 (동일 메시지+언어 재번역)

| 항목 | 내용 |
|------|------|
| **전제 조건** | T-1 실행 완료 (DB에 번역 캐시 존재) |
| **테스트 절차** | 1. 동일 messageId + target_lang="Korean"으로 다시 POST translate |
| **기대 결과** | 1. Claude API 호출 없이 DB 캐시에서 반환 2. 응답 `id`가 T-1과 동일 3. `translatedContent` 동일 |

### T-3. 언어명→ISO 코드 매핑

| 항목 | 내용 |
|------|------|
| **전제 조건** | - |
| **테스트 절차** | 1. target_lang="English" → DB에 `trn_target_lang='en'` 2. target_lang="Vietnamese" → `'vi'` 3. target_lang="Korean" → `'ko'` |
| **기대 결과** | 각 언어명이 올바른 ISO 코드로 변환되어 저장됨 |

### T-4. 번역 목록 조회 엔드포인트

| 항목 | 내용 |
|------|------|
| **전제 조건** | 특정 메시지에 2개 이상 언어 번역 존재 |
| **테스트 절차** | 1. GET `/api/v1/talk/channels/:channelId/messages/:messageId/translations` |
| **기대 결과** | 1. 응답 `data.translations` 배열에 각 번역 레코드 포함 2. 각 항목에 `id`, `targetLang`, `content`, `sourceLang` 포함 |

### T-5. 비멤버 접근 거부

| 항목 | 내용 |
|------|------|
| **전제 조건** | 사용자가 해당 채널의 멤버가 아님 |
| **테스트 절차** | 1. POST translate 또는 GET translations 호출 |
| **기대 결과** | 403 Forbidden 응답 |

---

## 2. 채팅방 초대 UI

### T-6. 초대 버튼 표시 조건

| 항목 | 내용 |
|------|------|
| **전제 조건** | PUBLIC 또는 PRIVATE 채널 선택, MemberPanel 열림 |
| **테스트 절차** | 1. MemberPanel 헤더 확인 |
| **기대 결과** | UserPlus 아이콘 초대 버튼이 표시됨 |

### T-7. DM 채널에서 초대 버튼 미표시

| 항목 | 내용 |
|------|------|
| **전제 조건** | DIRECT 타입 채널 선택, MemberPanel 열림 |
| **테스트 절차** | 1. MemberPanel 헤더 확인 |
| **기대 결과** | 초대 버튼이 표시되지 않음 |

### T-8. InviteMemberModal 멤버 필터링

| 항목 | 내용 |
|------|------|
| **전제 조건** | 채널에 멤버 A, B가 이미 존재. 법인에 A, B, C, D가 존재 |
| **테스트 절차** | 1. 초대 버튼 클릭 → InviteMemberModal 열림 |
| **기대 결과** | 목록에 C, D만 표시 (이미 멤버인 A, B 제외) |

### T-9. 멤버 검색 필터

| 항목 | 내용 |
|------|------|
| **전제 조건** | InviteMemberModal 열림, 초대 가능 멤버 존재 |
| **테스트 절차** | 1. 검색창에 이름 또는 이메일 일부 입력 |
| **기대 결과** | 입력한 텍스트에 매칭되는 멤버만 필터링 표시 |

### T-10. 멤버 초대 성공

| 항목 | 내용 |
|------|------|
| **전제 조건** | InviteMemberModal 열림, 초대 가능 멤버 C 존재 |
| **테스트 절차** | 1. 멤버 C 클릭 |
| **기대 결과** | 1. POST `/api/v1/talk/channels/:id/members` 호출 2. 모달 닫힘 3. channelDetail 쿼리 갱신 → MemberPanel에 C 표시 |

---

## 3. 명칭 변경

### T-11. 사이드바 명칭 변경

| 항목 | 내용 |
|------|------|
| **전제 조건** | 로그인 상태 |
| **테스트 절차** | 1. 사이드바 메뉴 확인 |
| **기대 결과** | EN: "Lobby Chat", KO: "로비 채팅", VI: "Lobby Chat" |

### T-12. Talk 페이지 타이틀

| 항목 | 내용 |
|------|------|
| **전제 조건** | Lobby Chat 페이지 진입 |
| **테스트 절차** | 1. 페이지 타이틀/헤더 확인 |
| **기대 결과** | EN: "Lobby Chat", KO: "로비 채팅", VI: "Lobby Chat" |

### T-13. Swagger API 문서 태그

| 항목 | 내용 |
|------|------|
| **전제 조건** | API 서버 실행 |
| **테스트 절차** | 1. Swagger UI `/api/docs` 접속 |
| **기대 결과** | "Lobby Chat - Channels", "Lobby Chat - Messages", "Lobby Chat - SSE" 태그 표시 |

### T-14. Backend MENU_NAMES 상수

| 항목 | 내용 |
|------|------|
| **전제 조건** | - |
| **테스트 절차** | 1. `MENU_NAMES.AMOEBA_TALK` 값 확인 |
| **기대 결과** | "Lobby Chat" |

---

## 4. 엣지 케이스

### T-15. 삭제된 메시지 번역 시도

| 항목 | 내용 |
|------|------|
| **전제 조건** | 메시지가 soft delete 상태 |
| **테스트 절차** | 1. POST translate 호출 |
| **기대 결과** | 404 Not Found 응답 |

### T-16. 새로고침 후 번역 복원 가능

| 항목 | 내용 |
|------|------|
| **전제 조건** | 특정 메시지 번역 완료 (DB 저장됨) |
| **테스트 절차** | 1. 브라우저 새로고침 2. GET translations API로 저장된 번역 조회 |
| **기대 결과** | DB에서 번역 데이터 반환 (Zustand 캐시 소실과 무관) |
