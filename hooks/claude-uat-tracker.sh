#!/bin/bash
#
# Claude Code UAT Tracker (PostToolUse Hook)
# 
# This hook integrates with Claude Code's built-in hook system to track UAT execution progress
# and capture comprehensive testing results after Browser MCP tool execution.
# 
# Features:
# - Automatic tool execution result capture and analysis
# - Real-time scenario progress tracking and step advancement
# - Screenshot and artifact management with proper cataloging
# - Performance metrics collection and trend analysis
# - Validation result processing and health check monitoring
# - Comprehensive error logging and recovery tracking
#
# Hook Type: PostToolUse
# Registration: /hooks → Select "2. PostToolUse" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-tracker.sh
#

set -euo pipefail

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="claude-uat-tracker"
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

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // empty')
TOOL_PARAMS=$(echo "$HOOK_INPUT" | jq -r '.parameters // {}')
TOOL_RESULT=$(echo "$HOOK_INPUT" | jq -r '.result // {}')
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
EXECUTION_TIME=$(echo "$HOOK_INPUT" | jq -r '.execution_time_ms // 0')
TIMESTAMP=$(echo "$HOOK_INPUT" | jq -r '.timestamp // empty')

# Function to output hook response
output_response() {
    local action="$1"
    local message="$2"
    local data="${3:-{}}"
    
    local response
    response=$(jq -n \
        --arg action "$action" \
        --arg message "$message" \
        --arg hook "$HOOK_NAME" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson data "$data" \
        '{
            action: $action,
            message: $message,
            hook: $hook,
            timestamp: $timestamp,
            data: $data
        }')
    
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

# Check if UAT session is active
is_session_active() {
    local claude_session_id="$1"
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    
    if [[ -f "$session_file" ]]; then
        local session_data
        if session_data=$(cat "$session_file" 2>/dev/null) && echo "$session_data" | jq empty 2>/dev/null; then
            local status=$(echo "$session_data" | jq -r '.session.status // "unknown"')
            [[ "$status" == "active" ]]
        else
            return 1
        fi
    else
        return 1
    fi
}

# Read session state safely
read_session_state() {
    local claude_session_id="$1"
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    
    if [[ -f "$session_file" ]]; then
        local session_data
        if session_data=$(cat "$session_file" 2>/dev/null) && echo "$session_data" | jq empty 2>/dev/null; then
            echo "$session_data"
            return 0
        fi
    fi
    
    return 1  # File doesn't exist or invalid JSON
}

# Write session state with atomic operations
write_session_state() {
    local claude_session_id="$1"
    local session_data="$2"
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    
    # Create sessions directory if it doesn't exist
    mkdir -p "$UAT_ROOT/sessions"
    
    # Create temporary file
    local temp_file="$UAT_ROOT/sessions/temp-$(date +%s%N)-$$.json"
    
    # Write to temporary file
    if echo "$session_data" | jq '.' > "$temp_file" 2>/dev/null; then
        # Atomic move to final location
        if mv "$temp_file" "$session_file"; then
            return 0  # Success
        fi
    fi
    
    # Cleanup on failure
    rm -f "$temp_file" 2>/dev/null || true
    return 1  # Failure
}

# Update session state with new data
update_session_state() {
    local claude_session_id="$1"
    local update_data="$2"
    
    # Read current state
    local current_state
    if ! current_state=$(read_session_state "$claude_session_id"); then
        log_warning "Could not read current session state"
        return 1
    fi
    
    # Apply updates
    local updated_state
    updated_state=$(echo "$current_state" | jq \
        --argjson updates "$update_data" \
        '. * $updates | .meta.updated = now | todate | .session.lastActivity = now | todate')
    
    # Write updated state
    write_session_state "$claude_session_id" "$updated_state"
}

# Create tool call record
create_tool_call_record() {
    local tool_name="$1"
    local tool_params="$2"
    local tool_result="$3"
    local execution_time="$4"
    local session_state="$5"
    
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
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 1')
    
    local tool_call_record
    tool_call_record=$(jq -n \
        --arg id "tool-call-$(date +%s%N)" \
        --arg tool "$tool_name" \
        --argjson params "$tool_params" \
        --argjson result "$tool_result" \
        --argjson execution_time "$execution_time" \
        --arg timestamp "$TIMESTAMP" \
        --argjson step "$current_step" \
        --argjson success "$success" \
        --arg action "$action" \
        '{
            id: $id,
            toolName: $tool,
            parameters: $params,
            result: $result,
            executionTime: $execution_time,
            timestamp: $timestamp,
            stepNumber: $step,
            success: $success,
            action: $action
        }')
    
    echo "$tool_call_record"
}

# Extract screenshot information from tool result
extract_screenshot_info() {
    local tool_name="$1"
    local tool_params="$2"
    local tool_result="$3"
    local session_state="$4"
    
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
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 1')
    
    local screenshot_info
    screenshot_info=$(jq -n \
        --arg name "$screenshot_name" \
        --arg path "$screenshot_path" \
        --arg dir "$screenshot_dir" \
        --argjson success "$success" \
        --argjson step "$current_step" \
        --arg timestamp "$TIMESTAMP" \
        '{
            name: $name,
            path: $path,
            directory: $dir,
            success: $success,
            stepNumber: $step,
            timestamp: $timestamp,
            size: null,
            exists: false,
            method: "browser-mcp"
        }')
    
    # Check if file actually exists and get size
    if [[ -f "$screenshot_path" ]]; then
        local file_size
        file_size=$(stat -f%z "$screenshot_path" 2>/dev/null || stat -c%s "$screenshot_path" 2>/dev/null || echo "0")
        
        screenshot_info=$(echo "$screenshot_info" | jq \
            --argjson size "$file_size" \
            '.size = $size | .exists = true')
        
        log_debug "Screenshot file found: $screenshot_path (${file_size} bytes)"
    else
        log_warning "Screenshot file not found: $screenshot_path"
    fi
    
    echo "$screenshot_info"
}

# Extract validation results from tool execution
extract_validation_results() {
    local tool_name="$1"
    local tool_result="$2"
    
    # Initialize empty validation data
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
                --arg framework "uat_health_check" \
                --arg timestamp "$TIMESTAMP" \
                '{
                    type: $type,
                    result: $result,
                    framework: $framework,
                    timestamp: $timestamp,
                    success: true
                }')
            
            log_debug "UAT health check validation detected"
        fi
    fi
    
    # For navigation, check if page loaded successfully
    if [[ "$tool_name" == "mcp__playwright__playwright_navigate" ]]; then
        local nav_success
        nav_success=$(echo "$tool_result" | jq -r '.success // false')
        
        local final_url
        final_url=$(echo "$tool_result" | jq -r '.url // ""')
        
        local status_code
        status_code=$(echo "$tool_result" | jq -r '.statusCode // 0')
        
        validation_data=$(jq -n \
            --arg type "navigation" \
            --argjson success "$nav_success" \
            --arg url "$final_url" \
            --argjson status "$status_code" \
            --arg timestamp "$TIMESTAMP" \
            '{
                type: $type,
                success: $success,
                finalUrl: $url,
                statusCode: $status,
                validation: "page_load",
                timestamp: $timestamp
            }')
        
        log_debug "Navigation validation recorded: $nav_success"
    fi
    
    echo "$validation_data"
}

# Calculate performance metrics update
calculate_performance_update() {
    local tool_name="$1"
    local execution_time="$2"
    local tool_result="$3"
    local session_state="$4"
    
    local current_metrics
    current_metrics=$(echo "$session_state" | jq '.performance')
    
    local tool_count
    tool_count=$(echo "$current_metrics" | jq '.toolCallCount // 0')
    local new_tool_count=$((tool_count + 1))
    
    local total_time
    total_time=$(echo "$current_metrics" | jq '.totalExecutionTime // 0')
    local new_total_time=$((total_time + execution_time))
    
    local new_average=0
    if [[ $new_tool_count -gt 0 ]]; then
        new_average=$((new_total_time / new_tool_count))
    fi
    
    local success
    success=$(echo "$tool_result" | jq -r '.success // false')
    
    local error_count
    error_count=$(echo "$current_metrics" | jq '.errorCount // 0')
    if [[ "$success" != "true" ]]; then
        error_count=$((error_count + 1))
    fi
    
    local success_rate=0
    if [[ $new_tool_count -gt 0 ]]; then
        success_rate=$(echo "scale=3; ($new_tool_count - $error_count) / $new_tool_count" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Check for fastest/slowest operations
    local fastest_step
    fastest_step=$(echo "$current_metrics" | jq '.fastestStep')
    
    local slowest_step
    slowest_step=$(echo "$current_metrics" | jq '.slowestStep')
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 1')
    
    local action
    case "$tool_name" in
        "mcp__playwright__playwright_navigate") action="navigate" ;;
        "mcp__playwright__playwright_click") action="click" ;;
        "mcp__playwright__playwright_fill") action="fill" ;;
        "mcp__playwright__playwright_screenshot") action="screenshot" ;;
        "mcp__playwright__playwright_evaluate") action="evaluate" ;;
        *) action="unknown" ;;
    esac
    
    # Update fastest step
    if [[ "$fastest_step" == "null" ]] || [[ $execution_time -lt $(echo "$fastest_step" | jq '.duration // 999999') ]]; then
        fastest_step=$(jq -n \
            --argjson step "$current_step" \
            --argjson duration "$execution_time" \
            --arg action "$action" \
            '{
                stepNumber: $step,
                duration: $duration,
                action: $action
            }')
    fi
    
    # Update slowest step
    if [[ "$slowest_step" == "null" ]] || [[ $execution_time -gt $(echo "$slowest_step" | jq '.duration // 0') ]]; then
        slowest_step=$(jq -n \
            --argjson step "$current_step" \
            --argjson duration "$execution_time" \
            --arg action "$action" \
            '{
                stepNumber: $step,
                duration: $duration,
                action: $action
            }')
    fi
    
    # Create performance update
    local performance_update
    performance_update=$(jq -n \
        --argjson total_time "$new_total_time" \
        --argjson avg_duration "$new_average" \
        --argjson fastest "$fastest_step" \
        --argjson slowest "$slowest_step" \
        --argjson tool_count "$new_tool_count" \
        --argjson error_count "$error_count" \
        --argjson success_rate "$success_rate" \
        '{
            totalExecutionTime: $total_time,
            averageStepDuration: $avg_duration,
            fastestStep: $fastest,
            slowestStep: $slowest,
            toolCallCount: $tool_count,
            errorCount: $error_count,
            successRate: $success_rate
        }')
    
    echo "$performance_update"
}

# Check if current step should be advanced
should_advance_step() {
    local tool_name="$1"
    local tool_result="$2"
    local session_state="$3"
    
    local success
    success=$(echo "$tool_result" | jq -r '.success // false')
    
    # Only advance on successful tool execution
    if [[ "$success" != "true" ]]; then
        return 1
    fi
    
    # Check if we're at the last step
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 1')
    
    local total_steps
    total_steps=$(echo "$session_state" | jq -r '.scenario.totalSteps // 0')
    
    if [[ $current_step -ge $total_steps ]]; then
        return 1  # Already at last step
    fi
    
    # Simple advancement logic based on tool types
    # In a real implementation, this would be more sophisticated
    case "$tool_name" in
        "mcp__playwright__playwright_navigate"|\
        "mcp__playwright__playwright_click"|\
        "mcp__playwright__playwright_fill")
            # These actions typically indicate step completion
            return 0
            ;;
        *)
            # Screenshots and evaluations don't advance steps by themselves
            return 1
            ;;
    esac
}

# Update scenario progress
update_scenario_progress() {
    local session_state="$1"
    local tool_name="$2"
    local tool_result="$3"
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 1')
    
    local success
    success=$(echo "$tool_result" | jq -r '.success // false')
    
    # Update current step status
    local step_update
    if [[ "$success" == "true" ]]; then
        step_update='"completed"'
        log_debug "Step $current_step completed successfully"
    else
        step_update='"failed"'
        log_warning "Step $current_step failed"
    fi
    
    local steps_update
    steps_update=$(echo "$session_state" | jq \
        --argjson step_num "$current_step" \
        --argjson step_status "$step_update" \
        '.scenario.steps = [
            .scenario.steps[] | 
            if .stepNumber == $step_num then
                . + {
                    status: $step_status,
                    endTime: (if $step_status == "completed" then now | todate else .endTime end),
                    duration: (if $step_status == "completed" and .startTime then 
                        ((now - (.startTime | fromdateiso8601)) * 1000 | floor) else .duration end)
                }
            else . end
        ]')
    
    # Check if we should advance to next step
    if should_advance_step "$tool_name" "$tool_result" "$session_state"; then
        local next_step=$((current_step + 1))
        local total_steps
        total_steps=$(echo "$session_state" | jq -r '.scenario.totalSteps // 0')
        
        if [[ $next_step -le $total_steps ]]; then
            steps_update=$(echo "$steps_update" | jq \
                --argjson next_step "$next_step" \
                '.scenario.currentStep = $next_step | 
                 .scenario.completedSteps = ($next_step - 1) |
                 .scenario.steps = [
                     .scenario.steps[] |
                     if .stepNumber == $next_step then
                         . + {
                             status: "in_progress",
                             startTime: now | todate
                         }
                     else . end
                 ]')
            
            log_success "Advanced to step $next_step of $total_steps"
        else
            # Scenario completed
            steps_update=$(echo "$steps_update" | jq \
                '.scenario.completedSteps = .scenario.totalSteps |
                 .scenario.status = "completed"')
            
            log_success "Scenario completed successfully!"
        fi
    fi
    
    echo "$steps_update"
}

# Record error information
record_error() {
    local tool_name="$1"
    local tool_result="$2"
    
    local error_message
    error_message=$(echo "$tool_result" | jq -r '.error // ""')
    
    if [[ -n "$error_message" && "$error_message" != "null" ]]; then
        local error_record
        error_record=$(jq -n \
            --arg tool "$tool_name" \
            --arg message "$error_message" \
            --arg source "browser_mcp_execution" \
            --arg severity "error" \
            --arg timestamp "$TIMESTAMP" \
            '{
                tool: $tool,
                message: $message,
                source: $source,
                severity: $severity,
                timestamp: $timestamp
            }')
        
        echo "$error_record"
    else
        echo "{}"
    fi
}

# Main tracking logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    log_debug "Session ID: $SESSION_ID"
    log_debug "Execution time: ${EXECUTION_TIME}ms"
    
    # Check if this is a Browser MCP tool
    if ! is_browser_mcp_tool "$TOOL_NAME"; then
        log_debug "Not a Browser MCP tool, skipping tracking: $TOOL_NAME"
        output_response "success" "Non-Browser MCP tool, no tracking needed"
        exit 0
    fi
    
    # Check if UAT session is active
    if ! is_session_active "$SESSION_ID"; then
        log_debug "No active UAT session, skipping tracking"
        output_response "success" "No active UAT session, no tracking needed"
        exit 0
    fi
    
    log_debug "Processing Browser MCP tool execution: $TOOL_NAME"
    
    # Load current session state
    local session_state
    if ! session_state=$(read_session_state "$SESSION_ID"); then
        log_error "Failed to load session state"
        output_response "error" "Failed to load session state"
        exit 1
    fi
    
    # Create tool call record
    local tool_call_record
    tool_call_record=$(create_tool_call_record "$TOOL_NAME" "$TOOL_PARAMS" "$TOOL_RESULT" "$EXECUTION_TIME" "$session_state")
    
    # Extract screenshot information if applicable
    local screenshot_info
    screenshot_info=$(extract_screenshot_info "$TOOL_NAME" "$TOOL_PARAMS" "$TOOL_RESULT" "$session_state")
    
    # Extract validation results
    local validation_data
    validation_data=$(extract_validation_results "$TOOL_NAME" "$TOOL_RESULT")
    
    # Calculate performance metrics update
    local performance_update
    performance_update=$(calculate_performance_update "$TOOL_NAME" "$EXECUTION_TIME" "$TOOL_RESULT" "$session_state")
    
    # Update scenario progress
    local progress_update
    progress_update=$(update_scenario_progress "$session_state" "$TOOL_NAME" "$TOOL_RESULT")
    
    # Record any errors
    local error_record
    error_record=$(record_error "$TOOL_NAME" "$TOOL_RESULT")
    
    # Prepare comprehensive update
    local session_update
    session_update=$(jq -n \
        --argjson tool_call "$tool_call_record" \
        --argjson screenshot "$screenshot_info" \
        --argjson validation "$validation_data" \
        --argjson performance "$performance_update" \
        --argjson progress "$progress_update" \
        --argjson error "$error_record" \
        '{
            execution: {
                toolCalls: [.execution.toolCalls[], $tool_call]
            },
            performance: $performance
        } + 
        (if $screenshot != {} then {
            artifacts: {
                screenshots: [.artifacts.screenshots[], $screenshot]
            }
        } else {} end) +
        (if $validation != {} then {
            validation: {
                healthChecks: [.validation.healthChecks[], $validation]
            }
        } else {} end) +
        (if $error != {} then {
            execution: {
                errors: [.execution.errors[], $error]
            }
        } else {} end) +
        $progress')
    
    # Update session state
    if update_session_state "$SESSION_ID" "$session_update"; then
        log_success "Session state updated successfully"
        
        # Create response data
        local response_data
        response_data=$(jq -n \
            --arg tool "$TOOL_NAME" \
            --argjson duration "$EXECUTION_TIME" \
            --argjson success "$(echo "$TOOL_RESULT" | jq '.success // false')" \
            --argjson screenshot_captured "$(if [[ "$screenshot_info" != "{}" ]]; then echo "true"; else echo "false"; fi)" \
            --argjson validation_recorded "$(if [[ "$validation_data" != "{}" ]]; then echo "true"; else echo "false"; fi)" \
            --argjson step_advanced "$(echo "$progress_update" | jq 'has("scenario") and (.scenario.currentStep // 0) > (.scenario.currentStep // 0)')" \
            '{
                tool: $tool,
                duration: $duration,
                success: $success,
                screenshotCaptured: $screenshot_captured,
                validationRecorded: $validation_recorded,
                stepAdvanced: $step_advanced,
                tracked: true
            }')
        
        output_response "success" "Tool execution tracked successfully" "$response_data"
    else
        log_error "Failed to update session state"
        output_response "error" "Failed to update session state"
    fi
    
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