# VRP System UAT Testing Framework

## 🎯 Overview

A comprehensive User Acceptance Testing (UAT) framework for the VRP System v4, designed to achieve 99.99% accuracy through multi-layer verification using the VERA methodology (Verify, Execute, Record, Analyze). Now fully integrated with **Claude Code hooks** for automatic UAT detection and execution.

## 🚀 Quick Start

### With Claude Code (Recommended)
Use natural language requests that include "uat" + scenario keywords:

```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests" 
"Test UAT error handling"
```

Claude Code will automatically detect UAT intent and execute the VERA methodology.

### Manual Command Line
```bash
# Initialize UAT environment
node uat-test-runner.cjs init

# Test login functionality
node uat-test-runner.cjs login

# Test CRUD operations
node uat-test-runner.cjs crud vehicle create

# Run scenario tests
node uat-test-runner.cjs scenario login-flow

# Generate test report
node uat-test-runner.cjs report
```

## 🔗 Claude Code Integration

### UAT Detection
The framework automatically detects UAT requests containing:
1. **"uat" keyword** (required)
2. **Scenario keywords**: login, vehicle, crud, error, handling

### Available Scenarios
- **login-flow.cjs** - Complete login and logout testing
- **vehicle-crud.cjs** - Vehicle CRUD operations testing
- **error-handling.cjs** - Error handling and validation testing

### How It Works
1. **Detection**: Claude Code hooks detect UAT intent from your messages
2. **Session Init**: UAT session is automatically initialized
3. **VERA Execution**: Framework follows Verify, Execute, Record, Analyze methodology
4. **Reporting**: Comprehensive reports generated automatically

## 🎯 Success Metrics

The UAT framework targets **99.99% accuracy** through:

- ✅ **Multi-layer validation** (DOM + Health checks + Visual)
- ✅ **Comprehensive error capture** (JavaScript + Network + UI)
- ✅ **State verification** (Authentication + Data loading + Navigation)
- ✅ **Visual documentation** (Screenshots + Videos + Reports)
- ✅ **Automated debugging** (Failure capture + Debug info + Recovery suggestions)
- ✅ **Claude Code hooks integration** (Automatic UAT detection and execution)

## 🚀 Complete System Usage

### 1. Environment Setup

```bash
# Check environment is ready
node uat-test-runner.cjs validate

# Initialize UAT system
node uat-test-runner.cjs init
```

### 2. Run Tests

**With Claude Code (Natural Language):**
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"
"Test UAT error handling scenarios"
```

**Manual Command Line:**
```bash
# Test login functionality
node uat-test-runner.cjs login

# Test CRUD operations
node uat-test-runner.cjs crud vehicle create

# Run complete scenarios
node uat-test-runner.cjs scenario login-flow

# Generate comprehensive reports
node uat-test-runner.cjs report
```

### 3. Available Commands

- **init** - Initialize UAT environment and inject validation framework
- **login** - Test authentication with health check verification
- **crud** - Test CRUD operations on all VRP entities
- **scenario** - Execute predefined test scenarios with full validation
- **report** - Generate detailed reports with screenshots and videos

## 🎯 Key Features Implemented

### VERA Methodology Integration

- ✅ **Verify**: Health checks, preconditions, element validation
- ✅ **Execute**: Browser automation, form filling, navigation
- ✅ **Record**: Screenshots, DOM snapshots, console logs
- ✅ **Analyze**: State comparison, error detection, success validation

### 99.99% Accuracy Through Multi-Layer Validation

- ✅ **DOM Assertions**: Element existence, visibility, text content
- ✅ **Health Check Integration**: `window.__UAT_HEALTH__` state validation
- ✅ **Visual Verification**: Screenshot capture at every step
- ✅ **Error Detection**: JavaScript errors, form validation, API failures
- ✅ **Performance Monitoring**: Network requests, load times

### Comprehensive Test Coverage

- ✅ **Authentication Flows**: Login/logout with credential validation
- ✅ **CRUD Operations**: All VRP entities (projects, scenarios, datasets, vehicles, jobs)
- ✅ **Form Validation**: Client-side and server-side error handling
- ✅ **Navigation**: Route verification and deep linking
- ✅ **Error Scenarios**: Network failures, timeouts, invalid data

### Claude Code Hooks Integration

- ✅ **Automatic Detection**: Recognizes UAT requests from natural language
- ✅ **Session Management**: Tracks UAT sessions with detailed metadata
- ✅ **Progress Tracking**: Real-time progress monitoring during execution
- ✅ **Report Generation**: Automatic report creation with VERA methodology breakdown

## 🔗 Integration Points

The UAT system seamlessly integrates with:
- ✅ **Claude Code Hooks**: Automatic UAT detection and orchestration
- ✅ **Frontend Health Checks**: Real-time application state monitoring
- ✅ **Browser MCP & Playwright MCP**: Automated browser interactions with fallback support
- ✅ **Existing Scenarios**: CommonJS scenario definitions are fully executable
- ✅ **PowerShell Scripts**: Screenshot and video capture (WSL-compatible)
- ✅ **Convex Backend**: State validation and API monitoring

## 🎯 Next Steps

The UAT framework is now **production-ready** and can be used immediately for:

1. **Claude Code Integration**: Use natural language to request UAT testing
2. **Manual Testing**: Run individual commands for specific test scenarios
3. **CI/CD Integration**: Automate UAT testing in deployment pipelines
4. **Regression Testing**: Verify application functionality after changes
5. **Performance Testing**: Monitor load times and responsiveness
6. **Error Detection**: Catch UI bugs and JavaScript errors

The framework provides the **complete bridge** between scenario definitions and actual test execution, enabling the 99.99% accurate UAT testing system! 🚀

## 🔧 Available Commands

```bash
# Environment commands
node uat-test-runner.cjs --help      # Show help
node uat-test-runner.cjs scenarios   # List scenarios
node uat-test-runner.cjs validate    # Check environment

# Test commands
node uat-test-runner.cjs init        # Initialize UAT
node uat-test-runner.cjs login       # Test login
node uat-test-runner.cjs crud vehicle create  # Test CRUD
node uat-test-runner.cjs scenario login-flow  # Run scenario
node uat-test-runner.cjs report      # Generate report
```

## 📝 Creating New UAT Test Scenarios

### Where to Add New Scenarios

**Location**: `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

All UAT test scenarios are stored as `.cjs` files in the `scenarios/` directory. Each file represents a complete test workflow.

### Step-by-Step Guide

#### 1. Create the Scenario File

```bash
# Create a new scenario file (replace 'feature-name' with your feature)
touch /mnt/c/projects/vrp-system/v4/uat/scenarios/feature-name.cjs
```

#### 2. Define the Scenario Structure

```javascript
// /mnt/c/projects/vrp-system/v4/uat/scenarios/route-optimization.cjs

module.exports = {
  name: 'route-optimization',
  description: 'Test route optimization feature with multiple stops',
  timeout: 60000, // Optional: Override default timeout
  preconditions: [
    'user must be logged in',
    'project with vehicles and jobs must exist'
  ],
  steps: [
    // Step definitions go here
  ]
};
```

### Available Action Types

#### Navigation Actions
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

#### Interaction Actions
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

#### Verification Actions
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

### Testing Your New Scenario

#### 1. Validate Scenario Structure
```bash
node uat-test-runner.cjs scenario your-scenario-name --validate
```

#### 2. Dry Run (Check Steps Without Execution)
```bash
node uat-test-runner.cjs scenario your-scenario-name --dry-run
```

#### 3. Execute the Scenario
```bash
node uat-test-runner.cjs scenario your-scenario-name --debug
```

#### 4. Using Claude Code
```
"Run UAT for your-scenario-name"
```

## 📚 Documentation

- **Complete Workflow**: `UAT-COMPLETE-WORKFLOW.md`
- **Commands Reference**: `UAT-COMMANDS.md`
- **Health Check Setup**: `HEALTH-CHECK-SETUP.md`
- **Validation Scripts**: `VALIDATION-SCRIPTS-GUIDE.md`
- **Scenario Examples**: `scenarios/README.md`
- **Claude Code Integration**: `hooks/README.md`
- **Browser Integration**: `BROWSER-MCP-INTEGRATION.md`

---

**Generated by VRP System UAT Framework v2.0.0 with Claude Code Integration**