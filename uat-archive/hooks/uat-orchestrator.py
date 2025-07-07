#!/usr/bin/env python3
"""
UAT Orchestrator - PreToolUse hook for Claude Code
Intercepts tool calls and enhances them for UAT testing
"""

import json
import sys
import os
import re
import importlib.util

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import with proper module name handling
try:
    from uat_session_manager import UATSessionManager
except ImportError:
    # Handle hyphenated module name
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "uat_session_manager", 
        os.path.join(os.path.dirname(__file__), "uat-session-manager.py")
    )
    uat_session_manager = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uat_session_manager)
    UATSessionManager = uat_session_manager.UATSessionManager

class UATOrchestrator:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def load_scenario_objectives(self, scenario_name):
        """Load objectives from scenario file"""
        if not scenario_name or scenario_name == 'general-test':
            return []
            
        scenario_path = os.path.join(self.uat_root, 'scenarios', f'{scenario_name}.cjs')
        if not os.path.exists(scenario_path):
            return []
            
        try:
            # Read scenario file content
            with open(scenario_path, 'r') as f:
                content = f.read()
            
            # Extract objectives using simple parsing (avoid executing JS)
            objectives = []
            
            # Look for objectives array in the module.exports
            if 'objectives:' in content or 'objectives =' in content:
                # Find the objectives array definition
                objectives_start = -1
                for i, line in enumerate(content.split('\n')):
                    if 'objectives:' in line or 'objectives =' in line:
                        objectives_start = i
                        break
                
                if objectives_start >= 0:
                    lines = content.split('\n')
                    # Parse objectives array manually (simple bracket counting)
                    bracket_count = 0
                    in_objectives = False
                    current_objective = {}
                    current_field = None
                    
                    for i in range(objectives_start, len(lines)):
                        line = lines[i].strip()
                        
                        if '[' in line and not in_objectives:
                            in_objectives = True
                            bracket_count = line.count('[') - line.count(']')
                            continue
                            
                        if not in_objectives:
                            continue
                            
                        # Track bracket depth
                        bracket_count += line.count('[') - line.count(']')
                        bracket_count += line.count('{') - line.count('}')
                        
                        if bracket_count <= 0:
                            # End of objectives array
                            if current_objective and current_objective.get('id'):
                                objectives.append(current_objective)
                            break
                            
                        # Parse objective fields
                        if 'id:' in line:
                            if current_objective and current_objective.get('id'):
                                objectives.append(current_objective)
                            current_objective = {}
                            current_objective['id'] = self._extract_quoted_value(line)
                        elif 'title:' in line:
                            current_objective['title'] = self._extract_quoted_value(line)
                        elif 'category:' in line:
                            current_objective['category'] = self._extract_quoted_value(line)
                        elif 'priority:' in line:
                            current_objective['priority'] = self._extract_quoted_value(line)
                        elif 'description:' in line:
                            current_objective['description'] = self._extract_quoted_value(line)
                        elif 'steps:' in line:
                            current_objective['steps'] = self._extract_array_value(line)
                        elif 'dependencies:' in line:
                            current_objective['dependencies'] = self._extract_array_value(line)
                        elif 'acceptance_criteria:' in line:
                            # This is an array that might span multiple lines
                            current_field = 'acceptance_criteria'
                            current_objective['acceptance_criteria'] = []
                        elif current_field == 'acceptance_criteria' and '"' in line:
                            criterion = self._extract_quoted_value(line)
                            if criterion:
                                current_objective['acceptance_criteria'].append(criterion)
                        elif ']' in line and current_field == 'acceptance_criteria':
                            current_field = None
                    
                    # Add final objective if exists
                    if current_objective and current_objective.get('id'):
                        objectives.append(current_objective)
            
            sys.stderr.write(f"UAT: Loaded {len(objectives)} objectives from {scenario_name}\n")
            return objectives
            
        except Exception as e:
            sys.stderr.write(f"UAT: Failed to load objectives from {scenario_name}: {str(e)}\n")
            return []
    
    def _extract_quoted_value(self, line):
        """Extract quoted string value from a line"""
        import re
        match = re.search(r'["\']([^"\']*)["\']', line)
        return match.group(1) if match else None
    
    def _extract_array_value(self, line):
        """Extract array values from a line like steps: ["step1", "step2"]"""
        import re
        # Find content between brackets
        match = re.search(r'\[(.*?)\]', line)
        if match:
            content = match.group(1)
            # Extract quoted strings
            items = re.findall(r'["\']([^"\']*)["\']', content)
            return items
        return []
    
    def initialize_objective_tracking(self, session, objectives):
        """Initialize objective tracking in session state"""
        if not objectives:
            return
            
        objective_status = {}
        for objective in objectives:
            objective_status[objective['id']] = {
                'id': objective['id'],
                'title': objective['title'],
                'status': 'pending',  # pending, in_progress, completed, failed, blocked
                'progress': 0,
                'startTime': None,
                'endTime': None,
                'failedCriteria': [],
                'completedSteps': [],
                'totalSteps': len(objective.get('steps', []))
            }
        
        # Update session with objectives data
        session_update = {
            'objectives': {
                'definitions': objectives,
                'status': objective_status,
                'summary': {
                    'total': len(objectives),
                    'completed': 0,
                    'failed': 0,
                    'in_progress': 0,
                    'pending': len(objectives),
                    'blocked': 0,
                    'successRate': 0
                }
            }
        }
        
        self.manager.update_session(session_update)
        sys.stderr.write(f"UAT: Initialized tracking for {len(objectives)} objectives\n")
        
    def should_init_uat(self, input_data):
        """
        Check if this tool call should initialize UAT
        Looks for UAT commands in Bash tool calls or checks for UAT intent signal
        """
        # First check if there's a UAT context file (set by Stop hook)
        uat_context_file = os.path.join(self.uat_root, '.uat_context')
        if os.path.exists(uat_context_file):
            try:
                with open(uat_context_file, 'r') as f:
                    context_data = json.loads(f.read())
                    # Remove the context file after reading
                    os.remove(uat_context_file)
                    return True, context_data.get('scenario', 'general-test')
            except:
                # If file exists but can't read, remove it
                try:
                    os.remove(uat_context_file)
                except:
                    pass
        
        # Also check for legacy intent file
        uat_intent_file = os.path.join(self.uat_root, '.uat_intent')
        if os.path.exists(uat_intent_file):
            try:
                with open(uat_intent_file, 'r') as f:
                    intent_data = json.loads(f.read())
                    # Remove the intent file after reading
                    os.remove(uat_intent_file)
                    return True, intent_data.get('scenario', 'general-test')
            except:
                # If file exists but can't read, remove it
                try:
                    os.remove(uat_intent_file)
                except:
                    pass
        
        # Check if UAT is already active via environment
        if os.environ.get('UAT_SESSION_ID'):
            return False, None  # Already active, don't re-init
        
        # Fallback: Check Bash commands for UAT intent
        if input_data.get('tool_name') != 'Bash':
            return False, None
            
        tool_input = input_data.get('tool_input', {})
        command = tool_input.get('command', '')
        description = tool_input.get('description', '')
        
        # Check command and description for UAT intent
        combined_text = f"{command} {description}".lower()
        
        # Look for UAT-specific commands
        uat_commands = [
            'uat-test-runner',
            'node.*uat.*test',
            'uat.*scenario',
            'uat.*login',
            'uat.*crud',
            'uat.*init'
        ]
        
        for pattern in uat_commands:
            if re.search(pattern, combined_text):
                # Extract scenario from command if possible
                scenario_match = re.search(r'scenario\s+(\S+)', combined_text)
                if scenario_match:
                    scenario = scenario_match.group(1)
                    return True, scenario
                    
                # Check for specific test types
                if 'login' in combined_text:
                    return True, 'login-flow'
                elif 'vehicle' in combined_text or 'crud' in combined_text:
                    return True, 'vehicle-crud'
                elif 'error' in combined_text:
                    return True, 'error-handling'
                    
                return True, None
                
        return False, None
        
    def enhance_bash_command(self, input_data, session):
        """Enhance Bash commands for UAT execution"""
        tool_input = input_data.get('tool_input', {})
        command = tool_input.get('command', '')
        
        # If running UAT command, ensure proper environment
        if 'uat-test-runner' in command or 'uat' in command:
            # Add session tracking
            enhanced_command = f"""
# UAT Session: {session['sessionId']}
export UAT_SESSION_ID="{session['sessionId']}"
export UAT_SCENARIO="{session['scenario']}"
export UAT_PHASE="{session['phase']}"

# Original command
{command}

# Capture exit code
UAT_EXIT_CODE=$?

# Log command result
echo "UAT_RESULT: Command exited with code $UAT_EXIT_CODE"
exit $UAT_EXIT_CODE
"""
            # Output enhanced command data via stdout (hook standard)
            enhanced_data = input_data.copy()
            enhanced_data['tool_input'] = tool_input.copy()
            enhanced_data['tool_input']['command'] = enhanced_command.strip()
            
            # Return enhanced data for logging
            return enhanced_data
            
        return input_data
        
    def enhance_mcp_command(self, input_data, session):
        """Enhance Browser MCP and Playwright MCP commands for UAT"""
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Add UAT-specific parameters for browser automation
        if 'navigate' in tool_name:
            # Ensure proper timeout for UAT
            if 'timeout' not in tool_input:
                tool_input['timeout'] = 30000
                
        elif 'screenshot' in tool_name:
            # Ensure screenshots are saved to UAT directory
            if 'downloadsDir' not in tool_input:
                screenshots_dir = os.path.join(
                    self.uat_root, 
                    'screenshots',
                    session['sessionId']
                )
                # Ensure directory exists
                os.makedirs(screenshots_dir, exist_ok=True)
                tool_input['downloadsDir'] = screenshots_dir
                
            # Add session prefix to screenshot name
            if 'name' in tool_input:
                tool_input['name'] = f"{session['sessionId']}-{tool_input['name']}"
                
        # Set UAT environment variables for the command context
        os.environ['UAT_SESSION_ID'] = session['sessionId']
        os.environ['UAT_SCENARIO'] = session['scenario']
        os.environ['UAT_PHASE'] = session['phase']
                
        return input_data
        
    def should_execute_mcp_tools(self, input_data):
        """Check if this bash command contains UAT MCP requests"""
        tool_name = input_data.get('tool_name', '')
        if tool_name != 'Bash':
            return False
            
        tool_input = input_data.get('tool_input', {})
        command = tool_input.get('command', '')
        
        # Check for UAT scenario execution commands
        uat_patterns = [
            'uat-test-runner.cjs scenario',
            'node.*uat.*scenario',
            'UAT_MCP_REQUEST',
            'MCP Navigation',
            'MCP Click', 
            'MCP Fill',
            'MCP Screenshot'
        ]
        
        for pattern in uat_patterns:
            if pattern in command:
                return True
                
        return False
        
    def execute_uat_scenario(self, input_data, session):
        """Execute UAT scenario through proper test runner instead of hardcoded sequences"""
        try:
            tool_input = input_data.get('tool_input', {})
            command = tool_input.get('command', '')
            
            # Check if this is a UAT scenario execution command
            if 'scenario login-flow' in command:
                sys.stderr.write(f"UAT: Ensuring login-flow scenario executes through proper test runner\n")
                
                # Instead of hardcoded sequences, ensure the UAT test runner is called
                # The command should be: node uat-test-runner.cjs scenario login-flow
                if 'uat-test-runner.cjs scenario login-flow' in command:
                    sys.stderr.write(f"UAT: Proper test runner command detected - allowing execution\n")
                    # Let the command execute normally to run the structured scenario
                    return True
                else:
                    sys.stderr.write(f"UAT: Command should be 'node uat-test-runner.cjs scenario login-flow'\n")
                    return False
                    
            return True
                
        except Exception as e:
            sys.stderr.write(f"UAT Scenario Execution Error: {str(e)}\n")
            return False
        
    def process_hook(self):
        """Main hook processing logic following Claude Code hooks API"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            # Load current session
            session = self.manager.load_session()
            
            # If no session, check if we should start one
            if not session:
                should_init, scenario = self.should_init_uat(input_data)
                if should_init:
                    # Initialize UAT session
                    if not scenario:
                        scenario = 'general-test'
                    session = self.manager.init_session(scenario)
                    
                    # Load and initialize objectives for this scenario
                    objectives = self.load_scenario_objectives(scenario)
                    if objectives:
                        self.initialize_objective_tracking(session, objectives)
                        # Reload session to get updated data
                        session = self.manager.load_session()
                    
                    # Log initialization to stderr
                    sys.stderr.write(f"UAT Session Initialized: {session['sessionId']}\n")
                    sys.stderr.write(f"Scenario: {scenario}\n")
                    if objectives:
                        sys.stderr.write(f"Objectives: {len(objectives)} loaded and initialized\n")
                    
                    # Set environment variables for subsequent tools
                    os.environ['UAT_SESSION_ID'] = session['sessionId']
                    os.environ['UAT_SCENARIO'] = session['scenario']
                    os.environ['UAT_PHASE'] = session['phase']
            
            # If UAT session is active, enhance the command
            if session:
                tool_name = input_data.get('tool_name', '')
                tool_input = input_data.get('tool_input', {})
                
                if tool_name == 'Bash':
                    enhanced_data = self.enhance_bash_command(input_data, session)
                    # Log enhancement for debugging
                    sys.stderr.write(f"UAT Enhanced Bash command for session {session['sessionId']}\n")
                    
                elif tool_name.startswith('mcp__browsermcp__') or tool_name.startswith('mcp__playwright__'):
                    self.enhance_mcp_command(input_data, session)
                    # Log enhancement for debugging
                    sys.stderr.write(f"UAT Enhanced MCP tool {tool_name} for session {session['sessionId']}\n")
                    
                # Update session phase based on tool
                if 'init' in tool_input.get('command', '') or 'init' in tool_name:
                    self.manager.update_session({'phase': 'initialization'})
                elif 'navigate' in tool_name:
                    self.manager.update_session({'phase': 'execution'})
                elif 'screenshot' in tool_name:
                    self.manager.update_session({'phase': 'recording'})
            
            # Check if this is a UAT scenario execution that needs proper routing
            if session and self.should_execute_mcp_tools(input_data):
                # Ensure UAT scenarios execute through proper test runner
                scenario_valid = self.execute_uat_scenario(input_data, session)
                if not scenario_valid:
                    sys.stderr.write(f"UAT: Invalid scenario command - should use structured test runner\n")
            
            # For PreToolUse hooks, we don't modify the input - just enhance environment
            # Exit code 0 means continue normally
            sys.exit(0)
            
        except Exception as e:
            # Log error to stderr
            sys.stderr.write(f"UAT Orchestrator Error: {str(e)}\n")
            # Exit code 1 means non-blocking error
            sys.exit(1)

if __name__ == "__main__":
    orchestrator = UATOrchestrator()
    orchestrator.process_hook()