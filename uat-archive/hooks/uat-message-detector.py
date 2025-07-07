#!/usr/bin/env python3
"""
UAT Message Detector - Standalone script to detect UAT intent from user messages
Creates signal file for orchestrator to pick up
"""

import json
import sys
import os
import re
from datetime import datetime

class UATMessageDetector:
    def __init__(self):
        self.uat_root = '/mnt/c/projects/vrp-system/v4/uat'
        self.intent_file = os.path.join(self.uat_root, '.uat_intent')
        
    def detect_uat_intent(self, message):
        """
        Detect UAT intent from message requiring 'uat' keyword + scenario keyword
        Returns (is_uat, scenario_name)
        """
        if not message:
            return False, None
            
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
    
    def create_intent_signal(self, scenario, message):
        """Create intent signal file for orchestrator"""
        intent_data = {
            'scenario': scenario,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'detected_by': 'uat-message-detector'
        }
        
        # Ensure UAT directory exists
        os.makedirs(self.uat_root, exist_ok=True)
        
        # Write intent file
        with open(self.intent_file, 'w') as f:
            json.dump(intent_data, f, indent=2)
            
        return intent_data
    
    def process_message(self, message):
        """Process a message and create intent signal if UAT detected"""
        is_uat, scenario = self.detect_uat_intent(message)
        
        if is_uat and scenario:
            intent_data = self.create_intent_signal(scenario, message)
            return True, intent_data
        
        return False, None

def main():
    """CLI interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python3 uat-message-detector.py 'message to test'")
        sys.exit(1)
    
    message = sys.argv[1]
    detector = UATMessageDetector()
    
    is_uat, intent_data = detector.process_message(message)
    
    if is_uat:
        print(f"✓ UAT Intent Detected: {intent_data['scenario']}")
        print(f"  Signal file created: {detector.intent_file}")
        return 0
    else:
        print("✗ No UAT intent detected")
        return 1

if __name__ == "__main__":
    sys.exit(main())