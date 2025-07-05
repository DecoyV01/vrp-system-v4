#!/usr/bin/env python3
"""
Claude Code UAT PostToolUse Hook

This hook integrates with Claude Code's hook system to track Browser MCP tool execution
results and update UAT session state with progress and artifacts.

Usage: Called automatically by Claude Code after Browser MCP tool execution
Input: JSON via stdin with tool_name, tool_input, result, session_id, etc.
Output: JSON response with continue or exit code
"""

import json
import sys
import os
import re
from pathlib import Path
from datetime import datetime
import subprocess
from typing import Dict, Any, List, Optional

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
UAT_ROOT = PROJECT_ROOT / "uat"

def log_debug(message: str) -> None:
    """Log debug message to stderr"""
    print(f"[DEBUG] uat-post-hook: {message}", file=sys.stderr)

def log_info(message: str) -> None:
    """Log info message to stderr"""
    print(f"[INFO] uat-post-hook: {message}", file=sys.stderr)

def log_error(message: str) -> None:
    """Log error message to stderr"""
    print(f"[ERROR] uat-post-hook: {message}", file=sys.stderr)

def extract_session_id(transcript_path: str) -> Optional[str]:
    """Extract session ID from transcript path"""
    match = re.search(r'/conversations/([^/]+)/', transcript_path)
    return match.group(1) if match else None

def is_uat_session_active(session_id: str) -> bool:
    """Check if UAT session is active"""
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    
    if session_file.exists():
        try:
            with open(session_file) as f:
                data = json.load(f)
                return data.get("session", {}).get("status") == "active"
        except (json.JSONDecodeError, IOError):
            return False
    
    return False

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

def save_session_state(session_id: str, state: Dict[str, Any]) -> bool:
    """Save UAT session state"""
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    
    try:
        # Update metadata
        state["meta"]["updated"] = datetime.utcnow().isoformat() + "Z"
        state["session"]["lastActivity"] = datetime.utcnow().isoformat() + "Z"
        
        with open(session_file, 'w') as f:
            json.dump(state, f, indent=2)
        return True
    except Exception as e:
        log_error(f"Failed to save session state: {e}")
        return False

def create_tool_call_record(tool_name: str, tool_input: Dict[str, Any], result: Dict[str, Any], execution_time: float) -> Dict[str, Any]:
    """Create tool call record"""
    success = result.get("success", False)
    
    # Determine action type
    action_map = {
        "navigate": "navigate",
        "click": "click", 
        "fill": "fill",
        "screenshot": "screenshot",
        "evaluate": "evaluate"
    }
    
    action = "unknown"
    for key, value in action_map.items():
        if key in tool_name:
            action = value
            break
    
    return {
        "id": f"tool-call-{datetime.now().timestamp()}",
        "toolName": tool_name,
        "parameters": tool_input,
        "result": result,
        "executionTime": execution_time,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "success": success,
        "action": action
    }

def extract_screenshot_info(tool_name: str, tool_input: Dict[str, Any], result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract screenshot information"""
    if "screenshot" not in tool_name:
        return None
    
    name = tool_input.get("name", "screenshot")
    downloads_dir = tool_input.get("downloadsDir", "")
    save_png = tool_input.get("savePng", False)
    success = result.get("success", False)
    
    screenshot_path = ""
    if save_png and downloads_dir:
        screenshot_path = f"{downloads_dir}/{name}.png"
    
    # Check if file exists and get size
    exists = False
    size = 0
    if screenshot_path and Path(screenshot_path).exists():
        exists = True
        size = Path(screenshot_path).stat().st_size
    
    return {
        "name": name,
        "path": screenshot_path,
        "directory": downloads_dir,
        "success": success,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "size": size,
        "exists": exists,
        "method": "browser-mcp"
    }

def extract_validation_info(tool_name: str, result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract validation information"""
    validation_data = None
    
    # Navigation validation
    if "navigate" in tool_name:
        success = result.get("success", False)
        url = result.get("url", "")
        status_code = result.get("statusCode", 0)
        
        validation_data = {
            "type": "navigation",
            "success": success,
            "finalUrl": url,
            "statusCode": status_code,
            "validation": "page_load",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    # Evaluate validation (look for UAT health checks)
    elif "evaluate" in tool_name:
        script_result = result.get("result", "")
        if "__UAT_HEALTH__" in str(script_result):
            validation_data = {
                "type": "health_check",
                "result": script_result,
                "framework": "uat_health_check",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "success": True
            }
    
    return validation_data

def calculate_performance_update(execution_time: float, success: bool, session_state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate performance metrics update"""
    current_perf = session_state.get("performance", {})
    
    tool_count = current_perf.get("toolCallCount", 0) + 1
    total_time = current_perf.get("totalExecutionTime", 0) + execution_time
    error_count = current_perf.get("errorCount", 0)
    
    if not success:
        error_count += 1
    
    avg_duration = total_time / tool_count if tool_count > 0 else 0
    success_rate = (tool_count - error_count) / tool_count if tool_count > 0 else 0
    
    # Update fastest/slowest steps
    fastest = current_perf.get("fastestStep")
    slowest = current_perf.get("slowestStep")
    
    current_step = session_state.get("scenario", {}).get("currentStep", 1)
    
    if not fastest or execution_time < fastest.get("duration", float('inf')):
        fastest = {
            "stepNumber": current_step,
            "duration": execution_time,
            "action": "browser_action"
        }
    
    if not slowest or execution_time > slowest.get("duration", 0):
        slowest = {
            "stepNumber": current_step, 
            "duration": execution_time,
            "action": "browser_action"
        }
    
    return {
        "totalExecutionTime": total_time,
        "averageStepDuration": avg_duration,
        "toolCallCount": tool_count,
        "errorCount": error_count,
        "successRate": success_rate,
        "fastestStep": fastest,
        "slowestStep": slowest
    }

def should_advance_step(tool_name: str, success: bool) -> bool:
    """Determine if current step should be advanced"""
    if not success:
        return False
    
    # Advance on successful navigation, clicks, and fills
    advancing_actions = ["navigate", "click", "fill"]
    return any(action in tool_name for action in advancing_actions)

def update_scenario_progress(session_state: Dict[str, Any], tool_name: str, success: bool) -> Dict[str, Any]:
    """Update scenario progress"""
    scenario = session_state.get("scenario", {})
    current_step = scenario.get("currentStep", 1)
    total_steps = scenario.get("totalSteps", 0)
    
    # Update current step status
    steps = scenario.get("steps", [])
    for step in steps:
        if step.get("stepNumber") == current_step:
            step["status"] = "completed" if success else "failed"
            if success:
                step["endTime"] = datetime.utcnow().isoformat() + "Z"
            break
    
    # Check if we should advance to next step
    if should_advance_step(tool_name, success) and success:
        next_step = current_step + 1
        if next_step <= total_steps:
            # Advance to next step
            scenario["currentStep"] = next_step
            scenario["completedSteps"] = current_step
            
            # Mark next step as in progress
            for step in steps:
                if step.get("stepNumber") == next_step:
                    step["status"] = "in_progress"
                    step["startTime"] = datetime.utcnow().isoformat() + "Z"
                    break
            
            log_info(f"Advanced to step {next_step} of {total_steps}")
        else:
            # Scenario completed
            scenario["completedSteps"] = total_steps
            scenario["status"] = "completed"
            log_info("Scenario completed!")
    
    return scenario

def record_error(tool_name: str, result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Record error information"""
    error_msg = result.get("error", "")
    if error_msg:
        return {
            "tool": tool_name,
            "message": error_msg,
            "source": "browser_mcp_execution",
            "severity": "error",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    return None

def main():
    """Main hook logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        result = input_data.get("result", {})
        execution_time = input_data.get("execution_time_ms", 0)
        transcript_path = input_data.get("transcript_path", "")
        
        log_debug(f"Processing result for tool: {tool_name}")
        
        # Check if this is a Browser MCP tool
        if not tool_name.startswith("mcp__playwright__"):
            log_debug("Not a Browser MCP tool, skipping")
            print(json.dumps({"continue": True}))
            return
        
        # Extract session ID
        session_id = extract_session_id(transcript_path)
        if not session_id:
            log_error("Could not extract session ID")
            print(json.dumps({"continue": True}))
            return
        
        # Check if UAT session is active
        if not is_uat_session_active(session_id):
            log_debug("No active UAT session, skipping tracking")
            print(json.dumps({"continue": True}))
            return
        
        # Load session state
        session_state = load_session_state(session_id)
        if not session_state:
            log_error("Failed to load session state")
            print(json.dumps({"continue": True}))
            return
        
        log_debug("Updating UAT session with tool execution results")
        
        # Create tool call record
        tool_call = create_tool_call_record(tool_name, tool_input, result, execution_time)
        session_state.setdefault("execution", {}).setdefault("toolCalls", []).append(tool_call)
        
        # Extract and record screenshot info
        screenshot_info = extract_screenshot_info(tool_name, tool_input, result)
        if screenshot_info:
            session_state.setdefault("artifacts", {}).setdefault("screenshots", []).append(screenshot_info)
            log_debug(f"Recorded screenshot: {screenshot_info['name']}")
        
        # Extract and record validation info
        validation_info = extract_validation_info(tool_name, result)
        if validation_info:
            session_state.setdefault("validation", {}).setdefault("healthChecks", []).append(validation_info)
            log_debug(f"Recorded validation: {validation_info['type']}")
        
        # Update performance metrics
        success = result.get("success", False)
        performance_update = calculate_performance_update(execution_time, success, session_state)
        session_state["performance"] = performance_update
        
        # Update scenario progress
        updated_scenario = update_scenario_progress(session_state, tool_name, success)
        session_state["scenario"] = updated_scenario
        
        # Record any errors
        error_info = record_error(tool_name, result)
        if error_info:
            session_state.setdefault("execution", {}).setdefault("errors", []).append(error_info)
            log_debug(f"Recorded error: {error_info['message']}")
        
        # Save updated session state
        if save_session_state(session_id, session_state):
            log_info("Session state updated successfully")
        else:
            log_error("Failed to save session state")
        
        print(json.dumps({"continue": True}))
        
    except Exception as e:
        log_error(f"Hook execution failed: {e}")
        print(json.dumps({"continue": True}))  # Fail gracefully

if __name__ == "__main__":
    main()