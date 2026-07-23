#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

DANGEROUS_PATTERNS=(
  "git push --force"
  "git push -f"
  "push --force"
  "git reset --hard"
  "reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

# Block bash-level writes to Claude config files (redirects and tee)
if echo "$COMMAND" | grep -qE '(>|>>|tee\s).*\.claude/(hooks|settings\.json|settings\.local\.json)'; then
  echo "BLOCKED: Writing to .claude config files via shell is not allowed. Ask the user to make this change manually." >&2
  exit 2
fi

exit 0
