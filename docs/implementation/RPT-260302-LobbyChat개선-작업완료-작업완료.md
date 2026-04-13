# RPT-LobbyChat개선 작업완료보고

- **작성일**: 2026-03-02
- **작업명**: Lobby Chat 개선: 번역 DB 저장 + 초대 UI + 명칭 변경
- **테스트 케이스**: TC-LobbyChat개선-Test-20260302.md

---

## 1. 구현 내용 요약

### 1-1. 번역 결과 DB 저장
- 기존: Zustand 캐시에만 저장 → 새로고침 시 소실
- 변경: `amb_content_translations` 테이블에 `sourceType='TALK_MESSAGE'`로 저장
- 번역 요청 시 DB 캐시 우선 조회 → 캐시 히트 시 Claude API 호출 생략
- 언어명→ISO 코드 매핑 (English→en, Korean→ko, Vietnamese→vi 등)
- `GET messages/:messageId/translations` 조회 엔드포인트 추가

### 1-2. 채팅방 초대 UI
- MemberPanel 헤더에 UserPlus 초대 버튼 추가 (DIRECT 채널 제외)
- InviteMemberModal 신규 컴포넌트: NewDmModal 패턴 재사용
  - `useEntityMembers()` 훅으로 법인 멤버 목록 조회
  - 이미 채널 멤버인 사용자 자동 필터 제외
  - 이름/이메일 검색 필터
  - 선택 시 `useAddMember()` 호출 → 성공 시 channelDetail 쿼리 invalidate + 모달 닫기

### 1-3. 명칭 변경 "Amoeba Talk" → "Lobby Chat"
- 코드 상수(AMOEBA_TALK), 폴더명, URL 경로는 유지
- 사용자 노출 텍스트만 변경: 사이드바, 페이지 타이틀, Swagger 태그, Backend 상수

---

## 2. 변경 파일 목록

### Backend (5개 수정)
| 파일 | 변경 내용 |
|------|-----------|
| `apps/api/src/domain/amoeba-talk/service/message-translate.service.ts` | ContentTranslationEntity 주입, DB 캐시 조회/upsert, toLangCode 헬퍼, getTranslations() 메서드 |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | GET :messageId/translations 엔드포인트 추가, ApiTags → "Lobby Chat - Messages" / "Lobby Chat - SSE" |
| `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts` | ApiTags → "Lobby Chat - Channels" |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | ContentTranslationEntity forFeature 등록 |
| `apps/api/src/global/constant/menu-code.constant.ts` | MENU_NAMES.AMOEBA_TALK → "Lobby Chat" |

### Frontend (5개 수정 + 1개 신규)
| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/src/domain/amoeba-talk/components/InviteMemberModal.tsx` | **신규** - 채널 멤버 초대 모달 |
| `apps/web/src/domain/amoeba-talk/pages/AmoebaTalkPage.tsx` | InviteMemberModal import + 렌더링 |
| `apps/web/src/domain/amoeba-talk/components/MemberPanel.tsx` | UserPlus 초대 버튼 추가 |
| `apps/web/src/domain/amoeba-talk/store/talk.store.ts` | showInviteModal 상태 추가 |
| `apps/web/src/domain/amoeba-talk/service/talk.service.ts` | getTranslations() API 메서드 추가 |

### 번역 파일 (6개 수정)
| 파일 | 변경 |
|------|------|
| `locales/en/common.json` | sidebar.amoebaTalk → "Lobby Chat" |
| `locales/ko/common.json` | sidebar.amoebaTalk → "로비 채팅" |
| `locales/vi/common.json` | sidebar.amoebaTalk → "Lobby Chat" |
| `locales/en/talk.json` | title → "Lobby Chat" + inviteMember, alreadyMember, memberInvited 키 추가 |
| `locales/ko/talk.json` | title → "로비 채팅" + 초대 관련 키 추가 |
| `locales/vi/talk.json` | title → "Lobby Chat" + 초대 관련 키 추가 |

---

## 3. 빌드 결과

| 환경 | 결과 |
|------|------|
| Frontend (`npx tsc --noEmit`) | **PASS** (에러 0) |
| Backend (`npx tsc --noEmit`) | amoeba-talk 관련 에러 0 (기존 다른 도메인 에러 존재) |

---

## 4. 배포 상태

- **로컬**: 미배포 (커밋 전)
- **스테이징**: 미배포
- **프로덕션**: 미배포

---

## 5. 비고

- `amb_content_translations` 테이블은 이미 존재하므로 DB 마이그레이션 불필요
- 기존 Zustand 번역 캐시는 그대로 유지 (프론트 즉시 표시용). DB는 영속 캐시 역할
- InviteMemberModal은 기존 `useAddMember()` 훅 + `POST channels/:id/members` API 재사용
