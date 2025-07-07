#!/usr/bin/env python3
"""
UAT MCP Request Bridge - Converts test runner MCP requests to structured execution
Bridges the gap between test runner console output and Claude Code MCP tool execution
"""

import json
import sys
import os
import re
import importlib.util
from datetime import datetime

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

class UATMCPBridge:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def extract_mcp_requests_from_output(self, bash_output):
        """Extract MCP requests from test runner console output"""
        mcp_requests = []
        
        # Pattern to match UAT MCP EXECUTION REQUEST blocks
        pattern = r'=== UAT MCP EXECUTION REQUEST ===\n(.*?)\n=== END UAT MCP REQUEST ==='
        matches = re.findall(pattern, bash_output, re.DOTALL)
        
        for match in matches:
            try:
                # Parse the JSON content
                mcp_data = json.loads(match.strip())
                if mcp_data.get('type') == 'UAT_MCP_EXECUTION_REQUEST':
                    mcp_requests.append(mcp_data)
            except json.JSONDecodeError:
                continue
                
        return mcp_requests
    
    def extract_validation_requests_from_output(self, bash_output):
        """Extract validation requests from test runner console output"""
        validation_requests = []
        
        # Pattern to match UAT VALIDATION MCP REQUEST blocks
        pattern = r'=== UAT VALIDATION MCP REQUEST ===\n(.*?)\n=== END VALIDATION MCP REQUEST ==='
        matches = re.findall(pattern, bash_output, re.DOTALL)
        
        for match in matches:
            try:
                # Parse the JSON content
                validation_data = json.loads(match.strip())
                if validation_data.get('type') == 'UAT_VALIDATION_MCP_REQUEST':
                    validation_requests.append(validation_data)
            except json.JSONDecodeError:
                continue
                
        return validation_requests
    
    def create_structured_execution_plan(self, mcp_requests, validation_requests):
        """Create a structured execution plan from MCP and validation requests"""
        execution_plan = {
            'type': 'UAT_STRUCTURED_EXECUTION_PLAN',
            'timestamp': datetime.now().isoformat(),
            'mcp_actions': len(mcp_requests),
            'validation_actions': len(validation_requests),
            'total_actions': len(mcp_requests) + len(validation_requests),
            'sequence': []
        }
        
        # Combine and sequence MCP and validation requests
        # MCP requests typically come first, followed by validations
        sequence_number = 1
        
        for mcp_request in mcp_requests:
            execution_plan['sequence'].append({
                'step': sequence_number,
                'type': 'mcp_execution',
                'tool': mcp_request.get('tool', ''),
                'params': mcp_request.get('params', {}),
                'description': mcp_request.get('description', ''),
                'session_id': mcp_request.get('sessionId', ''),
                'timestamp': mcp_request.get('timestamp', ''),
                'status': 'pending'
            })
            sequence_number += 1
            
        for validation_request in validation_requests:
            execution_plan['sequence'].append({
                'step': sequence_number,
                'type': 'validation_execution',
                'tool': validation_request.get('tool', ''),
                'params': validation_request.get('params', {}),
                'description': validation_request.get('description', ''),
                'session_id': validation_request.get('sessionId', ''),
                'timestamp': validation_request.get('timestamp', ''),
                'status': 'pending'
            })
            sequence_number += 1
            
        return execution_plan
    
    def generate_execution_instructions(self, execution_plan):
        """Generate step-by-step execution instructions for Claude Code with exact function calls"""
        instructions = []
        
        instructions.append("🎯 **UAT STRUCTURED EXECUTION DETECTED**")
        instructions.append(f"Total Actions: {execution_plan['total_actions']}")
        instructions.append("")
        instructions.append("🚀 **EXECUTE THESE EXACT FUNCTION CALLS IN SEQUENCE:**")
        instructions.append("📋 Copy and paste each function call exactly as shown")
        instructions.append("")
        
        for action in execution_plan['sequence']:
            step_num = action['step']
            action_type = action['type']
            tool = action['tool']
            description = action['description']
            params = action['params']
            
            instructions.append(f"**🔸 Step {step_num}/{execution_plan['total_actions']}: {description}**")
            
            if action_type == 'mcp_execution':
                # Generate exact function call syntax
                function_call = self.generate_function_call_syntax(tool, params)
                instructions.append(f"```")
                instructions.append(function_call)
                instructions.append(f"```")
                
                # Add parameter breakdown for clarity
                if params:
                    instructions.append("*Parameters:*")
                    for key, value in params.items():
                        if isinstance(value, str):
                            instructions.append(f"- {key}: \"{value}\"")
                        else:
                            instructions.append(f"- {key}: {value}")
            else:
                # For validation requests, also show exact function call
                function_call = self.generate_function_call_syntax(tool, params)
                instructions.append(f"```")
                instructions.append(function_call)
                instructions.append(f"```")
                instructions.append(f"*Validation*: {description}")
            
            instructions.append("")
        
        instructions.append("🔄 **CRITICAL EXECUTION RULES:**")
        instructions.append("1. Execute ONLY the next step shown")
        instructions.append("2. Copy the exact function call from the code block")
        instructions.append("3. Wait for completion before proceeding to next step")
        instructions.append("4. Do not skip steps or change the order")
        instructions.append("5. Verify each step succeeds before continuing")
        instructions.append("")
        instructions.append("📊 **PROGRESS TRACKING**: Execute all steps to achieve 100% scenario coverage")
        
        return "\n".join(instructions)
    
    def generate_function_call_syntax(self, tool, params):
        """Generate exact MCP function call syntax that Claude can copy and execute"""
        try:
            # Handle different MCP tool patterns
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
                    # For complex objects, use JSON representation
                    param_parts.append(f'{key}={json.dumps(value)}')
                else:
                    param_parts.append(f'{key}={repr(value)}')
            
            param_string = ', '.join(param_parts)
            
            # Generate the actual function call
            return f"{tool}({param_string})"
            
        except Exception as e:
            return f"# Error generating function call for {tool}: {str(e)}"
    
    def save_execution_plan(self, execution_plan, session_id):
        """Save execution plan to session directory for tracking"""
        try:
            session_dir = os.path.join(self.uat_root, 'sessions', session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            plan_file = os.path.join(session_dir, 'execution-plan.json')
            with open(plan_file, 'w') as f:
                json.dump(execution_plan, f, indent=2)
                
            return True
        except Exception as e:
            sys.stderr.write(f"Failed to save execution plan: {str(e)}\n")
            return False
    
    def process_bash_output(self, input_data):
        """Process bash tool output to extract and structure MCP requests"""
        try:
            # Check if this is a bash tool with output containing MCP requests
            tool_name = input_data.get('tool_name', '')
            if tool_name != 'Bash':
                return None
                
            # Get bash output/result 
            tool_result = input_data.get('tool_result', '')
            if not tool_result:
                return None
            
            # Extract MCP requests from output
            mcp_requests = self.extract_mcp_requests_from_output(tool_result)
            validation_requests = self.extract_validation_requests_from_output(tool_result)
            
            if not mcp_requests and not validation_requests:
                return None
            
            # Load current session
            session = self.manager.load_session()
            if not session:
                sys.stderr.write("No active UAT session found for MCP bridge processing\n")
                return None
            
            # Create structured execution plan
            execution_plan = self.create_structured_execution_plan(mcp_requests, validation_requests)
            
            # Save execution plan
            if self.save_execution_plan(execution_plan, session['sessionId']):
                sys.stderr.write(f"UAT MCP Bridge: Created execution plan with {execution_plan['total_actions']} actions\n")
            
            # Generate execution instructions
            instructions = self.generate_execution_instructions(execution_plan)
            
            return {
                'type': 'uat_structured_execution',
                'execution_plan': execution_plan,
                'instructions': instructions,
                'session_id': session['sessionId']
            }
            
        except Exception as e:
            sys.stderr.write(f"UAT MCP Bridge Error: {str(e)}\n")
            return None

def main():
    """Main entry point for hook execution"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create bridge instance
        bridge = UATMCPBridge()
        
        # Process the input
        result = bridge.process_bash_output(input_data)
        
        if result:
            # Output structured execution instructions
            print("\n" + "="*60)
            print("UAT MCP BRIDGE - STRUCTURED EXECUTION REQUIRED")
            print("="*60)
            print(result['instructions'])
            print("="*60 + "\n")
            
            sys.stderr.write(f"UAT MCP Bridge: Generated structured execution plan\n")
        
        # Exit successfully
        sys.exit(0)
        
    except Exception as e:
        sys.stderr.write(f"UAT MCP Bridge Fatal Error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()