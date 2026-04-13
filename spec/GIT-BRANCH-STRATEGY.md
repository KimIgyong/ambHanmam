# Git 브랜치 전략 가이드

**최종 수정**: 2026-04-14

---

## 1. 브랜치 구조

```
production ─────────────────────────────────────── 프로덕션 배포 (hm-amb.hanmam.kr)
  │
  └── main ─────────────────────────── 스테이징 배포 (hm-stg.hanmam.kr)
        │
        ├── feature/이슈관리-칸반 ──── 기능 개발
        ├── feature/회의록-개선 ────── 기능 개발
        ├── fix/이슈-400에러 ────────── 버그 수정
        └── hotfix/긴급수정 ────────── 프로덕션 긴급 패치
```

## 2. 브랜치 역할

| 브랜치 | 용도 | 배포 대상 | 보호 정책 |
|--------|------|----------|-----------|
| `production` | 프로덕션 배포 전용 | hm-amb.hanmam.kr | PR 필수, 1명 이상 승인 |
| `main` | 통합 개발 (스테이징) | hm-stg.hanmam.kr | PR 필수 |
| `feature/*` | 기능 개발 | 로컬 | - |
| `fix/*` | 버그 수정 | 로컬 | - |
| `hotfix/*` | 프로덕션 긴급 수정 | production → main | - |
| `refactor/*` | 리팩토링 | 로컬 | - |
| `docs/*` | 문서 작업 | 로컬 | - |

## 3. 브랜치 네이밍 규칙

```bash
feature/{기능명}       # 새 기능      예: feature/이슈관리-칸반
fix/{버그명}           # 버그 수정    예: fix/이슈-patch-400에러
hotfix/{긴급수정명}    # 긴급 패치    예: hotfix/로그인-장애
refactor/{대상}        # 리팩토링    예: refactor/권한-체계
docs/{문서명}          # 문서        예: docs/api-가이드
```

**규칙**:
- 한글 또는 영어 사용 가능
- 소문자 + 하이픈(-) 구분
- 간결하고 명확하게

## 4. 개발 흐름

### 4.1 일반 기능 개발

```bash
# 1) main에서 feature 브랜치 생성
git checkout main
git pull origin main
git checkout -b feature/이슈관리-칸반

# 2) 개발 & 커밋
git add <files>
git commit -m "feat: 칸반 뷰 컴포넌트 구현"

# 3) 원격에 push
git push origin feature/이슈관리-칸반

# 4) GitHub에서 PR 생성 (feature → main)
#    - 리뷰어 지정
#    - 리뷰 승인 후 머지

# 5) 스테이징 배포 (자동 또는 수동)
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh"

# 6) 스테이징 QA 통과 후 PR 생성 (main → production)
#    - 프로덕션 배포
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"
```

### 4.2 버그 수정

```bash
git checkout main
git pull origin main
git checkout -b fix/이슈-patch-400에러

# 수정 후 PR → main
```

### 4.3 프로덕션 긴급 수정 (Hotfix)

```bash
# 1) production에서 hotfix 브랜치 생성
git checkout production
git pull origin production
git checkout -b hotfix/로그인-장애

# 2) 수정 & 커밋
git commit -m "hotfix: 로그인 세션 만료 처리"

# 3) PR → production (긴급 머지)
# 4) 프로덕션 즉시 배포
# 5) PR → main (역머지, 코드 동기화)
```

## 5. 배포 연동

### 환경별 배포 브랜치

| 환경 | 배포 브랜치 | 스크립트 |
|------|-----------|---------|
| **개발** | 로컬 (어느 브랜치든) | `bash docker/dev/deploy-dev.sh` |
| **스테이징** | `main` | `bash docker/staging/deploy-staging.sh` |
| **프로덕션** | `production` | `bash docker/production/deploy-production.sh` |

### 배포 순서

```
feature/fix 브랜치 → PR → main (머지)
                            ↓
                     스테이징 배포 & QA
                            ↓
                  main → PR → production (머지)
                            ↓
                     프로덕션 배포
```

## 6. 커밋 메시지 규칙

```
<타입>: <설명>

타입:
  feat:     새 기능
  fix:      버그 수정
  hotfix:   프로덕션 긴급 수정
  refactor: 리팩토링
  docs:     문서
  style:    코드 스타일 (기능 변경 없음)
  test:     테스트
  chore:    빌드/설정 변경
```

**예시**:
```
feat: 이슈관리 칸반 뷰 구현
fix: 이슈 PATCH 400 에러 수정 - UpdateIssueRequest에 type 필드 추가
hotfix: 로그인 세션 만료 시 무한 루프 수정
refactor: 권한 체계 GROUP→LEVEL 리네이밍
```

## 7. PR 규칙

### 필수 사항
- **제목**: 커밋 메시지 규칙과 동일 (`feat:`, `fix:` 등)
- **설명**: PR 템플릿 작성 (변경 요약, 테스트 방법)
- **리뷰**: 최소 1명 승인 필요
- **빌드**: `npm run build` 통과 확인

### main → production PR
- 스테이징 QA 결과 명시
- 변경된 기능 목록 정리
- 롤백 계획 명시

## 8. GitHub Branch Protection 설정

### main 브랜치
- [x] Require a pull request before merging
- [x] Require approvals (1명)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [ ] Require status checks to pass (CI 구성 후 활성화)

### production 브랜치
- [x] Require a pull request before merging
- [x] Require approvals (1명)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Restrict who can push (관리자만)

## 9. 자주 묻는 질문

### Q: feature 브랜치에서 main의 최신 변경을 가져오려면?
```bash
git checkout feature/내-기능
git rebase main
# 충돌 해결 후
git rebase --continue
```

### Q: 잘못된 브랜치에 커밋했으면?
```bash
# 마지막 커밋을 되돌리고 (코드는 유지)
git reset --soft HEAD~1
# 올바른 브랜치로 이동
git checkout -b feature/올바른-브랜치
git commit -m "원래 메시지"
```

### Q: PR 충돌이 발생하면?
```bash
git checkout feature/내-기능
git fetch origin
git rebase origin/main
# 충돌 해결
git push --force-with-lease origin feature/내-기능
```
