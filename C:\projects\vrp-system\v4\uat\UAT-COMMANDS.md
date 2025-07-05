# UAT Commands and Automation Configuration

## Overview

This document provides slash commands and hooks configuration for automated UAT testing workflows in Claude Code.

## Slash Commands

Add these to your Claude Code settings or use them directly in chat.

### /uat-init
Initialize UAT environment and inject all necessary scripts.

```markdown
/uat-init

Initialize the UAT testing environment:
1. Navigate to http://localhost:5173
2. Inject health check validation by checking if window.__UAT_HEALTH__ exists
3. Inject the validation script from the VALIDATION-SCRIPTS-GUIDE.md
4. Take a baseline screenshot using: powershell.exe -File /mnt/c/projects/vrp-system/v4/uat/uat-recorder.ps1 -action screenshot -filename "baseline"
5. Report the initialization status
```

### /uat-login
Execute login flow with full validation.

```markdown
/uat-login [email] [password]

Perform validated login test:
1. Run /uat-init if not already initialized
2. Navigate to login page
3. Use VERA workflow:
   - VERIFY: Check logged out state via health check
   - EXECUTE: Fill and submit login form
   - RECORD: Take screenshots before/after
   - ANALYZE: Verify successful login and redirect
4. Report results with screenshots
```

### /uat-crud
Test CRUD operations on a specific entity.

```markdown
/uat-crud [entity] [action]

Example: /uat-crud vehicle create

Perform CRUD test:
1. Ensure logged in (run /uat-login if needed)
2. Navigate to entity list page
3. Execute specified action (create/read/update/delete)
4. Validate using assertions and health checks
5. Take screenshots at each step
6. Verify data persistence
```

### /uat-scenario
Run a complete test scenario.

```markdown
/uat-scenario [scenario-name]

Available scenarios:
- full-login-flow
- vehicle-management
- job-creation
- route-optimization
- error-handling

Execute the specified scenario with full validation and reporting.
```

### /uat-report
Generate UAT test report.

```markdown
/uat-report

Generate comprehensive test report:
1. Compile all screenshots from current session
2. Create video from screenshots using ffmpeg
3. Summarize test results
4. List any failures with debugging info
5. Save report to uat/reports/
```

## Hooks Configuration

Add these to your Claude Code settings.json or project configuration.

### Pre-UAT Hook

```json
{
  "hooks": {
    "pre-uat": {
      "trigger": "before:uat-*",
      "script": "/mnt/c/projects/vrp-system/v4/uat/hooks/pre-uat.sh",
      "description": "Prepare UAT environment before any UAT command"
    }
  }
}
```

`pre-uat.sh`:
```bash
#!/bin/bash

echo "🚀 Preparing UAT environment..."

# Clean previous screenshots
/mnt/c/projects/vrp-system/v4/uat/uat-helper.sh clean

# Ensure directories exist
mkdir -p /mnt/c/projects/vrp-system/v4/uat/screenshots
mkdir -p /mnt/c/projects/vrp-system/v4/uat/reports
mkdir -p /mnt/c/projects/vrp-system/v4/uat/videos

# Check if app is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "⚠️  Warning: App not running on localhost:5173"
    echo "Starting development server..."
    cd /mnt/c/projects/vrp-system/v4/frontend
    npm run dev &
    sleep 5
fi

# Set test timestamp
export UAT_SESSION_ID=$(date +%Y%m%d-%H%M%S)
echo "Session ID: $UAT_SESSION_ID"

echo "✅ UAT environment ready"
```

### Post-UAT Hook

```json
{
  "hooks": {
    "post-uat": {
      "trigger": "after:uat-*",
      "script": "/mnt/c/projects/vrp-system/v4/uat/hooks/post-uat.sh",
      "description": "Clean up and generate reports after UAT commands"
    }
  }
}
```

`post-uat.sh`:
```bash
#!/bin/bash

echo "📊 Post-UAT processing..."

SESSION_ID=${UAT_SESSION_ID:-$(date +%Y%m%d-%H%M%S)}

# Generate video from screenshots
if ls /mnt/c/projects/vrp-system/v4/uat/screenshots/*.png 1> /dev/null 2>&1; then
    echo "Creating test video..."
    /mnt/c/projects/vrp-system/v4/uat/uat-helper.sh video $SESSION_ID
fi

# Generate summary report
REPORT_FILE="/mnt/c/projects/vrp-system/v4/uat/reports/report-$SESSION_ID.md"

cat > $REPORT_FILE << EOF
# UAT Test Report - $SESSION_ID

## Summary
- Session ID: $SESSION_ID
- Date: $(date)
- Screenshots: $(ls -1 /mnt/c/projects/vrp-system/v4/uat/screenshots/*.png 2>/dev/null | wc -l)

## Test Results
EOF

# Add test results (this would be populated by the actual tests)
if [ -f "/tmp/uat-results-$SESSION_ID.json" ]; then
    cat /tmp/uat-results-$SESSION_ID.json >> $REPORT_FILE
fi

echo "✅ Report generated: $REPORT_FILE"

# Optional: Open report in browser
# cmd.exe /c start $(wslpath -w $REPORT_FILE)
```

### On-Failure Hook

```json
{
  "hooks": {
    "uat-failure": {
      "trigger": "error:uat-*",
      "script": "/mnt/c/projects/vrp-system/v4/uat/hooks/on-failure.sh",
      "description": "Debug and capture additional info on UAT failure"
    }
  }
}
```

`on-failure.sh`:
```bash
#!/bin/bash

echo "🔍 UAT Failure - Collecting debug information..."

FAILURE_ID=$(date +%Y%m%d-%H%M%S)
DEBUG_DIR="/mnt/c/projects/vrp-system/v4/uat/debug/$FAILURE_ID"

mkdir -p $DEBUG_DIR

# Take failure screenshot
powershell.exe -File /mnt/c/projects/vrp-system/v4/uat/uat-recorder.ps1 \
    -action screenshot -filename "failure" -testName "debug-$FAILURE_ID"

# Collect browser console logs (if available)
echo "Attempting to collect browser logs..."

# Create debug summary
cat > $DEBUG_DIR/summary.md << EOF
# UAT Failure Debug Report

## Failure Information
- ID: $FAILURE_ID
- Time: $(date)
- Last Command: $CLAUDE_LAST_COMMAND

## Environment
- Node Version: $(node --version)
- NPM Version: $(npm --version)
- Working Directory: $(pwd)

## Application State
Check the screenshot and logs for more details.
EOF

echo "📁 Debug information saved to: $DEBUG_DIR"

# Trigger bug fix workflow if configured
if [ -n "$UAT_AUTO_FIX" ]; then
    echo "🔧 Triggering automatic bug fix workflow..."
    # This could trigger a Claude Code command to analyze and fix the issue
fi
```

## Complete Automation Workflow

### Setup Automated UAT Pipeline

Create `/mnt/c/projects/vrp-system/v4/uat/hooks/uat-pipeline.sh`:

```bash
#!/bin/bash

# UAT Automation Pipeline
# This script orchestrates the complete UAT workflow

set -e  # Exit on error

echo "🤖 Starting Automated UAT Pipeline"

# Source helper functions
source /mnt/c/projects/vrp-system/v4/uat/uat-helper.sh

# Configuration
export UAT_SESSION_ID=$(date +%Y%m%d-%H%M%S)
export UAT_AUTO_FIX=true
export UAT_SCREENSHOTS=true
export UAT_VIDEO=true

# Test scenarios to run
SCENARIOS=(
    "login-flow"
    "vehicle-crud"
    "job-management"
    "route-optimization"
)

# Results tracking
RESULTS_FILE="/tmp/uat-results-$UAT_SESSION_ID.json"
echo '{"session": "'$UAT_SESSION_ID'", "tests": []}' > $RESULTS_FILE

# Function to run a test scenario
run_scenario() {
    local scenario=$1
    local start_time=$(date +%s)
    
    echo "🧪 Running scenario: $scenario"
    
    # Run the scenario command
    if claude-code "/uat-scenario $scenario" > /tmp/uat-$scenario.log 2>&1; then
        local status="passed"
        echo "✅ $scenario: PASSED"
    else
        local status="failed"
        echo "❌ $scenario: FAILED"
        
        # Trigger failure hook
        /mnt/c/projects/vrp-system/v4/uat/hooks/on-failure.sh
        
        # Auto-fix if enabled
        if [ "$UAT_AUTO_FIX" = "true" ]; then
            echo "🔧 Attempting auto-fix..."
            claude-code "Analyze the UAT failure in /tmp/uat-$scenario.log and suggest fixes"
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Update results
    jq '.tests += [{"name": "'$scenario'", "status": "'$status'", "duration": '$duration'}]' \
        $RESULTS_FILE > $RESULTS_FILE.tmp && mv $RESULTS_FILE.tmp $RESULTS_FILE
}

# Main pipeline execution
main() {
    # Pre-UAT setup
    /mnt/c/projects/vrp-system/v4/uat/hooks/pre-uat.sh
    
    # Run all scenarios
    for scenario in "${SCENARIOS[@]}"; do
        run_scenario $scenario
        
        # Small delay between scenarios
        sleep 2
    done
    
    # Post-UAT processing
    /mnt/c/projects/vrp-system/v4/uat/hooks/post-uat.sh
    
    # Generate final report
    claude-code "/uat-report"
    
    # Summary
    echo "🎉 UAT Pipeline Complete!"
    echo "Results saved to: $RESULTS_FILE"
    
    # Open report in browser
    REPORT_FILE="/mnt/c/projects/vrp-system/v4/uat/reports/report-$UAT_SESSION_ID.md"
    if [ -f "$REPORT_FILE" ]; then
        cmd.exe /c start $(wslpath -w $REPORT_FILE)
    fi
}

# Run the pipeline
main
```

## Using Commands in Claude Code

### Basic Usage

```markdown
# Initialize and run login test
/uat-init
/uat-login test@example.com Test123!

# Run CRUD test
/uat-crud vehicle create

# Run full scenario
/uat-scenario full-login-flow

# Generate report
/uat-report
```

### Advanced Usage with Hooks

```markdown
# Run complete pipeline with auto-fix
export UAT_AUTO_FIX=true
/mnt/c/projects/vrp-system/v4/uat/hooks/uat-pipeline.sh
```

### Custom Scenarios

Create custom scenarios in `/mnt/c/projects/vrp-system/v4/uat/scenarios/`:

```javascript
// custom-scenario.js
module.exports = {
  name: 'custom-workflow',
  description: 'Test custom business workflow',
  steps: [
    {
      action: 'navigate',
      url: '/projects',
      validate: ['elementVisible', '.project-list']
    },
    {
      action: 'click',
      selector: '#create-project',
      validate: ['elementVisible', '.project-form']
    },
    {
      action: 'fill',
      fields: {
        '#project-name': 'Test Project',
        '#project-description': 'Automated test project'
      },
      validate: ['formIsValid', '#project-form']
    },
    {
      action: 'submit',
      validate: [
        'urlMatches', '/projects/',
        'textContains', '.success-message', 'created successfully'
      ]
    }
  ]
};
```

## Integration with CLAUDE.md

Add this to your project's CLAUDE.md:

```markdown
## UAT Testing

When performing UAT tests, use the following commands:

1. `/uat-init` - Initialize testing environment
2. `/uat-login` - Test login functionality  
3. `/uat-crud [entity] [action]` - Test CRUD operations
4. `/uat-scenario [name]` - Run predefined test scenarios
5. `/uat-report` - Generate test report

The UAT system includes:
- Automated screenshot capture
- Health check validation
- Assertion framework
- Video generation
- Failure debugging

For detailed UAT workflow, see: ./uat/UAT-COMPLETE-WORKFLOW.md
```

## Troubleshooting

### Commands Not Working

1. Ensure all scripts are executable:
   ```bash
   chmod +x /mnt/c/projects/vrp-system/v4/uat/**/*.sh
   ```

2. Check Claude Code has access to PowerShell:
   ```bash
   which powershell.exe
   ```

3. Verify hooks are properly configured in settings

### Screenshots Not Capturing

1. Check Windows permissions for screenshot access
2. Ensure PowerShell execution policy allows scripts
3. Try alternative screenshot method (Windows Game Bar)

### Auto-Fix Not Working

1. Ensure Claude Code has context about the failure
2. Provide detailed error logs
3. Check that fix suggestions are actionable

## Next Steps

1. Create the hook scripts in the specified locations
2. Test each command individually
3. Configure your preferred automation level
4. Customize scenarios for your specific workflows
5. Add the commands to your CLAUDE.md for easy reference