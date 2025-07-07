#!/usr/bin/env python3
"""
UAT Finalizer - Stop hook for Claude Code
Generates reports and finalizes UAT sessions
"""

import json
import sys
import os
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

class UATFinalizer:
    def __init__(self):
        self.manager = UATSessionManager()
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        
    def generate_report(self, session):
        """Generate comprehensive UAT report"""
        report = {
            'sessionId': session['sessionId'],
            'scenario': session['scenario'],
            'startTime': session['startTime'],
            'endTime': session['endTime'],
            'duration': session['metrics']['duration'],
            'summary': {
                'totalSteps': session['metrics']['totalSteps'],
                'completedSteps': session['metrics']['completedSteps'],
                'failedSteps': session['metrics']['failedSteps'],
                'successRate': 0
            },
            'phases': self.extract_phases(session),
            'artifacts': session['artifacts'],
            'steps': session['steps']
        }
        
        # Include objectives data if available
        if 'objectives' in session:
            report['objectives'] = session['objectives']
        
        # Calculate success rate
        if report['summary']['totalSteps'] > 0:
            report['summary']['successRate'] = (
                report['summary']['completedSteps'] / 
                report['summary']['totalSteps'] * 100
            )
            
        # Save report
        report_dir = os.path.join(self.uat_root, 'reports')
        os.makedirs(report_dir, exist_ok=True)
        
        report_file = os.path.join(
            report_dir,
            f"uat-report-{session['sessionId']}.json"
        )
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        return report_file
        
    def extract_phases(self, session):
        """Extract VERA phases from session steps"""
        phases = {
            'verify': {'steps': 0, 'passed': 0},
            'execute': {'steps': 0, 'passed': 0},
            'record': {'steps': 0, 'passed': 0},
            'analyze': {'steps': 0, 'passed': 0}
        }
        
        for step in session['steps']:
            phase = step.get('phase', 'unknown')
            action = step.get('action', '')
            
            # Map actions to VERA phases
            if 'init' in action or phase == 'initialization':
                vera_phase = 'verify'
            elif 'navigate' in action or 'click' in action or 'fill' in action:
                vera_phase = 'execute'
            elif 'screenshot' in action or phase == 'recording':
                vera_phase = 'record'
            else:
                vera_phase = 'analyze'
                
            phases[vera_phase]['steps'] += 1
            if step.get('status') == 'completed':
                phases[vera_phase]['passed'] += 1
                
        return phases
        
    def create_summary_report(self, session, report_file):
        """Create human-readable summary report"""
        summary_lines = [
            "=" * 70,
            f"UAT Test Summary - Session {session['sessionId']}",
            "=" * 70,
            "",
            f"Scenario: {session['scenario']}",
            f"Start Time: {session['startTime']}",
            f"End Time: {session['endTime']}",
            f"Duration: {session['metrics']['duration']:.2f} seconds",
            ""
        ]
        
        # Add objectives summary if available
        if 'objectives' in session:
            objectives_summary = session['objectives']['summary']
            summary_lines.extend([
                "Objectives Achievement:",
                f"  Total Objectives: {objectives_summary['total']}",
                f"  Completed: {objectives_summary['completed']} ✅",
                f"  Failed: {objectives_summary['failed']} ❌",
                f"  In Progress: {objectives_summary['in_progress']} 🔄",
                f"  Pending: {objectives_summary['pending']} ⏳",
                f"  Success Rate: {objectives_summary['successRate']}%",
                ""
            ])
            
            # Add individual objectives status
            if objectives_summary['failed'] > 0:
                summary_lines.append("Failed Objectives:")
                objectives_status = session['objectives']['status']
                for obj_id, status in objectives_status.items():
                    if status['status'] == 'failed':
                        summary_lines.append(f"  ❌ {status['title']}")
                summary_lines.append("")
                
        summary_lines.extend([
            "Test Execution Results:",
            f"  Total Steps: {session['metrics']['totalSteps']}",
            f"  Completed: {session['metrics']['completedSteps']}",
            f"  Failed: {session['metrics']['failedSteps']}",
            ""
        ])
        
        # Add phase breakdown
        phases = self.extract_phases(session)
        summary_lines.extend([
            "VERA Phase Breakdown:",
            f"  Verify: {phases['verify']['passed']}/{phases['verify']['steps']} passed",
            f"  Execute: {phases['execute']['passed']}/{phases['execute']['steps']} passed",
            f"  Record: {phases['record']['passed']}/{phases['record']['steps']} passed",
            f"  Analyze: {phases['analyze']['passed']}/{phases['analyze']['steps']} passed",
            ""
        ])
        
        # Add artifacts summary
        summary_lines.extend([
            "Captured Artifacts:",
            f"  Screenshots: {len(session['artifacts']['screenshots'])}",
            f"  Logs: {len(session['artifacts']['logs'])}",
            "",
            f"Full report: {report_file}",
            "=" * 70
        ])
        
        summary_text = '\n'.join(summary_lines)
        
        # Save summary
        summary_file = report_file.replace('.json', '-summary.txt')
        with open(summary_file, 'w') as f:
            f.write(summary_text)
            
        return summary_text
        
    def process_hook(self):
        """Main hook processing logic following Claude Code hooks API"""
        try:
            # Read input from stdin
            input_data = json.loads(sys.stdin.read())
            
            # Load current session
            session = self.manager.load_session()
            
            # Only process if UAT session is active
            if session:
                sys.stderr.write(f"Finalizing UAT Session: {session['sessionId']}\n")
                
                # Finalize the session
                final_session = self.manager.finalize_session(
                    status='completed' if session['metrics']['failedSteps'] == 0 else 'failed'
                )
                
                # Generate reports
                report_file = self.generate_report(final_session)
                summary = self.create_summary_report(final_session, report_file)
                
                # Output summary to stderr so user can see it
                sys.stderr.write("\n" + summary + "\n")
                
                # Log completion
                sys.stderr.write(f"\nUAT Session Complete: {final_session['sessionId']}\n")
                sys.stderr.write(f"Report saved to: {report_file}\n")
                
                # Clean up environment variables
                if 'UAT_SESSION_ID' in os.environ:
                    del os.environ['UAT_SESSION_ID']
                if 'UAT_SCENARIO' in os.environ:
                    del os.environ['UAT_SCENARIO']
                if 'UAT_PHASE' in os.environ:
                    del os.environ['UAT_PHASE']
                
            # Stop hook exits with code 0 for success
            sys.exit(0)
            
        except Exception as e:
            # Log error to stderr
            sys.stderr.write(f"UAT Finalizer Error: {str(e)}\n")
            
            # Try to finalize session with error status
            try:
                session = self.manager.load_session()
                if session:
                    self.manager.finalize_session(status='error')
            except:
                pass
            
            # Exit code 1 means non-blocking error
            sys.exit(1)

if __name__ == "__main__":
    finalizer = UATFinalizer()
    finalizer.process_hook()