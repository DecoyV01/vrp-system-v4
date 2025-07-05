# Claude Code Hook System Specifications

**Document ID**: claude-code-hook-specifications  
**Created**: July 5, 2025  
**Purpose**: Technical analysis of Claude Code's built-in hook system

## Hook Event Types

### 1. PreToolUse Hook
**Timing**: Executed before any tool is called by Claude Code  
**Purpose**: Validate, modify, or block tool usage  
**Parallel Execution**: Yes, multiple PreToolUse hooks can be registered

### 2. PostToolUse Hook  
**Timing**: Executed after tool execution completes  
**Purpose**: Process tool results, log execution data, trigger follow-up actions  
**Parallel Execution**: Yes, multiple PostToolUse hooks can be registered

### 3. Stop Hook
**Timing**: Executed when Claude Code concludes its response  
**Purpose**: Cleanup, finalization, session management  
**Parallel Execution**: Yes, multiple Stop hooks can be registered

### 4. Notification Hook
**Timing**: Executed when notifications are sent  
**Purpose**: Custom notification handling  
**Parallel Execution**: Yes

### 5. SubagentStop Hook
**Timing**: Executed when subagent (Task tool) concludes  
**Purpose**: Subagent-specific cleanup and processing  
**Parallel Execution**: Yes

## Hook Input Format Specifications

### PreToolUse Hook Input
```json
{
  "tool_name": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com",
    "timeout": 30000,
    "waitUntil": "networkidle"
  },
  "session_id": "claude-session-abc123def456",
  "user_message": "Please navigate to the login page and test authentication",
  "timestamp": "2025-07-05T14:30:22.123Z",
  "context": {
    "conversation_id": "conv-789xyz",
    "message_index": 5
  }
}
```

### PostToolUse Hook Input
```json
{
  "tool_name": "mcp__playwright__playwright_navigate",
  "parameters": {
    "url": "https://example.com",
    "timeout": 30000,
    "waitUntil": "networkidle"
  },
  "result": {
    "success": true,
    "url": "https://example.com/auth/login",
    "statusCode": 200,
    "loadTime": 2340,
    "networkActivity": {
      "requestCount": 12,
      "totalBytes": 245680
    }
  },
  "execution_time_ms": 2450,
  "session_id": "claude-session-abc123def456",
  "timestamp": "2025-07-05T14:30:24.573Z"
}
```

### Stop Hook Input
```json
{
  "session_id": "claude-session-abc123def456",
  "reason": "normal|timeout|error|user_interrupt",
  "timestamp": "2025-07-05T14:35:15.890Z",
  "session_duration_ms": 293450,
  "total_tool_calls": 8,
  "context": {
    "conversation_id": "conv-789xyz",
    "final_message_index": 12
  }
}
```

## Hook Output Format Specifications

### Response Actions
- **"approve"**: Allow tool execution to proceed unchanged
- **"modify"**: Modify tool parameters before execution
- **"block"**: Prevent tool execution entirely
- **"error"**: Indicate hook execution error

### PreToolUse Hook Output Examples

**Approve Response**:
```json
{
  "action": "approve",
  "message": "Tool execution approved",
  "hook": "claude-uat-orchestrator",
  "timestamp": "2025-07-05T14:30:22.456Z",
  "data": {
    "validation_passed": true,
    "context": "regular_tool_usage"
  }
}
```

**Modify Response**:
```json
{
  "action": "modify",
  "message": "Parameters enhanced for UAT context",
  "hook": "claude-uat-orchestrator",
  "timestamp": "2025-07-05T14:30:22.456Z",
  "parameters": {
    "url": "https://vrp-system-v4.pages.dev/auth/login",
    "timeout": 10000,
    "waitUntil": "networkidle",
    "headless": false,
    "width": 1280,
    "height": 720,
    "_uat_metadata": {
      "scenario": "login-flow",
      "sessionId": "uat-20250705-143022-abc123",
      "step": 1,
      "action": "navigate"
    }
  }
}
```

**Block Response**:
```json
{
  "action": "block",
  "message": "Browser MCP tools require active UAT session. Use natural language to specify UAT scenario (e.g., 'test login-flow scenario')",
  "hook": "claude-uat-orchestrator",
  "timestamp": "2025-07-05T14:30:22.456Z",
  "data": {
    "reason": "unauthorized_browser_usage",
    "suggestion": "Initialize UAT context with scenario name"
  }
}
```

### PostToolUse Hook Output
```json
{
  "action": "success",
  "message": "Tool execution tracked successfully",
  "hook": "claude-uat-tracker",
  "timestamp": "2025-07-05T14:30:25.123Z",
  "data": {
    "execution_recorded": true,
    "progress_updated": true,
    "step_completed": true,
    "next_step": 2
  }
}
```

### Stop Hook Output
```json
{
  "action": "success",
  "message": "UAT session finalized and archived",
  "hook": "claude-uat-finalizer",
  "timestamp": "2025-07-05T14:35:16.234Z",
  "data": {
    "session_finalized": true,
    "report_generated": "/uat/reports/session-report-abc123-20250705.json",
    "files_archived": "/uat/archive/2025-07/session-abc123-20250705-143516",
    "cleanup_completed": true
  }
}
```

## Hook Execution Context

### Environment
- **Working Directory**: Project root directory (`/mnt/c/projects/vrp-system/v4/`)
- **User Permissions**: Full user permissions (same as Claude Code process)
- **Timeout**: 60 seconds maximum execution time
- **Shell**: Bash shell with standard utilities available
- **Dependencies**: jq, node.js, and other system utilities

### Available Data
- **User Messages**: Access to user's input message content
- **Tool Information**: Complete tool name and parameters
- **Session Context**: Claude Code session ID and timing information
- **File System**: Full read/write access to project files
- **Environment Variables**: Access to system environment

### Limitations
- **No Interactive Input**: Hooks cannot prompt user for input
- **Timeout Enforcement**: Must complete within 60 seconds
- **No Network Restrictions**: Full network access available
- **Parallel Execution**: Multiple hooks of same type run concurrently

## Hook Registration Process

### Using `/hooks` Command
1. User enters `/hooks` in Claude Code session
2. Claude Code presents hook event selection menu
3. User selects event type (PreToolUse, PostToolUse, Stop, etc.)
4. User provides shell command to execute for that event
5. Claude Code validates and registers the hook
6. Hook executes automatically on subsequent events

### Registration Commands
```bash
# Register PreToolUse hook
/hooks → Select "1. PreToolUse" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-orchestrator.sh

# Register PostToolUse hook  
/hooks → Select "2. PostToolUse" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-tracker.sh

# Register Stop hook
/hooks → Select "4. Stop" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-finalizer.sh
```

### Hook Management
- **List Hooks**: View currently registered hooks
- **Update Hooks**: Modify existing hook commands
- **Remove Hooks**: Unregister hooks
- **Validate Hooks**: Test hook execution

## Input Processing Requirements

### JSON Parsing
- All hook input is provided as JSON via stdin
- Must use `jq` or equivalent for robust JSON parsing
- Handle malformed or incomplete JSON gracefully
- Extract required fields with fallback defaults

### Field Validation
- Validate all required fields are present
- Provide sensible defaults for optional fields
- Handle missing or null values appropriately
- Sanitize string inputs to prevent injection

### Error Handling
- Catch and handle all parsing errors
- Provide meaningful error messages
- Log errors for debugging
- Return appropriate error responses

## Output Format Requirements

### JSON Structure
- All responses must be valid JSON
- Required fields: action, message, hook, timestamp
- Optional fields: parameters (for modify), data (for metadata)
- Use ISO 8601 timestamps with timezone

### Response Validation
- Validate response JSON before output
- Ensure required fields are present
- Verify action values are valid
- Check timestamp format compliance

### Error Responses
- Always return valid JSON even for errors
- Include error details in message field
- Use "error" action for hook execution failures
- Provide debugging information in data field

## Performance Requirements

### Execution Time
- PreToolUse hooks: < 5 seconds (to avoid blocking tool execution)
- PostToolUse hooks: < 10 seconds (background processing acceptable)
- Stop hooks: < 30 seconds (final cleanup can take longer)
- All hooks: < 60 seconds (hard timeout enforced by Claude Code)

### Resource Usage
- Minimal memory footprint
- Efficient file I/O operations
- Avoid blocking operations where possible
- Clean up resources properly

### Concurrency
- Handle concurrent execution of multiple hooks
- Use file locking for shared resources
- Avoid race conditions in state management
- Design for parallel hook execution

## Security Considerations

### Input Validation
- Validate all input parameters
- Sanitize file paths and shell commands
- Prevent command injection attacks
- Validate JSON structure and content

### File System Access
- Use absolute paths only
- Validate file permissions before access
- Prevent directory traversal attacks
- Clean up temporary files

### Process Security
- Avoid executing untrusted shell commands
- Validate executable paths
- Use secure temporary file creation
- Handle subprocess execution safely

---

**Analysis Complete**: This specification provides the foundation for implementing Claude Code compatible UAT hooks.