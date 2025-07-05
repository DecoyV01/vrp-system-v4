#!/bin/bash
#
# Claude Code UAT Finalizer (Stop Hook)
# 
# This hook integrates with Claude Code's built-in hook system to finalize UAT sessions
# when Claude Code sessions end, providing comprehensive reporting and cleanup.
# 
# Features:
# - Automatic UAT session detection and finalization
# - Comprehensive session report generation with metrics and analysis
# - Structured file archiving with retention management
# - UAT framework statistics updates and trend tracking
# - Complete cleanup of temporary files and session state
# - Integration with existing UAT reporting systems
#
# Hook Type: Stop
# Registration: /hooks → Select "4. Stop" → Enter: /mnt/c/projects/vrp-system/v4/hooks/claude-uat-finalizer.sh
#

set -euo pipefail

# Project root and UAT paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UAT_ROOT="$PROJECT_ROOT/uat"

# Hook configuration
HOOK_NAME="claude-uat-finalizer"
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

# Get hook input from Claude Code
HOOK_INPUT=$(cat)

# Parse hook input JSON (Stop hooks have minimal input)
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
TERMINATION_REASON=$(echo "$HOOK_INPUT" | jq -r '.reason // "normal"')
SESSION_DURATION=$(echo "$HOOK_INPUT" | jq -r '.session_duration_ms // 0')
TOTAL_TOOL_CALLS=$(echo "$HOOK_INPUT" | jq -r '.total_tool_calls // 0')

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

# Check if UAT session was active during Claude session
was_uat_active() {
    local claude_session_id="$1"
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    
    [[ -f "$session_file" ]]
}

# Load session state for finalization
load_session_state() {
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

# Calculate session completion metrics
calculate_completion_metrics() {
    local session_state="$1"
    
    local total_steps
    total_steps=$(echo "$session_state" | jq -r '.scenario.totalSteps // 0')
    
    local current_step
    current_step=$(echo "$session_state" | jq -r '.scenario.currentStep // 0')
    
    local completed_steps
    completed_steps=$(echo "$session_state" | jq -r '.scenario.completedSteps // 0')
    
    local completion_rate=0
    if [[ $total_steps -gt 0 ]]; then
        completion_rate=$(echo "scale=3; $completed_steps / $total_steps" | bc -l 2>/dev/null || echo "0")
    fi
    
    local scenario_status="incomplete"
    if [[ $completed_steps -eq $total_steps ]]; then
        scenario_status="completed"
    elif [[ $(echo "$session_state" | jq -r '.execution.errors | length') -gt 0 ]]; then
        scenario_status="failed"
    fi
    
    jq -n \
        --argjson total "$total_steps" \
        --argjson current "$current_step" \
        --argjson completed "$completed_steps" \
        --argjson rate "$completion_rate" \
        --arg status "$scenario_status" \
        '{
            totalSteps: $total,
            currentStep: $current,
            completedSteps: $completed,
            completionRate: $rate,
            status: $status
        }'
}

# Generate comprehensive session report
generate_session_report() {
    local session_state="$1"
    local claude_session_id="$2"
    local termination_reason="$3"
    local session_duration="$4"
    
    log_info "Generating comprehensive session report"
    
    # Create reports directory if it doesn't exist
    local reports_dir="$UAT_ROOT/reports"
    mkdir -p "$reports_dir"
    
    # Calculate session metrics
    local start_time
    start_time=$(echo "$session_state" | jq -r '.session.startTime // empty')
    local end_time
    end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    local session_duration_calculated=0
    if [[ -n "$start_time" ]]; then
        session_duration_calculated=$(node -e "
            const start = new Date('$start_time');
            const end = new Date('$end_time');
            console.log(end - start);
        " 2>/dev/null || echo "$session_duration")
    fi
    
    # Get completion metrics
    local completion_metrics
    completion_metrics=$(calculate_completion_metrics "$session_state")
    
    # Extract session metadata
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenario.name // "unknown"')
    
    local uat_session_id
    uat_session_id=$(echo "$session_state" | jq -r '.session.uatSessionId // "unknown"')
    
    # Generate comprehensive report
    local report_data
    report_data=$(jq -n \
        --arg report_id "session-report-${claude_session_id}-$(date +%Y%m%d-%H%M%S)" \
        --arg generated_at "$end_time" \
        --arg claude_session_id "$claude_session_id" \
        --arg uat_session_id "$uat_session_id" \
        --arg scenario "$scenario_name" \
        --arg start_time "$start_time" \
        --arg end_time "$end_time" \
        --argjson duration "$session_duration_calculated" \
        --arg termination_reason "$termination_reason" \
        --argjson session_state "$session_state" \
        --argjson completion_metrics "$completion_metrics" \
        '{
            meta: {
                reportId: $report_id,
                generatedAt: $generated_at,
                reportType: "session_finalization",
                generator: "claude-uat-finalizer",
                version: "1.0.0"
            },
            session: {
                sessionId: $uat_session_id,
                claudeSessionId: $claude_session_id,
                scenario: $scenario,
                startTime: $start_time,
                endTime: $end_time,
                duration: $duration,
                terminationReason: $termination_reason,
                mode: ($session_state.session.mode // "production")
            },
            execution: $completion_metrics + {
                lastActivity: ($session_state.session.lastActivity // $end_time)
            },
            performance: ($session_state.performance // {}),
            validation: {
                totalValidations: (($session_state.validation.healthChecks // []) | length),
                passedValidations: (($session_state.validation.healthChecks // []) | map(select(.success == true)) | length),
                failedValidations: (($session_state.validation.healthChecks // []) | map(select(.success != true)) | length),
                validationRate: (if (($session_state.validation.healthChecks // []) | length) > 0 then 
                    ((($session_state.validation.healthChecks // []) | map(select(.success == true)) | length) / 
                     (($session_state.validation.healthChecks // []) | length)) else 0 end),
                frameworkInjected: ($session_state.validation.frameworkInjected // false)
            },
            screenshots: {
                totalScreenshots: (($session_state.artifacts.screenshots // []) | length),
                successfulScreenshots: (($session_state.artifacts.screenshots // []) | map(select(.success == true)) | length),
                failedScreenshots: (($session_state.artifacts.screenshots // []) | map(select(.success != true)) | length),
                screenshotList: ($session_state.artifacts.screenshots // [])
            },
            errors: ($session_state.execution.errors // []),
            toolCalls: ($session_state.execution.toolCalls // []),
            context: ($session_state.context // {}),
            summary: {
                status: $completion_metrics.status,
                message: "",
                recommendations: []
            }
        }')
    
    # Generate summary message and recommendations
    local status
    status=$(echo "$completion_metrics" | jq -r '.status')
    
    local summary_message=""
    local recommendations="[]"
    
    case "$status" in
        "completed")
            summary_message="Session completed successfully with all steps executed"
            ;;
        "failed")
            summary_message="Session failed with errors during execution"
            recommendations='["Review error logs for debugging", "Consider re-running failed steps"]'
            ;;
        "incomplete")
            local completion_rate
            completion_rate=$(echo "$completion_metrics" | jq -r '.completionRate')
            summary_message="Session incomplete: $(echo "$completion_metrics" | jq -r '.completedSteps')/$(echo "$completion_metrics" | jq -r '.totalSteps') steps completed"
            recommendations='["Consider re-running incomplete scenario", "Review execution logs for issues"]'
            ;;
    esac
    
    # Add performance-based recommendations
    local error_count
    error_count=$(echo "$session_state" | jq '.execution.errors | length')
    
    if [[ $error_count -gt 0 ]]; then
        recommendations=$(echo "$recommendations" | jq '. + ["Review error logs for debugging"]')
    fi
    
    local validation_rate
    validation_rate=$(echo "$report_data" | jq -r '.validation.validationRate')
    
    if [[ $(echo "$validation_rate < 0.8" | bc -l 2>/dev/null || echo "0") -eq 1 ]] && [[ $(echo "$report_data" | jq -r '.validation.totalValidations') -gt 0 ]]; then
        recommendations=$(echo "$recommendations" | jq '. + ["Investigate validation failures"]')
    fi
    
    local failed_screenshots
    failed_screenshots=$(echo "$report_data" | jq -r '.screenshots.failedScreenshots')
    
    if [[ $failed_screenshots -gt 0 ]]; then
        recommendations=$(echo "$recommendations" | jq '. + ["Check screenshot capture configuration"]')
    fi
    
    # Update report with summary
    report_data=$(echo "$report_data" | jq \
        --arg message "$summary_message" \
        --argjson recommendations "$recommendations" \
        '.summary.message = $message | .summary.recommendations = $recommendations')
    
    # Write report to file
    local report_file="${reports_dir}/session-report-${claude_session_id}-$(date +%Y%m%d-%H%M%S).json"
    if echo "$report_data" | jq '.' > "$report_file"; then
        log_success "Session report generated: $report_file"
        echo "$report_file"
        return 0
    else
        log_error "Failed to generate session report"
        return 1
    fi
}

# Archive session files
archive_session_files() {
    local session_state="$1"
    local claude_session_id="$2"
    
    log_info "Archiving session files"
    
    local uat_session_id
    uat_session_id=$(echo "$session_state" | jq -r '.session.uatSessionId // "unknown"')
    
    # Create archive directory
    local archive_dir="$UAT_ROOT/archive/$(date +%Y-%m)"
    mkdir -p "$archive_dir"
    
    local archive_name="session-${uat_session_id}-$(date +%Y%m%d-%H%M%S)"
    local archive_path="$archive_dir/$archive_name"
    
    # Create session archive directory
    mkdir -p "$archive_path"
    
    # Copy session state file
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    if [[ -f "$session_file" ]]; then
        cp "$session_file" "$archive_path/session-state.json"
        log_debug "Archived session state file"
    fi
    
    # Copy screenshots directory if it exists
    local screenshots_dir
    screenshots_dir=$(echo "$session_state" | jq -r '.context.screenshotDirectory // ""')
    if [[ -d "$screenshots_dir" ]]; then
        cp -r "$screenshots_dir" "$archive_path/screenshots"
        log_debug "Archived screenshots directory"
    fi
    
    # Copy any log files
    local log_file="$UAT_ROOT/logs/session-$uat_session_id.log"
    if [[ -f "$log_file" ]]; then
        cp "$log_file" "$archive_path/session.log"
        log_debug "Archived session log file"
    fi
    
    # Create archive metadata
    local archive_metadata
    archive_metadata=$(jq -n \
        --arg uat_id "$uat_session_id" \
        --arg claude_id "$claude_session_id" \
        --arg archive_path "$archive_path" \
        --arg created "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg scenario "$(echo "$session_state" | jq -r '.scenario.name // "unknown"')" \
        --arg completion_status "$(echo "$session_state" | jq -r '.scenario.completedSteps // 0')/$(echo "$session_state" | jq -r '.scenario.totalSteps // 0')" \
        '{
            sessionId: $uat_id,
            claudeSessionId: $claude_id,
            archivePath: $archive_path,
            archivedAt: $created,
            scenario: $scenario,
            completionStatus: $completion_status,
            fileTypes: ["session-state", "screenshots", "logs"],
            retentionPolicy: "90-days"
        }')
    
    echo "$archive_metadata" > "$archive_path/archive-metadata.json"
    
    log_success "Session files archived to: $archive_path"
    echo "$archive_path"
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
        existing_summary=$(cat "$summary_file" 2>/dev/null || echo "{}")
    fi
    
    # Calculate completion metrics
    local completion_metrics
    completion_metrics=$(calculate_completion_metrics "$session_state")
    
    local completion_rate
    completion_rate=$(echo "$completion_metrics" | jq -r '.completionRate')
    
    # Update summary with session data
    local updated_summary
    updated_summary=$(echo "$existing_summary" | jq \
        --arg session_id "$(echo "$session_state" | jq -r '.session.uatSessionId // "unknown"')" \
        --arg scenario "$(echo "$session_state" | jq -r '.scenario.name // "unknown"')" \
        --arg report_file "$report_file" \
        --arg archive_path "$archive_path" \
        --argjson completion_rate "$completion_rate" \
        --arg status "$(echo "$completion_metrics" | jq -r '.status')" \
        '. + {
            lastUpdated: now | todate,
            totalSessions: (.totalSessions // 0) + 1,
            recentSessions: ((.recentSessions // []) + [{
                sessionId: $session_id,
                scenario: $scenario,
                completionRate: $completion_rate,
                status: $status,
                reportFile: $report_file,
                archivePath: $archive_path,
                completedAt: now | todate
            }] | sort_by(.completedAt) | reverse | .[0:10])
        }')
    
    echo "$updated_summary" > "$summary_file"
    
    # Update scenario statistics
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenario.name // "unknown"')
    
    if [[ "$scenario_name" != "unknown" ]]; then
        local scenario_stats_file="$UAT_ROOT/reports/scenario-stats-$scenario_name.json"
        
        local existing_stats="{}"
        if [[ -f "$scenario_stats_file" ]]; then
            existing_stats=$(cat "$scenario_stats_file" 2>/dev/null || echo "{}")
        fi
        
        local had_errors
        had_errors=$(echo "$session_state" | jq '(.execution.errors // [] | length) > 0')
        
        local was_successful
        was_successful="false"
        if [[ $(echo "$completion_rate == 1.0" | bc -l 2>/dev/null || echo "0") -eq 1 ]] && [[ "$had_errors" == "false" ]]; then
            was_successful="true"
        fi
        
        local updated_stats
        updated_stats=$(echo "$existing_stats" | jq \
            --arg scenario "$scenario_name" \
            --argjson completion_rate "$completion_rate" \
            --argjson was_successful "$was_successful" \
            '. + {
                scenarioName: $scenario,
                lastUpdated: now | todate,
                totalRuns: (.totalRuns // 0) + 1,
                successfulRuns: (.successfulRuns // 0) + (if $was_successful then 1 else 0 end),
                averageCompletionRate: ((.averageCompletionRate // 0) * (.totalRuns // 1) + $completion_rate) / ((.totalRuns // 0) + 1)
            }')
        
        echo "$updated_stats" > "$scenario_stats_file"
        log_debug "Updated scenario statistics: $scenario_name"
    fi
    
    log_success "UAT framework reporting updated"
}

# Clean up temporary files and session state
cleanup_session_files() {
    local claude_session_id="$1"
    
    log_info "Cleaning up temporary files"
    
    # Remove active session file
    local session_file="$UAT_ROOT/sessions/claude-session-${claude_session_id}.json"
    if [[ -f "$session_file" ]]; then
        rm -f "$session_file"
        log_debug "Removed active session file"
    fi
    
    # Clean up lock files
    find "$UAT_ROOT/sessions" -name "*.lock" -type f -delete 2>/dev/null || true
    log_debug "Cleaned up lock files"
    
    # Clean up temporary state files older than 1 hour
    find "$UAT_ROOT/sessions" -name "temp-*" -type f -mmin +60 -delete 2>/dev/null || true
    log_debug "Cleaned up old temporary files"
    
    # Clean up old archives (older than 90 days)
    find "$UAT_ROOT/archive" -name "session-*" -type d -mtime +90 -exec rm -rf {} \; 2>/dev/null || true
    log_debug "Cleaned up old archives"
    
    log_success "Temporary files cleaned up"
}

# Main finalization logic
main() {
    log_debug "Session finalization hook triggered"
    log_debug "Session ID: $SESSION_ID"
    log_debug "Termination reason: $TERMINATION_REASON"
    log_debug "Session duration: ${SESSION_DURATION}ms"
    
    # Check if UAT mode was active during session
    if ! was_uat_active "$SESSION_ID"; then
        log_debug "UAT was not active during session, skipping finalization"
        output_response "success" "No UAT session to finalize"
        exit 0
    fi
    
    log_info "UAT session was active, performing finalization"
    
    # Load session state
    local session_state
    if ! session_state=$(load_session_state "$SESSION_ID"); then
        log_warning "No session state found, performing minimal cleanup"
        cleanup_session_files "$SESSION_ID"
        output_response "success" "Minimal cleanup completed (no session state)"
        exit 0
    fi
    
    local scenario_name
    scenario_name=$(echo "$session_state" | jq -r '.scenario.name // "unknown"')
    
    log_info "Finalizing UAT session for scenario: $scenario_name"
    
    # Initialize tracking variables
    local report_file=""
    local archive_path=""
    local finalization_errors=0
    
    # Generate comprehensive session report
    if report_file=$(generate_session_report "$session_state" "$SESSION_ID" "$TERMINATION_REASON" "$SESSION_DURATION"); then
        log_success "Session report generated: $report_file"
    else
        log_warning "Failed to generate session report, continuing with finalization"
        finalization_errors=$((finalization_errors + 1))
    fi
    
    # Archive session files
    if archive_path=$(archive_session_files "$session_state" "$SESSION_ID"); then
        log_success "Session files archived: $archive_path"
    else
        log_warning "Failed to archive session files, continuing with finalization"
        finalization_errors=$((finalization_errors + 1))
    fi
    
    # Update UAT framework reporting
    if [[ -n "$report_file" ]]; then
        if update_uat_reporting "$session_state" "$report_file" "$archive_path"; then
            log_success "UAT framework reporting updated"
        else
            log_warning "Failed to update UAT framework reporting"
            finalization_errors=$((finalization_errors + 1))
        fi
    fi
    
    # Clean up temporary files (do this last)
    if cleanup_session_files "$SESSION_ID"; then
        log_success "Session cleanup completed"
    else
        log_warning "Some cleanup operations failed"
        finalization_errors=$((finalization_errors + 1))
    fi
    
    # Create finalization summary
    local completion_metrics
    completion_metrics=$(calculate_completion_metrics "$session_state")
    
    local finalization_data
    finalization_data=$(jq -n \
        --arg scenario "$scenario_name" \
        --arg session_id "$(echo "$session_state" | jq -r '.session.uatSessionId // "unknown"')" \
        --arg report_file "$report_file" \
        --arg archive_path "$archive_path" \
        --arg termination "$TERMINATION_REASON" \
        --argjson completion "$completion_metrics" \
        --argjson errors "$finalization_errors" \
        '{
            scenario: $scenario,
            sessionId: $session_id,
            completion: $completion,
            terminationReason: $termination,
            reportGenerated: ($report_file != ""),
            reportFile: $report_file,
            filesArchived: ($archive_path != ""),
            archivePath: $archive_path,
            cleanupCompleted: true,
            finalizationErrors: $errors,
            finalizedAt: now | todate
        }')
    
    if [[ $finalization_errors -eq 0 ]]; then
        log_success "UAT session finalization completed successfully"
        output_response "success" "UAT session finalized and archived" "$finalization_data"
    else
        log_warning "UAT session finalization completed with $finalization_errors error(s)"
        output_response "success" "UAT session finalization completed with warnings" "$finalization_data"
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