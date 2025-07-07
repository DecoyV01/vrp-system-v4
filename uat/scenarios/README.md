# UAT Test Scenarios

This directory contains test scenario definitions for the VRP System v4 UAT framework.

## Available Scenarios

### Core Scenarios
- **login-flow.cjs** - Complete authentication flow testing
- **vehicle-crud.cjs** - Vehicle CRUD operations testing
- **error-handling.cjs** - Error handling and recovery testing

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
  objectives: [ // Test objectives for tracking business goals
    {
      id: "unique_objective_id",
      title: "Business Objective Title",
      description: "Detailed description of what this objective validates",
      category: "Authentication|CRUD Operations|Error Handling|UI/UX|Data Integrity",
      priority: "Critical|High|Medium|Low",
      acceptance_criteria: [
        "Specific criterion that must be met",
        "Another criterion for this objective"
      ],
      steps: ["step1", "step2"], // Steps that contribute to this objective
      dependencies: ["other_objective_id"] // Prerequisites (optional)
    }
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
  url: 'https://vrp-system-v4.pages.dev/path',
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

## Test Objectives

### Purpose
Test objectives provide business-focused tracking of what each scenario validates. Unlike steps which focus on technical execution, objectives track business goals and acceptance criteria.

### Objective Categories
- **Authentication** - User login, logout, session management
- **CRUD Operations** - Create, read, update, delete functionality
- **Error Handling** - Error scenarios and recovery mechanisms
- **UI/UX** - User interface and user experience validation
- **Data Integrity** - Data validation and business rule enforcement

### Priority Levels
- **Critical** - Must pass for system acceptance (blocking issues)
- **High** - Important functionality that should work (major issues)
- **Medium** - Enhanced features that improve user experience (minor issues)
- **Low** - Nice-to-have functionality (cosmetic issues)

### Objective Tracking
Objectives are automatically tracked during test execution:
- **Steps** array links test steps to objectives
- **Dependencies** ensure objectives are tested in proper order
- **Acceptance Criteria** provide detailed success requirements
- **Status** is calculated based on linked step success/failure

### Reports
Enhanced markdown reports show:
- Objective achievement status (✅ PASSED / ❌ FAILED / ⚠️ PARTIAL)
- Progress percentage for each objective
- Failed acceptance criteria details
- Business impact analysis

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
      url: 'https://vrp-system-v4.pages.dev',
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

### General Practices
1. **Descriptive Names**: Use clear, descriptive scenario names
2. **Focused Testing**: Each scenario should test a specific workflow
3. **Good Validation**: Include multiple validation points
4. **Error Recovery**: Test both success and failure paths
5. **Screenshots**: Capture key states for visual verification
6. **Timeouts**: Set appropriate timeouts for slow operations
7. **Preconditions**: Document what must be true before running

### Objective Best Practices
1. **Business Focus**: Write objectives from a business stakeholder perspective
2. **Clear Acceptance Criteria**: Each criterion should be specific and measurable
3. **Proper Categorization**: Use consistent categories across scenarios
4. **Priority Assignment**: Assign priorities based on business impact
5. **Step Mapping**: Link relevant steps to each objective (don't include setup/teardown steps)
6. **Dependency Management**: Map logical dependencies between objectives
7. **Descriptive Titles**: Use titles that clearly convey the business value being tested

## Debugging Scenarios

If a scenario fails:

1. Check the failure screenshot in `../screenshots/`
2. Review the health check logs
3. Examine the validation error messages
4. Use the debug information in `../debug/`
5. Add more specific validation steps if needed