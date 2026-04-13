# REQ-PortalWebLogoChange-20260406
# Portal-Web 아메바 로고 교체 요구사항 분석서

## 1. 요구사항 요약

portal-web 앱 전체에서 사용 중인 **오렌지 3중 동심원 SVG 로고**를 새로운 **육각형 + 'ạ' 문자 SVG 로고**로 교체한다.

### 새 로고 SVG
```svg
<svg width="180" height="180" viewBox="0 0 300 300">
  <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
           fill="white" stroke="#666666" stroke-width="25" stroke-linejoin="round"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="150" font-weight="900"
        fill="#666666">ạ</text>
</svg>
```

---

## 2. AS-IS 현황 분석

### 2.1 로고 사용 위치 종합

| # | 파일 | 라인 | 유형 | 현재 로고 |
|---|------|------|------|-----------|
| 1 | `apps/portal-web/src/components/layout/CmsHeader.tsx` | L20-27, L114, L118 | 인라인 SVG 함수 `AmoebaLogo` | 오렌지(`#F97316`) 3중 동심원 |
| 2 | `apps/portal-web/src/components/layout/CmsFooter.tsx` | L13-20, L77 | 인라인 SVG 함수 `AmoebaLogo` | 동일 (CmsHeader 복사본) |
| 3 | `apps/portal-web/src/pages/portal/PortalLayout.tsx` | L54-57 | 텍스트 전용 | "Amoeba" 텍스트 링크 (SVG 없음) |
| 4 | `apps/portal-web/src/hooks/useSiteConfig.ts` | L7, L18 | Config 기본값 | `text: 'amoeba'` |
| 5 | `apps/portal-web/index.html` | L5 | favicon | 빈 data URI (`data:,`) |
| 6 | `apps/portal-web/public/amoeba-symbol.png` | — | 미사용 PNG | 코드 참조 없음 |

### 2.2 현재 로고 코드 (CmsHeader.tsx / CmsFooter.tsx 동일)

```tsx
function AmoebaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="20" r="18" fill="#F97316" opacity="0.15" />
      <circle cx="20" cy="20" r="12" fill="#F97316" opacity="0.3" />
      <circle cx="20" cy="20" r="7" fill="#F97316" />
    </svg>
  );
}
```

### 2.3 PortalLayout 텍스트 로고

```tsx
<Link to="/" className="text-xl font-bold text-primary-600">
  Amoeba
</Link>
```

- SVG 아이콘 없이 텍스트만 표시

---

## 3. TO-BE 요구사항

### 3.1 핵심 변경
- CmsHeader, CmsFooter의 `AmoebaLogo` 함수를 새 SVG(육각형 + 'ạ')로 교체
- PortalLayout에도 새 SVG 로고 아이콘 추가
- 색상: `#666666` (회색 테두리+문자), `white` (배경)

### 3.2 교체 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `CmsHeader.tsx` | `AmoebaLogo` 함수 SVG 교체 |
| `CmsFooter.tsx` | `AmoebaLogo` 함수 SVG 교체 |
| `PortalLayout.tsx` | "Amoeba" 텍스트 앞에 새 로고 SVG 아이콘 추가 |

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| CmsHeader 로고 | 오렌지 3중 원 SVG | 회색 육각형 + 'ạ' SVG | SVG 내용 교체 |
| CmsFooter 로고 | 오렌지 3중 원 SVG (복사본) | 회색 육각형 + 'ạ' SVG | SVG 내용 교체 |
| PortalLayout | 텍스트 전용 | SVG 아이콘 + 텍스트 | 아이콘 추가 |
| 색상 톤 | 오렌지 (#F97316) | 회색 (#666666) | 색상 변경 |

---

## 5. 사용자 플로우

변경 없음. 로고의 시각적 표현만 교체되며 동작(링크, 라우팅)은 기존과 동일.

---

## 6. 기술 제약사항

1. **viewBox 조정**: 새 SVG는 `viewBox="0 0 300 300"` → 기존 함수의 `size` prop과 호환되도록 width/height만 변경하면 됨
2. **font 렌더링**: 'ạ' 문자는 `font-family="Arial, sans-serif"` 사용, 대부분 브라우저에서 지원됨
3. **다크모드**: 현재 portal-web은 다크모드 미지원이므로 `fill="white"` 내부 배경 문제 없음
4. **성능**: 인라인 SVG로 외부 파일 로드 불필요, 기존과 동일 방식
