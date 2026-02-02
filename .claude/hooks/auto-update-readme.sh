#!/bin/bash

# Auto-update README Stop Hook
# Check if there are changes and suggest updating README

# Check if already in continue state (prevent infinite loop)
if [ "$stop_hook_active" = "true" ]; then
  printf '{"decision": "approve", "reason": "Hook already active, allowing stop"}'
  exit 0
fi

# Check for git changes
CHANGED_FILES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

if [ "$CHANGED_FILES" -eq 0 ]; then
  # No changes, allow stop
  printf '{"decision": "approve", "reason": "No changes detected"}'
  exit 0
fi

# Has changes, suggest Claude update README
printf '{"decision": "approve", "reason": "Detected %s file changes. Consider using /auto-update-readme skill to update README.md."}' "$CHANGED_FILES"

exit 0
