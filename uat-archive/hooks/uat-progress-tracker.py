#!/usr/bin/env python3
"""
UAT Progress Tracker - PostToolUse hook for Claude Code
Tracks execution progress and captures artifacts
"""

import json
import sys
import os
import re
from datetime import datetime
import importlib.util

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

class UATProgressTracker:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def update_objective_progress(self, session, step_action, step_result):
        """Update objective progress based on step completion"""
        objectives_data = session.get('objectives')
        if not objectives_data:
            return
            
        definitions = objectives_data.get('definitions', [])
        status = objectives_data.get('status', {})
        
        # Find objectives that include this step action
        for definition in definitions:
            obj_id = definition['id']
            obj_steps = definition.get('steps', [])
            
            if step_action in obj_steps and obj_id in status:
                obj_status = status[obj_id]
                
                # Mark objective as in progress if not already
                if obj_status['status'] == 'pending':
                    obj_status['status'] = 'in_progress'
                    obj_status['startTime'] = datetime.now().isoformat()
                
                # Track completed step if successful
                if step_result.get('status') == 'completed':
                    if step_action not in obj_status['completedSteps']:
                        obj_status['completedSteps'].append(step_action)
                        
                        # Update progress percentage
                        obj_status['progress'] = int((len(obj_status['completedSteps']) / obj_status['totalSteps']) * 100)
                        
                        # Check if objective is complete
                        if len(obj_status['completedSteps']) == obj_status['totalSteps']:
                            obj_status['status'] = 'completed'
                            obj_status['endTime'] = datetime.now().isoformat()
                            sys.stderr.write(f"UAT: Objective completed: {definition['title']}\n")
                
                elif step_result.get('status') == 'failed':
                    # Step failed, mark objective as failed
                    obj_status['status'] = 'failed'
                    obj_status['endTime'] = datetime.now().isoformat()
                    if step_result.get('error'):
                        obj_status['failedCriteria'].append(f"Step '{step_action}' failed: {step_result['error']}")
                    sys.stderr.write(f"UAT: Objective failed: {definition['title']}\n")
        
        # Update objectives summary
        self.update_objectives_summary(objectives_data)
        
        # Save updated objectives data
        self.manager.update_session({'objectives': objectives_data})
    
    def update_objectives_summary(self, objectives_data):
        """Update objectives summary statistics"""
        status = objectives_data.get('status', {})
        summary = objectives_data.get('summary', {})
        
        # Count objectives by status
        summary['total'] = len(status)
        summary['completed'] = len([s for s in status.values() if s['status'] == 'completed'])
        summary['failed'] = len([s for s in status.values() if s['status'] == 'failed'])
        summary['in_progress'] = len([s for s in status.values() if s['status'] == 'in_progress'])
        summary['pending'] = len([s for s in status.values() if s['status'] == 'pending'])
        summary['blocked'] = len([s for s in status.values() if s['status'] == 'blocked'])
        
        # Calculate success rate
        if summary['total'] > 0:
            summary['successRate'] = int((summary['completed'] / summary['total']) * 100)
        else:
            summary['successRate'] = 0
    
    def get_step_action_from_tool(self, tool_name, tool_input):
        """Map tool calls to step actions for objective tracking"""
        action_mapping = {
            'browser-navigate': 'navigate',
            'browser-click': 'click', 
            'browser-fill': 'fill',
            'browser-screenshot': 'screenshot',
            'uat-init': 'init',
            'uat-login': 'login',
            'uat-scenario': 'scenario'
        }
        
        # First try direct mapping
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            if 'uat-test-runner' in command:
                if 'login' in command:
                    return 'login'
                elif 'scenario' in command:
                    return 'scenario'
                elif 'init' in command:
                    return 'init'
                elif 'crud' in command:
                    return 'crud'
        
        # Browser action mapping
        elif 'navigate' in tool_name:
            return 'navigate'
        elif 'click' in tool_name:
            return 'click'
        elif 'fill' in tool_name:
            return 'fill'
        elif 'screenshot' in tool_name:
            return 'screenshot'
            
        # For verify_state actions, check for health check patterns
        if 'verify_state' in str(tool_input) or 'healthCheck' in str(tool_input):
            return 'verify_state'
            
        return 'unknown'
        
    def extract_uat_result(self, output):
        """Extract UAT-specific results from tool output"""
        results = {
            'hasError': False,
            'errorMessage': None,
            'screenshots': [],
            'metrics': {}
        }
        
        if not output:
            return results
            
        # Check for errors
        error_patterns = [
            r'❌\s*(.+)',
            r'Error:\s*(.+)',
            r'Failed:\s*(.+)',
            r'UAT_RESULT:.*exited with code (\d+)'
        ]
        
        for pattern in error_patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                results['hasError'] = True
                results['errorMessage'] = match.group(1)
                break
                
        # Extract screenshots
        screenshot_pattern = r'Screenshot.*saved.*[:\s]+(.+\.png)'
        for match in re.finditer(screenshot_pattern, output, re.IGNORECASE):
            results['screenshots'].append(match.group(1))
            
        # Extract success indicators
        success_patterns = [
            r'✅\s*(.+)',
            r'Success:\s*(.+)',
            r'Passed:\s*(.+)'
        ]
        
        results['successMessages'] = []
        for pattern in success_patterns:
            for match in re.finditer(pattern, output):
                results['successMessages'].append(match.group(1))
                
        return results
        
    def track_execution(self, input_data, session):
        """Track tool execution for UAT session"""
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_response = input_data.get('tool_response', {})
        
        # Create step record
        step = {
            'tool': tool_name,
            'action': 'unknown',
            'status': 'completed',
            'details': {}
        }
        
        # Determine action type
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            if 'screenshot' in command:
                step['action'] = 'screenshot'
            elif 'navigate' in command:
                step['action'] = 'navigate'
            elif 'uat-test-runner' in command:
                step['action'] = 'uat-command'
                # Extract specific UAT command
                if 'init' in command:
                    step['action'] = 'uat-init'
                elif 'login' in command:
                    step['action'] = 'uat-login'
                elif 'crud' in command:
                    step['action'] = 'uat-crud'
                elif 'scenario' in command:
                    step['action'] = 'uat-scenario'
                    
        elif 'navigate' in tool_name:
            step['action'] = 'browser-navigate'
            step['details']['url'] = tool_input.get('url', '')
            
        elif 'screenshot' in tool_name:
            step['action'] = 'browser-screenshot'
            step['details']['name'] = tool_input.get('name', '')
            
        elif 'click' in tool_name:
            step['action'] = 'browser-click'
            step['details']['selector'] = tool_input.get('selector', '')
            
        elif 'fill' in tool_name:
            step['action'] = 'browser-fill'
            step['details']['selector'] = tool_input.get('selector', '')
            step['details']['value'] = tool_input.get('value', '')
            
        # Extract results from tool response
        output_text = str(tool_response)
        results = self.extract_uat_result(output_text)
        
        # Update step status
        if results['hasError']:
            step['status'] = 'failed'
            step['error'] = results['errorMessage']
        else:
            step['status'] = 'completed'
            
        # Add success messages
        if results.get('successMessages'):
            step['details']['successes'] = results['successMessages']
            
        # Track screenshots
        if results['screenshots']:
            step['details']['screenshots'] = results['screenshots']
            # Add to session artifacts
            for screenshot in results['screenshots']:
                self.manager.update_session({
                    'artifacts': {
                        'screenshots': session['artifacts']['screenshots'] + [screenshot]
                    }
                })
                
        # Add step to session
        self.manager.add_step(step)
        
        # Update objective progress if session has objectives
        step_action = self.get_step_action_from_tool(tool_name, tool_input)
        if step_action != 'unknown':
            self.update_objective_progress(session, step_action, step)
        
        return step
        
    def process_hook(self):
        """Main hook processing logic following Claude Code hooks API"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            # Only process if UAT session is active
            session = self.manager.load_session()
            if session:
                # Track the execution
                step = self.track_execution(input_data, session)
                
                # Log progress to stderr
                sys.stderr.write(f"UAT Progress: {step['action']} - {step['status']}\n")
                
                # Update phase based on progress
                if step['action'] == 'uat-init' and step['status'] == 'completed':
                    self.manager.update_session({'phase': 'initialized'})
                elif step['action'] in ['browser-navigate', 'uat-login']:
                    self.manager.update_session({'phase': 'executing'})
                elif step['action'] in ['browser-screenshot', 'screenshot']:
                    self.manager.update_session({'phase': 'recording'})
                    
                # Check if all steps are complete
                metrics = session['metrics']
                if metrics['totalSteps'] > 0:
                    completion = metrics['completedSteps'] / metrics['totalSteps']
                    if completion >= 1.0:
                        self.manager.update_session({'phase': 'analyzing'})
            
            # PostToolUse hooks should exit with code 0 for success
            sys.exit(0)
            
        except Exception as e:
            # Log error to stderr
            sys.stderr.write(f"UAT Progress Tracker Error: {str(e)}\n")
            # Exit code 1 means non-blocking error
            sys.exit(1)

if __name__ == "__main__":
    tracker = UATProgressTracker()
    tracker.process_hook()