# Claude Code UAT Framework Integration Guide

## Overview

The VRP System UAT framework is now fully integrated with Claude Code through built-in hooks, providing seamless automatic UAT detection and execution using natural language requests.

## Integration Architecture

### Claude Code Hooks System

The integration uses Claude Code's built-in hooks to:

1. **Detect UAT Intent** - Automatically recognize UAT requests from natural language
2. **Initialize Sessions** - Create tracked UAT sessions with unique IDs
3. **Enhance Commands** - Modify Bash and Browser MCP commands for UAT context
4. **Track Progress** - Monitor execution with VERA methodology phases
5. **Generate Reports** - Create comprehensive reports with screenshots and metrics

### Hook Components

```
PreToolUse Hook     → uat-orchestrator.py
PostToolUse Hook    → uat-progress-tracker.py
Stop Hook           → uat-finalizer.py
```

## How It Works

### 1. Natural Language Detection

When you use phrases like:
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"
"Test UAT error handling"
```

The system automatically detects:
- **"uat" keyword** (required)
- **Scenario keywords**: login, vehicle, crud, error, handling

### 2. Automatic Workflow

```
User Request → UAT Detection → Session Init → VERA Execution → Report Generation
```

#### Detection Phase
- `uat-orchestrator.py` (PreToolUse) analyzes user messages
- Identifies UAT intent and maps to scenario files
- Initializes UAT session with unique ID

#### Execution Phase
- Commands are enhanced with UAT parameters
- Browser MCP and Bash tools are intercepted
- VERA methodology is automatically followed

#### Tracking Phase
- `uat-progress-tracker.py` (PostToolUse) monitors progress
- Screenshots and logs are captured
- Session state is updated in real-time

#### Finalization Phase
- `uat-finalizer.py` (Stop) generates comprehensive reports
- VERA phase breakdown is created
- Session artifacts are archived

### 3. Scenario Mapping

The hooks automatically map requests to scenario files:

```
"uat" + "login" → login-flow.cjs
"uat" + "vehicle" → vehicle-crud.cjs
"uat" + "crud" → vehicle-crud.cjs
"uat" + "error" → error-handling.cjs
"uat" + "handling" → error-handling.cjs
```

## Technical Implementation

### Hook Configuration

Located in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-orchestrator.py",
      "matcher": { "tool": "Bash|mcp__browsermcp__.*|mcp__playwright__.*" }
    }],
    "PostToolUse": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-progress-tracker.py",
      "matcher": { "tool": "Bash|mcp__browsermcp__.*|mcp__playwright__.*" }
    }],
    "Stop": [{
      "command": "python3 /mnt/c/projects/vrp-system/v4/uat/hooks/uat-finalizer.py"
    }]
  }
}
```

### Session Management

UAT sessions are tracked in `/uat/sessions/`:
- `current.json` - Active session data
- `{sessionId}/session.json` - Completed session archives

### Browser MCP Integration

The framework supports both:
1. **Browser MCP** (`mcp__browsermcp__.*`) - Primary
2. **Playwright MCP** (`mcp__playwright__.*`) - Fallback

### VERA Methodology Implementation

#### Verify Phase
- Health check validation (`window.__UAT_HEALTH__`)
- Precondition verification
- Element existence checks
- State validation

#### Execute Phase
- Browser navigation and interaction
- Form filling and submission
- User action simulation
- API calls and data manipulation

#### Record Phase
- Screenshot capture with session prefixes
- DOM state snapshots
- Console log collection
- Network request monitoring

#### Analyze Phase
- Result validation against expected outcomes
- Error detection and classification
- Performance metric collection
- Success/failure determination

## Usage Examples

### Simple UAT Request
```
Input: "Run UAT for login flow"

What Happens:
1. Hook detects "uat" + "login" → maps to login-flow.cjs
2. Session initialized: session-20250705-143022
3. VERA phases executed automatically
4. Report generated: uat-report-20250705-143022.json
```

### Complex UAT Request
```
Input: "Execute UAT vehicle CRUD tests with error handling"

What Happens:
1. Hook detects multiple scenarios
2. Executes vehicle-crud.cjs and error-handling.cjs
3. Tracks progress across both scenarios
4. Generates combined report
```

### Manual Fallback
If hooks are disabled, manual commands still work:
```bash
node uat-test-runner.cjs scenario login-flow --debug
```

## Benefits of Hook Integration

### 1. Natural Language Interface
- No need to remember complex command syntax
- Intuitive UAT requests using plain English
- Automatic scenario mapping

### 2. Seamless Execution
- No manual session management
- Automatic VERA methodology
- Real-time progress tracking

### 3. Enhanced Browser Integration
- Automatic screenshot organization
- Session-aware command enhancement
- Browser MCP and Playwright MCP support

### 4. Comprehensive Reporting
- VERA phase breakdown
- Session metrics and timing
- Artifact organization and archival

### 5. Error Handling
- Automatic failure capture
- Debug information collection
- Recovery suggestions

## File Structure

```
/uat/
├── hooks/
│   ├── uat-orchestrator.py      # PreToolUse hook
│   ├── uat-progress-tracker.py  # PostToolUse hook
│   ├── uat-finalizer.py         # Stop hook
│   ├── uat-session-manager.py   # Core session management
│   └── README.md                # Hook documentation
├── scenarios/
│   ├── login-flow.cjs           # Login testing scenario
│   ├── vehicle-crud.cjs         # Vehicle CRUD scenario
│   └── error-handling.cjs       # Error handling scenario
├── sessions/
│   ├── current.json             # Active session
│   └── {sessionId}/             # Archived sessions
└── reports/
    └── uat-report-*.json        # Generated reports
```

## Comparison: Before vs After

### Before Hooks Integration
```bash
# Manual process
cd /mnt/c/projects/vrp-system/v4/uat
node uat-test-runner.cjs validate
node uat-test-runner.cjs init
node uat-test-runner.cjs scenario login-flow --debug
node uat-test-runner.cjs report
```

### After Hooks Integration
```
# Natural language
"Run UAT for login flow"
```

## Troubleshooting

### Hook Not Triggering
1. Verify hooks configuration in `.claude/settings.local.json`
2. Check that message includes both "uat" and scenario keywords
3. Ensure hook scripts are executable

### Session Issues
```bash
# Check active session
cat sessions/current.json

# List completed sessions
ls sessions/*/session.json
```

### Browser Integration Problems
1. Verify Browser MCP is enabled in settings
2. Check Playwright MCP as fallback
3. Use manual commands if needed

## Migration Guide

### From Manual Commands
Old approach:
```bash
node uat-test-runner.cjs scenario login-flow --debug
```

New approach:
```
"Run UAT for login flow"
```

### From External Scripts
The hooks replace the need for external script orchestration. UAT commands are now automatically enhanced and tracked.

## Future Enhancements

### Planned Features
1. **Multi-scenario execution** from single request
2. **Custom scenario parameters** via natural language
3. **Advanced error recovery** and retry logic
4. **Performance benchmarking** integration
5. **CI/CD pipeline** hook integration

### Extensibility
The hook system can be extended to support:
- Custom validation rules
- Additional browser automation tools
- Third-party reporting systems
- Performance monitoring integration

## Documentation References

- **Main README**: `README.md`
- **Commands Guide**: `UAT-COMMANDS.md`
- **Complete Workflow**: `UAT-COMPLETE-WORKFLOW.md`
- **Hook Details**: `hooks/README.md`
- **Scenario Creation**: `scenarios/HOW-TO-CREATE-SCENARIOS.md`

---

**Generated by VRP System UAT Framework v2.0.0 with Claude Code Integration**