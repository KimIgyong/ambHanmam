# TC-앱스토어구독앱-CustomApps등록-Test-20260330

## 1. 개요

| 항목 | 내용 |
|------|------|
| 기능 | 앱스토어 구독앱 → Custom Apps 가져오기 |
| 관련 분석서 | REQ-앱스토어구독앱-CustomApps등록-20260330.md |
| 관련 계획서 | PLAN-앱스토어구독앱-CustomApps등록-작업계획-20260330.md |
| 테스트 일자 | 2026-03-30 |

---

## 2. 단위 테스트 케이스

### 2.1 Service - `getImportableApps(entityId)`

| TC# | 설명 | 입력 | 기대 결과 |
|-----|------|------|-----------|
| S-IMP-001 | PUBLISHED 앱만 반환 | entityId에 PUBLISHED 1개 + DRAFT 1개 설치 | PUBLISHED 앱 1개만 반환 |
| S-IMP-002 | isRegistered 플래그 - sourcePapId 기준 | 이미 등록된 앱(ecaSourcePapId 일치) 존재 | isRegistered=true |
| S-IMP-003 | isRegistered 플래그 - code 기준 | 이미 등록된 앱(ecaCode 일치) 존재 | isRegistered=true |
| S-IMP-004 | 미등록 앱 | 등록되지 않은 앱 | isRegistered=false |
| S-IMP-005 | 빈 목록 | 설치된 앱 없음 | 빈 배열 반환 |
| S-IMP-006 | app 관계 null 필터링 | install.app === null인 항목 포함 | null인 항목 제외 |

### 2.2 Service - `importFromStore(entityId, papId, overrides, userId)`

| TC# | 설명 | 입력 | 기대 결과 |
|-----|------|------|-----------|
| S-IMP-010 | 성공 - 기본 가져오기 | 유효한 install + PUBLISHED app | Custom App 생성, sourcePapId 설정 |
| S-IMP-011 | 성공 - overrides 적용 | overrides.name, overrides.url 설정 | 오버라이드 값 반영 |
| S-IMP-012 | auth_mode 매핑 - oauth2→jwt | app.papAuthMode='oauth2' | ecaAuthMode='jwt' |
| S-IMP-013 | auth_mode 매핑 - SSO_JWT→jwt | app.papAuthMode='SSO_JWT' | ecaAuthMode='jwt' |
| S-IMP-014 | 실패 - 미설치 앱 | installRepo.findOne → null | NotFoundException |
| S-IMP-015 | 실패 - UNPUBLISHED 앱 | app.papStatus='DRAFT' | BadRequestException |
| S-IMP-016 | 실패 - 코드 중복 | ecaCode와 동일한 custom app 존재 | ConflictException (code) |
| S-IMP-017 | 실패 - sourcePapId 중복 | ecaSourcePapId와 동일한 custom app 존재 | ConflictException (source) |
| S-IMP-018 | 코드 정규화 | papCode='My App_V2' | ecaCode='my-app-v2' (소문자+하이픈) |

### 2.3 Controller - 엔드포인트

| TC# | 설명 | 메서드 | 기대 결과 |
|-----|------|--------|-----------|
| C-IMP-001 | GET /importable - 인증 필요 | @Auth() 적용 여부 | 인증 없으면 401 |
| C-IMP-002 | GET /importable - OwnEntityGuard | USER_LEVEL 타 법인 접근 | 403 Forbidden |
| C-IMP-003 | POST /import/:papId - UUID 유효성 | papId='not-uuid' | 400 Bad Request |
| C-IMP-004 | POST /import/:papId - 표준 응답 | 유효한 요청 | { success: true, data, timestamp } |

---

## 3. 통합 테스트 시나리오

### 3.1 정상 플로우

| Step | 동작 | 검증 |
|------|------|------|
| 1 | 앱스토어에 앱 구독 (PUBLISHED, ACTIVE) | partner_app_installs 레코드 존재 |
| 2 | GET /custom-apps/importable 호출 | 구독 앱 목록 반환, isRegistered=false |
| 3 | POST /custom-apps/import/:papId 호출 | Custom App 생성 성공 |
| 4 | GET /custom-apps 호출 | 새 앱이 목록에 포함 |
| 5 | GET /custom-apps/importable 재호출 | 해당 앱 isRegistered=true |

### 3.2 중복 등록 방지 플로우

| Step | 동작 | 검증 |
|------|------|------|
| 1 | POST /import/:papId 호출 (최초) | 성공 |
| 2 | POST /import/:papId 재호출 (동일 papId) | 409 ConflictException |

---

## 4. 엣지 케이스

| EC# | 시나리오 | 기대 결과 |
|-----|----------|-----------|
| EC-001 | 구독 후 앱이 DRAFT로 변경된 경우 | importable 목록에서 제외, import 시 BadRequestException |
| EC-002 | 구독 비활성(paiIsActive=false) | importable 목록에서 제외 |
| EC-003 | soft-deleted custom app과 동일 code | 재등록 가능 (ecaDeletedAt IS NOT NULL 제외) |
| EC-004 | overrides에 빈 객체 전달 | 파트너앱 기본값으로 생성 |
| EC-005 | papIcon이 null인 파트너앱 | 'AppWindow' 기본값 적용 |

---

## 5. 데이터 격리 검증

| DI# | 시나리오 | 기대 결과 |
|-----|----------|-----------|
| DI-001 | USER_LEVEL A법인 → B법인 importable 조회 | OwnEntityGuard에 의해 403 |
| DI-002 | USER_LEVEL A법인 → B법인 앱 import | OwnEntityGuard에 의해 403 |
| DI-003 | ADMIN_LEVEL → 타법인 importable 조회 | 정상 조회 (바이패스) |
| DI-004 | 서비스 레벨 entityId 필터 | getImportableApps에서 entityId 조건으로 타법인 데이터 격리 |

---

## 6. 프론트엔드 테스트 (수동)

| FE# | 시나리오 | 검증 |
|-----|----------|------|
| FE-001 | "앱스토어에서 가져오기" 버튼 클릭 | ImportFromStoreModal 오픈 |
| FE-002 | 모달에서 앱 검색 | 필터링 동작 |
| FE-003 | "등록" 버튼 클릭 시 | API 호출 후 "등록됨" 배지로 변경 |
| FE-004 | 이미 등록된 앱 | "등록됨" 배지 표시, 등록 버튼 없음 |
| FE-005 | 구독 앱 없을 때 | "구독 중인 앱이 없습니다" 메시지 |
| FE-006 | 모달 닫기 후 커스텀앱 목록 | invalidateQueries로 최신 목록 반영 |
