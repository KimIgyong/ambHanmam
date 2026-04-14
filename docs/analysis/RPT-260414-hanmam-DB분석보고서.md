# hanmam DB 기능 분석 보고서

> 분석일: 2026-04-14
> 대상: localhost:3306 / hanmam_db (MariaDB)
> 테이블: 88개 / 총 데이터: 약 260만건

---

## 1. 인사/조직 관리 (HR)

### 1-1. 회사 (tbl_comp) — 10건
| COMP_NO | COMP_NAME | SHORT_NAME | CEO_USER_NO | LABOR_PRJ_NO |
|---------|-----------|------------|-------------|--------------|
| 0 | 전체 | - | 2 | 13888 |
| 1 | 새하컴즈 | 새하 | 2 | 13888 |
| 2 | 유프리즘 | 유프 | 2 | 13888 |
| 3 | 도전하는사람들 | 도사 | 2 | 13895 |
| 4 | 프로비츠 | 프로 | 2 | 13888 |
| 5 | 아르고존 | 아르 | 2 | 13888 |
| 6 | 코코넛라이브 | 코코 | 2 | 13888 |
| 7 | 아자소프트 | 아자 | 2 | 13888 |
| 8 | 유프리즘아이오 | 아이오 | 2 | 13888 |
| 9 | 보다에듀 | 보다 | 2 | 13888 |

- 10개 회사 중 실제 운영: 새하컴즈(1), 도전하는사람들(3), 보다에듀(9)
- CEO_USER_NO=2 (서장열) 공통 — 실질적으로 그룹 대표
- LABOR_PRJ_NO: 인건비 귀속 프로젝트 (13888=새하, 13895=도사)

### 1-2. 부서 (tbl_org) — 42건 (활성 28건)
| ORG_LEVEL | 의미 | 활성 건수 |
|-----------|------|----------|
| 0 | 전체 | 2 |
| 1 | 회사 | 4 |
| 2 | 본부/실 | 8 |
| 3 | 팀 | 14 |

### 1-3. 직급 (tbl_rank) — 11개
사원(10) → 대리(20) → 과장(30) → 차장(40) → 부장(50) → 수석(60) → 이사(100) → 상무(200) → 전무(300) → 대표(400) → 사장(600)

### 1-4. 사용자 (tbl_user) — 202명
| 회사 | 재직(W) | 퇴사(R) | 합계 |
|------|---------|---------|------|
| 새하컴즈 | 40 | 90 | 130 |
| 도전하는사람들 | 53 | 15 | 68 |
| 보다에듀 | 2 | 2 | 4 |
| **합계** | **95** | **107** | **202** |

**USER_AUTH (비트필드 권한)**:
- 0: 일반 사용자 (173명)
- 비트별: 1=시스템관리, 2=?, 256=사업권한, 1024=?, 기타 조합

### 1-5. 휴가 (tbl_vacation) — 10,286건 (활성 8,431건)
| WORK_TYPE | 의미 | 건수 |
|-----------|------|------|
| 10 | 연차 | 5,853 |
| 12 | 반차(오후) | 1,190 |
| 14 | 반차(오전) | 783 |
| 11 | 특별휴가 | 462 |
| 13 | 병가 | 128 |
| 15 | 기타 | 8 |

연도별 추이: 2022(1,663) → 2023(1,591) → 2024(1,800) → 2025(1,664) → 2026(482, 진행중)

### 1-6. 급여 (tbl_salary) — 5,567건
- 구조: USER_NO, SALARY_DATE, AMOUNT + SALARY_1~9(급여항목) + TAX_1~9(공제항목)
- 급여 항목/세금 항목이 번호로 관리됨 (1~9 고정 컬럼)

### 1-7. 경력관리 (tbl_career_*)
| 테이블 | 건수 | 설명 |
|--------|------|------|
| career_info | 251 | 학력 정보 (학교, 학위, 전공) |
| career_work | 856 | 경력 (회사, 부서, 직위, 기간) |
| career_prj | 2,846 | 수행 프로젝트 이력 |
| career_edu | 587 | 교육 이수 |
| career_lic | 354 | 자격증/면허 |
| career_train | 191 | 사내 교육 |

---

## 2. 전자결재 (Electronic Approval)

### 2-1. 결재문서 (tbl_doc) — 29,014건
**DOC_STATUS (상태)**:
| 상태 | 의미 | 건수 |
|------|------|------|
| 4 | 완결 | 33,429 |
| -1 | 반려 | 3,708 |
| -2 | 삭제 | 71 |
| 2 | 진행중 | 38 |
| 3 | 전결 완료 | 10 |
| 1 | 기안 | 2 |

### 2-2. 결재양식 (tbl_doc_form) — 13개
| FORM_NO | 양식명 | 사용건수 | 설명 |
|---------|--------|----------|------|
| 11 | 지출보고 | 25,911 | 매입/경비 지출 보고 |
| 2 | 휴가신청 | 6,948 | 연차/특별휴가 |
| 41 | 출금보고 | 1,709 | 지출보고 없는 출금 |
| 21 | 매출보고 | 1,067 | 매출+매입+이익율 |
| 42 | 입금보고 | 834 | 매출보고 없는 입금 |
| 1 | 일반결재 | 465 | 범용 결재 |
| 22 | 계산서 발행요청 | 178 | |
| 14 | 미입금 계산서 보고 | 99 | |
| 31 | 예산승인 | 47 | |
| 5 | 휴일근무 | (비활성) | |
| 12 | 지출보고(경비) | (비활성) | |
| 13 | 지출시점 변경보고 | | |
| 23 | 다년도 매출보고 | | |

### 2-3. 결재선 참여자 (tbl_doc_user) — 138,156건
| CONFIRM_TYPE | 의미 | 건수 |
|--------------|------|------|
| 0 | 기안자 | 8,815 |
| 1 | 검토자 | 37,255 |
| 2 | 협조자 | 20,701 |
| 3 | 전결자 | 40,069 |
| 4 | 참조자 | 30,456 |

| CONFIRM_STATUS | 의미 | 건수 |
|----------------|------|------|
| 0 | 대기 | 14,596 |
| 1 | 확인/승인 | 120,040 |
| 2 | 반려 | 2,660 |

### 2-4. 결재 코멘트 (tbl_doc_comment) — 130,520건

---

## 3. 일일업무 관리

### 3-1. 업무실적 (tbl_daily_result) — 129,771건
- **구조**: WORK_DATE, WORK_HOUR(시간), REG_USER_NO, CONTENTS, PRJ_NO
- **활동**: 1,862일간 176명이 등록
- **연도별**: 2022(30,966) → 2023(27,636) → 2024(22,781) → 2025(20,167) → 2026(5,698)
- **특징**: 프로젝트(PRJ_NO)에 귀속되는 인건비 산정 기초 데이터

### 3-2. 업무계획 (tbl_daily_plan) — 60,592건
- **구조**: WORK_DATE, WORK_TYPE, REG_USER_NO, CONTENTS, START_HOUR, END_HOUR
- **연도별**: 2022(22,805) → 2023(19,039) → 2024(17,533) → 2025(5,565) → 2026(진행중)

---

## 4. 영업관리 (CRM)

### 4-1. 영업활동 (tbl_call) — 16,919건
**CALL_TYPE (비트필드)**:
| 비트값 | 의미 | 건수 |
|--------|------|------|
| 128 | 유지보수 | 7,396 |
| 16 | 제안 | 4,675 |
| 64 | 구축 | 2,446 |
| 1 | 전화 | 2,149 |
| 2 | 방문 | 1,819 |
| 4 | 미팅 | 1,714 |
| 8 | 이메일 | 107 |
| 32 | 데모 | 30 |

**STATUS**: 완료(3): 19,354 / 삭제(-1): 682 / 진행(1): 163 / 진행(2): 137
**연도별**: 2022(4,926) → 2023(3,698) → 2024(4,472) → 2025(3,863) → 2026(1,008)

- 관련 테이블: tbl_call_user(97,607), tbl_call_board(226), tbl_call_interest(1,250), tbl_call_memo(176)

### 4-2. 상담관리 (tbl_consult) — 34,697건
- **구조**: CONTRACT_NO(계약), USER_NAME/TEL/EMAIL(고객), RECV_TYPE(접수유형), STATUS, CONSULT_TYPE, ERROR_TYPE, REQUEST_NOTE, RESOLVE_NOTE
- **연도별**: 2022(13,634) → 2023(8,586) → 2024(3,055) → 2025(2,314) → 2026(670)
- **댓글**: tbl_reply 155,187건 (상담 1건당 평균 4.5개 댓글)

### 4-3. 고객 (tbl_customer) — 3,702건
- **구조**: CUST_NAME, BUSI_NO(사업자번호), CEO_NAME, ADDRESS, BUSI_KIND(업종), BUSI_TYPE(업태)

---

## 5. 경비/회계 관리

### 5-1. 경비 (tbl_expense) — 84,908건
- **구조**: EXPENSE_DATE, PRICE, VAT, ACC_CODE(계정과목), PRJ_NO, DOC_NO(결재문서), PAY_USER_NO
- **연도별 금액**: 2022(409억) → 2023(303억) → 2024(286억) → 2025(284억) → 2026(77억)
- **주요 계정과목**: 여비교통비(20,659), 외주용역비(13,004), 접대비(10,460)

### 5-2. 계정과목 (tbl_account) — 172건
- **구조**: ACC_CODE(7자리), ACC_NAME, ACC_TYPE(1=원가, 2=판관비)
- 주요: 매출원가(101xxxx), 판매관리비(102xxxx), 기타(103xxxx, 104xxxx)

### 5-3. 은행/계좌 (tbl_bank, tbl_bank_inout, tbl_bank_book)
- **은행**: 17개
- **통장**: 59건 (bank_book)
- **입출금**: 31,908건 — 2022(7,832) → 2023(7,593) → 2024(7,300) → 2025(6,889) → 2026(2,282)
- **연동**: tbl_bank_link(93,066), tbl_bank_upload(3,200)

### 5-4. 법인카드 (tbl_card, tbl_card_spend)
- **카드**: 236장
- **사용내역**: 47,813건 — 2022(11,410) → 2023(11,105) → 2024(11,159) → 2025(12,467) → 2026(3,899)
- **관련**: tbl_card_upload(1,266), tbl_card_comp(5개 카드사), tbl_card_history(1,984)

### 5-5. 매출 (tbl_sales) — 23,055건
- **구조**: SALES_DATE, PRICE, VAT, ACC_CODE, PRJ_NO, DOC_NO, CONTRACT_NO
- **연도별**: 2022(3,177) → 2023(2,896) → 2024(2,347) → 2025(2,124) → 2026(781, 진행중)

### 5-6. 거래/매입 (tbl_trade) — 11,497건
- **구조**: TRADE_DATE, PRICE, VAT, ACC_CODE, SALES_PRJ_NO, PURCHASE_PRJ_NO, DOC_NO
- **연도별**: 2022(3,177) → 2023(2,896) → 2024(2,347) → 2025(2,124) → 2026(781)

### 5-7. 계산서/세금계산서 (tbl_invoice) — 30,615건
- **구조**: INVOICE_DATE, PRICE, VAT, SALES_NO, INVOICE_TYPE, PUBLISH_COMP_NO, CUST_ATTACH_JSTR
- **연도별**: 2022(3,788) → 2023(3,371) → 2024(3,211) → 2025(3,988) → 2026(1,346)
- **관련**: tbl_bill(1), tbl_bill_item(3,472), tbl_bill_upload(24)

### 5-8. 예산 (tbl_budget) — 17,691건
- **구조**: BUDGET_DATE, PRICE, VAT, ACC_CODE, PRJ_NO, DOC_NO
- 프로젝트별 계정과목별 예산 관리

### 5-9. 계약 (tbl_contract) — 1,583건
- **구조**: CONTRACT_SERIAL, CONTRACT_NAME, CUST_NO, PRJ_NO, COMP_NO, SERVICE_START/END_DATE, PRICE/VAT
- **자동화**: SALES_AUTO(매출자동), INVOICE_AUTO(계산서자동), EVERY_MONTH(매월반복)
- **상태**: 진행(447), 종료(970), 해지(52), 대기(2), 삭제(8)

---

## 6. 프로젝트 관리

### 6-1. 프로젝트 (tbl_prj) — 380건
| PRJ_LEVEL | 의미 | 진행 | 종료 | 삭제 | 합계 |
|-----------|------|------|------|------|------|
| 0 | 전체 | 1 | - | - | 1 |
| 1 | 회사 | 3 | - | - | 3 |
| 2 | 부서 | 10 | - | 2 | 12 |
| 3 | 사업 | 52 | 17 | 8 | 77 |
| 4 | 프로젝트 | 70 | 124 | 93 | 287 |

- **유형**: 영업(S), 수행(P), 사업(B), 경영(M)
- **규칙**: LABOR_RULE(인건비), EXPENSE_RULE(경비), SHOW_RULE(가시성), BUDGET_RULE(예산통제)

### 6-2. 프로젝트 참여자 (tbl_prj_user) — 325건
- USER_TYPE: 1=Leader, 2=Member
- WORK_RATE: 투입률(%)

### 6-3. 연간 사업계획 (tbl_prj_plan) — 1,957건
- 프로젝트별 월간: 매출(외/내), 매입(외/내), 인건비, 경비, 공통경비

### 6-4. 상품 (tbl_product) — 14건
- PRODUCT_NAME, SHORT_NAME, ACC_CODE(계정), SORT_NO

---

## 7. 커뮤니케이션

### 7-1. 게시판 (tbl_bbs) — 8,534건
- 26개 게시판 마스터(tbl_bbs_master)
- 카테고리, 첨부파일, 댓글수, 조회수, 좋아요
- 연도별: 2022(386) → 2023(220) → 2024(157) → 2025(125) → 2026(46)

### 7-2. 공지사항 (tbl_notice) — 24,393건
- 발신자 → 수신자(tbl_notice_receiver 43,417건)
- 연도별: 2022(5,329) → 2023(3,967) → 2024(3,609) → 2025(2,637) → 2026(1,265)

### 7-3. 메일 (tbl_mail) — 27,352건
- MAIL_SEND, SMS_SEND, PUSH_SEND 멀티채널 발송
- 수신자(tbl_mail_receiver 36,807건)
- 연도별: 2022(512) → 2023(537) → 2024(222) → 2025(219) → 2026(66)

### 7-4. 메모/정보관리 (tbl_memo) — 1,645건
- 계층 구조: tbl_memo_relation(1,735건 부모-자식)
- 접근 권한: tbl_memo_user(0건 — 미사용)
- 활동 로그: tbl_memo_log(8,040건)

### 7-5. 회의 (tbl_meeting) — 226건
- MEETING_TITLE, MEETING_DATE, AUTH_TYPE(공개범위)
- 참석자: tbl_meeting_user(725건)
- 연도별: 2022(17) → 2023(81) → 2024(58) → 2025(54) → 2026(16)

### 7-6. 일정 (tbl_schedule) — 1,389건
- SCHEDULE_TYPE, COMP_NO, ORG_NO, START/END_DATETIME, SUBJECT, CONTENTS
- 개인/부서/회사 일정 통합 관리

### 7-7. 주보 (tbl_weekly) — 608건
- 주간 업무보고: SUBJECT, WEEKLY_RESULT(실적), WEEKLY_PLAN(계획), WEEKLY_DATE
- 회의(MEETING_NO) 연동
- 대부분 2022년 이전 데이터 (현재 미사용 추정)

---

## 8. 기타 모듈

### 8-1. 장비관리 (tbl_equip) — 1,218건
- MANAGE_NO(관리번호), EQUIP_TYPE, SERIAL_NO, STATUS, USER_NO(사용자)
- 이력: tbl_equip_history(4,894건), tbl_equip_type(12종), tbl_equip_repair(1건)

### 8-2. 회의실/자원 예약 (tbl_reserve, tbl_room)
- 회의실: 5개 활성 (대회의실 A/B, 소회의실 1/2/3)
- 예약: 83건

### 8-3. 차량 (tbl_car) — 1건 (비활성)

### 8-4. IP 관리 (tbl_ip) — 591건

### 8-5. 첨부파일 (tbl_file) — 140,453건

### 8-6. 사용자 로그 (tbl_user_log) — 1,023,325건
- 연도별: 2022(151K) → 2023(272K) → 2024(285K) → 2025(258K) → 2026(81K)

---

## 9. 데이터 관계도 (핵심 FK 연결)

```
tbl_comp (회사)
 ├─ tbl_org (부서) ─── tbl_user (사용자)
 │                      ├─ tbl_daily_result (업무실적) ──┐
 │                      ├─ tbl_daily_plan (업무계획)      │
 │                      ├─ tbl_vacation (휴가)            │
 │                      ├─ tbl_salary (급여)              │
 │                      └─ tbl_career_* (경력)            │
 │                                                        │
 ├─ tbl_prj (프로젝트) ◄─────────────────────────────────┘
 │   ├─ tbl_prj_user (투입인력)          PRJ_NO로 연결
 │   ├─ tbl_prj_plan (사업계획)
 │   ├─ tbl_expense (경비) ◄── tbl_doc (결재)
 │   ├─ tbl_sales (매출) ◄──── tbl_doc (결재)
 │   ├─ tbl_trade (거래)
 │   ├─ tbl_budget (예산)
 │   └─ tbl_contract (계약) ── tbl_customer (고객)
 │                              └─ tbl_consult (상담)
 │                                  └─ tbl_reply (댓글)
 │
 ├─ tbl_call (영업) ── tbl_call_user (참여자)
 │
 ├─ tbl_doc (결재) ── tbl_doc_user (결재선)
 │   └─ tbl_doc_form (양식)
 │
 ├─ tbl_bank_inout (입출금) ── tbl_bank_book (통장) ── tbl_bank (은행)
 ├─ tbl_card_spend (카드) ── tbl_card (법인카드)
 ├─ tbl_invoice (계산서) ── tbl_sales
 │
 └─ 커뮤니케이션
     ├─ tbl_bbs (게시판)
     ├─ tbl_notice (공지)
     ├─ tbl_mail (메일)
     ├─ tbl_memo (정보관리)
     ├─ tbl_meeting (회의)
     └─ tbl_schedule (일정)
```

---

## 10. 모듈별 데이터 규모 요약

| 모듈 | 핵심 테이블 | 총 건수 | 현재 활성 |
|------|------------|---------|----------|
| **일일업무** | daily_result + daily_plan | 190K | O (매일 사용) |
| **전자결재** | doc + doc_user + doc_comment | 297K | O (핵심) |
| **경비/회계** | expense + sales + trade + bank_inout + card_spend + invoice + budget | 247K | O (핵심) |
| **영업(CRM)** | call + call_user + consult + reply | 304K | O (활발) |
| **인사/조직** | user + org + comp + vacation + salary + career_* | 20K | O |
| **커뮤니케이션** | bbs + notice + mail + memo + meeting + schedule + weekly | 63K | O (감소 추세) |
| **프로젝트** | prj + prj_user + prj_plan + product | 2.7K | O |
| **장비/기타** | equip + reserve + ip + file | 142K | O |
| **로그** | user_log | 1,023K | O (시스템) |

---

## 11. AMB 통합 시 우선순위 제안

### Phase 1 - 기초 데이터 (완료)
- [x] tbl_comp → amb_hr_entities
- [x] tbl_org → amb_units
- [x] tbl_user → amb_users + amb_hr_employees + amb_hr_employees_kr

### Phase 2 - 핵심 업무 (다음 단계)
1. **프로젝트** (tbl_prj → kms_projects) — 모든 거래의 귀속 단위
2. **고객** (tbl_customer → 신규 또는 기존 client 테이블)
3. **계정과목** (tbl_account → 신규)
4. **계약** (tbl_contract → 신규)

### Phase 3 - 거래 데이터
5. **경비** (tbl_expense)
6. **매출** (tbl_sales)
7. **거래/매입** (tbl_trade)
8. **예산** (tbl_budget)
9. **계산서** (tbl_invoice)

### Phase 4 - 일일업무/영업
10. **일일업무** (daily_plan, daily_result)
11. **영업활동** (tbl_call + 관련)
12. **상담관리** (tbl_consult + tbl_reply)

### Phase 5 - 전자결재
13. **결재양식** (tbl_doc_form)
14. **결재문서** (tbl_doc + tbl_doc_user + tbl_doc_comment)

### Phase 6 - 커뮤니케이션/기타
15. 게시판, 공지, 메일, 메모, 회의, 일정
16. 장비, 예약, 첨부파일
17. 급여, 휴가, 경력관리
18. 은행/카드 관리

---

## 12. 접속 정보 (참조)

```
MySQL: host.docker.internal:3306 (docker 내부) / localhost:3306 (호스트)
계정: root / saeha
DB: hanmam_db

쿼리 실행 예시:
docker run --rm mariadb:10 mysql -h host.docker.internal -P 3306 -u root -psaeha hanmam_db -e "SELECT ..."
```
