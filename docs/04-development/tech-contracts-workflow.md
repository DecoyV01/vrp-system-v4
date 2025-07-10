# Tech Contracts Workflow - VRP System v4

## Overview

Complete workflow for generating Product Requirements Documents (PRDs) and Tech Contracts using AI-powered generation with deterministic validation.

## 🎯 Progressive 3-Step Workflow

### Step 1: Business PRD Generation
```bash
/generate-prd "business requirements description"
```

**Input**: High-level business requirements, user problems, feature ideas  
**Output**: Business-focused PRD (`docs/10-pr/YYYY-MM-DD-feature-name-prd.md`)  
**Contains**: User stories, success metrics, business rules, acceptance criteria  
**Focus**: Pure business value - no technical details  

### Step 2: Technical Enhancement  
```bash
/enhance-prd-tech docs/10-pr/YYYY-MM-DD-feature-name-prd.md
```

**Input**: Business PRD from Step 1  
**Output**: Enhanced PRD with technical sections (10-15) added  
**Adds**: Architecture, design system, security, performance, implementation patterns  
**Focus**: Technical compliance with VRP System standards  

### Step 3: Tech Contract Generation
```bash
/prd-to-contract docs/10-pr/YYYY-MM-DD-feature-name-prd.md
```

**Input**: Enhanced PRD from Step 2  
**Output**: JSON tech contract (`docs/11-tech-contracts/feature-name-XXX-XXX-001.json`)  
**Contains**: 100+ validation patterns for development enforcement  
**Focus**: Automatic quality gates during code development  

## 🔧 Support Commands

### Contract Validation
```bash
/validate-contract docs/11-tech-contracts/contract-name.json
```
**Purpose**: Manual validation of existing contracts  
**Output**: Quality score, compliance report, improvement suggestions  

### Coverage Analysis
```bash
/contract-coverage docs/10-pr/prd-file.md
```
**Purpose**: Analyze which requirements have tech contracts  
**Output**: Coverage gaps, missing contracts, recommendations  

## 🛡️ Automatic Validation System

### During Contract Creation
- **Hook**: `.claude/hooks/contract-creation-validation.sh`
- **Triggers**: When creating/modifying JSON contract files
- **Validates**: Structure, guidelines compliance, pattern quality
- **Scoring**: 0-100 completeness score with detailed feedback

### During Development  
- **Hook**: `.claude/hooks/optimization-check.sh`
- **Triggers**: When modifying code files
- **Validates**: Tech contract requirements + LEVER principles
- **Protection**: Business requirements (with contracts) + code optimization (always)

## 📊 Quality Assurance Levels

### With Tech Contracts (Complete Protection)
✅ **Business Requirements**: PRD compliance enforced  
✅ **Technical Standards**: Backend + Frontend guidelines  
✅ **Security Patterns**: Authentication, authorization, validation  
✅ **Performance**: Response times, bundle sizes, query optimization  
✅ **Design System**: Typography, spacing, colors (4/2/8pt/60-30-10 rules)  
✅ **Code Quality**: Anti-duplication, architecture compliance  

### Without Tech Contracts (Partial Protection)  
❌ **Business Requirements**: No PRD compliance checking  
⚠️ **Technical Standards**: Basic LEVER framework only  
❌ **Security Patterns**: Not enforced  
❌ **Performance**: No benchmarks enforced  
❌ **Design System**: No compliance checking  
✅ **Code Quality**: Anti-duplication via LEVER principles  

## 🎯 Example Workflow

```bash
# 1. Generate business PRD
/generate-prd "Users need a real-time dashboard showing VRP optimization progress with customizable widgets and performance metrics"

# Output: docs/10-pr/2025-01-10-optimization-dashboard-prd.md
# Contains: User stories, success criteria, performance expectations

# 2. Add technical details
/enhance-prd-tech docs/10-pr/2025-01-10-optimization-dashboard-prd.md

# Output: Same file enhanced with sections 10-15
# Contains: Convex architecture, React components, design system, security

# 3. Generate tech contract  
/prd-to-contract docs/10-pr/2025-01-10-optimization-dashboard-prd.md

# Output: docs/11-tech-contracts/optimization-dashboard-DSH-OPT-001.json
# Contains: 100+ validation patterns, performance benchmarks, design compliance

# 4. Development begins with automatic validation
# All code changes validated against contract requirements
# Business + technical compliance enforced automatically
```

## 📁 File Organization

```
docs/
├── 10-pr/                          # PRDs (Product Requirements)
│   ├── 2025-01-10-feature-prd.md   # Business PRD → Enhanced PRD
│   └── ...
├── 11-tech-contracts/              # Tech Contracts  
│   ├── feature-XXX-XXX-001.json    # Generated contracts
│   └── ...
└── 04-development/
    └── tech-contracts-workflow.md  # This document

.claude/
├── commands/                        # Slash Commands
│   ├── generate-prd.md             # Business PRD generation
│   ├── enhance-prd-tech.md         # Technical enhancement  
│   ├── prd-to-contract.md          # Contract generation
│   ├── validate-contract.md        # Contract validation
│   └── contract-coverage.md        # Coverage analysis
└── hooks/                          # Validation Hooks
    ├── contract-creation-validation.sh  # Contract quality gates
    └── optimization-check.sh            # Development validation
```

## 🚀 Benefits

### **Business Stakeholders**
- Clear business requirements without technical complexity
- Measurable success criteria and acceptance criteria
- Progressive refinement allows business review before technical decisions

### **Technical Teams**  
- Comprehensive technical guidance from enhanced PRDs
- Automatic validation prevents requirement drift
- Clear traceability from business needs to code implementation

### **Quality Assurance**
- 100+ validation patterns per feature
- Automatic compliance with VRP System standards  
- Real-time feedback during development
- Complete audit trail from PRD to implementation

## 📈 Success Metrics

- **PRD Quality**: Business clarity, technical completeness
- **Contract Coverage**: % of features with tech contracts  
- **Compliance Score**: Average contract validation scores (target: 90+)
- **Development Velocity**: Reduced rework due to clear requirements
- **Code Quality**: Consistent patterns, reduced technical debt

---

**Next Steps**: Use `/generate-prd` to start your next feature development with comprehensive business and technical validation!