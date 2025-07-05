// Error Handling UAT Scenario
module.exports = {
  name: 'error-handling',
  description: 'Test application error handling and recovery',
  timeout: 45000,
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