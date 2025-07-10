# How to Create New UAT Test Scenarios

## 📍 Where to Add New Scenarios

**Location**: `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

All UAT test scenarios are stored as **`.js` files** in the `scenarios/` directory. Each file represents a complete test workflow for a specific feature.

## 🗺️ Master Locations System UAT Scenarios

### Available Location Testing Scenarios

1. **location-crud.cjs** - Core CRUD operations for locations
2. **location-map.cjs** - Map interface and geocoding functionality  
3. **location-bulk.cjs** - Bulk operations and CSV import/export
4. **location-search.cjs** - Search and filtering capabilities
5. **location-integration.cjs** - Integration with vehicles/jobs/shipments

### Location Testing Best Practices

- **Geocoding Testing**: Always test with real addresses for geocoding validation
- **Multi-View Testing**: Verify functionality across map, grid, and list views
- **Performance Testing**: Include tests with large datasets (1000+ locations)
- **Integration Testing**: Test location references in vehicles, jobs, and shipments
- **Error Scenarios**: Test invalid coordinates, failed geocoding, and network errors

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
  objectives: [ // Define business objectives this scenario validates
    {
      id: "feature_functionality",
      title: "New Feature Core Functionality",
      description: "Verify the new feature works as intended for end users",
      category: "CRUD Operations", // Authentication|CRUD Operations|Error Handling|UI/UX|Data Integrity
      priority: "Critical", // Critical|High|Medium|Low
      acceptance_criteria: [
        "Feature can be accessed by authenticated users",
        "Feature performs expected operations correctly",
        "Feature provides appropriate user feedback"
      ],
      steps: ["navigate", "click", "verify_state"], // Link to test steps
      dependencies: [] // Other objectives this depends on
    }
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
  objectives: [
    {
      id: "optimization_execution",
      title: "Route Optimization Execution",
      description: "Verify route optimization algorithm executes successfully",
      category: "CRUD Operations",
      priority: "Critical",
      acceptance_criteria: [
        "User can access optimization interface",
        "Optimization settings can be configured",
        "Optimization process executes without errors",
        "Results are generated and displayed"
      ],
      steps: ["navigate", "fill", "click", "verify_state"],
      dependencies: []
    },
    {
      id: "optimization_results",
      title: "Optimization Results Validation",
      description: "Verify optimization produces valid and useful results",
      category: "Data Integrity",
      priority: "High",
      acceptance_criteria: [
        "Route results are mathematically valid",
        "Results include required data fields",
        "Results are properly formatted and displayed",
        "Visual representation matches data"
      ],
      steps: ["verify_state", "screenshot"],
      dependencies: ["optimization_execution"]
    }
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

## 🎯 Defining Test Objectives

### Purpose of Objectives
Objectives provide business-focused tracking of what your scenario validates. While steps focus on technical execution, objectives track business goals and user outcomes.

### Objective Structure
```javascript
{
  id: "unique_objective_id", // Must be unique within scenario
  title: "Business-Focused Title", // What business value is being tested
  description: "Detailed explanation of the objective", // Why this matters
  category: "CRUD Operations", // See categories below
  priority: "Critical", // Business impact level
  acceptance_criteria: [ // Specific requirements that must be met
    "Specific, measurable criterion",
    "Another measurable criterion"
  ],
  steps: ["step1", "step2"], // Which test steps contribute to this objective
  dependencies: ["other_objective_id"] // Prerequisites (optional)
}
```

### Objective Categories
- **Authentication** - Login, logout, session management, security
- **CRUD Operations** - Create, read, update, delete functionality
- **Error Handling** - Error scenarios, validation, recovery mechanisms  
- **UI/UX** - User interface, user experience, usability
- **Data Integrity** - Data validation, business rules, consistency

### Priority Levels
- **Critical** - Must pass for system acceptance (blocking issues)
- **High** - Important functionality that should work (major issues)
- **Medium** - Enhanced features that improve UX (minor issues) 
- **Low** - Nice-to-have functionality (cosmetic issues)

### Writing Good Acceptance Criteria
✅ **Good**: "User can log in with valid credentials and access dashboard"
❌ **Bad**: "Login works"

✅ **Good**: "Form validation prevents submission with invalid email format"
❌ **Bad**: "Validation works"

✅ **Good**: "Vehicle creation form accepts all required fields and saves to database"
❌ **Bad**: "Can create vehicles"

### Linking Steps to Objectives
Only include steps that directly contribute to proving the objective:
- **Include**: Actions that demonstrate the objective's functionality
- **Exclude**: Setup steps, navigation, cleanup steps
- **Focus**: On steps that would cause objective failure if they fail

### Example: Login Objective
```javascript
{
  id: "user_authentication",
  title: "User Authentication Validation",
  description: "Verify users can successfully authenticate with the system",
  category: "Authentication",
  priority: "Critical",
  acceptance_criteria: [
    "User can access login form",
    "Valid credentials allow successful authentication",
    "User is redirected to dashboard after login",
    "Authentication state is properly maintained"
  ],
  steps: ["fill", "click", "verify_state"], // Only auth-related steps
  dependencies: []
}
```

## ✅ Best Practices

### General Practices
1. **Descriptive Naming** - Use kebab-case: `feature-name.js`
2. **Clear Structure** - Add meaningful descriptions and preconditions
3. **Comprehensive Validation** - Validate each action result with health checks
4. **Error Handling** - Test error scenarios and recovery actions
5. **Screenshots** - Capture key states with descriptive names
6. **Selector Strategy** - Use stable selectors (IDs preferred)
7. **Wait Strategies** - Use `waitFor: 'networkIdle'` for API calls

### Objective Best Practices
1. **Business Focus** - Write from stakeholder perspective, not technical
2. **Measurable Criteria** - Each criterion should be specific and testable
3. **Logical Dependencies** - Map prerequisite relationships between objectives
4. **Appropriate Categorization** - Use consistent categories across scenarios
5. **Priority Based on Impact** - Critical = system unusable, High = major issues
6. **Step Mapping Precision** - Link only steps that directly prove the objective
7. **Clear Titles** - Objective titles should convey business value being tested

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