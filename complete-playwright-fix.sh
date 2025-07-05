#!/bin/bash
echo "🔧 Complete Playwright browser fix..."

# 1. Clean everything
echo "🧹 Removing corrupted cache..."
rm -rf ~/.cache/ms-playwright
npm cache clean --force

# 2. Fresh install with better settings
echo "📥 Installing browsers with extended timeout..."
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=300000
export PLAYWRIGHT_DOWNLOAD_PROGRESS_TIMEOUT=300000

# 3. Install browsers
echo "⬇️ Installing Chromium browser..."
npx playwright install chromium --force

# 4. Verify installation
echo "✅ Verifying installation..."
if ls ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome 1> /dev/null 2>&1; then
    echo "✅ Chromium executable found!"
    npx playwright --version
    echo "🎉 Installation successful! You can now use Playwright."
else
    echo "❌ Installation failed - executable still missing"
    echo "📁 Cache directory contents:"
    ls -la ~/.cache/ms-playwright/
fi

echo "🏁 Fix script complete!"
