# PLAN-PortalWebLogoChange-작업계획-20260406
# Portal-Web 아메바 로고 교체 작업계획서

## 1. 시스템 개발 현황 분석

### 교체 대상 현황
- **CmsHeader.tsx** (L20-27): `AmoebaLogo` 함수 — 오렌지 3중 동심원 SVG, size prop 지원
- **CmsFooter.tsx** (L13-20): `AmoebaLogo` 함수 — 동일 패턴 복사본, 기본 size=24
- **PortalLayout.tsx** (L54-57): 텍스트 전용 "Amoeba" — 아이콘 없음

### 새 로고 사양
- 형태: 육각형(polygon) + 'ạ' 문자(text)
- 색상: 테두리/문자 `#666666`, 내부 `white`
- viewBox: `0 0 300 300`

---

## 2. 단계별 구현 계획

### Phase 1: AmoebaLogo 함수 교체 (CmsHeader + CmsFooter)

**작업 내용:**
1. `CmsHeader.tsx`의 `AmoebaLogo` 함수 SVG 내용을 새 육각형 로고로 교체
2. `CmsFooter.tsx`의 `AmoebaLogo` 함수 SVG 내용을 동일하게 교체
3. viewBox를 `0 0 300 300`으로 변경, width/height는 기존 `size` prop 유지

**변경 코드 패턴:**
```tsx
function AmoebaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size}>
      <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
        fill="white" stroke="#666666" strokeWidth="25" strokeLinejoin="round" />
      <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial, sans-serif" fontSize="150" fontWeight="900"
        fill="#666666">ạ</text>
    </svg>
  );
}
```

> **주의**: JSX에서 SVG 속성은 camelCase (`stroke-width` → `strokeWidth`, `stroke-linejoin` → `strokeLinejoin`, `dominant-baseline` → `dominantBaseline`, `text-anchor` → `textAnchor`, `font-family` → `fontFamily`, `font-size` → `fontSize`, `font-weight` → `fontWeight`)

### Phase 2: PortalLayout 로고 아이콘 추가

**작업 내용:**
1. `PortalLayout.tsx` 헤더의 "Amoeba" 텍스트 앞에 새 로고 SVG 아이콘 추가 (size=24)

---

## 3. 변경 대상 파일 목록

| 파일 | 유형 | 변경 내용 |
|------|------|-----------|
| `apps/portal-web/src/components/layout/CmsHeader.tsx` | 수정 | `AmoebaLogo` 함수 SVG 교체 |
| `apps/portal-web/src/components/layout/CmsFooter.tsx` | 수정 | `AmoebaLogo` 함수 SVG 교체 |
| `apps/portal-web/src/pages/portal/PortalLayout.tsx` | 수정 | 텍스트 앞에 로고 아이콘 추가 |

---

## 4. 사이드 임팩트 분석

| 영향 | 상세 | 위험도 |
|------|------|--------|
| CMS 헤더 로고 | AmoebaLogo 함수만 교체, 사용처 동일 | 낮음 |
| CMS 푸터 로고 | AmoebaLogo 함수만 교체, 사용처 동일 | 낮음 |
| 포털 레이아웃 | SVG 아이콘 추가, 기존 텍스트 유지 | 낮음 |
| 랜딩 페이지 | CmsHeader/CmsFooter 사용 → 자동 반영 | 낮음 |
| 다크모드 | portal-web 미지원 → 영향 없음 | 없음 |
| 사이트 설정 imageUrl | 미사용 필드, 변경 불필요 | 없음 |

---

## 5. DB 마이그레이션

없음. 프론트엔드 UI 변경만 포함.
