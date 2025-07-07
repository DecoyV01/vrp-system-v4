#!/usr/bin/env python3
"""
UAT Stop Detector - Stop hook for Claude Code
Analyzes conversation transcript to detect UAT intent and sets up UAT context
"""

import json
import sys
import os
import re
import importlib.util
from datetime import datetime

# Import with proper module name handling
try:
    from uat_session_manager import UATSessionManager
except ImportError:
    # Handle hyphenated module name
    spec = importlib.util.spec_from_file_location(
        "uat_session_manager", 
        os.path.join(os.path.dirname(__file__), "uat-session-manager.py")
    )
    uat_session_manager = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uat_session_manager)
    UATSessionManager = uat_session_manager.UATSessionManager

class UATStopDetector:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def analyze_transcript(self, transcript_path):
        """Analyze conversation transcript for UAT intent"""
        if not os.path.exists(transcript_path):
            return False, None, None
            
        try:
            with open(transcript_path, 'r') as f:
                lines = f.readlines()
                
            # Look for recent user messages (last 3 messages)
            user_messages = []
            for line in lines[-10:]:  # Check last 10 lines for user messages
                try:
                    data = json.loads(line.strip())
                    if data.get('role') == 'user':
                        content = data.get('content', '')
                        if isinstance(content, list):
                            # Handle message with multiple parts
                            text_content = ''
                            for part in content:
                                if isinstance(part, dict) and part.get('type') == 'text':
                                    text_content += part.get('text', '')
                        else:
                            text_content = content
                        user_messages.append(text_content)
                except (json.JSONDecodeError, KeyError):
                    continue
                    
            # Analyze recent messages for UAT intent
            for message in user_messages[-3:]:  # Check last 3 user messages
                is_uat, scenario = self.manager.detect_uat_intent(message)
                if is_uat:
                    return True, scenario, message
                    
            return False, None, None
            
        except Exception as e:
            sys.stderr.write(f"Transcript analysis error: {str(e)}\n")
            return False, None, None
    
    def setup_uat_context(self, scenario, user_message):
        """Set up UAT context for subsequent tool calls"""
        try:
            # Check if UAT session already exists
            existing_session = self.manager.load_session()
            if existing_session:
                sys.stderr.write(f"UAT session already active: {existing_session['sessionId']}\n")
                return existing_session
            
            # Initialize new UAT session
            session = self.manager.init_session(scenario, user_message)
            
            # Set environment variables for future tool calls
            os.environ['UAT_SESSION_ID'] = session['sessionId']
            os.environ['UAT_SCENARIO'] = session['scenario']
            os.environ['UAT_PHASE'] = session['phase']
            
            # Create signal file for orchestrator fallback
            signal_file = os.path.join(self.uat_root, '.uat_context')
            with open(signal_file, 'w') as f:
                json.dump({
                    'sessionId': session['sessionId'],
                    'scenario': session['scenario'],
                    'userMessage': user_message,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'stop-hook-transcript-analysis'
                }, f, indent=2)
            
            sys.stderr.write(f"UAT Context Established: {session['sessionId']} - {scenario}\n")
            sys.stderr.write(f"User Message: {user_message}\n")
            
            return session
            
        except Exception as e:
            sys.stderr.write(f"UAT context setup error: {str(e)}\n")
            return None
    
    def process_hook(self):
        """Main Stop hook processing logic"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            # Get transcript path
            transcript_path = input_data.get('transcript_path')
            if not transcript_path:
                sys.stderr.write("No transcript path provided\n")
                sys.exit(0)
            
            # Check if stop hook is already active to prevent loops
            stop_hook_active = input_data.get('stop_hook_active', False)
            if stop_hook_active:
                sys.stderr.write("Stop hook already active, skipping UAT detection\n")
                sys.exit(0)
            
            # Analyze transcript for UAT intent
            is_uat, scenario, user_message = self.analyze_transcript(transcript_path)
            
            if is_uat and scenario:
                # Set up UAT context
                session = self.setup_uat_context(scenario, user_message)
                
                if session:
                    # Block stoppage and instruct Claude to execute the structured UAT test runner
                    response = {
                        "decision": "block",
                        "reason": f"UAT testing detected for scenario '{scenario}'. Please execute the structured UAT scenario by running: 'node uat-test-runner.cjs scenario {scenario} --debug' from the uat/ directory. The UAT session {session['sessionId']} has been initialized. This will execute the complete scenario with proper validation, screenshots, and VERA methodology."
                    }
                    print(json.dumps(response))
                    sys.exit(0)
            
            # No UAT detected or error - let Claude stop normally
            sys.exit(0)
            
        except Exception as e:
            sys.stderr.write(f"UAT Stop Detector Error: {str(e)}\n")
            sys.exit(1)

if __name__ == "__main__":
    detector = UATStopDetector()
    detector.process_hook()