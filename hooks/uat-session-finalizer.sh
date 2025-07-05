#!/bin/bash
#
# UAT Session Finalization Hook (Stop)
# 
# Finalizes UAT testing sessions when Claude Code session ends.
# This hook runs on session termination to:
# - Generate comprehensive UAT reports from session data
# - Archive session files and screenshots
# - Clean up temporary files and state
# - Update UAT framework reporting system
# - Preserve execution history for future analysis
#
# Hook Type: Stop
# Priority: N/A (Stop hooks run when session ends)
#

set -euo pipefail

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON (for Stop hooks, this is usually minimal)
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
TERMINATION_REASON=$(echo "$HOOK_INPUT" | jq -r '.reason // "normal"')

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="uat-session-finalizer"
HOOK_TIMEOUT=60
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

# Check if UAT mode was active during session
was_uat_active() {
    [[ -f "$UAT_ROOT/sessions/hook-active-session.json" ]]
}

# Load session state for finalization
load_session_state() {
    local state_file="$UAT_ROOT/sessions/hook-active-session.json"
    
    if [[ -f "$state_file" ]]; then
        cat "$state_file"
    else
        echo "{}"
    fi
}

# Generate comprehensive session report
generate_session_report() {
    local session_state="$1"
    local session_id="$2"
    local termination_reason="$3"
    
    log_info "Generating comprehensive session report"
    
    # Create reports directory if it doesn't exist
    local reports_dir="$UAT_ROOT/reports"
    mkdir -p "$reports_dir"
    
    # Generate report using Node.js
    local report_data
    report_data=$(node -e "
        const sessionState = $session_state;
        const now = new Date().toISOString();
        
        // Calculate session metrics
        const startTime = sessionState.sessionStartTime || now;
        const endTime = now;
        const duration = new Date(endTime) - new Date(startTime);
        
        const report = {
            meta: {
                reportId: 'session-report-' + sessionState.sessionId || 'unknown',
                generatedAt: now,
                reportType: 'session_finalization',
                generator: 'uat-session-finalizer',
                version: '1.0.0'
            },
            session: {
                sessionId: sessionState.sessionId || 'unknown',
                claudeSessionId: '$session_id',
                scenario: sessionState.scenarioName || 'unknown',
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                terminationReason: '$termination_reason',
                mode: sessionState.mode || 'production'
            },
            execution: {
                totalSteps: sessionState.totalSteps || 0,
                completedSteps: sessionState.currentStep || 0,
                failedSteps: sessionState.failedSteps || 0,
                skippedSteps: sessionState.skippedSteps || 0,
                completionRate: sessionState.totalSteps > 0 ? 
                    (sessionState.currentStep || 0) / sessionState.totalSteps : 0,
                lastActivity: sessionState.lastActivity || startTime
            },
            performance: {
                totalExecutionTime: duration,
                averageStepDuration: sessionState.performance?.averageStepDuration || 0,
                fastestStep: sessionState.performance?.fastestStep || null,
                slowestStep: sessionState.performance?.slowestStep || null,
                toolCallCount: sessionState.performance?.toolCallCount || 0,
                errorCount: sessionState.errors?.length || 0
            },
            validation: {
                totalValidations: sessionState.validations?.length || 0,
                passedValidations: sessionState.validations?.filter(v => v.success).length || 0,
                failedValidations: sessionState.validations?.filter(v => !v.success).length || 0,
                validationRate: sessionState.validations?.length > 0 ? 
                    sessionState.validations.filter(v => v.success).length / sessionState.validations.length : 0
            },
            screenshots: {
                totalScreenshots: sessionState.screenshots?.length || 0,
                successfulScreenshots: sessionState.screenshots?.filter(s => s.success).length || 0,
                failedScreenshots: sessionState.screenshots?.filter(s => !s.success).length || 0,
                screenshotList: sessionState.screenshots || []
            },
            errors: sessionState.errors || [],
            steps: sessionState.steps || [],
            validations: sessionState.validations || [],
            summary: {
                status: sessionState.currentStep >= sessionState.totalSteps ? 'completed' : 
                        sessionState.errors?.length > 0 ? 'failed' : 'incomplete',
                message: '',
                recommendations: []
            }
        };
        
        // Generate summary message
        if (report.execution.completionRate === 1.0) {
            report.summary.message = 'Session completed successfully with all steps executed';
        } else if (report.performance.errorCount > 0) {
            report.summary.message = \`Session failed with \${report.performance.errorCount} error(s)\`;
        } else {
            report.summary.message = \`Session incomplete: \${report.execution.completedSteps}/\${report.execution.totalSteps} steps completed\`;
        }
        
        // Generate recommendations
        if (report.execution.completionRate < 1.0) {
            report.summary.recommendations.push('Consider re-running incomplete scenario');
        }
        
        if (report.performance.errorCount > 0) {
            report.summary.recommendations.push('Review error logs for debugging');
        }
        
        if (report.validation.validationRate < 0.8 && report.validation.totalValidations > 0) {
            report.summary.recommendations.push('Investigate validation failures');
        }
        
        if (report.screenshots.failedScreenshots > 0) {
            report.summary.recommendations.push('Check screenshot capture configuration');
        }
        
        console.log(JSON.stringify(report, null, 2));
    " 2>/dev/null)
    
    if [[ -n "$report_data" ]]; then
        local report_file="$reports_dir/session-report-${session_id}-$(date +%Y%m%d-%H%M%S).json"
        echo "$report_data" > "$report_file"
        log_success "Session report generated: $report_file"
        echo "$report_file"
    else
        log_error "Failed to generate session report"
        return 1
    fi
}

# Archive session files
archive_session_files() {
    local session_state="$1"
    local session_id="$2"
    
    log_info "Archiving session files"
    
    local uat_session_id
    uat_session_id=$(echo "$session_state" | jq -r '.sessionId // "unknown"')
    
    # Create archive directory
    local archive_dir="$UAT_ROOT/archive/$(date +%Y-%m)"
    mkdir -p "$archive_dir"
    
    local archive_name="session-${uat_session_id}-$(date +%Y%m%d-%H%M%S)"
    local archive_path="$archive_dir/$archive_name"
    
    # Create session archive directory
    mkdir -p "$archive_path"
    
    # Copy session state file
    if [[ -f "$UAT_ROOT/sessions/hook-active-session.json" ]]; then
        cp "$UAT_ROOT/sessions/hook-active-session.json" "$archive_path/session-state.json"
        log_debug "Archived session state file"
    fi
    
    # Copy screenshots directory if it exists
    local screenshots_dir="$UAT_ROOT/screenshots/$uat_session_id"
    if [[ -d "$screenshots_dir" ]]; then
        cp -r "$screenshots_dir" "$archive_path/screenshots"
        log_debug "Archived screenshots directory"
    fi
    
    # Copy any log files
    if [[ -f "$UAT_ROOT/logs/session-$uat_session_id.log" ]]; then
        cp "$UAT_ROOT/logs/session-$uat_session_id.log" "$archive_path/session.log"
        log_debug "Archived session log file"
    fi
    
    # Create archive metadata
    local archive_metadata
    archive_metadata=$(jq -n \
        --arg id "$uat_session_id" \
        --arg claude_id "$session_id" \
        --arg archive_path "$archive_path" \
        --arg created "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson state "$session_state" \
        '{
            sessionId: $id,
            claudeSessionId: $claude_id,
            archivePath: $archive_path,
            archivedAt: $created,
            scenario: $state.scenarioName,
            completionStatus: ($state.currentStep // 0) + "/" + ($state.totalSteps // 0),
            fileTypes: ["session-state", "screenshots", "logs"],
            retentionPolicy: "90-days"
        }')
    
    echo "$archive_metadata" > "$archive_path/archive-metadata.json"
    
    log_success "Session files archived to: $archive_path"
    echo "$archive_path"
}

# Clean up temporary files
cleanup_temporary_files() {
    local session_state="$1"
    
    log_info "Cleaning up temporary files"
    
    local uat_session_id
    uat_session_id=$(echo "$session_state" | jq -r '.sessionId // "unknown"')
    
    # Remove active session file
    if [[ -f "$UAT_ROOT/sessions/hook-active-session.json" ]]; then
        rm -f "$UAT_ROOT/sessions/hook-active-session.json"
        log_debug "Removed active session file"
    fi
    
    # Clean up lock files
    find "$UAT_ROOT/sessions" -name "*.lock" -type f -delete 2>/dev/null || true
    log_debug "Cleaned up lock files"
    
    # Clean up temporary state files older than 1 hour
    find "$UAT_ROOT/sessions" -name "temp-*" -type f -mmin +60 -delete 2>/dev/null || true
    log_debug "Cleaned up old temporary files"
    
    # Clear environment variables
    unset UAT_HOOKS_ENABLED
    unset UAT_ACTIVE_SCENARIO
    unset UAT_SESSION_ID
    unset UAT_MODE
    
    log_success "Temporary files cleaned up"
}

# Update UAT framework reporting
update_uat_reporting() {
    local session_state="$1"
    local report_file="$2"
    local archive_path="$3"
    
    log_info "Updating UAT framework reporting"
    
    # Create or update UAT summary report
    local summary_file="$UAT_ROOT/reports/uat-summary.json"
    
    # Read existing summary or create new one
    local existing_summary="{}"
    if [[ -f "$summary_file" ]]; then
        existing_summary=$(cat "$summary_file")
    fi
    
    # Update summary with session data
    local updated_summary
    updated_summary=$(echo "$existing_summary" | jq \
        --arg session_id "$(echo "$session_state" | jq -r '.sessionId // "unknown"')" \
        --arg scenario "$(echo "$session_state" | jq -r '.scenarioName // "unknown"')" \
        --arg report_file "$report_file" \
        --arg archive_path "$archive_path" \
        --argjson completion_rate "$(echo "$session_state" | jq '(.currentStep // 0) / (.totalSteps // 1)')" \
        '. + {
            lastUpdated: now | todate,
            totalSessions: (.totalSessions // 0) + 1,
            recentSessions: ((.recentSessions // []) + [{
                sessionId: $session_id,
                scenario: $scenario,
                completionRate: $completion_rate,
                reportFile: $report_file,
                archivePath: $archive_path,
                completedAt: now | todate
            }] | sort_by(.completedAt) | reverse | .[0:10])
        }')
    
    echo "$updated_summary" > "$summary_file"
    
    # Update scenario statistics
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenarioName // "unknown"')
    
    if [[ "$scenario_name" != "unknown" ]]; then
        local scenario_stats_file="$UAT_ROOT/reports/scenario-stats-$scenario_name.json"
        
        local existing_stats="{}"
        if [[ -f "$scenario_stats_file" ]]; then
            existing_stats=$(cat "$scenario_stats_file")
        fi
        
        local updated_stats
        updated_stats=$(echo "$existing_stats" | jq \
            --arg scenario "$scenario_name" \
            --argjson completion_rate "$(echo "$session_state" | jq '(.currentStep // 0) / (.totalSteps // 1)')" \
            --argjson had_errors "$(echo "$session_state" | jq '(.errors // [] | length) > 0')" \
            '. + {
                scenarioName: $scenario,
                lastUpdated: now | todate,
                totalRuns: (.totalRuns // 0) + 1,
                successfulRuns: (.successfulRuns // 0) + (if $completion_rate == 1.0 and ($had_errors == false) then 1 else 0 end),
                averageCompletionRate: ((.averageCompletionRate // 0) * (.totalRuns // 1) + $completion_rate) / ((.totalRuns // 0) + 1)
            }')
        
        echo "$updated_stats" > "$scenario_stats_file"
        log_debug "Updated scenario statistics: $scenario_name"
    fi
    
    log_success "UAT framework reporting updated"
}

# Main finalization logic
main() {
    log_debug "Session finalization hook triggered"
    log_debug "Session ID: $SESSION_ID"
    log_debug "Termination reason: $TERMINATION_REASON"
    
    # Check if UAT mode was active during session
    if ! was_uat_active; then
        log_debug "UAT was not active during session, skipping finalization"
        output_response "success" "No UAT session to finalize"
        exit 0
    fi
    
    log_info "UAT session was active, performing finalization"
    
    # Load session state
    local session_state
    session_state=$(load_session_state)
    
    if [[ "$session_state" == "{}" ]]; then
        log_warning "No session state found, performing minimal cleanup"
        cleanup_temporary_files "{}"
        output_response "success" "Minimal cleanup completed (no session state)"
        exit 0
    fi
    
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenarioName // "unknown"')
    
    log_info "Finalizing UAT session for scenario: $scenario_name"
    
    # Generate comprehensive session report
    local report_file=""
    if generate_session_report "$session_state" "$SESSION_ID" "$TERMINATION_REASON"; then
        report_file=$(generate_session_report "$session_state" "$SESSION_ID" "$TERMINATION_REASON")
        log_success "Session report generated"
    else
        log_warning "Failed to generate session report, continuing with finalization"
    fi
    
    # Archive session files
    local archive_path=""
    if archive_session_files "$session_state" "$SESSION_ID"; then
        archive_path=$(archive_session_files "$session_state" "$SESSION_ID")
        log_success "Session files archived"
    else
        log_warning "Failed to archive session files, continuing with finalization"
    fi
    
    # Update UAT framework reporting
    if [[ -n "$report_file" ]]; then
        update_uat_reporting "$session_state" "$report_file" "$archive_path"
    fi
    
    # Clean up temporary files (do this last)
    cleanup_temporary_files "$session_state"
    
    # Create finalization summary
    local finalization_data
    finalization_data=$(jq -n \
        --arg scenario "$scenario_name" \
        --arg session_id "$(echo "$session_state" | jq -r '.sessionId // "unknown"')" \
        --arg report_file "$report_file" \
        --arg archive_path "$archive_path" \
        --arg termination "$TERMINATION_REASON" \
        --argjson completion "$(echo "$session_state" | jq '(.currentStep // 0) / (.totalSteps // 1)')" \
        '{
            scenario: $scenario,
            sessionId: $session_id,
            completionRate: $completion,
            terminationReason: $termination,
            reportGenerated: ($report_file != ""),
            filesArchived: ($archive_path != ""),
            cleanupCompleted: true,
            finalizedAt: now | todate
        }')
    
    log_success "UAT session finalization completed successfully"
    output_response "success" "UAT session finalized and archived" "$finalization_data"
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