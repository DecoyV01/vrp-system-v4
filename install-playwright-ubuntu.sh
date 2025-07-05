#!/bin/bash

# Playwright Installation Script for Ubuntu (Claude Code)
# Navigate to VRP System v4 directory

echo "🎭 Installing Playwright browsers for VRP System v4..."
echo "📍 Current directory: $(pwd)"

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the v4 directory."
    exit 1
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Install system dependencies for Ubuntu
echo "🛠️ Installing system dependencies..."
npx playwright install-deps

# Verify installation
echo "✅ Verifying installation..."
npx playwright --version

echo "🎉 Playwright installation complete!"
echo "📁 Browsers installed to: ~/.cache/ms-playwright/"
echo ""
echo "You can now run your Playwright tests!"
