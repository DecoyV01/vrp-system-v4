# Convex MCP Server Setup & Configuration Guide

## Overview
The Convex MCP (Model Context Protocol) server allows Claude Code to directly interact with your Convex database through a standardized protocol.

## Prerequisites
- Node.js 18+
- Convex CLI installed globally: `npm install -g convex`
- Active Convex project with deployment

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Convex Deployment
```bash
# Create/configure deployment (if needed)
convex dev --once

# This will:
# - Authenticate with Convex
# - Create deployment
# - Set up .env.local with CONVEX_DEPLOYMENT and CONVEX_URL
```

### 3. Start Convex MCP Server
```bash
# In your project directory
convex mcp start
```
**Note:** This command will hang - this is normal behavior. The server is waiting for MCP client connections.

### 4. Configure Claude Code (New Terminal)
```bash
# Add Convex MCP server to Claude Code
claude mcp add convex-server -- convex mcp start --project-dir /mnt/c/projects/vrp-system/v4

# Verify configuration
claude mcp list
claude mcp get convex-server
```

## Available Commands & Tools

### MCP Server Management
```bash
# List all configured MCP servers
claude mcp list

# Get details for specific server
claude mcp get convex-server

# Remove server
claude mcp remove convex-server
```

### Convex MCP Tools (via Claude Code)

#### 1. Status Tool
**Purpose:** Query available deployments and get deployment info
**Usage:** Ask Claude: "What's the status of my Convex deployment?"

#### 2. Tables Tool
**Purpose:** List all tables with schemas and data overview
**Usage:** 
- "What tables are in my Convex database?"
- "Show me the schema of my database"
- "List all tables and their structure"

#### 3. Query Execution (runOneoffQuery)
**Purpose:** Execute read-only JavaScript queries against your database
**Usage:**
- "Run a query to find all tasks"
- "Query the users table for recent entries"
- "Show me the count of items in each table"
- "Find all records where status is 'active'"

**Note:** All queries are sandboxed and read-only - cannot modify data

#### 4. Function Execution
**Purpose:** Call deployed Convex functions with arguments
**Usage:**
- "Execute the createTask function with these parameters"
- "Call the getUserProfile function for user ID 123"
- "Run the aggregateData function"

#### 5. Schema Analysis
**Purpose:** Analyze database structure and relationships
**Usage:**
- "Analyze the relationships between my tables"
- "What's the structure of the tasks table?"
- "Show me all indexes and their performance"

## Security & Safety Features
- **Read-only queries:** All MCP queries are sandboxed and cannot write to database
- **Function calls:** Can execute deployed functions (which may write data)
- **Authentication:** Uses your existing Convex deployment credentials
- **Project isolation:** Server is scoped to specific project directory

## Troubleshooting

### Server Not Starting
- Ensure you're in the correct project directory
- Verify `convex.json` exists
- Check authentication: `convex dev --once`

### Claude Code Can't Connect
- Verify server is running: `convex mcp start` should be hanging
- Check configuration: `claude mcp list`
- Restart Claude Code session

### Permission Issues
- Ensure proper Convex deployment access
- Check `.env.local` has correct CONVEX_DEPLOYMENT and CONVEX_URL

## Example Workflows

### Data Analysis
```
> "What tables do I have and how many records are in each?"
> "Show me the most recent entries in my tasks table"
> "Find all users created in the last week"
```

### Schema Exploration
```
> "Describe the structure of my database"
> "What are the relationships between tables?"
> "Show me all available functions I can call"
```

### Function Testing
```
> "List all available Convex functions"
> "Execute the getUserStats function"
> "Test the createTask function with sample data"
```

## Advanced Configuration

### Project-Scoped Server (Team Use)
```bash
claude mcp add convex-server -s project -- convex mcp start --project-dir $(pwd)
```

### User-Scoped Server (Cross-Project)
```bash
claude mcp add convex-server -s user -- convex mcp start --project-dir /path/to/project
```

### Disable Specific Tools
```bash
convex mcp start --disable-tools data,envSet --project-dir $(pwd)
```

### Production Deployment Access
```bash
convex mcp start --prod --project-dir $(pwd)
```

## Claude Code-Convex Development Lifecycle Commands

### 1. Project Initialization & Setup
```
> "Initialize a new Convex project structure"
> "Set up my database schema based on this data model"
> "Create the initial tables for my application"
> "Generate TypeScript types for my schema"
```

### 2. Schema Development & Migration
```
> "Add a new table for user profiles with these fields"
> "Modify the tasks table to include a priority field"
> "Create an index on the email field for faster lookups"
> "Show me the current schema and suggest optimizations"
> "Compare my local schema with the deployed version"
```

### 3. Function Development
```
> "Create a new mutation function to add tasks"
> "Write a query function to get user statistics"
> "Generate a function to handle user authentication"
> "Create an action to send email notifications"
> "Show me all functions and their signatures"
> "Test this function with sample data"
```

### 4. Data Operations & Testing
```
> "Seed my database with test data"
> "Run this query to validate my data structure"
> "Check data integrity across all tables"
> "Find any orphaned records or broken relationships"
> "Generate sample data for testing"
> "Clear test data from development database"
```

### 5. Debugging & Optimization
```
> "Debug why this query is running slow"
> "Show me the most expensive queries in my app"
> "Analyze database performance metrics"
> "Find functions that are throwing errors"
> "Check which indexes are being used"
> "Identify bottlenecks in my data access patterns"
```

### 6. Code Generation & Scaffolding
```
> "Generate CRUD operations for the users table"
> "Create React hooks for this Convex function"
> "Generate TypeScript interfaces for my data"
> "Create API endpoints that match my Convex functions"
> "Generate form validation based on my schema"
```

### 7. Deployment & Environment Management
```
> "Deploy my functions to production"
> "Compare development vs production schemas"
> "Check production deployment status"
> "Rollback to previous function version"
> "Switch between development and production data"
> "Validate production data consistency"
```

### 8. Monitoring & Analytics
```
> "Show me recent function execution logs"
> "Analyze user activity patterns in my data"
> "Generate usage statistics for my application"
> "Monitor real-time database connections"
> "Check for any error patterns in function calls"
> "Show me the most active tables and operations"
```

### 9. Collaboration & Code Review
```
> "Document all my Convex functions with JSDoc"
> "Generate API documentation for my functions"
> "Create migration scripts for schema changes"
> "Export my schema for team review"
> "Generate a database diagram showing relationships"
> "Create test cases for all my functions"
```

### 10. Integration & Full-Stack Development
```
> "Generate React components that use these Convex queries"
> "Create Next.js API routes that proxy to Convex"
> "Set up authentication flows with Convex Auth"
> "Integrate file uploads with Convex storage"
> "Create real-time subscriptions for this data"
> "Build a dashboard showing live database metrics"
```

### 11. Backup & Recovery
```
> "Export all data for backup purposes"
> "Create a snapshot of current database state"
> "Restore data from a specific timestamp"
> "Compare data between different environments"
> "Generate data migration scripts"
```

### 12. Performance & Scaling
```
> "Optimize queries for better performance"
> "Suggest indexing strategies for my workload"
> "Analyze memory usage of my functions"
> "Identify functions that should be cached"
> "Recommend database design improvements"
> "Plan for horizontal scaling of my data model"
```

## References
- [Convex MCP Documentation](https://docs.convex.dev/ai/convex-mcp-server)
- [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)