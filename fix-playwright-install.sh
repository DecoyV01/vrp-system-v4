#!/bin/bash

# Playwright Browser Installation Fix Script
echo "🔧 Fixing Playwright browser installation..."

# Kill any hanging playwright processes
echo "🛑 Killing any hanging playwright processes..."
pkill -f playwright || true

# Clean up corrupted cache
echo "🧹 Cleaning browser cache..."
rm -rf ~/.cache/ms-playwright/chromium* || true

# Set better timeout values
echo "⏱️ Setting extended timeout values..."
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=120000
export PLAYWRIGHT_DOWNLOAD_PROGRESS_TIMEOUT=120000
export DEBUG=pw:install

# Try installation with timeout and force flag
echo "📥 Installing Chromium browser (with timeout protection)..."
timeout 300 npx playwright install chromium --force

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Chromium installation successful!"
    echo "🧪 Testing browser launch..."
    npx playwright --version
else
    echo "❌ Installation failed or timed out. Trying alternative approach..."
    
    # Alternative: Try with minimal output
    echo "🔄 Trying alternative installation method..."
    PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright timeout 180 npx playwright install chromium
    
    if [ $? -eq 0 ]; then
        echo "✅ Alternative installation successful!"
    else
        echo "❌ Both installation methods failed."
        echo "💡 Suggestions:"
        echo "   1. Check internet connection"
        echo "   2. Check if behind corporate firewall/proxy"
        echo "   3. Try running: export HTTP_PROXY=your-proxy-url"
        echo "   4. Check disk space: df -h"
    fi
fi

echo "🏁 Script complete!"
