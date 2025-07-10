---
allowed-tools: Read, Bash(cat:*)
description: Validate existing tech contract against development guidelines
---

## Context

**Contract to validate**: @$ARGUMENTS

**Development Guidelines**:
- Backend guidelines: @docs/04-development/convex-development-guide-backend.md
- Frontend guidelines: @docs/04-development/Full Design System Guidelines Document-frontend.md

**Recent validation logs**: !`ls -la logs/contract-creation-validation-*.log | tail -3`

## Your Task

Analyze the provided contract file and validate it against our development guidelines and quality standards.

### Validation Areas

1. **Structure Validation**:
   - Required fields present (contractId, prdName, name, appliesTo, requirements)
   - Proper contractId format (XXX-XXXXX-000)
   - Valid JSON structure

2. **Pattern Quality**:
   - Regex patterns are valid and specific
   - Patterns are not overly broad (avoid .* patterns)
   - Sufficient pattern coverage for requirements

3. **Guidelines Compliance**:
   - Backend patterns align with Convex development guide
   - Frontend patterns follow design system (4 sizes/2 weights, 8pt grid, 60/30/10 colors)
   - General patterns cover security, validation, error handling

4. **Completeness Score**:
   - Calculate overall contract quality (0-100)
   - Identify missing recommended patterns
   - Suggest improvements

### Output Format

Provide a detailed validation report including:
- ✅/❌ Status for each validation area
- Specific issues found and how to fix them
- Completeness score with breakdown
- Recommendations for improvement
- Compliance with development guidelines

If the contract fails validation, provide specific guidance on how to improve it.