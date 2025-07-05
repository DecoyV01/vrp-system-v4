# How to Create New UAT Test Scenarios

## 📍 Where to Add New Scenarios

**Location**: `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

All UAT test scenarios are stored as **`.js` files** in the `scenarios/` directory. Each file represents a complete test workflow for a specific feature.

## 🔧 Step-by-Step Process

### 1. Create the Scenario File

```bash
# Navigate to scenarios directory
cd /mnt/c/projects/vrp-system/v4/uat/scenarios/

# Create new scenario file (use kebab-case naming)
touch your-new-feature.js
```

### 2. Define Basic Structure

Every scenario follows this structure:

```javascript
// your-new-feature.js
module.exports = {
  name: 'your-new-feature',
  description: 'Test the new feature functionality',
  timeout: 45000, // Optional: custom timeout
  preconditions: [
    'user must be logged in',
    'specific data must exist'
  ],
  steps: [
    // Test steps go here
  ]
};
```

### 3. Add Test Steps

Use these action types:

- **`navigate`** - Go to a page
- **`click`** - Click elements
- **`fill`** - Fill forms
- **`verify_state`** - Check application state
- **`screenshot`** - Capture visual evidence
- **`custom_script`** - Run custom JavaScript

### 4. Add Validations

Each step can have validations:

```javascript
{
  action: 'click',
  selector: '#my-button',
  validate: [
    ['elementVisible', '.result-panel'],
    ['healthCheck', 'hasErrors', false],
    ['textContains', '.success-msg', 'Success']
  ]
}
```

## 🎯 Real Example: New Feature Test

Let's say you want to test a new "Route Optimization" feature:

```javascript
// /mnt/c/projects/vrp-system/v4/uat/scenarios/route-optimization.js

module.exports = {
  name: 'route-optimization',
  description: 'Test route optimization feature with multiple vehicles and jobs',
  timeout: 60000,
  preconditions: [
    'user must be logged in',
    'project with vehicles and jobs must exist'
  ],
  steps: [
    // Navigate to optimization page
    {
      action: 'navigate',
      url: '/projects/test-project/optimization',
      validate: [
        ['urlMatches', '/optimization'],
        ['elementVisible', '.optimization-panel']
      ]
    },
    
    // Configure optimization settings
    {
      action: 'fill',
      fields: {
        '#max-distance': '500',
        '#optimization-mode': 'fastest'
      },
      validate: [
        ['inputHasValue', '#max-distance', '500']
      ]
    },
    
    // Start optimization
    {
      action: 'click',
      selector: '#start-optimization',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.optimization-progress'],
        ['healthCheck', 'isLoading', true]
      ]
    },
    
    // Wait for completion
    {
      action: 'verify_state',
      description: 'Wait for optimization to complete',
      validate: [
        ['healthCheck', 'isLoading', false],
        ['elementVisible', '.route-results'],
        ['elementExists', '.route-map']
      ]
    },
    
    // Capture results
    {
      action: 'screenshot',
      name: 'optimization-complete'
    },
    
    // Verify results data
    {
      action: 'verify_state',
      validate: [
        ['tableRowCount', '.routes-table tr', 3], // Expect 3 routes
        ['textContains', '.total-distance', 'km'],
        ['healthCheck', 'hasErrors', false]
      ]
    }
  ]
};
```

## 🧪 Testing Your New Scenario

### 1. Validate Structure
```bash
node uat-test-runner.cjs scenario route-optimization --validate
```
*This checks if your scenario syntax is correct*

### 2. Dry Run
```bash
node uat-test-runner.cjs scenario route-optimization --dry-run
```
*This shows what would happen without actually running*

### 3. Execute
```bash
node uat-test-runner.cjs scenario route-optimization --debug
```
*This runs the actual test with detailed logging*

## 📋 Available Action Types

### Navigation Actions
```javascript
{
  action: 'navigate',
  url: '/path/to/page',
  waitFor: 'networkIdle', // Optional
  validate: [
    ['urlMatches', '/path/to/page'],
    ['elementVisible', '.page-content']
  ]
}
```

### Interaction Actions
```javascript
{
  action: 'click',
  selector: '#button-id',
  waitFor: 'networkIdle',
  validate: [
    ['elementVisible', '.result-panel']
  ]
}

{
  action: 'fill',
  fields: {
    '#input-field': 'test value',
    '#textarea': 'longer test content'
  },
  submitSelector: '#submit-button', // Optional
  validate: [
    ['inputHasValue', '#input-field', 'test value'],
    ['formIsValid', '.form-container']
  ]
}
```

### Verification Actions
```javascript
{
  action: 'verify_state',
  validate: [
    ['healthCheck', 'isLoggedIn', true],
    ['healthCheck', 'hasErrors', false],
    ['elementVisible', '.success-indicator']
  ]
}
```

### Custom Script Actions
```javascript
{
  action: 'custom_script',
  script: `
    // Custom JavaScript to execute
    window.customFeatureAction();
    return document.querySelector('.result').textContent;
  `,
  validate: [
    ['healthCheck', 'hasErrors', false]
  ]
}
```

## 📋 Available Validation Methods

You can use these in your `validate` arrays:

### Element Validations
- `['elementExists', '#selector']` - Element is in DOM
- `['elementVisible', '.class']` - Element is visible
- `['elementNotExists', '#selector']` - Element is not in DOM
- `['textContains', 'h1', 'Expected Text']` - Element contains text
- `['hasClass', '#selector', 'className']` - Element has CSS class
- `['hasAttribute', '#selector', 'attr', 'value']` - Element has attribute

### Form Validations
- `['inputHasValue', '#input', 'value']` - Input has specific value
- `['formIsValid', '.form']` - Form passes validation

### Navigation Validations
- `['urlMatches', '/expected/path']` - URL contains pattern

### Health Check Validations
- `['healthCheck', 'isLoggedIn', true]` - Authentication state
- `['healthCheck', 'hasErrors', false]` - Error state
- `['healthCheck', 'isLoading', false]` - Loading state

### Table Validations
- `['tableRowCount', '.table', 3]` - Table has specific row count
- `['tableContainsText', '.table', 'text']` - Table contains text

## 🎯 Complete Example: Location Management Feature

```javascript
// /mnt/c/projects/vrp-system/v4/uat/scenarios/location-management.js

module.exports = {
  name: 'location-management',
  description: 'Test complete location management workflow',
  timeout: 45000,
  preconditions: [
    'user must be logged in',
    'project with dataset must be selected'
  ],
  steps: [
    // Navigate to locations page
    {
      action: 'navigate',
      url: '/projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/locations',
      validate: [
        ['elementVisible', '.location-list'],
        ['healthCheck', 'getDataLoadState().locations', 'success']
      ]
    },
    
    // Create new location
    {
      action: 'click',
      selector: '#add-location-button',
      validate: ['elementVisible', '.location-form-modal']
    },
    
    // Fill location details
    {
      action: 'fill',
      fields: {
        '#location-name': 'Test Location UAT',
        '#location-address': '123 Test Street, Test City',
        '#location-lat': '40.7128',
        '#location-lng': '-74.0060'
      },
      validate: [
        ['formIsValid', '.location-form'],
        ['inputHasValue', '#location-name', 'Test Location UAT']
      ]
    },
    
    // Submit form
    {
      action: 'click',
      selector: '#submit-location',
      waitFor: 'networkIdle',
      validate: [
        ['elementNotExists', '.location-form-modal'],
        ['tableContainsText', '.location-list', 'Test Location UAT']
      ]
    },
    
    // Take success screenshot
    {
      action: 'screenshot',
      name: 'location-created'
    },
    
    // Edit the location
    {
      action: 'click',
      selector: '[data-location-name="Test Location UAT"] .edit-button',
      validate: ['elementVisible', '.location-edit-form']
    },
    
    // Update location
    {
      action: 'fill',
      fields: {
        '#location-name': 'Updated Test Location UAT'
      },
      submitSelector: '#save-location',
      waitFor: 'networkIdle'
    },
    
    // Verify update
    {
      action: 'verify_state',
      validate: [
        ['tableContainsText', '.location-list', 'Updated Test Location UAT'],
        ['healthCheck', 'hasErrors', false]
      ]
    },
    
    // Delete the location
    {
      action: 'click',
      selector: '[data-location-name="Updated Test Location UAT"] .delete-button',
      validate: ['elementVisible', '.confirm-delete-modal']
    },
    
    // Confirm deletion
    {
      action: 'click',
      selector: '#confirm-delete',
      waitFor: 'networkIdle',
      validate: [
        ['elementNotExists', '.confirm-delete-modal'],
        ['elementNotExists', '[data-location-name="Updated Test Location UAT"]']
      ]
    },
    
    // Final screenshot
    {
      action: 'screenshot',
      name: 'location-deleted'
    }
  ]
};
```

## 🔄 Adding to Automation

Once your scenario works, add it to the automation pipeline:

```bash
# Edit the pipeline file
nano /mnt/c/projects/vrp-system/v4/uat/hooks/uat-pipeline.sh

# Add your scenario to the SCENARIOS array:
SCENARIOS=(
    "login-flow"
    "vehicle-crud" 
    "job-management"
    "route-optimization"  # Your new scenario here
)
```

## ✅ Best Practices

### 1. **Descriptive Naming**
- Use kebab-case: `feature-name.js`
- Be specific: `route-optimization.js` not `test.js`

### 2. **Clear Structure**
- Add meaningful descriptions
- Include preconditions
- Use descriptive step names

### 3. **Comprehensive Validation**
- Validate each action result
- Use health checks for state verification
- Include both positive and negative test cases

### 4. **Error Handling**
- Test error scenarios
- Validate error messages
- Test recovery actions

### 5. **Screenshots**
- Capture key states
- Use descriptive screenshot names
- Include failure and success states

### 6. **Selector Strategy**
- Use stable selectors (IDs preferred)
- Avoid fragile CSS selectors
- Use data attributes for test elements

### 7. **Wait Strategies**
- Use `waitFor: 'networkIdle'` for API calls
- Add explicit waits for animations
- Use health checks to verify state changes

## 🚀 Quick Summary

For any **new feature** you want to test:

1. **Create**: `touch /mnt/c/projects/vrp-system/v4/uat/scenarios/your-feature.js`
2. **Define**: Basic structure with name, description, steps
3. **Build**: Add action steps with validations
4. **Test**: Use `--validate`, `--dry-run`, then full execution
5. **Deploy**: Add to automation pipeline if needed

## 🎯 Common Patterns

### Login Required Test
```javascript
{
  action: 'verify_state',
  validate: [
    ['healthCheck', 'isLoggedIn', true]
  ]
}
```

### Form Submission Pattern
```javascript
{
  action: 'fill',
  fields: { /* form fields */ },
  submitSelector: '#submit-button',
  waitFor: 'networkIdle',
  validate: [
    ['elementNotExists', '.form-modal'],
    ['healthCheck', 'hasErrors', false]
  ]
}
```

### Error Testing Pattern
```javascript
{
  action: 'fill',
  fields: {
    '#required-field': '' // Invalid empty value
  },
  submitSelector: '#submit',
  validate: [
    ['elementVisible', '.error-message'],
    ['hasClass', '.form', 'has-errors']
  ]
}
```

## 🔍 Debugging Tips

### Check Element Selectors
```bash
# Use browser dev tools to verify selectors exist
document.querySelector('#your-selector')
```

### Verify Health Checks
```bash
# In browser console during development
window.__UAT_HEALTH__.isLoggedIn()
window.__UAT_HEALTH__.hasErrors()
```

### Test Individual Actions
```javascript
// Create minimal test scenarios for debugging
module.exports = {
  name: 'debug-test',
  description: 'Debug specific action',
  steps: [
    {
      action: 'navigate',
      url: '/debug/page',
      validate: [['elementExists', 'body']]
    }
  ]
};
```

---

The UAT framework will automatically discover your new scenario file and make it available through the command line interface!

**Happy Testing! 🧪✅**