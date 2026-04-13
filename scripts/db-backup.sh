#!/bin/bash
# PostgreSQL 자동 백업 스크립트
# 사용: crontab -e → 0 2 * * * /path/to/scripts/db-backup.sh
#
# 환경변수 또는 Docker 사용 시:
#   BACKUP_DIR: 백업 저장 경로 (기본: ~/db-backups)
#   DB_CONTAINER: PostgreSQL 컨테이너 이름
#   RETENTION_DAYS: 백업 보관일 (기본: 30)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/db-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 환경에 따라 컨테이너 이름 자동 결정
if [ -n "${DB_CONTAINER:-}" ]; then
  CONTAINER="$DB_CONTAINER"
elif docker ps --format '{{.Names}}' | grep -q 'amb-postgres-production'; then
  CONTAINER="amb-postgres-production"
elif docker ps --format '{{.Names}}' | grep -q 'amb-postgres-staging'; then
  CONTAINER="amb-postgres-staging"
else
  echo "[ERROR] No PostgreSQL container found" >&2
  exit 1
fi

# 컨테이너에서 DB 접속 정보 추출
DB_USER=$(docker exec "$CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo "postgres")
DB_NAME=$(docker exec "$CONTAINER" printenv POSTGRES_DB 2>/dev/null || echo "ambmanagement")

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup: $CONTAINER → $BACKUP_FILE"

# pg_dump + gzip 압축
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"

# 백업 파일 검증 (최소 1KB)
FILESIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ "$FILESIZE" -lt 1024 ]; then
  echo "[ERROR] Backup file too small ($FILESIZE bytes), possibly failed" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Backup complete: $(du -h "$BACKUP_FILE" | cut -f1)"

# 오래된 백업 삭제
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up $DELETED old backup(s) (older than ${RETENTION_DAYS} days)"
fi

echo "[$(date)] Done"
