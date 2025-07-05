# Hook Interaction Flow Diagrams

**Document ID**: hook-interaction-flow-diagrams  
**Created**: July 5, 2025  
**Purpose**: Visual documentation of hook execution flows and data exchange patterns

## Overview

This document provides comprehensive flow diagrams showing how Claude Code UAT hooks interact with each other, the Claude Code system, and the UAT framework to orchestrate seamless testing workflows.

## Main Flow Diagram

### Complete UAT Workflow
```
User Input: "Test login-flow scenario"
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE SESSION                         │
│                                                                 │
│  User Message → Claude Code → Tool Decision → Hook Execution    │
│                                      ↓                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 PreToolUse Hook                         │   │
│  │            (claude-uat-orchestrator.sh)                 │   │
│  │                                                         │   │
│  │  1. Parse user message & tool parameters                │   │
│  │  2. Run UAT context detection algorithm                 │   │
│  │  3. Auto-initialize session if UAT detected            │   │
│  │  4. Enhance tool parameters with UAT context           │   │
│  │  5. Inject validation framework if needed               │   │
│  │                                                         │   │
│  │  Output: approve/modify/block + enhanced parameters     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                      ↓                         │
│              Tool Execution (Browser MCP)                      │
│                                      ↓                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                PostToolUse Hook                         │   │
│  │             (claude-uat-tracker.sh)                     │   │
│  │                                                         │   │
│  │  1. Capture tool execution results                      │   │
│  │  2. Update session state with progress                  │   │
│  │  3. Record screenshots and artifacts                    │   │
│  │  4. Update performance metrics                          │   │
│  │  5. Advance scenario step if completed                  │   │
│  │                                                         │   │
│  │  Output: success + progress data                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                      ↓                         │
│                 (Repeat for each tool call)                    │
│                                      ↓                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Stop Hook                             │   │
│  │             (claude-uat-finalizer.sh)                   │   │
│  │                                                         │   │
│  │  1. Detect if UAT session was active                    │   │
│  │  2. Generate comprehensive session report               │   │
│  │  3. Archive session files and screenshots               │   │
│  │  4. Clean up temporary files and state                  │   │
│  │  5. Update UAT framework statistics                     │   │
│  │                                                         │   │
│  │  Output: success + finalization data                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                      ↓
                          UAT Report Generated
```

## PreToolUse Hook Flow (claude-uat-orchestrator.sh)

### Context Detection and Initialization Flow
```
Hook Input (JSON from Claude Code)
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT PROCESSING                             │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│               UAT CONTEXT DETECTION                             │
│                                                                 │
│  Parse User Message                                             │
│         ↓                                                       │
│  Extract Keywords & Patterns                                    │
│         ↓                                                       │
│  Analyze Tool Name & Parameters                                 │
│         ↓                                                       │
│  Calculate Confidence Score (0-100)                             │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  DECISION TREE                          │   │
│  │                                                         │   │
│  │  Score ≥ 80?  ──── YES ──→ Auto-Initialize UAT          │   │
│  │      │                                                  │   │
│  │      NO                                                 │   │
│  │      ↓                                                  │   │
│  │  Score ≥ 60?  ──── YES ──→ Suggest UAT                  │   │
│  │      │                                                  │   │
│  │      NO                                                 │   │
│  │      ↓                                                  │   │
│  │  Allow Normal Execution                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                 UAT SESSION INITIALIZATION                      │
│                                                                 │
│  Generate UAT Session ID                                        │
│         ↓                                                       │
│  Load & Validate Scenario                                       │
│         ↓                                                       │
│  Create Session State File                                      │
│         ↓                                                       │
│  Create Screenshot Directories                                  │
│         ↓                                                       │
│  Initialize Performance Tracking                                │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│               PARAMETER ENHANCEMENT                             │
│                                                                 │
│  Tool Type?                                                     │
│      ↓                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ playwright_navigate:                                    │   │
│  │  • Resolve relative URLs                                │   │
│  │  • Set appropriate timeouts                             │   │
│  │  • Configure browser settings                           │   │
│  │  • Add performance monitoring                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│      ↓                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ playwright_screenshot:                                  │   │
│  │  • Generate UAT-compliant naming                        │   │
│  │  • Set screenshot directory                             │   │
│  │  • Configure image settings                             │   │
│  │  • Add metadata tracking                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│      ↓                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ playwright_fill/click:                                  │   │
│  │  • Set interaction timeouts                             │   │
│  │  • Add wait conditions                                  │   │
│  │  • Configure retry logic                                │   │
│  │  • Add validation hooks                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│             VALIDATION FRAMEWORK INJECTION                      │
│                                                                 │
│  Check if Framework Injection Needed                            │
│         ↓                                                       │
│  Generate Health Check JavaScript                               │
│         ↓                                                       │
│  Create Scenario-Specific Validations                           │
│         ↓                                                       │
│  Inject into Tool Parameters                                     │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT GENERATION                            │
│                                                                 │
│  action: "approve" | "modify" | "block"                         │
│  message: Human-readable description                            │
│  parameters: Enhanced tool parameters (if modify)               │
│  data: UAT context metadata                                     │
└─────────────────────────────────────────────────────────────────┘
        ↓
    Claude Code Tool Execution
```

## PostToolUse Hook Flow (claude-uat-tracker.sh)

### Result Tracking and Progress Flow
```
Hook Input (Tool Result + Execution Data)
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT VALIDATION                             │
│                                                                 │
│  Check if UAT Session Active                                    │
│         ↓                                                       │
│  Validate Tool is Browser MCP                                   │
│         ↓                                                       │
│  Parse Tool Result Data                                         │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                 EXECUTION RESULT CAPTURE                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             Success/Failure Analysis                    │   │
│  │                                                         │   │
│  │  Parse Tool Result:                                     │   │
│  │    • success: true/false                                │   │
│  │    • error: error message                               │   │
│  │    • execution_time: duration                           │   │
│  │    • result_data: tool-specific results                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Performance Metrics                        │   │
│  │                                                         │   │
│  │  Calculate:                                             │   │
│  │    • Average execution time                             │   │
│  │    • Success rate                                       │   │
│  │    • Fastest/slowest operations                         │   │
│  │    • Error frequency                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ARTIFACT MANAGEMENT                           │
│                                                                 │
│  Screenshot Processing?                                          │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ If tool = playwright_screenshot:                        │   │
│  │   • Extract screenshot metadata                         │   │
│  │   • Validate file exists                               │   │
│  │   • Record file size & path                            │   │
│  │   • Update screenshot catalog                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ If validation framework results:                        │   │
│  │   • Parse health check results                          │   │
│  │   • Record assertion outcomes                           │   │
│  │   • Update validation statistics                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PROGRESS TRACKING                            │
│                                                                 │
│  Load Current Session State                                     │
│         ↓                                                       │
│  Determine Current Step Status                                  │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Step Completion Logic                      │   │
│  │                                                         │   │
│  │  Tool Success? ────── NO ──→ Mark Step Failed           │   │
│  │      │                                                  │   │
│  │      YES                                                │   │
│  │      ↓                                                  │   │
│  │  Action Complete? ─── YES ──→ Advance to Next Step      │   │
│  │      │                                                  │   │
│  │      NO                                                 │   │
│  │      ↓                                                  │   │
│  │  Continue Current Step                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  Update Session State with Progress                             │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SESSION STATE UPDATE                           │
│                                                                 │
│  Create Tool Call Record                                        │
│         ↓                                                       │
│  Update Performance Metrics                                     │
│         ↓                                                       │
│  Record Artifacts (screenshots, logs)                           │
│         ↓                                                       │
│  Update Progress Indicators                                     │
│         ↓                                                       │
│  Write State with Atomic Operations                             │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT GENERATION                            │
│                                                                 │
│  action: "success"                                              │
│  message: "Tool execution tracked successfully"                 │
│  data: Progress and tracking metadata                           │
└─────────────────────────────────────────────────────────────────┘
        ↓
    Hook Execution Complete
```

## Stop Hook Flow (claude-uat-finalizer.sh)

### Session Finalization Flow
```
Hook Input (Session End Signal)
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION DETECTION                             │
│                                                                 │
│  Check for Active UAT Session                                   │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Session File Exists? ─── NO ──→ Exit (No UAT Session)  │   │
│  │         │                                               │   │
│  │         YES                                             │   │
│  │         ↓                                               │   │
│  │  Load Session State                                     │   │
│  │         ↓                                               │   │
│  │  Validate Session Data                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   REPORT GENERATION                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Data Aggregation                           │   │
│  │                                                         │   │
│  │  Collect:                                               │   │
│  │    • Session metadata                                   │   │
│  │    • Execution statistics                               │   │
│  │    • Performance metrics                                │   │
│  │    • Error logs and warnings                            │   │
│  │    • Screenshot catalog                                 │   │
│  │    • Validation results                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             Report Compilation                          │   │
│  │                                                         │   │
│  │  Calculate:                                             │   │
│  │    • Completion rate                                    │   │
│  │    • Success rate                                       │   │
│  │    • Performance averages                               │   │
│  │    • Error frequency                                    │   │
│  │    • Execution duration                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  Generate JSON Report                                           │
│         ↓                                                       │
│  Write Report to File                                           │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FILE ARCHIVING                               │
│                                                                 │
│  Create Archive Directory                                       │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Archive Contents                          │   │
│  │                                                         │   │
│  │  Copy to Archive:                                       │   │
│  │    • Session state file                                 │   │
│  │    • Screenshot directory                               │   │
│  │    • Log files                                          │   │
│  │    • Generated report                                   │   │
│  │    • Archive metadata                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  Create Archive Metadata                                        │
│         ↓                                                       │
│  Update Archive Index                                           │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                UAT FRAMEWORK UPDATES                            │
│                                                                 │
│  Update UAT Summary Statistics                                  │
│         ↓                                                       │
│  Update Scenario Statistics                                     │
│         ↓                                                       │
│  Record Session in History                                      │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CLEANUP                                     │
│                                                                 │
│  Remove Active Session File                                     │
│         ↓                                                       │
│  Clean Up Lock Files                                            │
│         ↓                                                       │
│  Remove Temporary Files                                         │
│         ↓                                                       │
│  Clean Old Archive Files (Retention Policy)                    │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT GENERATION                            │
│                                                                 │
│  action: "success"                                              │
│  message: "UAT session finalized and archived"                  │
│  data: Finalization metadata                                    │
└─────────────────────────────────────────────────────────────────┘
        ↓
    Session Finalized
```

## Data Flow Between Hooks

### Session State Data Exchange
```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION STATE FILE                           │
│                                                                 │
│  /uat/sessions/claude-session-{id}.json                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Data Sections                           │   │
│  │                                                         │   │
│  │  meta: { version, timestamps, format }                  │   │
│  │    ↕                                                    │   │
│  │  session: { ids, scenario, status, timing }             │   │
│  │    ↕                                                    │   │
│  │  scenario: { steps, progress, execution plan }          │   │
│  │    ↕                                                    │   │
│  │  execution: { tool calls, errors, warnings }            │   │
│  │    ↕                                                    │   │
│  │  validation: { health checks, assertions }              │   │
│  │    ↕                                                    │   │
│  │  artifacts: { screenshots, logs, reports }              │   │
│  │    ↕                                                    │   │
│  │  performance: { metrics, timing, rates }                │   │
│  │    ↕                                                    │   │
│  │  context: { user input, detection, settings }           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────┐
│                     HOOK INTERACTIONS                           │
│                                                                 │
│  PreToolUse Hook:                                               │
│    • WRITES: session, scenario, context                         │
│    • READS: (none - initializes state)                          │
│                                                                 │
│  PostToolUse Hook:                                              │
│    • WRITES: execution, artifacts, performance                  │
│    • READS: session, scenario, context                          │
│                                                                 │
│  Stop Hook:                                                     │
│    • WRITES: (final updates only)                               │
│    • READS: ALL sections for report generation                  │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

### Error Detection and Recovery
```
Error Detected
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR CLASSIFICATION                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Error Types                                │   │
│  │                                                         │   │
│  │  Hook Execution Error ──→ Log & Continue                │   │
│  │         │                                               │   │
│  │  Session State Error ──→ Attempt Recovery               │   │
│  │         │                                               │   │
│  │  Tool Execution Error ──→ Record & Continue             │   │
│  │         │                                               │   │
│  │  Validation Error ──→ Mark Failed & Continue            │   │
│  │         │                                               │   │
│  │  Critical System Error ──→ Emergency Cleanup            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR RESPONSE                               │
│                                                                 │
│  Record Error in Session State                                  │
│         ↓                                                       │
│  Generate Error Response                                        │
│         ↓                                                       │
│  Continue or Abort Based on Error Type                          │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### Claude Code Integration
```
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE                                │
│                                                                 │
│  User Input ──→ Message Processing ──→ Tool Selection            │
│                                              ↓                  │
│                                        Hook Registration        │
│                                              ↓                  │
│                                      ┌─────────────────┐        │
│                                      │   PreToolUse    │        │
│                                      │      Hook       │        │
│                                      └─────────────────┘        │
│                                              ↓                  │
│                                       Tool Execution            │
│                                              ↓                  │
│                                      ┌─────────────────┐        │
│                                      │   PostToolUse   │        │
│                                      │      Hook       │        │
│                                      └─────────────────┘        │
│                                              ↓                  │
│                                      Response Generation        │
│                                              ↓                  │
│                                      ┌─────────────────┐        │
│                                      │    Stop Hook    │        │
│                                      └─────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### UAT Framework Integration
```
┌─────────────────────────────────────────────────────────────────┐
│                   UAT FRAMEWORK                                 │
│                                                                 │
│  Scenarios ←──── Hook Reads ←──── /uat/scenarios/               │
│     ↓                                                           │
│  Session State ←──── Hooks Read/Write ←──── /uat/sessions/      │
│     ↓                                                           │
│  Artifacts ←──── Hooks Write ←──── /uat/screenshots/            │
│     ↓                                                           │
│  Reports ←──── Hooks Write ←──── /uat/reports/                  │
│     ↓                                                           │
│  Archive ←──── Hooks Write ←──── /uat/archive/                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Flow Diagrams Complete**: These diagrams provide comprehensive visualization of hook interactions and data flows for Claude Code UAT integration.