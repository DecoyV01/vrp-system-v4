#!/bin/bash
#
# UAT Session Initialization Script
# 
# This script sets up the environment and state for hook-based UAT execution
# It must be run before starting a Claude Code session with UAT workflows
#
# Usage: ./uat-init-session.sh --scenario=<scenario-name> [--mode=debug] [--session-id=auto]
#

set -euo pipefail

# Script directory and UAT root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UAT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
SCENARIO_NAME=""
MODE="production"
SESSION_ID="auto"
BASE_URL="https://vrp-system-v4.pages.dev"
HELP=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 --scenario=<scenario-name> [OPTIONS]

Initialize UAT session for hook-based execution with Claude Code.

Required Arguments:
  --scenario=NAME     Name of the UAT scenario to execute (e.g., login-flow, vehicle-crud)

Optional Arguments:
  --mode=MODE         Execution mode: debug or production (default: production)
  --session-id=ID     Session identifier: auto or custom ID (default: auto)
  --base-url=URL      Base URL for testing (default: https://vrp-system-v4.pages.dev)
  --help              Show this help message

Examples:
  $0 --scenario=login-flow --mode=debug
  $0 --scenario=vehicle-crud --session-id=test-001
  $0 --scenario=login-flow --base-url=http://localhost:5173

Available Scenarios:
EOF
    
    # List available scenarios
    if [[ -d "$UAT_ROOT/scenarios" ]]; then
        for scenario in "$UAT_ROOT/scenarios"/*.js; do
            if [[ -f "$scenario" ]]; then
                scenario_name=$(basename "$scenario" .js)
                echo "  - $scenario_name"
            fi
        done
    else
        echo "  (No scenarios directory found)"
    fi
}

# Parse command line arguments
parse_arguments() {
    for arg in "$@"; do
        case $arg in
            --scenario=*)
                SCENARIO_NAME="${arg#*=}"
                ;;
            --mode=*)
                MODE="${arg#*=}"
                ;;
            --session-id=*)
                SESSION_ID="${arg#*=}"
                ;;
            --base-url=*)
                BASE_URL="${arg#*=}"
                ;;
            --help)
                HELP=true
                ;;
            *)
                log_error "Unknown argument: $arg"
                echo ""
                show_usage
                exit 1
                ;;
        esac
    done

    # Show help if requested
    if [[ "$HELP" == true ]]; then
        show_usage
        exit 0
    fi

    # Validate required arguments
    if [[ -z "$SCENARIO_NAME" ]]; then
        log_error "Scenario name is required"
        echo ""
        show_usage
        exit 1
    fi

    # Validate mode
    if [[ "$MODE" != "debug" && "$MODE" != "production" ]]; then
        log_error "Mode must be 'debug' or 'production'"
        exit 1
    fi
}

# Generate session ID if auto
generate_session_id() {
    if [[ "$SESSION_ID" == "auto" ]]; then
        SESSION_ID=$(date +%Y%m%d-%H%M%S)
    fi
    
    # Validate session ID format
    if [[ ! "$SESSION_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Session ID can only contain letters, numbers, hyphens, and underscores"
        exit 1
    fi
}

# Validate scenario exists and is properly formatted
validate_scenario() {
    local scenario_file="$UAT_ROOT/scenarios/$SCENARIO_NAME.js"
    
    log_info "Validating scenario: $SCENARIO_NAME"
    
    # Check if scenario file exists
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        log_info "Available scenarios:"
        ls -1 "$UAT_ROOT/scenarios"/*.js 2>/dev/null | sed 's/.*\///;s/\.js$//' | sed 's/^/  - /' || echo "  (No scenarios found)"
        exit 1
    fi
    
    # Validate scenario structure using Node.js
    if ! node -e "
        try {
            const scenario = require('$scenario_file');
            if (!scenario.name || !scenario.steps || !Array.isArray(scenario.steps)) {
                console.error('Invalid scenario structure: missing name or steps array');
                process.exit(1);
            }
            if (scenario.steps.length === 0) {
                console.error('Scenario has no steps');
                process.exit(1);
            }
            console.log('Scenario validation successful:');
            console.log('  Name: ' + scenario.name);
            console.log('  Description: ' + (scenario.description || 'No description'));
            console.log('  Steps: ' + scenario.steps.length);
            if (scenario.preconditions) {
                console.log('  Preconditions: ' + scenario.preconditions.length);
            }
        } catch (error) {
            console.error('Error loading scenario:', error.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        log_success "Scenario validation successful"
    else
        log_error "Scenario validation failed"
        exit 1
    fi
}

# Create necessary directory structure
create_directories() {
    log_info "Creating directory structure"
    
    local dirs=(
        "$UAT_ROOT/sessions"
        "$UAT_ROOT/screenshots"
        "$UAT_ROOT/reports"
        "$UAT_ROOT/logs"
        "$UAT_ROOT/config"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        fi
    done
    
    log_success "Directory structure ready"
}

# Create session state file
create_session_state() {
    local session_file="$UAT_ROOT/sessions/hook-active-session.json"
    local scenario_file="$UAT_ROOT/scenarios/$SCENARIO_NAME.js"
    
    log_info "Creating session state file"
    
    # Load scenario to get step count and metadata
    local scenario_data
    scenario_data=$(node -e "
        const scenario = require('$scenario_file');
        const stepCount = scenario.steps ? scenario.steps.length : 0;
        const data = {
            name: scenario.name,
            description: scenario.description || '',
            stepCount: stepCount,
            timeout: scenario.timeout || 30000,
            preconditions: scenario.preconditions || []
        };
        console.log(JSON.stringify(data));
    ")
    
    # Create session state JSON
    cat > "$session_file" << EOF
{
  "sessionId": "$SESSION_ID",
  "scenarioName": "$SCENARIO_NAME",
  "mode": "$MODE",
  "baseUrl": "$BASE_URL",
  "startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "initialized",
  "currentStep": 0,
  "totalSteps": $(echo "$scenario_data" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).stepCount)"),
  "scenario": $scenario_data,
  "steps": [],
  "validationResults": [],
  "screenshots": [],
  "errors": [],
  "performance": {
    "startTime": $(date +%s%3N),
    "stepTimes": []
  }
}
EOF
    
    log_success "Session state created: $session_file"
}

# Create hook configuration
create_hook_config() {
    local config_file="$UAT_ROOT/config/hook-config.json"
    
    log_info "Creating hook configuration"
    
    cat > "$config_file" << EOF
{
  "version": "1.0.0",
  "sessionId": "$SESSION_ID",
  "mode": "$MODE",
  "hooks": {
    "uat-session-manager": {
      "enabled": true,
      "priority": 1,
      "timeout": 30,
      "blockUnauthorized": true,
      "logLevel": "$([[ "$MODE" == "debug" ]] && echo "debug" || echo "info")"
    },
    "uat-parameter-enhancer": {
      "enabled": true,
      "priority": 2,
      "timeout": 10,
      "enhanceScreenshots": true,
      "enhanceTimeouts": true,
      "enhanceUrls": true,
      "logLevel": "$([[ "$MODE" == "debug" ]] && echo "debug" || echo "info")"
    },
    "uat-validation-injector": {
      "enabled": true,
      "priority": 3,
      "timeout": 15,
      "injectHealthCheck": true,
      "injectValidation": true,
      "logLevel": "$([[ "$MODE" == "debug" ]] && echo "debug" || echo "info")"
    },
    "uat-progress-tracker": {
      "enabled": true,
      "timeout": 20,
      "captureScreenshots": true,
      "capturePerformance": true,
      "updateProgress": true,
      "logLevel": "$([[ "$MODE" == "debug" ]] && echo "debug" || echo "info")"
    },
    "uat-session-finalizer": {
      "enabled": true,
      "timeout": 60,
      "generateReports": true,
      "archiveSession": true,
      "cleanup": true,
      "sendNotifications": false,
      "logLevel": "$([[ "$MODE" == "debug" ]] && echo "debug" || echo "info")"
    }
  },
  "browserMcp": {
    "screenshotDir": "$UAT_ROOT/screenshots/$SESSION_ID",
    "defaultTimeout": 30000,
    "waitConditions": "networkIdle",
    "headless": $([[ "$MODE" == "debug" ]] && echo "false" || echo "true")
  },
  "validation": {
    "healthCheckEnabled": true,
    "customValidations": true,
    "strictMode": $([[ "$MODE" == "debug" ]] && echo "false" || echo "true")
  }
}
EOF
    
    log_success "Hook configuration created: $config_file"
}

# Set up environment variables
setup_environment() {
    local env_file="$UAT_ROOT/.uat-env"
    
    log_info "Setting up environment variables"
    
    # Create environment file for persistent storage
    cat > "$env_file" << EOF
# UAT Hook Integration Environment Variables
# Source this file in your shell or use it with Claude Code
export UAT_HOOKS_ENABLED=true
export UAT_ACTIVE_SCENARIO=$SCENARIO_NAME
export UAT_SESSION_ID=$SESSION_ID
export UAT_MODE=$MODE
export UAT_BASE_URL=$BASE_URL
export UAT_ROOT=$UAT_ROOT
export UAT_SCREENSHOTS_DIR=$UAT_ROOT/screenshots/$SESSION_ID
export UAT_REPORTS_DIR=$UAT_ROOT/reports/$SESSION_ID
export UAT_LOGS_DIR=$UAT_ROOT/logs/$SESSION_ID

# Hook-specific environment
export UAT_SESSION_STATE_FILE=$UAT_ROOT/sessions/hook-active-session.json
export UAT_HOOK_CONFIG_FILE=$UAT_ROOT/config/hook-config.json
export UAT_SCENARIO_FILE=$UAT_ROOT/scenarios/$SCENARIO_NAME.js
EOF
    
    # Source the environment in current shell
    source "$env_file"
    
    log_success "Environment variables configured"
    log_info "Environment file created: $env_file"
    
    if [[ "$MODE" == "debug" ]]; then
        log_info "Debug mode enabled - detailed logging will be available"
    fi
}

# Create log file for session
create_log_file() {
    local log_dir="$UAT_ROOT/logs/$SESSION_ID"
    local log_file="$log_dir/session.log"
    
    mkdir -p "$log_dir"
    
    # Initialize log file
    cat > "$log_file" << EOF
UAT Session Log
===============
Session ID: $SESSION_ID
Scenario: $SCENARIO_NAME
Mode: $MODE
Base URL: $BASE_URL
Start Time: $(date)

Initialization completed successfully.
EOF
    
    log_success "Session log created: $log_file"
}

# Main initialization function
main() {
    echo "UAT Hook-Based Session Initializer"
    echo "=================================="
    echo ""
    
    # Parse and validate arguments
    parse_arguments "$@"
    
    # Generate session ID if needed
    generate_session_id
    
    log_info "Initializing UAT session: $SESSION_ID"
    log_info "Scenario: $SCENARIO_NAME"
    log_info "Mode: $MODE"
    log_info "Base URL: $BASE_URL"
    echo ""
    
    # Validate scenario
    validate_scenario
    
    # Create directory structure
    create_directories
    
    # Create session state
    create_session_state
    
    # Create hook configuration
    create_hook_config
    
    # Set up environment
    setup_environment
    
    # Create log file
    create_log_file
    
    echo ""
    log_success "UAT Session initialized: $SESSION_ID"
    log_success "Scenario validated: $SCENARIO_NAME"
    log_success "Environment configured for hooks"
    log_success "Ready for Claude Code session"
    echo ""
    
    # Show next steps
    echo "Next Steps:"
    echo "==========="
    echo "1. Start Claude Code session with hooks enabled"
    echo "2. Use Browser MCP tools normally - hooks will enhance them automatically"
    echo "3. Follow your scenario: $SCENARIO_NAME"
    echo ""
    
    if [[ "$MODE" == "debug" ]]; then
        echo "Debug Information:"
        echo "=================="
        echo "Session State: $UAT_ROOT/sessions/hook-active-session.json"
        echo "Hook Config: $UAT_ROOT/config/hook-config.json"
        echo "Environment: $UAT_ROOT/.uat-env"
        echo "Logs: $UAT_ROOT/logs/$SESSION_ID/"
        echo ""
    fi
    
    echo "To source environment variables in your current shell:"
    echo "source $UAT_ROOT/.uat-env"
    echo ""
    echo "UAT Hook session ready! 🚀"
}

# Run main function with all arguments
main "$@"