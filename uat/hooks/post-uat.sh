#!/bin/bash

echo "📊 Post-UAT processing..."

SESSION_ID=${UAT_SESSION_ID:-$(date +%Y%m%d-%H%M%S)}

# Generate video from screenshots
if ls /mnt/c/projects/vrp-system/v4/uat/screenshots/*.png 1> /dev/null 2>&1; then
    echo "Creating test video..."
    /mnt/c/projects/vrp-system/v4/uat/uat-helper.sh video $SESSION_ID
fi

# Generate summary report
REPORT_FILE="/mnt/c/projects/vrp-system/v4/uat/reports/report-$SESSION_ID.md"

cat > $REPORT_FILE << EOF
# UAT Test Report - $SESSION_ID

## Summary
- Session ID: $SESSION_ID
- Date: $(date)
- Screenshots: $(ls -1 /mnt/c/projects/vrp-system/v4/uat/screenshots/*.png 2>/dev/null | wc -l)

## Test Results
EOF

# Add test results (this would be populated by the actual tests)
if [ -f "/tmp/uat-results-$SESSION_ID.json" ]; then
    cat /tmp/uat-results-$SESSION_ID.json >> $REPORT_FILE
fi

echo "✅ Report generated: $REPORT_FILE"

# Optional: Open report in browser
# cmd.exe /c start $(wslpath -w $REPORT_FILE)