#!/bin/bash
#
# UAT Progress Tracking Hook (PostToolUse)
# 
# Records tool execution results and updates scenario progress after successful Browser MCP execution.
# This hook runs after each Browser MCP tool to:
# - Record tool execution results in session state
# - Update scenario step progress automatically
# - Capture and organize screenshots with proper naming
# - Log validation results and errors
# - Update session timing and performance metrics
#
# Hook Type: PostToolUse
# Priority: N/A (PostToolUse hooks run after tool execution)
#

set -euo pipefail

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // empty')
TOOL_PARAMS=$(echo "$HOOK_INPUT" | jq -r '.parameters // {}')
TOOL_RESULT=$(echo "$HOOK_INPUT" | jq -r '.result // {}')
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
EXECUTION_TIME=$(echo "$HOOK_INPUT" | jq -r '.execution_time_ms // 0')

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="uat-progress-tracker"
HOOK_TIMEOUT=20
LOG_LEVEL="${UAT_LOG_LEVEL:-info}"

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_debug() { [[ "$LOG_LEVEL" == "debug" ]] && echo -e "${BLUE}[DEBUG]${NC} $HOOK_NAME: $1" >&2; }
log_info() { echo -e "${BLUE}[INFO]${NC} $HOOK_NAME: $1" >&2; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $HOOK_NAME: $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $HOOK_NAME: $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $HOOK_NAME: $1" >&2; }

# Function to output hook response
output_response() {
    local action="$1"
    local message="$2"
    local data="${3:-{}}"
    
    local response="{
        \"action\": \"$action\",
        \"message\": \"$message\",
        \"hook\": \"$HOOK_NAME\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"data\": $data
    }"
    
    echo "$response"
}

# Check if tool is a Browser MCP tool
is_browser_mcp_tool() {
    local tool="$1"
    case "$tool" in
        mcp__playwright__*) return 0 ;;
        *) return 1 ;;
    esac
}

# Check if UAT mode is active
is_uat_active() {
    [[ "${UAT_HOOKS_ENABLED:-false}" == "true" && -n "${UAT_ACTIVE_SCENARIO:-}" ]]
}

# Update state manager with tool execution result
update_session_state() {
    local step_data="$1"
    
    if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
        node "$UAT_ROOT/engine/hook-state-manager.js" add-step "$step_data" >/dev/null 2>&1 || {
            log_warning "Failed to update session state"
            return 1
        }
    else
        log_warning "State manager not found"
        return 1
    fi
}

# Extract screenshot information from tool result
extract_screenshot_info() {
    local tool_name="$1"
    local tool_params="$2"
    local tool_result="$3"
    
    if [[ "$tool_name" != "mcp__playwright__playwright_screenshot" ]]; then
        echo "{}"
        return 0
    fi
    
    local screenshot_name
    screenshot_name=$(echo "$tool_params" | jq -r '.name // "screenshot"')
    
    local screenshot_dir
    screenshot_dir=$(echo "$tool_params" | jq -r '.downloadsDir // ""')
    
    local save_png
    save_png=$(echo "$tool_params" | jq -r '.savePng // false')
    
    local success
    success=$(echo "$tool_result" | jq -r '.success // false')
    
    # Construct screenshot path
    local screenshot_path=""
    if [[ "$save_png" == "true" && -n "$screenshot_dir" ]]; then
        screenshot_path="$screenshot_dir/$screenshot_name.png"
    fi
    
    local screenshot_info
    screenshot_info=$(jq -n \
        --arg name "$screenshot_name" \
        --arg path "$screenshot_path" \
        --arg dir "$screenshot_dir" \
        --argjson success "$success" \
        '{
            name: $name,
            path: $path,
            directory: $dir,
            success: $success,
            size: null,
            exists: false
        }')
    
    # Check if file actually exists and get size
    if [[ -f "$screenshot_path" ]]; then
        local file_size
        file_size=$(stat -f%z "$screenshot_path" 2>/dev/null || stat -c%s "$screenshot_path" 2>/dev/null || echo "0")
        
        screenshot_info=$(echo "$screenshot_info" | jq \
            --argjson size "$file_size" \
            '.size = $size | .exists = true')
    fi
    
    echo "$screenshot_info"
}

# Record screenshot information
record_screenshot() {
    local screenshot_info="$1"
    
    local screenshot_exists
    screenshot_exists=$(echo "$screenshot_info" | jq -r '.exists // false')
    
    if [[ "$screenshot_exists" == "true" ]]; then
        local screenshot_data
        screenshot_data=$(echo "$screenshot_info" | jq '{
            name: .name,
            path: .path,
            size: .size,
            method: "browser-mcp",
            success: .success
        }')
        
        if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
            node "$UAT_ROOT/engine/hook-state-manager.js" add-screenshot "$screenshot_data" >/dev/null 2>&1 || {
                log_warning "Failed to record screenshot information"
            }
        fi
        
        log_success "Screenshot recorded: $(echo "$screenshot_info" | jq -r '.name')"
    else
        log_warning "Screenshot file not found: $(echo "$screenshot_info" | jq -r '.path')"
    fi
}

# Extract validation results from tool execution
extract_validation_results() {
    local tool_name="$1"
    local tool_result="$2"
    
    # Check for validation-related information in tool result
    local validation_data="{}"
    
    # For evaluate tools, check if validation functions were called
    if [[ "$tool_name" == "mcp__playwright__playwright_evaluate" ]]; then
        local script_result
        script_result=$(echo "$tool_result" | jq -r '.result // ""')
        
        # Look for validation framework results
        if [[ "$script_result" =~ __UAT_HEALTH__ ]]; then
            validation_data=$(jq -n \
                --arg type "health_check" \
                --arg result "$script_result" \
                '{
                    type: $type,
                    result: $result,
                    framework: "uat_health_check"
                }')
        fi
    fi
    
    # For navigation, check if page loaded successfully
    if [[ "$tool_name" == "mcp__playwright__playwright_navigate" ]]; then
        local nav_success
        nav_success=$(echo "$tool_result" | jq -r '.success // false')
        
        local final_url
        final_url=$(echo "$tool_result" | jq -r '.url // ""')
        
        validation_data=$(jq -n \
            --arg type "navigation" \
            --argjson success "$nav_success" \
            --arg url "$final_url" \
            '{
                type: $type,
                success: $success,
                final_url: $url,
                validation: "page_load"
            }')
    fi
    
    echo "$validation_data"
}

# Record validation results
record_validation_results() {
    local validation_data="$1"
    
    local validation_type
    validation_type=$(echo "$validation_data" | jq -r '.type // ""')
    
    if [[ -n "$validation_type" && "$validation_type" != "null" ]]; then
        if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
            node "$UAT_ROOT/engine/hook-state-manager.js" add-validation "$validation_data" >/dev/null 2>&1 || {
                log_warning "Failed to record validation results"
            }
        fi
        
        log_debug "Validation result recorded: $validation_type"
    fi
}

# Update performance metrics
update_performance_metrics() {
    local tool_name="$1"
    local execution_time="$2"
    local tool_result="$3"
    
    local perf_data
    perf_data=$(jq -n \
        --arg tool "$tool_name" \
        --argjson duration "$execution_time" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson success "$(echo "$tool_result" | jq '.success // false')" \
        '{
            lastToolExecution: {
                tool: $tool,
                duration: $duration,
                timestamp: $timestamp,
                success: $success
            }
        }')
    
    if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
        node "$UAT_ROOT/engine/hook-state-manager.js" update-performance "$perf_data" >/dev/null 2>&1 || {
            log_warning "Failed to update performance metrics"
        }
    fi
    
    log_debug "Performance metrics updated: ${tool_name} (${execution_time}ms)"
}

# Check if step is complete and advance if needed
check_step_completion() {
    local tool_name="$1"
    local tool_result="$2"
    
    # Load current session state
    local session_state
    if ! session_state=$(node "$UAT_ROOT/engine/hook-state-manager.js" read-state 2>/dev/null); then
        log_warning "Could not load session state for step completion check"
        return 0
    fi
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.currentStep // 0')
    
    local total_steps
    total_steps=$(echo "$session_state" | jq -r '.totalSteps // 0')
    
    # Simple completion logic - in a real implementation, this would be more sophisticated
    local tool_success
    tool_success=$(echo "$tool_result" | jq -r '.success // false')
    
    if [[ "$tool_success" == "true" ]]; then
        # Check if we should advance to the next step
        case "$tool_name" in
            "mcp__playwright__playwright_navigate"|\
            "mcp__playwright__playwright_click"|\
            "mcp__playwright__playwright_fill")
                # These actions typically indicate step completion
                if [[ "$current_step" -lt "$total_steps" ]]; then
                    local next_step=$((current_step + 1))
                    
                    local update_data
                    update_data=$(jq -n \
                        --argjson step "$next_step" \
                        '{
                            currentStep: $step,
                            lastStepCompletedAt: now | todate
                        }')
                    
                    if node "$UAT_ROOT/engine/hook-state-manager.js" update-state "$update_data" >/dev/null 2>&1; then
                        log_success "Advanced to step $next_step of $total_steps"
                    fi
                fi
                ;;
            *)
                log_debug "Tool does not indicate step completion: $tool_name"
                ;;
        esac
    else
        log_warning "Tool execution failed, not advancing step: $tool_name"
    fi
}

# Record error information
record_error() {
    local tool_name="$1"
    local tool_result="$2"
    
    local error_message
    error_message=$(echo "$tool_result" | jq -r '.error // ""')
    
    if [[ -n "$error_message" && "$error_message" != "null" ]]; then
        local error_data
        error_data=$(jq -n \
            --arg tool "$tool_name" \
            --arg message "$error_message" \
            --arg source "browser_mcp_execution" \
            '{
                tool: $tool,
                message: $message,
                source: $source,
                severity: "error"
            }')
        
        if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
            node "$UAT_ROOT/engine/hook-state-manager.js" add-error "$error_data" >/dev/null 2>&1 || {
                log_warning "Failed to record error information"
            }
        fi
        
        log_error "Tool execution error recorded: $error_message"
    fi
}

# Create comprehensive step record
create_step_record() {
    local tool_name="$1"
    local tool_params="$2"
    local tool_result="$3"
    local execution_time="$4"
    
    local success
    success=$(echo "$tool_result" | jq -r '.success // false')
    
    local action
    case "$tool_name" in
        "mcp__playwright__playwright_navigate") action="navigate" ;;
        "mcp__playwright__playwright_click") action="click" ;;
        "mcp__playwright__playwright_fill") action="fill" ;;
        "mcp__playwright__playwright_screenshot") action="screenshot" ;;
        "mcp__playwright__playwright_evaluate") action="evaluate" ;;
        *) action="unknown" ;;
    esac
    
    local step_data
    step_data=$(jq -n \
        --arg action "$action" \
        --arg tool "$tool_name" \
        --argjson params "$tool_params" \
        --argjson result "$tool_result" \
        --argjson duration "$execution_time" \
        --argjson success "$success" \
        '{
            action: $action,
            tool: $tool,
            parameters: $params,
            result: $result,
            duration: $duration,
            success: $success,
            description: ("Browser MCP tool execution: " + $tool)
        }')
    
    echo "$step_data"
}

# Main progress tracking logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    
    # Check if this is a Browser MCP tool
    if ! is_browser_mcp_tool "$TOOL_NAME"; then
        log_debug "Not a Browser MCP tool, skipping progress tracking: $TOOL_NAME"
        output_response "success" "Non-Browser MCP tool, no progress tracking needed"
        exit 0
    fi
    
    # Check if UAT mode is active
    if ! is_uat_active; then
        log_debug "UAT mode not active, skipping progress tracking"
        output_response "success" "UAT mode not active, no progress tracking needed"
        exit 0
    fi
    
    log_debug "Processing Browser MCP tool execution: $TOOL_NAME"
    
    # Create step record
    local step_data
    step_data=$(create_step_record "$TOOL_NAME" "$TOOL_PARAMS" "$TOOL_RESULT" "$EXECUTION_TIME")
    
    # Update session state with step execution
    if update_session_state "$step_data"; then
        log_success "Step execution recorded in session state"
    else
        log_warning "Failed to record step execution"
    fi
    
    # Handle screenshot-specific tracking
    if [[ "$TOOL_NAME" == "mcp__playwright__playwright_screenshot" ]]; then
        local screenshot_info
        screenshot_info=$(extract_screenshot_info "$TOOL_NAME" "$TOOL_PARAMS" "$TOOL_RESULT")
        record_screenshot "$screenshot_info"
    fi
    
    # Extract and record validation results
    local validation_data
    validation_data=$(extract_validation_results "$TOOL_NAME" "$TOOL_RESULT")
    record_validation_results "$validation_data"
    
    # Update performance metrics
    update_performance_metrics "$TOOL_NAME" "$EXECUTION_TIME" "$TOOL_RESULT"
    
    # Record any errors
    record_error "$TOOL_NAME" "$TOOL_RESULT"
    
    # Check for step completion and advance if needed
    check_step_completion "$TOOL_NAME" "$TOOL_RESULT"
    
    # Create response data
    local response_data
    response_data=$(jq -n \
        --arg tool "$TOOL_NAME" \
        --argjson duration "$EXECUTION_TIME" \
        --argjson success "$(echo "$TOOL_RESULT" | jq '.success // false')" \
        '{
            tool: $tool,
            duration: $duration,
            success: $success,
            tracked: true
        }')
    
    log_success "Progress tracking completed for: $TOOL_NAME"
    output_response "success" "Tool execution progress tracked successfully" "$response_data"
    exit 0
}

# Error handling
trap 'log_error "Hook execution failed"; output_response "error" "Hook execution failed"; exit 1' ERR

# Set timeout
timeout_handler() {
    log_error "Hook timeout after ${HOOK_TIMEOUT}s"
    output_response "error" "Hook timeout"
    exit 1
}

trap timeout_handler ALRM
(sleep $HOOK_TIMEOUT; kill -ALRM $$) &
TIMEOUT_PID=$!

# Run main logic
main

# Clean up timeout
kill $TIMEOUT_PID 2>/dev/null || true