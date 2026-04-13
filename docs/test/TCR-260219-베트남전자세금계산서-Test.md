# 테스트 케이스: 베트남 전자세금계산서(Hóa Đơn Điện Tử) 발행 기능

**문서번호**: TC-베트남전자세금계산서-Test-20260219
**작성일**: 2026-02-19
**기반 문서**: PLAN-베트남전자세금계산서-작업계획-20260219

---

## 1. 단위 테스트 케이스

### 1.1 EinvoiceXmlService (GDT XML 생성)

| TC-ID | 테스트명 | 입력 | 기대 결과 |
|-------|---------|------|-----------|
| UT-XML-001 | 정상 XML 생성 | 완전한 인보이스 데이터 (판매자 MST, 구매자 MST, items) | 유효한 GDT 표준 XML 문자열 반환, `<HDon>` 루트 태그 포함 |
| UT-XML-002 | 판매자 MST 누락 | entity.entTaxId = null | 에러: "판매자 세무코드(MST) 필수" |
| UT-XML-003 | 구매자 MST 누락 | partner.ptnTaxId = null/빈 문자열 | 에러: "구매자 세무코드(MST) 필수" |
| UT-XML-004 | 인보이스 항목 없음 | items = [] | 에러: "최소 1개 이상의 항목 필요" |
| UT-XML-005 | 다중 항목 XML | items 3개 | `<DSHHDVu>` 내 `<HHDVu>` 3개, 각각 `<STT>` 1,2,3 순번 |
| UT-XML-006 | 세율별 매핑 | taxRate = 10 | `<TSuat>VAT10%</TSuat>` |
| UT-XML-007 | 면세 매핑 | taxRate = -1 | `<TSuat>KCT</TSuat>` (면세) |
| UT-XML-008 | 8% 감면세율 | taxRate = 8 | `<TSuat>VAT8%</TSuat>` |
| UT-XML-009 | 0% 수출세율 | taxRate = 0 | `<TSuat>VAT0%</TSuat>` |
| UT-XML-010 | 금액 합계 검증 | subtotal=20000000, tax=2000000, total=22000000 | `<TgTCThue>20000000</TgTCThue>`, `<TgTThue>2000000</TgTThue>`, `<TgTTTBSo>22000000</TgTTTBSo>` |
| UT-XML-011 | UTF-8 인코딩 | 베트남어 품목명 "Dịch vụ phần mềm" | XML에 베트남어 정상 포함, UTF-8 선언 |
| UT-XML-012 | 청구서 기호 설정 | formNumber=1, referenceCode='C26TAA' | `<KHMSHDon>1</KHMSHDon>`, `<KHHDon>C26TAA</KHHDon>` |
| UT-XML-013 | 발행일 형식 | invDate = 2026-02-19 | `<NLap>2026-02-19</NLap>` |
| UT-XML-014 | 통화 코드 | currency = 'VND' | `<DVTTe>VND</DVTTe>` |
| UT-XML-015 | USD 통화 | currency = 'USD' | `<DVTTe>USD</DVTTe>` + 환율 관련 필드 |

### 1.2 TvanMockService (Mock TVAN)

| TC-ID | 테스트명 | 입력 | 기대 결과 |
|-------|---------|------|-----------|
| UT-MOCK-001 | 정상 발행 | 유효한 TvanIssueRequest | `{ success: true, einvNumber: 'MOCK-...', gdtCode: 'GDT-...' }` |
| UT-MOCK-002 | 정상 취소 | 유효한 TvanCancelRequest | `{ success: true }` |
| UT-MOCK-003 | 상태 조회 | 발행된 번호 | `{ status: 'ISSUED', einvNumber: '...' }` |
| UT-MOCK-004 | PDF 다운로드 | 발행된 번호 | 유효한 Buffer 반환 (PDF 헤더) |
| UT-MOCK-005 | XML 다운로드 | 발행된 번호 | 유효한 XML 문자열 반환 |

### 1.3 EinvoiceService (오케스트레이션)

| TC-ID | 테스트명 | 사전 조건 | 동작 | 기대 결과 |
|-------|---------|----------|------|-----------|
| UT-SVC-001 | 정상 발행 | 인보이스: APPROVED_ADMIN, einvStatus=NONE, VN법인, partner MST 존재 | issueEinvoice() | einvStatus=ISSUED, einvNumber 저장, einvIssuedAt 저장 |
| UT-SVC-002 | 미승인 인보이스 발행 시도 | approvalStatus=PENDING_REVIEW | issueEinvoice() | 에러: "최종승인 완료된 인보이스만 발행 가능" |
| UT-SVC-003 | 이미 발행된 인보이스 재발행 시도 | einvStatus=ISSUED | issueEinvoice() | 에러: "이미 전자세금계산서가 발행된 인보이스" |
| UT-SVC-004 | 실패 후 재시도 | einvStatus=FAILED | issueEinvoice() | einvStatus=ISSUED (재시도 허용) |
| UT-SVC-005 | KR 법인 발행 시도 | entity.entCountry='KR' | issueEinvoice() | 에러: "베트남 법인만 전자세금계산서 발행 가능" |
| UT-SVC-006 | TVAN API 실패 | Mock이 에러 반환 | issueEinvoice() | einvStatus=FAILED, einvError에 에러 메시지 저장 |
| UT-SVC-007 | 정상 취소 | einvStatus=ISSUED | cancelEinvoice(reason) | einvStatus=CANCELLED |
| UT-SVC-008 | 미발행 인보이스 취소 시도 | einvStatus=NONE | cancelEinvoice() | 에러: "발행된 전자세금계산서만 취소 가능" |
| UT-SVC-009 | 이미 취소된 인보이스 재취소 | einvStatus=CANCELLED | cancelEinvoice() | 에러: "이미 취소된 전자세금계산서" |
| UT-SVC-010 | 전자세금계산서 정보 조회 | einvStatus=ISSUED | getEinvoiceInfo() | status, number, gdtCode, issuedAt, lookupUrl 반환 |

---

## 2. 통합 테스트 시나리오

### 2.1 시나리오 A: 전체 발행 플로우 (Happy Path)

```
사전 조건:
- VN01 법인 존재 (entCountry='VN', entTaxId='0316XXXXXX')
- 거래처 존재 (ptnTaxId='0312YYYYYY')
- TVAN_PROVIDER=mock

Steps:
1. POST /billing/invoices → 인보이스 DRAFT 생성
   - partner_id, direction='RECEIVABLE', items 포함
   - 검증: status=DRAFT, einvStatus=NONE

2. POST /billing/invoices/:id/submit-review → 결재 요청
   - 검증: approvalStatus=PENDING_REVIEW

3. POST /billing/invoices/:id/approve-review → 검토 승인
4. POST /billing/invoices/:id/approve-manager → 관리자 승인
5. POST /billing/invoices/:id/approve-admin → 최종 승인
   - 검증: approvalStatus=APPROVED_ADMIN, status=ISSUED

6. POST /billing/invoices/:id/issue-einvoice → 전자세금계산서 발행
   - 검증: einvStatus=ISSUED
   - 검증: einvNumber, gdtCode, issuedAt NOT NULL

7. GET /billing/invoices/:id/einvoice → 전자세금계산서 정보 조회
   - 검증: status=ISSUED, number/gdtCode/lookupUrl 존재

8. GET /billing/invoices/:id/einvoice/xml → XML 다운로드
   - 검증: Content-Type: application/xml, 파일 내용 유효

9. GET /billing/invoices/:id/einvoice/pdf → PDF 다운로드
   - 검증: Content-Type: application/pdf
```

### 2.2 시나리오 B: 발행 실패 + 재시도

```
사전 조건:
- TvanMockService에 일시적 실패 모드 설정 (또는 TVAN API 다운 시뮬레이션)

Steps:
1. 인보이스 생성 + 최종승인 완료

2. POST /billing/invoices/:id/issue-einvoice
   - 검증: einvStatus=FAILED, einvError NOT NULL

3. GET /billing/invoices/:id → 인보이스 상세
   - 검증: einvoice.status='FAILED', einvoice.error 메시지 존재

4. (TVAN 복구 후) POST /billing/invoices/:id/issue-einvoice → 재시도
   - 검증: einvStatus=ISSUED
   - 검증: einvError=NULL (클리어됨)
```

### 2.3 시나리오 C: 발행 후 취소

```
Steps:
1. 시나리오 A 완료 (발행 성공 상태)

2. POST /billing/invoices/:id/cancel-einvoice
   - body: { "reason": "금액 오류로 인한 취소" }
   - 검증: einvStatus=CANCELLED

3. GET /billing/invoices/:id/einvoice
   - 검증: status=CANCELLED
```

### 2.4 시나리오 D: 비정상 접근 차단

```
Steps:
1. KR 법인 인보이스에 전자세금계산서 발행 시도
   - POST /billing/invoices/:kr-inv-id/issue-einvoice
   - 검증: 400 에러, "베트남 법인만 발행 가능"

2. 미승인 인보이스에 발행 시도
   - POST /billing/invoices/:draft-inv-id/issue-einvoice
   - 검증: 400 에러, "최종승인 필요"

3. MST 미등록 거래처 인보이스 발행 시도
   - 검증: 400 에러, "구매자 세무코드 필수"
```

### 2.5 시나리오 E: InvoiceListPage 전자세금계산서 상태 표시

```
사전 조건:
- VN01 인보이스 3개: einvStatus = NONE, ISSUED, CANCELLED

Steps:
1. GET /billing/invoices?entity_id=VN01
   - 검증: 각 인보이스 응답에 einvoice.status 포함
   - 검증: NONE/ISSUED/CANCELLED 정확히 반환
```

---

## 3. 엣지 케이스

### 3.1 데이터 엣지 케이스

| EC-ID | 시나리오 | 기대 결과 |
|-------|---------|-----------|
| EC-001 | 인보이스 금액 0원 | XML 생성 가능, `<TgTTTBSo>0</TgTTTBSo>` |
| EC-002 | 인보이스 항목 단가 소수점 (USD) | XML에 소수점 포함 `<DGia>1500.50</DGia>` |
| EC-003 | 거래처 상호명에 XML 특수문자 (`<`, `>`, `&`) | XML 이스케이프 처리 (`&lt;`, `&gt;`, `&amp;`) |
| EC-004 | 인보이스 항목 설명 1000자 초과 | XML 생성 시 적절히 잘림 또는 그대로 포함 |
| EC-005 | 동시 발행 요청 (같은 인보이스) | 첫 번째만 성공, 두 번째는 "이미 PENDING 상태" 에러 |
| EC-006 | 인보이스 soft-delete 후 발행 시도 | 404 에러 |
| EC-007 | VOID 상태 인보이스 발행 시도 | 에러: "무효화된 인보이스는 발행 불가" |

### 3.2 네트워크/외부 시스템 엣지 케이스

| EC-ID | 시나리오 | 기대 결과 |
|-------|---------|-----------|
| EC-101 | TVAN API 타임아웃 | einvStatus=FAILED, einvError="Connection timeout" |
| EC-102 | TVAN API 500 응답 | einvStatus=FAILED, einvError에 응답 메시지 저장 |
| EC-103 | TVAN API 인증 실패 (401) | einvStatus=FAILED, einvError="Authentication failed" |
| EC-104 | TVAN_PROVIDER 미설정 | 기본값 'mock' 사용, 정상 동작 |
| EC-105 | XML 다운로드 시 파일 없음 | 404 에러, "전자세금계산서 XML 파일 없음" |
| EC-106 | PDF 다운로드 시 파일 없음 | 404 에러, "전자세금계산서 PDF 파일 없음" |

### 3.3 권한/인증 엣지 케이스

| EC-ID | 시나리오 | 기대 결과 |
|-------|---------|-----------|
| EC-201 | 일반 USER가 전자세금계산서 발행 시도 | 현재 역할 기반 제한 여부 확인 (최소 APPROVED_ADMIN 인보이스 필요) |
| EC-202 | 다른 법인의 인보이스에 발행 시도 | entity 기반 필터링으로 차단 |
| EC-203 | JWT 만료 상태에서 발행 요청 | 401 Unauthorized |

---

## 4. UI 테스트 케이스

### 4.1 InvoiceDetailPage

| UI-ID | 시나리오 | 기대 동작 |
|-------|---------|-----------|
| UI-001 | KR 법인 인보이스 상세 | 전자세금계산서 섹션 미노출 |
| UI-002 | VN 법인 DRAFT 인보이스 | 전자세금계산서 섹션: "최종승인 후 발행 가능" 안내 |
| UI-003 | VN 법인 APPROVED_ADMIN + einvStatus=NONE | "전자세금계산서 발행" 버튼 활성화 |
| UI-004 | 발행 버튼 클릭 | 확인 다이얼로그 → 발행 API 호출 → 로딩 → 결과 표시 |
| UI-005 | einvStatus=PENDING | 로딩 스피너 + "발행 처리 중..." 표시 |
| UI-006 | einvStatus=ISSUED | 발행 번호, GDT 코드, 발행일 표시 + XML/PDF 다운로드 버튼 |
| UI-007 | einvStatus=FAILED | 에러 메시지 표시 (빨간색) + "재시도" 버튼 |
| UI-008 | einvStatus=CANCELLED | "취소됨" 배지, 취소 정보 표시 |
| UI-009 | "취소" 버튼 클릭 (ISSUED 상태) | 취소 사유 입력 모달 → 확인 → 취소 API 호출 |
| UI-010 | XML 다운로드 클릭 | 브라우저 파일 다운로드 (`.xml` 확장자) |
| UI-011 | PDF 다운로드 클릭 | 브라우저 파일 다운로드 (`.pdf` 확장자) |
| UI-012 | GDT 조회 링크 클릭 | 새 탭에서 GDT 포털 조회 페이지 열림 |

### 4.2 InvoiceListPage

| UI-ID | 시나리오 | 기대 동작 |
|-------|---------|-----------|
| UI-101 | VN 법인 목록 조회 | "전자세금계산서" 컬럼 표시 |
| UI-102 | KR 법인 목록 조회 | "전자세금계산서" 컬럼 미표시 |
| UI-103 | 상태별 배지 색상 | NONE=회색, PENDING=노랑, ISSUED=초록, FAILED=빨강, CANCELLED=회색취소선 |

---

## 5. 회귀 테스트

기존 기능이 영향받지 않는지 확인:

| REG-ID | 테스트 항목 | 검증 내용 |
|--------|-----------|-----------|
| REG-001 | 인보이스 CRUD | 생성/수정/삭제 정상 동작, 신규 필드 기본값 설정 |
| REG-002 | 인보이스 결재 워크플로우 | 4단계 결재 정상 동작, 최종승인 시 기존 자동화(PDF+Drive+이메일) 유지 |
| REG-003 | 인보이스 PDF 다운로드 | VN/KR 레이아웃 모두 정상 생성 |
| REG-004 | 자동 인보이스 생성 크론 | FIXED/USAGE_BASED 계약 자동 생성 정상 |
| REG-005 | 인보이스 이메일 발송 | PDF 첨부 이메일 정상 발송 |
| REG-006 | 인보이스 Void/재발행 | 기존 void-reissue 플로우 정상 |
| REG-007 | 결제(Payment) 등록 | 결제 등록 시 paidAmount 갱신 정상 |
| REG-008 | KR 세금계산서 | KR 법인 인보이스 기존 동작 전혀 변경 없음 |
| REG-009 | 빌링 리포트 | 대시보드/매출/미수금 리포트 정상 |
| REG-010 | 인보이스 목록 필터/정렬 | 기존 필터(status, direction, search) 정상 |
