# Hanmam (한맘) 기능명세서

> **문서 버전**: 1.0  
> **작성일**: 2026-04-14  
> **프로젝트**: HM_WEB v1.0.101  
> **기술 스택**: Spring Boot 2.7.2 + MyBatis + MariaDB + JSP(Tiles) + jQuery  

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [모듈별 기능 명세](#3-모듈별-기능-명세)
   - 3.1 [인증 및 보안 (Auth)](#31-인증-및-보안-auth)
   - 3.2 [사용자·조직 관리 (User/Org)](#32-사용자조직-관리-userorg)
   - 3.3 [일일업무 관리 (Daily)](#33-일일업무-관리-daily)
   - 3.4 [업무지시·소통 (Call)](#34-업무지시소통-call)
   - 3.5 [메모·설계문서 (Memo/Design)](#35-메모설계문서-memodesign)
   - 3.6 [프로젝트 관리 (Project)](#36-프로젝트-관리-project)
   - 3.7 [주간보고 (Weekly)](#37-주간보고-weekly)
   - 3.8 [일정 관리 (Schedule)](#38-일정-관리-schedule)
   - 3.9 [휴가 관리 (Vacation)](#39-휴가-관리-vacation)
   - 3.10 [게시판 (BBS)](#310-게시판-bbs)
   - 3.11 [공지사항 (Notice)](#311-공지사항-notice)
   - 3.12 [메일 (Mail)](#312-메일-mail)
   - 3.13 [계약 관리 (Contract)](#313-계약-관리-contract)
   - 3.14 [매출 관리 (Sales)](#314-매출-관리-sales)
   - 3.15 [세금계산서·인보이스 (Invoice)](#315-세금계산서인보이스-invoice)
   - 3.16 [매입 관리 (Bill)](#316-매입-관리-bill)
   - 3.17 [경비 관리 (Expense)](#317-경비-관리-expense)
   - 3.18 [계정과목 (Account)](#318-계정과목-account)
   - 3.19 [은행·통장 관리 (Bank)](#319-은행통장-관리-bank)
   - 3.20 [법인카드 관리 (Card)](#320-법인카드-관리-card)
   - 3.21 [예산 관리 (Budget)](#321-예산-관리-budget)
   - 3.22 [내부거래 (Trade)](#322-내부거래-trade)
   - 3.23 [문서 관리 (Doc)](#323-문서-관리-doc)
   - 3.24 [문서대장 (DocRegister)](#324-문서대장-docregister)
   - 3.25 [거래처 관리 (Customer)](#325-거래처-관리-customer)
   - 3.26 [상품 관리 (Product)](#326-상품-관리-product)
   - 3.27 [장비 관리 (Equip)](#327-장비-관리-equip)
   - 3.28 [자원·예약 관리 (Resource/Reserve)](#328-자원예약-관리-resourcereserve)
   - 3.29 [인사·경력 관리 (Career/Certificate/Credential)](#329-인사경력-관리-careercertificatecredential)
   - 3.30 [급여 관리 (Salary)](#330-급여-관리-salary)
   - 3.31 [상담 관리 (Consult)](#331-상담-관리-consult)
   - 3.32 [경영현황 (Biz)](#332-경영현황-biz)
   - 3.33 [파일 관리 (File)](#333-파일-관리-file)
   - 3.34 [메뉴 관리 (Menu)](#334-메뉴-관리-menu)
   - 3.35 [수정자 관리 (Modifier)](#335-수정자-관리-modifier)
   - 3.36 [공통 기능 (Common)](#336-공통-기능-common)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [REST API 명세](#5-rest-api-명세)
6. [보안 설계](#6-보안-설계)
7. [스케줄러 (Quartz)](#7-스케줄러-quartz)
8. [부록](#8-부록)

---

## 1. 시스템 개요

### 1.1 시스템 정의

**한맘(Hanmam)**은 중소·중견기업의 일상 업무 운영을 통합 관리하는 엔터프라이즈 웹 플랫폼이다. 일일업무 계획·결과 관리, 프로젝트 관리, 경영·재무 관리, 인사·근태 관리, 그리고 사내 협업(게시판·공지·메일)까지 전 업무 영역을 단일 시스템으로 제공한다.

### 1.2 핵심 도메인

| # | 도메인 | 범위 |
|---|--------|------|
| 1 | **인사·근태 관리** | 사용자, 조직, 휴가, 일정, 급여, 경력 |
| 2 | **일일 업무 운영** | 일일 업무계획·결과, 업무지시(Call), 메모·설계문서, 주간보고 |
| 3 | **프로젝트 관리** | 프로젝트 트리, 멤버 배정, 상품, 자원·예약, 장비 |
| 4 | **경영·재무 관리** | 계약, 매출, 매입, 인보이스, 경비, 계정과목, 은행, 법인카드, 예산, 내부거래 |
| 5 | **협업·정보공유** | 게시판, 공지사항, 메일, 문서관리, 문서대장, 상담 |

### 1.3 기술 스택 요약

| 계층 | 기술 |
|------|------|
| **프레임워크** | Spring Boot 2.7.2, Spring MVC, Spring Security |
| **뷰 엔진** | JSP + Apache Tiles 3 |
| **ORM** | MyBatis 2.2.2 |
| **데이터베이스** | MariaDB (boda_solution / hanmam_db) |
| **프론트엔드** | jQuery 3.6, jQuery UI 1.13, CKEditor(CHEditor), Jodit, vis-timeline |
| **보안** | Spring Security (BCrypt), Lucy XSS Filter, Jsoup HTML Sanitizer, CSRF Token |
| **스케줄러** | Quartz |
| **문서처리** | Apache POI 5.2.3 (Excel), JXL (Excel) |
| **빌드** | Maven (WAR 패키징) |

---

## 2. 시스템 아키텍처

### 2.1 계층 구조

```
┌─────────────────────────────────────────────────┐
│  Browser (jQuery + JSP)                         │
├─────────────────────────────────────────────────┤
│  Controller Layer (@RequestMapping)             │
│  ├─ portal/ : 일반 사용자 화면 컨트롤러          │
│  ├─ biz/    : 경영·재무 화면 컨트롤러            │
│  └─ back/   : REST API 컨트롤러                 │
├─────────────────────────────────────────────────┤
│  Service Layer (비즈니스 로직)                    │
├─────────────────────────────────────────────────┤
│  Mapper Layer (MyBatis XML)                     │
├─────────────────────────────────────────────────┤
│  MariaDB (HikariCP 커넥션 풀)                    │
└─────────────────────────────────────────────────┘
```

### 2.2 패키지 구조

```
com.saeha.hm
├── auth/           # 인증·보안 (Spring Security)
├── config/         # 프레임워크 설정 (MVC, Security, Tiles, Quartz)
├── common/         # 공통 유틸리티, 모델, 서비스
│   ├── controller/ # 공통 화면 컨트롤러
│   ├── encrypt/    # 암호화 유틸리티
│   ├── error/      # 에러 처리
│   ├── interceptor/# 요청 인터셉터
│   ├── manager/    # 세션 매니저
│   ├── model/      # 공통 VO (HanmamVO, RestResponse 등)
│   ├── quartz/     # 스케줄러
│   ├── service/    # 공통 서비스
│   └── util/       # 유틸리티 클래스
├── portal/         # 일반 업무 모듈 (사용자 화면)
│   ├── controller/ # 화면 컨트롤러 (User, Daily, Call, Project 등)
│   ├── mapper/     # MyBatis 매퍼 인터페이스
│   ├── model/      # VO 클래스
│   ├── service/    # 비즈니스 서비스
│   └── constants/  # 상수 정의
├── biz/            # 경영·재무 모듈 (사용자 화면)
│   ├── controller/ # 화면 컨트롤러 (Contract, Sales, Invoice 등)
│   ├── mapper/     # MyBatis 매퍼 인터페이스
│   ├── model/      # VO 클래스
│   └── service/    # 비즈니스 서비스
└── back/           # REST API 모듈
    ├── biz/        # 경영·재무 REST API
    ├── common/     # 공통 REST API
    └── portal/     # 일반 업무 REST API
```

### 2.3 요청 처리 흐름

```
HTTP Request
  → Spring Security (인증 검증)
  → Interceptor (세션·권한 확인)
  → Controller (@RequestMapping)
  → Service (비즈니스 로직)
  → Mapper (MyBatis → SQL)
  → MariaDB
  → Response (JSP View or JSON)
```

### 2.4 표준 응답 형식 (REST API)

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-14T10:00:00"
}
```

---

## 3. 모듈별 기능 명세

---

### 3.1 인증 및 보안 (Auth)

**패키지**: `com.saeha.hm.auth`

#### 3.1.1 기능 목록

| 기능 | 설명 |
|------|------|
| **로그인** | 아이디/비밀번호 기반 폼 로그인 (`/auth/check`) |
| **로그아웃** | 세션 무효화 및 로그인 페이지 리다이렉트 |
| **동시 세션 제어** | `SessionRegistry`를 통한 중복 로그인 방지 |
| **비밀번호 암호화** | BCrypt 기반 `HmPasswordEncoderFactories` |
| **CSRF 보호** | `CookieCSRFTokenRepository` 기반 토큰 관리 |
| **CORS 지원** | 크로스 도메인 요청 허용 설정 |
| **AJAX 인증 처리** | `AjaxAwareAuthenticationEntryPoint`로 AJAX 요청 시 401 JSON 응답 |

#### 3.1.2 인증 모델

| 클래스 | 필드 | 설명 |
|--------|------|------|
| `SessionUser` | userNo, userId, loginId, userName, loginDatetime | 세션에 저장되는 인증 사용자 정보 |
| `LoginForm` | userId, password | 로그인 폼 바인딩 객체 |
| `HmUserAuthenticationToken` | - | 커스텀 인증 토큰 |

#### 3.1.3 보안 설정 (`WebSecurityConfig`)

- 인증 프로바이더: `AuthProvider` (DB 기반 사용자 검증)
- 인증 핸들러: `AuthHandler` (로그인 성공/실패 처리)
- 세션 타임아웃: 8시간 (480분)
- 인코딩: UTF-8
- URL 인코딩된 슬래시 허용 (HTTP Firewall)

---

### 3.2 사용자·조직 관리 (User/Org)

**컨트롤러**: `/Header`, `/User`  
**DB 테이블**: `tbl_user`, `tbl_org`

#### 3.2.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 사용자 목록 | `/User/list` | GET | 조직별 사용자 트리 목록 조회 |
| 사용자 검색 | `/User/search` | GET | 사용자 이름/아이디로 검색 |
| 사용자 상세 | `/User/view` | GET | 개인정보, 소속, 직급 등 상세 조회 |
| 사용자 등록 | `/User/edit` | GET/POST | 신규 사용자 등록 |
| 사용자 수정 | `/User/save` | POST | 사용자 정보 수정 |
| 사용자 삭제 | `/User/delete` | POST | 사용자 삭제(퇴직 처리) |
| 조직 트리 조회 | `/User/tree` | GET | 조직도 트리 구조 조회 |
| 조직 트리 순서 변경 | - | POST | 드래그앤드롭 조직 순서 갱신 |
| 관리자 사용자 목록 | `/User/AdminUserList` | GET | 관리자 전용 사용자 전체 목록 |
| 관리자 사용자 편집 | `/User/AdminUserEdit` | GET/POST | 관리자 전용 사용자 정보 편집 |
| 사용자 로그 조회 | - | GET | 로그인/활동 이력 조회 |
| 사용자 캘린더 | - | GET | 개인 캘린더 정보 조회 |

#### 3.2.2 사용자 모델 (`UserVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| userNo | int | 사용자 고유번호 (PK) |
| userId | String | 로그인 아이디 |
| userName | String | 사용자 이름 |
| userIdNo | String | 사번 |
| password | String | 비밀번호 (BCrypt 암호화) |
| orgNo | int | 소속 조직 번호 |
| compNo | int | 소속 회사 번호 |
| userAuth | String | 사용자 권한 코드 |
| workStatus | String | 근무 상태 |
| email | String | 이메일 |
| phoneNo | String | 전화번호 |
| bankName | String | 급여 계좌 은행명 |
| bankAccount | String | 급여 계좌번호 |
| joinDate | Date | 입사일 |
| retireDate | Date | 퇴직일 |
| birthDate | Date | 생년월일 |
| vacationBaseDate | Date | 휴가 기준일 |
| lastLoginDatetime | DateTime | 최근 로그인 일시 |

#### 3.2.3 조직 모델 (`OrgVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| orgNo | int | 조직 고유번호 (PK) |
| orgName | String | 조직명 |
| upOrgNo | int | 상위 조직 번호 (트리 구조) |
| orgLevel | int | 조직 계층 레벨 |
| order | int | 정렬 순서 |

#### 3.2.4 REST API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/back/user` | GET | 사용자 정보 조회 |
| `/back/user` | POST | 사용자 정보 수정 |
| `/back/user/downOrg` | GET | 하위 조직 목록 조회 |

---

### 3.3 일일업무 관리 (Daily)

**컨트롤러**: `/Daily`  
**DB 테이블**: `tbl_daily_plan`, `tbl_daily_result`

#### 3.3.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 개인별 일일업무 조회 | `/Daily/listUser` | GET | 특정 사용자의 일일 업무계획·결과 조회 |
| 조직별 일일업무 조회 | `/Daily/listOrg` | GET | 조직 단위 일일업무 현황 조회 |
| 업무계획 상세 | `/Daily/viewPlan` | GET | 일일 업무계획 상세 팝업 |
| 업무결과 편집 | `/Daily/editResult` | GET/POST | 업무결과 등록·수정 |
| 근무통계 | `/Daily/workStat` | GET | 기간별 근무시간 통계 |
| 업무계획 목록 | `/Daily/listPlan` | GET | 업무계획 전체 목록 |
| 업무계획 통계 | `/Daily/statPlan` | GET | 업무계획 수행률 통계 |
| 업무결과 목록 | `/Daily/listResult` | GET | 업무결과 전체 목록 |
| 업무결과 통계 | `/Daily/statResult` | GET | 업무결과 달성률 통계 |

#### 3.3.2 업무계획 모델 (`DailyPlanVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| workDate | Date | 작업일자 |
| planNo | int | 계획 번호 (PK) |
| planText | String | 계획 내용 |
| startHour | String | 시작 시간 |
| endHour | String | 종료 시간 |
| planUserList | List | 관련 사용자 목록 |
| regUserNo | int | 등록자 번호 |

#### 3.3.3 업무결과 모델 (`DailyResultVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| workDate | Date | 작업일자 |
| resultNo | int | 결과 번호 (PK) |
| resultText | String | 결과 내용 |
| resultUserList | List | 관련 사용자 목록 |
| regUserNo | int | 등록자 번호 |

#### 3.3.4 화면 구성

| JSP | 설명 |
|-----|------|
| DailyPlanEditPop.jsp | 업무계획 등록·편집 팝업 |
| DailyPlanViewPop.jsp | 업무계획 상세 조회 팝업 |
| DailyResultEditPop.jsp | 업무결과 등록·편집 팝업 |
| DailyWorkStat.jsp | 근무통계 대시보드 |

---

### 3.4 업무지시·소통 (Call)

**컨트롤러**: `/Call`  
**DB 테이블**: `tbl_call`, `tbl_call_board`, `tbl_call_memo`

#### 3.4.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 전체 업무지시 목록 | `/Call/list` | GET | 업무지시/요청 목록 조회 |
| 미확인 업무 | `/Call/callUnread` | GET | 읽지 않은 업무지시 목록 |
| 할일 목록 | `/Call/callTodo` | GET | 나에게 배정된 할일 목록 |
| 내가 보낸 업무 | `/Call/callOwner` | GET | 내가 생성한 업무지시 목록 |
| 관심 업무 | `/Call/callInterest` | GET | 관심 표시한 업무 목록 |
| 업무지시 상세 | `/Call/view` | GET | 업무지시 상세 내용 조회 |
| 업무지시 작성 | `/Call/edit` | GET/POST | 업무지시 등록·수정 |
| 업무지시 발송 | `/Call/send` | POST | 업무지시 전송 |
| 게시판 목록 | `/Call/boardList` | GET | 업무 게시판 목록 |
| 게시판 작성 | `/Call/boardEdit` | GET/POST | 업무 게시판 글 작성 |

#### 3.4.2 업무지시 모델 (`CallVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| callNo | int | 업무지시 번호 (PK) |
| callType | String | 업무 유형 코드 |
| callTitle | String | 업무 제목 |
| callContents | String | 업무 내용 (HTML) |
| ownerNo | int | 작성자 번호 |
| reqDate | Date | 요청일 |
| prjNo | int | 프로젝트 번호 (FK) |
| status | String | 상태 코드 |
| callUserVOList | List\<CallUserVO\> | 업무 참여자 목록 |
| relatedMemoList | List\<MemoVO\> | 관련 메모 목록 |

#### 3.4.3 업무참여자 유형 (`CallUserTypeCd`)

| 코드 | 설명 |
|------|------|
| 지시자 | 업무를 지시하는 사람 |
| 수신자 | 업무를 수행하는 사람 |
| 참조자 | 업무를 참조하는 사람 |

---

### 3.5 메모·설계문서 (Memo/Design)

**컨트롤러**: Memo 서비스 기반, `/Design`  
**DB 테이블**: `tbl_memo`, `tbl_memo_relation`, `tbl_memo_log`

#### 3.5.1 기능 목록

| 기능 | 설명 |
|------|------|
| 메모 생성 | 북(Book) 단위로 메모 작성 |
| 메모 편집 | HTML 에디터 기반 내용 편집, XSS 방어(Sanitize) |
| 메모 계층 관리 | 부모-자식 관계의 메모 트리 구조 |
| 메모 공개 범위 | 개인/조직/전체 공개 설정 (`ShowType`) |
| 메모 상태 관리 | 추가(ADD) → 편집(EDIT) → 확정(FINALIZE) |
| 메모 이력 | 수정 이력 자동 기록 (`tbl_memo_log`) |
| 업무지시 연계 | 메모와 Call(업무지시) 간 연계 (`tbl_call_memo`) |
| 설계문서 뷰 | 화이트보드/설계 전용 뷰어 (`/Design`) |
| 조회수 카운트 | 메모 조회 시 다운 카운트 증가 |

#### 3.5.2 메모 모델 (`MemoVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| bookNo | int | 메모북 번호 |
| memoNo | int | 메모 번호 (PK) |
| memoNoUp | int | 상위 메모 번호 (트리 구조) |
| memoName | String | 메모 제목 |
| memoType | Enum | 메모 유형 |
| memoStatus | Enum | 상태 (ADD/EDIT/FINALIZE) |
| showType | Enum | 공개 범위 (개인/조직/전체) |
| htmlDoc | String | HTML 본문 내용 |
| ownerNo | int | 소유자 번호 |
| regUserNo | int | 등록자 번호 |
| orgNo | int | 소속 조직 번호 |

---

### 3.6 프로젝트 관리 (Project)

**컨트롤러**: `/Project`  
**DB 테이블**: `tbl_prj` (tbl_project)

#### 3.6.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 프로젝트 목록 | `/Project/list` | GET | 프로젝트 리스트 조회 (조건 검색) |
| 프로젝트 트리 | `/Project/tree` | GET | 계층형 프로젝트 트리 조회 |
| 프로젝트 상세 | `/Project/view` | GET | 프로젝트 상세 정보 |
| 프로젝트 등록 | `/Project/edit` | GET/POST | 프로젝트 생성·수정 |
| 프로젝트 저장 | `/Project/save` | POST | 프로젝트 정보 저장 |
| 프로젝트 삭제 | `/Project/delete` | POST | 프로젝트 삭제 |
| 관리자 프로젝트 목록 | `/Project/AdminProjectList` | GET | 전체 프로젝트 관리 목록 |
| 프로젝트 예산 팝업 | `/Project/budgetPop` | GET | 프로젝트별 예산 조회 팝업 |
| 프로젝트 멤버 관리 | - | POST | 프로젝트 참여 멤버 추가·삭제 |

#### 3.6.2 프로젝트 모델 (`ProjectVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| prjNo | int | 프로젝트 번호 (PK) |
| upPrjNo | int | 상위 프로젝트 번호 (트리 구조) |
| bizPrjNo | int | 사업 프로젝트 번호 |
| orgPrjNo | int | 조직 프로젝트 번호 |
| compPrjNo | int | 회사 프로젝트 번호 |
| prjName | String | 프로젝트명 |
| prjType | String | 프로젝트 유형 |
| prjLevel | int | 프로젝트 계층 레벨 |
| leaderNo | int | 프로젝트 리더 |
| orgNo | int | 소속 조직 |
| startDate | Date | 시작일 |
| endDate | Date | 종료일 |
| status | int | 상태 (1:진행, 2:중단, 3:완료, 4:삭제) |
| projectUserVOList | List | 참여 멤버 목록 |
| laborRule | String | 인건비 규칙 |
| expenseRule | String | 경비 규칙 |
| budgetRule | String | 예산 규칙 |

#### 3.6.3 프로젝트 멤버 모델 (`ProjectUserVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| prjNo | int | 프로젝트 번호 |
| userNo | int | 사용자 번호 |
| userName | String | 사용자 이름 |
| userRole | String | 프로젝트 내 역할 |
| orgNo | int | 소속 조직 |

---

### 3.7 주간보고 (Weekly)

**컨트롤러**: `/Weekly`  
**DB 테이블**: `tbl_weekly`

#### 3.7.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 주간보고 목록 | `/Weekly/list` | GET | 주간보고 목록 조회 |
| 주간보고 상세 | `/Weekly/view` | GET | 주간보고 상세 조회 |
| 주간보고 작성 | `/Weekly/edit` | GET/POST | 주간보고 작성·수정 |
| 주간보고 저장 | `/Weekly/save` | POST | 주간보고 저장 |

#### 3.7.2 주간보고 모델 (`WeeklyVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| weekNo | int | 주간보고 번호 (PK) |
| workDate | Date | 보고 기준 주차 |
| weekContent | String | 주간보고 내용 |
| regUserNo | int | 작성자 |
| weekUserVOList | List | 보고 대상자 목록 |

---

### 3.8 일정 관리 (Schedule)

**컨트롤러**: `/Schedule`  
**DB 테이블**: `tbl_schedule`

#### 3.8.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 일정 캘린더 | `/Schedule/list` | GET | 캘린더 형태 일정 조회 |
| 일정 상세 | `/Schedule/view` | GET | 일정 상세 팝업 |
| 일정 등록 | `/Schedule/edit` | GET/POST | 일정 등록·수정 팝업 |
| 일정 저장 | `/Schedule/save` | POST | 일정 저장 |

#### 3.8.2 일정 모델 (`ScheduleVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| scheduleNo | int | 일정 번호 (PK) |
| scheduleDate | Date | 일정 일자 |
| scheduleType | String | 일정 유형 |
| scheduleTitle | String | 일정 제목 |
| scheduleContents | String | 일정 내용 |
| regUserNo | int | 등록자 |
| attendeeList | List | 참석자 목록 |

#### 3.8.3 화면 구성

| JSP | 설명 |
|-----|------|
| ScheduleCalendar.jsp | 월간 캘린더 뷰 |
| ScheduleEditPop.jsp | 일정 등록·편집 팝업 |

---

### 3.9 휴가 관리 (Vacation)

**컨트롤러**: `/Vacation`  
**DB 테이블**: `tbl_vacation`

#### 3.9.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 휴가 목록 | `/Vacation/list` | GET | 개인 휴가 사용 내역 |
| 휴가 상세 | `/Vacation/view` | GET | 휴가 상세 정보 |
| 휴가 신청 | `/Vacation/edit` | GET/POST | 휴가 신청 등록·수정 |
| 휴가 저장 | `/Vacation/save` | POST | 휴가 신청 저장 |
| 휴가 삭제 | `/Vacation/delete` | POST | 휴가 신청 삭제 |
| 관리자 휴가 목록 | `/Vacation/AdminVacationList` | GET | 전사 휴가 현황 관리 |
| 관리자 휴가 편집 | `/Vacation/AdminVacationEditPop` | GET/POST | 관리자 휴가 승인·수정 팝업 |
| 휴가 기본정보 조회 | - | GET | 연차 잔여일수 등 기본 정보 |

#### 3.9.2 휴가 모델 (`VacationVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| vacationNo | int | 휴가 번호 (PK) |
| docNo | int | 문서 번호 (결재 연동) |
| vacationDate | Date | 휴가 일자 |
| vacationStartHour | String | 시작 시간 (반차 등) |
| workType | String | 근무 유형 코드 |
| regUserNo | int | 신청자 |
| vacationStatus | String | 상태 |
| reason | String | 사유 |
| delYn | String | 삭제 여부 (Y/N) |

---

### 3.10 게시판 (BBS)

**컨트롤러**: `/BbsMaster`, `/Bbs`  
**DB 테이블**: `tbl_bbs`, `tbl_bbs_master`

#### 3.10.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 게시판 마스터 관리 | `/BbsMaster/list` | GET | 게시판 유형 관리 (관리자) |
| 게시판 마스터 편집 | `/BbsMaster/edit` | GET/POST | 게시판 유형 생성·수정 |
| 게시글 목록 | `/Bbs/list` | GET | 게시판별 글 목록 조회 |
| 게시글 상세 | `/Bbs/view` | GET | 게시글 내용 조회 |
| 게시글 작성 | `/Bbs/edit` | GET/POST | 게시글 등록·수정 |
| 게시글 저장 | `/Bbs/save` | POST | 게시글 저장 |
| 게시글 삭제 | `/Bbs/delete` | POST | 게시글 삭제 |

#### 3.10.2 게시판 모델 (`BbsVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| bbsNo | int | 게시글 번호 (PK) |
| bbsMasterNo | int | 게시판 마스터 번호 (FK) |
| bbsTitle | String | 게시글 제목 |
| bbsContents | String | 게시글 내용 (HTML) |
| bbsWriter | String | 작성자명 |
| regUserNo | int | 등록자 번호 |
| regDate | Date | 등록일 |
| modDate | Date | 수정일 |
| fileId | String | 첨부파일 ID |

---

### 3.11 공지사항 (Notice)

**컨트롤러**: `/Notice`  
**DB 테이블**: `tbl_notice`

#### 3.11.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 공지 목록 | `/Notice/list` | GET | 공지사항 목록 조회 |
| 받은 공지 | `/Notice/recvList` | GET | 수신 공지 목록 |
| 보낸 공지 | `/Notice/sendList` | GET | 발신 공지 목록 |
| 공지 상세 | `/Notice/view` | GET | 공지사항 내용 조회 |
| 공지 작성 | `/Notice/edit` | GET/POST | 공지사항 등록·수정 팝업 |
| 공지 저장 | `/Notice/save` | POST | 공지사항 저장 |
| 공지 삭제 | `/Notice/delete` | POST | 공지사항 삭제 |

#### 3.11.2 공지 모델 (`NoticeVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeNo | int | 공지 번호 (PK) |
| noticeTitle | String | 공지 제목 |
| noticeContents | String | 공지 내용 |
| regUserNo | int | 작성자 |
| noticeStatus | String | 공지 상태 |
| priority | int | 우선순위 (상단 고정 등) |

---

### 3.12 메일 (Mail)

**컨트롤러**: `/Mail`  
**DB 테이블**: 메일 관련 테이블

#### 3.12.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 메일 목록 | `/Mail/list` | GET | 수신·발신 메일 목록 |
| 메일 상세 | `/Mail/view` | GET | 메일 내용 조회 |
| 메일 발송 | `/Mail/send` | POST | 메일 작성·발송 |
| 메일 삭제 | `/Mail/delete` | POST | 메일 삭제 |

---

### 3.13 계약 관리 (Contract)

**컨트롤러**: `/Contract`, `/ContractAjax`  
**DB 테이블**: `tbl_contract`

#### 3.13.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 계약 목록 | `/Contract/list` | GET | 계약 목록 조회 (거래처/프로젝트별 필터) |
| 매출집계 목록 | `/Contract/listIncome` | GET | 계약별 매출 집계 조회 |
| 관리자 매출집계 | `/Contract/listAdminIncome` | GET | 관리자 전체 매출 집계 |
| 계약 상세 | `/Contract/view` | GET | 계약 상세 정보 |
| 계약 등록 | `/Contract/edit` | GET/POST | 계약 등록·수정 |
| 계약 저장 | `/ContractAjax/save` | POST | 계약 정보 저장 (AJAX) |
| 계약 삭제 | `/ContractAjax/delete` | POST | 계약 삭제 |
| 자동 발행 | `/ContractAjax/AutoPublish` | POST | 매출·인보이스 자동 생성 |

#### 3.13.2 계약 모델 (`ContractVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| contractNo | int | 계약 번호 (PK) |
| contractSerial | String | 계약 일련번호 |
| contractName | String | 계약명 |
| custNo | int | 거래처 번호 (FK) |
| compNo | int | 회사 번호 (FK) |
| prjNo | int | 프로젝트 번호 (FK) |
| serviceStartDate | Date | 서비스 시작일 |
| serviceEndDate | Date | 서비스 종료일 |
| price | long | 계약 금액 (공급가액) |
| vat | long | 부가세 |
| status | int | 상태 (1:진행, 2:중단, 3:종료) |
| salesAuto | boolean | 매출 자동 생성 여부 |
| invoiceAuto | boolean | 인보이스 자동 생성 여부 |
| invoiceDay | int | 인보이스 발행일 |
| invoiceType | int | 인보이스 유형 |
| nextMonth | boolean | 익월 발행 여부 |
| everyMonth | boolean | 매월 발행 여부 |
| salesPrice | long | 누적 매출 금액 |
| invoicePrice | long | 누적 인보이스 금액 |
| linkAmount | long | 연결 금액 |
| unlinkAmount | long | 미연결 금액 |

#### 3.13.3 자동 발행 기능 (`AutoPublish`)

계약 정보를 기반으로:
1. 매출(Sales)을 자동 생성
2. 세금계산서(Invoice)를 자동 생성
3. 매월/익월/지정일 기준 반복 발행

---

### 3.14 매출 관리 (Sales)

**컨트롤러**: `/Sales`, `/SalesAjax`  
**DB 테이블**: `tbl_sales`

#### 3.14.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 매출 목록 | `/Sales/list` | GET | 매출 목록 조회 (기간·프로젝트·거래처 필터) |
| 매출 상세 | `/Sales/view` | GET | 매출 상세 정보 |
| 매출 등록 | `/Sales/edit` | GET/POST | 매출 등록·수정 |
| 매출 저장 | `/SalesAjax/save` | POST | 매출 정보 저장 |
| 매출 삭제 | `/SalesAjax/delete` | POST | 매출 삭제 |
| 계약별 매출 목록 | `/Sales/listContractSales` | GET | 특정 계약의 매출 내역 |
| 인보이스 연동 | `/Sales/invoice` | GET | 매출-인보이스 연계 조회 |

#### 3.14.2 매출 모델 (`SalesVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| salesNo | int | 매출 번호 (PK) |
| docNo | int | 문서 번호 |
| accCode | String | 계정과목 코드 (FK) |
| accName | String | 계정과목명 |
| contractNo | int | 계약 번호 (FK) |
| prjNo | int | 프로젝트 번호 (FK) |
| price | long | 공급가액 |
| vat | long | 부가세 |
| budgetPrice | long | 예산 금액 |
| tradePrice | long | 거래 금액 |
| salesDate | Date | 매출일자 |
| contents | String | 매출 내역 설명 |
| invoicePrice | long | 인보이스 발행 금액 |
| invoiceVat | long | 인보이스 부가세 |
| invoiceRest | long | 인보이스 미발행 잔액 |
| status | int | 상태 (1:신규, 2:확정) |

---

### 3.15 세금계산서·인보이스 (Invoice)

**컨트롤러**: `/Invoice`, `/InvoiceAjax`  
**DB 테이블**: `tbl_invoice`

#### 3.15.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 인보이스 목록 | `/Invoice/list` | GET | 세금계산서 목록 조회 |
| 인보이스 상세 | `/Invoice/view` | GET | 세금계산서 상세 정보 |
| 인보이스 등록 | `/Invoice/edit` | GET/POST | 세금계산서 등록·수정 |
| 인보이스 저장 | `/InvoiceAjax/save` | POST | 세금계산서 저장 |
| 인보이스 삭제 | `/InvoiceAjax/delete` | POST | 세금계산서 삭제 |
| 인보이스 발행 | `/InvoiceAjax/publish` | POST | 세금계산서 전자 발행 |

#### 3.15.2 인보이스 모델 (`InvoiceVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| invoiceNo | int | 인보이스 번호 (PK) |
| salesNo | int | 매출 번호 (FK) |
| custNo | int | 거래처 번호 (FK) |
| custName | String | 거래처명 |
| custBusiNo | String | 사업자등록번호 |
| invoiceType | int | 유형 (1:세금계산서, 2:카드, 3:미발행, 4:가수금) |
| contractNo | int | 계약 번호 (FK) |
| prjNo | int | 프로젝트 번호 (FK) |
| title | String | 세금계산서 제목 |
| price | long | 공급가액 |
| vat | long | 부가세 |
| invoiceDate | Date | 발행일 |
| linkAmount | long | 수금 연결 금액 |
| publishCompNo | int | 발행 회사 번호 |
| publishUserNo | int | 발행 사용자 번호 |
| publishDatetime | DateTime | 발행 일시 |
| publishType | int | 발행 방식 |
| status | int | 상태 (1:취소, 2:요청, 4:발행완료) |

#### 3.15.3 인보이스 상세 (`InvoiceContentsVO`)

세금계산서 품목 상세 행 (라인 아이템) 관리

---

### 3.16 매입 관리 (Bill)

**컨트롤러**: `/Bill`, `/BillAjax`  
**DB 테이블**: `tbl_bill`

#### 3.16.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 매입 목록 | `/Bill/list` | GET | 매입 내역 목록 조회 |
| 매입 상세 | `/Bill/view` | GET | 매입 상세 정보 |
| 매입 등록 | `/Bill/edit` | GET/POST | 매입 등록·수정 |
| 매입 저장 | `/BillAjax/save` | POST | 매입 저장 |
| 매입 삭제 | `/BillAjax/delete` | POST | 매입 삭제 |

#### 3.16.2 매입 모델 (`BillVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| billNo | int | 매입 번호 (PK) |
| billType | String | 매입 유형 |
| billAmount | long | 매입 금액 |
| billDate | Date | 매입일 |
| billStatus | String | 처리 상태 |

---

### 3.17 경비 관리 (Expense)

**컨트롤러**: `/Expense`, `/ExpenseAjax`  
**DB 테이블**: `tbl_expense`

#### 3.17.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 경비 목록 | `/Expense/list` | GET | 경비 청구 목록 |
| 경비 상세 | `/Expense/view` | GET | 경비 상세 정보 |
| 경비 등록 | `/Expense/edit` | GET/POST | 경비 청구 등록·수정 |
| 경비 저장 | `/ExpenseAjax/save` | POST | 경비 저장 |
| 경비 삭제 | `/ExpenseAjax/delete` | POST | 경비 삭제 |
| 경비 지급 목록 | `/Expense/payList` | GET | 경비 지급 처리 목록 |

#### 3.17.2 경비 모델 (`ExpenseVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| expenseNo | int | 경비 번호 (PK) |
| docNo | int | 문서 번호 (결재 연동) |
| expenseType | String | 경비 유형 |
| expenseAmount | long | 청구 금액 |
| expenseDate | Date | 경비 발생일 |
| regUserNo | int | 청구자 |
| approvalStatus | String | 승인 상태 |

---

### 3.18 계정과목 (Account)

**컨트롤러**: `/Account`, `/AccountAjax`  
**DB 테이블**: `tbl_account`

#### 3.18.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 계정과목 트리 | `/Account/list` | GET | 계정과목 트리 구조 조회 |
| 계정과목 편집 | `/Account/edit` | GET/POST | 계정과목 추가·수정 팝업 |

#### 3.18.2 계정과목 모델 (`AccountVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| accCode | String | 계정과목 코드 (PK) |
| upAccCode | String | 상위 계정과목 코드 (트리 구조) |
| accName | String | 계정과목명 |
| accLevel | int | 계층 레벨 |
| accType | String | 유형 (자산/부채/자본/수익/비용) |
| accOrder | int | 정렬 순서 |

---

### 3.19 은행·통장 관리 (Bank)

**컨트롤러**: `/Bank`, `/BankAjax`  
**DB 테이블**: `tbl_bank`, `tbl_bank_book`

#### 3.19.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 은행계좌 목록 | `/Bank/list` | GET | 등록된 은행계좌 목록 |
| 은행계좌 편집 | `/Bank/edit` | GET/POST | 은행계좌 등록·수정 팝업 |
| 입출금 내역 | `/Bank/inoutEdit` | GET/POST | 입출금 내역 등록·수정 |
| 거래내역 업로드 | `/Bank/uploadList` | GET/POST | 은행 거래내역 엑셀 파일 업로드 |
| 가상계좌 편집 | `/Bank/virtualEdit` | GET/POST | 가상계좌 등록·수정 팝업 |

#### 3.19.2 은행 모델

| 모델 | 주요 필드 | 설명 |
|------|-----------|------|
| **BankVO** | bankNo, bankType, bankName, dateFormat, dateIdx, inIdx, outIdx, remainIdx | 은행계좌 정보 + 엑셀 파싱 설정 |
| **BankInoutVO** | inoutNo, bankNo, transDate, transType(입/출), transAmount, transNote | 입출금 거래 내역 |
| **BankBookVO** | 잔액 포함 집계 | 통장 잔액 조회용 집계 |
| **BankUploadVO** | 엑셀 업로드 데이터 | 거래내역 일괄 업로드 |

---

### 3.20 법인카드 관리 (Card)

**컨트롤러**: `/Card`, `/CardAjax`  
**DB 테이블**: `tbl_card`, `tbl_card_spend`

#### 3.20.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 카드 목록 | `/Card/list` | GET | 법인카드 목록 조회 |
| 카드 상세 | `/Card/view` | GET | 카드 상세 정보 및 사용 내역 |
| 카드 등록 | `/Card/edit` | GET/POST | 법인카드 등록·수정 |
| 카드 저장 | `/CardAjax/save` | POST | 카드 정보 저장 |
| 카드 삭제 | `/CardAjax/delete` | POST | 카드 삭제 |

#### 3.20.2 카드 모델

| 모델 | 주요 필드 | 설명 |
|------|-----------|------|
| **CardVO** | cardNo, cardHolder, cardNumber, cardLimit, cardBalance | 법인카드 기본 정보 |
| **CardSpendVO** | spendNo, cardNo, spendDate, spendAmount, spendCategory | 카드 사용 내역 |
| **CardCompVO** | compNo | 카드 사용 법인 연결 |

---

### 3.21 예산 관리 (Budget)

**컨트롤러**: `/Budget`, `/BudgetAjax`  
**DB 테이블**: `tbl_budget`

#### 3.21.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 예산 목록 | `/Budget/list` | GET | 예산 항목 목록 조회 |
| 예산 상세 | `/Budget/view` | GET | 예산 상세 정보 |
| 예산 등록 | `/Budget/edit` | GET/POST | 예산 등록·수정 |
| 예산 저장 | `/BudgetAjax/save` | POST | 예산 저장 |
| 예산 삭제 | `/BudgetAjax/delete` | POST | 예산 삭제 |

#### 3.21.2 예산 모델 (`BudgetVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| budgetNo | int | 예산 번호 (PK) |
| docNo | int | 문서 번호 |
| prjNo | int | 프로젝트 번호 (FK) |
| accCode | String | 계정과목 코드 (FK) |
| contents | String | 예산 내역 |
| price | long | 예산 금액 |
| vat | long | 부가세 |
| budgetDate | Date | 예산일 |

---

### 3.22 내부거래 (Trade)

**컨트롤러**: `/Trade`, `/TradeAjax`  
**DB 테이블**: `tbl_trade`

#### 3.22.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 내부거래 목록 | `/Trade/list` | GET | 내부거래 내역 조회 |
| 내부거래 상세 | `/Trade/view` | GET | 내부거래 상세 정보 |
| 내부거래 등록 | `/Trade/edit` | GET/POST | 내부거래 등록·수정 |
| 내부거래 저장 | `/TradeAjax/save` | POST | 내부거래 저장 |
| 내부거래 삭제 | `/TradeAjax/delete` | POST | 내부거래 삭제 |

#### 3.22.2 내부거래 모델 (`TradeVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| tradeNo | int | 거래 번호 (PK) |
| tradeDate | Date | 거래일 |
| tradeType | String | 거래 유형 |
| tradeAmount | long | 거래 금액 |
| fromCompNo | int | 출금 법인 번호 |
| toCompNo | int | 입금 법인 번호 |

---

### 3.23 문서 관리 (Doc)

**컨트롤러**: `/Doc`, `/DocAjax`  
**DB 테이블**: `tbl_doc`

#### 3.23.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 문서 목록 | `/Doc/list` | GET | 전자결재 문서 목록 |
| 문서 상세 | `/Doc/view` | GET | 문서 상세 조회 |
| 문서 작성 | `/Doc/edit` | GET/POST | 문서 작성·수정 |
| 문서 저장 | `/DocAjax/save` | POST | 문서 저장 |
| 문서 삭제 | `/DocAjax/delete` | POST | 문서 삭제 |
| 문서 인쇄 | `/Doc/print` | GET | 문서 인쇄용 뷰 |

#### 3.23.2 문서 모델

| 모델 | 주요 필드 | 설명 |
|------|-----------|------|
| **DocVO** | docNo, subject, docStatus, regUserNo | 문서 기본 정보 |
| **DocFormVO** | - | 문서 양식(템플릿) 설정 |
| **DocOptionVO** | - | 문서 옵션 항목 |
| **DocCommentVO** | - | 결재 의견/댓글 |
| **DocUserVO** | - | 결재선 사용자 |
| **DocSalesVO** | - | 매출 연동 문서 |

#### 3.23.3 첨부 양식 (AttachEdit)

다양한 결재 양식 JSP:
- AttachEdit02.jsp ~ AttachEdit42.jsp (총 11종)
- 경비, 휴가, 출장 등 업무별 전용 양식 제공

#### 3.23.4 화면 구성

| JSP | 설명 |
|-----|------|
| DocList.jsp | 문서 목록 |
| DocEdit.jsp | 문서 작성·편집 |
| DocView.jsp | 문서 상세 조회 |
| DocPrint.jsp | 문서 인쇄 |
| AttachEdit*.jsp | 업무별 첨부 양식 (11종) |

---

### 3.24 문서대장 (DocRegister)

**컨트롤러**: `/DocRegister`  
**DB 테이블**: `tbl_doc_register`

#### 3.24.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 문서대장 목록 | `/DocRegister/list` | 문서대장 목록 조회 |
| 문서대장 상세 | `/DocRegister/view` | 문서대장 상세 조회 |
| 문서대장 등록 | `/DocRegister/edit` | 문서대장 등록·수정 |
| 문서대장 저장 | `/DocRegister/save` | 문서대장 저장 |
| 문서대장 삭제 | `/DocRegister/delete` | 문서대장 삭제 |

---

### 3.25 거래처 관리 (Customer)

**컨트롤러**: `/Customer`  
**DB 테이블**: `tbl_customer`

#### 3.25.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 거래처 목록 | `/Customer/list` | 거래처 목록 조회 |
| 거래처 상세 | `/Customer/view` | 거래처 상세 정보 |
| 거래처 등록 | `/Customer/edit` | 거래처 등록·수정 |
| 거래처 저장 | `/Customer/save` | 거래처 저장 |
| 거래처 삭제 | `/Customer/delete` | 거래처 삭제 |

#### 3.25.2 거래처 모델 (`CustomerVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| custNo | int | 거래처 번호 (PK) |
| custName | String | 거래처명 |
| custBusiNo | String | 사업자등록번호 |
| custAddress | String | 주소 |
| custCeoName | String | 대표자명 |
| custBusiType | String | 업태/종목 |

---

### 3.26 상품 관리 (Product)

**컨트롤러**: `/Product`  
**DB 테이블**: `tbl_product`

#### 3.26.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 상품 목록 | `/Product/list` | 상품 목록 조회 |
| 상품 상세 | `/Product/view` | 상품 상세 정보 |
| 상품 등록 | `/Product/edit` | 상품 등록·수정 |
| 상품 저장 | `/Product/save` | 상품 저장 |
| 상품 삭제 | `/Product/delete` | 상품 삭제 |

#### 3.26.2 상품 모델 (`ProductVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| productNo | int | 상품 번호 (PK) |
| productName | String | 상품명 |
| productType | String | 상품 유형 |
| productDescription | String | 상품 설명 |
| delYn | String | 삭제 여부 |

---

### 3.27 장비 관리 (Equip)

**컨트롤러**: `/Equip`  
**DB 테이블**: `tbl_equip`

#### 3.27.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 장비 목록 | `/Equip/list` | 장비 자산 목록 조회 |
| 장비 상세 | `/Equip/view` | 장비 상세 정보 (스펙, 이력) |
| 장비 등록 | `/Equip/edit` | 장비 등록·수정 |
| 장비 저장 | `/Equip/save` | 장비 저장 |
| 장비 삭제 | `/Equip/delete` | 장비 삭제 |
| 수리 이력 | - | 장비 수리·정비 이력 관리 |

#### 3.27.2 장비 모델 (`EquipVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| equipNo | int | 장비 번호 (PK) |
| equipName | String | 장비명 |
| equipType | String | 장비 유형 |
| equipModel | String | 모델명 |
| equipSerial | String | 시리얼번호 |
| status | String | 사용 상태 |

---

### 3.28 자원·예약 관리 (Resource/Reserve)

**컨트롤러**: `/Resource`, `/Reserve`

#### 3.28.1 자원 관리 기능

| 기능 | URL | 설명 |
|------|-----|------|
| 자원 목록 | `/Resource/list` | 사용 가능 자원(회의실 등) 목록 |
| 자원 상세 | `/Resource/view` | 자원 상세 정보 |

#### 3.28.2 예약 관리 기능

| 기능 | URL | 설명 |
|------|-----|------|
| 예약 목록 | `/Reserve/list` | 예약 내역 조회 |
| 예약 상세 | `/Reserve/view` | 예약 상세 정보 |
| 예약 등록 | `/Reserve/edit` | 예약 등록·수정 |
| 예약 저장 | `/Reserve/save` | 예약 저장 |
| 예약 삭제 | `/Reserve/delete` | 예약 삭제 |

#### 3.28.3 예약 모델 (`ReserveVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| reserveNo | int | 예약 번호 (PK) |
| reserveDate | Date | 예약 일자 |
| roomNo | int | 회의실/자원 번호 |
| roomName | String | 회의실/자원명 |
| regUserNo | int | 예약자 |
| reserveStatus | String | 예약 상태 |

---

### 3.29 인사·경력 관리 (Career/Certificate/Credential)

**컨트롤러**: `/Career`, `/Certificate`, `/Credential`

#### 3.29.1 기능 목록

**경력 관리 (`/Career`)**

| 기능 | URL | 설명 |
|------|-----|------|
| 경력 목록 | `/Career/list` | 사원 경력 이력 관리 |
| 경력 상세 | `/Career/view` | 경력 상세 정보 |
| 경력 등록 | `/Career/edit` | 경력 등록·수정 |
| 경력 저장 | `/Career/save` | 경력 저장 |

**증명서 발급 (`/Certificate`)**

| 기능 | URL | 설명 |
|------|-----|------|
| 증명서 목록 | `/Certificate/list` | 증명서 발급 내역 |
| 증명서 발급 | `/Certificate/edit` | 증명서 신규 발급 |
| 증명서 삭제 | `/Certificate/delete` | 증명서 삭제 |

**자격증 관리 (`/Credential`)**

| 기능 | URL | 설명 |
|------|-----|------|
| 자격증 목록 | `/Credential/list` | 사원 자격증 관리 |
| 자격증 상세 | `/Credential/view` | 자격증 상세 정보 |
| 자격증 등록 | `/Credential/edit` | 자격증 등록·수정 |
| 자격증 저장 | `/Credential/save` | 자격증 저장 |

#### 3.29.2 경력 모델 (`CareerVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| careerNo | int | 경력 번호 (PK) |
| userNo | int | 사용자 번호 (FK) |
| careerType | String | 유형 (학력/경력/프로젝트/자격증/교육) |

---

### 3.30 급여 관리 (Salary)

**컨트롤러**: `/Salary`  
**DB 테이블**: `tbl_salary`

#### 3.30.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 급여 목록 | `/Salary/list` | 급여 지급 내역 조회 |
| 급여 상세 | `/Salary/view` | 급여 명세 상세 조회 |

> **참고**: 급여 관리는 조회 전용이며, 별도 급여 시스템에서 데이터를 연동받는 구조

---

### 3.31 상담 관리 (Consult)

**컨트롤러**: `/Consult`

#### 3.31.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 상담 목록 | `/Consult/list` | 상담 이력 목록 |
| 상담 상세 | `/Consult/view` | 상담 상세 내용 |
| 상담 등록 | `/Consult/edit` | 상담 등록·수정 |
| 상담 저장 | `/Consult/save` | 상담 저장 |
| 상담 삭제 | `/Consult/delete` | 상담 삭제 |

#### 3.31.2 상담 모델 (`ConsultVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| consultNo | int | 상담 번호 (PK) |
| consultDate | Date | 상담일 |
| consultType | String | 상담 유형 |
| consultContents | String | 상담 내용 |
| regUserNo | int | 등록자 |

---

### 3.32 경영현황 (Biz)

**컨트롤러**: `/Biz`

#### 3.32.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 경영 현황 | `/Biz/list` | 경영 현황 대시보드 |
| 경영 통계 | `/Biz/stat` | 경영 통계 차트·집계 |
| 경영 상세 | `/Biz/view` | 경영 항목 상세 조회 |

#### 3.32.2 경영 모델

| 모델 | 설명 |
|------|------|
| **BizResultVO** | 기간별 경영 실적 |
| **BizTotalVO** | 전체 경영 집계 (매출·비용·이익) |

---

### 3.33 파일 관리 (File)

**컨트롤러**: `/File`

#### 3.33.1 기능 목록

| 기능 | URL | 메서드 | 설명 |
|------|-----|--------|------|
| 파일 업로드 | `/File/upload` | POST | MultipartFile 기반 파일 업로드 |
| 파일 다운로드 | `/File/download` | GET | 파일 다운로드 |
| 파일 삭제 | `/File/delete` | POST | 파일 삭제 |
| 파일 목록 | - | GET | 첨부파일 목록 조회 |

#### 3.33.2 파일 모델 (`FileVO`)

| 필드 | 타입 | 설명 |
|------|------|------|
| fileId | String | 파일 ID (PK) |
| fileName | String | 원본 파일명 |
| filePath | String | 저장 경로 |
| fileSize | long | 파일 크기 |
| fileType | String | MIME 타입 |
| uploadDate | Date | 업로드 일시 |
| uploadUserNo | int | 업로드 사용자 |

#### 3.33.3 파일 저장 경로

- 운영: `setting.file-store-path` (설정값)
- 개발: `\\172.16.30.86/storage_hm` (네트워크 스토리지)
- 기본: `c:/upload/`
- 최대 파일 크기: 70MB, 최대 요청 크기: 500MB

---

### 3.34 메뉴 관리 (Menu)

**컨트롤러**: `/Menu`

#### 3.34.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 메뉴 목록 | `/Menu/list` | 시스템 메뉴 트리 조회 |
| 메뉴 상세 | `/Menu/view` | 메뉴 상세 정보 |
| 메뉴 등록 | `/Menu/edit` | 메뉴 등록·수정 |
| 메뉴 저장 | `/Menu/save` | 메뉴 저장 |
| 메뉴 삭제 | `/Menu/delete` | 메뉴 삭제 |

---

### 3.35 수정자 관리 (Modifier)

**컨트롤러**: `/Modifier`  
**설정**: `setting.func.modifier=true` (활성화 여부)

#### 3.35.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 수정자 목록 | `/Modifier/list` | 데이터 수정 이력 조회 |
| 수정자 상세 | `/Modifier/view` | 수정 이력 상세 |
| 수정자 편집 | `/Modifier/edit` | 수정 이력 편집 |
| 수정자 저장 | `/Modifier/save` | 수정 이력 저장 |

---

### 3.36 공통 기능 (Common)

**컨트롤러**: `/Common`, `/back/common`

#### 3.36.1 기능 목록

| 기능 | URL | 설명 |
|------|-----|------|
| 기념일 조회 | `/back/common/anniversaries` | 생일·입사기념일 목록 |
| 체크리스트 | `/back/common/checklist` | 업무 체크리스트 |
| 통합 검색 | `/back/common/SearchLayer` | 검색 레이어 팝업 |
| 검색 결과 | `/back/common/SearchList` | 검색 결과 목록 |
| 법인 목록 | `/back/common/CompList` | 회사(법인) 목록 |
| 댓글 조회 | `/back/common/reply` | 댓글 조회 |
| 댓글 등록 | `/back/common/reply` | 댓글 등록 |

#### 3.36.2 공통 모델

| 모델 | 설명 |
|------|------|
| **HanmamVO** | 모든 VO의 기본 클래스 (regUserNo, modUserNo, regUserName, attachFileId, command, checkNo) |
| **RestResponse** | REST API 표준 응답 래퍼 |
| **ResultPage** | 페이징 래퍼 (records, totalCount, totalPage, currentPage) |
| **ResultList** | 검색 결과 리스트 래퍼 |
| **ReplyVO** | 댓글 데이터 |
| **CodeVO** | 코드 테이블 데이터 (codeNo, codeName) |
| **StatVO** | 통계 데이터 |
| **CompVO** | 회사(법인) 정보 (compNo, compName, compShort, compAddress, busiNo, leaderName) |

---

## 4. 데이터베이스 설계

### 4.1 테이블 목록

| # | 테이블명 | 도메인 | 설명 |
|---|---------|--------|------|
| 1 | tbl_user | 인사 | 사용자 |
| 2 | tbl_org | 인사 | 조직 |
| 3 | tbl_daily_plan | 업무 | 일일 업무계획 |
| 4 | tbl_daily_result | 업무 | 일일 업무결과 |
| 5 | tbl_call | 업무 | 업무지시 |
| 6 | tbl_call_board | 업무 | 업무 게시판 |
| 7 | tbl_call_memo | 업무 | 업무-메모 연결 |
| 8 | tbl_memo | 업무 | 메모·설계문서 |
| 9 | tbl_memo_relation | 업무 | 메모 관계(계층) |
| 10 | tbl_memo_log | 업무 | 메모 이력 |
| 11 | tbl_prj (tbl_project) | 프로젝트 | 프로젝트 |
| 12 | tbl_weekly | 업무 | 주간보고 |
| 13 | tbl_schedule | 업무 | 일정 |
| 14 | tbl_vacation | 인사 | 휴가 |
| 15 | tbl_bbs | 협업 | 게시글 |
| 16 | tbl_bbs_master | 협업 | 게시판 마스터 |
| 17 | tbl_notice | 협업 | 공지사항 |
| 18 | tbl_contract | 경영 | 계약 |
| 19 | tbl_sales | 경영 | 매출 |
| 20 | tbl_invoice | 경영 | 세금계산서 |
| 21 | tbl_bill | 경영 | 매입 |
| 22 | tbl_expense | 경영 | 경비 |
| 23 | tbl_account | 경영 | 계정과목 |
| 24 | tbl_bank | 경영 | 은행계좌 |
| 25 | tbl_bank_book | 경영 | 통장 거래 |
| 26 | tbl_card | 경영 | 법인카드 |
| 27 | tbl_card_spend | 경영 | 카드사용내역 |
| 28 | tbl_budget | 경영 | 예산 |
| 29 | tbl_trade | 경영 | 내부거래 |
| 30 | tbl_doc | 문서 | 전자결재 문서 |
| 31 | tbl_doc_register | 문서 | 문서대장 |
| 32 | tbl_customer | 마스터 | 거래처 |
| 33 | tbl_product | 마스터 | 상품 |
| 34 | tbl_equip | 자산 | 장비 |
| 35 | tbl_reserve | 자산 | 예약 |
| 36 | tbl_salary | 인사 | 급여 |
| 37 | tbl_career | 인사 | 경력 |
| 38 | tbl_certificate | 인사 | 증명서 |
| 39 | tbl_credential | 인사 | 자격증 |
| 40 | tbl_consult | 인사 | 상담 |
| 41 | tbl_search_history | 공통 | 검색 이력 |
| 42 | tbl_file | 공통 | 파일 |

### 4.2 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 테이블명 | `tbl_` + snake_case | `tbl_contract` |
| PK | `{ENTITY}_NO` | `CONTRACT_NO`, `USER_NO` |
| FK | 참조 엔티티의 PK명 그대로 사용 | `CUST_NO`, `PRJ_NO` |
| 등록 일시 | `REG_DATETIME` | - |
| 수정 일시 | `MOD_DATETIME` | - |
| 삭제 플래그 | `DEL_YN` (Y/N) | Soft Delete |
| 상태 코드 | `STATUS` | 숫자 코드값 |

### 4.3 주요 관계 다이어그램 (경영 도메인)

```
tbl_customer ─────┐
                  │
tbl_contract ─────┤─── tbl_sales ─── tbl_invoice
                  │         │
tbl_project ──────┘         ├── tbl_budget
                            ├── tbl_expense
                            └── tbl_trade

tbl_account (계정과목 트리)
    └── tbl_sales.ACC_CODE (FK)
    └── tbl_budget.ACC_CODE (FK)

tbl_bank ─── tbl_bank_book (입출금 내역)
tbl_card ─── tbl_card_spend (카드 사용 내역)
```

### 4.4 주요 관계 다이어그램 (업무 도메인)

```
tbl_user ──── tbl_org (소속)
   │
   ├── tbl_daily_plan / tbl_daily_result (일일업무)
   ├── tbl_call ─── tbl_call_board (업무지시·게시판)
   │       └── tbl_call_memo ─── tbl_memo (업무-메모 연결)
   ├── tbl_memo ─── tbl_memo_relation (메모 계층)
   │       └── tbl_memo_log (이력)
   ├── tbl_project ─── tbl_project_user (멤버)
   ├── tbl_weekly (주간보고)
   ├── tbl_schedule (일정)
   ├── tbl_vacation (휴가)
   └── tbl_doc ─── tbl_doc_user (결재선)
```

---

## 5. REST API 명세

### 5.1 Common API (`/back/common`)

| Method | Endpoint | 설명 | 응답 |
|--------|----------|------|------|
| GET | `/back/common/anniversaries` | 생일·입사기념일 조회 | RestResponse |
| GET | `/back/common/checklist` | 업무 체크리스트 | RestResponse |
| GET | `/back/common/SearchLayer` | 통합 검색 레이어 | RestResponse |
| GET | `/back/common/SearchList` | 통합 검색 결과 | ResultList |
| GET | `/back/common/CompList` | 법인 목록 | RestResponse |
| GET | `/back/common/reply` | 댓글 조회 | RestResponse |
| POST | `/back/common/reply` | 댓글 등록 | RestResponse |

### 5.2 Portal API (`/back/*`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/back/user` | 사용자 정보 조회 |
| POST | `/back/user` | 사용자 정보 수정 |
| GET | `/back/daily` | 일일업무 조회 |
| POST | `/back/daily` | 일일업무 저장 |
| GET | `/back/call` | 업무지시 조회 |
| POST | `/back/call` | 업무지시 저장 |
| GET | `/back/bbs` | 게시판 조회 |
| POST | `/back/bbs` | 게시글 저장 |
| DELETE | `/back/bbs` | 게시글 삭제 |
| GET | `/back/notice` | 공지사항 조회 |
| POST | `/back/notice` | 공지사항 저장 |
| GET | `/back/schedule` | 일정 조회 |
| POST | `/back/schedule` | 일정 저장 |
| POST | `/back/file` | 파일 업로드 |
| GET | `/back/file` | 파일 다운로드 |
| DELETE | `/back/file` | 파일 삭제 |
| GET | `/back/menu/list` | 메뉴 목록 |

### 5.3 Business API (`/back/*`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/back/Contract` | 계약 목록 조회 |
| POST | `/back/Contract` | 계약 저장 |
| GET | `/back/Customer` | 거래처 조회 |

---

## 6. 보안 설계

### 6.1 인증 체계

| 항목 | 구현 |
|------|------|
| 인증 방식 | 세션 기반 폼 로그인 |
| 비밀번호 암호화 | BCrypt (`HmPasswordEncoderFactories`) |
| 세션 타임아웃 | 8시간 (480분) |
| 동시 세션 | `SessionRegistry`에 의한 중복 세션 제어 |
| CSRF 방어 | `CookieCSRFTokenRepository` |
| CORS | 허용 설정 |

### 6.2 XSS 방어

| 계층 | 방어 수단 |
|------|-----------|
| 서블릿 필터 | NHN Lucy XSS Servlet Filter (`lucy-xss-servlet-filter-rule.xml`) |
| 서비스 레이어 | Jsoup 기반 `HtmlSanitizer` (메모 HTML 정제) |
| 뷰 레이어 | JSP 자동 이스케이핑 |

### 6.3 권한 체계 (`UserAuthCd`)

| 권한 코드 | 설명 |
|-----------|------|
| 관리자 | 전체 시스템 관리 권한 |
| 일반 사용자 | 기본 업무 기능 접근 |
| 관리자 상세 권한 | `AdminAuthDetailCd`에 의한 세분화 |

---

## 7. 스케줄러 (Quartz)

### 7.1 설정

- **설정 클래스**: `ScheduleConfig.java`
- **관리 매니저**: `ScheduleManager` (common/quartz)
- **실행 방식**: Spring Quartz 통합

### 7.2 주요 스케줄 작업

| 작업 | 설명 |
|------|------|
| 계약 자동 발행 | 계약 조건에 따른 매출·인보이스 자동 생성 (`AutoPublish`) |
| 기타 정기 배치 | 설정에 따른 정기 실행 작업 |

---

## 8. 부록

### 8.1 상태 코드 정의

#### 계약 상태 (`ContractVO`)

| 코드 | 상수 | 설명 |
|------|------|------|
| 1 | statusStart | 진행중 |
| 2 | statusStop | 중단 |
| 3 | statusEnd | 종료 |

#### 매출 상태 (`SalesVO`)

| 코드 | 상수 | 설명 |
|------|------|------|
| 1 | salesStatusNew | 신규 |
| 2 | salesStatusConfirm | 확정 |

#### 인보이스 상태

| 코드 | 상수 | 설명 |
|------|------|------|
| 1 | CANCEL | 취소 |
| 2 | REQUEST | 발행 요청 |
| 4 | PUBLISH | 발행 완료 |

#### 인보이스 유형

| 코드 | 상수 | 설명 |
|------|------|------|
| 1 | invoiceTypeInvoice | 세금계산서 |
| 2 | invoiceTypeCard | 카드 결제 |
| 3 | invoiceTypeNotPublish | 미발행 |
| 4 | invoiceTypeVirtual | 가수금 |

#### 프로젝트 상태

| 코드 | 상수 | 설명 |
|------|------|------|
| 1 | statusPrjStart | 진행중 |
| 2 | statusPrjStop | 중단 |
| 3 | statusPrjEnd | 완료 |
| 4 | statusPrjDel | 삭제 |

#### 메모 상태 (`MemoStatus`)

| 코드 | 설명 |
|------|------|
| ADD | 추가 |
| EDIT | 편집중 |
| FINALIZE | 확정 |

#### 근무 유형 (`WorkTypeCd`)

일일업무에서 사용하는 근무 유형 코드

### 8.2 공통 유틸리티

| 유틸리티 | 설명 |
|----------|------|
| `SessionUtil` | 세션 사용자 관리 (getUser, setUser) |
| `CommonUtil` | 범용 유틸리티 |
| `CalendarUtil` | 날짜·캘린더 연산 (getToday, getFirstDateOfThisWeek 등) |
| `FileUtil` | 파일 업로드·다운로드·삭제 처리 |
| `RequestUtils` | HTTP 요청 처리 |
| `RestApIUtils` | REST API 요청 유틸리티 |
| `JSONSender` | JSON 응답 전송 |
| `HtmlSanitizer` | Jsoup 기반 HTML 정제 (XSS 방어) |
| `LogUtils` | 로깅 유틸리티 |
| `MyBatisUtils` | MyBatis 유틸리티 |

### 8.3 TypeHandler 목록

| TypeHandler | 설명 |
|-------------|------|
| StringCodeEnumTypeHandler | String 코드 ↔ Enum 변환 |
| ShortCodeEnumTypeHandler | Short 코드 ↔ Enum 변환 |
| IntegerCodeEnumTypeHandler | Integer 코드 ↔ Enum 변환 |
| ByteCodeEnumTypeHandler | Byte 코드 ↔ Enum 변환 |
| Strip4ByteStringTypeHandler | 4바이트 UTF-8 문자 제거 (이모지 등) |

### 8.4 화면 레이아웃 (Tiles)

| 템플릿 | 설명 |
|--------|------|
| layout.css | 메인 레이아웃 |
| layout-login.css | 로그인 페이지 레이아웃 |
| layout_modal.css | 모달 다이얼로그 레이아웃 |
| page.css | 페이지별 스타일 |
| component.css | 공통 UI 컴포넌트 |

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-04-14 | - | 최초 작성 (소스코드 기반 역공학 분석) |
