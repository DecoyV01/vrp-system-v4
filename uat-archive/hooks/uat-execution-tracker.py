#!/usr/bin/env python3
"""
UAT Progressive Execution Tracker - PreToolUse hook for sequential MCP execution
Tracks UAT execution progress and guides Claude through the next step only
"""

import json
import sys
import os
import importlib.util

# Import session manager
try:
    from uat_session_manager import UATSessionManager
except ImportError:
    spec = importlib.util.spec_from_file_location(
        "uat_session_manager", 
        os.path.join(os.path.dirname(__file__), "uat-session-manager.py")
    )
    uat_session_manager = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uat_session_manager)
    UATSessionManager = uat_session_manager.UATSessionManager

class UATExecutionTracker:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def load_execution_plan(self, session_id):
        """Load execution plan for current session"""
        try:
            session_dir = os.path.join(self.uat_root, 'sessions', session_id)
            plan_file = os.path.join(session_dir, 'execution-plan.json')
            
            if not os.path.exists(plan_file):
                return None
                
            with open(plan_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            sys.stderr.write(f"UAT Tracker: Failed to load execution plan: {str(e)}\n")
            return None
    
    def get_execution_progress(self, session):
        """Get current execution progress from session"""
        if not session:
            return None
            
        # Check if session has execution progress tracking
        progress = session.get('execution_progress', {})
        return {
            'current_step': progress.get('current_step', 1),
            'completed_steps': progress.get('completed_steps', []),
            'total_steps': progress.get('total_steps', 0),
            'last_executed_tool': progress.get('last_executed_tool', ''),
            'status': progress.get('status', 'ready')
        }
    
    def update_execution_progress(self, session_id, step_number, tool_name, status='completed'):
        """Update execution progress in session"""
        try:
            session = self.manager.load_session()
            if not session:
                return False
                
            # Initialize execution progress if not exists
            if 'execution_progress' not in session:
                session['execution_progress'] = {
                    'current_step': 1,
                    'completed_steps': [],
                    'total_steps': 0,
                    'last_executed_tool': '',
                    'status': 'ready'
                }
            
            progress = session['execution_progress']
            
            if status == 'completed':
                # Mark step as completed
                if step_number not in progress['completed_steps']:
                    progress['completed_steps'].append(step_number)
                progress['current_step'] = step_number + 1
                progress['last_executed_tool'] = tool_name
            elif status == 'in_progress':
                progress['last_executed_tool'] = tool_name
                progress['status'] = 'executing'
                
            # Save updated session
            self.manager.update_session({'execution_progress': progress})
            return True
            
        except Exception as e:
            sys.stderr.write(f"UAT Tracker: Failed to update progress: {str(e)}\n")
            return False
    
    def get_next_step_guidance(self, execution_plan, current_step):
        """Get guidance for the next step to execute"""
        try:
            if not execution_plan or not execution_plan.get('sequence'):
                return None
                
            # Find the next step to execute
            next_action = None
            for action in execution_plan['sequence']:
                if action['step'] == current_step:
                    next_action = action
                    break
                    
            if not next_action:
                return None
                
            # Generate next step guidance
            step_num = next_action['step']
            total_steps = execution_plan['total_actions']
            tool = next_action['tool']
            description = next_action['description']
            params = next_action['params']
            
            # Generate exact function call
            function_call = self.generate_function_call_syntax(tool, params)
            
            guidance = {
                'step_number': step_num,
                'total_steps': total_steps,
                'tool': tool,
                'description': description,
                'function_call': function_call,
                'params': params,
                'progress_percentage': round((step_num / total_steps) * 100, 1)
            }
            
            return guidance
            
        except Exception as e:
            sys.stderr.write(f"UAT Tracker: Error generating guidance: {str(e)}\n")
            return None
    
    def generate_function_call_syntax(self, tool, params):
        """Generate exact MCP function call syntax"""
        try:
            if not tool or not params:
                return f"# Invalid tool call: {tool}"
            
            # Build parameter string
            param_parts = []
            for key, value in params.items():
                if isinstance(value, str):
                    param_parts.append(f'{key}="{value}"')
                elif isinstance(value, bool):
                    param_parts.append(f'{key}={str(value).lower()}')
                elif isinstance(value, (int, float)):
                    param_parts.append(f'{key}={value}')
                elif isinstance(value, dict):
                    param_parts.append(f'{key}={json.dumps(value)}')
                else:
                    param_parts.append(f'{key}={repr(value)}')
            
            param_string = ', '.join(param_parts)
            return f"{tool}({param_string})"
            
        except Exception as e:
            return f"# Error generating function call for {tool}: {str(e)}"
    
    def is_mcp_tool_execution(self, tool_name):
        """Check if this is an MCP tool that should be tracked"""
        mcp_patterns = [
            'mcp__playwright__',
            'mcp__browsermcp__'
        ]
        
        if not tool_name:
            return False
            
        for pattern in mcp_patterns:
            if tool_name.startswith(pattern):
                return True
                
        return False
    
    def should_provide_guidance(self, tool_input):
        """Determine if we should provide execution guidance"""
        tool_name = tool_input.get('tool_name', '') if tool_input else ''
        
        # Only provide guidance for MCP tool execution
        return self.is_mcp_tool_execution(tool_name)
    
    def process_hook(self):
        """Main PreToolUse hook processing logic"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            tool_name = input_data.get('tool_name', '')
            tool_input = input_data.get('tool_input', {})
            
            # Only process if this is an MCP tool execution
            if not self.should_provide_guidance({'tool_name': tool_name}):
                # Not an MCP tool, exit normally
                sys.exit(0)
            
            # Check if there's an active UAT session
            session = self.manager.load_session()
            if not session:
                # No active UAT session, exit normally
                sys.exit(0)
            
            # Check if session has an execution plan
            execution_plan = self.load_execution_plan(session['sessionId'])
            if not execution_plan:
                # No execution plan, exit normally
                sys.exit(0)
                
            # Get current progress
            progress = self.get_execution_progress(session)
            if not progress:
                # Initialize progress tracking
                progress = {
                    'current_step': 1,
                    'completed_steps': [],
                    'total_steps': execution_plan['total_actions'],
                    'last_executed_tool': '',
                    'status': 'ready'
                }
                self.update_execution_progress(session['sessionId'], 0, '', 'in_progress')
            
            # Check if all steps are completed
            if progress['current_step'] > execution_plan['total_actions']:
                print("\n" + "🎉 " + "="*50)
                print("UAT EXECUTION COMPLETE!")
                print("="*52)
                print(f"✅ All {execution_plan['total_actions']} steps executed successfully")
                print(f"📊 Session: {session['sessionId']}")
                print(f"🏆 100% scenario coverage achieved!")
                print("="*52 + "\n")
                sys.stderr.write(f"UAT Tracker: All steps completed for session {session['sessionId']}\n")
                sys.exit(0)
            
            # Get guidance for next step
            next_guidance = self.get_next_step_guidance(execution_plan, progress['current_step'])
            if not next_guidance:
                sys.stderr.write("UAT Tracker: Could not generate next step guidance\n")
                sys.exit(0)
            
            # Check if the current tool matches the expected next step
            expected_tool = next_guidance['tool']
            if tool_name == expected_tool:
                # Tool matches, update progress and allow execution
                self.update_execution_progress(
                    session['sessionId'], 
                    next_guidance['step_number'], 
                    tool_name, 
                    'in_progress'
                )
                sys.stderr.write(f"UAT Tracker: Executing step {next_guidance['step_number']}/{next_guidance['total_steps']}: {tool_name}\n")
            else:
                # Tool doesn't match, provide guidance for correct next step
                print("\n" + "⚠️ " + "="*50)
                print("UAT EXECUTION SEQUENCE GUIDANCE")
                print("="*52)
                print(f"📍 Current Progress: {progress['current_step']-1}/{next_guidance['total_steps']} steps completed")
                print(f"🎯 Next Required Step: {next_guidance['step_number']}/{next_guidance['total_steps']} ({next_guidance['progress_percentage']}%)")
                print("")
                print(f"**Expected Tool**: {expected_tool}")
                print(f"**Attempted Tool**: {tool_name}")
                print("")
                print("🔸 **EXECUTE THIS EXACT FUNCTION CALL NEXT:**")
                print("```")
                print(next_guidance['function_call'])
                print("```")
                print("")
                print(f"*Description*: {next_guidance['description']}")
                print("")
                print("⚡ **Please execute the expected tool above before proceeding**")
                print("="*52 + "\n")
                
                sys.stderr.write(f"UAT Tracker: Tool mismatch - expected {expected_tool}, got {tool_name}\n")
            
            # Exit normally to allow tool execution to proceed
            sys.exit(0)
            
        except Exception as e:
            sys.stderr.write(f"UAT Execution Tracker Error: {str(e)}\n")
            sys.exit(1)

if __name__ == "__main__":
    tracker = UATExecutionTracker()
    tracker.process_hook()