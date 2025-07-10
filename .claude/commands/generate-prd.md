---
allowed-tools: Read, Write
description: Generate business-focused PRD from high-level requirements
---

## Context

**Business requirements to analyze**: @$ARGUMENTS

**PRD template reference**: @docs/10-pr/2025-01-10-master-locations-system-prd.md

**Project context**: @CLAUDE.md

## Your Task

Generate a comprehensive **business-focused PRD** from the provided requirements. This PRD will focus on business value, user needs, and functional requirements **without technical implementation details**.

### PRD Structure to Generate

Create a PRD following this exact structure:

```markdown
# [Feature Name] - Product Requirements Document

**Document Version**: 1.0  
**Created**: [Current Date]  
**Last Updated**: [Current Date]  
**Status**: Draft  

## 1. Executive Summary

### Problem Statement
[Clear description of the business problem being solved]

### Solution Overview
[High-level solution description focused on business value]

### Success Metrics
[Quantifiable business outcomes and KPIs]

## 2. Business Context

### Current State
[Description of existing situation/pain points]

### Target Users
[Primary and secondary user personas]

### Business Value
[ROI, efficiency gains, user satisfaction improvements]

## 3. Functional Requirements

### Core Features
[Primary functionality that must be delivered]

### User Stories
[Detailed user stories with acceptance criteria]

### User Experience Requirements
[UX expectations, usability standards]

## 4. Non-Functional Requirements

### Performance Expectations
[Response times, throughput, scalability needs]

### Reliability & Availability
[Uptime requirements, error handling expectations]

### Security & Compliance
[Data protection, privacy, regulatory requirements]

### Accessibility
[WCAG compliance, inclusive design requirements]

## 5. Business Rules & Constraints

### Data Validation Rules
[Business logic for data integrity]

### Workflow Rules
[Process flows and business logic]

### Integration Requirements
[External system dependencies - business level only]

## 6. Success Criteria

### Acceptance Criteria
[Specific, measurable criteria for feature acceptance]

### Performance Benchmarks
[Quantifiable performance targets]

### User Satisfaction Metrics
[How success will be measured from user perspective]

## 7. Dependencies & Assumptions

### Business Dependencies
[Other business initiatives this depends on]

### Key Assumptions
[Critical assumptions about user behavior, market conditions]

### Risk Mitigation
[Business risks and mitigation strategies]

## 8. Implementation Phases

### Phase 1: Core Functionality
[Essential features for MVP]

### Phase 2: Enhanced Features
[Additional capabilities for full release]

### Phase 3: Optimization
[Performance and user experience improvements]

## 9. Appendices

### Glossary
[Business terminology and definitions]

### References
[Related documents, research, market analysis]
```

### Analysis Guidelines

1. **Extract Business Value**: Focus on ROI, efficiency gains, user satisfaction
2. **Define Clear User Stories**: Include detailed acceptance criteria
3. **Set Measurable Goals**: Quantifiable success metrics and KPIs
4. **Identify Constraints**: Business rules, compliance, resource limitations
5. **Phase Implementation**: Break down into logical business phases

### Quality Requirements

The generated PRD must:
- ✅ Focus on **business value and user needs** (no technical details)
- ✅ Include **quantifiable success metrics** and performance benchmarks
- ✅ Define **clear acceptance criteria** for each feature
- ✅ Follow VRP System v4 documentation standards
- ✅ Be written for **business stakeholders** and product owners
- ✅ Include **phased implementation approach**

### Output Instructions

1. **Analyze the Requirements**: Extract business needs, user problems, and success criteria
2. **Generate Complete PRD**: Following the structure above with all sections filled
3. **Save to**: `docs/10-pr/YYYY-MM-DD-[feature-name]-prd.md`
4. **Use Current Date**: For file naming and document metadata

**Important**: This PRD should be **business-focused only**. Technical architecture, implementation details, and design system requirements will be added later using the `/enhance-prd-tech` command.

The generated PRD will serve as the foundation for technical enhancement and eventual tech contract generation.