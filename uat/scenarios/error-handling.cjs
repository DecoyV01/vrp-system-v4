// Error Handling UAT Scenario
module.exports = {
  name: 'error-handling',
  description: 'Test application error handling and recovery',
  timeout: 45000,
  objectives: [
    {
      id: "client_side_validation",
      title: "Client-Side Form Validation",
      description: "Verify client-side validation prevents invalid form submissions",
      category: "Error Handling",
      priority: "Critical",
      acceptance_criteria: [
        "Empty forms trigger validation errors",
        "Error messages are displayed clearly",
        "Form submission is prevented with invalid data",
        "Validation errors can be resolved",
        "Health check properly reports error state"
      ],
      steps: ["test_form_validation"],
      dependencies: []
    },
    {
      id: "network_error_handling",
      title: "Network Error Recovery",
      description: "Verify application handles network failures gracefully",
      category: "Error Handling",
      priority: "High",
      acceptance_criteria: [
        "Network failures are detected and reported",
        "User receives appropriate error messaging",
        "Application remains functional during network issues",
        "Recovery mechanisms work when network is restored",
        "API call tracking captures network errors"
      ],
      steps: ["test_network_errors"],
      dependencies: []
    },
    {
      id: "session_timeout_handling", 
      title: "Session Timeout Management",
      description: "Verify proper handling of expired user sessions",
      category: "Error Handling",
      priority: "High",
      acceptance_criteria: [
        "Expired sessions are detected",
        "User is redirected to login page",
        "Session timeout message is displayed",
        "Protected actions are blocked for expired sessions",
        "Re-authentication flow works correctly"
      ],
      steps: ["test_session_timeout"],
      dependencies: []
    },
    {
      id: "server_side_validation",
      title: "Server-Side Data Validation",
      description: "Verify server-side validation and error reporting",
      category: "Error Handling",
      priority: "Critical",
      acceptance_criteria: [
        "Invalid data submissions are rejected",
        "Server validation errors are displayed",
        "API responses include proper error codes",
        "User receives actionable error messages",
        "Data integrity is maintained"
      ],
      steps: ["test_data_validation"],
      dependencies: []
    },
    {
      id: "javascript_error_resilience",
      title: "JavaScript Error Resilience", 
      description: "Verify application recovers from JavaScript runtime errors",
      category: "Error Handling",
      priority: "Medium",
      acceptance_criteria: [
        "JavaScript errors are captured and logged",
        "Application continues functioning after JS errors",
        "Error boundaries prevent complete application failure",
        "User experience is not severely impacted",
        "Error tracking systems receive error data"
      ],
      steps: ["test_javascript_errors"],
      dependencies: []
    },
    {
      id: "error_user_experience",
      title: "Error Handling User Experience",
      description: "Verify error scenarios provide good user experience",
      category: "UI/UX",
      priority: "Medium", 
      acceptance_criteria: [
        "Error messages are user-friendly and actionable",
        "Visual indicators clearly show error states",
        "Recovery paths are obvious to users",
        "Error states don't break application layout",
        "Users can easily return to working states"
      ],
      steps: ["test_form_validation", "test_network_errors", "test_data_validation"],
      dependencies: []
    }
  ],
  steps: [
    {
      action: 'test_form_validation',
      description: 'Test client-side form validation',
      steps: [
        {
          action: 'navigate',
          url: '/projects/new',
          validate: ['elementVisible', '.project-form']
        },
        {
          action: 'submit_empty_form',
          selector: '#submit-project',
          validate: [
            ['hasClass', '.project-form', 'has-errors'],
            ['elementVisible', '.field-error'],
            ['healthCheck', 'hasErrors', true]
          ]
        },
        {
          action: 'screenshot',
          name: 'form-validation-errors'
        },
        {
          action: 'fix_validation_errors',
          fields: {
            '#project-name': 'Test Project'
          },
          validate: [
            ['elementNotExists', '#project-name + .field-error'],
            ['healthCheck', 'hasErrors', false]
          ]
        }
      ]
    },
    {
      action: 'test_network_errors',
      description: 'Test network error handling',
      steps: [
        {
          action: 'simulate_network_failure',
          script: `
            // Override fetch to simulate network failure
            window.__originalFetch = window.fetch;
            window.fetch = () => Promise.reject(new Error('Network failure'));
          `
        },
        {
          action: 'trigger_api_call',
          selector: '#refresh-data',
          validate: [
            ['elementVisible', '.error-message'],
            ['textContains', '.error-message', 'network'],
            ['healthCheck', 'getLastApiCall().error', 'Network failure']
          ]
        },
        {
          action: 'screenshot',
          name: 'network-error'
        },
        {
          action: 'restore_network',
          script: `
            // Restore original fetch
            window.fetch = window.__originalFetch;
          `
        },
        {
          action: 'retry_operation',
          selector: '#retry-button',
          waitFor: 'networkIdle',
          validate: [
            ['elementNotExists', '.error-message'],
            ['healthCheck', 'hasErrors', false]
          ]
        }
      ]
    },
    {
      action: 'test_session_timeout',
      description: 'Test session timeout handling',
      steps: [
        {
          action: 'simulate_session_timeout',
          script: `
            // Clear auth tokens to simulate timeout
            localStorage.removeItem('convex-auth-token');
            sessionStorage.clear();
          `
        },
        {
          action: 'trigger_protected_action',
          selector: '#protected-action',
          validate: [
            ['urlMatches', '/auth/login'],
            ['elementVisible', '.session-timeout-message']
          ]
        },
        {
          action: 'screenshot',
          name: 'session-timeout'
        }
      ]
    },
    {
      action: 'test_data_validation',
      description: 'Test server-side data validation',
      steps: [
        {
          action: 'login_for_test',
          email: 'test1@example.com',
          password: 'testpassword123246'
        },
        {
          action: 'navigate',
          url: '/vehicles/new',
          validate: ['elementVisible', '.vehicle-form']
        },
        {
          action: 'submit_invalid_data',
          fields: {
            '#vehicle-capacity': '-100', // Invalid negative capacity
            '#vehicle-id': '' // Missing required field
          },
          submitSelector: '#submit-vehicle',
          validate: [
            ['elementVisible', '.server-error'],
            ['textContains', '.capacity-error', 'must be positive'],
            ['healthCheck', 'getLastApiCall().status', 400]
          ]
        },
        {
          action: 'screenshot',
          name: 'server-validation-error'
        }
      ]
    },
    {
      action: 'test_javascript_errors',
      description: 'Test JavaScript error handling',
      steps: [
        {
          action: 'trigger_js_error',
          script: `
            // Trigger a JavaScript error
            throw new Error('Test JavaScript Error');
          `
        },
        {
          action: 'verify_error_captured',
          validate: [
            ['healthCheck', 'getActionLog().some(a => a.action === "javascript_error")', true]
          ]
        },
        {
          action: 'verify_app_still_functional',
          validate: [
            ['elementVisible', 'body'],
            ['healthCheck', 'isLoading', false]
          ]
        }
      ]
    }
  ]
};