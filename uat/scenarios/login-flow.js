// Login Flow UAT Scenario
module.exports = {
  name: 'login-flow',
  description: 'Complete login and logout flow with validation',
  timeout: 30000,
  steps: [
    {
      action: 'navigate',
      url: 'http://localhost:5173',
      validate: ['elementExists', 'body']
    },
    {
      action: 'verify_logged_out',
      description: 'Ensure user starts logged out',
      validate: ['healthCheck', 'isLoggedIn', false]
    },
    {
      action: 'navigate',
      url: 'http://localhost:5173/auth/login',
      validate: ['urlMatches', '/auth/login']
    },
    {
      action: 'screenshot',
      name: 'login-page'
    },
    {
      action: 'fill',
      fields: {
        '#email': 'test1@example.com',
        '#password': 'testpassword123246'
      },
      validate: [
        ['inputHasValue', '#email', 'test1@example.com'],
        ['elementVisible', '#login-button']
      ]
    },
    {
      action: 'click',
      selector: '#login-button',
      waitFor: 'networkIdle'
    },
    {
      action: 'verify_login_success',
      validate: [
        ['healthCheck', 'isLoggedIn', true],
        ['healthCheck', 'hasErrors', false],
        ['urlMatches', '/']
      ]
    },
    {
      action: 'screenshot',
      name: 'login-success'
    },
    {
      action: 'logout',
      description: 'Test logout functionality',
      steps: [
        {
          action: 'click',
          selector: '.user-menu',
          validate: ['elementVisible', '.logout-button']
        },
        {
          action: 'click',
          selector: '.logout-button',
          waitFor: 'networkIdle'
        },
        {
          action: 'verify_logout',
          validate: [
            ['healthCheck', 'isLoggedIn', false],
            ['urlMatches', '/auth/login']
          ]
        }
      ]
    },
    {
      action: 'screenshot',
      name: 'logout-complete'
    }
  ]
};