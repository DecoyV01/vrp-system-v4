#!/usr/bin/env python3
"""
Test UAT Detection Logic
Validates that UAT detection works correctly with various phrases
"""

import sys
import os
import importlib.util

sys.path.append(os.path.dirname(__file__))

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

def test_uat_detection():
    """Test UAT detection with various phrases"""
    manager = UATSessionManager()
    
    # Test cases: (phrase, expected_is_uat, expected_scenario)
    test_cases = [
        # Valid UAT requests (should pass)
        ("Run UAT for login flow", True, "login-flow"),
        ("Execute UAT vehicle CRUD tests", True, "vehicle-crud"),
        ("Test UAT error handling scenarios", True, "error-handling"),
        ("Perform UAT login testing", True, "login-flow"),
        ("UAT: test vehicle operations", True, "vehicle-crud"),
        ("Please run UAT authentication tests", True, "login-flow"),
        ("I need UAT validation testing", True, "error-handling"),
        
        # Invalid requests - missing UAT keyword (should fail)
        ("Test login flow", False, None),
        ("Run vehicle CRUD tests", False, None),
        ("Execute error handling tests", False, None),
        ("Perform authentication testing", False, None),
        
        # Invalid requests - missing scenario keyword (should fail)
        ("Run UAT tests", False, None),
        ("Execute UAT", False, None),
        ("Please run UAT", False, None),
        ("UAT testing needed", False, None),
        
        # Edge cases
        ("uat login", True, "login-flow"),  # Lowercase
        ("UAT VEHICLE CRUD", True, "vehicle-crud"),  # Uppercase
        ("Run uat for error-handling", True, "error-handling"),  # Hyphenated
        ("Test the UAT login-flow scenario", True, "login-flow"),  # Direct scenario name
    ]
    
    print("UAT Detection Test Results")
    print("=" * 70)
    print(f"{'Test Phrase':<45} {'Expected':<10} {'Actual':<10} {'Status'}")
    print("-" * 70)
    
    passed = 0
    failed = 0
    
    for phrase, expected_is_uat, expected_scenario in test_cases:
        is_uat, scenario = manager.detect_uat_intent(phrase)
        
        # Check if detection matches expectation
        if is_uat == expected_is_uat and scenario == expected_scenario:
            status = "✓ PASS"
            passed += 1
        else:
            status = "✗ FAIL"
            failed += 1
            
        # Format output
        expected = f"{expected_is_uat}"
        if expected_scenario:
            expected += f" ({expected_scenario})"
            
        actual = f"{is_uat}"
        if scenario:
            actual += f" ({scenario})"
            
        print(f"{phrase:<45} {expected:<10} {actual:<10} {status}")
    
    print("-" * 70)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 70)
    
    # Test scenario file checking
    print("\nScenario File Validation:")
    print("-" * 30)
    
    scenarios = ['login-flow', 'vehicle-crud', 'error-handling']
    for scenario in scenarios:
        exists = manager.scenario_exists(scenario)
        status = "✓" if exists else "✗"
        print(f"{status} {scenario}.cjs - {'Found' if exists else 'Not Found'}")
    
    return failed == 0

if __name__ == "__main__":
    success = test_uat_detection()
    sys.exit(0 if success else 1)