# Claude Code Session State Management System

**Document ID**: claude-session-state-management  
**Created**: July 5, 2025  
**Purpose**: Design specification for managing UAT session state in Claude Code hooks

## Overview

The session state management system provides thread-safe, file-based persistence for UAT session data that works seamlessly with Claude Code's session lifecycle. Unlike the previous system that relied on environment variables, this design uses Claude Code session IDs as the primary key for state management.

## State Architecture

### File-Based State Storage
```
/uat/sessions/
├── claude-session-{claude_session_id}.json    # Active session state
├── claude-session-{claude_session_id}.lock    # File lock for atomic operations
└── temp-{timestamp}-{random}.json             # Temporary files for atomic writes
```

### State File Lifecycle
1. **Creation**: When UAT context is detected in PreToolUse hook
2. **Updates**: During tool execution via PostToolUse hook
3. **Finalization**: During session end via Stop hook
4. **Cleanup**: Automatic cleanup of temporary and expired files

## Session State Schema

### Core Session State Structure
```json
{
  "meta": {
    "version": "1.0.0",
    "created": "2025-07-05T14:30:22.123Z",
    "updated": "2025-07-05T14:35:45.678Z",
    "format": "claude-uat-session-state"
  },
  "session": {
    "claudeSessionId": "claude-session-abc123def456",
    "uatSessionId": "uat-20250705-143022-xyz789",
    "scenarioName": "login-flow",
    "mode": "production",
    "status": "active",
    "startTime": "2025-07-05T14:30:22.123Z",
    "lastActivity": "2025-07-05T14:35:45.678Z"
  },
  "scenario": {
    "name": "login-flow",
    "description": "User authentication flow testing",
    "totalSteps": 5,
    "currentStep": 2,
    "completedSteps": 1,
    "estimatedDuration": 45000,
    "actualDuration": null,
    "steps": [
      {
        "stepNumber": 1,
        "action": "navigate",
        "description": "Navigate to login page",
        "status": "completed",
        "startTime": "2025-07-05T14:30:25.000Z",
        "endTime": "2025-07-05T14:30:27.340Z",
        "duration": 2340
      },
      {
        "stepNumber": 2,
        "action": "fill",
        "description": "Fill login credentials",
        "status": "in_progress",
        "startTime": "2025-07-05T14:30:28.000Z",
        "endTime": null,
        "duration": null
      }
    ]
  },
  "execution": {
    "toolCalls": [
      {
        "id": "tool-call-001",
        "toolName": "mcp__playwright__playwright_navigate",
        "parameters": {
          "url": "https://vrp-system-v4.pages.dev/auth/login",
          "timeout": 10000
        },
        "result": {
          "success": true,
          "url": "https://vrp-system-v4.pages.dev/auth/login",
          "statusCode": 200,
          "loadTime": 2340
        },
        "executionTime": 2450,
        "timestamp": "2025-07-05T14:30:25.000Z",
        "stepNumber": 1,
        "success": true
      }
    ],
    "errors": [],
    "warnings": []
  },
  "validation": {
    "frameworkInjected": true,
    "healthChecks": [
      {
        "timestamp": "2025-07-05T14:30:27.500Z",
        "type": "page_load",
        "result": "success",
        "data": {
          "isLoggedIn": false,
          "currentRoute": "/auth/login",
          "hasErrors": false
        }
      }
    ],
    "assertions": []
  },
  "artifacts": {
    "screenshots": [
      {
        "name": "uat-20250705-143022-xyz789-login-flow-step1-navigate-143027",
        "path": "/uat/screenshots/uat-20250705-143022-xyz789/uat-20250705-143022-xyz789-login-flow-step1-navigate-143027.png",
        "size": 245680,
        "timestamp": "2025-07-05T14:30:27.800Z",
        "stepNumber": 1,
        "action": "navigate",
        "success": true
      }
    ],
    "logs": [],
    "reports": []
  },
  "performance": {
    "totalExecutionTime": 15340,
    "averageStepDuration": 7670,
    "fastestStep": {
      "stepNumber": 1,
      "duration": 2340,
      "action": "navigate"
    },
    "slowestStep": null,
    "toolCallCount": 1,
    "errorCount": 0,
    "successRate": 1.0
  },
  "context": {
    "userMessage": "Please test the login flow scenario",
    "detectionConfidence": 95,
    "autoInitialized": true,
    "baseUrl": "https://vrp-system-v4.pages.dev",
    "screenshotDirectory": "/uat/screenshots/uat-20250705-143022-xyz789",
    "reportDirectory": "/uat/reports"
  }
}
```

## Atomic File Operations

### File Locking Mechanism
```bash
# Acquire exclusive file lock
acquire_session_lock() {
    local claude_session_id="$1"
    local lock_file="/uat/sessions/claude-session-${claude_session_id}.lock"
    local timeout_seconds=30
    local start_time=$(date +%s)
    
    while true; do
        # Try to create lock file exclusively
        if (set -C; echo $$ > "$lock_file") 2>/dev/null; then
            # Successfully acquired lock
            echo "$lock_file"
            return 0
        fi
        
        # Check if lock is stale (older than 5 minutes)
        if [[ -f "$lock_file" ]]; then
            local lock_age=$(($(date +%s) - $(stat -c %Y "$lock_file" 2>/dev/null || echo 0)))
            if [[ $lock_age -gt 300 ]]; then
                # Remove stale lock
                rm -f "$lock_file" 2>/dev/null || true
                continue
            fi
        fi
        
        # Check timeout
        local current_time=$(date +%s)
        if [[ $((current_time - start_time)) -gt $timeout_seconds ]]; then
            return 1  # Timeout
        fi
        
        # Wait and retry
        sleep 0.1
    done
}

# Release file lock
release_session_lock() {
    local lock_file="$1"
    rm -f "$lock_file" 2>/dev/null || true
}
```

### Atomic Write Operations
```bash
# Atomic write with locking
write_session_state() {
    local claude_session_id="$1"
    local session_data="$2"
    local session_file="/uat/sessions/claude-session-${claude_session_id}.json"
    
    # Acquire lock
    local lock_file
    if ! lock_file=$(acquire_session_lock "$claude_session_id"); then
        return 1  # Failed to acquire lock
    fi
    
    # Create temporary file
    local temp_file="/uat/sessions/temp-$(date +%s%N)-$$.json"
    
    # Write to temporary file
    if echo "$session_data" | jq '.' > "$temp_file" 2>/dev/null; then
        # Atomic move to final location
        if mv "$temp_file" "$session_file"; then
            release_session_lock "$lock_file"
            return 0  # Success
        fi
    fi
    
    # Cleanup on failure
    rm -f "$temp_file" 2>/dev/null || true
    release_session_lock "$lock_file"
    return 1  # Failure
}
```

### Atomic Read Operations
```bash
# Safe read with validation
read_session_state() {
    local claude_session_id="$1"
    local session_file="/uat/sessions/claude-session-${claude_session_id}.json"
    
    # Check if file exists
    if [[ ! -f "$session_file" ]]; then
        return 1  # File doesn't exist
    fi
    
    # Read and validate JSON
    local session_data
    if session_data=$(cat "$session_file" 2>/dev/null) && echo "$session_data" | jq empty 2>/dev/null; then
        echo "$session_data"
        return 0  # Success
    fi
    
    return 1  # Invalid or unreadable file
}
```

## State Management Functions

### Session Initialization
```bash
create_session_state() {
    local claude_session_id="$1"
    local scenario_name="$2"
    local user_message="$3"
    local detection_confidence="$4"
    
    # Generate UAT session ID
    local uat_session_id="uat-$(date +%Y%m%d-%H%M%S)-$(head -c 6 /dev/urandom | base64 | tr -d '=+/' | tr '[:upper:]' '[:lower:]')"
    
    # Load scenario information
    local scenario_data
    if ! scenario_data=$(load_scenario_info "$scenario_name"); then
        return 1  # Invalid scenario
    fi
    
    # Create session state
    local session_state
    session_state=$(jq -n \
        --arg claude_id "$claude_session_id" \
        --arg uat_id "$uat_session_id" \
        --arg scenario "$scenario_name" \
        --arg message "$user_message" \
        --argjson confidence "$detection_confidence" \
        --argjson scenario_info "$scenario_data" \
        '{
            meta: {
                version: "1.0.0",
                created: now | todate,
                updated: now | todate,
                format: "claude-uat-session-state"
            },
            session: {
                claudeSessionId: $claude_id,
                uatSessionId: $uat_id,
                scenarioName: $scenario,
                mode: "production",
                status: "active",
                startTime: now | todate,
                lastActivity: now | todate
            },
            scenario: $scenario_info,
            execution: {
                toolCalls: [],
                errors: [],
                warnings: []
            },
            validation: {
                frameworkInjected: false,
                healthChecks: [],
                assertions: []
            },
            artifacts: {
                screenshots: [],
                logs: [],
                reports: []
            },
            performance: {
                totalExecutionTime: 0,
                averageStepDuration: 0,
                fastestStep: null,
                slowestStep: null,
                toolCallCount: 0,
                errorCount: 0,
                successRate: 0
            },
            context: {
                userMessage: $message,
                detectionConfidence: $confidence,
                autoInitialized: true,
                baseUrl: "https://vrp-system-v4.pages.dev",
                screenshotDirectory: ("/uat/screenshots/" + $uat_id),
                reportDirectory: "/uat/reports"
            }
        }')
    
    # Create necessary directories
    mkdir -p "/uat/screenshots/$uat_session_id"
    mkdir -p "/uat/reports"
    mkdir -p "/uat/sessions"
    
    # Write session state
    if write_session_state "$claude_session_id" "$session_state"; then
        echo "$session_state"
        return 0
    fi
    
    return 1  # Failed to write state
}
```

### State Updates
```bash
update_session_state() {
    local claude_session_id="$1"
    local update_data="$2"
    
    # Read current state
    local current_state
    if ! current_state=$(read_session_state "$claude_session_id"); then
        return 1  # Failed to read current state
    fi
    
    # Apply updates
    local updated_state
    updated_state=$(echo "$current_state" | jq \
        --argjson updates "$update_data" \
        '. * $updates | .meta.updated = now | todate | .session.lastActivity = now | todate')
    
    # Write updated state
    write_session_state "$claude_session_id" "$updated_state"
}
```

### Tool Call Recording
```bash
add_tool_call() {
    local claude_session_id="$1"
    local tool_call_data="$2"
    
    # Create update data
    local update_data
    update_data=$(jq -n \
        --argjson tool_call "$tool_call_data" \
        '{
            execution: {
                toolCalls: [.execution.toolCalls[], $tool_call]
            },
            performance: {
                toolCallCount: (.performance.toolCallCount + 1)
            }
        }')
    
    update_session_state "$claude_session_id" "$update_data"
}
```

### Progress Tracking
```bash
update_scenario_progress() {
    local claude_session_id="$1"
    local step_number="$2"
    local step_status="$3"  # "in_progress", "completed", "failed"
    
    local update_data
    update_data=$(jq -n \
        --argjson step_num "$step_number" \
        --arg status "$step_status" \
        '{
            scenario: {
                currentStep: $step_num,
                steps: [
                    .scenario.steps[] | 
                    if .stepNumber == $step_num then
                        . + {
                            status: $status,
                            endTime: (if $status == "completed" then now | todate else .endTime end),
                            duration: (if $status == "completed" and .startTime then 
                                ((now - (.startTime | fromdateiso8601)) * 1000 | floor) else .duration end)
                        }
                    else . end
                ]
            }
        }')
    
    update_session_state "$claude_session_id" "$update_data"
}
```

## Session Lifecycle Management

### Session Detection
```bash
is_session_active() {
    local claude_session_id="$1"
    local session_file="/uat/sessions/claude-session-${claude_session_id}.json"
    
    if [[ -f "$session_file" ]]; then
        local session_data
        if session_data=$(read_session_state "$claude_session_id"); then
            local status=$(echo "$session_data" | jq -r '.session.status // "unknown"')
            [[ "$status" == "active" ]]
        else
            return 1
        fi
    else
        return 1
    fi
}
```

### Session Cleanup
```bash
cleanup_session() {
    local claude_session_id="$1"
    local session_file="/uat/sessions/claude-session-${claude_session_id}.json"
    local lock_file="/uat/sessions/claude-session-${claude_session_id}.lock"
    
    # Mark session as completed
    local final_update
    final_update=$(jq -n '{
        session: {
            status: "completed",
            endTime: now | todate
        }
    }')
    
    update_session_state "$claude_session_id" "$final_update"
    
    # Clean up lock files
    rm -f "$lock_file" 2>/dev/null || true
    
    # Clean up old temporary files
    find "/uat/sessions" -name "temp-*" -type f -mmin +60 -delete 2>/dev/null || true
}
```

### Stale Session Detection
```bash
cleanup_stale_sessions() {
    local max_age_hours=24
    local sessions_dir="/uat/sessions"
    
    # Find sessions older than max_age_hours
    find "$sessions_dir" -name "claude-session-*.json" -type f -mtime "+$max_age_hours" | while read -r session_file; do
        local claude_session_id
        claude_session_id=$(basename "$session_file" .json | sed 's/claude-session-//')
        
        # Archive session before cleanup
        archive_session "$claude_session_id"
        
        # Remove session files
        rm -f "$session_file"
        rm -f "${sessions_dir}/claude-session-${claude_session_id}.lock"
    done
}
```

## Cross-Hook Communication

### Shared State Access
```bash
# Get session context for other hooks
get_session_context() {
    local claude_session_id="$1"
    
    if ! is_session_active "$claude_session_id"; then
        return 1  # No active session
    fi
    
    local session_data
    if session_data=$(read_session_state "$claude_session_id"); then
        # Extract relevant context for hooks
        echo "$session_data" | jq '{
            scenario: .scenario.name,
            uatSessionId: .session.uatSessionId,
            currentStep: .scenario.currentStep,
            totalSteps: .scenario.totalSteps,
            mode: .session.mode,
            baseUrl: .context.baseUrl,
            screenshotDirectory: .context.screenshotDirectory
        }'
    fi
}
```

### Hook Coordination
```bash
# Signal between hooks
set_hook_signal() {
    local claude_session_id="$1"
    local signal_name="$2"
    local signal_data="$3"
    
    local update_data
    update_data=$(jq -n \
        --arg signal "$signal_name" \
        --argjson data "$signal_data" \
        '{
            context: {
                hooks: {
                    ($signal): {
                        data: $data,
                        timestamp: now | todate
                    }
                }
            }
        }')
    
    update_session_state "$claude_session_id" "$update_data"
}

# Check for hook signals
get_hook_signal() {
    local claude_session_id="$1"
    local signal_name="$2"
    
    local session_data
    if session_data=$(read_session_state "$claude_session_id"); then
        echo "$session_data" | jq -r ".context.hooks.${signal_name} // null"
    fi
}
```

## Error Handling and Recovery

### Corruption Detection
```bash
validate_session_state() {
    local claude_session_id="$1"
    
    local session_data
    if ! session_data=$(read_session_state "$claude_session_id"); then
        return 1  # Cannot read file
    fi
    
    # Validate required fields
    local required_fields=(
        ".meta.version"
        ".session.claudeSessionId"
        ".session.uatSessionId"
        ".session.scenarioName"
        ".scenario.name"
        ".execution"
        ".performance"
    )
    
    for field in "${required_fields[@]}"; do
        if ! echo "$session_data" | jq -e "$field" >/dev/null 2>&1; then
            return 1  # Missing required field
        fi
    done
    
    return 0  # Valid state
}
```

### Recovery Procedures
```bash
recover_session_state() {
    local claude_session_id="$1"
    
    # Try to read current state
    if validate_session_state "$claude_session_id"; then
        return 0  # State is valid
    fi
    
    # Look for backup files
    local backup_file="/uat/sessions/claude-session-${claude_session_id}.backup"
    if [[ -f "$backup_file" ]]; then
        cp "$backup_file" "/uat/sessions/claude-session-${claude_session_id}.json"
        if validate_session_state "$claude_session_id"; then
            return 0  # Recovered from backup
        fi
    fi
    
    return 1  # Cannot recover
}
```

## Performance Optimization

### Caching Strategy
```bash
# Cache frequently accessed data
declare -A SESSION_CACHE
CACHE_TTL=30  # 30 seconds

get_cached_session() {
    local claude_session_id="$1"
    local cache_key="session_${claude_session_id}"
    local cache_entry="${SESSION_CACHE[$cache_key]}"
    
    if [[ -n "$cache_entry" ]]; then
        local timestamp=$(echo "$cache_entry" | cut -d'|' -f1)
        local data=$(echo "$cache_entry" | cut -d'|' -f2-)
        
        if [[ $(($(date +%s) - timestamp)) -lt $CACHE_TTL ]]; then
            echo "$data"
            return 0
        fi
    fi
    
    return 1  # Cache miss or expired
}

cache_session() {
    local claude_session_id="$1"
    local session_data="$2"
    local cache_key="session_${claude_session_id}"
    
    SESSION_CACHE[$cache_key]="$(date +%s)|$session_data"
}
```

### Batch Operations
```bash
batch_update_session() {
    local claude_session_id="$1"
    shift
    local updates=("$@")
    
    # Combine multiple updates into single operation
    local combined_update="{}"
    for update in "${updates[@]}"; do
        combined_update=$(echo "$combined_update" | jq ". * $update")
    done
    
    update_session_state "$claude_session_id" "$combined_update"
}
```

---

**State Management Design Complete**: This system provides robust, thread-safe session state management for Claude Code UAT hooks.