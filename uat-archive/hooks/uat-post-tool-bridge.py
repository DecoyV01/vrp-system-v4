#!/usr/bin/env python3
"""
UAT Post-Tool MCP Bridge - PostToolUse hook for structured MCP execution
Processes bash tool results to detect MCP requests and provide structured execution
"""

import json
import sys
import os
import importlib.util

# Import MCP bridge
try:
    from uat_mcp_bridge import UATMCPBridge
except ImportError:
    spec = importlib.util.spec_from_file_location(
        "uat_mcp_bridge", 
        os.path.join(os.path.dirname(__file__), "uat-mcp-bridge.py")
    )
    uat_mcp_bridge = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uat_mcp_bridge)
    UATMCPBridge = uat_mcp_bridge.UATMCPBridge

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

class UATPostToolBridge:
    def __init__(self):
        self.bridge = UATMCPBridge()
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def is_uat_test_runner_command(self, tool_input):
        """Check if this was a UAT test runner bash command"""
        if not tool_input:
            return False
            
        command = tool_input.get('command', '')
        
        # Check for UAT test runner patterns
        uat_patterns = [
            'uat-test-runner.cjs',
            'node.*uat.*scenario',
            'uat.*scenario.*login-flow',
            'uat.*scenario.*vehicle-crud', 
            'uat.*scenario.*error-handling'
        ]
        
        import re
        for pattern in uat_patterns:
            if re.search(pattern, command):
                return True
                
        return False
    
    def contains_mcp_requests(self, tool_result):
        """Check if tool result contains MCP execution requests"""
        if not tool_result:
            return False
            
        # Look for MCP request markers
        return ('=== UAT MCP EXECUTION REQUEST ===' in tool_result or 
                '=== UAT VALIDATION MCP REQUEST ===' in tool_result)
    
    def create_execution_guidance(self, bridge_result):
        """Create execution guidance for Claude Code"""
        if not bridge_result:
            return None
            
        execution_plan = bridge_result.get('execution_plan', {})
        instructions = bridge_result.get('instructions', '')
        session_id = bridge_result.get('session_id', '')
        
        guidance = {
            'type': 'uat_execution_guidance',
            'session_id': session_id,
            'total_actions': execution_plan.get('total_actions', 0),
            'mcp_actions': execution_plan.get('mcp_actions', 0),
            'validation_actions': execution_plan.get('validation_actions', 0),
            'instructions': instructions,
            'execution_mode': 'structured_sequential',
            'methodology': 'VERA (Verify, Execute, Record, Analyze)'
        }
        
        return guidance
    
    def save_execution_state(self, session_id, guidance):
        """Save execution state for tracking"""
        try:
            session_dir = os.path.join(self.uat_root, 'sessions', session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            state_file = os.path.join(session_dir, 'execution-state.json')
            with open(state_file, 'w') as f:
                json.dump({
                    'timestamp': guidance.get('timestamp', ''),
                    'total_actions': guidance.get('total_actions', 0),
                    'execution_mode': guidance.get('execution_mode', ''),
                    'methodology': guidance.get('methodology', ''),
                    'status': 'ready_for_execution'
                }, f, indent=2)
                
            return True
        except Exception as e:
            sys.stderr.write(f"Failed to save execution state: {str(e)}\n")
            return False
    
    def process_hook(self):
        """Main PostToolUse hook processing logic"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            # Check if this is a bash tool result
            tool_name = input_data.get('tool_name', '')
            if tool_name != 'Bash':
                # Not a bash command, exit normally
                sys.exit(0)
            
            # Get tool input and result
            tool_input = input_data.get('tool_input', {})
            tool_result = input_data.get('tool_result', '')
            
            # Check if this was a UAT test runner command
            if not self.is_uat_test_runner_command(tool_input):
                # Not a UAT command, exit normally
                sys.exit(0)
            
            # Check if result contains MCP requests
            if not self.contains_mcp_requests(tool_result):
                # No MCP requests found, exit normally
                sys.stderr.write("UAT PostTool Bridge: No MCP requests detected in output\n")
                sys.exit(0)
            
            # Load current session
            session = self.manager.load_session()
            if not session:
                sys.stderr.write("UAT PostTool Bridge: No active UAT session found\n")
                sys.exit(0)
            
            sys.stderr.write(f"UAT PostTool Bridge: Processing MCP requests for session {session['sessionId']}\n")
            
            # Use MCP bridge to process the output
            bridge_result = self.bridge.process_bash_output(input_data)
            
            if bridge_result:
                # Create execution guidance
                guidance = self.create_execution_guidance(bridge_result)
                
                if guidance:
                    # Save execution state
                    self.save_execution_state(session['sessionId'], guidance)
                    
                    # Update session phase
                    self.manager.update_session({'phase': 'mcp_execution_ready'})
                    
                    # Output structured execution guidance
                    print("\n" + "🚀 " + "="*50)
                    print("UAT STRUCTURED EXECUTION GUIDANCE")
                    print("="*52)
                    print(f"Session: {guidance['session_id']}")
                    print(f"Mode: {guidance['execution_mode']}")
                    print(f"Methodology: {guidance['methodology']}")
                    print(f"Total Actions: {guidance['total_actions']}")
                    print("")
                    print("⚡ **CRITICAL**: Execute the MCP tools in the exact sequence")
                    print("provided by the test runner. Do not skip steps or change order.")
                    print("")
                    print("📋 **NEXT STEPS**:")
                    print("1. Execute each MCP tool call in sequence")
                    print("2. Wait for completion before proceeding to next step")
                    print("3. Verify each step succeeds before continuing")
                    print("4. Follow the VERA methodology throughout")
                    print("")
                    print("🎯 **EXECUTION PLAN READY** - Begin MCP tool execution now")
                    print("="*52 + "\n")
                    
                    sys.stderr.write(f"UAT PostTool Bridge: Provided structured execution guidance\n")
                else:
                    sys.stderr.write("UAT PostTool Bridge: Failed to create execution guidance\n")
            else:
                sys.stderr.write("UAT PostTool Bridge: MCP bridge processing failed\n")
            
            # Exit successfully
            sys.exit(0)
            
        except Exception as e:
            sys.stderr.write(f"UAT PostTool Bridge Error: {str(e)}\n")
            sys.exit(1)

if __name__ == "__main__":
    bridge = UATPostToolBridge()
    bridge.process_hook()