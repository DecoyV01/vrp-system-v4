#!/bin/bash
#
# UAT Scenario Selection & Validation
# 
# This script provides robust scenario loading and validation system for hook-based UAT execution.
# It handles scenario validation, step loading, precondition checking, and progress tracking.
#
# Usage: 
#   ./uat-scenario-selector.sh validate <scenario-name>
#   ./uat-scenario-selector.sh load-steps <scenario-name>
#   ./uat-scenario-selector.sh check-preconditions <scenario-name>
#   ./uat-scenario-selector.sh get-step <scenario-name> <step-number>
#

set -euo pipefail

# Script directory and UAT root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UAT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC} $1" >&2; }
log_success() { echo -e "${GREEN}✅${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1" >&2; }
log_error() { echo -e "${RED}❌${NC} $1" >&2; }

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <command> <scenario-name> [options]

UAT Scenario Selection & Validation Tool

Commands:
  validate <scenario>           Validate scenario structure and requirements
  load-steps <scenario>         Load and parse scenario steps
  check-preconditions <scenario> Check scenario preconditions
  get-step <scenario> <num>     Get specific step from scenario
  list-scenarios               List all available scenarios
  get-metadata <scenario>      Get scenario metadata
  create-execution-plan <scenario> Create step execution plan

Examples:
  $0 validate login-flow
  $0 load-steps vehicle-crud
  $0 check-preconditions login-flow
  $0 get-step login-flow 3
  $0 list-scenarios
EOF
}

# Validate scenario exists and has proper structure
validate_scenario() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/$scenario_name.js"
    
    log_info "Validating scenario: $scenario_name"
    
    # Check if scenario file exists
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        return 1
    fi
    
    # Validate scenario structure using Node.js
    local validation_result
    validation_result=$(node -e "
        try {
            const scenario = require('$scenario_file');
            
            // Validation results object
            const validation = {
                valid: true,
                errors: [],
                warnings: [],
                metadata: {}
            };
            
            // Required fields validation
            if (!scenario.name) {
                validation.errors.push('Missing required field: name');
            }
            
            if (!scenario.steps || !Array.isArray(scenario.steps)) {
                validation.errors.push('Missing or invalid required field: steps (must be array)');
            } else if (scenario.steps.length === 0) {
                validation.errors.push('Scenario has no steps');
            }
            
            // Optional fields validation
            if (scenario.timeout && typeof scenario.timeout !== 'number') {
                validation.warnings.push('timeout should be a number (milliseconds)');
            }
            
            if (scenario.preconditions && !Array.isArray(scenario.preconditions)) {
                validation.warnings.push('preconditions should be an array');
            }
            
            // Step validation
            if (scenario.steps && Array.isArray(scenario.steps)) {
                scenario.steps.forEach((step, index) => {
                    const stepNum = index + 1;
                    
                    if (!step.action) {
                        validation.errors.push(\`Step \${stepNum}: missing required field 'action'\`);
                    }
                    
                    // Validate action types
                    const validActions = [
                        'navigate', 'click', 'fill', 'screenshot', 'verify_state', 
                        'custom_script', 'wait', 'verify_login_success', 'verify_logged_out',
                        'logout', 'create_vehicle', 'read_vehicle', 'update_vehicle', 
                        'delete_vehicle', 'navigate_to_vehicles'
                    ];
                    
                    if (step.action && !validActions.includes(step.action)) {
                        validation.warnings.push(\`Step \${stepNum}: unknown action '\${step.action}'\`);
                    }
                    
                    // Validate specific action requirements
                    if (step.action === 'navigate' && !step.url) {
                        validation.errors.push(\`Step \${stepNum}: navigate action requires 'url' field\`);
                    }
                    
                    if (step.action === 'click' && !step.selector) {
                        validation.errors.push(\`Step \${stepNum}: click action requires 'selector' field\`);
                    }
                    
                    if (step.action === 'fill' && !step.fields && !step.selector) {
                        validation.errors.push(\`Step \${stepNum}: fill action requires 'fields' or 'selector' field\`);
                    }
                    
                    if (step.action === 'screenshot' && !step.name) {
                        validation.errors.push(\`Step \${stepNum}: screenshot action requires 'name' field\`);
                    }
                    
                    // Validate nested steps
                    if (step.steps && !Array.isArray(step.steps)) {
                        validation.errors.push(\`Step \${stepNum}: nested steps must be an array\`);
                    }
                    
                    // Check for circular dependencies (simplified check)
                    if (step.steps && step.steps.length > 10) {
                        validation.warnings.push(\`Step \${stepNum}: deep nesting detected (>10 levels)\`);
                    }
                });
            }
            
            // Set validation status
            validation.valid = validation.errors.length === 0;
            
            // Collect metadata
            validation.metadata = {
                name: scenario.name || 'Unknown',
                description: scenario.description || '',
                stepCount: scenario.steps ? scenario.steps.length : 0,
                timeout: scenario.timeout || 30000,
                preconditionCount: scenario.preconditions ? scenario.preconditions.length : 0,
                hasNestedSteps: scenario.steps ? scenario.steps.some(s => s.steps) : false
            };
            
            console.log(JSON.stringify(validation, null, 2));
            
        } catch (error) {
            const validation = {
                valid: false,
                errors: [\`JavaScript error: \${error.message}\`],
                warnings: [],
                metadata: {}
            };
            console.log(JSON.stringify(validation, null, 2));
        }
    " 2>/dev/null)
    
    if [[ -z "$validation_result" ]]; then
        log_error "Failed to validate scenario"
        return 1
    fi
    
    # Parse validation result
    local valid=$(echo "$validation_result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).valid)")
    local errors=$(echo "$validation_result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).errors.join(', '))")
    local warnings=$(echo "$validation_result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).warnings.join(', '))")
    
    if [[ "$valid" == "true" ]]; then
        log_success "Scenario validation successful"
        if [[ -n "$warnings" ]]; then
            log_warning "Warnings: $warnings"
        fi
        echo "$validation_result"
        return 0
    else
        log_error "Scenario validation failed"
        log_error "Errors: $errors"
        if [[ -n "$warnings" ]]; then
            log_warning "Warnings: $warnings"
        fi
        return 1
    fi
}

# Load scenario steps and create execution plan
load_scenario_steps() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/$scenario_name.js"
    
    log_info "Loading scenario steps: $scenario_name"
    
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        return 1
    fi
    
    # Load and flatten steps
    local steps_result
    steps_result=$(node -e "
        try {
            const scenario = require('$scenario_file');
            
            // Function to flatten nested steps
            function flattenSteps(steps, parentPath = '') {
                const flattened = [];
                
                steps.forEach((step, index) => {
                    const stepPath = parentPath ? \`\${parentPath}.\${index + 1}\` : \`\${index + 1}\`;
                    
                    const flatStep = {
                        stepNumber: flattened.length + 1,
                        originalIndex: index + 1,
                        path: stepPath,
                        action: step.action,
                        description: step.description || '',
                        ...step
                    };
                    
                    // Remove nested steps from the flat step to avoid duplication
                    delete flatStep.steps;
                    
                    flattened.push(flatStep);
                    
                    // Recursively flatten nested steps
                    if (step.steps && Array.isArray(step.steps)) {
                        const nestedSteps = flattenSteps(step.steps, stepPath);
                        flattened.push(...nestedSteps);
                    }
                });
                
                return flattened;
            }
            
            const executionPlan = {
                scenarioName: scenario.name,
                description: scenario.description || '',
                totalSteps: 0,
                estimatedDuration: 0,
                steps: []
            };
            
            if (scenario.steps && Array.isArray(scenario.steps)) {
                executionPlan.steps = flattenSteps(scenario.steps);
                executionPlan.totalSteps = executionPlan.steps.length;
                
                // Estimate duration based on action types
                const actionDurations = {
                    navigate: 3000,
                    click: 1000,
                    fill: 2000,
                    screenshot: 1500,
                    verify_state: 2000,
                    custom_script: 5000,
                    wait: 1000
                };
                
                executionPlan.estimatedDuration = executionPlan.steps.reduce((total, step) => {
                    return total + (actionDurations[step.action] || 2000);
                }, 0);
            }
            
            console.log(JSON.stringify(executionPlan, null, 2));
            
        } catch (error) {
            console.error('Error loading scenario steps:', error.message);
            process.exit(1);
        }
    " 2>/dev/null)
    
    if [[ -z "$steps_result" ]]; then
        log_error "Failed to load scenario steps"
        return 1
    fi
    
    log_success "Scenario steps loaded successfully"
    echo "$steps_result"
    return 0
}

# Check scenario preconditions
check_preconditions() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/$scenario_name.js"
    
    log_info "Checking preconditions for: $scenario_name"
    
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        return 1
    fi
    
    # Load preconditions
    local preconditions_result
    preconditions_result=$(node -e "
        try {
            const scenario = require('$scenario_file');
            
            const result = {
                scenarioName: scenario.name,
                preconditions: scenario.preconditions || [],
                checks: [],
                allSatisfied: true
            };
            
            // Check each precondition
            if (scenario.preconditions && Array.isArray(scenario.preconditions)) {
                scenario.preconditions.forEach((condition, index) => {
                    const check = {
                        index: index + 1,
                        condition: condition,
                        satisfied: null,
                        message: '',
                        checkType: 'unknown'
                    };
                    
                    // Determine check type and perform basic validation
                    if (condition.includes('logged in')) {
                        check.checkType = 'authentication';
                        check.message = 'Requires user to be authenticated';
                        // In real implementation, this would check actual auth state
                        check.satisfied = null; // Cannot determine without runtime context
                    } else if (condition.includes('project') && condition.includes('selected')) {
                        check.checkType = 'project_selection';
                        check.message = 'Requires a project to be selected';
                        check.satisfied = null; // Cannot determine without runtime context
                    } else if (condition.includes('database') || condition.includes('data')) {
                        check.checkType = 'data_setup';
                        check.message = 'Requires specific data setup';
                        check.satisfied = null; // Cannot determine without runtime context
                    } else {
                        check.checkType = 'custom';
                        check.message = 'Custom precondition - manual verification required';
                        check.satisfied = null;
                    }
                    
                    result.checks.push(check);
                });
            }
            
            // For now, we can't actually verify runtime conditions
            // This would be enhanced to check actual application state
            
            console.log(JSON.stringify(result, null, 2));
            
        } catch (error) {
            console.error('Error checking preconditions:', error.message);
            process.exit(1);
        }
    " 2>/dev/null)
    
    if [[ -z "$preconditions_result" ]]; then
        log_error "Failed to check preconditions"
        return 1
    fi
    
    log_success "Precondition check completed"
    echo "$preconditions_result"
    return 0
}

# Get specific step from scenario
get_scenario_step() {
    local scenario_name="$1"
    local step_number="$2"
    local scenario_file="$UAT_ROOT/scenarios/$scenario_name.js"
    
    log_info "Getting step $step_number from scenario: $scenario_name"
    
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        return 1
    fi
    
    # Get specific step
    local step_result
    step_result=$(node -e "
        try {
            const scenario = require('$scenario_file');
            const stepNum = parseInt('$step_number');
            
            if (!scenario.steps || !Array.isArray(scenario.steps)) {
                console.error('No steps found in scenario');
                process.exit(1);
            }
            
            // Get step by 1-based index
            const step = scenario.steps[stepNum - 1];
            
            if (!step) {
                console.error(\`Step \${stepNum} not found. Scenario has \${scenario.steps.length} steps.\`);
                process.exit(1);
            }
            
            const result = {
                scenarioName: scenario.name,
                stepNumber: stepNum,
                totalSteps: scenario.steps.length,
                step: {
                    ...step,
                    stepIndex: stepNum - 1
                }
            };
            
            console.log(JSON.stringify(result, null, 2));
            
        } catch (error) {
            console.error('Error getting step:', error.message);
            process.exit(1);
        }
    " 2>/dev/null)
    
    if [[ -z "$step_result" ]]; then
        log_error "Failed to get step"
        return 1
    fi
    
    log_success "Step retrieved successfully"
    echo "$step_result"
    return 0
}

# List all available scenarios
list_scenarios() {
    local scenarios_dir="$UAT_ROOT/scenarios"
    
    log_info "Listing available scenarios"
    
    if [[ ! -d "$scenarios_dir" ]]; then
        log_error "Scenarios directory not found: $scenarios_dir"
        return 1
    fi
    
    local scenarios_result
    scenarios_result=$(node -e "
        const fs = require('fs');
        const path = require('path');
        
        const scenariosDir = '$scenarios_dir';
        const scenarios = [];
        
        try {
            const files = fs.readdirSync(scenariosDir);
            
            files.forEach(file => {
                if (file.endsWith('.js') && !file.startsWith('.')) {
                    const scenarioPath = path.join(scenariosDir, file);
                    const scenarioName = file.replace('.js', '');
                    
                    try {
                        const scenario = require(scenarioPath);
                        
                        scenarios.push({
                            name: scenarioName,
                            displayName: scenario.name || scenarioName,
                            description: scenario.description || 'No description',
                            stepCount: scenario.steps ? scenario.steps.length : 0,
                            timeout: scenario.timeout || 30000,
                            preconditions: scenario.preconditions ? scenario.preconditions.length : 0,
                            file: file
                        });
                    } catch (error) {
                        scenarios.push({
                            name: scenarioName,
                            displayName: scenarioName,
                            description: 'Error loading scenario: ' + error.message,
                            stepCount: 0,
                            timeout: 0,
                            preconditions: 0,
                            file: file,
                            error: true
                        });
                    }
                }
            });
            
            const result = {
                totalScenarios: scenarios.length,
                scenarios: scenarios.sort((a, b) => a.name.localeCompare(b.name))
            };
            
            console.log(JSON.stringify(result, null, 2));
            
        } catch (error) {
            console.error('Error listing scenarios:', error.message);
            process.exit(1);
        }
    " 2>/dev/null)
    
    if [[ -z "$scenarios_result" ]]; then
        log_error "Failed to list scenarios"
        return 1
    fi
    
    log_success "Scenarios listed successfully"
    echo "$scenarios_result"
    return 0
}

# Get scenario metadata
get_scenario_metadata() {
    local scenario_name="$1"
    local scenario_file="$UAT_ROOT/scenarios/$scenario_name.js"
    
    log_info "Getting metadata for scenario: $scenario_name"
    
    if [[ ! -f "$scenario_file" ]]; then
        log_error "Scenario file not found: $scenario_file"
        return 1
    fi
    
    # Get metadata
    local metadata_result
    metadata_result=$(node -e "
        try {
            const fs = require('fs');
            const scenario = require('$scenario_file');
            const stats = fs.statSync('$scenario_file');
            
            const metadata = {
                name: scenario.name || '$scenario_name',
                displayName: scenario.name || '$scenario_name',
                description: scenario.description || '',
                stepCount: scenario.steps ? scenario.steps.length : 0,
                timeout: scenario.timeout || 30000,
                preconditions: scenario.preconditions || [],
                preconditionCount: scenario.preconditions ? scenario.preconditions.length : 0,
                file: {
                    name: '$scenario_name.js',
                    path: '$scenario_file',
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                },
                complexity: {
                    hasNestedSteps: scenario.steps ? scenario.steps.some(s => s.steps) : false,
                    maxNestingLevel: 1, // Simplified calculation
                    uniqueActions: []
                }
            };
            
            // Calculate complexity metrics
            if (scenario.steps && Array.isArray(scenario.steps)) {
                const actions = new Set();
                
                function analyzeSteps(steps, level = 1) {
                    let maxLevel = level;
                    
                    steps.forEach(step => {
                        if (step.action) {
                            actions.add(step.action);
                        }
                        
                        if (step.steps && Array.isArray(step.steps)) {
                            maxLevel = Math.max(maxLevel, analyzeSteps(step.steps, level + 1));
                        }
                    });
                    
                    return maxLevel;
                }
                
                metadata.complexity.maxNestingLevel = analyzeSteps(scenario.steps);
                metadata.complexity.uniqueActions = Array.from(actions).sort();
            }
            
            console.log(JSON.stringify(metadata, null, 2));
            
        } catch (error) {
            console.error('Error getting metadata:', error.message);
            process.exit(1);
        }
    " 2>/dev/null)
    
    if [[ -z "$metadata_result" ]]; then
        log_error "Failed to get metadata"
        return 1
    fi
    
    log_success "Metadata retrieved successfully"
    echo "$metadata_result"
    return 0
}

# Create execution plan with dependencies
create_execution_plan() {
    local scenario_name="$1"
    
    log_info "Creating execution plan for: $scenario_name"
    
    # Load steps and create detailed execution plan
    local execution_plan
    execution_plan=$(load_scenario_steps "$scenario_name")
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to create execution plan"
        return 1
    fi
    
    # Enhance with timing and dependencies
    local enhanced_plan
    enhanced_plan=$(echo "$execution_plan" | node -e "
        const plan = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        
        // Add timing estimates and dependencies
        plan.steps.forEach((step, index) => {
            // Add timing information
            step.timing = {
                estimated: 2000, // Default 2 seconds
                startTime: null,
                endTime: null,
                duration: null
            };
            
            // Action-specific timing
            const timings = {
                navigate: 3000,
                click: 1000,
                fill: 2000,
                screenshot: 1500,
                verify_state: 2000,
                custom_script: 5000,
                wait: step.duration || 1000
            };
            
            step.timing.estimated = timings[step.action] || 2000;
            
            // Add dependencies
            step.dependencies = [];
            
            // Navigation steps depend on previous navigation completion
            if (step.action === 'click' || step.action === 'fill') {
                for (let i = index - 1; i >= 0; i--) {
                    if (plan.steps[i].action === 'navigate') {
                        step.dependencies.push(plan.steps[i].stepNumber);
                        break;
                    }
                }
            }
            
            // Form fills depend on page load
            if (step.action === 'fill') {
                for (let i = index - 1; i >= 0; i--) {
                    if (plan.steps[i].action === 'navigate' || plan.steps[i].action === 'click') {
                        step.dependencies.push(plan.steps[i].stepNumber);
                        break;
                    }
                }
            }
            
            // Add validation requirements
            step.validation = {
                required: step.validate ? true : false,
                checks: step.validate || [],
                preconditions: []
            };
            
            // Add preconditions for specific actions
            if (step.action === 'click' && step.selector) {
                step.validation.preconditions.push('element_exists:' + step.selector);
            }
            
            if (step.action === 'fill' && step.fields) {
                Object.keys(step.fields).forEach(selector => {
                    step.validation.preconditions.push('element_exists:' + selector);
                });
            }
        });
        
        // Recalculate total estimated duration
        plan.estimatedDuration = plan.steps.reduce((total, step) => {
            return total + step.timing.estimated;
        }, 0);
        
        // Add execution metadata
        plan.execution = {
            createdAt: new Date().toISOString(),
            status: 'planned',
            progress: {
                completed: 0,
                failed: 0,
                skipped: 0
            }
        };
        
        console.log(JSON.stringify(plan, null, 2));
    ")
    
    log_success "Execution plan created successfully"
    echo "$enhanced_plan"
    return 0
}

# Main function
main() {
    local command="${1:-}"
    
    if [[ -z "$command" ]]; then
        show_usage
        exit 1
    fi
    
    case "$command" in
        "validate")
            if [[ -z "${2:-}" ]]; then
                log_error "Scenario name required for validate command"
                exit 1
            fi
            validate_scenario "$2"
            ;;
        "load-steps")
            if [[ -z "${2:-}" ]]; then
                log_error "Scenario name required for load-steps command"
                exit 1
            fi
            load_scenario_steps "$2"
            ;;
        "check-preconditions")
            if [[ -z "${2:-}" ]]; then
                log_error "Scenario name required for check-preconditions command"
                exit 1
            fi
            check_preconditions "$2"
            ;;
        "get-step")
            if [[ -z "${2:-}" || -z "${3:-}" ]]; then
                log_error "Scenario name and step number required for get-step command"
                exit 1
            fi
            get_scenario_step "$2" "$3"
            ;;
        "list-scenarios")
            list_scenarios
            ;;
        "get-metadata")
            if [[ -z "${2:-}" ]]; then
                log_error "Scenario name required for get-metadata command"
                exit 1
            fi
            get_scenario_metadata "$2"
            ;;
        "create-execution-plan")
            if [[ -z "${2:-}" ]]; then
                log_error "Scenario name required for create-execution-plan command"
                exit 1
            fi
            create_execution_plan "$2"
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"