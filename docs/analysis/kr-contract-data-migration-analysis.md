# 한국법인(KR01) 계약 데이터 마이그레이션 분석

**작업일**: 2026-02-18
**원본 파일**: `reference/Amoeba Korea_계약 관리 - Contract Management.xlsx`

---

## 1. Excel 파일 구조

| 시트 | 행수 | 열수 | 설명 |
|------|------|------|------|
| Client | 31 | 30 | 매출(RECEIVABLE) 계약 |
| Outsourcing | 24 | 28 | 매입(PAYABLE) 계약 |
| 총무 | 24 | 26 | 총무 계약 (1건만 데이터) |
| SOW | 1003 | 29 | SOW/작업지시서 (별도 관리) |
| 세금계산서 발행 | 85 | 27 | 세금계산서 (별도 관리) |
| 진행중_Need check | 21 | 24 | 진행중 건 (데이터 없음) |

---

## 2. Client 시트 분석 (RECEIVABLE)

### 헤더 구조 (Row 3)
| 열 | 필드 |
|----|------|
| B | 체결일 (Contract date) |
| C | 계약 기간 (Agreement Period) |
| D | 계약체결대상 (Contract party) |
| E | Detail |
| F | 계약서 상태 (Contract Status) |
| G | 선금 (1st payment/Deposit) |
| H | 잔금 (2nd payment) |
| I | 3차 (3rd payment) |
| J | 총 용역대금 (Total service fee) |
| K | 계약서 사본 (Copy of Contract) |
| L | Invoice |
| N | 인수인계 확인서 (Acceptance Minutes) |
| O | Note |

### 카테고리별 계약 목록

#### Tech BPO (1건)
| 업체 | 내용 | 기간 | 금액 | 상태 |
|------|------|------|------|------|
| amoeba co.,ltd (VN) | Happy Talk Basic Contract | 2025.08~2026.07 | 3,000 USD/월 | 체결 완료 |

#### SI 개발/Dev (5건)
| 업체 | 내용 | 기간 | 금액 | 상태 |
|------|------|------|------|------|
| 주식회사 일상의감동 | 링크맘 API 구축 | 2023.11~2024.03 | 36,000,000 원 | 체결 완료 |
| Red Beauty | Arria Online Brand site | 2025.04~2025.06 | 10,875 USD | 체결 완료 |
| IVY ENTERPRISE | Etleé Online Brand site | 2025.08~2025.10 | 9,700 USD | 체결 완료 |
| IVY ENTERPRISE | RoundTable Survey Plugin 변경 | 2025.10.28 (단건) | 1,500 USD | 체결 완료 |
| IVY ENTERPRISE | Shopify 회원 연동 (Roundtable) | 2025.11.11 (단건) | 2,375 USD | 체결 완료 |

#### 유지보수/Maintenance (5건)
| 업체 | 내용 | 기간 | 금액 | 상태 |
|------|------|------|------|------|
| (주) 가비아씨엔에스 | API 서버 유지보수 | 2024.07~2024.12 | 5,000,000 원/월 | 체결 완료 |
| 주식회사 일상의감동 | 링크맘 유지보수 (2024) | 2024.05~2025.04 | 2,300,000 원/월 | 체결 완료 |
| (주) 위사 | 위사 API 서버 유지보수 | 2023.12~2024.11 | 4,500,000 원/월 | 체결 완료 |
| 주식회사 일상의감동 | 링크맘 유지보수 (2025) | 2025.05~2026.04 | 1,125,000 원/월 | 체결 완료 |
| IVY ENTERPRISE | RoundTable 연간 유지보수 | 2025.11.03~ | 5,000 USD | 체결 완료 |

#### AMB Talk (1건)
| 업체 | 내용 | 기간 | 금액 | 상태 |
|------|------|------|------|------|
| Serveone | Amoeba Talk service | 2024.08~2025.01 | 500 USD | 체결 완료 |

**Client 합계: 12건**

---

## 3. Outsourcing 시트 분석 (PAYABLE)

### 헤더 구조 (Row 3)
| 열 | 필드 |
|----|------|
| B | 계약 번호 (Contract document no.) |
| C | 체결일 |
| D | 계약 기간 |
| E | 계약체결대상 |
| F | Detail |
| G | 계약서 상태 |
| H | 선금 (1st payment) |
| I | 잔금 (2nd payment) |
| J | 총 용역대금 |
| K | 계약서 사본 |
| O | Note |

### 계약 목록 (6건)

| 업체 | 내용 | 기간 | 금액 | 비고 |
|------|------|------|------|------|
| Creative Lab | 업무대행 기본계약서(SOW) | 2024.08~2025.01 | 9,000 USD | VN 계약서 보관 |
| Tech Fashion | Amoeba Diary App 개발 | 2024.06~2024.07 | 2,812 USD | VN 계약서 보관 |
| amoeba co.,ltd | 업무대행 기본계약서(SOW) | 2024.03~(1년) | 55,000 USD* | 5회 SOW 결제 |
| amoeba co.,ltd | 아메바샵 업그레이드 | 2023.12~2024.03 | 34,500 USD | - |
| amoeba co.,ltd | amoeba Talk 개발 | 2023.11~2024.03 | 35,000 USD | - |
| Brand New K | 광고홍보 콘텐츠 기획 및 제작 | 2024.11~2025.01 | 120,000,000 VND | VN 계약서 보관 |

*SOW 결제 내역: 30,000 + 10,000 + 7,000 + 5,000 + 3,000 = 55,000 USD

---

## 4. 총무 시트 분석

### 유효 데이터 (1건)

| 업체 | 내용 | 일자 | 금액 |
|------|------|------|------|
| ADAM ASSOCIATION | Consulting services (capital contribution transfer) | 2023.11.14 | 2,500 USD |

나머지 행은 빈 데이터.

---

## 5. 현재 시스템 상태

### 기존 KR01 파트너 (13개)
| 코드 | 업체명 | 유형 |
|------|--------|------|
| AMBVN | amoeba co.,ltd | PARTNER |
| BNK | Brand New K | OUTSOURCING |
| CRL | Creative Lab | OUTSOURCING |
| DYC | Dayu Cosmetic | CLIENT |
| ERM | Ermore Inc. (일상의감동) | CLIENT |
| GNS | GNS Co., Ltd | CLIENT |
| HYJ | Hanyang Confectionery | CLIENT |
| IVY | IVY Enterprise, INC | CLIENT |
| MJC | Mijin Cosmetics Co., Ltd | CLIENT |
| NST | Neast Co., Ltd | CLIENT |
| RDB | Red Beauty | CLIENT |
| SVN | Serveone | CLIENT |
| TFN | Tech Fashion | OUTSOURCING |

### 누락 파트너 (추가 필요)
| 코드 | 업체명 | 유형 | 이유 |
|------|--------|------|------|
| GBC | (주) 가비아씨엔에스 | CLIENT | 유지보수 계약 존재 |
| WSA | (주) 위사 | CLIENT | 유지보수 계약 존재 |
| ADM | ADAM ASSOCIATION | GENERAL_AFFAIRS | 총무 계약 존재 |

### KR01 기존 계약: 0건

---

## 6. 데이터 매핑 전략

### 상태 매핑
| 조건 | 시스템 상태 |
|------|-----------|
| 기간 종료 + SI/프로젝트 계약 | LIQUIDATED |
| 기간 종료 + 유지보수/월정액 | EXPIRED |
| 현재 진행 중 | ACTIVE |

### 카테고리 매핑
| Excel 분류 | 시스템 카테고리 |
|------------|---------------|
| Tech BPO | TECH_BPO |
| SI 개발/Dev | SI_DEV |
| 유지보수/Maintenance | MAINTENANCE |
| AMB Talk | OTHER |
| 광고홍보 | MARKETING |
| 총무 Consulting | OTHER |

### 계약 유형 매핑
| 계약 형태 | ctr_type |
|----------|----------|
| 월정액 유지보수 | SERVICE |
| 프로젝트 개발 | PROJECT |
| BPO/업무대행 | SERVICE |

---

## 7. 마이그레이션 범위

| 항목 | 포함 | 비고 |
|------|------|------|
| Client 계약 | O | 12건 |
| Outsourcing 계약 | O | 6건 |
| 총무 계약 | O | 1건 |
| SOW 데이터 | X | 계약 ID 연결 후 별도 입력 |
| 세금계산서 | X | 별도 시스템 |
| 진행중 건 | X | 데이터 없음 |

**총 마이그레이션 대상: 19건 (RECEIVABLE 12 + PAYABLE 6 + 총무 1)**
