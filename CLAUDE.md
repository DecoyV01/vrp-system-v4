# CLAUDE.md

This file provides essential guidance to Claude Code when working with this VRP System v4 codebase.

See @docs/architecture.md for complete system overview and @docs/development-workflow.md for detailed development commands.

## Project Overview

VRP System v4 is a production-ready Vehicle Routing Problem management system built as a monorepo with React frontend and Convex backend. The system manages a four-level hierarchy: **Projects → Scenarios → Datasets → Tables**.

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- **Backend**: Convex serverless platform with real-time WebSocket database  
- **State**: Zustand (local) + Convex (server state with real-time sync)
- **Authentication**:

## Essential Commands

### Quick Start
```bash
npm run install:all              # Install all dependencies
npm run dev                      # Start frontend dev server (port 5173)
npm run dev:convex              # Start Convex backend in dev mode
npm run build                   # Build for production
```

### Frontend Quality Checks
```bash
npm run lint                    # ESLint check - ALWAYS run before commits
npm run type-check             # TypeScript validation
```

### Tech Contract Validation
```bash
# Automatic validation on git commits via .claude/hooks/optimization-check.sh
# Manual validation of specific files:
bash .claude/hooks/optimization-check.sh path/to/file.tsx
# View validation logs:
ls logs/contract-validation-*.log
```

### Convex Backend
```bash
npx convex dev                 # Start development backend  
npx convex deploy              # Deploy to production
npx convex codegen             # Generate TypeScript types
```

## Core Architecture Patterns

### Database Schema
- **Hierarchy**: Projects → Scenarios → Datasets → Tables (vehicles, jobs, locations, routes)
- **Key Files**: @convex/schema.ts (502 lines, 58 indexes), @convex/validation.ts
- **Patterns**: projectId ownership, _creationTime + updatedAt timestamps

### Frontend Components  
- **Layout**: Dual sidebar pattern (Primary + Secondary sidebars)
- **Table Editing**: Inline cell editing with real-time Convex sync
- **Key Files**: @frontend/src/components/table-editor/TableEditor.tsx, @frontend/src/hooks/useVRPData.ts

## UAT Testing Framework

**Quick Commands** (Natural Language - Recommended):
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"  
"Test UAT error handling scenarios"
```

**Manual Alternative**:
```bash
cd uat/ && node hybrid-uat-executor.js login-flow
# Execute MCP tools, then: node hybrid-uat-executor.js complete <session-id>
```

- **Available Scenarios**: login-flow, vehicle-crud, error-handling
- **Framework**: VERA methodology (Verify, Execute, Record, Analyze)
- **Reports**: Auto-generated in @uat/reports/[session-id]/

See @docs/uat-quick-reference.md for complete UAT guide.

## Environment Configuration

### Production Environment
- **Backend**: https://mild-elephant-70.convex.cloud (70+ functions deployed)
- **Frontend**: Ready for Cloudflare Pages deployment

### MCP Server Setup (After Reboot)
```bash
cd C:\projects\vrp-system\v4
npx @modelcontextprotocol/server-convex  # Keep terminal open
convex mcp start                         # Alternative Convex MCP server
```

## MCP Tools Available

This project supports multiple Model Context Protocol (MCP) servers providing specialized tools for development and testing.

### Convex MCP Server Tools
When `convex mcp start` is running, these tools are available:

**Database Operations:**
- `status`: Query available deployments and deployment selector
- `tables`: List tables with schemas and metadata  
- `data`: Paginate through table documents with filtering
- `runOneoffQuery`: Execute read-only JavaScript queries

**Function Management:**
- `functionSpec`: Get metadata about deployed functions
- `run`: Execute Convex functions with arguments

**Environment Variables:**
- `envList`: List deployment environment variables
- `envGet`: Retrieve specific environment variable values
- `envSet`: Set or update environment variables
- `envRemove`: Remove environment variables

### Playwright MCP Server Tools
For automated browser testing and UAT scenarios:

**Browser Control:**
- `playwright_navigate`: Navigate to URLs with viewport control
- `playwright_screenshot`: Capture full page or element screenshots
- `playwright_click`: Click elements by CSS selector
- `playwright_fill`: Fill input fields and forms
- `playwright_select`: Handle dropdown selections

**Advanced Interactions:**
- `playwright_hover`: Hover over elements
- `playwright_drag`: Drag and drop operations
- `playwright_upload_file`: File upload handling
- `playwright_press_key`: Keyboard input simulation

**Session Management:**
- `start_codegen_session`: Record actions for test generation
- `end_codegen_session`: Generate test files from recorded actions
- `playwright_close`: Clean up browser resources

**HTTP Operations:**
- `playwright_get/post/put/patch/delete`: HTTP requests
- `playwright_expect_response`: Wait for specific responses
- `playwright_assert_response`: Validate response content

**Content Extraction:**
- `playwright_get_visible_text`: Extract page text content
- `playwright_get_visible_html`: Get cleaned HTML structure
- `playwright_console_logs`: Retrieve browser console output

### Other MCP Servers Available

**Tavily (Web Search):**
- `tavily-search`: AI-powered web search with filtering
- `tavily-extract`: Extract content from specific URLs
- `tavily-crawl`: Structured website crawling
- `tavily-map`: Website structure mapping

**Filesystem Operations:**
- `read_file/write_file`: File content operations
- `list_directory/directory_tree`: Directory exploration
- `search_files`: Pattern-based file searching
- `move_file`: File operations

**Context7 (Documentation):**
- `resolve-library-id`: Find library documentation IDs
- `get-library-docs`: Retrieve up-to-date documentation

### MCP Usage Best Practices

1. **Browser Testing**: Use Playwright MCP for UAT scenarios and UI automation
2. **Database Operations**: Use Convex MCP for data exploration and function testing
3. **Research**: Use Tavily for external documentation and API research
4. **File Operations**: Use Filesystem MCP for codebase exploration
5. **Documentation**: Use Context7 for library-specific documentation

**Example Usage Patterns:**
```bash
# Convex database exploration
mcp__convex__tables                    # List all tables
mcp__convex__data <table-name>         # View table data
mcp__convex__run <function-name>       # Execute functions

# Browser automation for testing
mcp__playwright__navigate <url>        # Open application
mcp__playwright__fill <selector> <value>  # Fill forms
mcp__playwright__screenshot <name>     # Capture state
```

## Tech Contract Validation System

### Workflow Overview
The VRP System implements a comprehensive tech contract validation system that ensures code meets PRD requirements:

1. **PRD Creation**: Business requirements documented in `docs/10-pr/`
2. **Tech Contracts**: Technical specifications in `docs/11-tech-contracts/` (JSON format)
3. **Automated Validation**: Git hooks validate code against contracts
4. **Iterative Development**: Failed validations block commits with specific guidance
5. **Compliance Tracking**: Validation logs stored in `logs/contract-validation-*.log`

### Tech Contract Structure
```json
{
  "contractId": "TBL-CSV-001",
  "prdName": "table-editor-bulk", 
  "name": "CSV Import File Upload and Validation",
  "appliesTo": {
    "filePatterns": [".*CSVImport.*", ".*csv.*import.*"],
    "excludePatterns": [".*test.*", ".*spec.*"]
  },
  "requirements": {
    "fileSizeLimit": {
      "validation": {
        "codePatterns": ["50.*MB", "52428800"],
        "required": true
      }
    }
  }
}
```

### Contract Validation Process
- **Automatic**: Runs on every git commit via `.claude/hooks/optimization-check.sh`
- **Manual**: `bash .claude/hooks/optimization-check.sh <file-path>`
- **Reporting**: Detailed logs with pass/fail status for each requirement
- **Blocking**: Failed validations prevent commits until resolved

### Existing Contracts
- **TBL-CSV-001**: CSV Import functionality validation
- **LOC-GEO-001**: Master Locations geocoding integration

## Key Development Guidelines

### Code Patterns
- Use established project conventions and four-level hierarchy
- Leverage comprehensive schema and validation systems  
- Prefer editing existing files over creating new ones
- Follow shadcn/ui component patterns and Tailwind CSS v4
- **Tech Contracts**: Ensure implementation matches PRD-derived contracts

### Testing
- **Frontend**: Run `npm run lint` and `npm run type-check`
- **Tech Contracts**: Automatic validation on commits via hooks
- **UAT**: Use natural language UAT commands for integration testing
- **Backend**: Convex built-in validation and real-time error handling

### File Organization
- **Frontend**: @frontend/src/ with components/, hooks/, pages/, stores/
- **Backend**: @convex/ with separate files per entity (projects.ts, vehicles.ts, etc.)
- **Documentation**: @memory-bank/documentation/ with 9 organized categories
- **Tech Contracts**: @docs/11-tech-contracts/ with JSON contract files
- **Validation Logs**: @logs/ with timestamped validation results

## Important Files Reference

- **@convex/schema.ts**: Complete VRP database schema and relationships
- **@frontend/src/components/table-editor/TableEditor.tsx**: Main table editing component  
- **@frontend/src/hooks/useVRPData.ts**: Comprehensive VRP data hooks (338 lines)
- **@.claude/hooks/optimization-check.sh**: LEVER framework + tech contract validation
- **@docs/11-tech-contracts/**: Technical contract specifications (JSON)
- **@logs/contract-validation-*.log**: Validation result logs
- **@docs/architecture.md**: Detailed system architecture
- **@docs/development-workflow.md**: Complete development commands and workflow
- **@docs/table-editor.md**: Table editor architecture and bulk operations
- **@DEPLOYMENT.md**: Production deployment instructions
- **@memory-bank/documentation/**: Comprehensive project documentation

## Development Best Practices

- NEVER: proactively create documentation files unless explicitly requested
- ALWAYS: prefer editing existing files to creating new ones
- Use the established project patterns and conventions
- Follow the four-level hierarchy: Projects → Scenarios → Datasets → Tables
- Leverage the comprehensive schema and validation systems
- IMPORTANT: Always run tests after code changes
- NEVER commit code without running linting first
- When editing React components, you MUST check for TypeScript errors
- Class names: CamelCase, functions/variables: snake_case
- Import order: standard library → third-party → local modules
- Error handling: Use try/except with specific exceptions
- Provide descriptive error messages with traceback when appropriate

## High Priority:

### DRY (Don't Repeat Yourself)

- CRITICAL: Zero code duplication will be tolerated
- IMPORTANT: Each functionality must exist in exactly one place
- IMPORTANT: No duplicate files or alternative implementations allowed

### KISS (Keep It Simple, Stupid)

- ALWAYS: Implement the simplest solution that works
- NEVER over-engineering or unnecessary complexity
- IMPORTANT: Straightforward, maintainable code patterns

### Clean File System

- IMPORTANT: All existing files must be either used or removed
- IMPORTANT: No orphaned, redundant, or unused files
- CRITICAL: Clear, logical organization of the file structure

### Transparent Error Handling

- CRITICAL: No error hiding or fallback mechanisms that mask issues
- IMPORTANT: All errors must be properly displayed to the user
- IMPORTANT: Errors must be clear, actionable, and honest

### Success Criteria
In accordance with the established principles and previous PRDs, the implementation will be successful if:

- CRITICAL: Zero Duplication: No duplicate code or files exist in the codebase
- CRITICAL: Single Implementation: Each feature has exactly one implementation
- NEVER CREATE fallback systems that hide or mask errors
- ALWAYS: All errors are properly displayed to users (Transparent Errors)
- Component Architecture: UI is built from reusable, modular components
- ALWAYS: Consistent Standards - development follows @docs/04-development/Full Design System Guidelines Document-frontend.md
- IMPORTANT: Full Functionality- All features work correctly through template UI
- Complete Documentation: Implementation details are properly documented

