---
allowed-tools: Bash(*)
description: Execute UAT scenario with full automation and real-time reporting
---

## Context
- **Scenario to execute**: $ARGUMENTS
- **Fully Automated UAT**: This command uses the automated UAT executor with integrated MCP execution and real-time reporting
- **Available scenarios**: login-flow, vehicle-crud, error-handling

## Your task
Execute the UAT scenario "$ARGUMENTS" using the fully automated VRP System UAT framework. This will automatically execute all steps, capture screenshots, and generate comprehensive reports with zero manual intervention.

**Execute this command using the Bash tool**:
```bash
cd uat && node hybrid-uat-executor.js $ARGUMENTS
```

This will:
1. Load the scenario and create session with unique ID
2. Generate exact MCP function calls for you to execute
3. Create session-specific folders for screenshots and reports
4. Provide step-by-step execution guidance
5. Generate initial report template

**After executing all MCP tools, complete the session**:
```bash
cd uat && node hybrid-uat-executor.js complete <session-id>
```

This hybrid approach provides:
- Automated session management and planning
- Real MCP tool execution in Claude Code
- Proper screenshot organization
- Comprehensive VERA methodology reporting