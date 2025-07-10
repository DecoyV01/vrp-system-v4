---
allowed-tools: Read, Write
description: Convert enhanced PRD with technical sections to comprehensive tech contract
---

## Context

**Enhanced PRD to convert**: @$ARGUMENTS

**Development Guidelines**:
- Backend guidelines: @docs/04-development/convex-development-guide-backend.md
- Frontend guidelines: @docs/04-development/Full Design System Guidelines Document-frontend.md

**Contract Examples**:
- Existing contract template: @docs/11-tech-contracts/table-editor-bulk-TBL-CSV-001.json
- Master locations contract: @docs/11-tech-contracts/master-locations-LOC-GEO-001.json

## Your Task

Convert the enhanced PRD (with technical sections) into a comprehensive JSON tech contract that validates all technical requirements during development.

### Contract Generation Process

1. **Extract All Technical Requirements**: From both business and technical sections
2. **Generate Validation Patterns**: Create specific regex patterns for each requirement
3. **Organize by Category**: Backend, frontend, and domain-specific requirements
4. **Set Performance Benchmarks**: Based on PRD specifications
5. **Create Contract ID**: Using format XXX-XXXXX-001

### Required Contract Structure

Generate a comprehensive JSON contract:

```json
{
  "contractId": "XXX-XXXXX-001",
  "prdName": "[extracted-from-prd-filename]",
  "name": "[Descriptive Contract Name]",
  "prdReference": "[path-to-prd-file]#[relevant-section]",
  "appliesTo": {
    "filePatterns": ["[specific-file-patterns]"],
    "excludePatterns": [".*test.*", ".*spec.*", ".*\\.d\\.ts$"]
  },
  "requirements": {
    // Extract from Technical Sections (10-15)
    // Include Business Validation from Sections (1-9)
  },
  "performance": {
    // Extract from Performance Requirements
  },
  "dependencies": {
    "required": [],
    "optional": []
  },
  "designSystemCompliance": {
    // Extract from Design System Requirements
  }
}
```

### Validation Pattern Categories

#### **Business Requirement Patterns** (From Sections 1-9):

1. **businessLogicValidation**: Functional requirements compliance
   - Extract from "Functional Requirements" and "Business Rules"
   - Create patterns that validate business logic implementation

2. **userStoryCompliance**: User story acceptance criteria
   - Extract from "User Stories" section
   - Validate that implementation meets user story criteria

3. **performanceBenchmarks**: Non-functional requirements
   - Extract from "Performance Expectations" 
   - Create measurable performance validation

#### **Backend Patterns** (From Technical Sections 10-15):

1. **functionOrganization**: Convex function patterns
   - Based on "Backend Architecture" section
   - `"codePatterns": ["export.*=.*query\\(", "export.*=.*mutation\\("]`

2. **databaseSchema**: Schema and indexing
   - Based on "Database Design" section
   - `"codePatterns": ["\\.withIndex\\(", "defineTable\\("]`

3. **securityImplementation**: Security patterns
   - Based on "Security Implementation" section
   - `"codePatterns": ["getCurrentUser\\(", "throw new Error\\(.*[Uu]nauthorized"]`

4. **realTimeIntegration**: WebSocket patterns
   - Based on real-time requirements
   - `"codePatterns": ["useQuery\\(", "useMutation\\("]`

#### **Frontend Patterns** (From Design System Section 11):

1. **typographyCompliance**: Design system typography
   - `"codePatterns": ["text-(sm|base|lg|xl)", "font-(normal|semibold)"]`
   - `"forbidden": ["text-(xs|2xl|3xl)", "font-(bold|medium|light)"]`

2. **spacingCompliance**: 8pt grid system
   - `"codePatterns": ["[pm]-(2|4|6|8|12|16|20|24)", "gap-(2|4|6|8|12|16|20|24)"]`
   - `"forbidden": ["[pm]-(1|3|5|7|9|10|11)", "gap-(1|3|5|7|9|10|11)"]`

3. **colorCompliance**: 60/30/10 color system
   - `"codePatterns": ["bg-background", "text-foreground", "bg-primary"]`
   - `"forbidden": ["bg-\\[#[0-9a-fA-F]+\\]", "text-\\[#[0-9a-fA-F]+\\]"]`

4. **componentCompliance**: shadcn/ui standards
   - `"codePatterns": ["data-slot", "Dialog", "Button", "Table", "Input"]`

#### **Quality Assurance Patterns** (From Section 14):

1. **testingRequirements**: Testing coverage
   - Based on "Testing Strategy" section
   - `"codePatterns": ["describe\\(", "it\\(", "test\\(", "expect\\("]`

2. **accessibilityCompliance**: WCAG patterns
   - Based on "Accessibility Testing" section
   - `"codePatterns": ["aria-label", "role=", "tabIndex"]`

3. **performanceOptimization**: Code performance
   - Based on "Performance Monitoring" section
   - `"codePatterns": ["React\\.memo\\(", "useMemo\\(", "lazy\\("]`

### Contract ID Generation

Generate contract ID based on PRD content:
- **Backend-focused**: `BCK-[FEATURE]-001`
- **Frontend-focused**: `FRT-[FEATURE]-001` 
- **Full-stack**: `STK-[FEATURE]-001`
- **Data/DB**: `DAT-[FEATURE]-001`
- **Integration**: `INT-[FEATURE]-001`

### File Pattern Generation

Create specific file patterns based on technical sections:

**Backend Files**:
```json
"filePatterns": [
  ".*convex/[feature-name].*\\.ts$",
  ".*[feature-name].*query.*",
  ".*[feature-name].*mutation.*"
]
```

**Frontend Files**:
```json
"filePatterns": [
  ".*components/[feature-name].*",
  ".*pages/[FeatureName].*",
  ".*hooks/use[FeatureName].*"
]
```

### Performance Benchmarks

Extract from PRD technical sections:
```json
"performance": {
  "responseTime": "[from API Specifications]",
  "bundleSize": "[from Frontend Performance]",
  "queryTime": "[from Database Performance]",
  "accessibilityScore": 100
}
```

### Quality Requirements

The generated contract must:
- ✅ **Extract all technical requirements** from enhanced PRD sections 10-15
- ✅ **Include business validation** from PRD sections 1-9
- ✅ **Use proper contractId format** (XXX-XXXXX-000)
- ✅ **Create specific validation patterns** (avoid overly broad patterns)
- ✅ **Include design system compliance** (typography, spacing, colors)
- ✅ **Set performance benchmarks** based on PRD specifications
- ✅ **Provide complete traceability** back to PRD sections

### Output Instructions

1. **Analyze Enhanced PRD**: Extract requirements from all sections (business + technical)
2. **Generate Contract ID**: Based on feature type and naming conventions
3. **Create Validation Patterns**: Comprehensive patterns for all requirements
4. **Set Performance Targets**: Based on PRD technical specifications
5. **Save Contract**: `docs/11-tech-contracts/[prd-name]-[contract-id].json`

The contract will be automatically validated by the contract-creation-validation.sh hook to ensure quality and completeness.

**Final Result**: A complete tech contract that validates both business requirements and technical implementation standards, ready for development validation through the optimization-check.sh hook.