# IMPORTANT: Use the UAT Framework - DO NOT use Browser MCP directly!

## 🛑 STOP! Read This First

This project has a **comprehensive UAT testing framework** that MUST be used for all testing. Do NOT use Browser MCP tools directly.

## ✅ Correct UAT Testing Approach

### 1. First, Read the UAT Framework Documentation
```bash
# Navigate to UAT directory
cd /mnt/c/projects/vrp-system/v4/uat

# Read the framework guide
cat CLAUDE.md
```

### 2. Use the UAT Test Runner
```bash
# Run UAT tests with the framework
node uat-test-runner.cjs crud project create --debug

# This will:
# - Use the multi-step test scenarios
# - Execute through action processors
# - Capture real screenshots via Browser MCP
# - Generate comprehensive test reports
```

### 3. Available UAT Commands
```bash
# Initialize UAT environment
node uat-test-runner.cjs init

# Run CRUD tests
node uat-test-runner.cjs crud project create
node uat-test-runner.cjs crud project read
node uat-test-runner.cjs crud project update
node uat-test-runner.cjs crud project delete

# Run login flow
node uat-test-runner.cjs login-flow

# Generate test report
node uat-test-runner.cjs report
```

## ❌ What NOT to Do

Do NOT directly call:
- `mcp__playwright__playwright_navigate`
- `mcp__playwright__playwright_click`
- `mcp__playwright__playwright_screenshot`

These are wrapped by the UAT framework for proper test orchestration.

## 📋 UAT Framework Features

1. **Multi-Step Test Scenarios** - Located in `scenarios/` directory
2. **Action Processors** - Handle all browser interactions
3. **Validation Framework** - Injected into browser for assertions
4. **Health Check System** - Monitors application state
5. **Screenshot Management** - Automatic capture and organization
6. **Test Reports** - Comprehensive JSON and markdown reports

## 🚀 Quick Start

```bash
cd /mnt/c/projects/vrp-system/v4/uat
node uat-test-runner.cjs crud project create --debug
```

This will run a complete project creation test with:
- Navigation to https://vrp-system-v4.pages.dev
- Login flow
- Project creation form filling
- Validation of created project
- Screenshots at each step
- Comprehensive test report

## 📖 Required Reading

Before running ANY tests, read:
1. `/mnt/c/projects/vrp-system/v4/uat/CLAUDE.md` - Complete framework guide
2. `/mnt/c/projects/vrp-system/v4/uat/UAT-COMPLETE-WORKFLOW.md` - Testing workflow
3. `/mnt/c/projects/vrp-system/v4/uat/scenarios/HOW-TO-CREATE-SCENARIOS.md` - Scenario creation

The UAT framework implements the VERA methodology (Verify, Execute, Record, Analyze) and provides 99.99% accurate testing through multi-layer verification.