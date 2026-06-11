#!/usr/bin/env bash
# Basic upstream watcher for superpowers (no API/LLM).
# - Detects changes to the paths we forked from / reference (.tracked).
# - Detects newly added skill folders.
# Writes a human-readable report to $REPORT_FILE and sets CHANGES=true in
# $GITHUB_OUTPUT when there is anything to report. Updates the manifest in place.
set -euo pipefail

MAN=.github/superpowers-watch.json
REPORT_FILE="${REPORT_FILE:-/tmp/superpowers-report.md}"
REPO=$(jq -r .repo "$MAN")

rm -rf .sp-clone
git clone --depth 1 "https://github.com/$REPO" .sp-clone >/dev/null 2>&1

changes=""

# 1. Tracked paths (files or directories): compare tree/blob SHA.
for path in $(jq -r '.tracked | keys[]' "$MAN"); do
  cur=$(git -C .sp-clone rev-parse "HEAD:$path" 2>/dev/null || echo MISSING)
  old=$(jq -r --arg p "$path" '.tracked[$p]' "$MAN")
  if [ -n "$old" ] && [ "$old" != "null" ] && [ "$cur" != "$old" ]; then
    if [ "$cur" = "MISSING" ]; then
      changes+="- **removed upstream**: \`$path\` (we derive from this — check our copy)"$'\n'
    else
      changes+="- **changed**: \`$path\` (\`$old\` → \`$cur\`)"$'\n'
    fi
  fi
  tmp=$(mktemp); jq --arg p "$path" --arg s "$cur" '.tracked[$p]=$s' "$MAN" >"$tmp" && mv "$tmp" "$MAN"
done

# 2. New skill folders.
mapfile -t cur_skills < <(git -C .sp-clone ls-tree --name-only HEAD skills/ 2>/dev/null | sed 's#skills/##' | sort)
old_skills=$(jq -r '.known_skills[]?' "$MAN" | sort)
if [ -n "$old_skills" ]; then
  while IFS= read -r s; do
    [ -n "$s" ] && changes+="- **new skill**: \`skills/$s\`"$'\n'
  done < <(comm -13 <(printf '%s\n' "$old_skills") <(printf '%s\n' "${cur_skills[@]}"))
fi
ks_json=$(printf '%s\n' "${cur_skills[@]}" | jq -R . | jq -s .)
tmp=$(mktemp); jq --argjson ks "$ks_json" '.known_skills=$ks' "$MAN" >"$tmp" && mv "$tmp" "$MAN"

rm -rf .sp-clone

if [ -n "$changes" ]; then
  {
    echo "Upstream **$REPO** changed in paths we fork from or reference. Review each for relevance to our pipeline, then update our adapted copies if needed."
    echo
    echo "$changes"
    echo "_Our derived files: agents in \`r-science/agents/\` (subagent-driven-development), \`/whiteboard\` (brainstorming), the persuasion-tightened skills, and the Tier-1 references in implement/verify._"
  } >"$REPORT_FILE"
  echo "CHANGES=true" >>"${GITHUB_OUTPUT:-/dev/stdout}"
else
  echo "CHANGES=false" >>"${GITHUB_OUTPUT:-/dev/stdout}"
fi
