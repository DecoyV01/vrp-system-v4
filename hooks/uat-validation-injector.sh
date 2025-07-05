#!/bin/bash
#
# UAT Validation Framework Injection Hook (PreToolUse)
# 
# Ensures UAT validation capabilities are available in browser before page interactions.
# This hook runs after parameter enhancement to inject validation framework when needed:
# - Detects page interaction tools (click, fill, navigate)
# - Injects UAT health check system before interactions
# - Loads scenario-specific validation scripts
# - Ensures validation framework availability
# - Handles validation framework errors gracefully
#
# Hook Type: PreToolUse
# Priority: 3 (runs after parameter enhancement)
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
HOOK_NAME="uat-validation-injector"
HOOK_TIMEOUT=15
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

# Check if tool requires validation framework
requires_validation_framework() {
    local tool="$1"
    
    case "$tool" in
        mcp__playwright__playwright_click|\
        mcp__playwright__playwright_fill|\
        mcp__playwright__playwright_navigate|\
        mcp__playwright__playwright_evaluate)
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

# Load session state
load_session_state() {
    local state_file="$UAT_ROOT/sessions/hook-active-session.json"
    
    if [[ -f "$state_file" ]]; then
        cat "$state_file"
    else
        echo "{}"
    fi
}

# Get UAT health check framework script
get_health_check_script() {
    cat << 'EOF'
// UAT Health Check Framework
// This script provides comprehensive health monitoring for UAT scenarios

(function() {
    'use strict';
    
    // Prevent multiple initialization
    if (typeof window.__UAT_HEALTH__ !== 'undefined') {
        console.log('UAT Health Check already initialized');
        return window.__UAT_HEALTH__;
    }
    
    console.log('Initializing UAT Health Check Framework...');
    
    // Health check state
    const healthState = {
        initialized: true,
        timestamp: new Date().toISOString(),
        sessionId: '{SESSION_ID}',
        scenario: '{SCENARIO_NAME}',
        mode: '{UAT_MODE}',
        apiCalls: [],
        errors: [],
        actionLog: [],
        dataLoadState: {},
        authState: null,
        routeState: null
    };
    
    // API call interceptor
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const startTime = Date.now();
        const url = args[0];
        
        return originalFetch.apply(this, args)
            .then(response => {
                const endTime = Date.now();
                healthState.apiCalls.push({
                    url: url,
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    success: response.ok
                });
                return response;
            })
            .catch(error => {
                const endTime = Date.now();
                healthState.apiCalls.push({
                    url: url,
                    method: args[1]?.method || 'GET',
                    error: error.message,
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    success: false
                });
                throw error;
            });
    };
    
    // Error interceptor
    window.addEventListener('error', function(event) {
        healthState.errors.push({
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            column: event.colno,
            timestamp: new Date().toISOString(),
            type: 'javascript'
        });
    });
    
    // Unhandled promise rejection interceptor
    window.addEventListener('unhandledrejection', function(event) {
        healthState.errors.push({
            message: event.reason?.message || 'Unhandled promise rejection',
            promise: event.promise,
            timestamp: new Date().toISOString(),
            type: 'promise'
        });
    });
    
    // UAT Health Check API
    window.__UAT_HEALTH__ = {
        // State checking methods
        isLoggedIn: function() {
            // Check for authentication indicators
            const indicators = [
                () => !!document.querySelector('[data-testid="user-menu"]'),
                () => !!document.querySelector('.user-avatar'),
                () => !!document.querySelector('[data-user-authenticated]'),
                () => !!window.__convexAuthState?.isAuthenticated,
                () => !!window.__userData,
                () => !document.querySelector('[data-testid="login-form"]'),
                () => !window.location.href.includes('/auth/login')
            ];
            
            const loggedIn = indicators.some(check => {
                try { return check(); } catch { return false; }
            });
            
            healthState.authState = loggedIn;
            return loggedIn;
        },
        
        currentRoute: function() {
            const route = window.location.pathname;
            healthState.routeState = route;
            return route;
        },
        
        hasErrors: function() {
            return healthState.errors.length > 0;
        },
        
        isLoading: function() {
            // Check for loading indicators
            const loadingIndicators = [
                () => !!document.querySelector('[data-testid="loading"]'),
                () => !!document.querySelector('.loading-spinner'),
                () => !!document.querySelector('.loader'),
                () => document.readyState !== 'complete'
            ];
            
            return loadingIndicators.some(check => {
                try { return check(); } catch { return false; }
            });
        },
        
        // Data extraction methods
        getFormData: function(formId) {
            const form = formId ? document.getElementById(formId) : document.querySelector('form');
            if (!form) return {};
            
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        },
        
        getLastApiCall: function() {
            return healthState.apiCalls[healthState.apiCalls.length - 1] || null;
        },
        
        getActionLog: function() {
            return [...healthState.actionLog];
        },
        
        getUserData: function() {
            return window.__userData || window.__convexAuthState || null;
        },
        
        getProjectData: function() {
            // Try to extract current project data
            const projectIndicators = [
                () => window.__currentProject,
                () => document.querySelector('[data-project-id]')?.dataset.projectId,
                () => {
                    const match = window.location.pathname.match(/\/projects\/([^\/]+)/);
                    return match ? match[1] : null;
                }
            ];
            
            for (const indicator of projectIndicators) {
                try {
                    const result = indicator();
                    if (result) return result;
                } catch (e) {
                    // Continue to next indicator
                }
            }
            
            return null;
        },
        
        getDataLoadState: function() {
            return {...healthState.dataLoadState};
        },
        
        // Testing utility methods
        logAction: function(action, details) {
            const entry = {
                action: action,
                details: details || {},
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
            
            healthState.actionLog.push(entry);
            
            // Keep only last 100 entries
            if (healthState.actionLog.length > 100) {
                healthState.actionLog.shift();
            }
            
            console.log('UAT Action:', entry);
        },
        
        clearActionLog: function() {
            healthState.actionLog = [];
        },
        
        setLoadState: function(entity, state) {
            healthState.dataLoadState[entity] = {
                state: state,
                timestamp: new Date().toISOString()
            };
        },
        
        // Validation helpers
        waitForElement: function(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                const observer = new MutationObserver((mutations, obs) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        obs.disconnect();
                        resolve(element);
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element not found: ${selector}`));
                }, timeout);
            });
        },
        
        waitForCondition: function(conditionFn, timeout = 5000, interval = 100) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                const check = () => {
                    try {
                        if (conditionFn()) {
                            resolve(true);
                            return;
                        }
                    } catch (e) {
                        // Continue checking
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('Condition timeout'));
                        return;
                    }
                    
                    setTimeout(check, interval);
                };
                
                check();
            });
        },
        
        // Internal state access (for debugging)
        _getHealthState: function() {
            return {...healthState};
        },
        
        _getStats: function() {
            return {
                initialized: healthState.initialized,
                sessionId: healthState.sessionId,
                scenario: healthState.scenario,
                apiCallCount: healthState.apiCalls.length,
                errorCount: healthState.errors.length,
                actionCount: healthState.actionLog.length,
                authState: healthState.authState,
                routeState: healthState.routeState,
                timestamp: healthState.timestamp
            };
        }
    };
    
    // Auto-detect authentication state changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(() => window.__UAT_HEALTH__.logAction('navigation', { url: window.location.href }), 100);
    };
    
    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        setTimeout(() => window.__UAT_HEALTH__.logAction('navigation', { url: window.location.href }), 100);
    };
    
    window.addEventListener('popstate', function() {
        setTimeout(() => window.__UAT_HEALTH__.logAction('navigation', { url: window.location.href }), 100);
    });
    
    // Log framework initialization
    window.__UAT_HEALTH__.logAction('framework_initialized', {
        sessionId: healthState.sessionId,
        scenario: healthState.scenario,
        mode: healthState.mode
    });
    
    console.log('UAT Health Check Framework initialized successfully');
    return window.__UAT_HEALTH__;
})();
EOF
}

# Get scenario-specific validation scripts
get_scenario_validation_script() {
    local scenario_name="$1"
    
    cat << EOF
// Scenario-specific validation for: $scenario_name
(function() {
    if (!window.__UAT_HEALTH__) {
        console.warn('UAT Health Check not available for scenario validation');
        return;
    }
    
    // Log scenario start
    window.__UAT_HEALTH__.logAction('scenario_validation_loaded', {
        scenario: '$scenario_name'
    });
    
    // Add scenario-specific validation functions
    window.__UAT_HEALTH__.validateScenario = function() {
        const scenario = '$scenario_name';
        
        switch (scenario) {
            case 'login-flow':
                return this.validateLoginFlow();
            case 'vehicle-crud':
                return this.validateVehicleCrud();
            default:
                return { valid: true, message: 'No specific validation for scenario' };
        }
    };
    
    window.__UAT_HEALTH__.validateLoginFlow = function() {
        const checks = [
            {
                name: 'login_form_exists',
                check: () => !!document.querySelector('#email, [data-testid="email"]'),
                required: window.location.href.includes('/auth/login')
            },
            {
                name: 'password_field_exists', 
                check: () => !!document.querySelector('#password, [data-testid="password"]'),
                required: window.location.href.includes('/auth/login')
            },
            {
                name: 'login_button_exists',
                check: () => !!document.querySelector('#login-button, [data-testid="login-button"]'),
                required: window.location.href.includes('/auth/login')
            }
        ];
        
        const results = checks.map(check => ({
            name: check.name,
            passed: !check.required || check.check(),
            required: check.required
        }));
        
        const failed = results.filter(r => r.required && !r.passed);
        
        return {
            valid: failed.length === 0,
            message: failed.length > 0 ? \`Failed checks: \${failed.map(f => f.name).join(', ')}\` : 'All checks passed',
            results: results
        };
    };
    
    window.__UAT_HEALTH__.validateVehicleCrud = function() {
        const checks = [
            {
                name: 'vehicle_list_exists',
                check: () => !!document.querySelector('.vehicle-list, [data-testid="vehicle-list"]'),
                required: window.location.href.includes('/vehicles')
            },
            {
                name: 'add_vehicle_button',
                check: () => !!document.querySelector('#add-vehicle-button, [data-testid="add-vehicle"]'),
                required: window.location.href.includes('/vehicles')
            }
        ];
        
        const results = checks.map(check => ({
            name: check.name,
            passed: !check.required || check.check(),
            required: check.required
        }));
        
        const failed = results.filter(r => r.required && !r.passed);
        
        return {
            valid: failed.length === 0,
            message: failed.length > 0 ? \`Failed checks: \${failed.map(f => f.name).join(', ')}\` : 'All checks passed',
            results: results
        };
    };
    
    console.log('Scenario validation loaded for: $scenario_name');
})();
EOF
}

# Create validation injection script
create_injection_script() {
    local session_state="$1"
    local tool_name="$2"
    
    local session_id
    session_id=$(echo "$session_state" | jq -r '.sessionId // "unknown"')
    
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenarioName // "unknown"')
    
    local uat_mode
    uat_mode=$(echo "$session_state" | jq -r '.mode // "production"')
    
    # Get health check framework script and replace placeholders
    local health_script
    health_script=$(get_health_check_script | sed "s/{SESSION_ID}/$session_id/g" | sed "s/{SCENARIO_NAME}/$scenario_name/g" | sed "s/{UAT_MODE}/$uat_mode/g")
    
    # Get scenario-specific validation
    local scenario_script
    scenario_script=$(get_scenario_validation_script "$scenario_name")
    
    # Combine scripts
    local full_script
    full_script=$(cat << EOF
// UAT Validation Framework Injection
// Auto-injected by uat-validation-injector hook

console.log('Injecting UAT validation framework...');

// Health Check Framework
$health_script

// Scenario-specific validation
$scenario_script

console.log('UAT validation framework injection complete');
EOF
)
    
    echo "$full_script"
}

# Inject validation framework for navigation
inject_for_navigation() {
    local params="$1"
    local session_state="$2"
    
    local injection_script
    injection_script=$(create_injection_script "$session_state" "navigate")
    
    # Add post-navigation script to inject framework
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg script "$injection_script" \
        '. + {
            "_uat_post_navigation_script": $script,
            "_uat_inject_validation": true
        }')
    
    log_debug "Added validation injection to navigation"
    echo "$enhanced_params"
}

# Inject validation framework for evaluation
inject_for_evaluation() {
    local params="$1"
    local session_state="$2"
    
    local existing_script
    existing_script=$(echo "$params" | jq -r '.script // ""')
    
    local injection_script
    injection_script=$(create_injection_script "$session_state" "evaluate")
    
    # Prepend validation framework to existing script
    local combined_script
    combined_script=$(cat << EOF
// UAT Validation Framework (injected by hook)
$injection_script

// Original script
$existing_script
EOF
)
    
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg script "$combined_script" \
        '. + {
            "script": $script,
            "_uat_validation_injected": true
        }')
    
    log_debug "Added validation injection to evaluate script"
    echo "$enhanced_params"
}

# Add validation framework metadata
add_validation_metadata() {
    local params="$1"
    local tool_name="$2"
    
    local enhanced_params
    enhanced_params=$(echo "$params" | jq \
        --arg tool "$tool_name" \
        '. + {
            "_uat_validation": {
                "framework_required": true,
                "tool": $tool,
                "injected_by": "uat-validation-injector",
                "timestamp": now
            }
        }')
    
    echo "$enhanced_params"
}

# Main injection logic
inject_validation_framework() {
    local tool_name="$1"
    local params="$2" 
    local session_state="$3"
    
    log_debug "Injecting validation framework for: $tool_name"
    
    local enhanced_params="$params"
    
    case "$tool_name" in
        "mcp__playwright__playwright_navigate")
            enhanced_params=$(inject_for_navigation "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_evaluate")
            enhanced_params=$(inject_for_evaluation "$enhanced_params" "$session_state")
            ;;
        "mcp__playwright__playwright_click"|\
        "mcp__playwright__playwright_fill")
            # For click and fill, add metadata to ensure framework is available
            enhanced_params=$(add_validation_metadata "$enhanced_params" "$tool_name")
            ;;
    esac
    
    echo "$enhanced_params"
}

# Main hook logic
main() {
    log_debug "Hook triggered for tool: $TOOL_NAME"
    
    # Check if tool requires validation framework
    if ! requires_validation_framework "$TOOL_NAME"; then
        log_debug "Tool does not require validation framework: $TOOL_NAME"
        output_response "approve" "Tool does not require validation framework"
        exit 0
    fi
    
    # Check if UAT mode is active
    if ! is_uat_active; then
        log_debug "UAT mode not active, skipping validation injection"
        output_response "approve" "UAT mode not active, no validation injection needed"
        exit 0
    fi
    
    log_debug "Injecting validation framework for: $TOOL_NAME"
    
    # Load session state
    local session_state
    session_state=$(load_session_state)
    
    # Inject validation framework
    local enhanced_params
    enhanced_params=$(inject_validation_framework "$TOOL_NAME" "$TOOL_PARAMS" "$session_state")
    
    if [[ "$enhanced_params" == "$TOOL_PARAMS" ]]; then
        log_debug "No validation injection needed"
        output_response "approve" "Validation framework already available"
    else
        log_success "Validation framework injection prepared"
        output_response "modify" "Validation framework injection added" "$enhanced_params"
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