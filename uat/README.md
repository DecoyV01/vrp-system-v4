# Simplified UAT Framework

A streamlined User Acceptance Testing framework with direct MCP integration for the VRP System v4.

## 🎯 Architecture

The simplified UAT framework eliminates complex hook orchestration in favor of direct MCP tool execution:

```
User Request → Load Scenario → Generate MCP Calls → Claude Executes → Results
```

## 📁 Structure

```
uat/
├── scenarios/           # UAT scenario definitions (.cjs files)
├── uat-runner.js       # Main executor - converts scenarios to MCP calls
├── test-manual.js      # Manual testing utility
└── README.md           # This file
```

## 🚀 Usage

### Method 1: Direct Execution
```bash
cd uat
node uat-runner.js login-flow
node uat-runner.js vehicle-crud
node uat-runner.js error-handling
```

### Method 2: Manual Testing
```bash
cd uat
node test-manual.js login-flow
```

### Method 3: Slash Command (Planned)
```
/uat login-flow
/uat vehicle-crud
/uat error-handling
```

## 📋 Available Scenarios

- **login-flow**: Complete login and logout testing with validation
- **vehicle-crud**: Vehicle CRUD operations testing  
- **error-handling**: Error handling and validation testing

## 🔧 How It Works

1. **Load Scenario**: UAT runner loads the `.cjs` scenario file
2. **Convert Steps**: Each UAT step is converted to specific MCP function calls
3. **Output Plan**: Structured execution plan with exact function calls
4. **Execute**: Claude Code executes each MCP tool in sequence
5. **Capture**: Screenshots and results are automatically captured

## 📊 Example Output

```
🚀 UAT EXECUTION PLAN READY
══════════════════════════════════════════════════
📋 Scenario: login-flow
📝 Description: Complete login and logout flow with validation
🆔 Session: 2025-07-06T14-34-21
📊 Total Steps: 11

⚡ EXECUTE THESE MCP TOOLS IN SEQUENCE:

🔸 Step 1: Navigate to https://vrp-system-v4.pages.dev/
   Function: mcp__playwright__playwright_navigate({"url":"https://vrp-system-v4.pages.dev/"})

🔸 Step 2: Take screenshot: login-page
   Function: mcp__playwright__playwright_screenshot({"name":"login-page","savePng":true,"storeBase64":false})

...
```

## 🎯 Key Benefits

- **Simple**: 4 files vs 20+ in the old architecture
- **Reliable**: Direct MCP execution vs failed text-to-execution bridging
- **Maintainable**: No complex hook orchestration or state management
- **Effective**: Same detailed scenario testing with VERA methodology

## 🔄 Migration from Old Architecture

All existing UAT files have been archived to `../uat-archive/`. Only the `scenarios/` folder content remains unchanged - the detailed testing structure is preserved.

## 🛠 Development

### Adding New Scenarios

1. Create new `.cjs` file in `scenarios/` directory
2. Follow existing scenario structure (see `scenarios/login-flow.cjs`)
3. Test with `node uat-runner.js your-scenario`

### Supported UAT Actions

- `navigate`: Browser navigation
- `screenshot`: Visual capture
- `fill`: Form field input (single or multiple fields)
- `click`: Element interaction
- `verify_state`: State validation
- `logout`: Complex multi-step actions

### MCP Tool Mapping

- `navigate` → `mcp__playwright__playwright_navigate`
- `screenshot` → `mcp__playwright__playwright_screenshot`
- `fill` → `mcp__playwright__playwright_fill`
- `click` → `mcp__playwright__playwright_click`
- `verify_state` → `mcp__playwright__playwright_get_visible_text`

## 📚 References

- **Scenarios Guide**: `scenarios/HOW-TO-CREATE-SCENARIOS.md`
- **Old Architecture**: `../uat-archive/` (archived)
- **Project Documentation**: `../CLAUDE.md`

---

**VRP System UAT Framework v3.0.0 - Simplified Architecture**