# UAT Hooks for Claude Code

## Overview

These hooks integrate the UAT framework with Claude Code's built-in hooks system. When you request UAT testing, Claude Code will automatically follow the VERA methodology.

## How It Works

### Detection
The hooks detect UAT intent when your message contains:
1. The word "uat" (required)
2. A scenario keyword: login, vehicle, crud, error, handling

### Examples

✅ **Valid UAT Requests:**
- "Run UAT for login flow"
- "Execute UAT vehicle CRUD tests"
- "Test UAT error handling scenarios"
- "Perform UAT login testing"

❌ **Invalid Requests (won't trigger UAT):**
- "Test login flow" (missing "uat")
- "Run UAT tests" (missing scenario keyword)
- "Test vehicle operations" (missing "uat")

## Hook Components

1. **uat-session-manager.py** - Core session management and UAT detection
2. **uat-orchestrator.py** - PreToolUse hook that enhances commands for UAT
3. **uat-progress-tracker.py** - PostToolUse hook that tracks execution progress
4. **uat-finalizer.py** - Stop hook that generates reports and finalizes sessions

## Testing

Run the detection test:
```bash
cd /mnt/c/projects/vrp-system/v4/uat/hooks
python3 uat-session-manager.py
```

## Configuration

The hooks are configured in `.claude/settings.local.json`:
```json
{
  "hooks": {
    "PreToolUse": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-orchestrator.py",
      "matcher": { "tool": "Bash|mcp__browsermcp__.*" }
    }],
    "PostToolUse": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-progress-tracker.py",
      "matcher": { "tool": "Bash|mcp__browsermcp__.*" }
    }],
    "Stop": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-finalizer.py"
    }]
  }
}
```

## Session Management

Sessions are stored in `/uat/sessions/` with:
- `current.json` - Active session data
- `{sessionId}/session.json` - Completed session archives

## Reports

UAT reports are generated in `/uat/reports/` containing:
- Test results and metrics
- VERA phase breakdown
- Captured artifacts (screenshots, logs)
- Success/failure analysis