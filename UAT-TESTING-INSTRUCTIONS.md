# 🛑 MANDATORY: Use UAT Framework for All Testing

## DO NOT USE BROWSER MCP DIRECTLY!

This project has a **comprehensive UAT testing framework** that MUST be used. The framework is located in the `uat/` directory and provides multi-step test orchestration.

## The ONLY Correct Way to Run UAT Tests:

```bash
# 1. Navigate to UAT directory
cd /mnt/c/projects/vrp-system/v4/uat

# 2. Run tests using the UAT framework
node uat-test-runner.cjs crud project create --debug
```

## Why You MUST Use the UAT Framework:

1. **Multi-Step Test Scenarios** - Pre-built test workflows in `scenarios/` directory
2. **Proper Test Orchestration** - Manages browser sessions, screenshots, and validations
3. **Comprehensive Reporting** - Generates detailed test reports with screenshots
4. **Health Check Integration** - Uses frontend UAT health check system
5. **VERA Methodology** - Implements Verify, Execute, Record, Analyze approach

## Framework Structure:

```
uat/
├── CLAUDE.md                    # Complete framework documentation
├── engine/
│   ├── test-runner.cjs         # Main test runner
│   ├── action-processors.cjs   # Handles all browser actions
│   └── browser-mcp.cjs         # Browser MCP integration
├── scenarios/
│   ├── login-flow.js           # Login test scenario
│   └── vehicle-crud.js         # CRUD test scenarios
└── reports/                    # Test execution reports
```

## Available Commands:

```bash
# Initialize environment
node uat-test-runner.cjs init

# Run CRUD tests
node uat-test-runner.cjs crud project create
node uat-test-runner.cjs crud project read
node uat-test-runner.cjs crud project update
node uat-test-runner.cjs crud project delete

# Run specific scenarios
node uat-test-runner.cjs login-flow
node uat-test-runner.cjs vehicle-crud

# Generate report
node uat-test-runner.cjs report
```

## Important Files to Read:

1. `uat/CLAUDE.md` - Complete UAT framework guide
2. `uat/UAT-COMPLETE-WORKFLOW.md` - End-to-end testing workflow
3. `uat/scenarios/HOW-TO-CREATE-SCENARIOS.md` - How scenarios work

## Example Test Execution:

When you run `node uat-test-runner.cjs crud project create --debug`, the framework will:

1. Load the project creation scenario
2. Navigate to https://vrp-system-v4.pages.dev
3. Execute login flow
4. Fill project creation form
5. Submit and validate
6. Capture screenshots at each step
7. Generate comprehensive report

## DO NOT:
- Call Browser MCP tools directly
- Write custom browser automation scripts
- Bypass the UAT framework

## DO:
- Use the UAT test runner
- Follow the multi-step scenarios
- Read the framework documentation
- Generate and review test reports

The UAT framework is the ONLY approved method for testing this application!