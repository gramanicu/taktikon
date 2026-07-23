#!/usr/bin/env bash
#
# Defense-in-depth: even though GH_TOKEN is scoped to gramanicu/taktikon, reject any gh
# command that explicitly targets a DIFFERENT repository via -R/--repo. The scoped token
# would 404 anyway; this just turns that into a clear, early refusal.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

ALLOWED_REPO="gramanicu/taktikon"

# Only inspect gh commands.
if ! echo "$COMMAND" | grep -qE '(^|[;&| ])gh '; then
  exit 0
fi

# Extract an explicit repo argument, if present: -R <repo> or --repo <repo> (or =).
REPO_ARG=$(echo "$COMMAND" | grep -oE '(-R|--repo)[= ]+[^ ]+' | head -n1 | sed -E 's/(-R|--repo)[= ]+//')

if [ -n "$REPO_ARG" ] && [ "$REPO_ARG" != "$ALLOWED_REPO" ]; then
  echo "BLOCKED: gh command targets '$REPO_ARG'. This project's automation is restricted to $ALLOWED_REPO." >&2
  exit 2
fi

exit 0
