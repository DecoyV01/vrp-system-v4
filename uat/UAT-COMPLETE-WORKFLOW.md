# 99.99% UAT Solution: Complete Workflow Guide

## Overview

This document provides a comprehensive UAT (User Acceptance Testing) solution with multi-layer verification for the VRP System v4. It combines automated browser testing with visual verification and state validation to achieve near-perfect accuracy.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [UAT Setup Checklist](#uat-setup-checklist)
3. [End-to-End UAT Process](#end-to-end-uat-process)
4. [Architecture](#architecture)
5. [Setup Instructions](#setup-instructions)
6. [The VERA Workflow](#the-vera-workflow)
7. [Test Scenarios](#test-scenarios)
8. [Edge Cases](#edge-cases)
9. [Troubleshooting](#troubleshooting)
10. [Automation Hooks](#automation-hooks)

## Prerequisites

### System Requirements
- Windows with WSL2 (Ubuntu)
- Claude Code running in WSL
- PowerShell 5.0 or higher
- Browser MCP configured
- FFmpeg installed in WSL: `sudo apt install ffmpeg`

### Application Requirements
- VRP System v4 frontend running on `localhost:5173`
- Development mode enabled (`import.meta.env.DEV = true`)
- Health check endpoints implemented (see [HEALTH-CHECK-SETUP.md](./HEALTH-CHECK-SETUP.md))
- Test user account available (email: `test1@example.com`, password: `testpassword123246`)

## UAT Setup Checklist

Before running any UAT tests, ensure the following are in place:

### ✅ 1. Infrastructure Setup
- [ ] All UAT documentation files created in `/mnt/c/projects/vrp-system/v4/uat/`
- [ ] PowerShell script executable: `uat-recorder.ps1`
- [ ] Bash helper script executable: `uat-helper.sh`
- [ ] Hook scripts executable in `hooks/` directory
- [ ] Directory structure created (screenshots, videos, reports, scenarios)

### ✅ 2. Frontend Health Checks
- [ ] Health check module created: `frontend/src/utils/uatHealthCheck.ts`
- [ ] Health check integrated in `frontend/src/main.tsx`
- [ ] State management integration added (auth, data loading)
- [ ] Error boundary integration for JavaScript error capture
- [ ] Health check available at `window.__UAT_HEALTH__` in development

### ✅ 3. Test Scenarios
- [ ] Basic scenarios created in `/mnt/c/projects/vrp-system/v4/uat/scenarios/`
- [ ] Login flow scenario (`login-flow.js`)
- [ ] Vehicle CRUD scenario (`vehicle-crud.js`)
- [ ] Job management scenario (`job-management.js`)
- [ ] Route optimization scenario (`route-optimization.js`)
- [ ] Error handling scenario (`error-handling.js`)

### ✅ 4. Test Data
- [ ] Test user account created and verified
- [ ] Sample project data available
- [ ] Test vehicle data prepared
- [ ] Test job data prepared
- [ ] Known error conditions documented

### ✅ 5. Environment Verification
- [ ] Frontend application running and accessible
- [ ] Convex backend connected and functional
- [ ] Database populated with test data
- [ ] Authentication system working
- [ ] All required APIs responding

## End-to-End UAT Process

### Phase 1: Pre-Test Setup (5 minutes)

```bash
# 1. Start the application
cd /mnt/c/projects/vrp-system/v4/frontend
npm run dev

# 2. Verify application is running
curl -s http://localhost:5173 > /dev/null && echo "✅ App running" || echo "❌ App not running"

# 3. Initialize UAT environment
/uat-init

# Expected output:
# 🚀 Initializing UAT environment...
# ✅ Health check system detected
# ✅ Validation framework injected
# ✅ Baseline screenshot captured
# 🎉 UAT environment ready!
```

### Phase 2: Core Functionality Tests (15-20 minutes)

```bash
# 1. Authentication Flow
/uat-login test1@example.com testpassword123246

# 2. Basic CRUD Operations
/uat-crud project create
/uat-crud vehicle create
/uat-crud job create

# 3. Navigation and State Management
/uat-scenario navigation-flow

# 4. Data Loading and Error Handling
/uat-scenario error-handling
```

### Phase 3: Comprehensive Scenarios (20-30 minutes)

```bash
# 1. Complete business workflows
/uat-scenario full-login-flow
/uat-scenario vehicle-management
/uat-scenario job-creation
/uat-scenario route-optimization

# 2. Edge cases and error conditions
/uat-scenario network-timeout
/uat-scenario session-timeout
/uat-scenario invalid-data-submission
```

### Phase 4: Report Generation and Review (5 minutes)

```bash
# 1. Generate comprehensive report
/uat-report

# 2. Review results
# - Screenshots in: /mnt/c/projects/vrp-system/v4/uat/screenshots/
# - Videos in: /mnt/c/projects/vrp-system/v4/uat/videos/
# - Reports in: /mnt/c/projects/vrp-system/v4/uat/reports/

# 3. Address any failures
# - Check failure debug info in: /mnt/c/projects/vrp-system/v4/uat/debug/
# - Review error logs and screenshots
# - Fix issues and re-run failed scenarios
```

### Success Criteria

A UAT session is considered successful when:

1. **Authentication**: ✅ Login/logout flows work correctly
2. **Navigation**: ✅ All routes and deep linking function properly
3. **CRUD Operations**: ✅ Create, read, update, delete operations work for all entities
4. **Data Validation**: ✅ Form validation and error handling work correctly
5. **State Management**: ✅ Application state persists correctly across actions
6. **Error Handling**: ✅ Error conditions are handled gracefully
7. **Performance**: ✅ No significant delays or timeout issues
8. **Visual Consistency**: ✅ UI renders correctly across all test scenarios

### Failure Response

If any test fails:

1. **Immediate Action**: Failure hook captures debug information automatically
2. **Investigation**: Review failure screenshots and error logs
3. **Root Cause**: Analyze health check logs for state inconsistencies
4. **Fix**: Address identified issues in code
5. **Re-test**: Run specific failed scenario again
6. **Validation**: Ensure fix doesn't break other functionality

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│  Browser MCP    │────▶│   Browser       │
│   (WSL/Ubuntu)  │     │  (Cross-boundary)│     │   (Windows)     │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │                                                │
         ▼                                                ▼
┌─────────────────┐                             ┌─────────────────┐
│  PowerShell     │                             │  Health Check   │
│  Scripts        │◀────────────────────────────│  Endpoints      │
│  (Windows)      │                             │  (Frontend)     │
└─────────────────┘                             └─────────────────┘
```

## Setup Instructions

### 1. Create PowerShell UAT Recorder

The PowerShell script for screenshots and recording is already created at:
`/mnt/c/projects/vrp-system/v4/uat/uat-recorder.ps1`

### 2. Create WSL Helper Script

The bash helper script is already created at:
`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh`

Make it executable:
```bash
chmod +x /mnt/c/projects/vrp-system/v4/uat/uat-helper.sh
```

## The VERA Workflow

VERA stands for **Verify, Execute, Record, Analyze**. This is the core testing methodology.

### Phase 1: VERIFY (Baseline State)

```javascript
// 1. Check system health
const baseline = await browser.evaluate(`
    window.__UAT_HEALTH__ ? {
        isLoggedIn: window.__UAT_HEALTH__.isLoggedIn(),
        currentRoute: window.__UAT_HEALTH__.currentRoute(),
        hasErrors: window.__UAT_HEALTH__.hasErrors(),
        isLoading: window.__UAT_HEALTH__.isLoading()
    } : null
`);

// 2. Take baseline screenshot
await bash(`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh screenshot baseline`);

// 3. Clear any existing state
await browser.evaluate(`
    localStorage.clear();
    sessionStorage.clear();
`);

// 4. Verify clean state
const cleanState = await browser.evaluate(`window.__UAT_HEALTH__.isLoggedIn()`);
if (cleanState) throw new Error("Failed to clear login state");
```

### Phase 2: EXECUTE (Perform Actions)

```javascript
// 1. Start recording
await bash(`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh start`);

// 2. Inject action markers
await browser.evaluate(`
    window.__UAT_HEALTH__.actionLog.push({
        action: 'navigate_to_login',
        timestamp: Date.now()
    });
`);

// 3. Perform the action
await browser.navigate("http://localhost:5173/login");

// 4. Wait for stability
await browser.wait(2);

// 5. Verify action completed
await browser.evaluate(`
    window.__assert.elementExists('form.login-form');
`);
```

### Phase 3: RECORD (Capture Everything)

```javascript
// 1. Take action screenshot
await bash(`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh screenshot after-navigation`);

// 2. Capture DOM state
const domState = await browser.snapshot();

// 3. Get console logs
const consoleLogs = await browser.getConsoleLogs();

// 4. Check network state
const networkState = await browser.evaluate(`
    performance.getEntriesByType("resource").slice(-10).map(r => ({
        name: r.name,
        duration: r.duration,
        status: r.transferSize === 0 ? 'cached' : 'loaded'
    }))
`);

// 5. Get current health state
const currentHealth = await browser.evaluate(`
    window.__UAT_HEALTH__ ? {
        isLoggedIn: window.__UAT_HEALTH__.isLoggedIn(),
        currentRoute: window.__UAT_HEALTH__.currentRoute(),
        hasErrors: window.__UAT_HEALTH__.hasErrors(),
        actionLog: window.__UAT_HEALTH__.actionLog
    } : null
`);
```

### Phase 4: ANALYZE (Validate Results)

```javascript
// 1. Compare states
if (baseline.isLoggedIn === currentHealth.isLoggedIn) {
    throw new Error("Login state did not change");
}

// 2. Check for errors
if (currentHealth.hasErrors) {
    const errorDetails = await browser.evaluate(`
        Array.from(document.querySelectorAll('.error')).map(e => e.textContent)
    `);
    throw new Error(`Errors detected: ${errorDetails.join(', ')}`);
}

// 3. Verify expected route
if (currentHealth.currentRoute !== '/dashboard') {
    throw new Error(`Unexpected route: ${currentHealth.currentRoute}`);
}

// 4. Stop recording and create video
await bash(`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh stop`);
await bash(`/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh video login-test`);
```

## Test Scenarios

### 1. Login Flow Test

```markdown
TEST: User Login
PRECONDITIONS: User exists with email "test1@example.com" and password "testpassword123246"

STEPS:
1. VERIFY: User is logged out
2. EXECUTE: Navigate to login page
3. RECORD: Login form appearance
4. EXECUTE: Enter credentials
5. RECORD: Form state with credentials
6. EXECUTE: Submit form
7. ANALYZE: Verify redirect to dashboard
8. VERIFY: User data is loaded
```

### 2. CRUD Operations Test

```markdown
TEST: Create New Vehicle
PRECONDITIONS: User is logged in with project selected

STEPS:
1. VERIFY: Vehicle list is loaded
2. EXECUTE: Click "Add Vehicle" button
3. RECORD: Modal/form appearance
4. EXECUTE: Fill vehicle details
5. RECORD: Form validation states
6. EXECUTE: Submit form
7. ANALYZE: Verify vehicle appears in list
8. VERIFY: Database state updated
```

### 3. Error Handling Test

```markdown
TEST: Invalid Form Submission
PRECONDITIONS: Form with required fields

STEPS:
1. VERIFY: Form is in clean state
2. EXECUTE: Submit empty form
3. RECORD: Error messages
4. ANALYZE: Verify appropriate errors shown
5. EXECUTE: Fix one field
6. RECORD: Error state update
7. ANALYZE: Verify error cleared for fixed field
```

## Edge Cases

### 1. Network Latency
```javascript
// Simulate slow network
await browser.evaluate(`
    // Override fetch to add delay
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return originalFetch(...args);
    };
`);
```

### 2. Race Conditions
```javascript
// Test rapid clicks
for (let i = 0; i < 5; i++) {
    await browser.click("#submit-button");
    await browser.wait(0.1);
}
// Verify only one submission occurred
```

### 3. Session Timeout
```javascript
// Clear auth token mid-test
await browser.evaluate(`localStorage.removeItem('authToken')`);
await browser.click("#protected-action");
// Verify redirect to login
```

### 4. Browser Compatibility
```javascript
// Test specific browser features
const supportStatus = await browser.evaluate(`({
    localStorage: !!window.localStorage,
    fetch: !!window.fetch,
    promises: !!window.Promise,
    es6: (() => { try { return eval('(()=>{})')(); } catch(e) { return false; } })()
})`);
```

## Troubleshooting

### Common Issues and Solutions

1. **Screenshot Timing Issues**
   - Solution: Add explicit waits after actions
   - Use mutation observers to detect DOM changes

2. **Login State Not Persisting**
   - Check cookie settings
   - Verify localStorage is not cleared
   - Check for httpOnly cookies

3. **Element Not Found**
   - Add retry logic with exponential backoff
   - Use more specific selectors
   - Wait for element visibility, not just presence

4. **Recording Not Starting**
   - Ensure Windows Game Bar is enabled
   - Check Windows Focus Assist settings
   - Use alternative recording method (OBS)

## Automation Hooks

### Pre-UAT Hook
```json
{
  "hooks": {
    "pre-uat": {
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/hooks/pre-uat.sh",
      "description": "Prepare UAT environment"
    }
  }
}
```

### Post-UAT Hook
```json
{
  "hooks": {
    "post-uat": {
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/hooks/post-uat.sh",
      "description": "Clean up UAT artifacts and generate report"
    }
  }
}
```

### On-Failure Hook
```json
{
  "hooks": {
    "uat-failure": {
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/hooks/on-failure.sh",
      "description": "Collect debug information on UAT failure"
    }
  }
}
```

## Next Steps

1. Review the [Health Check Setup Guide](./HEALTH-CHECK-SETUP.md)
2. Review the [Validation Scripts Guide](./VALIDATION-SCRIPTS-GUIDE.md)
3. Configure slash commands in [UAT Commands](./UAT-COMMANDS.md)
4. Set up automation hooks as described above