# Claude Code UAT Hooks Setup Guide (Corrected Version)

**Version**: 2.0.0  
**Created**: July 5, 2025  
**Purpose**: Proper setup for Claude Code's actual hooks system

## Overview

This guide provides the correct setup for UAT hooks using Claude Code's **actual** hooks interface, which uses JSON configuration files and stdin/stdout communication, not the internal API approach used in the previous version.

## Key Differences from Previous Version

### What Changed
- **Configuration**: Uses JSON file instead of Claude Code `/hooks` command
- **Interface**: Uses stdin/stdout JSON instead of internal Claude API
- **Scripts**: Simplified Python scripts instead of complex bash scripts
- **Registration**: File-based configuration instead of interactive registration

### Files Created
```
hooks/
├── claude-code-hooks.json      # Hook configuration file
├── uat-pre-hook.py            # PreToolUse hook (simplified)
├── uat-post-hook.py           # PostToolUse hook (simplified)
├── uat-stop-hook.py           # Stop hook (simplified)
└── CLAUDE-CODE-HOOKS-SETUP.md # This setup guide
```

## Quick Setup

### 1. Verify Hook Files
Ensure all hook files are executable:
```bash
cd /mnt/c/projects/vrp-system/v4
chmod +x hooks/uat-*.py
ls -la hooks/uat-*.py
```

### 2. Configure Claude Code Hooks
Add the hooks configuration to Claude Code's main settings file:
```bash
# The hooks must be added to the main settings.json file
# NOT as a separate hooks.json file

# Back up existing settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Add hooks configuration to main settings.json
# Option 1: If settings.json is empty or only contains {}
cp hooks/claude-code-hooks.json ~/.claude/settings.json

# Option 2: If you have existing settings, manually merge the hooks section
# Edit ~/.claude/settings.json and add the "hooks" section from claude-code-hooks.json
```

**Important**: Hooks must be configured **inside** the main `~/.claude/settings.json` file, not as a separate file.

### 3. Verify Configuration
Your `~/.claude/settings.json` file should now contain:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__playwright__.*",
        "hooks": [
          {
            "type": "command",
            "command": "/mnt/c/projects/vrp-system/v4/hooks/uat-pre-hook.py",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "mcp__playwright__.*",
        "hooks": [
          {
            "type": "command", 
            "command": "/mnt/c/projects/vrp-system/v4/hooks/uat-post-hook.py",
            "timeout": 20
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/mnt/c/projects/vrp-system/v4/hooks/uat-stop-hook.py",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

### 4. Test Setup
Start a new Claude Code session and try UAT testing:
```
"Please test the login-flow scenario"
```

The hooks should automatically:
1. Detect UAT intent (PreToolUse)
2. Initialize UAT session
3. Enhance Browser MCP parameters
4. Track execution results (PostToolUse)
5. Generate reports when session ends (Stop)

## How It Works

### Hook Flow
1. **User Message**: "Test login-flow scenario"
2. **PreToolUse Hook**: 
   - Detects UAT intent from message
   - Creates UAT session
   - Enhances Browser MCP parameters
3. **Tool Execution**: Browser MCP runs with enhanced parameters
4. **PostToolUse Hook**:
   - Records execution results
   - Updates session progress
   - Tracks screenshots and validation
5. **Session End**: Stop hook generates reports and archives data

### Input/Output Format

#### PreToolUse Input (stdin):
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/conversation.jsonl",
  "tool_name": "mcp__playwright__playwright_navigate",
  "tool_input": {
    "url": "/auth/login"
  }
}
```

#### PreToolUse Output (stdout):
```json
{
  "continue": true,
  "tool_input": {
    "url": "https://vrp-system-v4.pages.dev/auth/login",
    "timeout": 10000,
    "headless": true
  }
}
```

#### PostToolUse Input (stdin):
```json
{
  "session_id": "abc123", 
  "transcript_path": "/path/to/conversation.jsonl",
  "tool_name": "mcp__playwright__playwright_navigate",
  "tool_input": {...},
  "result": {
    "success": true,
    "url": "https://vrp-system-v4.pages.dev/auth/login"
  },
  "execution_time_ms": 1250
}
```

## UAT Detection Patterns

### High Confidence (Auto-Initialize)
- "Test login-flow scenario" → Confidence: 95%
- "Run vehicle-crud UAT" → Confidence: 90%
- "Execute user-registration test" → Confidence: 85%

### Medium Confidence (Auto-Initialize with suggestions)
- "Test login functionality" → Confidence: 65%
- "Verify vehicle management" → Confidence: 60%

### Enhanced Browser Actions
When UAT is active, Browser MCP tools are automatically enhanced:
- **Navigate**: Absolute URLs, proper timeouts, headless mode
- **Screenshot**: UAT naming, organized directories
- **Click/Fill**: Better timeouts, error handling
- **Performance**: Execution tracking and metrics

## Session Management

### Session Files
```
uat/
├── sessions/
│   └── claude-session-{id}.json    # Active session state
├── reports/
│   ├── session-report-{id}.json    # Session reports
│   ├── uat-summary.json            # Overall summary
│   └── scenario-stats-{name}.json  # Per-scenario stats
├── screenshots/
│   └── {uat-session-id}/           # Organized screenshots
└── archive/
    └── {year-month}/               # Archived sessions
```

### Session State Structure
```json
{
  "meta": {
    "version": "1.0.0",
    "created": "2025-07-05T14:30:22Z"
  },
  "session": {
    "claudeSessionId": "abc123",
    "uatSessionId": "uat-20250705-143022-abc123",
    "scenarioName": "login-flow",
    "status": "active"
  },
  "scenario": {
    "name": "login-flow",
    "totalSteps": 5,
    "currentStep": 2,
    "completedSteps": 1
  },
  "execution": {
    "toolCalls": [...],
    "errors": [...]
  },
  "artifacts": {
    "screenshots": [...]
  },
  "performance": {
    "toolCallCount": 3,
    "averageStepDuration": 2340,
    "successRate": 1.0
  }
}
```

## Available Scenarios

The hooks automatically detect these scenarios:

### login-flow
- **Keywords**: login, auth, signin, credential, authentication
- **Steps**: Navigate → Fill credentials → Click login → Screenshot → Verify
- **Enhanced for**: Authentication URLs, form interactions

### vehicle-crud  
- **Keywords**: vehicle, fleet, car, truck, crud, manage
- **Steps**: Navigate → Create → Fill form → Submit → Screenshot
- **Enhanced for**: CRUD operations, form validation

### user-registration
- **Keywords**: user, register, signup, account, profile  
- **Steps**: Navigate → Fill details → Submit → Screenshot
- **Enhanced for**: Registration flows, user management

## Troubleshooting

### Hooks Not Triggering
1. **Check Configuration**: Verify `hooks.json` is in correct location
2. **Check Permissions**: Ensure hook scripts are executable (`chmod +x`)
3. **Check Paths**: Verify absolute paths in configuration are correct
4. **Check Logs**: Look at stderr output in Claude Code session

### UAT Not Detected
1. **Use Explicit Patterns**: "test login-flow scenario" instead of "check login"
2. **Check Available Scenarios**: Ensure scenario files exist in `uat/scenarios/`
3. **Check Confidence Threshold**: Low confidence messages may not trigger UAT

### Session State Issues
1. **Check Directories**: Ensure `uat/sessions/` exists and is writable
2. **Check JSON Syntax**: Malformed session files will cause errors
3. **Clean Up**: Remove stale files from `uat/sessions/`

### Performance Issues
1. **Check Disk Space**: UAT creates screenshots and logs
2. **Clean Old Archives**: Remove files older than 90 days
3. **Check Dependencies**: Ensure `jq` and Python 3 are available

## Testing the Setup

### Manual Test
1. Start new Claude Code session
2. Use UAT trigger phrase: "Test login-flow scenario"
3. Run Browser MCP command: "Navigate to /auth/login"
4. Check for UAT enhancements in the navigation
5. Take a screenshot: "Take a screenshot of the login page"
6. Check organized screenshot naming
7. End session and verify report generation

### Expected Behavior
- ✅ UAT session auto-initializes
- ✅ URLs become absolute with base URL
- ✅ Screenshots get UAT naming and directories
- ✅ Session progress tracked in real-time
- ✅ Comprehensive reports generated on session end

## Migration from Previous Version

### Remove Old Files
The previous complex bash hooks should be removed:
```bash
rm -f hooks/claude-uat-*.sh
rm -f hooks/CLAUDE-CODE-UAT-*.md
```

### Keep UAT Framework
The existing UAT framework files are still used:
- `uat/scenarios/` → Scenario definitions
- UAT testing utilities and validation functions

### Update Expectations
- No more `/hooks` command registration
- No more complex session management scripts
- Simpler, more reliable hook execution
- Better error handling and logging

## Security Considerations

⚠️ **Important**: Hooks execute with full user permissions. The provided hooks:
- ✅ Validate all inputs from stdin
- ✅ Use absolute paths for safety
- ✅ Quote all shell variables properly
- ✅ Avoid accessing sensitive files
- ✅ Fail gracefully on errors

## Support

### Debug Mode
Enable debug logging:
```bash
export UAT_LOG_LEVEL=debug
# Restart Claude Code session
```

### Log Analysis
Check stderr output in Claude Code for:
- `[DEBUG]` messages: Normal operation details
- `[INFO]` messages: Important operations
- `[ERROR]` messages: Problems requiring attention

### Validation
Verify hook execution manually:
```bash
# Test PreToolUse hook
echo '{"session_id":"test","tool_name":"mcp__playwright__playwright_navigate","tool_input":{"url":"/login"},"transcript_path":"/fake/path"}' | hooks/uat-pre-hook.py

# Should output JSON response
```

---

**Setup Complete**: Your Claude Code UAT hooks now use the correct interface and should work reliably with Claude Code's actual hooks system!