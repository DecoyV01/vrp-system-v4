#!/usr/bin/env python3
"""
UAT Session Manager - Core session management for UAT testing
Handles session initialization, state tracking, and scenario mapping
"""

import json
import sys
import os
from datetime import datetime
import re

class UATSessionManager:
    def __init__(self):
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        self.session_dir = os.path.join(self.uat_root, 'sessions')
        self.current_session_file = os.path.join(self.session_dir, 'current.json')
        
        # Ensure session directory exists
        os.makedirs(self.session_dir, exist_ok=True)
        
    def detect_uat_intent(self, message):
        """
        Detect UAT intent requiring 'uat' keyword + scenario keyword
        Returns (is_uat, scenario_name)
        """
        message_lower = message.lower()
        
        # Must contain 'uat' keyword
        if 'uat' not in message_lower:
            return False, None
            
        # Scenario keyword mapping to scenario files
        scenario_map = {
            'login': 'login-flow',
            'login-flow': 'login-flow',
            'auth': 'login-flow',
            'authentication': 'login-flow',
            'vehicle': 'vehicle-crud',
            'vehicle-crud': 'vehicle-crud',
            'crud': 'vehicle-crud',
            'create': 'vehicle-crud',
            'update': 'vehicle-crud',
            'delete': 'vehicle-crud',
            'error': 'error-handling',
            'error-handling': 'error-handling',
            'handling': 'error-handling',
            'validation': 'error-handling'
        }
        
        # Find matching scenario
        for keyword, scenario in scenario_map.items():
            if keyword in message_lower:
                return True, scenario
                
        # No scenario match found
        return False, None
        
    def init_session(self, scenario_name, user_message=None):
        """Initialize a new UAT session"""
        session_id = datetime.now().strftime('%Y%m%d-%H%M%S')
        
        session = {
            'sessionId': session_id,
            'scenario': scenario_name,
            'startTime': datetime.now().isoformat(),
            'status': 'active',
            'phase': 'initialization',
            'userMessage': user_message,
            'steps': [],
            'artifacts': {
                'screenshots': [],
                'logs': [],
                'reports': []
            },
            'metrics': {
                'totalSteps': 0,
                'completedSteps': 0,
                'failedSteps': 0,
                'duration': 0
            },
            'execution_progress': {
                'current_step': 1,
                'completed_steps': [],
                'total_steps': 0,
                'last_executed_tool': '',
                'status': 'ready',
                'execution_plan_loaded': False
            }
        }
        
        # Save session
        with open(self.current_session_file, 'w') as f:
            json.dump(session, f, indent=2)
            
        # Create session-specific directory
        session_path = os.path.join(self.session_dir, session_id)
        os.makedirs(session_path, exist_ok=True)
        
        return session
        
    def load_session(self):
        """Load current active session"""
        if not os.path.exists(self.current_session_file):
            return None
            
        try:
            with open(self.current_session_file, 'r') as f:
                return json.load(f)
        except:
            return None
            
    def update_session(self, updates):
        """Update current session with new data"""
        session = self.load_session()
        if not session:
            return None
            
        # Merge updates
        for key, value in updates.items():
            if isinstance(value, dict) and key in session:
                session[key].update(value)
            else:
                session[key] = value
                
        # Save updated session
        with open(self.current_session_file, 'w') as f:
            json.dump(session, f, indent=2)
            
        return session
        
    def add_step(self, step_data):
        """Add a step to the current session"""
        session = self.load_session()
        if not session:
            return None
            
        step = {
            'timestamp': datetime.now().isoformat(),
            'phase': session.get('phase', 'unknown'),
            **step_data
        }
        
        session['steps'].append(step)
        session['metrics']['totalSteps'] += 1
        
        if step.get('status') == 'completed':
            session['metrics']['completedSteps'] += 1
        elif step.get('status') == 'failed':
            session['metrics']['failedSteps'] += 1
            
        # Save updated session
        with open(self.current_session_file, 'w') as f:
            json.dump(session, f, indent=2)
            
        return session
        
    def finalize_session(self, status='completed'):
        """Finalize the current session"""
        session = self.load_session()
        if not session:
            return None
            
        # Calculate duration
        start_time = datetime.fromisoformat(session['startTime'])
        duration = (datetime.now() - start_time).total_seconds()
        
        session['status'] = status
        session['endTime'] = datetime.now().isoformat()
        session['metrics']['duration'] = duration
        
        # Save final session
        session_id = session['sessionId']
        final_path = os.path.join(self.session_dir, session_id, 'session.json')
        
        with open(final_path, 'w') as f:
            json.dump(session, f, indent=2)
            
        # Remove current session marker
        if os.path.exists(self.current_session_file):
            os.remove(self.current_session_file)
            
        return session
        
    def get_scenario_path(self, scenario_name):
        """Get full path to scenario file"""
        return os.path.join(self.uat_root, 'scenarios', f'{scenario_name}.cjs')
        
    def scenario_exists(self, scenario_name):
        """Check if scenario file exists"""
        return os.path.exists(self.get_scenario_path(scenario_name))

# CLI testing interface
if __name__ == "__main__":
    manager = UATSessionManager()
    
    # Test detection
    test_phrases = [
        "Run UAT for login flow",
        "Execute UAT vehicle CRUD tests",
        "Test UAT error handling",
        "Test login flow",  # Should fail - no UAT
        "Run UAT tests",    # Should fail - no scenario
        "Perform UAT authentication testing"
    ]
    
    print("UAT Intent Detection Tests:")
    print("-" * 50)
    
    for phrase in test_phrases:
        is_uat, scenario = manager.detect_uat_intent(phrase)
        status = "✓" if is_uat else "✗"
        print(f"{status} '{phrase}' -> UAT: {is_uat}, Scenario: {scenario}")