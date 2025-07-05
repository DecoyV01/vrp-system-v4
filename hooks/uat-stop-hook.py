#!/usr/bin/env python3
"""
Claude Code UAT Stop Hook

This hook integrates with Claude Code's hook system to finalize UAT sessions
when Claude Code sessions end, generating reports and archiving session data.

Usage: Called automatically by Claude Code when sessions stop
Input: JSON via stdin with session_id, transcript_path, etc.
Output: JSON response with continue or exit code
"""

import json
import sys
import os
import shutil
from pathlib import Path
from datetime import datetime
import subprocess
from typing import Dict, Any, List, Optional

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
UAT_ROOT = PROJECT_ROOT / "uat"

def log_debug(message: str) -> None:
    """Log debug message to stderr"""
    print(f"[DEBUG] uat-stop-hook: {message}", file=sys.stderr)

def log_info(message: str) -> None:
    """Log info message to stderr"""
    print(f"[INFO] uat-stop-hook: {message}", file=sys.stderr)

def log_error(message: str) -> None:
    """Log error message to stderr"""
    print(f"[ERROR] uat-stop-hook: {message}", file=sys.stderr)

def extract_session_id(transcript_path: str) -> Optional[str]:
    """Extract session ID from transcript path"""
    import re
    match = re.search(r'/conversations/([^/]+)/', transcript_path)
    return match.group(1) if match else None

def is_uat_session_active(session_id: str) -> bool:
    """Check if UAT session exists"""
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    return session_file.exists()

def load_session_state(session_id: str) -> Optional[Dict[str, Any]]:
    """Load UAT session state"""
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    
    if session_file.exists():
        try:
            with open(session_file) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    
    return None

def calculate_completion_metrics(session_state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate session completion metrics"""
    scenario = session_state.get("scenario", {})
    total_steps = scenario.get("totalSteps", 0)
    completed_steps = scenario.get("completedSteps", 0)
    current_step = scenario.get("currentStep", 0)
    
    completion_rate = completed_steps / total_steps if total_steps > 0 else 0
    
    # Determine status
    errors = session_state.get("execution", {}).get("errors", [])
    if completed_steps == total_steps and len(errors) == 0:
        status = "completed"
    elif len(errors) > 0:
        status = "failed"
    else:
        status = "incomplete"
    
    return {
        "totalSteps": total_steps,
        "currentStep": current_step,
        "completedSteps": completed_steps,
        "completionRate": completion_rate,
        "status": status
    }

def generate_session_report(session_state: Dict[str, Any], session_id: str, termination_reason: str = "normal") -> Optional[str]:
    """Generate comprehensive session report"""
    try:
        # Create reports directory
        reports_dir = UAT_ROOT / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        # Calculate metrics
        completion_metrics = calculate_completion_metrics(session_state)
        
        # Calculate session duration
        start_time = session_state.get("session", {}).get("startTime", "")
        end_time = datetime.utcnow().isoformat() + "Z"
        
        session_duration = 0
        if start_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                session_duration = int((end_dt - start_dt).total_seconds() * 1000)
            except:
                pass
        
        # Extract session info
        scenario_name = session_state.get("scenario", {}).get("name", "unknown")
        uat_session_id = session_state.get("session", {}).get("uatSessionId", "unknown")
        
        # Build comprehensive report
        report_data = {
            "meta": {
                "reportId": f"session-report-{session_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                "generatedAt": end_time,
                "reportType": "session_finalization",
                "generator": "uat-stop-hook",
                "version": "1.0.0"
            },
            "session": {
                "sessionId": uat_session_id,
                "claudeSessionId": session_id,
                "scenario": scenario_name,
                "startTime": start_time,
                "endTime": end_time,
                "duration": session_duration,
                "terminationReason": termination_reason,
                "mode": session_state.get("session", {}).get("mode", "production")
            },
            "execution": completion_metrics,
            "performance": session_state.get("performance", {}),
            "validation": {
                "totalValidations": len(session_state.get("validation", {}).get("healthChecks", [])),
                "passedValidations": len([v for v in session_state.get("validation", {}).get("healthChecks", []) if v.get("success")]),
                "failedValidations": len([v for v in session_state.get("validation", {}).get("healthChecks", []) if not v.get("success")]),
                "validationRate": 0,  # Will calculate below
                "frameworkInjected": session_state.get("validation", {}).get("frameworkInjected", False)
            },
            "screenshots": {
                "totalScreenshots": len(session_state.get("artifacts", {}).get("screenshots", [])),
                "successfulScreenshots": len([s for s in session_state.get("artifacts", {}).get("screenshots", []) if s.get("success")]),
                "failedScreenshots": len([s for s in session_state.get("artifacts", {}).get("screenshots", []) if not s.get("success")]),
                "screenshotList": session_state.get("artifacts", {}).get("screenshots", [])
            },
            "errors": session_state.get("execution", {}).get("errors", []),
            "toolCalls": session_state.get("execution", {}).get("toolCalls", []),
            "context": session_state.get("context", {}),
            "summary": {
                "status": completion_metrics["status"],
                "message": "",
                "recommendations": []
            }
        }
        
        # Calculate validation rate
        total_validations = report_data["validation"]["totalValidations"]
        if total_validations > 0:
            report_data["validation"]["validationRate"] = report_data["validation"]["passedValidations"] / total_validations
        
        # Generate summary and recommendations
        status = completion_metrics["status"]
        recommendations = []
        
        if status == "completed":
            report_data["summary"]["message"] = "Session completed successfully with all steps executed"
        elif status == "failed":
            report_data["summary"]["message"] = "Session failed with errors during execution"
            recommendations.extend(["Review error logs for debugging", "Consider re-running failed steps"])
        else:
            completion_rate = completion_metrics["completionRate"]
            completed = completion_metrics["completedSteps"]
            total = completion_metrics["totalSteps"]
            report_data["summary"]["message"] = f"Session incomplete: {completed}/{total} steps completed"
            recommendations.extend(["Consider re-running incomplete scenario", "Review execution logs for issues"])
        
        # Add performance-based recommendations
        error_count = len(report_data["errors"])
        if error_count > 0:
            recommendations.append("Review error logs for debugging")
        
        validation_rate = report_data["validation"]["validationRate"]
        if validation_rate < 0.8 and total_validations > 0:
            recommendations.append("Investigate validation failures")
        
        failed_screenshots = report_data["screenshots"]["failedScreenshots"]
        if failed_screenshots > 0:
            recommendations.append("Check screenshot capture configuration")
        
        report_data["summary"]["recommendations"] = list(set(recommendations))  # Remove duplicates
        
        # Write report file
        report_file = reports_dir / f"session-report-{session_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        log_info(f"Session report generated: {report_file}")
        return str(report_file)
        
    except Exception as e:
        log_error(f"Failed to generate session report: {e}")
        return None

def archive_session_files(session_state: Dict[str, Any], session_id: str) -> Optional[str]:
    """Archive session files"""
    try:
        uat_session_id = session_state.get("session", {}).get("uatSessionId", "unknown")
        
        # Create archive directory
        archive_dir = UAT_ROOT / "archive" / datetime.now().strftime("%Y-%m")
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        archive_name = f"session-{uat_session_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        archive_path = archive_dir / archive_name
        archive_path.mkdir(exist_ok=True)
        
        # Copy session state file
        session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
        if session_file.exists():
            shutil.copy2(session_file, archive_path / "session-state.json")
        
        # Copy screenshots directory
        screenshot_dir = Path(session_state.get("context", {}).get("screenshotDirectory", ""))
        if screenshot_dir.exists():
            shutil.copytree(screenshot_dir, archive_path / "screenshots", dirs_exist_ok=True)
        
        # Create archive metadata
        archive_metadata = {
            "sessionId": uat_session_id,
            "claudeSessionId": session_id,
            "archivePath": str(archive_path),
            "archivedAt": datetime.utcnow().isoformat() + "Z",
            "scenario": session_state.get("scenario", {}).get("name", "unknown"),
            "completionStatus": f"{session_state.get('scenario', {}).get('completedSteps', 0)}/{session_state.get('scenario', {}).get('totalSteps', 0)}",
            "fileTypes": ["session-state", "screenshots"],
            "retentionPolicy": "90-days"
        }
        
        with open(archive_path / "archive-metadata.json", 'w') as f:
            json.dump(archive_metadata, f, indent=2)
        
        log_info(f"Session files archived to: {archive_path}")
        return str(archive_path)
        
    except Exception as e:
        log_error(f"Failed to archive session files: {e}")
        return None

def update_uat_reporting(session_state: Dict[str, Any], report_file: str, archive_path: str) -> bool:
    """Update UAT framework reporting"""
    try:
        # Create or update UAT summary report
        summary_file = UAT_ROOT / "reports" / "uat-summary.json"
        
        existing_summary = {}
        if summary_file.exists():
            try:
                with open(summary_file) as f:
                    existing_summary = json.load(f)
            except:
                pass
        
        # Calculate completion metrics
        completion_metrics = calculate_completion_metrics(session_state)
        completion_rate = completion_metrics["completionRate"]
        
        # Update summary
        session_info = {
            "sessionId": session_state.get("session", {}).get("uatSessionId", "unknown"),
            "scenario": session_state.get("scenario", {}).get("name", "unknown"),
            "completionRate": completion_rate,
            "status": completion_metrics["status"],
            "reportFile": report_file,
            "archivePath": archive_path,
            "completedAt": datetime.utcnow().isoformat() + "Z"
        }
        
        updated_summary = existing_summary.copy()
        updated_summary.update({
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "totalSessions": existing_summary.get("totalSessions", 0) + 1,
            "recentSessions": (existing_summary.get("recentSessions", []) + [session_info])[-10:]  # Keep last 10
        })
        
        with open(summary_file, 'w') as f:
            json.dump(updated_summary, f, indent=2)
        
        # Update scenario statistics
        scenario_name = session_state.get("scenario", {}).get("name")
        if scenario_name and scenario_name != "unknown":
            scenario_stats_file = UAT_ROOT / "reports" / f"scenario-stats-{scenario_name}.json"
            
            existing_stats = {}
            if scenario_stats_file.exists():
                try:
                    with open(scenario_stats_file) as f:
                        existing_stats = json.load(f)
                except:
                    pass
            
            errors = session_state.get("execution", {}).get("errors", [])
            was_successful = completion_rate == 1.0 and len(errors) == 0
            
            total_runs = existing_stats.get("totalRuns", 0) + 1
            successful_runs = existing_stats.get("successfulRuns", 0) + (1 if was_successful else 0)
            avg_completion = (existing_stats.get("averageCompletionRate", 0) * (total_runs - 1) + completion_rate) / total_runs
            
            updated_stats = {
                "scenarioName": scenario_name,
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "totalRuns": total_runs,
                "successfulRuns": successful_runs,
                "averageCompletionRate": avg_completion
            }
            
            with open(scenario_stats_file, 'w') as f:
                json.dump(updated_stats, f, indent=2)
        
        log_info("UAT framework reporting updated")
        return True
        
    except Exception as e:
        log_error(f"Failed to update UAT reporting: {e}")
        return False

def cleanup_session_files(session_id: str) -> bool:
    """Clean up temporary files"""
    try:
        # Remove active session file
        session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
        if session_file.exists():
            session_file.unlink()
        
        # Clean up lock files
        sessions_dir = UAT_ROOT / "sessions"
        if sessions_dir.exists():
            for lock_file in sessions_dir.glob("*.lock"):
                try:
                    lock_file.unlink()
                except:
                    pass
        
        # Clean up temporary files older than 1 hour
        import time
        cutoff_time = time.time() - 3600  # 1 hour ago
        
        if sessions_dir.exists():
            for temp_file in sessions_dir.glob("temp-*"):
                try:
                    if temp_file.stat().st_mtime < cutoff_time:
                        temp_file.unlink()
                except:
                    pass
        
        # Clean up old archives (older than 90 days)
        archive_dir = UAT_ROOT / "archive"
        if archive_dir.exists():
            cutoff_time = time.time() - (90 * 24 * 3600)  # 90 days ago
            for archive_subdir in archive_dir.glob("*/session-*"):
                try:
                    if archive_subdir.stat().st_mtime < cutoff_time:
                        shutil.rmtree(archive_subdir)
                except:
                    pass
        
        log_info("Session cleanup completed")
        return True
        
    except Exception as e:
        log_error(f"Failed to cleanup session files: {e}")
        return False

def main():
    """Main hook logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        transcript_path = input_data.get("transcript_path", "")
        termination_reason = input_data.get("reason", "normal")
        
        log_debug("Session finalization hook triggered")
        
        # Extract session ID
        session_id = extract_session_id(transcript_path)
        if not session_id:
            log_debug("Could not extract session ID, skipping")
            print(json.dumps({"continue": True}))
            return
        
        # Check if UAT session was active
        if not is_uat_session_active(session_id):
            log_debug("No UAT session was active, skipping finalization")
            print(json.dumps({"continue": True}))
            return
        
        log_info("UAT session was active, performing finalization")
        
        # Load session state
        session_state = load_session_state(session_id)
        if not session_state:
            log_error("No session state found, performing minimal cleanup")
            cleanup_session_files(session_id)
            print(json.dumps({"continue": True}))
            return
        
        scenario_name = session_state.get("scenario", {}).get("name", "unknown")
        log_info(f"Finalizing UAT session for scenario: {scenario_name}")
        
        finalization_errors = 0
        
        # Generate session report
        report_file = generate_session_report(session_state, session_id, termination_reason)
        if not report_file:
            finalization_errors += 1
        
        # Archive session files
        archive_path = archive_session_files(session_state, session_id)
        if not archive_path:
            finalization_errors += 1
        
        # Update UAT framework reporting
        if report_file and not update_uat_reporting(session_state, report_file, archive_path or ""):
            finalization_errors += 1
        
        # Clean up temporary files
        if not cleanup_session_files(session_id):
            finalization_errors += 1
        
        if finalization_errors == 0:
            log_info("UAT session finalization completed successfully")
        else:
            log_info(f"UAT session finalization completed with {finalization_errors} error(s)")
        
        print(json.dumps({"continue": True}))
        
    except Exception as e:
        log_error(f"Hook execution failed: {e}")
        print(json.dumps({"continue": True}))  # Fail gracefully

if __name__ == "__main__":
    main()