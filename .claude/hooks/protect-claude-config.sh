#!/usr/bin/env bash

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

if echo "$FILE_PATH" | grep -qE '(^|/)\.claude/(hooks/|settings\.json$|settings\.local\.json$)'; then
  echo "BLOCKED: Modifications to .claude/hooks/ and .claude/settings*.json require the user to make the change manually." >&2
  exit 2
fi

exit 0
