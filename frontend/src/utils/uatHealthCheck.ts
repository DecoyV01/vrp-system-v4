// UAT Health Check System
// Only enabled in development mode for security

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
    if (import.meta.env.DEV) {
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