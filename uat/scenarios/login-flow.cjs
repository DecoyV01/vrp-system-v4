// Login Flow UAT Scenario - Updated for Convex Auth
module.exports = {
  name: 'login-flow',
  description: 'Complete login and logout flow with Convex Auth validation',
  timeout: 30000,
  objectives: [
    {
      id: "convex_auth_validation",
      title: "Convex Authentication System Validation",
      description: "Verify user can successfully authenticate using the new Convex Auth system",
      category: "Authentication",
      priority: "Critical",
      acceptance_criteria: [
        "User can access login page with sign-in/sign-up tabs",
        "User can create a new account with strong password validation",
        "User can log in with valid credentials using Convex Auth", 
        "User authentication state is properly managed by ConvexAuthProvider",
        "User can successfully log out and session is cleared",
        "User is redirected appropriately based on authentication state"
      ],
      steps: ["navigate", "test_signup", "test_signin", "verify_dashboard", "test_logout"],
      dependencies: []
    },
    {
      id: "password_validation",
      title: "Password Security Validation", 
      description: "Verify proper password requirements and validation",
      category: "Security",
      priority: "High",
      acceptance_criteria: [
        "Password must be at least 8 characters long",
        "Password must contain uppercase, lowercase, and numbers",
        "Weak passwords are rejected with clear error messages",
        "Strong passwords are accepted for account creation"
      ],
      steps: ["test_password_validation"],
      dependencies: []
    },
    {
      id: "session_persistence",
      title: "Session Management and Persistence",
      description: "Verify Convex Auth session lifecycle management",
      category: "Authentication",
      priority: "High",
      acceptance_criteria: [
        "Initial state shows user logged out",
        "Login creates valid JWT-based authenticated session",
        "Session state persists during navigation",
        "Logout properly clears Convex Auth session",
        "Protected routes redirect unauthenticated users"
      ],
      steps: ["verify_initial_state", "verify_session_persistence", "verify_logout"],
      dependencies: ["convex_auth_validation"]
    }
  ],
  steps: [
    // Step 1: Navigate to application root
    {
      action: 'navigate',
      url: 'https://vrp-system-v4.pages.dev/',
      validate: [
        ['elementExists', 'body'],
        ['healthCheck', 'isLoggedIn', false]
      ]
    },

    // Step 2: Verify initial logged-out state
    {
      action: 'verify_state',
      description: 'Ensure user starts logged out and is redirected to login',
      validate: [
        ['healthCheck', 'isAuthenticated', false],
        ['healthCheck', 'isLoading', false],
        ['urlMatches', '/auth/login']
      ]
    },

    // Step 3: Take screenshot of new login page design
    {
      action: 'screenshot',
      name: 'convex-auth-login-page'
    },

    // Step 4: Test sign-up tab functionality
    {
      action: 'click',
      selector: '[data-value="signup"]',
      validate: [
        ['elementVisible', '#signup-name'],
        ['elementVisible', '#signup-email'],
        ['elementVisible', '#signup-password']
      ]
    },

    // Step 5: Test password validation with weak password
    {
      action: 'fill',
      fields: {
        '#signup-name': 'Test User',
        '#signup-email': 'testuser@example.com',
        '#signup-password': 'weak'
      },
      validate: [
        ['inputHasValue', '#signup-name', 'Test User'],
        ['inputHasValue', '#signup-email', 'testuser@example.com']
      ]
    },

    {
      action: 'click',
      selector: 'button[type="submit"]:contains("Create Account")',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.text-red-700'],  // Error message should appear
        ['textContains', '.text-red-700', 'Password must']
      ]
    },

    // Step 6: Create account with strong password
    {
      action: 'fill',
      fields: {
        '#signup-password': 'StrongPass123!'
      }
    },

    {
      action: 'click',
      selector: 'button[type="submit"]:contains("Create Account")',
      waitFor: 'networkIdle',
      validate: [
        ['healthCheck', 'hasErrors', false]
      ]
    },

    // Step 7: Verify successful registration and redirect
    {
      action: 'verify_state',
      description: 'Verify account creation and auto-login',
      validate: [
        ['healthCheck', 'isAuthenticated', true],
        ['urlMatches', '/projects']
      ]
    },

    {
      action: 'screenshot',
      name: 'successful-registration'
    },

    // Step 8: Test logout functionality with new UI
    {
      action: 'click',
      selector: '[data-testid="user-menu-trigger"]',
      validate: [
        ['elementVisible', '[data-testid="sign-out-button"]']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="sign-out-button"]',
      waitFor: 'networkIdle'
    },

    // Step 9: Verify logout redirects to login page
    {
      action: 'verify_state',
      description: 'Verify logout clears Convex Auth session',
      validate: [
        ['healthCheck', 'isAuthenticated', false],
        ['urlMatches', '/auth/login']
      ]
    },

    // Step 10: Test sign-in with created account
    {
      action: 'click',
      selector: '[data-value="signin"]',
      validate: [
        ['elementVisible', '#signin-email'],
        ['elementVisible', '#signin-password']
      ]
    },

    {
      action: 'fill',
      fields: {
        '#signin-email': 'testuser@example.com',
        '#signin-password': 'StrongPass123!'
      },
      validate: [
        ['inputHasValue', '#signin-email', 'testuser@example.com']
      ]
    },

    {
      action: 'click',
      selector: 'button[type="submit"]:contains("Sign In")',
      waitFor: 'networkIdle'
    },

    // Step 11: Verify successful sign-in
    {
      action: 'verify_state',
      description: 'Verify sign-in with existing account',
      validate: [
        ['healthCheck', 'isAuthenticated', true],
        ['healthCheck', 'hasErrors', false],
        ['urlMatches', '/projects']
      ]
    },

    {
      action: 'screenshot',
      name: 'successful-signin'
    },

    // Step 12: Test session persistence by navigating
    {
      action: 'navigate',
      url: 'https://vrp-system-v4.pages.dev/projects',
      validate: [
        ['healthCheck', 'isAuthenticated', true],
        ['elementVisible', '.projects-container']
      ]
    },

    // Step 13: Final logout test
    {
      action: 'click',
      selector: '[data-testid="user-menu-trigger"]'
    },

    {
      action: 'click',
      selector: '[data-testid="sign-out-button"]',
      waitFor: 'networkIdle'
    },

    // Step 14: Final verification
    {
      action: 'verify_state',
      description: 'Final verification of complete authentication flow',
      validate: [
        ['healthCheck', 'isAuthenticated', false],
        ['urlMatches', '/auth/login'],
        ['elementVisible', '.text-gray-500:contains("Secure authentication powered by Convex Auth")']
      ]
    },

    {
      action: 'screenshot',
      name: 'authentication-flow-complete'
    }
  ]
};