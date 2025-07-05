# Claude Code UAT Framework Integration Guide

## The Architecture Challenge

The UAT framework was designed to work with Browser MCP tools, but it cannot directly access Claude's MCP tools from within the Node.js test runner. This is because:

1. Claude's MCP tools (mcp__playwright__) are only available in Claude's context
2. The Node.js test runner executes in a separate process without access to these tools
3. The framework needs Claude to act as the bridge between the test runner and Browser MCP

## Solution: Claude as the Test Executor

Instead of trying to make the test runner directly call MCP tools, Claude Code should:

1. **Read the test scenarios** from the UAT framework
2. **Execute the actions** using Browser MCP tools
3. **Report results** back to the framework

## Correct Integration Pattern

```javascript
// 1. Load the test scenario
const scenario = require('./uat/scenarios/login-flow.js');

// 2. Claude executes each step using Browser MCP
for (const step of scenario.steps) {
  switch (step.action) {
    case 'navigate':
      await mcp__playwright__playwright_navigate({ url: step.url });
      break;
    case 'fill':
      for (const [selector, value] of Object.entries(step.fields)) {
        await mcp__playwright__playwright_fill({ selector, value });
      }
      break;
    case 'click':
      await mcp__playwright__playwright_click({ selector: step.selector });
      break;
    case 'screenshot':
      await mcp__playwright__playwright_screenshot({ 
        name: step.name,
        savePng: true,
        downloadsDir: '/mnt/c/projects/vrp-system/v4/uat/screenshots'
      });
      break;
  }
}
```

## Updated Workflow

### Step 1: Initialize UAT Session
```bash
cd /mnt/c/projects/vrp-system/v4/uat
node uat-test-runner.cjs init
```

### Step 2: Load Test Scenario
Claude should read the scenario file directly:
```javascript
const fs = require('fs');
const scenarioPath = '/mnt/c/projects/vrp-system/v4/uat/scenarios/login-flow.js';
const scenario = require(scenarioPath);
```

### Step 3: Execute with Browser MCP
Claude executes each step using the actual MCP tools, following the scenario structure.

### Step 4: Report Results
After execution, update the test session with results.

## Why This Approach Works

1. **Preserves the UAT Framework Structure** - All scenarios, reports, and organization remain intact
2. **Uses Real Browser MCP** - Claude's actual MCP tools for true automation
3. **Maintains Test Orchestration** - The framework still defines what to test
4. **Enables Reporting** - Results can be written back to the framework

## Example: CRUD Project Create Test

```javascript
// Load the CRUD scenario
const crudScenario = {
  name: 'crud-project-create',
  steps: [
    { action: 'navigate', url: 'https://vrp-system-v4.pages.dev' },
    { action: 'screenshot', name: 'homepage' },
    { action: 'click', selector: '[data-testid="create-project"]' },
    { action: 'fill', fields: {
      '#project-name': 'Test Project',
      '#project-description': 'UAT Test Project'
    }},
    { action: 'click', selector: '[data-testid="save-project"]' },
    { action: 'screenshot', name: 'project-created' }
  ]
};

// Claude executes using Browser MCP
for (const step of crudScenario.steps) {
  // Execute step with appropriate MCP tool
}
```

## The Bridge Pattern

The UAT framework acts as the **test definition layer**, while Claude Code acts as the **execution layer**:

```
UAT Framework (Node.js)          Claude Code              Browser MCP
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ - Test Scenarios    │───>│ - Reads Scenarios│───>│ - Navigate      │
│ - Test Structure    │    │ - Executes Steps │    │ - Click         │
│ - Report Templates  │<───│ - Reports Results│    │ - Fill          │
│ - Session Management│    │                  │    │ - Screenshot    │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Steps for Claude

1. **Don't run `node uat-test-runner.cjs` directly** for execution
2. **Instead, read the scenario files** from `uat/scenarios/`
3. **Execute each step** using Browser MCP tools
4. **Write results** to `uat/reports/` following the framework structure
5. **Update session files** in `uat/sessions/` for tracking

This approach maintains the benefits of the UAT framework while working within Claude Code's constraints.