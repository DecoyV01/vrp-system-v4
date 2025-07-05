#!/bin/bash
#
# UAT Parameter Enhancement Hook (PreToolUse)
# 
# Automatically enhances Browser MCP tool parameters with UAT context.
# This hook runs after session validation to enhance tool calls with:
# - UAT-specific screenshot naming and directory configuration
# - Automatic timeout and wait condition adjustments
# - URL resolution and environment-specific modifications
# - Validation framework injection parameters
# - Performance monitoring configuration
#
# Hook Type: PreToolUse  
# Priority: 2 (runs after session manager)
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
HOOK_NAME="uat-parameter-enhancer"
HOOK_TIMEOUT=10
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
    local enhanced_params="${3:-{}}"
    
    local response="{
        \"action\": \"$action\",
        \"message\": \"$message\",
        \"hook\": \"$HOOK_NAME\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"parameters\": $enhanced_params
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

# Load session state for context
load_session_state() {
    local state_file="$UAT_ROOT/sessions/hook-active-session.json"
    
    if [[ -f "$state_file" ]]; then
        cat "$state_file"
    else
        echo "{}"
    fi
}

# Generate UAT-compliant screenshot name
generate_screenshot_name() {
    local original_name="$1"
    local session_id="${UAT_SESSION_ID:-unknown}"
    local scenario="${UAT_ACTIVE_SCENARIO:-unknown}"
    local current_step="${2:-0}"
    local timestamp=$(date +%H%M%S)
    
    # Clean original name
    local clean_name=$(echo "$original_name" | sed 's/[^a-zA-Z0-9_-]/-/g')
    
    # Create UAT-compliant name
    echo "${session_id}-${scenario}-step${current_step}-${clean_name}-${timestamp}"
}

# Resolve URL against base URL
resolve_url() {
    local url="$1"
    local base_url="${UAT_BASE_URL:-https://vrp-system-v4.pages.dev}"
    
    # If URL is already absolute, return as-is
    if [[ "$url" =~ ^https?:// ]]; then
        echo "$url"
        return 0
    fi
    
    # If URL starts with /, append to base URL
    if [[ "$url" =~ ^/ ]]; then
        echo "${base_url}${url}"
        return 0
    fi
    
    # Relative URL, append to base URL with /
    echo "${base_url}/${url}"
}

# Get timeout for action type
get_action_timeout() {
    local action="$1"
    local default_timeout=30000
    
    case "$action" in
        "navigate") echo 10000 ;;
        "click") echo 5000 ;;
        "fill") echo 5000 ;;
        "screenshot") echo 8000 ;;
        "evaluate") echo 15000 ;;
        *) echo $default_timeout ;;
    esac
}

# Get wait condition for action
get_wait_condition() {
    local action="$1"
    
    case "$action" in
        "navigate") echo "networkidle" ;;
        "click") echo "networkidle" ;;
        "fill") echo "load" ;;
        *) echo "load" ;;
    esac
}

# Enhance screenshot parameters
enhance_screenshot_params() {
    local params="$1"
    local session_state="$2"
    
    local original_name
    original_name=$(echo "$params" | jq -r '.name // "screenshot"')
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.currentStep // 0')
    
    # Generate enhanced name
    local enhanced_name
    enhanced_name=$(generate_screenshot_name "$original_name" "$current_step")
    
    # Create screenshots directory
    local screenshot_dir="${UAT_SCREENSHOTS_DIR:-$UAT_ROOT/screenshots/${UAT_SESSION_ID:-default}}"
    mkdir -p "$screenshot_dir"
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg name "$enhanced_name" \
        --arg dir "$screenshot_dir" \
        '. + {
            "name": $name,
            "savePng": true,
            "downloadsDir": $dir,
            "fullPage": (.fullPage // false),
            "width": (.width // 1280),
            "height": (.height // 720)
        }')
    
    log_debug "Enhanced screenshot: $original_name -> $enhanced_name"
    echo "$enhanced_params"
}

# Enhance navigation parameters
enhance_navigation_params() {
    local params="$1"
    local session_state="$2"
    
    local original_url
    original_url=$(echo "$params" | jq -r '.url // empty')
    
    if [[ -z "$original_url" ]]; then
        log_warning "No URL found in navigation parameters"
        echo "$params"
        return 0
    fi
    
    # Resolve URL
    local resolved_url
    resolved_url=$(resolve_url "$original_url")
    
    # Get appropriate timeout and wait condition
    local timeout
    timeout=$(get_action_timeout "navigate")
    
    local wait_condition
    wait_condition=$(get_wait_condition "navigate")
    
    # Check UAT mode for headless setting
    local headless="true"
    if [[ "${UAT_MODE:-production}" == "debug" ]]; then
        headless="false"
    fi
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg url "$resolved_url" \
        --argjson timeout $timeout \
        --arg wait "$wait_condition" \
        --argjson headless_bool "$headless" \
        '. + {
            "url": $url,
            "timeout": $timeout,
            "waitUntil": $wait,
            "headless": $headless_bool,
            "browserType": (.browserType // "chromium"),
            "width": (.width // 1280),
            "height": (.height // 720)
        }')
    
    log_debug "Enhanced navigation: $original_url -> $resolved_url"
    echo "$enhanced_params"
}

# Enhance click parameters
enhance_click_params() {
    local params="$1"
    local session_state="$2"
    
    local timeout
    timeout=$(get_action_timeout "click")
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --argjson timeout $timeout \
        '. + {
            "timeout": $timeout,
            "force": (.force // false),
            "waitFor": (.waitFor // "networkidle")
        }')
    
    log_debug "Enhanced click parameters with timeout: $timeout"
    echo "$enhanced_params"
}

# Enhance fill parameters
enhance_fill_params() {
    local params="$1"
    local session_state="$2"
    
    local timeout
    timeout=$(get_action_timeout "fill")
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --argjson timeout $timeout \
        '. + {
            "timeout": $timeout,
            "clear": (.clear // true),
            "waitFor": (.waitFor // "load")
        }')
    
    log_debug "Enhanced fill parameters with timeout: $timeout"
    echo "$enhanced_params"
}

# Enhance evaluate parameters (for validation injection)
enhance_evaluate_params() {
    local params="$1"
    local session_state="$2"
    
    local timeout
    timeout=$(get_action_timeout "evaluate")
    
    # Check if this is a validation framework injection
    local script
    script=$(echo "$params" | jq -r '.script // empty')
    
    if [[ "$script" =~ __UAT_HEALTH__ ]]; then
        log_debug "Validation framework injection detected"
    fi
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --argjson timeout $timeout \
        '. + {
            "timeout": $timeout
        }')
    
    log_debug "Enhanced evaluate parameters"
    echo "$enhanced_params"
}

# Enhance generic parameters
enhance_generic_params() {
    local params="$1"
    local session_state="$2"
    local tool_name="$3"
    
    log_debug "Applying generic enhancements for: $tool_name"
    
    # Add generic timeout if not present
    local default_timeout
    default_timeout=$(get_action_timeout "default")
    
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --argjson timeout $default_timeout \
        '. + {
            "timeout": (.timeout // $timeout)
        }')
    
    echo "$enhanced_params"
}

# Add performance monitoring
add_performance_monitoring() {
    local params="$1"
    local tool_name="$2"
    
    # Add performance monitoring metadata
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg tool "$tool_name" \
        --arg session "${UAT_SESSION_ID:-}" \
        '. + {
            "_uat_metadata": {
                "tool": $tool,
                "sessionId": $session,
                "timestamp": now,
                "performanceMonitoring": true
            }
        }')
    
    echo "$enhanced_params"
}

# Main enhancement logic
enhance_parameters() {
    local tool_name="$1"
    local params="$2"
    local session_state="$3"
    
    log_debug "Enhancing parameters for: $tool_name"
    
    local enhanced_params="$params"
    
    # Tool-specific enhancements
    case "$tool_name" in
        "mcp__playwright__playwright_screenshot")
            enhanced_params=$(enhance_screenshot_params "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_navigate")
            enhanced_params=$(enhance_navigation_params "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_click")
            enhanced_params=$(enhance_click_params "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_fill")
            enhanced_params=$(enhance_fill_params "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_evaluate")
            enhanced_params=$(enhance_evaluate_params "$enhanced_params" "$session_state")
            ;;
        *)
            enhanced_params=$(enhance_generic_params "$enhanced_params" "$session_state" "$tool_name")
            ;;
    esac
    
    # Add performance monitoring metadata
    enhanced_params=$(add_performance_monitoring "$enhanced_params" "$tool_name")
    
    echo "$enhanced_params"
}

# Main hook logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    
    # Check if this is a Browser MCP tool
    if ! is_browser_mcp_tool "$TOOL_NAME"; then
        log_debug "Not a Browser MCP tool, skipping enhancement: $TOOL_NAME"
        output_response "approve" "Non-Browser MCP tool, no enhancement needed"
        exit 0
    fi
    
    # Check if UAT mode is active
    if ! is_uat_active; then
        log_debug "UAT mode not active, skipping enhancement"
        output_response "approve" "UAT mode not active, no enhancement applied"
        exit 0
    fi
    
    log_debug "Enhancing Browser MCP tool parameters: $TOOL_NAME"
    
    # Load session state for context
    local session_state
    session_state=$(load_session_state)
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(enhance_parameters "$TOOL_NAME" "$TOOL_PARAMS" "$session_state")
    
    if [[ "$enhanced_params" == "$TOOL_PARAMS" ]]; then
        log_debug "No enhancements applied"
        output_response "approve" "Parameters validated, no enhancements needed"
    else
        log_success "Parameters enhanced for UAT context"
        output_response "modify" "Parameters enhanced with UAT context" "$enhanced_params"
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