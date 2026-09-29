#!/bin/bash
# Blocks a short list of clearly destructive commands before they run.
# Deliberately narrow: false positives train people to stop trusting the
# hook, so this only catches patterns with no legitimate day-to-day use.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

block() {
  echo "Blocked: $1" >&2
  exit 2
}

case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf ."*|*"rm -rf .."*)
    block "rm -rf on a broad path — target a specific file or folder instead" ;;
  *"git push --force "*|*"git push -f "*)
    block "force push without --force-with-lease — use that instead if you're sure" ;;
  *"git reset --hard"*)
    block "git reset --hard discards uncommitted work — confirm with the user first" ;;
  *"git clean -fdx"*|*"git clean -xfd"*|*"git clean -fxd"*)
    block "git clean -fdx removes untracked AND ignored files (node_modules included) — confirm first" ;;
esac

exit 0
