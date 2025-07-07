# TDD (Test-Driven Development) Setup for VRP System v4

## 🎯 Overview

This directory contains the complete TDD setup for VRP System v4, including testing infrastructure, example tests, and workflows for both frontend (React + TypeScript) and backend (Convex) components.

## 📁 Directory Structure

```
tdd/
├── README.md                    # This file
├── setup/                       # Testing infrastructure setup
│   ├── frontend-test-setup.md   # Frontend testing configuration
│   ├── backend-test-setup.md    # Convex testing configuration
│   └── package-updates.json     # Required dependencies
├── examples/                    # Example TDD implementations
│   ├── frontend/                # React component and hook tests
│   │   ├── hooks/              # Custom hook tests
│   │   ├── components/         # Component tests
│   │   └── utils/              # Utility function tests
│   └── backend/                # Convex function tests
│       ├── vehicles/           # Vehicle CRUD tests
│       ├── jobs/               # Job management tests
│       └── validation/         # Validation logic tests
├── workflows/                   # TDD workflows and processes
│   ├── red-green-refactor.md   # Core TDD cycle
│   ├── testing-strategies.md   # Testing approaches for VRP
│   └── ci-integration.md       # Continuous integration setup
└── config/                     # Test configuration files
    ├── vitest.config.ts         # Frontend test configuration
    ├── jest.config.js           # Alternative Jest configuration
    └── test-setup.ts            # Global test setup
```

## 🚀 Quick Start

### 1. Install Testing Dependencies
```bash
# Frontend testing
cd frontend && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Backend testing (Convex built-in)
npx convex dev --test
```

### 2. Run Tests
```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
npx convex test

# Watch mode
cd frontend && npm run test:watch
```

### 3. TDD Workflow
1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve while keeping tests green

## 📋 TDD Priority Areas

### High Priority (Start Here)
- **Convex Functions**: Vehicle/Job CRUD operations
- **Custom Hooks**: `useVRPData`, `useVehicleStatus`
- **Validation Logic**: Input validation, optimization validation
- **Utility Functions**: CSV processing, duplicate detection

### Medium Priority
- **React Components**: TableEditor, modals
- **State Management**: Zustand stores
- **API Integration**: Convex client hooks

### Low Priority
- **UI Components**: shadcn/ui components (well-tested library)
- **Layout Components**: Simple presentational components

## 🎯 Testing Strategy

### Frontend Tests
- **Unit Tests**: Hooks, utilities, pure functions
- **Component Tests**: React components with Testing Library
- **Integration Tests**: Component + hook interactions

### Backend Tests
- **Function Tests**: Convex mutations and queries
- **Validation Tests**: Schema and input validation
- **Business Logic Tests**: VRP-specific calculations

## 📚 Resources

- [Testing Library Documentation](https://testing-library.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Convex Testing Guide](https://docs.convex.dev/functions/testing)
- [TDD Best Practices](./workflows/red-green-refactor.md)

## 🔧 Configuration

All test configurations are in the `config/` directory:
- `vitest.config.ts`: Main frontend test configuration
- `test-setup.ts`: Global test utilities and mocks
- `jest.config.js`: Alternative Jest setup (if preferred)

## 📈 Coverage Goals

- **Critical Functions**: 100% coverage
- **Business Logic**: 95% coverage
- **UI Components**: 80% coverage
- **Utility Functions**: 100% coverage

## 🤝 Contributing

1. Follow the TDD cycle (Red → Green → Refactor)
2. Write tests for all new features
3. Maintain high test coverage
4. Use descriptive test names
5. Group related tests with `describe` blocks