#!/usr/bin/env python3
"""
Claude Code UAT PreToolUse Hook

This hook integrates with Claude Code's hook system to detect UAT testing intentions
and enhance Browser MCP parameters with UAT context.

Usage: Called automatically by Claude Code before Browser MCP tool execution
Input: JSON via stdin with tool_name, tool_input, session_id, etc.
Output: JSON response with continue/decision or exit code
"""

import json
import sys
import os
import re
from pathlib import Path
from datetime import datetime
import subprocess
from typing import Dict, Any, List, Optional, Tuple

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
UAT_ROOT = PROJECT_ROOT / "uat"

# UAT scenarios
AVAILABLE_SCENARIOS = ["login-flow", "vehicle-crud", "user-registration"]

# Confidence thresholds
THRESHOLD_HIGH = 80      # Auto-initialize UAT
THRESHOLD_MEDIUM = 60    # Initialize with suggestions  
THRESHOLD_LOW = 40       # Maybe UAT

def log_debug(message: str) -> None:
    """Log debug message to stderr"""
    print(f"[DEBUG] uat-pre-hook: {message}", file=sys.stderr)

def log_info(message: str) -> None:
    """Log info message to stderr"""
    print(f"[INFO] uat-pre-hook: {message}", file=sys.stderr)

def log_error(message: str) -> None:
    """Log error message to stderr"""
    print(f"[ERROR] uat-pre-hook: {message}", file=sys.stderr)

def extract_scenario_name(message: str) -> Optional[str]:
    """Extract scenario name from user message"""
    message = message.lower()
    
    # Direct scenario name patterns
    for scenario in AVAILABLE_SCENARIOS:
        if scenario in message:
            return scenario
    
    # Pattern: "test X scenario" or "run X scenario"
    patterns = [
        r'test\s+(.*?)\s+scenario',
        r'run\s+(.*?)\s+scenario',
        r'execute\s+(.*?)\s+scenario'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            extracted = match.group(1).strip()
            # Convert to scenario format
            scenario_name = extracted.replace(' ', '-').lower()
            if scenario_name in AVAILABLE_SCENARIOS:
                return scenario_name
    
    return None

def find_best_scenario_match(message: str) -> Optional[str]:
    """Find best scenario match based on keywords"""
    message = message.lower()
    best_match = None
    best_score = 0
    
    # Scoring for each scenario
    scenario_keywords = {
        "login-flow": ["login", "auth", "signin", "credential", "authentication"],
        "vehicle-crud": ["vehicle", "fleet", "car", "truck", "crud", "manage"],
        "user-registration": ["user", "register", "signup", "account", "profile"]
    }
    
    for scenario, keywords in scenario_keywords.items():
        score = sum(30 if keyword in message else 0 for keyword in keywords)
        if score > best_score and score >= 30:  # Minimum threshold
            best_score = score
            best_match = scenario
    
    return best_match

def calculate_confidence_score(user_message: str, tool_name: str, tool_input: Dict[str, Any]) -> int:
    """Calculate UAT detection confidence score"""
    score = 0
    
    # Message analysis (0-50 points)
    message = user_message.lower()
    
    # High-confidence patterns
    if re.search(r'test.*scenario|run.*uat|execute.*scenario', message):
        score += 50
    elif re.search(r'test.*(login|vehicle|crud|flow)', message):
        score += 40
    elif re.search(r'(verify|validate|check).*(functionality|feature)', message):
        score += 35
    
    # Medium-confidence patterns  
    elif re.search(r'test.*functionality|verify.*feature', message):
        score += 25
    elif re.search(r'navigate.*and.*(test|verify|check)', message):
        score += 20
    
    # Low-confidence patterns
    elif re.search(r'take.*screenshot|fill.*form|click.*button', message):
        score += 10
    
    # Tool analysis (0-30 points)
    if tool_name.startswith("mcp__playwright__"):
        score += 10
        
        # URL analysis
        url = tool_input.get('url', '')
        if '/auth/' in url or '/login' in url or '/signin' in url:
            score += 20  # Authentication URLs
        elif any(path in url for path in ['/dashboard', '/projects', '/vehicles', '/users']):
            score += 15  # Application URLs
    
    # Context correlation (0-20 points)
    if 'login' in message and 'navigate' in tool_name and '/auth/' in str(tool_input):
        score += 20
    elif 'test' in message and tool_name.startswith("mcp__playwright__"):
        score += 15
    elif 'verify' in message and 'screenshot' in tool_name:
        score += 10
    
    return min(score, 100)  # Cap at 100

def make_uat_decision(confidence: int, scenario: Optional[str], transcript_path: str) -> str:
    """Make UAT decision based on confidence and context"""
    
    # Check if UAT session already active
    if is_uat_session_active(transcript_path):
        return "enhance_existing"
    
    if confidence >= THRESHOLD_HIGH and scenario and scenario in AVAILABLE_SCENARIOS:
        return f"auto_initialize:{scenario}"
    elif confidence >= THRESHOLD_MEDIUM and scenario:
        return f"suggest_initialize:{scenario}"
    elif confidence >= THRESHOLD_LOW:
        return "maybe_uat"
    else:
        return "allow_normal"

def is_uat_session_active(transcript_path: str) -> bool:
    """Check if UAT session is already active"""
    session_id = extract_session_id(transcript_path)
    if not session_id:
        return False
    
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    return session_file.exists()

def extract_session_id(transcript_path: str) -> Optional[str]:
    """Extract session ID from transcript path"""
    # Extract from path like ~/.claude/projects/vrp-v4/conversations/abc123/conversation.jsonl
    match = re.search(r'/conversations/([^/]+)/', transcript_path)
    return match.group(1) if match else None

def get_session_context(session_id: str) -> Optional[Dict[str, Any]]:
    """Get existing session context"""
    session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
    
    if session_file.exists():
        try:
            with open(session_file) as f:
                data = json.load(f)
                return {
                    "scenario": data.get("scenario", {}).get("name"),
                    "uatSessionId": data.get("session", {}).get("uatSessionId"),
                    "currentStep": data.get("scenario", {}).get("currentStep", 1),
                    "totalSteps": data.get("scenario", {}).get("totalSteps", 0),
                    "mode": data.get("session", {}).get("mode", "production"),
                    "baseUrl": data.get("context", {}).get("baseUrl", "https://vrp-system-v4.pages.dev"),
                    "screenshotDirectory": data.get("context", {}).get("screenshotDirectory")
                }
        except (json.JSONDecodeError, IOError):
            return None
    
    return None

def create_uat_session(session_id: str, scenario: str, user_message: str, confidence: int) -> bool:
    """Create new UAT session"""
    try:
        # Create directories
        UAT_ROOT.mkdir(exist_ok=True)
        (UAT_ROOT / "sessions").mkdir(exist_ok=True)
        (UAT_ROOT / "reports").mkdir(exist_ok=True)
        
        # Generate UAT session ID
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        uat_session_id = f"uat-{timestamp}-{session_id[:6]}"
        
        # Create screenshot directory
        screenshot_dir = UAT_ROOT / "screenshots" / uat_session_id
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        
        # Load scenario info (simplified for now)
        scenario_steps = get_scenario_steps(scenario)
        
        # Create session state
        session_state = {
            "meta": {
                "version": "1.0.0",
                "created": datetime.utcnow().isoformat() + "Z",
                "updated": datetime.utcnow().isoformat() + "Z",
                "format": "claude-uat-session-state"
            },
            "session": {
                "claudeSessionId": session_id,
                "uatSessionId": uat_session_id,
                "scenarioName": scenario,
                "mode": "production",
                "status": "active",
                "startTime": datetime.utcnow().isoformat() + "Z",
                "lastActivity": datetime.utcnow().isoformat() + "Z"
            },
            "scenario": {
                "name": scenario,
                "totalSteps": len(scenario_steps),
                "currentStep": 1,
                "completedSteps": 0,
                "steps": scenario_steps
            },
            "execution": {
                "toolCalls": [],
                "errors": []
            },
            "artifacts": {
                "screenshots": []
            },
            "context": {
                "userMessage": user_message,
                "detectionConfidence": confidence,
                "baseUrl": "https://vrp-system-v4.pages.dev",
                "screenshotDirectory": str(screenshot_dir)
            }
        }
        
        # Write session file
        session_file = UAT_ROOT / "sessions" / f"claude-session-{session_id}.json"
        with open(session_file, 'w') as f:
            json.dump(session_state, f, indent=2)
        
        log_info(f"UAT session created: {uat_session_id}")
        return True
        
    except Exception as e:
        log_error(f"Failed to create UAT session: {e}")
        return False

def get_scenario_steps(scenario: str) -> List[Dict[str, Any]]:
    """Get simplified scenario steps"""
    steps_map = {
        "login-flow": [
            {"stepNumber": 1, "action": "navigate", "description": "Navigate to login page", "status": "pending"},
            {"stepNumber": 2, "action": "fill", "description": "Fill login credentials", "status": "pending"},
            {"stepNumber": 3, "action": "click", "description": "Click login button", "status": "pending"},
            {"stepNumber": 4, "action": "screenshot", "description": "Take success screenshot", "status": "pending"},
            {"stepNumber": 5, "action": "verify", "description": "Verify login success", "status": "pending"}
        ],
        "vehicle-crud": [
            {"stepNumber": 1, "action": "navigate", "description": "Navigate to vehicles page", "status": "pending"},
            {"stepNumber": 2, "action": "click", "description": "Click create vehicle", "status": "pending"},
            {"stepNumber": 3, "action": "fill", "description": "Fill vehicle form", "status": "pending"},
            {"stepNumber": 4, "action": "click", "description": "Submit form", "status": "pending"},
            {"stepNumber": 5, "action": "screenshot", "description": "Take final screenshot", "status": "pending"}
        ],
        "user-registration": [
            {"stepNumber": 1, "action": "navigate", "description": "Navigate to registration", "status": "pending"},
            {"stepNumber": 2, "action": "fill", "description": "Fill user details", "status": "pending"},
            {"stepNumber": 3, "action": "click", "description": "Submit registration", "status": "pending"},
            {"stepNumber": 4, "action": "screenshot", "description": "Take confirmation screenshot", "status": "pending"}
        ]
    }
    
    return steps_map.get(scenario, [])

def enhance_tool_parameters(tool_name: str, tool_input: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance tool parameters with UAT context"""
    enhanced = tool_input.copy()
    
    # Screenshot enhancements
    if "screenshot" in tool_name:
        name = enhanced.get("name", "screenshot")
        step = context.get("currentStep", 1)
        scenario = context.get("scenario", "test")
        timestamp = datetime.now().strftime("%H%M%S")
        
        enhanced_name = f"{context['uatSessionId']}-{scenario}-step{step}-{name}-{timestamp}"
        enhanced.update({
            "name": enhanced_name,
            "savePng": True,
            "downloadsDir": context.get("screenshotDirectory"),
            "fullPage": enhanced.get("fullPage", False),
            "width": enhanced.get("width", 1280),
            "height": enhanced.get("height", 720)
        })
    
    # Navigation enhancements
    elif "navigate" in tool_name:
        url = enhanced.get("url", "")
        base_url = context.get("baseUrl", "")
        
        # Resolve relative URLs
        if url.startswith("/") and base_url:
            enhanced["url"] = f"{base_url}{url}"
        
        enhanced.update({
            "timeout": enhanced.get("timeout", 10000),
            "waitUntil": enhanced.get("waitUntil", "networkidle"),
            "headless": enhanced.get("headless", True),
            "browserType": enhanced.get("browserType", "chromium"),
            "width": enhanced.get("width", 1280),
            "height": enhanced.get("height", 720)
        })
    
    # Click/Fill enhancements
    elif "click" in tool_name or "fill" in tool_name:
        enhanced.update({
            "timeout": enhanced.get("timeout", 5000),
            "force": enhanced.get("force", False)
        })
    
    return enhanced

def main():
    """Main hook logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        session_id = input_data.get("session_id", "")
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        transcript_path = input_data.get("transcript_path", "")
        
        # Extract user message from transcript (simplified approach)
        user_message = extract_user_message(transcript_path)
        
        log_debug(f"Processing tool: {tool_name}")
        
        # Check if this is a Browser MCP tool
        if not tool_name.startswith("mcp__playwright__"):
            log_debug("Not a Browser MCP tool, allowing")
            print(json.dumps({"continue": True}))
            return
        
        # Extract session ID from transcript path
        session_id = extract_session_id(transcript_path)
        if not session_id:
            log_error("Could not extract session ID")
            print(json.dumps({"continue": True}))
            return
        
        # Check if UAT session already active
        if is_uat_session_active(transcript_path):
            log_debug("UAT session active, enhancing parameters")
            context = get_session_context(session_id)
            if context:
                enhanced_params = enhance_tool_parameters(tool_name, tool_input, context)
                response = {
                    "continue": True,
                    "tool_input": enhanced_params,
                    "suppressOutput": False
                }
                print(json.dumps(response))
                return
        
        # Detect UAT context
        scenario = extract_scenario_name(user_message) or find_best_scenario_match(user_message)
        confidence = calculate_confidence_score(user_message, tool_name, tool_input)
        decision = make_uat_decision(confidence, scenario, transcript_path)
        
        log_debug(f"UAT decision: {decision} (confidence: {confidence})")
        
        # Handle decision
        if decision.startswith("auto_initialize:"):
            scenario_name = decision.split(":", 1)[1]
            if create_uat_session(session_id, scenario_name, user_message, confidence):
                context = get_session_context(session_id)
                if context:
                    enhanced_params = enhance_tool_parameters(tool_name, tool_input, context)
                    response = {
                        "continue": True,
                        "tool_input": enhanced_params,
                        "suppressOutput": False
                    }
                    print(json.dumps(response))
                    return
        
        # Default: allow normal execution
        print(json.dumps({"continue": True}))
        
    except Exception as e:
        log_error(f"Hook execution failed: {e}")
        print(json.dumps({"continue": True}))  # Fail gracefully

def extract_user_message(transcript_path: str) -> str:
    """Extract the latest user message from transcript (simplified)"""
    try:
        # Read last few lines of conversation.jsonl to find user message
        with open(transcript_path, 'r') as f:
            lines = f.readlines()
        
        # Look for the most recent user message
        for line in reversed(lines[-10:]):  # Check last 10 lines
            try:
                data = json.loads(line.strip())
                if data.get("role") == "user":
                    content = data.get("content", "")
                    if isinstance(content, list):
                        # Extract text content
                        text_parts = [item.get("text", "") for item in content if item.get("type") == "text"]
                        return " ".join(text_parts)
                    elif isinstance(content, str):
                        return content
            except json.JSONDecodeError:
                continue
        
        return ""
    except Exception:
        return ""

if __name__ == "__main__":
    main()