#!/usr/bin/env bash
set -euo pipefail

OWNER="${OWNER:-KimIgyong}"
REPO="${REPO:-ambManagement}"

if [[ $# -ge 1 ]]; then
  OWNER="$1"
fi
if [[ $# -ge 2 ]]; then
  REPO="$2"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "[FAIL] gh CLI is not installed"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "[FAIL] gh auth is not configured"
  echo "       Run: gh auth login"
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "[PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "[FAIL] $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

check_branch() {
  local branch="$1"

  local protected
  if ! protected="$(gh api "repos/${OWNER}/${REPO}/branches/${branch}" --jq '.protected' 2>/dev/null)"; then
    fail "${branch}: branch not found or API error"
    return
  fi

  if [[ "$protected" == "true" ]]; then
    pass "${branch}: protected=true"
  else
    fail "${branch}: protected=false"
  fi

  local approvals
  if ! approvals="$(gh api "repos/${OWNER}/${REPO}/branches/${branch}/protection" --jq '.required_pull_request_reviews.required_approving_review_count // 0' 2>/dev/null)"; then
    fail "${branch}: cannot read classic branch protection"
    return
  fi

  if [[ "$approvals" =~ ^[0-9]+$ ]] && (( approvals >= 1 )); then
    pass "${branch}: required_approving_review_count=${approvals}"
  else
    fail "${branch}: required_approving_review_count=${approvals} (< 1)"
  fi
}

echo "Checking branch protections for ${OWNER}/${REPO}"
echo "---------------------------------------------"

check_branch "main"
check_branch "production"

echo "---------------------------------------------"
echo "PASS: ${PASS_COUNT}, FAIL: ${FAIL_COUNT}"

if (( FAIL_COUNT == 0 )); then
  echo "RESULT: PASS"
  exit 0
fi

echo "RESULT: FAIL"
exit 1
