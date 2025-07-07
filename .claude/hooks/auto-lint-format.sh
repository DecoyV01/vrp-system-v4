#!/bin/bash

# Auto-Linter & Formatter Hook for VRP System v4
# PostToolUse hook that runs ESLint --fix + Prettier after code changes

PROJECT_ROOT="/mnt/c/projects/vrp-system/v4"

# Read JSON input from stdin
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Only process code modification operations
if [[ ! "$tool_name" =~ ^(Write|Edit|MultiEdit)$ ]] || [[ ! "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
    exit 0
fi

# Skip non-code files (docs, configs, generated, tests)
if [[ "$file_path" =~ (docs/|node_modules/|_generated/|\.d\.ts$|test\.|spec\.) ]]; then
    exit 0
fi

# Convert to absolute path and verify file exists
[[ ! "$file_path" =~ ^/ ]] && file_path="$PROJECT_ROOT/$file_path"
[[ ! -f "$file_path" ]] && exit 0

# Determine file context and relative path
if [[ "$file_path" =~ $PROJECT_ROOT/frontend/ ]]; then
    cd "$PROJECT_ROOT/frontend" || exit 0
    relative_path=$(echo "$file_path" | sed "s|$PROJECT_ROOT/frontend/||")
    
    # Run ESLint --fix for frontend files
    if command -v npx >/dev/null 2>&1; then
        npx eslint --fix "$relative_path" >/dev/null 2>&1 && echo "✅ ESLint: Fixed $(basename "$file_path")" >&2
    fi
elif [[ "$file_path" =~ $PROJECT_ROOT/convex/ ]]; then
    cd "$PROJECT_ROOT" || exit 0
    relative_path=$(echo "$file_path" | sed "s|$PROJECT_ROOT/||")
else
    exit 0
fi

# Run Prettier formatting
if command -v npx >/dev/null 2>&1; then
    # Check if formatting needed, then apply
    if ! npx prettier --check "$relative_path" >/dev/null 2>&1; then
        npx prettier --write "$relative_path" >/dev/null 2>&1 && echo "✅ Prettier: Formatted $(basename "$file_path")" >&2
    fi
fi

exit 0