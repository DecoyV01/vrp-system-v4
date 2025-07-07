# Browser MCP Setup Instructions

## Quick Start for Real Browser Automation

### 1. Open New Terminal
The current terminal session doesn't have Browser MCP connected. You need to:

```bash
# Open a new terminal window/tab
# Navigate to the project directory
cd /mnt/c/projects/vrp-system/v4/uat

# Verify Browser MCP is available
# (Claude will have access to Browser MCP tools in the new session)
```

### 2. Run UAT Tests with Real Browser MCP

Once Browser MCP is connected in the new terminal, run:

```bash
# Test project CRUD with REAL browser automation
node uat-test-runner.cjs crud project create --debug

# This will now use actual Browser MCP tools:
# - Browser MCP navigate
# - Browser MCP click  
# - Browser MCP fill
# - Browser MCP screenshot
```

### 3. Expected Real Browser Behavior

With Browser MCP connected, you'll see:
- ✅ **Real browser window** opening automatically
- ✅ **Actual navigation** to https://vrp-system-v4.pages.dev
- ✅ **Real screenshots** saved to `/mnt/c/projects/vrp-system/v4/uat/screenshots/`
- ✅ **True form interactions** on the live application
- ✅ **Actual DOM element detection** and validation

### 4. Screenshot Verification

Check for real screenshots:
```bash
ls -la /mnt/c/projects/vrp-system/v4/uat/screenshots/
# Should show actual PNG files with timestamps
```

### 5. Complete CRUD Testing

Run the full suite:
```bash
# CREATE
node uat-test-runner.cjs crud project create --debug

# READ  
node uat-test-runner.cjs crud project read --debug

# UPDATE
node uat-test-runner.cjs crud project update --debug

# DELETE
node uat-test-runner.cjs crud project delete --debug

# Generate comprehensive report
node uat-test-runner.cjs report
```

## Notes

- Browser MCP must be connected in the terminal session for real automation
- Screenshots will be saved as actual PNG files in the screenshots directory
- The system targets the live Cloudflare deployment: https://vrp-system-v4.pages.dev
- All tests will create/modify real data in the production Convex backend
- Uses Browser MCP tools directly - NO Playwright dependencies

Ready for real end-to-end testing! 🚀