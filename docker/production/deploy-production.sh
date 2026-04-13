#!/usr/bin/env bash
# ============================================
# AMB Management - Production Deployment Script
# ============================================
# Usage:
#   ./deploy-production.sh              # 전체 배포 (pull + build + up)
#   ./deploy-production.sh build        # 빌드만
#   ./deploy-production.sh up           # 컨테이너 시작만
#   ./deploy-production.sh down         # 컨테이너 중지
#   ./deploy-production.sh restart      # 재시작 (down + up, 빌드 없이)
#   ./deploy-production.sh logs         # 로그 보기
#   ./deploy-production.sh status       # 상태 확인
#   ./deploy-production.sh rollback     # 이전 버전으로 롤백
#   ./deploy-production.sh cleanup      # 정리

set -euo pipefail

# ── 경로 설정 ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.production.yml"
ENV_FILE="$SCRIPT_DIR/.env.production"
BACKUP_TAG=""

# ── 색상 ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── 프로덕션 확인 프롬프트 ────────────────
confirm_production() {
  echo ""
  log_warn "⚠ 프로덕션 환경에 대한 작업입니다!"
  echo ""
  read -rp "정말 진행하시겠습니까? [y/N]: " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    log_info "취소되었습니다."
    exit 0
  fi
  echo ""
}

# ── 사전 검증 ─────────────────────────────
check_prerequisites() {
  if ! command -v docker &>/dev/null; then
    log_error "docker가 설치되어 있지 않습니다."
    exit 1
  fi

  if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    log_error "docker compose가 설치되어 있지 않습니다."
    exit 1
  fi

  if [ ! -f "$ENV_FILE" ]; then
    log_error ".env.production 파일이 없습니다."
    log_info "다음 명령으로 생성하세요:"
    echo "  cp $SCRIPT_DIR/.env.production.example $ENV_FILE"
    exit 1
  fi
}

# ── Docker Compose 래퍼 ───────────────────
dc() {
  if docker compose version &>/dev/null; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  fi
}

# ── Git Pull ──────────────────────────────
DEPLOY_BRANCH="production"

git_pull() {
  log_info "최신 코드를 가져옵니다..."
  cd "$PROJECT_ROOT"

  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]; then
    log_error "프로덕션 배포는 '$DEPLOY_BRANCH' 브랜치에서만 가능합니다. (현재: $CURRENT_BRANCH)"
    log_info "'git checkout $DEPLOY_BRANCH' 후 다시 시도하세요."
    exit 1
  fi

  BEFORE_COMMIT=$(git rev-parse --short HEAD)
  git pull origin "$DEPLOY_BRANCH"
  AFTER_COMMIT=$(git rev-parse --short HEAD)

  if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    log_info "변경사항 없음 ($BEFORE_COMMIT)"
  else
    log_ok "업데이트: $BEFORE_COMMIT → $AFTER_COMMIT"
    git log --oneline "$BEFORE_COMMIT".."$AFTER_COMMIT"
  fi
}

# ── 이미지 백업 (롤백용) ──────────────────
backup_images() {
  BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
  log_info "현재 이미지를 백업합니다... (tag: $BACKUP_TAG)"

  for SERVICE in amb-api-production amb-web-production; do
    IMAGE_ID=$(docker inspect --format='{{.Image}}' "$SERVICE" 2>/dev/null || true)
    if [ -n "$IMAGE_ID" ]; then
      docker tag "$IMAGE_ID" "$SERVICE:$BACKUP_TAG" 2>/dev/null || true
      log_ok "$SERVICE → $SERVICE:$BACKUP_TAG"
    fi
  done
}

# ── 빌드 ──────────────────────────────────
build() {
  log_info "Docker 이미지를 빌드합니다 (캐시 활용)..."
  dc build
  log_ok "빌드 완료"
}

# ── 컨테이너 시작 ─────────────────────────
up() {
  log_info "컨테이너를 시작합니다..."
  dc up -d
  log_ok "컨테이너 시작됨"
}

# ── 컨테이너 중지 ─────────────────────────
down() {
  log_info "컨테이너를 중지합니다..."
  dc down
  log_ok "컨테이너 중지됨"
}

# ── 헬스체크 ──────────────────────────────
health_check() {
  log_info "헬스체크를 수행합니다..."

  local MAX_RETRIES=30
  local RETRY_INTERVAL=2

  # PostgreSQL 대기
  log_info "PostgreSQL 대기 중..."
  for i in $(seq 1 $MAX_RETRIES); do
    if dc exec -T amb-postgres pg_isready -U amb_user &>/dev/null; then
      log_ok "PostgreSQL 정상"
      break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
      log_error "PostgreSQL 타임아웃"
      return 1
    fi
    sleep $RETRY_INTERVAL
  done

  # API 대기
  log_info "API 서버 대기 중..."
  for i in $(seq 1 $MAX_RETRIES); do
    if dc exec -T amb-web curl -sf http://amb-api:3019/api/v1/health &>/dev/null 2>&1 || \
       dc exec -T amb-web wget -q --spider http://amb-api:3019/api/v1 2>/dev/null; then
      log_ok "API 서버 정상"
      break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
      log_warn "API 헬스체크 타임아웃 (서버 로그를 확인하세요)"
      return 0
    fi
    sleep $RETRY_INTERVAL
  done

  # Web (Nginx) 확인
  if curl -sf http://localhost:8080 &>/dev/null; then
    log_ok "Web 서버 정상 (http://localhost:8080)"
  else
    log_warn "Web 서버 응답 없음 (포트 8080)"
  fi
}

# ── 상태 확인 ─────────────────────────────
status() {
  echo ""
  log_info "컨테이너 상태:"
  dc ps
  echo ""
  log_info "디스크 사용량:"
  docker system df 2>/dev/null | head -5
  echo ""
  log_info "Git 커밋:"
  cd "$PROJECT_ROOT"
  git log --oneline -3
}

# ── 로그 보기 ─────────────────────────────
logs() {
  local SERVICE="${1:-}"
  if [ -n "$SERVICE" ]; then
    dc logs -f --tail=100 "$SERVICE"
  else
    dc logs -f --tail=100
  fi
}

# ── 롤백 ──────────────────────────────────
rollback() {
  log_warn "프로덕션 롤백을 시작합니다..."
  confirm_production

  # 백업 이미지 확인
  local API_BACKUPS=$(docker images --format "{{.Tag}}" amb-api-production 2>/dev/null | grep "^backup-" | sort -r | head -5)
  local WEB_BACKUPS=$(docker images --format "{{.Tag}}" amb-web-production 2>/dev/null | grep "^backup-" | sort -r | head -5)

  if [ -z "$API_BACKUPS" ]; then
    log_error "백업 이미지가 없습니다. 롤백할 수 없습니다."
    log_info "대신 git 롤백을 시도하세요:"
    echo "  cd $PROJECT_ROOT && git log --oneline -5"
    echo "  git checkout <commit-hash>"
    echo "  $0 build && $0 up"
    exit 1
  fi

  echo ""
  log_info "사용 가능한 백업:"
  echo "$API_BACKUPS" | nl -ba
  echo ""
  read -rp "롤백할 번호를 선택하세요 (1=가장 최근): " CHOICE

  local SELECTED_TAG=$(echo "$API_BACKUPS" | sed -n "${CHOICE}p")
  if [ -z "$SELECTED_TAG" ]; then
    log_error "잘못된 선택입니다."
    exit 1
  fi

  log_info "롤백 대상: $SELECTED_TAG"
  down

  docker tag "amb-api-production:$SELECTED_TAG" "$(dc config --images | grep api | head -1):latest" 2>/dev/null || true
  docker tag "amb-web-production:$SELECTED_TAG" "$(dc config --images | grep web | head -1):latest" 2>/dev/null || true

  up
  health_check
  log_ok "롤백 완료: $SELECTED_TAG"
}

# ── 정리 (오래된 이미지 삭제) ─────────────
cleanup() {
  log_info "사용하지 않는 Docker 리소스를 정리합니다..."
  docker image prune -f
  log_ok "정리 완료"
}

# ── 전체 배포 ─────────────────────────────
deploy() {
  echo "============================================"
  echo "  AMB Management - Production Deployment"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "============================================"

  confirm_production

  check_prerequisites
  git_pull
  backup_images
  build
  down
  up
  health_check
  cleanup

  echo ""
  echo "============================================"
  log_ok "프로덕션 배포가 완료되었습니다!"
  echo "============================================"
  status
}

# ── 메인 ──────────────────────────────────
check_prerequisites

case "${1:-deploy}" in
  deploy)   deploy ;;
  build)    confirm_production; build ;;
  up)       confirm_production; up ;;
  down)     confirm_production; down ;;
  restart)  confirm_production; down; up; health_check ;;
  logs)     logs "${2:-}" ;;
  status)   status ;;
  rollback) rollback ;;
  cleanup)  cleanup ;;
  *)
    echo "Usage: $0 {deploy|build|up|down|restart|logs|status|rollback|cleanup}"
    echo ""
    echo "Commands:"
    echo "  deploy    전체 배포 (git pull + build + up) [기본값]"
    echo "  build     Docker 이미지 빌드만"
    echo "  up        컨테이너 시작"
    echo "  down      컨테이너 중지"
    echo "  restart   재시작 (빌드 없이)"
    echo "  logs      로그 보기 (logs [service])"
    echo "  status    상태 확인"
    echo "  rollback  이전 백업 이미지로 롤백"
    echo "  cleanup   미사용 Docker 리소스 정리"
    exit 1
    ;;
esac
