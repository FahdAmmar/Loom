#!/bin/bash
# Formats the file Claude just edited or wrote, using the project's own
# Prettier config (includes prettier-plugin-tailwindcss for class sorting).
# Silent on success; a file Prettier doesn't know how to format is skipped.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -n "$FILE_PATH" ]; then
  npx prettier --write --ignore-unknown "$FILE_PATH" 2>/dev/null
fi

exit 0
