# CLAUDE.md - UAT Testing Framework Instructions

This file provides specific guidance to Claude Code when working with the VRP System UAT (User Acceptance Testing) framework.

## Overview

The UAT framework provides 99.99% accurate testing through the VERA methodology (Verify, Execute, Record, Analyze) with multi-layer validation including DOM assertions, health checks, and visual verification.

## How to Use UAT with Claude Code

### Launch Location
**Always launch Claude Code from the project root**: `/mnt/c/projects/vrp-system/v4/`

You do NOT need to launch from the UAT folder or configure anything in `.claude` folder. The UAT commands are standard Node.js CLI commands that Claude Code executes using the Bash tool.

### UAT Command Structure
All UAT commands follow this pattern:
```bash
cd /mnt/c/projects/vrp-system/v4/uat && node uat-test-runner.cjs [command] [args] [--debug]
```

### Available UAT Commands

#### Environment Commands
```bash
# Validate UAT environment
node uat-test-runner.cjs validate

# List available test scenarios
node uat-test-runner.cjs scenarios

# Show help
node uat-test-runner.cjs --help
```

#### Core Testing Commands
```bash
# Initialize UAT environment (run before any tests)
node uat-test-runner.cjs init

# Test login functionality
node uat-test-runner.cjs login [email] [password] [--debug]

# Test CRUD operations on VRP entities
node uat-test-runner.cjs crud [entity] [action] [--debug]
# Examples:
# node uat-test-runner.cjs crud project create
# node uat-test-runner.cjs crud vehicle delete

# Execute predefined test scenarios
node uat-test-runner.cjs scenario [scenario-name] [--debug] [--dry-run] [--validate]
# Examples:
# node uat-test-runner.cjs scenario login-flow
# node uat-test-runner.cjs scenario vehicle-crud --debug

# Generate comprehensive test reports
node uat-test-runner.cjs report [session-id]
```

## Claude Code UAT Workflow

### 1. Before Any UAT Testing
```bash
# Navigate to UAT directory
cd /mnt/c/projects/vrp-system/v4/uat

# Validate environment
node uat-test-runner.cjs validate

# Initialize UAT system
node uat-test-runner.cjs init
```

### 2. Running Tests
```bash
# Test specific functionality
node uat-test-runner.cjs login --debug

# Run comprehensive scenarios
node uat-test-runner.cjs scenario login-flow --debug

# Test CRUD operations
node uat-test-runner.cjs crud vehicle create --debug
```

### 3. After Testing
```bash
# Generate test report
node uat-test-runner.cjs report

# Review screenshots (if any)
ls -la screenshots/

# Review test results
cat reports/report-*.json
```

## Integration with Browser MCP

When Browser MCP is available, Claude Code should:

1. **Execute UAT commands** using the Bash tool
2. **Use Browser MCP** for actual browser automation when the UAT framework calls it
3. **Coordinate** between test execution and browser automation
4. **Capture results** through both UAT reports and Browser MCP screenshots

## Creating New Test Scenarios

### Location
All test scenarios go in: `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

### Process
1. **Create scenario file**: `touch scenarios/new-feature.js`
2. **Define scenario structure** (see HOW-TO-CREATE-SCENARIOS.md)
3. **Test the scenario**:
   ```bash
   node uat-test-runner.cjs scenario new-feature --validate
   node uat-test-runner.cjs scenario new-feature --dry-run
   node uat-test-runner.cjs scenario new-feature --debug
   ```

### Scenario Structure
```javascript
module.exports = {
  name: 'feature-name',
  description: 'Test description',
  timeout: 45000,
  preconditions: ['user must be logged in'],
  steps: [
    {
      action: 'navigate',
      url: '/path/to/test',
      validate: [
        ['elementVisible', '.page-content'],
        ['urlMatches', '/path/to/test']
      ]
    },
    {
      action: 'click',
      selector: '#button-id',
      validate: [
        ['elementVisible', '.result-panel']
      ]
    }
  ]
};
```

## Debugging UAT Tests

### Enable Debug Mode
Always use `--debug` flag for detailed logging:
```bash
node uat-test-runner.cjs scenario login-flow --debug
```

### Common Issues
1. **Environment not initialized**: Run `node uat-test-runner.cjs init` first
2. **Browser MCP not available**: Check browser automation setup
3. **Selector not found**: Verify element selectors in browser dev tools
4. **Health checks failing**: Ensure frontend health check system is implemented

### Debugging Commands
```bash
# Check environment
node uat-test-runner.cjs validate

# Dry run scenario (no execution)
node uat-test-runner.cjs scenario test-name --dry-run

# Validate scenario structure
node uat-test-runner.cjs scenario test-name --validate
```

## File Management with Claude Code

Claude Code can help with:

### Creating/Editing Scenarios
- Create new `.js` files in `scenarios/`
- Edit existing test scenarios
- Update validation assertions

### Reviewing Results
- Read test reports from `reports/`
- View screenshots from `screenshots/`
- Analyze failure logs

### Documentation
- Update scenario documentation
- Create test case documentation
- Generate test coverage reports

## Best Practices for Claude Code

### 1. Always Navigate to UAT Directory First
```bash
cd /mnt/c/projects/vrp-system/v4/uat
```

### 2. Validate Environment Before Testing
```bash
node uat-test-runner.cjs validate
```

### 3. Use Debug Mode for Development
```bash
node uat-test-runner.cjs [command] --debug
```

### 4. Initialize Before Running Tests
```bash
node uat-test-runner.cjs init
```

### 5. Generate Reports After Testing
```bash
node uat-test-runner.cjs report
```

## Error Handling

### Common Error Patterns
- **Module resolution errors**: Ensure all `.cjs` files have correct extensions
- **Browser not available**: Browser MCP integration needed for full functionality
- **Health check failures**: Frontend health check system must be implemented
- **Validation failures**: Check element selectors and expected values

### Recovery Actions
1. **Reset UAT environment**: `node uat-test-runner.cjs init`
2. **Check scenario syntax**: `node uat-test-runner.cjs scenario name --validate`
3. **Run in debug mode**: Add `--debug` flag to any command
4. **Review logs**: Check console output and error messages

## Integration Points

### With Frontend Development
- Health check endpoints (`window.__UAT_HEALTH__`)
- Test-friendly selectors and data attributes
- Error state management

### With Convex Backend
- API endpoint testing
- Database state validation
- Real-time update verification

### With Browser MCP
- Automated browser interactions
- Screenshot capture
- Form filling and navigation

## Documentation References

- **Complete Workflow**: `UAT-COMPLETE-WORKFLOW.md`
- **Health Check Setup**: `HEALTH-CHECK-SETUP.md`
- **Validation Framework**: `VALIDATION-SCRIPTS-GUIDE.md`
- **Command Reference**: `UAT-COMMANDS.md`
- **Scenario Creation**: `scenarios/HOW-TO-CREATE-SCENARIOS.md`

---

**Generated by VRP System UAT Framework v1.0.0**