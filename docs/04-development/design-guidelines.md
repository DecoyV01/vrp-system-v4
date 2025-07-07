# Design Guidelines

## Overview

This document outlines the design principles and guidelines for the VRP System v4 development.

## Core Design Principles

### 1. Component-Based Architecture
- Use modular, reusable components
- Follow single responsibility principle
- Maintain clear component boundaries

### 2. Real-Time First
- Design for real-time data synchronization
- Optimize for WebSocket connections
- Handle offline scenarios gracefully

### 3. User Experience
- Intuitive navigation through 4-level hierarchy
- Responsive design for all screen sizes
- Clear visual feedback for all actions

### 4. Performance
- Lazy loading for large datasets
- Efficient state management
- Minimize re-renders

## UI/UX Standards

### Visual Design
- **Primary Color**: Blue (#3B82F6)
- **Background**: White (#FFFFFF)
- **Borders**: Gray (#E5E7EB)
- **Text**: Gray-900 (#111827)

### Component Patterns
- Cards for data display
- Tables for bulk data editing
- Modals for confirmations
- Toast notifications for feedback

### Navigation
- Breadcrumb navigation for hierarchy
- Dual sidebar system
- Keyboard shortcuts support

## Code Standards

### TypeScript
- Strict type checking enabled
- Explicit return types
- Interface over type aliases

### React Patterns
- Functional components only
- Custom hooks for logic reuse
- Proper error boundaries

### State Management
- Zustand for local state
- Convex for server state
- Clear separation of concerns

## Database Design

### Schema Principles
- Nullable fields for flexibility
- Required fields for data integrity
- Proper indexing for performance

### Relationships
- Projects → Scenarios → Datasets → Tables
- Clear foreign key relationships
- Cascade delete handling

## Testing Guidelines

### Unit Tests
- Test individual functions
- Mock external dependencies
- Aim for 80% coverage

### Integration Tests
- Test API endpoints
- Validate data flow
- Test error scenarios

### E2E Tests
- Test complete user workflows
- Validate real-time updates
- Cross-browser testing

---

*Last Updated: July 2025*
*Version: 1.0.0*