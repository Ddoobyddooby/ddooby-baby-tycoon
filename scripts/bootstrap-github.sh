#!/usr/bin/env bash
# GitHub 라벨 · 마일스톤 · 이슈를 WBS(scripts/wbs.tsv) 기준으로 한 번에 만든다.
# 준비: GitHub CLI 설치 후 `gh auth login`, 레포 루트에서 실행.
# 사용: ./scripts/bootstrap-github.sh
set -euo pipefail

command -v gh >/dev/null || { echo "gh CLI 가 필요해: https://cli.github.com"; exit 1; }
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "▶ 대상 레포: $REPO"

echo "▶ 라벨"
while IFS='|' read -r name color; do
  gh label create "$name" --color "$color" --force >/dev/null
  echo "  $name"
done << 'LABELS'
type:feat|1D76DB
type:bug|D73A4A
type:chore|C5DEF5
type:docs|0E8A16
area:engine|5319E7
area:ui|FBCA04
area:balance|F9A825
backlog|EDEDED
LABELS

echo "▶ 마일스톤"
while IFS='|' read -r title due; do
  if gh api "repos/$REPO/milestones?state=all" -q ".[].title" | grep -qx "$title"; then
    echo "  (있음) $title"
  else
    gh api "repos/$REPO/milestones" -f title="$title" -f due_on="${due}T23:59:59Z" >/dev/null
    echo "  $title"
  fi
done << 'MILESTONES'
M0 준비|2026-10-11
M1 코어 루프|2026-10-18
M2 경제|2026-10-25
M3 손맛|2026-11-01
M4 출시|2026-11-08
MILESTONES

echo "▶ 이슈"
tail -n +2 scripts/wbs.tsv | while IFS=$'\t' read -r id milestone title estimate labels; do
  full="[$id] $title"
  if gh issue list --state all --search "in:title \"[$id]\"" --json title -q '.[].title' | grep -qF "$full"; then
    echo "  (있음) $full"
    continue
  fi
  gh issue create \
    --title "$full" \
    --milestone "$milestone" \
    --label "$labels" \
    --body "WBS $id · 예상 $estimate · 상세는 docs/02-wbs.md" >/dev/null
  echo "  $full"
done

echo "✅ 완료"
