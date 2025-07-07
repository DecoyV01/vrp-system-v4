# UAT Hooks Implementation Plan v3 - Claude Code Integration

## Overview

This document outlines the implementation plan for integrating the UAT framework with Claude Code's built-in hooks system. The integration ensures that when users request UAT testing, Claude Code follows the VERA methodology through its hooks system rather than bypassing it.

## Key Requirements

1. **UAT Detection**: Must detect "uat" keyword AND scenario-specific keywords
2. **Scenario Matching**: Match keywords to scenario files in `/uat/scenarios/`
3. **VERA Methodology**: Preserve Verify, Execute, Record, Analyze workflow
4. **Claude Code Hooks**: Use built-in PreToolUse/PostToolUse/Stop hooks
5. **Local Settings**: Configure in `.claude/settings.local.json`

## Available UAT Scenarios

Based on `/uat/scenarios/` directory:
- `login-flow.js` - Login and authentication testing
- `vehicle-crud.js` - Vehicle CRUD operations testing  
- `error-handling.js` - Error handling and validation testing

## Detection Patterns

### Primary Detection Logic
```javascript
// User message must contain "uat" AND one of the scenario keywords
const isUAT = message.includes('uat') && (
  message.includes('login') ||
  message.includes('vehicle') || 
  message.includes('crud') ||
  message.includes('error') ||
  message.includes('handling')
);
```

### Scenario Mapping
```javascript
const scenarioMap = {
  'login': 'login-flow',
  'vehicle': 'vehicle-crud',
  'crud': 'vehicle-crud',
  'error': 'error-handling',
  'handling': 'error-handling'
};
```

## Architecture Design

### Hook Flow
```
User Request → PreToolUse Hook → UAT Detection → Session Init
                    ↓
              Tool Execution → PostToolUse Hook → Progress Track
                    ↓
              Session End → Stop Hook → Report Generation
```

### Key Components

1. **UAT Session Manager** (`/mnt/c/projects/vrp-system/v4/uat/hooks/uat-session-manager.py`)
   - Detects UAT intent from user messages
   - Initializes UAT sessions
   - Maps requests to scenarios
   - Manages session state

2. **UAT Orchestrator** (`/mnt/c/projects/vrp-system/v4/uat/hooks/uat-orchestrator.py`)
   - PreToolUse hook implementation
   - Intercepts tool calls during UAT
   - Enhances commands with UAT parameters
   - Injects validation scripts

3. **UAT Progress Tracker** (`/mnt/c/projects/vrp-system/v4/uat/hooks/uat-progress-tracker.py`)
   - PostToolUse hook implementation
   - Tracks execution progress
   - Captures screenshots and logs
   - Updates session state

4. **UAT Finalizer** (`/mnt/c/projects/vrp-system/v4/uat/hooks/uat-finalizer.py`)
   - Stop hook implementation
   - Generates comprehensive reports
   - Creates videos from screenshots
   - Cleans up session artifacts

## Implementation Tasks

### Phase 1: Core Hook Development

#### Task 1: Create UAT Session Manager
```python
# uat-session-manager.py
import json
import sys
import os
from datetime import datetime

class UATSessionManager:
    def __init__(self):
        self.session_file = '/mnt/c/projects/vrp-system/v4/uat/sessions/current.json'
        
    def detect_uat_intent(self, message):
        """Detect UAT intent requiring 'uat' keyword + scenario keyword"""
        message_lower = message.lower()
        
        # Must contain 'uat'
        if 'uat' not in message_lower:
            return False, None
            
        # Check for scenario keywords
        scenario_map = {
            'login': 'login-flow',
            'vehicle': 'vehicle-crud',
            'crud': 'vehicle-crud',
            'error': 'error-handling',
            'handling': 'error-handling'
        }
        
        for keyword, scenario in scenario_map.items():
            if keyword in message_lower:
                return True, scenario
                
        return False, None
```

#### Task 2: Create PreToolUse Hook
```python
# uat-orchestrator.py
def handle_pre_tool_use():
    """PreToolUse hook for UAT orchestration"""
    input_data = json.loads(sys.stdin.read())
    
    # Check if UAT session is active
    session = load_uat_session()
    if not session:
        # Check if this is UAT intent
        if input_data.get('tool') == 'Bash':
            # Analyze command for UAT patterns
            command = input_data.get('params', {}).get('command', '')
            if should_init_uat(command):
                session = init_uat_session(command)
    
    # If UAT active, enhance the command
    if session:
        input_data = enhance_for_uat(input_data, session)
    
    print(json.dumps(input_data))
```

#### Task 3: Create PostToolUse Hook
```python
# uat-progress-tracker.py
def handle_post_tool_use():
    """PostToolUse hook for progress tracking"""
    input_data = json.loads(sys.stdin.read())
    
    session = load_uat_session()
    if session:
        # Track progress
        track_execution(input_data, session)
        
        # Capture artifacts
        if should_capture_screenshot(input_data):
            capture_screenshot(session)
            
        # Update session
        update_session(session)
    
    print(json.dumps(input_data))
```

#### Task 4: Create Stop Hook
```python
# uat-finalizer.py
def handle_stop():
    """Stop hook for UAT finalization"""
    input_data = json.loads(sys.stdin.read())
    
    session = load_uat_session()
    if session:
        # Generate report
        generate_uat_report(session)
        
        # Create video
        create_session_video(session)
        
        # Clean up
        finalize_session(session)
    
    print(json.dumps(input_data))
```

### Phase 2: Hook Configuration

#### Task 5: Update Local Settings
```json
{
  "permissions": {
    "allow": [
      // ... existing permissions
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    // ... existing servers
  ],
  "hooks": {
    "PreToolUse": [
      {
        "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-orchestrator.py",
        "matcher": {
          "tool": "Bash"
        }
      },
      {
        "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-orchestrator.py",
        "matcher": {
          "tool": "mcp__playwright__.*"
        }
      }
    ],
    "PostToolUse": [
      {
        "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-progress-tracker.py",
        "matcher": {
          "tool": "Bash|mcp__playwright__.*"
        }
      }
    ],
    "Stop": [
      {
        "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-finalizer.py"
      }
    ]
  }
}
```

### Phase 3: Integration Scripts

#### Task 6: Create UAT Command Wrapper
```bash
#!/bin/bash
# uat-wrapper.sh
# Wraps UAT commands to work with Claude Code hooks

UAT_SESSION_FILE="/mnt/c/projects/vrp-system/v4/uat/sessions/current.json"

# Check if UAT session exists
if [ -f "$UAT_SESSION_FILE" ]; then
    SESSION_ID=$(jq -r '.sessionId' "$UAT_SESSION_FILE")
    echo "🎯 UAT Session Active: $SESSION_ID"
fi

# Execute the actual UAT command
exec "$@"
```

### Phase 4: Testing and Validation

#### Task 7: Create Test Suite
```python
# test-uat-hooks.py
import unittest
import json
from uat_session_manager import UATSessionManager

class TestUATDetection(unittest.TestCase):
    def setUp(self):
        self.manager = UATSessionManager()
        
    def test_uat_login_detection(self):
        """Test detection of UAT login scenario"""
        detected, scenario = self.manager.detect_uat_intent("Run UAT for login flow")
        self.assertTrue(detected)
        self.assertEqual(scenario, "login-flow")
        
    def test_uat_vehicle_detection(self):
        """Test detection of UAT vehicle CRUD"""
        detected, scenario = self.manager.detect_uat_intent("Execute UAT vehicle CRUD tests")
        self.assertTrue(detected)
        self.assertEqual(scenario, "vehicle-crud")
        
    def test_no_uat_keyword(self):
        """Test rejection without UAT keyword"""
        detected, scenario = self.manager.detect_uat_intent("Test login flow")
        self.assertFalse(detected)
        
    def test_uat_without_scenario(self):
        """Test UAT keyword without scenario match"""
        detected, scenario = self.manager.detect_uat_intent("Run UAT tests")
        self.assertFalse(detected)
```

### Phase 5: Documentation

#### Task 8: Create User Guide
```markdown
# UAT Testing with Claude Code

## Quick Start

To run UAT tests, use phrases that include:
1. The word "uat" (required)
2. A scenario keyword: login, vehicle, crud, error, handling

## Examples

✅ Valid UAT Requests:
- "Run UAT for login flow"
- "Execute UAT vehicle CRUD tests"
- "Test UAT error handling scenarios"
- "Perform UAT login testing"

❌ Invalid Requests (won't trigger UAT):
- "Test login flow" (missing "uat")
- "Run UAT tests" (missing scenario keyword)
- "Test vehicle operations" (missing "uat")

## What Happens

1. Claude detects your UAT intent
2. Initializes a UAT session
3. Follows VERA methodology automatically
4. Generates comprehensive reports
```

## File Cleanup Plan

### Files to Delete
```bash
# Old hook implementations
rm -f /mnt/c/projects/vrp-system/v4/hooks/*.sh
rm -f /mnt/c/projects/vrp-system/v4/hooks/*.py
rm -f /mnt/c/projects/vrp-system/v4/hooks/hooks.json

# Obsolete test runner
rm -f /mnt/c/projects/vrp-system/v4/uat/uat-test-runner.cjs
```

### Files to Keep
- `/uat/scenarios/*.js` - Scenario definitions
- `/uat/UAT-COMPLETE-WORKFLOW.md` - VERA methodology
- `/uat/CLAUDE.md` - Claude integration guide
- `/uat/hooks/` - New Python hook implementations

## Success Criteria

1. **Detection Works**: UAT triggers only with "uat" + scenario keywords
2. **VERA Preserved**: All steps of VERA methodology execute
3. **Hooks Function**: Claude Code hooks intercept and enhance commands
4. **Reports Generate**: Comprehensive reports created automatically
5. **No Direct MCP**: Hooks bridge between UAT framework and MCP tools

## Timeline

- Phase 1 (Core Hooks): 2 hours
- Phase 2 (Configuration): 30 minutes
- Phase 3 (Integration): 1 hour
- Phase 4 (Testing): 1 hour
- Phase 5 (Documentation): 30 minutes

Total: ~5 hours

## Next Steps

1. Implement core Python hooks with proper detection logic
2. Configure hooks in `.claude/settings.local.json`
3. Test with various UAT phrases
4. Clean up obsolete files
5. Document usage patterns