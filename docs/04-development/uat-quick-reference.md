# UAT Testing Quick Reference

## Natural Language Commands (Recommended)

Use these phrases with Claude Code for automatic UAT execution:

```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"  
"Test UAT error handling scenarios"
```

### Requirements
- Must include **"uat" keyword** (required)
- Must include **scenario keywords**: login, vehicle, crud, error, handling

### What Happens Automatically
1. **Detection**: Hooks detect UAT intent from your message
2. **Session Init**: UAT session automatically initialized with unique ID
3. **VERA Execution**: Framework follows Verify, Execute, Record, Analyze methodology  
4. **Reporting**: Comprehensive reports generated automatically

## Available Scenarios

- **login-flow.cjs** - Complete login and logout testing
- **vehicle-crud.cjs** - Vehicle CRUD operations testing  
- **error-handling.cjs** - Error handling and validation testing
- **location-crud.cjs** - Master Locations System CRUD testing
- **location-map.cjs** - Location map interface and geocoding testing
- **location-bulk.cjs** - Location bulk operations testing

## Manual Commands (Alternative)

If natural language doesn't work:

```bash
# Navigate to UAT directory
cd uat/

# Execute UAT scenario
node hybrid-uat-executor.js login-flow

# Follow the MCP tool execution instructions, then complete:
node hybrid-uat-executor.js complete <session-id>
```

## Key Features

- **VERA Methodology**: Verify, Execute, Record, Analyze
- **Browser Integration**: Browser MCP and Playwright MCP with fallback
- **Session Management**: Automatic session tracking with unique IDs
- **Screenshots**: Automatically captured and organized by session
- **Comprehensive Reporting**: Detailed test metrics and validation

## Integration Points

- **Frontend Health Checks**: Real-time application state monitoring
- **Browser Automation**: Both `mcp__browsermcp__*` and `mcp__playwright__*` tools
- **Convex Backend**: State validation and API monitoring
- **Scenario System**: CommonJS scenario definitions in `uat/scenarios/*.cjs`

## Report Locations

- **Reports**: `./uat/reports/[session-id]/uat-report.md`
- **Screenshots**: `./uat/screenshots/[session-id]/`
- **Session Data**: `./uat/reports/[session-id]/execution-plan.json`

## Detailed Documentation

- **Complete Guide**: @uat/README.md
- **Technical Architecture**: @uat-archive/CLAUDE-CODE-UAT-INTEGRATION.md
- **Scenario Creation**: @uat/scenarios/HOW-TO-CREATE-SCENARIOS.md
- **Command Reference**: @uat-archive/UAT-COMMANDS.md

## UAT Framework Version

v3.0.0 - Simplified Architecture with Improved Reporting