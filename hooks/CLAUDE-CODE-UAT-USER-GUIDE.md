# Claude Code UAT User Guide

**Version**: 1.0.0  
**Created**: July 5, 2025  
**Purpose**: Complete user guide for Claude Code UAT hook-based testing

## Introduction

The Claude Code UAT hooks provide seamless, automatic UAT testing orchestration through natural language. No more manual initialization scripts or complex setup procedures - just tell Claude Code what you want to test!

## Quick Reference

### Trigger UAT Testing
```
"Test login-flow scenario"
"Run vehicle-crud testing"
"Verify user authentication"
"Execute dashboard functionality test"
```

### Check Results
- **Reports**: `/uat/reports/session-report-*.json`
- **Screenshots**: `/uat/screenshots/{session-id}/`
- **Archives**: `/uat/archive/{year-month}/`

## Complete User Workflows

### Workflow 1: Testing Login Functionality

**Goal**: Test the complete user authentication flow

#### 1. Start UAT Testing
```
"Please test the login-flow scenario"
```

**What happens automatically:**
- UAT context detected with high confidence
- Login-flow scenario loaded and validated
- UAT session initialized with unique ID
- Screenshot directory created

#### 2. Follow UAT Execution
Claude Code will automatically:
- Navigate to the login page with enhanced parameters
- Fill login credentials with proper timing
- Click submit button with validation
- Take screenshots at each step with UAT naming
- Verify login success with health checks

#### 3. Monitor Progress
The hooks automatically track:
- Step completion (1/5, 2/5, etc.)
- Execution timing and performance
- Screenshot capture and validation
- Error detection and recovery

#### 4. Session Completion
When Claude Code session ends:
- Comprehensive report generated automatically
- All files archived with organized structure
- UAT statistics updated
- Temporary files cleaned up

### Workflow 2: Vehicle Management Testing

**Goal**: Test CRUD operations for vehicle management

#### 1. Initialize Testing
```
"Run vehicle-crud scenario testing"
```

#### 2. Guided Execution
Ask for specific operations:
```
"Navigate to vehicles page and create a new vehicle"
"Fill in vehicle details and submit the form"
"Take a screenshot of the vehicle list"
"Edit the vehicle we just created"
"Delete the test vehicle"
```

#### 3. Validation
```
"Verify all vehicle operations completed successfully"
"Take a final screenshot of the vehicle dashboard"
```

### Workflow 3: Exploratory Testing

**Goal**: Test specific functionality without predefined scenarios

#### 1. Start with Intent
```
"I want to test the dashboard functionality"
```

**Result**: Medium confidence detection, hooks enhance Browser MCP usage

#### 2. Guided Testing
```
"Navigate to the dashboard"
"Take a screenshot of the main dashboard"
"Click on the projects section"
"Verify the projects are loading correctly"
"Test the search functionality"
```

#### 3. Document Results
```
"Generate a summary of what we tested"
```

## Natural Language Patterns

### High-Confidence Triggers (Auto-Initialize UAT)
These phrases automatically initialize UAT sessions:

#### Explicit Scenario References
- "Test {scenario-name} scenario"
- "Run {scenario-name} UAT"
- "Execute {scenario-name} test"
- "Perform {scenario-name} testing"

#### Scenario-Specific Patterns
- "Test login flow" → login-flow scenario
- "Test vehicle CRUD" → vehicle-crud scenario
- "Test user registration" → user-registration scenario

#### Action + Testing Keywords
- "Test authentication functionality"
- "Verify login process"
- "Validate user flow"
- "Check CRUD operations"

### Medium-Confidence Triggers (Enhanced Browser Usage)
These phrases enhance Browser MCP tools without full UAT initialization:

- "Test functionality"
- "Verify feature"
- "Validate system"
- "Check application"
- "Navigate and test"
- "Fill form and verify"

### Browser Action Enhancement
When UAT is active, these actions are automatically enhanced:

- "Navigate to {url}" → Enhanced with timeouts, headless settings, base URL resolution
- "Take screenshot" → Enhanced with UAT naming, organized directories
- "Fill form" → Enhanced with better timeouts, validation hooks
- "Click button" → Enhanced with wait conditions, error handling

## Understanding UAT Session Lifecycle

### Session Initialization
```
User: "Test login-flow scenario"
↓
1. PreToolUse hook detects UAT intent (confidence: 95%)
2. login-flow scenario validated and loaded
3. Session state created: uat-20250705-143022-abc123
4. Directories created: /uat/screenshots/uat-20250705-143022-abc123/
5. First Browser MCP tool enhanced with UAT context
```

### Session Execution
```
Each Browser MCP tool call:
↓
1. PreToolUse hook enhances parameters (screenshots, timeouts, URLs)
2. Tool executes with enhanced configuration
3. PostToolUse hook captures results and updates progress
4. Step advancement logic evaluates completion
5. Performance metrics updated
```

### Session Finalization
```
Claude Code session ends:
↓
1. Stop hook detects UAT session was active
2. Comprehensive report generated with all metrics
3. Session files archived with organized structure
4. UAT framework statistics updated
5. Temporary files cleaned up
```

## Working with UAT Reports

### Report Structure
Each session generates a comprehensive JSON report:

```json
{
  "meta": {
    "reportId": "session-report-abc123-20250705",
    "generatedAt": "2025-07-05T14:35:16Z",
    "reportType": "session_finalization"
  },
  "session": {
    "sessionId": "uat-20250705-143022-abc123",
    "scenario": "login-flow",
    "duration": 45230,
    "terminationReason": "normal"
  },
  "execution": {
    "totalSteps": 5,
    "completedSteps": 5,
    "completionRate": 1.0,
    "status": "completed"
  },
  "performance": {
    "averageStepDuration": 2340,
    "toolCallCount": 8,
    "successRate": 1.0
  },
  "screenshots": {
    "totalScreenshots": 3,
    "successfulScreenshots": 3,
    "screenshotList": [...]
  },
  "summary": {
    "status": "completed",
    "message": "Session completed successfully with all steps executed",
    "recommendations": []
  }
}
```

### Key Metrics to Review

#### Completion Metrics
- `completionRate`: Percentage of steps completed (0.0 to 1.0)
- `status`: "completed", "failed", or "incomplete"
- `completedSteps` vs `totalSteps`

#### Performance Metrics
- `averageStepDuration`: Average time per step in milliseconds
- `successRate`: Percentage of successful tool executions
- `fastestStep` / `slowestStep`: Performance outliers

#### Quality Metrics
- `validationRate`: Percentage of successful validations
- `screenshotCaptureRate`: Screenshot success rate
- `errorCount`: Total errors encountered

### Using Report Recommendations

Reports include actionable recommendations:

- **"Review error logs for debugging"**: Check `errors` array in report
- **"Consider re-running incomplete scenario"**: Low completion rate detected
- **"Investigate validation failures"**: Low validation success rate
- **"Check screenshot capture configuration"**: Screenshot failures detected

## Advanced Usage Patterns

### Custom Scenario Testing
```
"I want to test a custom scenario for project creation"
```

**Result**: Hooks enhance Browser MCP usage even without predefined scenario

### Multi-Step Testing
```
"Test the complete user journey from registration to project creation"
```

**Approach**: Break into logical steps, hooks track progress across the entire flow

### Regression Testing
```
"Run the login-flow scenario to check for regressions"
```

**Benefit**: Consistent testing approach with automated reporting for comparison

### Performance Testing
```
"Test login performance and capture timing metrics"
```

**Result**: Detailed performance data in session reports

## Error Handling and Recovery

### Common Error Scenarios

#### Scenario Not Found
```
User: "Test nonexistent-scenario"
Hook Response: Block with error message about invalid scenario
Solution: Use available scenarios (login-flow, vehicle-crud, user-registration)
```

#### Navigation Failures
```
Error: Page load timeout
Hook Response: Records error in session state, continues with next step
Solution: Check network connectivity, verify URLs
```

#### Screenshot Failures
```
Error: Screenshot directory not accessible
Hook Response: Logs warning, continues session
Solution: Check disk space and permissions
```

### Recovery Strategies

#### Session State Corruption
- Hooks include validation and recovery logic
- Stale lock files automatically cleaned up
- Backup session state maintained

#### Partial Completion
- Reports show exact completion status
- Recommendations provided for next steps
- Session data preserved for analysis

## Best Practices

### 1. Clear Communication
✅ **Good**: "Test login-flow scenario"  
❌ **Unclear**: "Check if login works"

✅ **Good**: "Navigate to /auth/login and verify page loads"  
❌ **Unclear**: "Go to login"

### 2. Sequential Execution
✅ **Good**: Wait for each step to complete before next action  
❌ **Problematic**: Rapid-fire commands that don't allow processing

### 3. Meaningful Screenshots
✅ **Good**: "Take a screenshot of the login form"  
❌ **Less useful**: "Take a screenshot"

### 4. Error Acknowledgment
✅ **Good**: "The previous step failed, let's troubleshoot"  
❌ **Problematic**: Ignoring error messages and continuing

### 5. Session Scope
✅ **Good**: One scenario per Claude Code session  
❌ **Confusing**: Multiple scenarios in single session

## Integration Tips

### With Existing Workflows
- Hooks work alongside manual UAT processes
- Reports can be integrated into CI/CD pipelines
- Screenshots useful for bug reports and documentation

### With Development Process
- Use after feature implementation for immediate testing
- Run before releases for regression verification
- Leverage reports for performance monitoring

### With Team Collaboration
- Share session reports for test evidence
- Use screenshots for visual confirmation
- Archive sessions for historical comparison

## Troubleshooting Guide

### UAT Not Triggering

**Symptoms**: Browser MCP tools work but no UAT enhancement
**Diagnosis**: 
1. Check if hooks are registered: type `/hooks` in Claude Code
2. Verify you're in project root: `/mnt/c/projects/vrp-system/v4`
3. Check scenario availability: `ls uat/scenarios/`

**Solutions**:
- Re-register hooks following setup guide
- Use more explicit UAT trigger phrases
- Verify scenario files are valid

### Poor Performance

**Symptoms**: Hooks taking too long, timeouts
**Diagnosis**:
1. Check disk space: `df -h`
2. Verify file permissions: `ls -la uat/`
3. Look for large session files: `du -sh uat/sessions/*`

**Solutions**:
- Clean up old sessions: `rm -rf uat/sessions/temp-*`
- Archive old reports: move files from `uat/reports/` to backup
- Check system resources

### Report Generation Issues

**Symptoms**: Sessions complete but no reports generated
**Diagnosis**:
1. Check reports directory: `ls -la uat/reports/`
2. Verify write permissions: `touch uat/reports/test.txt`
3. Check for JSON syntax errors in session state

**Solutions**:
- Create missing directories: `mkdir -p uat/reports`
- Fix permissions: `chmod -R 755 uat/`
- Clean up corrupted session files

## Getting Help

### Log Analysis
Hook execution details are logged to stderr in Claude Code session. Look for:
- `[INFO]` messages: Normal operation
- `[WARN]` messages: Non-fatal issues
- `[ERROR]` messages: Problems requiring attention

### Debug Mode
Enable detailed logging:
```bash
export UAT_LOG_LEVEL=debug
# Restart Claude Code session
```

### Session Data Inspection
Check session state manually:
```bash
cat uat/sessions/claude-session-*.json | jq '.'
```

### Community Resources
- Check project documentation in `memory-bank/documentation/`
- Review implementation plan: `memory-bank/documentation/08-plans/`
- Examine hook source code: `hooks/claude-uat-*.sh`

---

**Happy Testing!** The Claude Code UAT hooks are designed to make testing effortless and comprehensive. Start with simple scenarios and gradually explore more complex testing patterns.