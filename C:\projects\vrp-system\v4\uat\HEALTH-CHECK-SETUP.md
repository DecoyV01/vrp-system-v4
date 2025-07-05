# Health Check Endpoints Setup Guide

## Overview

Health Check Endpoints provide real-time application state information during UAT testing. They allow Claude Code to verify internal application state beyond what's visible in the UI.

## Why Health Checks Are Critical

Traditional UAT testing only sees what's rendered in the DOM. Health checks provide:

1. **Internal State Visibility**: Check authentication, routing, loading states
2. **Error Detection**: Catch JavaScript errors that don't show in UI
3. **Timing Verification**: Know when async operations complete
4. **Data Validation**: Verify correct data is loaded

## Implementation Guide

### Step 1: Create Health Check Module

Create `frontend/src/utils/uatHealthCheck.ts`:

```typescript
// UAT Health Check System
// Only enabled in development mode for security

interface HealthCheckData {
  isLoggedIn: () => boolean;
  currentRoute: () => string;
  hasErrors: () => boolean;
  isLoading: () => boolean;
  getFormData: (formId?: string) => Record<string, any> | null;
  getLastApiCall: () => ApiCallInfo | null;
  getActionLog: () => ActionLogEntry[];
  getUserData: () => any;
  getProjectData: () => any;
  getDataLoadState: () => DataLoadState;
}

interface ApiCallInfo {
  url: string;
  method: string;
  status: number;
  timestamp: number;
  duration: number;
  error?: string;
}

interface ActionLogEntry {
  action: string;
  timestamp: number;
  details?: any;
}

interface DataLoadState {
  projects: 'idle' | 'loading' | 'success' | 'error';
  scenarios: 'idle' | 'loading' | 'success' | 'error';
  datasets: 'idle' | 'loading' | 'success' | 'error';
  vehicles: 'idle' | 'loading' | 'success' | 'error';
  jobs: 'idle' | 'loading' | 'success' | 'error';
}

class UATHealthCheck {
  private actionLog: ActionLogEntry[] = [];
  private lastApiCall: ApiCallInfo | null = null;
  private loadStates: DataLoadState = {
    projects: 'idle',
    scenarios: 'idle',
    datasets: 'idle',
    vehicles: 'idle',
    jobs: 'idle'
  };

  constructor() {
    if (process.env.NODE_ENV === 'development') {
      this.initializeHealthCheck();
      this.setupApiInterceptor();
      this.setupErrorHandler();
    }
  }

  private initializeHealthCheck() {
    // Expose health check to window in development
    (window as any).__UAT_HEALTH__ = {
      isLoggedIn: () => this.isLoggedIn(),
      currentRoute: () => this.getCurrentRoute(),
      hasErrors: () => this.hasErrors(),
      isLoading: () => this.isLoading(),
      getFormData: (formId?: string) => this.getFormData(formId),
      getLastApiCall: () => this.lastApiCall,
      getActionLog: () => this.actionLog,
      getUserData: () => this.getUserData(),
      getProjectData: () => this.getProjectData(),
      getDataLoadState: () => this.loadStates,
      
      // Utility methods for testing
      logAction: (action: string, details?: any) => {
        this.logAction(action, details);
      },
      clearActionLog: () => {
        this.actionLog = [];
      },
      setLoadState: (entity: keyof DataLoadState, state: DataLoadState[keyof DataLoadState]) => {
        this.loadStates[entity] = state;
      }
    };
  }

  private setupApiInterceptor() {
    // Intercept fetch to track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [url, options] = args;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.lastApiCall = {
          url: typeof url === 'string' ? url : url.toString(),
          method: options?.method || 'GET',
          status: response.status,
          timestamp: startTime,
          duration
        };
        
        // Log significant API calls
        if (response.status >= 400) {
          this.logAction('api_error', {
            url: this.lastApiCall.url,
            status: response.status
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.lastApiCall = {
          url: typeof url === 'string' ? url : url.toString(),
          method: options?.method || 'GET',
          status: 0,
          timestamp: startTime,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        this.logAction('api_network_error', {
          url: this.lastApiCall.url,
          error: this.lastApiCall.error
        });
        
        throw error;
      }
    };
  }

  private setupErrorHandler() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.logAction('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logAction('unhandled_promise_rejection', {
        reason: event.reason
      });
    });
  }

  private isLoggedIn(): boolean {
    // Check multiple sources for auth state
    const hasToken = !!localStorage.getItem('convex-auth-token');
    const hasUser = !!localStorage.getItem('user-data');
    const hasSession = !!sessionStorage.getItem('session-id');
    
    // For Convex auth
    const convexAuth = (window as any).__convexAuthState;
    const isConvexAuthenticated = convexAuth?.isAuthenticated || false;
    
    return hasToken || hasUser || hasSession || isConvexAuthenticated;
  }

  private getCurrentRoute(): string {
    return window.location.pathname;
  }

  private hasErrors(): boolean {
    // Check for various error indicators
    const errorElements = document.querySelectorAll(
      '.error, .error-message, .alert-error, [role="alert"], .form-error'
    );
    
    const hasVisibleErrors = Array.from(errorElements).some(el => {
      const styles = window.getComputedStyle(el);
      return styles.display !== 'none' && styles.visibility !== 'hidden';
    });
    
    // Check for error toasts/notifications
    const hasToastErrors = document.querySelectorAll('.toast-error, .notification-error').length > 0;
    
    return hasVisibleErrors || hasToastErrors;
  }

  private isLoading(): boolean {
    // Check for various loading indicators
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '.skeleton',
      '[aria-busy="true"]',
      '.loading-overlay',
      '.progress-bar:not(.hidden)'
    ];
    
    const hasLoadingElements = loadingSelectors.some(selector => 
      document.querySelector(selector) !== null
    );
    
    // Check if any data is currently loading
    const dataLoading = Object.values(this.loadStates).some(state => state === 'loading');
    
    return hasLoadingElements || dataLoading;
  }

  private getFormData(formId?: string): Record<string, any> | null {
    const form = formId 
      ? document.getElementById(formId) as HTMLFormElement
      : document.querySelector('form');
    
    if (!form) return null;
    
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      if (data[key]) {
        // Handle multiple values (like checkboxes)
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }

  private getUserData(): any {
    // Try multiple sources for user data
    const userData = localStorage.getItem('user-data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {}
    }
    
    // Check for user data in global state
    return (window as any).__userData || null;
  }

  private getProjectData(): any {
    // Get current project data
    const projectData = sessionStorage.getItem('current-project');
    if (projectData) {
      try {
        return JSON.parse(projectData);
      } catch {}
    }
    
    return (window as any).__currentProject || null;
  }

  private logAction(action: string, details?: any) {
    this.actionLog.push({
      action,
      timestamp: Date.now(),
      details
    });
    
    // Keep only last 100 actions
    if (this.actionLog.length > 100) {
      this.actionLog = this.actionLog.slice(-100);
    }
  }
}

// Initialize health check system
export const uatHealthCheck = new UATHealthCheck();
```

### Step 2: Integrate with Your App

In `frontend/src/main.tsx` or `App.tsx`:

```typescript
import { uatHealthCheck } from './utils/uatHealthCheck';

// Initialize UAT health checks in development
if (import.meta.env.DEV) {
  // Health check is auto-initialized
  console.log('UAT Health Check system enabled');
}
```

### Step 3: Integrate with State Management

If using Zustand or similar state management:

```typescript
// In your auth store
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => {
    set({ user });
    // Update health check data
    if (window.__UAT_HEALTH__) {
      window.__userData = user;
    }
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('convex-auth-token');
    if (window.__UAT_HEALTH__) {
      window.__userData = null;
      window.__UAT_HEALTH__.logAction('user_logout');
    }
  }
}));
```

### Step 4: Add to Data Loading Hooks

```typescript
// In your data fetching hooks
export function useProjects() {
  const projects = useQuery(api.projects.list);
  
  useEffect(() => {
    if (window.__UAT_HEALTH__) {
      if (projects === undefined) {
        window.__UAT_HEALTH__.setLoadState('projects', 'loading');
      } else if (projects === null) {
        window.__UAT_HEALTH__.setLoadState('projects', 'error');
      } else {
        window.__UAT_HEALTH__.setLoadState('projects', 'success');
      }
    }
  }, [projects]);
  
  return projects;
}
```

## Usage in UAT Tests

### Basic Health Check

```javascript
// In your UAT test
const health = await browser.evaluate(`window.__UAT_HEALTH__ ? {
  isLoggedIn: window.__UAT_HEALTH__.isLoggedIn(),
  currentRoute: window.__UAT_HEALTH__.currentRoute(),
  hasErrors: window.__UAT_HEALTH__.hasErrors()
} : null`);

if (!health) {
  throw new Error('Health check not available - is app in development mode?');
}
```

### Advanced State Verification

```javascript
// Check complete application state
const appState = await browser.evaluate(`
  if (!window.__UAT_HEALTH__) return null;
  
  const health = window.__UAT_HEALTH__;
  return {
    auth: {
      isLoggedIn: health.isLoggedIn(),
      userData: health.getUserData()
    },
    routing: {
      currentPath: health.currentRoute(),
      isProtectedRoute: health.currentRoute().startsWith('/app')
    },
    ui: {
      hasErrors: health.hasErrors(),
      isLoading: health.isLoading(),
      formData: health.getFormData()
    },
    data: {
      projectData: health.getProjectData(),
      loadStates: health.getDataLoadState()
    },
    debug: {
      lastApiCall: health.getLastApiCall(),
      recentActions: health.getActionLog().slice(-5)
    }
  };
`);
```

### Waiting for State Changes

```javascript
// Wait for data to load
async function waitForDataLoad(entity) {
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  
  while (attempts < maxAttempts) {
    const state = await browser.evaluate(`
      window.__UAT_HEALTH__ ? 
      window.__UAT_HEALTH__.getDataLoadState()['${entity}'] : 
      'no-health-check'
    `);
    
    if (state === 'success') return true;
    if (state === 'error') throw new Error(`${entity} failed to load`);
    
    await browser.wait(1);
    attempts++;
  }
  
  throw new Error(`Timeout waiting for ${entity} to load`);
}

// Usage
await waitForDataLoad('projects');
```

## Security Considerations

1. **Development Only**: Health checks should ONLY be available in development
2. **No Sensitive Data**: Don't expose passwords, tokens, or PII
3. **Read-Only**: Health checks should not modify application state
4. **Clear Naming**: Use obvious names like `__UAT_HEALTH__` to indicate testing code

## Troubleshooting

### Health Check Not Available

```javascript
// Diagnose health check availability
const diagnosis = await browser.evaluate(`({
  isDevelopment: process.env.NODE_ENV === 'development',
  hasHealthCheck: !!window.__UAT_HEALTH__,
  healthCheckType: typeof window.__UAT_HEALTH__,
  availableMethods: window.__UAT_HEALTH__ ? Object.keys(window.__UAT_HEALTH__) : []
})`);
```

### State Not Updating

Ensure your state management integrates with health checks:

```typescript
// Add debug logging
if (window.__UAT_HEALTH__) {
  console.log('Health check state update:', {
    method: 'setUser',
    timestamp: Date.now(),
    data: user
  });
}
```

## Next Steps

1. Implement health checks in your frontend application
2. Test health check availability in development mode
3. Review the [Validation Scripts Guide](./VALIDATION-SCRIPTS-GUIDE.md) for assertion helpers
4. Use health checks in your UAT tests as shown in the workflow guide