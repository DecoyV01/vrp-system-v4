# UAT Test Scenarios

This directory contains test scenario definitions for the VRP System v4 UAT framework.

## Available Scenarios

### Core Scenarios
- **login-flow.js** - Complete authentication flow testing
- **vehicle-crud.js** - Vehicle CRUD operations testing
- **error-handling.js** - Error handling and recovery testing

### Scenario Structure

Each scenario file exports an object with the following structure:

```javascript
module.exports = {
  name: 'scenario-name',
  description: 'Brief description of what this scenario tests',
  timeout: 30000, // Optional timeout in milliseconds
  preconditions: [ // Optional array of preconditions
    'user must be logged in',
    'project must be selected'
  ],
  steps: [
    {
      action: 'action-type',
      description: 'Optional description',
      // Action-specific properties
      validate: [ // Optional validation steps
        ['assertion-type', 'selector', 'expected-value']
      ]
    }
  ]
};
```

## Action Types

### Navigation Actions
```javascript
{
  action: 'navigate',
  url: 'http://localhost:5173/path',
  validate: ['urlMatches', '/path']
}
```

### Interaction Actions
```javascript
{
  action: 'click',
  selector: '#button-id',
  waitFor: 'networkIdle', // Optional: wait condition
  validate: ['elementVisible', '.result']
}

{
  action: 'fill',
  fields: {
    '#input-1': 'value1',
    '#input-2': 'value2'
  },
  validate: [
    ['inputHasValue', '#input-1', 'value1']
  ]
}
```

### Verification Actions
```javascript
{
  action: 'verify_state',
  validate: [
    ['healthCheck', 'isLoggedIn', true],
    ['elementVisible', '.dashboard'],
    ['textContains', 'h1', 'Welcome']
  ]
}
```

### Screenshot Actions
```javascript
{
  action: 'screenshot',
  name: 'descriptive-name'
}
```

### Custom Script Actions
```javascript
{
  action: 'custom_script',
  script: `
    // Custom JavaScript to execute
    window.customAction();
  `,
  validate: ['healthCheck', 'hasErrors', false]
}
```

## Validation Types

### Element Assertions
- `elementExists` - Check if element exists in DOM
- `elementVisible` - Check if element is visible
- `elementNotExists` - Check if element does not exist
- `textContains` - Check if element contains specific text
- `hasClass` - Check if element has specific CSS class
- `hasAttribute` - Check if element has specific attribute

### Form Assertions
- `inputHasValue` - Check input field value
- `formIsValid` - Check if form passes validation

### Navigation Assertions
- `urlMatches` - Check if current URL matches pattern

### Health Check Assertions
- `healthCheck` - Check application health state
  - `isLoggedIn` - Authentication status
  - `hasErrors` - Error state
  - `isLoading` - Loading state
  - `getDataLoadState()` - Data loading states
  - `getLastApiCall()` - Last API call information

### Table Assertions
- `tableRowCount` - Check number of table rows
- `tableContainsText` - Check if table contains specific text

## Creating New Scenarios

1. Create a new `.js` file in this directory
2. Follow the structure shown above
3. Test your scenario with: `/uat-scenario your-scenario-name`
4. Add scenario to the pipeline in `hooks/uat-pipeline.sh`

## Example: Simple Navigation Scenario

```javascript
// navigation-test.js
module.exports = {
  name: 'navigation-test',
  description: 'Test basic navigation between pages',
  steps: [
    {
      action: 'navigate',
      url: 'http://localhost:5173',
      validate: ['elementVisible', '.homepage']
    },
    {
      action: 'click',
      selector: '#projects-link',
      validate: [
        ['urlMatches', '/projects'],
        ['elementVisible', '.projects-page']
      ]
    },
    {
      action: 'screenshot',
      name: 'projects-page'
    }
  ]
};
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive scenario names
2. **Focused Testing**: Each scenario should test a specific workflow
3. **Good Validation**: Include multiple validation points
4. **Error Recovery**: Test both success and failure paths
5. **Screenshots**: Capture key states for visual verification
6. **Timeouts**: Set appropriate timeouts for slow operations
7. **Preconditions**: Document what must be true before running

## Debugging Scenarios

If a scenario fails:

1. Check the failure screenshot in `../screenshots/`
2. Review the health check logs
3. Examine the validation error messages
4. Use the debug information in `../debug/`
5. Add more specific validation steps if needed