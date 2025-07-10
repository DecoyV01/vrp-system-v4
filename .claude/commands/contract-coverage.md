---
allowed-tools: Read, Bash(ls:*), Bash(grep:*)
description: Analyze PRD coverage by existing tech contracts
---

## Context

**PRD to analyze**: @$ARGUMENTS

**Existing contracts**: !`ls docs/11-tech-contracts/*.json`

**Contract details**: !`for f in docs/11-tech-contracts/*.json; do echo "=== $f ==="; jq -r '.contractId + ": " + .name' "$f" 2>/dev/null || echo "Invalid JSON"; done`

## Your Task

Analyze the provided PRD and determine what tech contracts are needed and which ones already exist.

### Analysis Steps

1. **Extract Technical Requirements**:
   - Identify all technical features mentioned in the PRD
   - Categorize as backend, frontend, or full-stack requirements
   - Note specific implementation requirements (file sizes, limits, patterns)

2. **Map to Contract Categories**:
   - **Backend contracts**: Convex functions, database operations, API endpoints
   - **Frontend contracts**: UI components, design system compliance, user interactions
   - **Integration contracts**: File uploads, external APIs, data processing

3. **Coverage Analysis**:
   - Which requirements are already covered by existing contracts?
   - Which requirements need new contracts?
   - Are there any gaps in existing contract coverage?

4. **Contract Recommendations**:
   - Suggest contract IDs for missing coverage (XXX-XXXXX-000 format)
   - Prioritize contracts by importance and implementation order
   - Identify dependencies between contracts

### Output Format

Provide a comprehensive coverage report:

```
📋 PRD Coverage Analysis: {PRD Name}

✅ COVERED REQUIREMENTS:
- Requirement 1: Covered by CONTRACT-ID-001
- Requirement 2: Covered by CONTRACT-ID-002

❌ MISSING COVERAGE:
- Requirement 3: Needs NEW-CONTRACT-001 (High Priority)
- Requirement 4: Needs NEW-CONTRACT-002 (Medium Priority)

🔄 RECOMMENDED CONTRACT CREATION ORDER:
1. {Contract-ID}: {Description} - {Justification}
2. {Contract-ID}: {Description} - {Justification}

📊 COVERAGE STATISTICS:
- Total Requirements: X
- Covered: Y (Z%)
- Missing: X-Y
- Completeness Score: Z%
```

Include specific recommendations for creating missing contracts and improving existing ones.