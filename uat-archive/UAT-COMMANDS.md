# UAT Commands and Claude Code Integration

## Overview

This document covers UAT testing commands and the Claude Code hooks integration for automated UAT workflows. The UAT framework now supports both natural language requests (via hooks) and manual command execution.

## 🔗 Claude Code Hooks (Recommended)

### Natural Language UAT Requests

Use natural language that includes "uat" + scenario keywords:

```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"
"Test UAT error handling scenarios"
"Perform UAT authentication testing"
```

### What Happens Automatically

1. **Detection**: Hooks detect UAT intent from your message
2. **Session Initialization**: Unique UAT session created with metadata
3. **Command Enhancement**: Bash and Browser MCP commands enhanced for UAT
4. **Progress Tracking**: Real-time progress tracking with VERA phase identification
5. **Report Generation**: Comprehensive reports with screenshots and metrics

### Supported Scenarios

- **login-flow.cjs** - Complete login and logout testing
- **vehicle-crud.cjs** - Vehicle CRUD operations testing  
- **error-handling.cjs** - Error handling and validation testing

## Manual UAT Commands

### Core Command Structure

All UAT commands follow this pattern:
```bash
cd /mnt/c/projects/vrp-system/v4/uat && node uat-test-runner.cjs [command] [args] [--debug]
```

### Environment Commands

#### Validate Environment
```bash
node uat-test-runner.cjs validate
```
Checks all UAT prerequisites including:
- Node.js version compatibility
- Required directories and files
- Scenario file availability
- Helper script permissions

#### Initialize UAT System
```bash
node uat-test-runner.cjs init
```
Sets up the UAT environment:
- Injects health check validation framework
- Prepares browser automation
- Creates session tracking
- Verifies system readiness

#### List Available Scenarios
```bash
node uat-test-runner.cjs scenarios
```
Shows all available test scenarios with descriptions.

### Testing Commands

#### Login Testing
```bash
node uat-test-runner.cjs login [email] [password] [--debug]
```

Examples:
```bash
# Use default test credentials
node uat-test-runner.cjs login

# Use custom credentials
node uat-test-runner.cjs login test1@example.com testpassword123246

# Debug mode for detailed logging
node uat-test-runner.cjs login --debug
```

#### CRUD Operations Testing
```bash
node uat-test-runner.cjs crud [entity] [action] [--debug]
```

Examples:
```bash
node uat-test-runner.cjs crud project create
node uat-test-runner.cjs crud vehicle read
node uat-test-runner.cjs crud job update
node uat-test-runner.cjs crud dataset delete
```

Supported entities: `project`, `scenario`, `dataset`, `vehicle`, `job`, `location`
Supported actions: `create`, `read`, `update`, `delete`

#### Scenario Execution
```bash
node uat-test-runner.cjs scenario [scenario-name] [options]
```

Options:
- `--debug` - Enable verbose logging
- `--dry-run` - Validate steps without execution
- `--validate` - Check scenario structure only

Examples:
```bash
# Execute login flow scenario
node uat-test-runner.cjs scenario login-flow --debug

# Test vehicle CRUD operations
node uat-test-runner.cjs scenario vehicle-crud

# Validate scenario without execution
node uat-test-runner.cjs scenario error-handling --validate

# Dry run to check steps
node uat-test-runner.cjs scenario login-flow --dry-run
```

#### Report Generation
```bash
node uat-test-runner.cjs report [session-id]
```

Examples:
```bash
# Generate report for latest session
node uat-test-runner.cjs report

# Generate report for specific session
node uat-test-runner.cjs report 20250705-143022
```

## UAT Workflow Patterns

### Pattern 1: Natural Language (Recommended)

**Simple Request:**
```
"Run UAT for login flow"
```

**What Happens:**
1. Claude Code hooks detect UAT intent
2. Session automatically initialized
3. login-flow.cjs scenario executed
4. VERA methodology followed automatically
5. Comprehensive report generated

### Pattern 2: Manual Command Workflow

**Full Manual Workflow:**
```bash
# 1. Validate environment
node uat-test-runner.cjs validate

# 2. Initialize UAT system
node uat-test-runner.cjs init

# 3. Execute specific tests
node uat-test-runner.cjs login --debug
node uat-test-runner.cjs scenario vehicle-crud --debug

# 4. Generate final report
node uat-test-runner.cjs report
```

### Pattern 3: Development Testing

**Quick Testing:**
```bash
# Validate new scenario
node uat-test-runner.cjs scenario new-feature --validate

# Dry run to check steps
node uat-test-runner.cjs scenario new-feature --dry-run

# Execute with debugging
node uat-test-runner.cjs scenario new-feature --debug
```

## Command Options and Flags

### Global Options

- `--debug` - Enable verbose logging and detailed output
- `--help` - Show command-specific help information

### Scenario-Specific Options

- `--validate` - Validate scenario structure without execution
- `--dry-run` - Show execution plan without running actions
- `--timeout [ms]` - Override default timeout for scenario

### Examples with Options

```bash
# Debug mode with detailed logging
node uat-test-runner.cjs scenario login-flow --debug

# Validate scenario structure only
node uat-test-runner.cjs scenario vehicle-crud --validate

# Dry run to see execution plan
node uat-test-runner.cjs scenario error-handling --dry-run

# Custom timeout for long-running scenarios
node uat-test-runner.cjs scenario route-optimization --timeout 120000
```

## VERA Methodology Integration

### Verify Phase
- Health check validation (`window.__UAT_HEALTH__`)
- Precondition verification
- Element existence checks
- State validation

### Execute Phase
- Browser navigation and interaction
- Form filling and submission
- User action simulation
- API calls and data manipulation

### Record Phase
- Screenshot capture at key points
- DOM state snapshots
- Console log collection
- Network request monitoring

### Analyze Phase
- Result validation against expected outcomes
- Error detection and classification
- Performance metric collection
- Success/failure determination

## Integration with Browser MCP

### Browser Automation Support

The UAT framework integrates with both:
1. **Browser MCP** (`mcp__browsermcp__.*`) - Primary
2. **Playwright MCP** (`mcp__playwright__.*`) - Fallback

### Enhanced Commands

When running UAT with Browser MCP available:
- Screenshots automatically saved to UAT directories
- Navigation commands include UAT session context
- Form interactions tracked for reporting
- Visual validation captured

## Error Handling and Debugging

### Common Error Scenarios

#### Environment Issues
```bash
# Check environment setup
node uat-test-runner.cjs validate

# Reinitialize if needed
node uat-test-runner.cjs init
```

#### Scenario Failures
```bash
# Run with debug logging
node uat-test-runner.cjs scenario problem-scenario --debug

# Validate scenario structure
node uat-test-runner.cjs scenario problem-scenario --validate
```

#### Browser Integration Issues
```bash
# Check browser automation availability
node uat-test-runner.cjs init

# Use hooks for automatic handling
"Run UAT for login flow"
```

### Debug Information Sources

1. **Console Output** - Real-time execution logging
2. **Session Files** - `/uat/sessions/current.json`
3. **Report Files** - `/uat/reports/uat-report-*.json`
4. **Screenshots** - `/uat/screenshots/`
5. **Debug Logs** - Command output with `--debug` flag

## Best Practices

### 1. Use Natural Language When Possible
```
Preferred: "Run UAT for login flow"
Alternative: node uat-test-runner.cjs scenario login-flow --debug
```

### 2. Validate Before Executing
```bash
# Always validate new scenarios
node uat-test-runner.cjs scenario new-feature --validate
```

### 3. Use Debug Mode for Development
```bash
# Enable detailed logging
node uat-test-runner.cjs scenario test-name --debug
```

### 4. Check Environment Regularly
```bash
# Verify system readiness
node uat-test-runner.cjs validate
```

### 5. Monitor Session Progress
```bash
# Check active sessions
cat sessions/current.json

# Review completed sessions
ls sessions/*/session.json
```

## Advanced Usage

### Custom Scenario Development

1. **Create Scenario File:**
```bash
touch scenarios/custom-feature.cjs
```

2. **Define Scenario Structure:**
```javascript
// scenarios/custom-feature.cjs
module.exports = {
  name: 'custom-feature',
  description: 'Test custom feature implementation',
  timeout: 45000,
  steps: [
    // Scenario steps
  ]
};
```

3. **Test and Validate:**
```bash
node uat-test-runner.cjs scenario custom-feature --validate
node uat-test-runner.cjs scenario custom-feature --dry-run
node uat-test-runner.cjs scenario custom-feature --debug
```

4. **Use with Claude Code:**
```
"Run UAT for custom-feature"
```

### Automation Integration

The UAT commands can be integrated into CI/CD pipelines:

```bash
#!/bin/bash
# CI/CD UAT Pipeline

# Environment setup
cd /project/uat
node uat-test-runner.cjs validate || exit 1
node uat-test-runner.cjs init || exit 1

# Core testing
node uat-test-runner.cjs scenario login-flow || exit 1
node uat-test-runner.cjs scenario vehicle-crud || exit 1
node uat-test-runner.cjs scenario error-handling || exit 1

# Report generation
node uat-test-runner.cjs report
```

## Documentation References

- **Complete Workflow**: `UAT-COMPLETE-WORKFLOW.md`
- **Claude Code Integration**: `hooks/README.md`
- **Health Check Setup**: `HEALTH-CHECK-SETUP.md`
- **Scenario Creation**: `scenarios/HOW-TO-CREATE-SCENARIOS.md`
- **Browser Integration**: `BROWSER-MCP-INTEGRATION.md`

---

**Generated by VRP System UAT Framework v2.0.0 with Claude Code Integration**