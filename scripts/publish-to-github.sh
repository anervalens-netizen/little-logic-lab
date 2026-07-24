#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-little-logic-lab}"
VISIBILITY="${2:---private}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required: https://cli.github.com/" >&2
  exit 1
fi

gh auth status
git status --short
git branch --show-current
gh repo create "$REPO_NAME" "$VISIBILITY" --source=. --remote=origin --push
