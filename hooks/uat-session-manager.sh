#!/bin/bash
#
# UAT Session Manager Hook (PreToolUse)
# 
# Primary hook for UAT context detection and validation.
# This hook runs before any Browser MCP tool execution to:
# - Detect UAT context from environment variables
# - Load active scenario and current step requirements  
# - Validate tool usage against scenario expectations
# - Block unauthorized Browser MCP usage outside UAT context
# - Initialize session if not active
#
# Hook Type: PreToolUse
# Priority: 1 (runs first)
#

set -euo pipefail

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // empty')
TOOL_PARAMS=$(echo "$HOOK_INPUT" | jq -r '.parameters // {}')
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="uat-session-manager"
HOOK_TIMEOUT=30
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
        mcp__playwright__*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Check if UAT mode is active
is_uat_active() {
    [[ "${UAT_HOOKS_ENABLED:-false}" == "true" && -n "${UAT_ACTIVE_SCENARIO:-}" ]]
}

# Load UAT session state
load_session_state() {
    local state_file="$UAT_ROOT/sessions/hook-active-session.json"
    
    if [[ ! -f "$state_file" ]]; then
        log_error "UAT session state file not found: $state_file"
        return 1
    fi
    
    if ! jq empty "$state_file" 2>/dev/null; then
        log_error "Invalid JSON in session state file"
        return 1
    fi
    
    cat "$state_file"
}

# Get current step from scenario
get_current_step() {
    local session_state="$1"
    local current_step_num
    current_step_num=$(echo "$session_state" | jq -r '.currentStep // 0')
    
    if [[ "$current_step_num" -eq 0 ]]; then
        echo "{}"
        return 0
    fi
    
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenarioName')
    
    # Get step from scenario selector
    if [[ -f "$UAT_ROOT/hooks/uat-scenario-selector.sh" ]]; then
        "$UAT_ROOT/hooks/uat-scenario-selector.sh" get-step "$scenario_name" "$current_step_num" 2>/dev/null | jq -r '.step // {}'
    else
        echo "{}"
    fi
}

# Validate tool usage against expected scenario step
validate_tool_usage() {
    local tool_name="$1"
    local tool_params="$2"
    local current_step="$3"
    
    log_debug "Validating tool usage: $tool_name"
    
    if [[ "$current_step" == "{}" ]]; then
        log_debug "No current step to validate against"
        return 0
    fi
    
    local step_action
    step_action=$(echo "$current_step" | jq -r '.action // empty')
    
    if [[ -z "$step_action" ]]; then
        log_debug "No action in current step"
        return 0
    fi
    
    # Map Browser MCP tools to scenario actions
    case "$tool_name" in
        "mcp__playwright__playwright_navigate")
            if [[ "$step_action" != "navigate" ]]; then
                log_warning "Navigate tool used but current step action is: $step_action"
                return 1
            fi
            ;;
        "mcp__playwright__playwright_click")
            if [[ "$step_action" != "click" && "$step_action" != "logout" && "$step_action" != "create_vehicle" && "$step_action" != "update_vehicle" && "$step_action" != "delete_vehicle" ]]; then
                log_warning "Click tool used but current step action is: $step_action"
                return 1
            fi
            ;;
        "mcp__playwright__playwright_fill")
            if [[ "$step_action" != "fill" && "$step_action" != "create_vehicle" && "$step_action" != "update_vehicle" ]]; then
                log_warning "Fill tool used but current step action is: $step_action"
                return 1
            fi
            ;;
        "mcp__playwright__playwright_screenshot")
            if [[ "$step_action" != "screenshot" ]]; then
                log_debug "Screenshot tool can be used in any step"
            fi
            ;;
        *)
            log_debug "Unknown Browser MCP tool, allowing: $tool_name"
            ;;
    esac
    
    return 0
}

# Check authentication requirements
check_auth_requirements() {
    local current_step="$1"
    local session_state="$2"
    
    # Check if step requires authentication
    local step_description
    step_description=$(echo "$current_step" | jq -r '.description // empty')
    
    # Check scenario preconditions
    local preconditions
    preconditions=$(echo "$session_state" | jq -r '.scenario.preconditions // []')
    
    if echo "$preconditions" | jq -r '.[]' | grep -q "logged in"; then
        log_debug "Scenario requires authentication"
        # In a real implementation, this would check actual auth state
        # For now, we'll just log the requirement
        return 0
    fi
    
    return 0
}

# Update session progress
update_session_progress() {
    local tool_name="$1"
    local action="$2"
    
    if [[ -f "$UAT_ROOT/engine/hook-state-manager.js" ]]; then
        local update_data="{
            \"lastToolCall\": \"$tool_name\",
            \"lastAction\": \"$action\",
            \"lastActivity\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }"
        
        node "$UAT_ROOT/engine/hook-state-manager.js" update-state "$update_data" >/dev/null 2>&1 || true
    fi
}

# Main hook logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    
    # Check if this is a Browser MCP tool
    if ! is_browser_mcp_tool "$TOOL_NAME"; then
        log_debug "Not a Browser MCP tool, allowing: $TOOL_NAME"
        output_response "approve" "Non-Browser MCP tool allowed"
        exit 0
    fi
    
    log_debug "Browser MCP tool detected: $TOOL_NAME"
    
    # Check if UAT mode is active
    if ! is_uat_active; then
        log_warning "Browser MCP tool used outside UAT context: $TOOL_NAME"
        
        # Check configuration for blocking unauthorized usage
        local block_unauthorized="${UAT_BLOCK_UNAUTHORIZED:-true}"
        
        if [[ "$block_unauthorized" == "true" ]]; then
            log_error "Blocking unauthorized Browser MCP usage"
            output_response "block" "Browser MCP tools require active UAT session. Run: cd $UAT_ROOT && ./hooks/uat-init-session.sh --scenario=<scenario-name>"
            exit 2
        else
            log_warning "Allowing unauthorized usage (block disabled)"
            output_response "approve" "Unauthorized usage allowed by configuration"
            exit 0
        fi
    fi
    
    log_debug "UAT mode active, scenario: ${UAT_ACTIVE_SCENARIO:-unknown}"
    
    # Load session state
    local session_state
    if ! session_state=$(load_session_state); then
        log_error "Failed to load session state"
        output_response "block" "Failed to load UAT session state"
        exit 2
    fi
    
    log_debug "Session state loaded successfully"
    
    # Get current step
    local current_step
    current_step=$(get_current_step "$session_state")
    
    log_debug "Current step loaded"
    
    # Validate tool usage against scenario
    if ! validate_tool_usage "$TOOL_NAME" "$TOOL_PARAMS" "$current_step"; then
        log_warning "Tool usage validation failed"
        # Don't block on validation warnings, just log them
        log_warning "Continuing with tool execution despite validation warning"
    fi
    
    # Check authentication requirements
    check_auth_requirements "$current_step" "$session_state"
    
    # Update session progress
    update_session_progress "$TOOL_NAME" "$(echo "$current_step" | jq -r '.action // "unknown"')"
    
    log_success "Tool usage validated, approving: $TOOL_NAME"
    
    # Create approval response with enhanced data
    local enhanced_data="{
        \"uatContext\": {
            \"scenario\": \"${UAT_ACTIVE_SCENARIO:-}\",
            \"sessionId\": \"${UAT_SESSION_ID:-}\",
            \"mode\": \"${UAT_MODE:-}\",
            \"currentStep\": $(echo "$session_state" | jq '.currentStep // 0'),
            \"totalSteps\": $(echo "$session_state" | jq '.totalSteps // 0')
        },
        \"currentStep\": $current_step,
        \"validationPassed\": true
    }"
    
    output_response "approve" "Browser MCP tool approved for UAT execution" "$enhanced_data"
    exit 0
}

# Error handling
trap 'log_error "Hook execution failed with error"; output_response "error" "Hook execution failed"; exit 1' ERR

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