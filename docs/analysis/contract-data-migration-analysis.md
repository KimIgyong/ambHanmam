# 계약 데이터 마이그레이션 요구사항 분석

**작업일**: 2026-02-18
**원본 파일**: `reference/Amoeba Vietnam_계약 관리 - Quản lý hợp đồng.xlsx`

---

## 1. 개요

Amoeba Vietnam의 계약 관리 Excel 파일에 포함된 계약서 문서 링크(파일명) 정보를 스테이징 서버의 거래처(Partner) 및 계약(Contract) 관리 시스템에 업데이트한다.

---

## 2. Excel 파일 구조 분석

### 2.1 시트 구성 (6개 시트)

| 시트 | 설명 | 데이터 행 | 주요 내용 |
|------|------|----------|----------|
| **Client** | 프로젝트 계약 - 입금 (Receivable) | ~46행 (Row 4~49) | 매출 계약, 계약서 사본 파일명 |
| **Outsourcing** | 외주 용역 계약 - 송금 (Payable) | ~20행 (Row 5~24) | 매입 계약, 계약서 사본 파일명 |
| **총무** | 총무/행정 계약 | ~44행 (Row 5~48) | 사무실 임대, 서비스 계약 등 |
| **SOW + Monthly Report** | 작업내역서 및 월간 보고서 | ~45행 | SOW/Monthly Report 파일명 |
| **Server information** | 서버 임대 정보 | ~6행 | 서버 IP, 용도, 기간 |
| **진행중_Need check** | 진행 중 건 | ~8행 | 미결건 현황 |

### 2.2 Client 시트 상세 (매출 - RECEIVABLE)

**헤더 (Row 3)**: 체결일(B), 계약기간(C), 업체명(D), 업무내용(E), 계약서상태(F), 선금(G), 잔금(H), 총용역대금(I), **계약서사본(J)**, PaymentRequest(K), Invoice(L), Payment(M), 인수인계확인서(N), Note(O)

**카테고리별 분포**:
| 카테고리 | 행 범위 | 업체 수 | 시스템 매핑 |
|---------|---------|---------|-----------|
| Tech BPO | Row 4~14 | 11 | TECH_BPO |
| SI 개발/Dev | Row 15~35 | 21 | SI_DEV |
| Maintenance | Row 37 | 1 | MAINTENANCE |
| 관리 | Row 38~40 | 3 | MARKETING/OTHER |
| Consulting | Row 42~49 | 8 | OTHER (Consulting) |

**주요 업체 목록 (Client)**:

| 업체명 | 유형 | 통화 | 계약서 파일 유무 |
|--------|------|------|-----------------|
| Crema Inc. | Tech BPO | USD | O |
| 유니드컴즈/Uneedcomms | Tech BPO | USD | O |
| OMIOS | Tech BPO | USD | O |
| 시솔지주/SISOUL Co., Ltd | Tech BPO | USD | O |
| Agile Growth | Tech BPO | USD | O |
| andar co., ltd. | Tech BPO | USD | O (2건) |
| DOOSOUN CNI | Tech BPO | USD | O |
| AST Systems, LLC / IVY USA | Tech BPO/SI Dev | USD | O (4건) |
| Amoeba Company Co., Ltd | Tech BPO/SI Dev | USD | O |
| amoebapartners ltd | SI Dev | USD | O |
| DAE DO, INC | SI Dev | USD | O |
| IVY ENTERPRISES, INC. | SI Dev | USD | O (2건) |
| Smart Kiosk | SI Dev | USD | O |
| EchoMarketing | SI Dev | USD | O |
| Serveone | SI Dev | VND | O |
| Song Phuong | SI Dev | VND | O |
| KOIPA | SI Dev | KRW | O |
| BRIDGETEC CORP | SI Dev | USD | O |
| FOODNAMOO | SI Dev | VND | X (Pending) |
| Connectable | SI Dev | VND | O |
| Crosshub Inc. | SI Dev | KRW | O |
| Gyeongbuk | SI Dev | VND | O |
| Blumn AI | SI Dev | USD | O |
| Doosoun CNI (AOS) | Maintenance | USD | O |
| Coway Co., Ltd | 관리 | VND | O (3건) |
| Ezwebpia/Gaxago | Consulting | - | O |
| TDI/Meta Crew | Consulting | VND | O |
| SBS | Consulting | VND | O |
| SMD2BOX/SAMJU | Consulting | VND | O |
| OneZeroSoft | Consulting | USD | O |
| INT Vision Co., Ltd | Consulting | VND | O |
| M12 PLUS/Giftpop | Consulting | VND | O |
| KSQUARE COMMS. INC. | Consulting | USD | X (Pending) |

### 2.3 Outsourcing 시트 상세 (매입 - PAYABLE)

**헤더 (Row 4)**: 계약번호(B), 계약날짜(C), 계약기간(D), 업체명(E), 업무내용(F), 계약서상태(G), 선금(H), 잔금(I), 총영역대금(J), **사본계약(K)**, Invoice(L), Payment(M), 인수인계확인서(N), Note(O)

**주요 외주 업체**:

| 업체명 | 건수 | 통화 |
|--------|------|------|
| SBS | 7건 | VND |
| PlusN Soft | 2건 | VND |
| INT VISION CO., LTD | 4건 | VND |
| Tech Fashion | 2건 | VND |
| M12 PLUS/Giftpop | 1건 | VND |
| BRAND NEW K | 2건 | VND |
| Amoeba Company Co., Ltd | 1건 | USD |

### 2.4 총무 시트 상세 (일반관리 - GENERAL_AFFAIRS)

**주요 업체 (일반관리/행정)**:

| 업체명 | 내용 | 통화 |
|--------|------|------|
| Park View Residence | 아파트 임대 | - |
| Cleanhouse Vietnam | 청소 서비스 | VND |
| ADAM ASSOCIATION | 법률 자문 | VND |
| Megazone Vietnam | AWS Cloud | - |
| SAMDO | 회계 서비스 | VND |
| AP Tower | 사무실 임대 | - |
| Grab | 교통 서비스 | - |
| Long Van System | 서버 임대 | VND |
| 기타 건설/인테리어 | 시공/설비 | VND |

### 2.5 SOW + Monthly Report 시트

SOW 및 월간 보고서의 파일명 정보. Client 시트의 기본 계약에 종속되는 하위 문서들.

---

## 3. 시스템 분석

### 3.1 거래처(Partner) 엔티티

**테이블**: `amb_bil_partners` (22개 필드)

주요 매핑 필드:
| 시스템 필드 | 설명 | Excel 매핑 |
|------------|------|-----------|
| ptnCode | 고유 코드 (20자) | 업체별 약어 생성 필요 |
| ptnType | CLIENT/OUTSOURCING/GENERAL_AFFAIRS 등 | 시트별 자동 결정 |
| ptnCompanyName | 영문 회사명 | D열 (업체명) |
| ptnCompanyNameLocal | 현지어 회사명 | D열에서 한국어/베트남어 분리 |
| ptnCountry | 국가 코드 | 통화/내용에서 추론 (KR/VN/US) |
| ptnDefaultCurrency | 기본 통화 | 계약금 통화에서 추출 |
| ptnNote | 비고 | O열 (Note) |
| ptnGdriveFolderId | Google Drive 폴더 | 향후 연동 시 사용 |

### 3.2 계약(Contract) 엔티티

**테이블**: `amb_bil_contracts` (25개 필드)

주요 매핑 필드:
| 시스템 필드 | 설명 | Excel 매핑 |
|------------|------|-----------|
| ctrDirection | RECEIVABLE/PAYABLE | Client=RECEIVABLE, Outsourcing=PAYABLE |
| ctrCategory | 분류 | A열 카테고리 매핑 |
| ctrType | 유형 | 계약 내용에서 추론 |
| ctrTitle | 계약명 | E열 (업무내용) |
| ctrStartDate | 시작일 | B/C열 파싱 |
| ctrEndDate | 종료일 | C열 파싱 |
| ctrAmount | 계약금 | I열 (총 용역대금) |
| ctrCurrency | 통화 | G/I열에서 추출 |
| ctrStatus | 상태 | F열 + O열 (Signed/Pending/종료) |
| ctrNote | 비고 | **J열 (계약서 사본 파일명) + O열 (Note)** |
| ctrAutoRenew | 자동갱신 | C열에서 "자동 연장" 키워드 확인 |

### 3.3 청구 문서(BillingDocument) 엔티티

**테이블**: `amb_bil_documents` (12개 필드)

J열의 계약서 파일명 정보를 document 레코드로 저장:
| 시스템 필드 | 설명 | Excel 매핑 |
|------------|------|-----------|
| docRefType | 참조 유형 | CONTRACT |
| docRefId | 계약 ID | 생성된 계약의 ID |
| docType | 문서 유형 | SIGNED_CONTRACT/APPENDIX/ACCEPTANCE_MINUTES |
| docFilename | 파일명 | J열의 PDF 파일명 |

---

## 4. 데이터 매핑 전략

### 4.1 계약서 사본 (J/K열) 분석

J열(Client)/K열(Outsourcing)에는 다음 유형의 파일명이 포함:

| 문서 유형 | 키워드 | docType 매핑 |
|----------|--------|-------------|
| 계약서 원본 | 계약서, contract, Service Contract | SIGNED_CONTRACT |
| 부속합의서 | Appendix, 부속합의서, Annex | APPENDIX |
| SOW | SOW, Statement of Works | SOW |
| 인수인계확인서 | minutes of acceptance, Liquidation | ACCEPTANCE_MINUTES |
| 기타 | NDA, 보안서약서, 기타 | OTHER |

### 4.2 파트너 코드 매핑 규칙

| 업체명 | 코드 | Type |
|--------|------|------|
| Crema Inc. | CRM | CLIENT |
| Uneedcomms | UNC | CLIENT |
| OMIOS | OMI | CLIENT |
| SISOUL Co., Ltd | SSO | CLIENT |
| Agile Growth | AGG | CLIENT |
| andar co., ltd. | ADR | CLIENT |
| DOOSOUN CNI | DSN | CLIENT |
| AST Systems/IVY USA | IVY | CLIENT |
| Amoeba Company | AMBKR | AFFILIATE |
| amoebapartners | AMBP | AFFILIATE |
| DAE DO, INC | DED | CLIENT |
| IVY ENTERPRISES | IVE | CLIENT |
| Smart Kiosk | SMK | CLIENT |
| EchoMarketing | ECM | CLIENT |
| Serveone | SVN | CLIENT |
| Song Phuong | SPH | CLIENT |
| KOIPA | KOI | CLIENT |
| BRIDGETEC | BDT | CLIENT |
| FOODNAMOO | FDN | CLIENT |
| Connectable | CNT | CLIENT |
| Crosshub | CRH | CLIENT |
| Gyeongbuk | GYB | CLIENT |
| Blumn AI | BLM | CLIENT |
| SBS | SBS | OUTSOURCING |
| PlusN Soft | PLN | OUTSOURCING |
| INT VISION | INT | OUTSOURCING |
| Tech Fashion | TFN | OUTSOURCING |
| M12 PLUS/Giftpop | GFP | OUTSOURCING |
| BRAND NEW K | BNK | OUTSOURCING |
| Coway Co., Ltd | CWY | CLIENT |
| Ezwebpia/Gaxago | EZW | CLIENT |
| TDI/Meta Crew | MTC | CLIENT |
| SMD2BOX/SAMJU | SMD | CLIENT |
| OneZeroSoft | OZS | CLIENT |
| INT Vision (Client) | ITV | CLIENT |
| KSQUARE | KSQ | CLIENT |
| Cleanhouse Vietnam | CLH | GENERAL_AFFAIRS |
| ADAM ASSOCIATION | ADM | GENERAL_AFFAIRS |
| Megazone Vietnam | MGZ | GENERAL_AFFAIRS |
| SAMDO | SMO | GENERAL_AFFAIRS |
| AP Tower | APT | GENERAL_AFFAIRS |
| Grab | GRB | GENERAL_AFFAIRS |
| Long Van System | LVN | GENERAL_AFFAIRS |
| NEWDEA | NWD | CLIENT |
| YUJINPRODUCT | YJP | CLIENT |
| SOCIALBEAN | SCB | CLIENT |
| Park View Residence | PVR | GENERAL_AFFAIRS |
| One Step | ONS | GENERAL_AFFAIRS |
| FPT | FPT | GENERAL_AFFAIRS |
| VNPT | VNP | GENERAL_AFFAIRS |
| DHL | DHL | GENERAL_AFFAIRS |
| MBI Solution/HappyTalk | MBI | GENERAL_AFFAIRS |
| Mắt Bão | MTB | GENERAL_AFFAIRS |
| Hydraulic Construction | HCC | GENERAL_AFFAIRS |
| The Spring House | TSH | GENERAL_AFFAIRS |

### 4.3 계약 상태 매핑

| Excel 값 | 시스템 ctrStatus |
|----------|-----------------|
| Signed | ACTIVE |
| Pending | DRAFT |
| 계약종료 (Note에 기재) | EXPIRED/TERMINATED |
| 자동 연장 (C열) | ACTIVE + autoRenew=true |
| Liquidation Minutes 존재 | LIQUIDATED |

---

## 5. 구현 범위

### 5.1 1차 범위 (현재 작업)

1. **Partner 데이터 생성**: Excel의 모든 고유 업체를 Partner로 등록
2. **Contract 데이터 생성**: 각 계약을 Contract로 등록 (Client + Outsourcing + 총무)
3. **BillingDocument 생성**: J/K열의 계약서 파일명을 Document로 등록
4. **SOW 데이터 생성**: SOW + Monthly Report 시트에서 SOW 레코드 등록

### 5.2 2차 범위 (향후)

- Google Drive 폴더 연동 (실제 파일 업로드)
- Invoice/Payment 데이터 입력
- 월간 보고서 데이터 입력

---

## 6. 제약사항

1. Entity ID 필요: 모든 Billing 데이터는 `entId` (HrEntity) 소속 필수
2. 기존 데이터 없음: 스테이징 DB의 Partner/Contract 테이블이 비어있음
3. Google Drive 미연동: 파일명만 기록하고 실제 파일 링크는 향후 설정
4. 금액 파싱: USD/VND/KRW 혼재, 월정액/건당/일시불 등 다양한 형태
