# CLAUDE.md - UAT Testing Framework Instructions

This file provides specific guidance to Claude Code when working with the VRP System UAT (User Acceptance Testing) framework.

## Overview

The UAT framework provides 99.99% accurate testing through the VERA methodology (Verify, Execute, Record, Analyze) with multi-layer validation including DOM assertions, health checks, and visual verification. Now fully integrated with **Claude Code hooks** for automatic UAT detection and execution.

## 🔗 Claude Code Hooks Integration (Recommended)

### Automatic UAT Detection
Claude Code now automatically detects UAT requests and executes the VERA methodology through built-in hooks.

### UAT Request Format
Use natural language that includes:
1. **"uat" keyword** (required)
2. **Scenario keywords**: login, vehicle, crud, error, handling

### Examples
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"
"Test UAT error handling scenarios"
"Perform UAT authentication testing"
```

### What Happens Automatically
1. **Detection**: Hooks detect UAT intent from your message
2. **Session Init**: UAT session is automatically initialized with unique ID
3. **Command Enhancement**: Bash and Browser MCP commands are enhanced for UAT
4. **Progress Tracking**: Real-time progress tracking with VERA phase identification
5. **Report Generation**: Comprehensive reports with screenshots and metrics

### Available Scenarios
- **login-flow.cjs** - Complete login and logout testing
- **vehicle-crud.cjs** - Vehicle CRUD operations testing
- **error-handling.cjs** - Error handling and validation testing

## Manual UAT Commands (Alternative)

### Launch Location
**Always launch Claude Code from the project root**: `/mnt/c/projects/vrp-system/v4/`

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

### 1. Recommended: Use Natural Language (Hooks)
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"
"Test UAT error handling"
```

The hooks will automatically:
- Detect UAT intent
- Initialize session
- Execute VERA methodology
- Generate reports

### 2. Alternative: Manual Commands

#### Before Any UAT Testing
```bash
# Navigate to UAT directory
cd /mnt/c/projects/vrp-system/v4/uat

# Validate environment
node uat-test-runner.cjs validate

# Initialize UAT system
node uat-test-runner.cjs init
```

#### Running Tests
```bash
# Test specific functionality
node uat-test-runner.cjs login --debug

# Run comprehensive scenarios
node uat-test-runner.cjs scenario login-flow --debug

# Test CRUD operations
node uat-test-runner.cjs crud vehicle create --debug
```

#### After Testing
```bash
# Generate test report
node uat-test-runner.cjs report

# Review screenshots (if any)
ls -la screenshots/

# Review test results
cat reports/report-*.json
```

## Integration with Browser MCP

The UAT framework supports both Browser MCP and Playwright MCP:

1. **Primary**: Browser MCP (`mcp__browsermcp__.*`)
2. **Fallback**: Playwright MCP (`mcp__playwright__.*`)

When Browser MCP is available, Claude Code will:

1. **Execute UAT commands** using the Bash tool (enhanced by hooks)
2. **Use Browser MCP** for actual browser automation
3. **Coordinate** between test execution and browser automation
4. **Capture results** through both UAT reports and Browser MCP screenshots

## Creating New Test Scenarios

### Location
All test scenarios go in: `/mnt/c/projects/vrp-system/v4/uat/scenarios/`

### File Format
Use `.cjs` extension for CommonJS compatibility:
```bash
touch scenarios/new-feature.cjs
```

### Process
1. **Create scenario file**: `touch scenarios/new-feature.cjs`
2. **Define scenario structure** (see HOW-TO-CREATE-SCENARIOS.md)
3. **Test the scenario**:
   ```bash
   node uat-test-runner.cjs scenario new-feature --validate
   node uat-test-runner.cjs scenario new-feature --dry-run
   node uat-test-runner.cjs scenario new-feature --debug
   ```
4. **Test with Claude Code hooks**:
   ```
   "Run UAT for new-feature"
   ```

### Scenario Structure
```javascript
// scenarios/example.cjs
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

### With Claude Code Hooks
UAT sessions are automatically tracked. Check session progress:
```bash
# View current session
cat sessions/current.json

# View completed sessions
ls sessions/*/session.json
```

### Manual Debugging

#### Enable Debug Mode
Always use `--debug` flag for detailed logging:
```bash
node uat-test-runner.cjs scenario login-flow --debug
```

#### Common Issues
1. **Environment not initialized**: Run `node uat-test-runner.cjs init` first
2. **Browser MCP not available**: Check browser automation setup
3. **Selector not found**: Verify element selectors in browser dev tools
4. **Health checks failing**: Ensure frontend health check system is implemented

#### Debugging Commands
```bash
# Check environment
node uat-test-runner.cjs validate

# Dry run scenario (no execution)
node uat-test-runner.cjs scenario test-name --dry-run

# Validate scenario structure
node uat-test-runner.cjs scenario test-name --validate
```

## Claude Code Hooks Details

### Hook Components
- **uat-orchestrator.py**: PreToolUse hook that enhances commands for UAT
- **uat-progress-tracker.py**: PostToolUse hook that tracks execution progress
- **uat-finalizer.py**: Stop hook that generates reports and finalizes sessions

### Session Management
- Sessions are stored in `/uat/sessions/`
- Current session: `sessions/current.json`
- Completed sessions: `sessions/{sessionId}/session.json`

### Reports
- Generated in `/uat/reports/`
- Include VERA phase breakdown
- Capture screenshots, logs, and metrics

## File Management with Claude Code

Claude Code can help with:

### Creating/Editing Scenarios
- Create new `.cjs` files in `scenarios/`
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

### 1. Prefer Natural Language UAT Requests
```
"Run UAT for login flow" (Recommended)
```
vs
```bash
cd /mnt/c/projects/vrp-system/v4/uat && node uat-test-runner.cjs scenario login-flow --debug
```

### 2. Use Specific Keywords
Include both "uat" and scenario keywords:
- "uat" + "login" → login-flow scenario
- "uat" + "vehicle" → vehicle-crud scenario
- "uat" + "error" → error-handling scenario

### 3. Check Session Status
When debugging UAT issues:
```bash
# Check if UAT session is active
cat sessions/current.json

# Review recent reports
ls -la reports/
```

### 4. Validate Environment
Before complex UAT work:
```bash
node uat-test-runner.cjs validate
```

## Error Handling

### Common Error Patterns
- **Module resolution errors**: Scenario files now use `.cjs` extension
- **Browser not available**: Browser MCP integration with Playwright fallback
- **Health check failures**: Frontend health check system must be implemented
- **Validation failures**: Check element selectors and expected values

### Recovery Actions
1. **Reset UAT environment**: `node uat-test-runner.cjs init`
2. **Check scenario syntax**: `node uat-test-runner.cjs scenario name --validate`
3. **Run in debug mode**: Add `--debug` flag to any command
4. **Review session logs**: Check `sessions/current.json` for progress
5. **Use hooks**: Try natural language UAT requests for automatic handling

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

### With Claude Code Hooks
- Automatic UAT detection
- Session management
- Progress tracking
- Report generation

## Documentation References

### UAT Framework Documentation
- **Main UAT Guide**: `README.md` - UAT framework overview with Claude Code integration
- **Complete Workflow**: `UAT-COMPLETE-WORKFLOW.md` - VERA methodology implementation
- **Commands Reference**: `UAT-COMMANDS.md` - Natural language patterns and manual commands
- **Integration Architecture**: `CLAUDE-CODE-UAT-INTEGRATION.md` - Technical implementation details
- **Health Check Setup**: `HEALTH-CHECK-SETUP.md` - Frontend health check system
- **Validation Framework**: `VALIDATION-SCRIPTS-GUIDE.md` - Validation utilities
- **Scenario Creation**: `scenarios/HOW-TO-CREATE-SCENARIOS.md` - Creating new test scenarios
- **Claude Code Hooks**: `hooks/README.md` - Hook system implementation
- **Version History**: `CHANGELOG.md` - Release notes and migration guide

### Project Documentation
- **Root Claude Guide**: `../CLAUDE.md` - Main project documentation with UAT section
- **Project Overview**: `../README.md` - VRP System v4 overview
- **Development Guides**: `../memory-bank/documentation/04-development/` - Development patterns

---

**Generated by VRP System UAT Framework v2.0.0 with Claude Code Integration**