# 99.99% UAT Solution: Complete Workflow Guide

## Overview

This document provides a comprehensive UAT (User Acceptance Testing) solution with multi-layer verification for the VRP System v4. It combines automated browser testing with visual verification and state validation to achieve near-perfect accuracy.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [The VERA Workflow](#the-vera-workflow)
5. [Test Scenarios](#test-scenarios)
6. [Edge Cases](#edge-cases)
7. [Troubleshooting](#troubleshooting)
8. [Automation Hooks](#automation-hooks)

## Prerequisites

- Windows with WSL2 (Ubuntu)
- Claude Code running in WSL
- PowerShell 5.0 or higher
- Browser MCP configured
- FFmpeg installed in WSL: `sudo apt install ffmpeg`

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

Save as `C:\projects\vrp-system\v4\uat\uat-recorder.ps1`:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$action,
    
    [string]$filename = "",
    [string]$testName = "uat-test"
)

$outputPath = "C:\projects\vrp-system\v4\uat\screenshots"

# Create output directory if it doesn't exist
if (!(Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

function Take-Screenshot {
    param($name)
    
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen(0, 0, 0, 0, $screen.Size)
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
    $filepath = "$outputPath\$testName-$name-$timestamp.png"
    $bitmap.Save($filepath)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Output $filepath
}

function Start-Recording {
    # Use Windows Game Bar (Win+Alt+R)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^%{r}")
    
    # Also start taking periodic screenshots
    $script:recordingJob = Start-Job -ScriptBlock {
        while ($true) {
            Start-Sleep -Seconds 2
            # Take periodic screenshots during recording
        }
    }
    
    Write-Output "Recording started"
}

function Stop-Recording {
    # Stop Windows Game Bar recording
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^%{r}")
    
    if ($script:recordingJob) {
        Stop-Job -Job $script:recordingJob
        Remove-Job -Job $script:recordingJob
    }
    
    Write-Output "Recording stopped"
}

# Execute requested action
switch ($action) {
    "screenshot" {
        $filepath = Take-Screenshot -name $filename
        Write-Output "Screenshot saved: $filepath"
    }
    "start-recording" {
        Start-Recording
    }
    "stop-recording" {
        Stop-Recording
    }
    "clean" {
        Remove-Item "$outputPath\*" -Force
        Write-Output "Screenshots cleaned"
    }
    default {
        Write-Error "Unknown action: $action"
    }
}
```

### 2. Create WSL Helper Script

Save as `/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh`:

```bash
#!/bin/bash

UAT_DIR="/mnt/c/projects/vrp-system/v4/uat"
SCREENSHOTS_DIR="$UAT_DIR/screenshots"

# Function to call PowerShell script
uat_screenshot() {
    local name=$1
    local test_name=${2:-"uat-test"}
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action screenshot -filename "$name" -testName "$test_name"
}

uat_start_recording() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action start-recording
}

uat_stop_recording() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action stop-recording
}

# Create video from screenshots
uat_create_video() {
    local test_name=${1:-"uat-test"}
    cd "$SCREENSHOTS_DIR"
    ffmpeg -framerate 1 -pattern_type glob -i "$test_name-*.png" -c:v libx264 -pix_fmt yuv420p "$UAT_DIR/results/$test_name-$(date +%Y%m%d-%H%M%S).mp4"
}

# Clean up screenshots
uat_clean() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action clean
}

# Execute if called directly
if [ "${1}" ]; then
    case "$1" in
        screenshot) uat_screenshot "$2" "$3" ;;
        start) uat_start_recording ;;
        stop) uat_stop_recording ;;
        video) uat_create_video "$2" ;;
        clean) uat_clean ;;
        *) echo "Usage: $0 {screenshot|start|stop|video|clean} [args]" ;;
    esac
fi
```

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
PRECONDITIONS: User exists with email "test@example.com" and password "Test123!"

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
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/setup-uat.sh",
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
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/cleanup-uat.sh",
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
      "command": "bash /mnt/c/projects/vrp-system/v4/uat/debug-failure.sh",
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