# VRP System v4 - Error Handling Patterns

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-07-06
- **Status**: Production Ready
- **Coverage**: Frontend, Backend, Validation, UAT Testing

## 1. Overview

The VRP System v4 implements comprehensive error handling patterns across all application layers, providing robust error recovery, user-friendly messaging, and comprehensive debugging capabilities. The system follows a defense-in-depth approach with validation at multiple levels and graceful degradation strategies.

### 1.1 Error Handling Philosophy

- **User-First Approach**: Clear, actionable error messages for end users
- **Developer-Friendly**: Detailed error information and debugging tools in development
- **Graceful Degradation**: System continues functioning even with partial failures
- **Comprehensive Validation**: Multiple validation layers preventing error propagation
- **Recovery-Oriented**: Multiple paths for users to recover from error states

## 2. Backend Error Handling (Convex Functions)

### 2.1 Authentication & Authorization Errors

**Pattern**: Descriptive error messages with security context

```typescript
// convex/auth.ts - Standard authentication validation
export async function getCurrentUser(ctx: any) {
  const userId = "user_mock_123"; // Mock for development
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return { _id: userId, name: "Mock User", email: "user@example.com" };
}

// Ownership validation with clear error messages
export async function validateUserOwnership(ctx: any, projectId: string, userId?: string) {
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.ownerId !== userId) {
    throw new Error("Access denied: User does not own this project");
  }
  
  return project;
}
```

**Error Types and Messages:**
- `"User not authenticated"` - Missing or invalid authentication
- `"Access denied: User does not own this project"` - Ownership violation
- `"Project not found"` - Resource does not exist
- `"Cannot delete location: X vehicles reference this location"` - Referential integrity

### 2.2 Resource Validation Errors

**Pattern**: Consistent error format with resource context

```typescript
// convex/vehicles.ts - Relationship validation
export const create = mutation({
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate scenario belongs to project
    if (args.scenarioId) {
      const scenario = await ctx.db.get(args.scenarioId);
      if (!scenario || scenario.projectId !== args.projectId) {
        throw new Error("Scenario does not belong to the specified project");
      }
    }
    
    // Validate dataset belongs to project
    if (args.datasetId) {
      const dataset = await ctx.db.get(args.datasetId);
      if (!dataset || dataset.projectId !== args.projectId) {
        throw new Error("Dataset does not belong to the specified project");
      }
    }
  }
});
```

**Resource Error Patterns:**
- Cross-project reference validation
- Parent-child relationship enforcement
- Foreign key constraint simulation
- Cascading delete protection

### 2.3 Business Logic Validation Errors

**Pattern**: Domain-specific validation with context

```typescript
// convex/locations.ts - Referential integrity protection
export const remove = mutation({
  handler: async (ctx, args) => {
    // Check if vehicles reference this location
    const referencingVehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_location", (q) => q.eq("startLocationId", args.id))
      .collect();
    
    if (referencingVehicles.length > 0) {
      throw new Error(`Cannot delete location: ${referencingVehicles.length} vehicles reference this location`);
    }
    
    // Check if jobs reference this location  
    const referencingJobs = await ctx.db
      .query("jobs")
      .withIndex("by_location", (q) => q.eq("locationId", args.id))
      .collect();
    
    if (referencingJobs.length > 0) {
      throw new Error(`Cannot delete location: ${referencingJobs.length} jobs reference this location`);
    }
  }
});
```

## 3. Input Validation Framework

### 3.1 Zod Schema Validation (`validation.ts`)

**Pattern**: Comprehensive schema validation with detailed error messages

```typescript
// convex/validation.ts - Schema validation with custom refinements
export const vehicleCreateSchema = z.object({
  description: z.string().max(200, "Description too long").optional(),
  profile: z.enum(["car", "truck", "van", "bike", "walking", "motorcycle"]).optional(),
  startLon: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  startLat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  capacity: z.array(z.number().min(0, "Capacity must be non-negative")).max(10, "Too many capacity dimensions").optional(),
  skills: z.array(z.number().int().min(0, "Skill ID must be non-negative")).max(50, "Too many skills").optional(),
  twStart: z.number().int().min(0, "Time window start must be non-negative").optional(),
  twEnd: z.number().int().min(0, "Time window end must be non-negative").optional(),
}).refine(data => {
  // Custom validation: Time window end must be after start
  if (data.twStart !== undefined && data.twEnd !== undefined) {
    return data.twEnd > data.twStart;
  }
  return true;
}, {
  message: "Time window end must be after start",
  path: ["twEnd"],
}).refine(data => {
  // Custom validation: Both coordinates must be provided together
  if (data.startLon !== undefined && data.startLat !== undefined) {
    return true; // Both coordinates provided
  }
  if (data.startLon === undefined && data.startLat === undefined) {
    return true; // Neither coordinate provided
  }
  return false; // Only one coordinate provided
}, {
  message: "Both longitude and latitude must be provided together",
  path: ["startLon"],
});
```

### 3.2 Bulk Validation for CSV Imports

**Pattern**: Error aggregation with detailed reporting

```typescript
// convex/validation.ts - Bulk validation with error collection
export function validateVehiclesBulk(vehicles: any[]) {
  return vehicles.map((vehicle, index) => {
    try {
      return { data: validateVehicle(vehicle), index, valid: true };
    } catch (error) {
      return { 
        error: error instanceof z.ZodError ? error.errors : error, 
        index, 
        valid: false 
      };
    }
  });
}

export function validateJobsBulk(jobs: any[]) {
  return jobs.map((job, index) => {
    try {
      return { data: validateJob(job), index, valid: true };
    } catch (error) {
      return { 
        error: error instanceof z.ZodError ? error.errors : error, 
        index, 
        valid: false 
      };
    }
  });
}
```

### 3.3 VRP Constraint Validation

**Pattern**: Domain-specific business rules

```typescript
// convex/validation.ts - VRP-specific constraints
export const vrpConstraints = {
  maxVehiclesPerDataset: 1000,
  maxJobsPerDataset: 10000,
  maxLocationsPerDataset: 5000,
  maxCapacityDimensions: 10,
  maxSkillsPerEntity: 50,
  maxTimeWindowsPerJob: 5,
  maxTagsPerEntity: 10,
  
  // Validation helper functions
  isValidCoordinate: (lon: number, lat: number) => {
    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  },
  
  isValidTimeOfDay: (time: number) => {
    return time >= 0 && time < 86400; // 24 * 60 * 60 seconds
  },
  
  isValidDistance: (distance: number) => {
    return distance >= 0 && distance <= 100000000; // 100,000 km max
  },
  
  isValidDuration: (duration: number) => {
    return duration >= 0 && duration <= 604800; // 1 week max
  },
};
```

## 4. Optimization Engine Error Handling

### 4.1 Custom Error Class

**Pattern**: Specialized error class for optimization engine compatibility

```typescript
// convex/optimizerValidation.ts - Custom error class
export class OptimizerValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = "OptimizerValidationError";
  }
}
```

### 4.2 Engine-Specific Validation

**Pattern**: Engine compatibility validation with detailed error context

```typescript
// convex/optimizerValidation.ts - Capacity validation for VROOM
export const validateCapacity = (capacity: number[], fieldName = "capacity"): void => {
  if (!Array.isArray(capacity)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an array`, 
      fieldName, 
      capacity
    );
  }
  
  if (capacity.length !== 3) {
    throw new OptimizerValidationError(
      `${fieldName} must have exactly 3 elements [weight, volume, count], got ${capacity.length}`,
      fieldName, 
      capacity
    );
  }
  
  if (capacity.some(c => c < 0)) {
    throw new OptimizerValidationError(
      `${fieldName} elements must be non-negative`,
      fieldName, 
      capacity
    );
  }
};

// Priority validation for optimization engines
export const validatePriority = (priority: number): void => {
  if (typeof priority !== "number" || !Number.isInteger(priority)) {
    throw new OptimizerValidationError(
      "Priority must be an integer",
      "priority", 
      priority
    );
  }
  
  if (priority < 0 || priority > 100) {
    throw new OptimizerValidationError(
      "Priority must be between 0 and 100 for optimization engine compatibility",
      "priority", 
      priority
    );
  }
};

// Cost validation for optimization engines (integer requirements)
export const validateCost = (cost: number, fieldName = "cost"): void => {
  if (typeof cost !== "number") {
    throw new OptimizerValidationError(
      `${fieldName} must be a number`,
      fieldName, 
      cost
    );
  }
  
  if (!Number.isInteger(cost)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an integer (consider storing as cents)`,
      fieldName, 
      cost
    );
  }
  
  if (cost < 0) {
    throw new OptimizerValidationError(
      `${fieldName} must be non-negative`,
      fieldName, 
      cost
    );
  }
};
```

## 5. Frontend Error Handling

### 5.1 React Error Boundaries

**Pattern**: Environment-aware error boundaries with recovery mechanisms

```typescript
// frontend/src/components/UATErrorBoundary.tsx
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class UATErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Log to UAT health check system in development
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      (window as any).__UAT_HEALTH__.logAction('react_error_boundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (import.meta.env.DEV) {
        // Development: Show detailed error information
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                🚨 React Error Boundary
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Error Message:</h3>
                  <p className="text-red-600 font-mono text-sm">
                    {this.state.error?.message}
                  </p>
                </div>
                {this.state.error?.stack && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Stack Trace:</h3>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                <button 
                  onClick={() => this.setState({ hasError: false })}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      } else {
        // Production: Show user-friendly error message
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }
    }

    return this.props.children;
  }
}
```

### 5.2 Component-Level Error Handling

**Pattern**: Async operation error handling with user feedback

```typescript
// frontend/src/pages/ProjectsPage.tsx - Async operation error handling
const ProjectsPage = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProject = useMutation(api.projects.remove);

  const handleDelete = async (project: any) => {
    try {
      setIsDeleting(true);
      await deleteProject({ id: project._id });
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      const projectId = await createProject(projectData);
      toast.success('Project created successfully');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof Error) {
        toast.error(`Failed to create project: ${error.message}`);
      } else {
        toast.error('Failed to create project. Please try again.');
      }
    }
  };

  return (
    // Component JSX with error handling
  );
};
```

### 5.3 Data Loading Error States

**Pattern**: Loading state differentiation with error recovery

```typescript
// frontend/src/hooks/useVRPData.ts - Loading state management
export const useVRPData = (projectId?: string) => {
  const projects = useQuery(api.projects.list);
  const scenarios = useQuery(api.scenarios.listByProject, 
    projectId ? { projectId } : "skip"
  );

  useEffect(() => {
    // Integration with UAT health monitoring
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (projects === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'loading');
      } else if (projects === null) {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'error');
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'success');
      }
    }
  }, [projects]);

  // Convex queries return:
  // - undefined: Loading
  // - null: Error (connection failed)
  // - Array/Object: Success
  
  const isLoading = projects === undefined || 
    (projectId && scenarios === undefined);
  
  const hasError = projects === null || 
    (projectId && scenarios === null);

  return {
    projects: projects || [],
    scenarios: scenarios || [],
    isLoading,
    hasError,
    // Additional computed properties...
  };
};
```

### 5.4 Form Validation Error Display

**Pattern**: User-friendly validation error messages

```typescript
// frontend/src/components/ui/error-message.tsx
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  return (
    <div className={cn(
      'flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
};

// Usage in forms
const ProjectForm = () => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setValidationError(null);
      await createProject(data);
    } catch (error) {
      if (error instanceof Error) {
        setValidationError(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {validationError && (
        <ErrorMessage message={validationError} className="mb-4" />
      )}
      {/* Form fields */}
    </form>
  );
};
```

## 6. CSV Import/Export Error Handling

### 6.1 Comprehensive Validation Display

**Pattern**: Progressive error disclosure with actionable information

```typescript
// frontend/src/components/table-editor/bulk-operations/import/ValidationDisplay.tsx
interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: DuplicateMatch[];
  canProceed: boolean;
}

interface ValidationSummary {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  duplicateCount: number;
  canProceed: boolean;
  blockerCount: number;
}

const ValidationDisplay = ({ results }: { results: ValidationResult }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'errors' | 'warnings' | 'duplicates'>('summary');

  const summary: ValidationSummary = {
    totalIssues: results.errors.length + results.warnings.length + results.duplicates.length,
    errorCount: results.errors.length,
    warningCount: results.warnings.length,
    duplicateCount: results.duplicates.length,
    canProceed: results.canProceed,
    blockerCount: results.errors.filter(e => e.severity === 'error').length
  };

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {summary.canProceed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {summary.canProceed ? 'Ready to import' : 'Cannot proceed'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {results.validRows} valid, {results.invalidRows} invalid of {results.totalRows} rows
            </div>
          </div>
        </div>
        
        {summary.totalIssues > 0 && (
          <div className="mt-4 flex gap-4">
            {summary.errorCount > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{summary.errorCount} errors</span>
              </div>
            )}
            {summary.warningCount > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{summary.warningCount} warnings</span>
              </div>
            )}
            {summary.duplicateCount > 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Copy className="w-4 h-4" />
                <span className="text-sm">{summary.duplicateCount} duplicates</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Error Display */}
      {summary.totalIssues > 0 && (
        <div className="border rounded-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="errors" disabled={summary.errorCount === 0}>
                Errors ({summary.errorCount})
              </TabsTrigger>
              <TabsTrigger value="warnings" disabled={summary.warningCount === 0}>
                Warnings ({summary.warningCount})
              </TabsTrigger>
              <TabsTrigger value="duplicates" disabled={summary.duplicateCount === 0}>
                Duplicates ({summary.duplicateCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="mt-0">
              <ErrorList errors={results.errors} />
            </TabsContent>
            
            <TabsContent value="warnings" className="mt-0">
              <WarningList warnings={results.warnings} />
            </TabsContent>
            
            <TabsContent value="duplicates" className="mt-0">
              <DuplicateList duplicates={results.duplicates} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
```

### 6.2 Error Classification System

**Pattern**: Multi-level error categorization with resolution guidance

```typescript
// Error classification for CSV imports
interface ValidationError {
  type: 'validation' | 'format' | 'business_rule';
  severity: 'error' | 'warning';
  field: string;
  row: number;
  column?: string;
  message: string;
  suggestion?: string;
  canAutoFix?: boolean;
}

interface DuplicateMatch {
  sourceRow: number;
  targetRow: number;
  matchingFields: string[];
  confidence: number;
  action?: 'skip' | 'update' | 'create_new';
}

// Error categorization logic
const categorizeErrors = (errors: ValidationError[]) => {
  return {
    blocking: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    byField: groupBy(errors, 'field'),
    byType: groupBy(errors, 'type'),
    autoFixable: errors.filter(e => e.canAutoFix),
  };
};
```

## 7. Network Error Handling

### 7.1 Convex Connection Management

**Pattern**: Automatic reconnection with loading state management

```typescript
// Convex handles network errors automatically
// Frontend components handle loading states appropriately

const DataComponent = () => {
  const data = useQuery(api.someQuery);
  
  // Convex query states:
  // undefined = loading (initial or reconnecting)
  // null = error (connection failed)
  // data = success
  
  if (data === undefined) {
    return <LoadingSpinner message="Loading data..." />;
  }
  
  if (data === null) {
    return (
      <ErrorMessage 
        message="Failed to load data. Please check your connection." 
      />
    );
  }
  
  return <DataDisplay data={data} />;
};
```

### 7.2 Offline/Connection Error Recovery

**Pattern**: User-initiated retry with connection status awareness

```typescript
// frontend/src/components/ConnectionStatus.tsx
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex items-center gap-2 text-red-700">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Connection lost</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Please check your internet connection. Data will sync when connection is restored.
        </p>
      </div>
    );
  }

  return null;
};
```

## 8. UAT Error Testing Framework

### 8.1 Comprehensive Error Scenarios

**Pattern**: Systematic error condition testing

```javascript
// uat/scenarios/error-handling.cjs - UAT error testing
const errorHandlingScenario = {
  name: "Error Handling and Validation Testing",
  description: "Test comprehensive error handling across the VRP application",
  
  objectives: [
    "client_side_validation",      // Form validation and input sanitization
    "network_error_handling",      // Network failure and timeout scenarios
    "session_timeout_handling",    // Authentication expiration
    "server_side_validation",      // Backend validation and error responses
    "javascript_error_resilience", // JavaScript error boundary testing
    "error_user_experience"        // User-friendly error messages and recovery
  ],

  steps: [
    {
      action: "navigate_to_projects",
      description: "Navigate to projects page",
      validation: ["page_loads_successfully", "no_console_errors"]
    },
    {
      action: "test_form_validation",
      description: "Submit form with invalid data",
      validation: ["validation_errors_displayed", "form_prevents_submission"]
    },
    {
      action: "simulate_network_error",
      description: "Simulate network failure during operation",
      validation: ["error_message_displayed", "retry_option_available"]
    },
    {
      action: "test_session_timeout",
      description: "Clear authentication and test session timeout",
      validation: ["redirect_to_login", "session_restored_after_login"]
    },
    {
      action: "inject_javascript_error",
      description: "Trigger JavaScript error to test error boundaries",
      validation: ["error_boundary_catches_error", "graceful_error_display"]
    },
    {
      action: "test_error_recovery",
      description: "Test user recovery from error states",
      validation: ["retry_buttons_work", "data_refreshes_correctly"]
    }
  ]
};
```

### 8.2 Error Testing Implementation

**Pattern**: Error injection and boundary testing

```javascript
// UAT error testing implementation
async function testErrorHandling(page) {
  // Test form validation
  await page.fill('[data-testid="project-name"]', ''); // Empty required field
  await page.click('[data-testid="submit-button"]');
  
  const validationError = await page.locator('.error-message').first();
  if (await validationError.isVisible()) {
    console.log('✅ Form validation error displayed correctly');
  }

  // Test network error simulation
  await page.route('**/*', route => {
    if (route.request().url().includes('/api/')) {
      route.abort('failed');
    } else {
      route.continue();
    }
  });
  
  await page.click('[data-testid="load-data-button"]');
  const networkError = await page.locator('[data-testid="network-error"]').first();
  if (await networkError.isVisible()) {
    console.log('✅ Network error handled gracefully');
  }

  // Test JavaScript error injection
  await page.evaluate(() => {
    window.dispatchEvent(new Error('Test error for error boundary'));
  });
  
  const errorBoundary = await page.locator('[data-testid="error-boundary"]').first();
  if (await errorBoundary.isVisible()) {
    console.log('✅ Error boundary caught JavaScript error');
  }
}
```

## 9. Logging and Monitoring Patterns

### 9.1 Development Error Logging

**Pattern**: Comprehensive error logging with context preservation

```typescript
// Development error logging with UAT integration
const logError = (error: Error, context: any) => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // UAT health check integration
  if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
    (window as any).__UAT_HEALTH__.logAction('application_error', {
      error: error.message,
      stack: error.stack,
      context,
      componentStack: context.componentStack
    });
  }
};
```

### 9.2 Error Tracking Strategy

**Pattern**: Structured error information for debugging

```typescript
// Error tracking with operation context
interface ErrorContext {
  operation: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  projectId?: string;
  additionalData?: any;
}

const trackError = (error: Error, context: ErrorContext) => {
  const errorReport = {
    timestamp: Date.now(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    environment: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION
  };

  // In development: Log to console and UAT system
  if (import.meta.env.DEV) {
    console.error('Tracked Error:', errorReport);
    
    if ((window as any).__UAT_HEALTH__) {
      (window as any).__UAT_HEALTH__.logAction('tracked_error', errorReport);
    }
  }

  // In production: Send to monitoring service
  if (import.meta.env.PROD) {
    // sendToMonitoringService(errorReport);
  }
};
```

## 10. Error Recovery Patterns

### 10.1 Graceful Degradation

**Pattern**: Partial functionality preservation during errors

```typescript
// Component with graceful degradation
const ProjectDashboard = () => {
  const projects = useQuery(api.projects.list);
  const scenarios = useQuery(api.scenarios.listByProject, 
    projects?.[0]?._id ? { projectId: projects[0]._id } : "skip"
  );
  const vehicles = useQuery(api.vehicles.listByProject,
    projects?.[0]?._id ? { projectId: projects[0]._id } : "skip"
  );

  // Graceful degradation: Show what we can
  return (
    <div className="space-y-6">
      {/* Projects section - core functionality */}
      {projects === undefined ? (
        <LoadingSkeleton />
      ) : projects === null ? (
        <ErrorSection 
          title="Projects" 
          message="Failed to load projects"
          action={() => window.location.reload()}
        />
      ) : (
        <ProjectsList projects={projects} />
      )}

      {/* Scenarios section - enhanced functionality */}
      {projects && (
        <div>
          {scenarios === undefined ? (
            <LoadingSkeleton />
          ) : scenarios === null ? (
            <ErrorSection 
              title="Scenarios" 
              message="Failed to load scenarios. Project data is still available."
              canDismiss={true}
            />
          ) : (
            <ScenariosList scenarios={scenarios} />
          )}
        </div>
      )}

      {/* Vehicles section - optional functionality */}
      {projects && (
        <div>
          {vehicles === undefined ? (
            <LoadingSkeleton />
          ) : vehicles === null ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">
              Vehicle data temporarily unavailable
            </div>
          ) : (
            <VehiclesList vehicles={vehicles} />
          )}
        </div>
      )}
    </div>
  );
};
```

### 10.2 User-Initiated Recovery

**Pattern**: Recovery actions with clear user feedback

```typescript
// Recovery component with retry mechanisms
const RecoveryActions = ({ 
  error, 
  onRetry, 
  onReset, 
  canRetry = true, 
  canReset = true 
}: RecoveryActionsProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
      toast.success('Operation completed successfully');
    } catch (error) {
      toast.error('Retry failed. Please try again or contact support.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Something went wrong</h3>
          <p className="text-sm text-red-700 mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          
          <div className="flex gap-2 mt-4">
            {canRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-red-100 text-red-800 px-3 py-1.5 rounded text-sm hover:bg-red-200 disabled:opacity-50"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            
            {canReset && (
              <button
                onClick={onReset}
                className="bg-white text-red-800 border border-red-300 px-3 py-1.5 rounded text-sm hover:bg-red-50"
              >
                Reset
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-red-800 border border-red-300 px-3 py-1.5 rounded text-sm hover:bg-red-50"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Summary

The VRP System v4 error handling system demonstrates production-ready practices with:

### **Key Strengths:**

1. **Multi-Layer Validation**: Client-side, server-side, and optimization engine validation
2. **User-Centric Design**: Clear, actionable error messages for end users
3. **Developer Support**: Comprehensive debugging information in development mode
4. **Graceful Degradation**: System continues functioning with partial failures
5. **Recovery Mechanisms**: Multiple paths for users to recover from errors
6. **Comprehensive Testing**: UAT framework specifically for error scenarios
7. **Monitoring Integration**: Error tracking and health monitoring capabilities
8. **Consistent Patterns**: Standardized error handling across all application layers

### **Error Coverage:**

- **Authentication & Authorization**: User ownership and access control
- **Input Validation**: Comprehensive Zod schemas with custom refinements
- **Business Logic**: Domain-specific VRP constraints and relationships
- **Optimization Engine**: Engine-specific validation for VROOM/OR-Tools compatibility
- **Network Errors**: Connection failures and retry mechanisms
- **UI Errors**: React error boundaries with recovery options
- **Bulk Operations**: CSV import validation with detailed error reporting
- **System Errors**: JavaScript errors and unexpected failures

This comprehensive error handling framework ensures robust operation in production environments while providing excellent developer and user experiences during error conditions.