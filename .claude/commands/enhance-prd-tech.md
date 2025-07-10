---
allowed-tools: Read, Edit
description: Add technical architecture and implementation details to existing business PRD
---

## Context

**Business PRD to enhance**: @$ARGUMENTS

**Development Guidelines**:
- Backend guidelines: @docs/04-development/convex-development-guide-backend.md
- Frontend guidelines: @docs/04-development/Full Design System Guidelines Document-frontend.md

**Project architecture**: @docs/architecture.md

**Enhanced PRD examples**: 
- @docs/10-pr/2025-01-10-master-locations-system-prd.md
- @docs/10-pr/2025-07-04-table-editor-bulk-operations-prd.md

## Your Task

Enhance the existing business-focused PRD by adding comprehensive **technical architecture, design, and implementation sections**. The enhanced PRD will bridge business requirements to technical implementation.

### Technical Sections to Add

Add these new sections after the existing business sections:

```markdown
## 10. Technical Architecture

### System Architecture
[Overall technical approach and component organization]

### Backend Architecture
- **Convex Functions**: Query/mutation organization
- **Database Schema**: Tables, indexes, relationships
- **Real-time Updates**: WebSocket integration patterns
- **Authentication**: User management and authorization

### Frontend Architecture  
- **Component Structure**: React component hierarchy
- **State Management**: Zustand + Convex integration
- **Routing**: React Router implementation
- **UI Framework**: shadcn/ui + Tailwind CSS v4

### Integration Architecture
[External API integrations, third-party services]

## 11. Technical Design System Requirements

### Typography Standards
- **Allowed Sizes**: text-sm, text-base, text-lg, text-xl only
- **Allowed Weights**: font-normal, font-semibold only
- **Forbidden**: text-xs, text-2xl+, font-bold, font-medium

### Spacing System
- **8pt Grid**: Use spacing-2,4,6,8,12,16,20,24 (4px multiples)
- **Forbidden**: Non-4px spacing values (1,3,5,7,9,10,11)

### Color System
- **60/30/10 Rule**: Primary (60%), Secondary (30%), Accent (10%)
- **Semantic Tokens**: bg-background, text-foreground, bg-primary
- **Forbidden**: Arbitrary colors (bg-[#color], text-[#color])

### Component Standards
- **shadcn/ui Compliance**: Use data-slot patterns
- **Accessibility**: ARIA labels, keyboard navigation
- **Responsive Design**: Mobile-first approach

## 12. Technical Implementation Details

### Database Design
[Table schemas, relationships, indexing strategy]

### API Specifications
[Convex function signatures, input/output schemas]

### Security Implementation
- **Authentication Flow**: User verification patterns
- **Authorization Rules**: Role-based access control
- **Data Validation**: Input sanitization requirements
- **Error Handling**: Secure error reporting

### Performance Requirements
- **Response Times**: API latency targets
- **Bundle Size**: Frontend asset optimization
- **Database Performance**: Query optimization patterns
- **Caching Strategy**: Data caching implementation

## 13. Development Standards

### Backend Standards (Convex)
- **Function Organization**: Separate query/mutation files
- **Index Usage**: Optimize database queries with proper indexes
- **Type Safety**: Full TypeScript validation
- **Error Patterns**: Consistent error handling

### Frontend Standards (React)
- **Component Patterns**: Functional components with hooks
- **State Management**: Reactive patterns with Convex
- **Performance**: Code splitting and lazy loading
- **Testing**: Component and integration testing

### Code Quality
- **TypeScript**: Strict type checking, no 'any' types
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit quality checks

## 14. Quality Assurance Requirements

### Testing Strategy
[Unit testing, integration testing, end-to-end testing]

### Performance Monitoring
[Metrics collection, performance benchmarks]

### Security Validation
[Security testing, vulnerability scanning]

### Accessibility Testing
[WCAG compliance validation, screen reader testing]

## 15. Deployment & Operations

### Build Process
[Frontend build optimization, asset bundling]

### Environment Configuration
[Development, staging, production environments]

### Monitoring & Logging
[Error tracking, performance monitoring]

### Maintenance Windows
[Update procedures, rollback strategies]
```

### Enhancement Guidelines

1. **Analyze Business Requirements**: Extract technical implications from business needs
2. **Apply VRP System Patterns**: Use established architecture patterns
3. **Include Design System**: Enforce typography, spacing, color standards
4. **Specify Performance**: Set concrete technical benchmarks
5. **Security by Design**: Include security considerations throughout
6. **Scalability Planning**: Consider growth and performance requirements

### Technical Pattern Integration

#### **Backend Patterns** (if applicable):
- **Convex Functions**: Query/mutation separation
- **Database Design**: Schema optimization with proper indexes
- **Real-time**: WebSocket integration patterns
- **Security**: Authentication and authorization patterns

#### **Frontend Patterns** (if applicable):
- **Design System**: Typography (4 sizes), spacing (8pt grid), colors (60/30/10)
- **Component Architecture**: shadcn/ui patterns with data-slot
- **State Management**: Reactive patterns with Convex integration
- **Performance**: Bundle optimization and lazy loading

#### **Integration Patterns**:
- **API Design**: RESTful patterns for external integrations
- **Data Flow**: Client-server communication patterns
- **Error Handling**: Consistent error reporting across layers

### Quality Requirements

The enhanced PRD must:
- ✅ **Preserve all existing business content** (no modifications to business sections)
- ✅ **Add comprehensive technical sections** following the structure above
- ✅ **Align with development guidelines** (Convex + Design System)
- ✅ **Include specific implementation patterns** for contract generation
- ✅ **Set measurable technical benchmarks** (performance, security, accessibility)
- ✅ **Follow VRP System v4 architecture** patterns and conventions

### Output Instructions

1. **Read the Existing PRD**: Understand business requirements and user needs
2. **Add Technical Sections**: Insert new sections 10-15 after existing content
3. **Maintain Business Content**: Do not modify existing business sections
4. **Apply Development Standards**: Include Convex and Design System requirements
5. **Save Enhanced PRD**: Update the same file with technical enhancements

The enhanced PRD will be ready for tech contract generation using the `/generate-contract` command, ensuring full traceability from business requirements to technical implementation.