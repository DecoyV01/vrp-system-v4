#!/usr/bin/env python3
"""
UAT Completion Tracker - PostToolUse hook for tracking MCP tool completion
Marks steps as completed when MCP tools execute successfully
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

class UATCompletionTracker:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
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
            sys.stderr.write(f"UAT Completion Tracker: Failed to load execution plan: {str(e)}\n")
            return None
    
    def find_step_for_tool(self, execution_plan, tool_name, tool_params):
        """Find the step number for the executed tool"""
        try:
            if not execution_plan or not execution_plan.get('sequence'):
                return None
                
            # Find matching step based on tool name and parameters
            for action in execution_plan['sequence']:
                if action['tool'] == tool_name:
                    # For now, match by tool name
                    # Could enhance to match parameters for more precision
                    return action['step']
                    
            return None
            
        except Exception as e:
            sys.stderr.write(f"UAT Completion Tracker: Error finding step: {str(e)}\n")
            return None
    
    def update_execution_progress(self, session_id, step_number, tool_name):
        """Update execution progress to mark step as completed"""
        try:
            session = self.manager.load_session()
            if not session:
                return False
                
            # Get current execution progress
            progress = session.get('execution_progress', {})
            
            # Mark step as completed
            if step_number and step_number not in progress.get('completed_steps', []):
                if 'completed_steps' not in progress:
                    progress['completed_steps'] = []
                progress['completed_steps'].append(step_number)
                progress['last_executed_tool'] = tool_name
                progress['status'] = 'executing'
                
                # Update current step to next step
                if step_number >= progress.get('current_step', 1):
                    progress['current_step'] = step_number + 1
                
                # Save updated session
                self.manager.update_session({'execution_progress': progress})
                
                sys.stderr.write(f"UAT Completion Tracker: Marked step {step_number} as completed ({tool_name})\n")
                return True
                
        except Exception as e:
            sys.stderr.write(f"UAT Completion Tracker: Failed to update progress: {str(e)}\n")
            return False
    
    def get_completion_percentage(self, session):
        """Calculate completion percentage"""
        try:
            progress = session.get('execution_progress', {})
            completed = len(progress.get('completed_steps', []))
            total = progress.get('total_steps', 0)
            
            if total > 0:
                return round((completed / total) * 100, 1)
            return 0.0
            
        except Exception:
            return 0.0
    
    def process_hook(self):
        """Main PostToolUse hook processing logic"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            tool_name = input_data.get('tool_name', '')
            tool_input = input_data.get('tool_input', {})
            tool_result = input_data.get('tool_result', '')
            
            # Only process MCP tool executions
            if not self.is_mcp_tool_execution(tool_name):
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
            
            # Find which step this tool corresponds to
            step_number = self.find_step_for_tool(execution_plan, tool_name, tool_input)
            if not step_number:
                sys.stderr.write(f"UAT Completion Tracker: Could not find step for tool {tool_name}\n")
                sys.exit(0)
            
            # Update execution progress
            self.update_execution_progress(session['sessionId'], step_number, tool_name)
            
            # Get updated progress for reporting
            updated_session = self.manager.load_session()
            if updated_session:
                progress = updated_session.get('execution_progress', {})
                completed_steps = len(progress.get('completed_steps', []))
                total_steps = execution_plan['total_actions']
                completion_pct = self.get_completion_percentage(updated_session)
                
                # Provide progress feedback
                print(f"\n✅ **UAT Step Completed**: {step_number}/{total_steps} ({completion_pct}%)")
                
                # Check if this was the final step
                if completed_steps >= total_steps:
                    print("🎉 **ALL UAT STEPS COMPLETED!** 100% scenario coverage achieved!")
                    self.manager.update_session({
                        'execution_progress': {**progress, 'status': 'completed'},
                        'phase': 'completed'
                    })
                else:
                    remaining = total_steps - completed_steps
                    print(f"📋 **Next**: Execute step {step_number + 1}/{total_steps} ({remaining} steps remaining)")
                
                print("")
            
            # Exit successfully
            sys.exit(0)
            
        except Exception as e:
            sys.stderr.write(f"UAT Completion Tracker Error: {str(e)}\n")
            sys.exit(1)

if __name__ == "__main__":
    tracker = UATCompletionTracker()
    tracker.process_hook()