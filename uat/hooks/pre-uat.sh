#!/bin/bash

echo "🚀 Preparing UAT environment..."

# Clean previous screenshots
/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh clean

# Ensure directories exist
mkdir -p /mnt/c/projects/vrp-system/v4/uat/screenshots
mkdir -p /mnt/c/projects/vrp-system/v4/uat/reports
mkdir -p /mnt/c/projects/vrp-system/v4/uat/videos

# Check if app is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "⚠️  Warning: App not running on localhost:5173"
    echo "Starting development server..."
    cd /mnt/c/projects/vrp-system/v4/frontend
    npm run dev &
    sleep 5
fi

# Set test timestamp
export UAT_SESSION_ID=$(date +%Y%m%d-%H%M%S)
echo "Session ID: $UAT_SESSION_ID"

echo "✅ UAT environment ready"