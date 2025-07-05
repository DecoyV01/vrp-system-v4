#!/bin/bash
#
# Claude Code UAT Orchestrator (PreToolUse Hook)
# 
# This hook integrates with Claude Code's built-in hook system to automatically detect
# UAT testing intentions from user messages and orchestrate comprehensive UAT workflows.
# 
# Features:
# - Automatic UAT context detection from natural language
# - Self-initializing session management (no external setup required)
# - Browser MCP parameter enhancement with UAT context
# - Validation framework injection for comprehensive testing
# - Seamless integration with Claude Code's event-driven architecture
#
# Hook Type: PreToolUse
# Registration: /hooks → Select "1. PreToolUse" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-orchestrator.sh
#

set -euo pipefail

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="claude-uat-orchestrator"
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

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // empty')
TOOL_PARAMS=$(echo "$HOOK_INPUT" | jq -r '.parameters // {}')
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
USER_MESSAGE=$(echo "$HOOK_INPUT" | jq -r '.user_message // empty')
TIMESTAMP=$(echo "$HOOK_INPUT" | jq -r '.timestamp // empty')

# Function to output hook response
output_response() {
    local action="$1"
    local message="$2"
    local parameters="${3:-{}}"
    local data="${4:-{}}"
    
    local response
    response=$(jq -n \
        --arg action "$action" \
        --arg message "$message" \
        --arg hook "$HOOK_NAME" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson parameters "$parameters" \
        --argjson data "$data" \
        '{
            action: $action,
            message: $message,
            hook: $hook,
            timestamp: $timestamp,
            parameters: $parameters,
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

# Get available UAT scenarios
get_available_scenarios() {
    local scenarios_dir="$UAT_ROOT/scenarios"
    local scenarios=()
    
    if [[ -d "$scenarios_dir" ]]; then
        for scenario_file in "$scenarios_dir"/*.js; do
            if [[ -f "$scenario_file" ]]; then
                local scenario_name=$(basename "$scenario_file" .js)
                if validate_scenario "$scenario_name"; then
                    scenarios+=("$scenario_name")
                fi
            fi
        done
    fi
    
    printf '%s\n' "${scenarios[@]}"
}

# Validate scenario exists and is valid
validate_scenario() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/${scenario_name}.js"
    
    if [[ -f "$scenario_file" ]]; then
        # Validate scenario structure using Node.js
        if node -e "require('$scenario_file')" 2>/dev/null; then
            return 0  # Valid scenario
        fi
    fi
    return 1  # Invalid or missing scenario
}

# Extract scenario name from user message
extract_scenario_name() {
    local message="$1"
    
    # Direct scenario name patterns
    if [[ "$message" =~ (login-flow|vehicle-crud|user-registration) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    
    # Pattern: "test X scenario" or "run X scenario"
    if [[ "$message" =~ test[[:space:]]+(.*)[[:space:]]+scenario ]] || \
       [[ "$message" =~ run[[:space:]]+(.*)[[:space:]]+scenario ]]; then
        local extracted="${BASH_REMATCH[1]}"
        # Convert spaces to hyphens and lowercase
        echo "${extracted// /-}" | tr '[:upper:]' '[:lower:]'
        return 0
    fi
    
    return 1  # No scenario name found
}

# Find best scenario match based on keywords
find_best_scenario_match() {
    local message="$1"
    local available_scenarios
    available_scenarios=($(get_available_scenarios))
    
    local best_match=""
    local best_score=0
    
    for scenario in "${available_scenarios[@]}"; do
        local score=$(calculate_scenario_match_score "$message" "$scenario")
        if [[ $score -gt $best_score ]]; then
            best_score=$score
            best_match="$scenario"
        fi
    done
    
    if [[ $best_score -ge 30 ]]; then  # Minimum threshold for match
        echo "$best_match"
    fi
}

# Calculate scenario match score
calculate_scenario_match_score() {
    local message="$1"
    local scenario="$2"
    local score=0
    
    case "$scenario" in
        "login-flow")
            if [[ "$message" =~ login|auth|signin|credential|authentication ]]; then
                score=$((score + 50))
            fi
            ;;
        "vehicle-crud")
            if [[ "$message" =~ vehicle|fleet|car|truck|crud|manage ]]; then
                score=$((score + 50))
            fi
            ;;
        "user-registration")
            if [[ "$message" =~ user|register|signup|account|profile ]]; then
                score=$((score + 50))
            fi
            ;;
    esac
    
    # Exact scenario name match
    if [[ "$message" =~ $scenario ]]; then
        score=$((score + 30))
    fi
    
    # Test-related keywords
    if [[ "$message" =~ test|verify|validate|check ]]; then
        score=$((score + 10))
    fi
    
    echo $score
}

# Analyze message patterns for UAT indicators
analyze_message_patterns() {
    local message="$1"
    local score=0
    
    # High-confidence patterns (30-50 points)
    if [[ "$message" =~ test.*scenario|run.*uat|execute.*scenario ]]; then
        score=$((score + 50))
    elif [[ "$message" =~ test.*(login|vehicle|crud|flow) ]]; then
        score=$((score + 40))
    elif [[ "$message" =~ (verify|validate|check).*(functionality|feature) ]]; then
        score=$((score + 35))
    fi
    
    # Medium-confidence patterns (15-30 points)
    if [[ "$message" =~ test.*functionality|verify.*feature ]]; then
        score=$((score + 25))
    elif [[ "$message" =~ navigate.*and.*(test|verify|check) ]]; then
        score=$((score + 20))
    fi
    
    # Low-confidence patterns (5-15 points)
    if [[ "$message" =~ take.*screenshot|fill.*form|click.*button ]]; then
        score=$((score + 10))
    fi
    
    echo $score
}

# Analyze tool patterns for UAT indicators
analyze_tool_patterns() {
    local tool_name="$1" 
    local tool_params="$2"
    local score=0
    
    # Browser MCP tools get base score
    if [[ "$tool_name" =~ mcp__playwright__ ]]; then
        score=$((score + 10))
        
        # URL analysis
        local url=$(echo "$tool_params" | jq -r '.url // ""')
        if [[ "$url" =~ /auth/|/login|/signin ]]; then
            score=$((score + 20))  # Authentication URLs
        elif [[ "$url" =~ /(dashboard|projects|vehicles|users) ]]; then
            score=$((score + 15))  # Application URLs
        fi
        
        # Action analysis
        case "$tool_name" in
            "*navigate*")
                if [[ "$url" =~ /auth/ ]]; then score=$((score + 10)); fi
                ;;
            "*fill*")
                score=$((score + 15))  # Form interactions likely UAT
                ;;
            "*click*")
                score=$((score + 10))  # Button clicks likely UAT
                ;;
            "*screenshot*")
                score=$((score + 5))   # Screenshots often part of UAT
                ;;
        esac
    fi
    
    echo $score
}

# Analyze context patterns for correlation
analyze_context_patterns() {
    local message="$1"
    local tool_name="$2"
    local tool_params="$3"
    local score=0
    
    # Message + tool correlation
    if [[ "$message" =~ login && "$tool_name" =~ navigate && "$tool_params" =~ /auth/ ]]; then
        score=$((score + 20))  # Perfect correlation
    elif [[ "$message" =~ test && "$tool_name" =~ mcp__playwright__ ]]; then
        score=$((score + 15))  # Good correlation
    elif [[ "$message" =~ verify && "$tool_name" =~ screenshot ]]; then
        score=$((score + 10))  # Verification correlation
    fi
    
    echo $score
}

# Calculate overall confidence score
calculate_confidence_score() {
    local user_message="$1"
    local tool_name="$2"
    local tool_params="$3"
    
    local score=0
    
    # Message analysis (0-50 points)
    score=$((score + $(analyze_message_patterns "$user_message")))
    
    # Tool analysis (0-30 points)
    score=$((score + $(analyze_tool_patterns "$tool_name" "$tool_params")))
    
    # Context analysis (0-20 points)
    score=$((score + $(analyze_context_patterns "$user_message" "$tool_name" "$tool_params")))
    
    echo $score
}

# Make UAT decision based on confidence score
make_uat_decision() {
    local confidence_score="$1"
    local scenario_name="$2"
    
    # Confidence thresholds
    local THRESHOLD_HIGH=80      # Definitely UAT (auto-initialize)
    local THRESHOLD_MEDIUM=60    # Probably UAT (initialize with confirmation)
    local THRESHOLD_LOW=40       # Maybe UAT (require explicit confirmation)
    
    if [[ $confidence_score -ge $THRESHOLD_HIGH ]]; then
        if [[ -n "$scenario_name" ]] && validate_scenario "$scenario_name"; then
            echo "auto_initialize:$scenario_name"
        else
            echo "error:invalid_scenario"
        fi
    elif [[ $confidence_score -ge $THRESHOLD_MEDIUM ]]; then
        echo "confirm_initialize:$scenario_name"
    elif [[ $confidence_score -ge $THRESHOLD_LOW ]]; then
        echo "suggest_uat:$scenario_name"
    else
        echo "allow_normal"
    fi
}

# Detect UAT context from user input
detect_uat_context() {
    local user_message="$1"
    local tool_name="$2"
    local tool_params="$3"
    
    # Calculate confidence score
    local confidence_score=$(calculate_confidence_score "$user_message" "$tool_name" "$tool_params")
    
    # Extract or infer scenario name
    local scenario_name
    scenario_name=$(extract_scenario_name "$user_message")
    if [[ -z "$scenario_name" ]]; then
        scenario_name=$(find_best_scenario_match "$user_message")
    fi
    
    # Make UAT decision
    local decision=$(make_uat_decision "$confidence_score" "$scenario_name")
    
    # Return detection result
    local result
    result=$(jq -n \
        --arg decision "$decision" \
        --arg scenario "$scenario_name" \
        --argjson confidence "$confidence_score" \
        --arg message "$user_message" \
        --arg tool "$tool_name" \
        '{
            decision: $decision,
            scenario: $scenario,
            confidence: $confidence,
            context: {
                message: $message,
                tool: $tool,
                timestamp: now | todate
            }
        }')
    
    echo "$result"
}

# Check if UAT session is already active
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

# Get session context for existing session
get_session_context() {
    local claude_session_id="$1"
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    
    if [[ -f "$session_file" ]]; then
        local session_data
        if session_data=$(cat "$session_file" 2>/dev/null); then
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
    fi
}

# Load scenario information
load_scenario_info() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/${scenario_name}.js"
    
    if [[ ! -f "$scenario_file" ]]; then
        return 1
    fi
    
    # Load scenario and extract information
    node -e "
        try {
            const scenario = require('$scenario_file');
            const scenarioInfo = {
                name: scenario.name || '$scenario_name',
                description: scenario.description || '',
                totalSteps: scenario.steps ? scenario.steps.length : 0,
                currentStep: 1,
                completedSteps: 0,
                estimatedDuration: scenario.timeout || 45000,
                actualDuration: null,
                steps: scenario.steps ? scenario.steps.map((step, index) => ({
                    stepNumber: index + 1,
                    action: step.action,
                    description: step.description || '',
                    status: 'pending',
                    startTime: null,
                    endTime: null,
                    duration: null
                })) : []
            };
            console.log(JSON.stringify(scenarioInfo, null, 2));
        } catch (error) {
            process.exit(1);
        }
    " 2>/dev/null
}

# Create new UAT session state
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
    
    echo "$session_state"
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

# Initialize UAT session
initialize_uat_session() {
    local claude_session_id="$1"
    local scenario_name="$2"
    local user_message="$3"
    local detection_confidence="$4"
    
    log_info "Initializing UAT session for scenario: $scenario_name"
    
    # Create session state
    local session_state
    if ! session_state=$(create_session_state "$claude_session_id" "$scenario_name" "$user_message" "$detection_confidence"); then
        log_error "Failed to create session state"
        return 1
    fi
    
    # Get UAT session ID for directory creation
    local uat_session_id
    uat_session_id=$(echo "$session_state" | jq -r '.session.uatSessionId')
    
    # Create necessary directories
    mkdir -p "$UAT_ROOT/screenshots/$uat_session_id"
    mkdir -p "$UAT_ROOT/reports"
    mkdir -p "$UAT_ROOT/sessions"
    
    # Write session state
    if write_session_state "$claude_session_id" "$session_state"; then
        log_success "UAT session initialized: $uat_session_id"
        return 0
    else
        log_error "Failed to write session state"
        return 1
    fi
}

# Generate UAT-compliant screenshot name
generate_screenshot_name() {
    local original_name="$1"
    local session_context="$2"
    
    local uat_session_id=$(echo "$session_context" | jq -r '.uatSessionId')
    local scenario=$(echo "$session_context" | jq -r '.scenario')
    local current_step=$(echo "$session_context" | jq -r '.currentStep')
    local timestamp=$(date +%H%M%S)
    
    # Clean original name
    local clean_name=$(echo "$original_name" | sed 's/[^a-zA-Z0-9_-]/-/g')
    
    # Create UAT-compliant name
    echo "${uat_session_id}-${scenario}-step${current_step}-${clean_name}-${timestamp}"
}

# Resolve URL against base URL
resolve_url() {
    local url="$1"
    local base_url="$2"
    
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
    
    case "$action" in
        "navigate") echo 10000 ;;
        "click") echo 5000 ;;
        "fill") echo 5000 ;;
        "screenshot") echo 8000 ;;
        "evaluate") echo 15000 ;;
        *) echo 30000 ;;
    esac
}

# Enhance screenshot parameters
enhance_screenshot_params() {
    local params="$1"
    local session_context="$2"
    
    local original_name
    original_name=$(echo "$params" | jq -r '.name // "screenshot"')
    
    # Generate enhanced name
    local enhanced_name
    enhanced_name=$(generate_screenshot_name "$original_name" "$session_context")
    
    # Get screenshot directory
    local screenshot_dir
    screenshot_dir=$(echo "$session_context" | jq -r '.screenshotDirectory')
    
    # Create screenshots directory
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
    local session_context="$2"
    
    local original_url
    original_url=$(echo "$params" | jq -r '.url // empty')
    
    if [[ -z "$original_url" ]]; then
        log_warning "No URL found in navigation parameters"
        echo "$params"
        return 0
    fi
    
    # Resolve URL
    local base_url
    base_url=$(echo "$session_context" | jq -r '.baseUrl')
    local resolved_url
    resolved_url=$(resolve_url "$original_url" "$base_url")
    
    # Get appropriate timeout
    local timeout
    timeout=$(get_action_timeout "navigate")
    
    # Check mode for headless setting
    local mode
    mode=$(echo "$session_context" | jq -r '.mode // "production"')
    local headless="true"
    if [[ "$mode" == "debug" ]]; then
        headless="false"
    fi
    
    # Enhance parameters
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg url "$resolved_url" \
        --argjson timeout $timeout \
        --arg wait "networkidle" \
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
    local session_context="$2"
    
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
    local session_context="$2"
    
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

# Add performance monitoring metadata
add_performance_monitoring() {
    local params="$1"
    local tool_name="$2"
    local session_context="$3"
    
    # Add performance monitoring metadata
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg tool "$tool_name" \
        --arg session "$(echo "$session_context" | jq -r '.uatSessionId')" \
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

# Enhance tool parameters with UAT context
enhance_tool_parameters() {
    local tool_name="$1"
    local params="$2"
    local session_context="$3"
    
    log_debug "Enhancing parameters for: $tool_name"
    
    local enhanced_params="$params"
    
    # Tool-specific enhancements
    case "$tool_name" in
        "mcp__playwright__playwright_screenshot")
            enhanced_params=$(enhance_screenshot_params "$enhanced_params" "$session_context")
            ;;
        "mcp__playwright__playwright_navigate")
            enhanced_params=$(enhance_navigation_params "$enhanced_params" "$session_context")
            ;;
        "mcp__playwright__playwright_click")
            enhanced_params=$(enhance_click_params "$enhanced_params" "$session_context")
            ;;
        "mcp__playwright__playwright_fill")
            enhanced_params=$(enhance_fill_params "$enhanced_params" "$session_context")
            ;;
    esac
    
    # Add performance monitoring metadata
    enhanced_params=$(add_performance_monitoring "$enhanced_params" "$tool_name" "$session_context")
    
    echo "$enhanced_params"
}

# Main hook logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    log_debug "Session ID: $SESSION_ID"
    log_debug "User message: $USER_MESSAGE"
    
    # Check if this is a Browser MCP tool
    if ! is_browser_mcp_tool "$TOOL_NAME"; then
        log_debug "Not a Browser MCP tool, allowing: $TOOL_NAME"
        output_response "approve" "Non-Browser MCP tool allowed"
        exit 0
    fi
    
    log_debug "Browser MCP tool detected: $TOOL_NAME"
    
    # Check if UAT session is already active
    if is_session_active "$SESSION_ID"; then
        log_debug "UAT session already active, enhancing parameters"
        
        # Get session context
        local session_context
        session_context=$(get_session_context "$SESSION_ID")
        
        # Enhance tool parameters
        local enhanced_params
        enhanced_params=$(enhance_tool_parameters "$TOOL_NAME" "$TOOL_PARAMS" "$session_context")
        
        # Create response data
        local response_data
        response_data=$(jq -n \
            --argjson context "$session_context" \
            '{
                uatContext: $context,
                parametersEnhanced: true,
                sessionActive: true
            }')
        
        log_success "Parameters enhanced for active UAT session"
        output_response "modify" "Tool parameters enhanced with UAT context" "$enhanced_params" "$response_data"
        exit 0
    fi
    
    # No active session, detect UAT context
    log_debug "No active UAT session, detecting context from user input"
    
    # Detect UAT context
    local detection_result
    detection_result=$(detect_uat_context "$USER_MESSAGE" "$TOOL_NAME" "$TOOL_PARAMS")
    local decision=$(echo "$detection_result" | jq -r '.decision')
    local scenario_name=$(echo "$detection_result" | jq -r '.scenario')
    local confidence=$(echo "$detection_result" | jq -r '.confidence')
    
    log_debug "UAT detection result: $decision (confidence: $confidence)"
    
    case "$decision" in
        "auto_initialize:"*)
            local scenario="${decision#auto_initialize:}"
            log_info "Auto-initializing UAT session for scenario: $scenario"
            
            if initialize_uat_session "$SESSION_ID" "$scenario" "$USER_MESSAGE" "$confidence"; then
                # Get session context
                local session_context
                session_context=$(get_session_context "$SESSION_ID")
                
                # Enhance tool parameters
                local enhanced_params
                enhanced_params=$(enhance_tool_parameters "$TOOL_NAME" "$TOOL_PARAMS" "$session_context")
                
                # Create response data
                local response_data
                response_data=$(jq -n \
                    --arg scenario "$scenario" \
                    --argjson confidence "$confidence" \
                    --argjson context "$session_context" \
                    '{
                        scenario: $scenario,
                        confidence: $confidence,
                        autoInitialized: true,
                        uatContext: $context
                    }')
                
                log_success "UAT session initialized and parameters enhanced"
                output_response "modify" "UAT session auto-initialized for scenario: $scenario" "$enhanced_params" "$response_data"
            else
                log_error "Failed to initialize UAT session"
                output_response "error" "Failed to initialize UAT session"
            fi
            ;;
        "allow_normal")
            log_debug "No UAT context detected, allowing normal tool execution"
            output_response "approve" "Normal tool execution (no UAT context detected)"
            ;;
        "error:"*)
            local error_type="${decision#error:}"
            log_error "UAT detection error: $error_type"
            output_response "block" "UAT error: $error_type"
            ;;
        "confirm_initialize:"*|"suggest_uat:"*)
            # For now, treat medium confidence as auto-initialize
            # In future, could implement user confirmation flow
            local scenario="${decision#*:}"
            log_info "Medium confidence UAT detection, auto-initializing: $scenario"
            
            if [[ -n "$scenario" ]] && initialize_uat_session "$SESSION_ID" "$scenario" "$USER_MESSAGE" "$confidence"; then
                local session_context
                session_context=$(get_session_context "$SESSION_ID")
                
                local enhanced_params
                enhanced_params=$(enhance_tool_parameters "$TOOL_NAME" "$TOOL_PARAMS" "$session_context")
                
                local response_data
                response_data=$(jq -n \
                    --arg scenario "$scenario" \
                    --argjson confidence "$confidence" \
                    --argjson context "$session_context" \
                    '{
                        scenario: $scenario,
                        confidence: $confidence,
                        autoInitialized: true,
                        uatContext: $context
                    }')
                
                log_success "UAT session initialized with medium confidence"
                output_response "modify" "UAT session initialized for scenario: $scenario" "$enhanced_params" "$response_data"
            else
                log_debug "Medium confidence but no valid scenario, allowing normal execution"
                output_response "approve" "Normal tool execution (medium confidence but no valid scenario)"
            fi
            ;;
        *)
            log_warning "Unknown UAT decision: $decision"
            output_response "approve" "Unknown UAT decision, allowing normal execution"
            ;;
    esac
    
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