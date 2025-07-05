#!/bin/bash

echo "🔍 UAT Failure - Collecting debug information..."

FAILURE_ID=$(date +%Y%m%d-%H%M%S)
DEBUG_DIR="/mnt/c/projects/vrp-system/v4/uat/debug/$FAILURE_ID"

mkdir -p $DEBUG_DIR

# Take failure screenshot
powershell.exe -File /mnt/c/projects/vrp-system/v4/uat/uat-recorder.ps1 \
    -action screenshot -filename "failure" -testName "debug-$FAILURE_ID"

# Collect browser console logs (if available)
echo "Attempting to collect browser logs..."

# Create debug summary
cat > $DEBUG_DIR/summary.md << EOF
# UAT Failure Debug Report

## Failure Information
- ID: $FAILURE_ID
- Time: $(date)
- Last Command: $CLAUDE_LAST_COMMAND

## Environment
- Node Version: $(node --version)
- NPM Version: $(npm --version)
- Working Directory: $(pwd)

## Application State
Check the screenshot and logs for more details.
EOF

echo "📁 Debug information saved to: $DEBUG_DIR"

# Trigger bug fix workflow if configured
if [ -n "$UAT_AUTO_FIX" ]; then
    echo "🔧 Triggering automatic bug fix workflow..."
    # This could trigger a Claude Code command to analyze and fix the issue
fi