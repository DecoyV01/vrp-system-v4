# Claude Code UAT Hooks Setup Guide

**Version**: 1.0.0  
**Created**: July 5, 2025  
**Purpose**: Step-by-step guide for registering and using Claude Code UAT hooks

## Overview

This guide shows you how to register the new Claude Code built-in UAT hooks that provide automatic UAT testing orchestration without requiring external initialization.

## Prerequisites

- Claude Code installed and running
- VRP System v4 project at `/mnt/c/projects/vrp-system/v4/`
- UAT scenarios available in `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

## Quick Start

### 1. Navigate to Project Directory
```bash
cd /mnt/c/projects/vrp-system/v4
```

### 2. Start Claude Code
```bash
claude-code
```

### 3. Register UAT Hooks
In Claude Code session, run the `/hooks` command and register each hook:

```
/hooks
```

Follow the menu prompts to register all three hooks:

1. **PreToolUse Hook**: `/mnt/c/projects/vrp-system/v4/hooks/claude-uat-orchestrator.sh`
2. **PostToolUse Hook**: `/mnt/c/projects/vrp-system/v4/hooks/claude-uat-tracker.sh`  
3. **Stop Hook**: `/mnt/c/projects/vrp-system/v4/hooks/claude-uat-finalizer.sh`

### 4. Start Testing
Simply ask Claude Code to test scenarios using natural language:

```
"Please test the login-flow scenario"
"Run vehicle CRUD testing"
"Verify user authentication functionality"
```

## Detailed Hook Registration

### Step 1: Register PreToolUse Hook (UAT Orchestrator)

1. Type `/hooks` in Claude Code
2. Select **"1. PreToolUse - Before tool execution"**
3. Enter the following path exactly:
   ```
   /mnt/c/projects/vrp-system/v4/hooks/claude-uat-orchestrator.sh
   ```
4. Confirm registration

**What this hook does:**
- Automatically detects UAT testing intentions from your messages
- Initializes UAT sessions when needed
- Enhances Browser MCP parameters with UAT context
- Manages screenshot naming and directories

### Step 2: Register PostToolUse Hook (UAT Tracker)

1. Type `/hooks` in Claude Code
2. Select **"2. PostToolUse - After tool execution"**
3. Enter the following path exactly:
   ```
   /mnt/c/projects/vrp-system/v4/hooks/claude-uat-tracker.sh
   ```
4. Confirm registration

**What this hook does:**
- Tracks tool execution results and performance
- Updates scenario progress automatically
- Records screenshots and validation data
- Advances to next steps when appropriate

### Step 3: Register Stop Hook (UAT Finalizer)

1. Type `/hooks` in Claude Code
2. Select **"4. Stop - Right before Claude concludes its response"**
3. Enter the following path exactly:
   ```
   /mnt/c/projects/vrp-system/v4/hooks/claude-uat-finalizer.sh
   ```
4. Confirm registration

**What this hook does:**
- Generates comprehensive session reports
- Archives screenshots and session data
- Updates UAT framework statistics
- Cleans up temporary files

## Hook Registration Verification

After registering all hooks, verify they're active:

1. Type `/hooks` again
2. You should see all three hooks listed as registered
3. Each hook path should match the paths above exactly

## Usage Examples

Once hooks are registered, you can trigger UAT testing with natural language:

### High-Confidence Triggers (Auto-Initialize)
```
"Test login-flow scenario"
"Run vehicle-crud UAT"
"Execute user registration test"
"Please test the authentication functionality"
```

### Medium-Confidence Triggers (Auto-Initialize with suggestions)
```
"Verify login functionality"
"Test vehicle management features"
"Validate user authentication"
"Check the dashboard after login"
```

### Browser Actions (Enhanced automatically when UAT active)
```
"Navigate to the login page"
"Take a screenshot of the dashboard"
"Fill out the vehicle form"
"Click the submit button"
```

## Available UAT Scenarios

The system automatically detects these scenarios:

- **login-flow**: User authentication testing
- **vehicle-crud**: Vehicle management operations
- **user-registration**: User account creation

To see all available scenarios, the hooks will automatically validate against scenarios in:
```
/mnt/c/projects/vrp-system/v4/uat/scenarios/
```

## How It Works

### Automatic Context Detection
1. You write a message like "test login-flow scenario"
2. PreToolUse hook analyzes your message and detects UAT intent
3. Hook automatically initializes UAT session for the scenario
4. All subsequent Browser MCP tools are enhanced with UAT context

### Session Management
1. Each Claude Code session can have one active UAT session
2. Session state is managed automatically in `/uat/sessions/`
3. Screenshots are organized in `/uat/screenshots/{session-id}/`
4. Session ends automatically when Claude Code session ends

### Reporting
1. Comprehensive reports generated in `/uat/reports/`
2. Session data archived in `/uat/archive/`
3. Performance metrics tracked across sessions

## Troubleshooting

### Hook Registration Issues

**Problem**: "File not found" error during registration
**Solution**: 
- Verify you're in the correct directory: `/mnt/c/projects/vrp-system/v4`
- Check file permissions: `ls -la hooks/claude-uat-*.sh`
- Ensure files are executable: `chmod +x hooks/claude-uat-*.sh`

**Problem**: Hook registration succeeds but doesn't trigger
**Solution**:
- Check Claude Code session is in project root directory
- Verify hook files have correct shebang: `#!/bin/bash`
- Check hook execution permissions

### UAT Detection Issues

**Problem**: UAT context not detected
**Solution**:
- Use explicit scenario names: "test login-flow scenario"
- Check available scenarios: `ls uat/scenarios/`
- Verify scenario files are valid JavaScript

**Problem**: Wrong scenario detected
**Solution**:
- Be more specific in your message: "test vehicle-crud scenario" instead of "test vehicles"
- Use exact scenario names from the scenarios directory

### Session State Issues

**Problem**: Session state errors in logs
**Solution**:
- Check `/uat/sessions/` directory permissions
- Verify JSON syntax in session files
- Clean up stale lock files: `rm -f /uat/sessions/*.lock`

### Performance Issues

**Problem**: Hooks taking too long
**Solution**:
- Check available disk space in `/uat/` directory
- Verify `jq` is installed and working: `jq --version`
- Check for large session state files

## Advanced Configuration

### Debug Mode
Set debug logging for detailed hook execution information:
```bash
export UAT_LOG_LEVEL=debug
```

### Custom Screenshot Directory
Hooks automatically create organized screenshot directories, but you can check the structure:
```
/uat/screenshots/{session-id}/
├── {session-id}-{scenario}-step1-navigate-{timestamp}.png
├── {session-id}-{scenario}-step2-fill-{timestamp}.png
└── {session-id}-{scenario}-step3-submit-{timestamp}.png
```

### Session Data Location
- **Active sessions**: `/uat/sessions/claude-session-{session-id}.json`
- **Reports**: `/uat/reports/session-report-{session-id}-{timestamp}.json`
- **Archives**: `/uat/archive/{year-month}/session-{session-id}-{timestamp}/`

## Best Practices

### 1. Clear Intent
Be explicit about your testing intentions:
- ✅ "Test login-flow scenario"
- ❌ "Check login"

### 2. One Scenario Per Session
Each Claude Code session should focus on one UAT scenario for best results.

### 3. Sequential Testing
Allow each step to complete before moving to the next for accurate progress tracking.

### 4. Review Reports
Check generated reports in `/uat/reports/` for insights and recommendations.

## Integration with Existing Workflow

### Compatibility
- Works alongside existing UAT framework
- Compatible with all Browser MCP tools
- Preserves existing scenario definitions

### Migration
- No changes needed to existing scenarios
- Existing reports and archives remain accessible
- Gradual adoption possible (hooks can be disabled individually)

## Support and Maintenance

### Log Files
Hook execution logs are written to stderr and visible in Claude Code session.

### Cleanup
- Automatic cleanup of temporary files
- 90-day retention policy for archived sessions
- Manual cleanup: `rm -rf /uat/sessions/temp-*`

### Updates
- Hook files can be updated without re-registration
- Restart Claude Code session to pick up hook changes
- No database migration required

---

**Setup Complete**: Your Claude Code UAT hooks are now registered and ready to use! Simply start testing with natural language requests.