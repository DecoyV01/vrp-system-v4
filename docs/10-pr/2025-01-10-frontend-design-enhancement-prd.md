# Frontend Design Enhancement - Product Requirements Document

**Document Version**: 1.0  
**Created**: January 10, 2025  
**Last Updated**: January 10, 2025  
**Status**: Draft  

## 1. Executive Summary

### Problem Statement
The VRP System v4 frontend currently lacks a cohesive design system that reflects the Decoy brand identity. The interface requires visual modernization with proper branding, improved navigation clarity, and streamlined user interface elements to enhance user experience and professional presentation.

### Solution Overview
Implement a comprehensive frontend design enhancement that establishes the Decoy brand visual identity through strategic color scheme implementation, creates a professional top navigation ribbon, modernizes the primary sidebar with clear iconography, and optimizes the table editor interface for improved usability.

### Success Metrics
- **User Satisfaction**: 40% improvement in UI/UX satisfaction scores
- **Task Completion Speed**: 25% faster navigation between sections
- **Professional Appearance**: 90% of users rate interface as "professional" or "very professional"
- **Brand Recognition**: 95% brand consistency across all interface elements

## 2. Business Context

### Current State
- Inconsistent color scheme not aligned with Decoy brand identity
- Missing professional top navigation for environment awareness
- Generic sidebar icons lacking clarity and modern aesthetics
- Table editor contains redundant descriptive text that clutters interface
- Overall interface lacks cohesive branding and professional polish

### Target Users
- **Primary**: VRP optimization specialists and logistics managers
- **Secondary**: Data analysts and transportation coordinators
- **Tertiary**: Executive stakeholders reviewing optimization results

### Business Value
- **Brand Consistency**: Establishes strong Decoy brand presence across the platform
- **User Experience**: Reduces cognitive load and improves navigation efficiency
- **Professional Image**: Enhances credibility with enterprise clients
- **Competitive Advantage**: Modern interface differentiates from legacy VRP tools

## 3. Functional Requirements

### Core Features

#### 3.1 Brand-Aligned Color Scheme Implementation
**Business Requirement**: Establish cohesive visual identity using Decoy brand colors

**Selected Color Palette**: Based on logo analysis, implement the bright green on dark theme
- **Primary Brand Color**: `#00d084` (Bright Green)
- **Background Color**: `#1e293b` (Dark Navy)
- **Text Colors**: 
  - Primary: `#ffffff` (White)
  - Secondary: `#cbd5e1` (Light Gray)
  - Muted: `#64748b` (Gray)
- **Accent Colors**:
  - Success: `#10b981` (Green)
  - Warning: `#f59e0b` (Amber)
  - Error: `#ef4444` (Red)
  - Info: `#3b82f6` (Blue)

**Acceptance Criteria**:
- All interface elements use consistent brand color palette
- High contrast ratios meet WCAG accessibility standards
- Color usage follows semantic meaning (green=success, red=error, etc.)
- Hover states and interactive elements use appropriate color variations

#### 3.2 Professional Top Ribbon Navigation
**Business Requirement**: Create environment-aware top navigation bar

**Features**:
- **Environment Indicator**: Clear visual distinction between Development/Staging/Production
- **Connection Status**: Real-time Convex connection indicator
- **User Context**: Current user identification and quick actions
- **System Status**: Health indicators and notifications
- **Quick Actions**: Feedback, help, and settings access

**Acceptance Criteria**:
- Environment badge clearly shows current deployment (Dev/Staging/Production)
- Connection status updates in real-time with color-coded indicators
- Responsive design works on mobile and desktop
- Consistent branding with selected color scheme
- Accessible keyboard navigation support

#### 3.3 Modernized Primary Sidebar Icons
**Business Requirement**: Replace current sidebar icons with clear, professional iconography

**Icon Categories**:
- **Navigation Icons**: Home, Projects, Scenarios, Datasets
- **Data Management**: Tables, Import/Export, Analytics
- **Operations**: Optimization, Routes, Reporting
- **System**: Settings, Help, User Profile

**Design Standards**:
- **Style**: Outline/line icons for consistency
- **Size**: 20px standard with 24px for primary actions
- **Weight**: 1.5px stroke weight for optimal clarity
- **Accessibility**: Icons paired with text labels and aria-labels

**Acceptance Criteria**:
- All sidebar icons follow consistent design language
- Icons are semantically meaningful and intuitive
- Hover states provide clear visual feedback
- Icons scale properly across different screen sizes
- Screen reader compatible with appropriate labels

#### 3.4 Streamlined Table Editor Interface
**Business Requirement**: Remove redundant descriptive text and improve content hierarchy

**Optimization Areas**:
- **Header Simplification**: Remove redundant dataset version text
- **Context Clarity**: Improve breadcrumb navigation visibility
- **Action Prioritization**: Emphasize primary actions while maintaining secondary options
- **Content Density**: Optimize spacing for better information hierarchy

**Acceptance Criteria**:
- Table editor headings are concise and descriptive
- Breadcrumb navigation clearly shows current context
- Primary actions (Add, Import, Export) are visually prominent
- Secondary actions remain accessible but don't compete for attention
- Improved readability with appropriate white space usage

## 4. Non-Functional Requirements

### Performance Expectations
- **Color Theme Application**: Instantaneous theme changes with CSS custom properties
- **Icon Loading**: SVG icons load in <50ms with proper caching
- **Navigation Response**: Top ribbon and sidebar interactions respond in <100ms
- **Theme Consistency**: All components reflect theme changes without page refresh

### Reliability & Availability
- **Cross-Browser Support**: Consistent appearance across Chrome, Firefox, Safari, Edge
- **Device Compatibility**: Responsive design works on desktop, tablet, and mobile
- **Theme Persistence**: User theme preferences saved and restored across sessions

### Security & Compliance
- **Content Security Policy**: All design assets comply with CSP requirements
- **Accessibility**: WCAG 2.1 AA compliance for color contrast and navigation
- **Data Privacy**: No external font or icon dependencies that could leak data

### Accessibility
- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text elements
- **Focus Indicators**: Clear keyboard navigation focus states
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Motion Sensitivity**: Respect user preferences for reduced motion

## 5. Business Rules & Constraints

### Data Validation Rules
- **Color Values**: All colors must use CSS custom properties for theme consistency
- **Icon Standards**: Icons must be SVG format with proper viewBox attributes
- **Responsive Breakpoints**: Follow established Tailwind CSS breakpoint system

### Workflow Rules
- **Theme Application**: Changes apply immediately without requiring page refresh
- **Icon Consistency**: All icons within same category must use identical styling
- **Navigation Hierarchy**: Sidebar order reflects user workflow priority

### Integration Requirements
- **Design System Integration**: Leverage existing shadcn/ui components where possible
- **Tailwind CSS Compatibility**: All styles use Tailwind utilities and custom properties
- **Component Library**: Maintain compatibility with existing component architecture

## 6. Success Criteria

### Acceptance Criteria
- **Visual Consistency**: 100% of interface elements follow design system guidelines
- **Brand Alignment**: Color scheme matches selected Decoy logo variant exactly
- **Navigation Clarity**: Users can identify current location and navigate efficiently
- **Professional Appearance**: Interface meets enterprise software visual standards

### Performance Benchmarks
- **Theme Load Time**: Complete theme application in <200ms
- **Navigation Response**: All interactive elements respond within 100ms
- **Icon Rendering**: SVG icons render without visual artifacts or delays
- **Mobile Performance**: Full functionality maintained on mobile devices

### User Satisfaction Metrics
- **Task Completion**: 95% of users complete navigation tasks without assistance
- **Visual Appeal**: 85% of users rate interface as visually appealing
- **Professional Perception**: 90% of stakeholders consider interface enterprise-ready
- **Accessibility Compliance**: 100% compliance with WCAG 2.1 AA standards

## 7. Dependencies & Assumptions

### Business Dependencies
- **Brand Guidelines**: Approval of selected color scheme by design stakeholders
- **User Feedback**: Validation of icon choices with target user groups
- **Content Strategy**: Finalization of simplified text content for table editor

### Key Assumptions
- **Technology Stack**: Continued use of Tailwind CSS v4 and shadcn/ui components
- **Browser Support**: Target browsers support CSS custom properties and SVG
- **User Devices**: Primary usage on desktop with secondary mobile access
- **Performance Requirements**: Current Convex backend can support real-time status updates

### Risk Mitigation
- **Color Accessibility**: Comprehensive contrast testing before implementation
- **Icon Recognition**: User testing to validate icon intuitiveness
- **Performance Impact**: Monitoring to ensure design changes don't affect load times
- **Browser Compatibility**: Progressive enhancement for older browser support

## 8. Implementation Phases

### Phase 1: Core Design System (Week 1)
- Implement selected color scheme with CSS custom properties
- Create design token system for consistent spacing and typography
- Update core UI components to use new color palette
- Establish icon component system with SVG optimization

### Phase 2: Navigation Enhancement (Week 2)
- Develop top ribbon navigation component
- Implement environment indicator and connection status
- Update primary sidebar with new iconography
- Create responsive navigation patterns

### Phase 3: Interface Optimization (Week 3)
- Streamline table editor interface elements
- Optimize content hierarchy and spacing
- Implement improved breadcrumb navigation
- Refine action button hierarchy and positioning

### Phase 4: Quality Assurance & Launch (Week 4)
- Comprehensive accessibility testing and remediation
- Cross-browser and device compatibility validation
- Performance optimization and monitoring setup
- User acceptance testing and feedback incorporation

## 9. Appendices

### Glossary
- **Design Tokens**: Centralized values for colors, spacing, and typography
- **CSS Custom Properties**: CSS variables that enable dynamic theming
- **WCAG**: Web Content Accessibility Guidelines for inclusive design
- **SVG**: Scalable Vector Graphics format for crisp icon rendering

### References
- **Decoy Brand Guidelines**: Logo variants and color specifications
- **shadcn/ui Documentation**: Component library standards and patterns
- **Tailwind CSS v4**: Utility-first CSS framework documentation
- **WCAG 2.1 Guidelines**: Accessibility compliance requirements

## 10. Technical Architecture

### System Architecture
The frontend design enhancement will be implemented as a comprehensive design system upgrade following a layered architecture approach with centralized theme management and component standardization.

#### Overall Technical Approach
- **Theme-First Architecture**: CSS custom properties with OKLCH color format for dynamic theming
- **Component Composition**: shadcn/ui v4 components with Tailwind CSS v4 utility classes
- **Design Token System**: Centralized design tokens in `globals.css` with semantic naming
- **Progressive Enhancement**: Maintain existing functionality while upgrading visual presentation

#### Component Organization
```typescript
// Design system component hierarchy
src/
├── styles/
│   ├── globals.css           // Design tokens and CSS variables
│   ├── themes/
│   │   ├── light.css        // Light theme OKLCH values
│   │   └── dark.css         // Dark theme OKLCH values
├── components/
│   ├── ui/                  // shadcn/ui components
│   │   ├── button.tsx       // Enhanced with Decoy brand colors
│   │   ├── navigation.tsx   // Top ribbon component
│   │   └── sidebar.tsx      // Enhanced sidebar with new icons
│   └── layout/
│       ├── TopRibbon.tsx    // New environment-aware navigation
│       ├── PrimarySidebar.tsx // Updated with modern icons
│       └── ThemeProvider.tsx  // Enhanced theme management
```

### Backend Architecture

#### Convex Functions
No new backend functions required - design enhancement is purely frontend-focused.

#### Database Schema
No schema changes required for design system implementation.

#### Real-time Updates
Existing Convex WebSocket connections maintained for theme preference synchronization.

#### Authentication
Integration with existing authentication system for theme preference persistence.

### Frontend Architecture

#### Component Structure
```typescript
// Enhanced layout architecture
<ThemeProvider defaultTheme="dark" storageKey="vrp-theme">
  <div className="min-h-screen bg-background text-foreground">
    <TopRibbon 
      environment={currentEnvironment}
      connectionStatus={convexStatus}
      user={currentUser}
    />
    <div className="flex">
      <PrimarySidebar 
        navigation={navigationItems}
        activeItem={currentRoute}
        collapsible
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  </div>
</ThemeProvider>
```

#### State Management
```typescript
// Theme state management with Zustand
interface ThemeStore {
  theme: 'light' | 'dark' | 'system'
  colorScheme: 'decoy-green' | 'custom'
  sidebarCollapsed: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  updateColorScheme: (scheme: string) => void
}

// Integration with existing VRP data state
const useTheme = create<ThemeStore>((set) => ({
  theme: 'dark',
  colorScheme: 'decoy-green',
  sidebarCollapsed: false,
  
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.setAttribute('data-theme', theme)
  },
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  updateColorScheme: (scheme) => set({ colorScheme: scheme })
}))
```

#### Routing
React Router integration maintained with enhanced route-based theme preferences.

#### UI Framework
**shadcn/ui + Tailwind CSS v4 Implementation**:
- **New-York Style**: Default component style for professional appearance
- **Individual Component Installation**: Only required components installed via CLI
- **CVA Integration**: Class Variance Authority for component variants
- **2-Layer Architecture**: Radix UI (behavior) + Tailwind CSS (styling)

### Integration Architecture

#### Design Token System
```css
/* globals.css - Design token implementation */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

:root {
  /* Decoy Brand Colors (OKLCH format) */
  --color-primary: oklch(65% 0.15 160);     /* Decoy Green */
  --color-background: oklch(22% 0.02 260);   /* Dark Navy */
  --color-foreground: oklch(95% 0.01 270);   /* White */
  --color-muted: oklch(45% 0.01 260);        /* Gray */
  
  /* Semantic Color Tokens */
  --color-success: oklch(60% 0.12 145);      /* Green */
  --color-warning: oklch(70% 0.15 65);       /* Amber */
  --color-error: oklch(58% 0.15 25);         /* Red */
  --color-info: oklch(65% 0.12 250);         /* Blue */
  
  /* Component-specific tokens */
  --border-radius: 0.5rem;
  --border-width: 1px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

[data-theme="light"] {
  --color-background: oklch(98% 0.01 270);
  --color-foreground: oklch(15% 0.01 260);
}
```

#### Environment Detection
```typescript
// Environment-aware theming
interface EnvironmentConfig {
  name: 'development' | 'staging' | 'production'
  indicatorColor: string
  convexUrl: string
  features: string[]
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const convexUrl = import.meta.env.VITE_CONVEX_URL
  
  if (convexUrl.includes('mild-elephant-70')) {
    return {
      name: 'production',
      indicatorColor: 'oklch(60% 0.12 145)', // Green
      convexUrl,
      features: ['analytics', 'monitoring']
    }
  }
  
  return {
    name: 'development',
    indicatorColor: 'oklch(70% 0.15 65)', // Amber
    convexUrl,
    features: ['debug', 'hot-reload']
  }
}
```

## 11. Technical Design System Requirements

### Typography Standards
```typescript
// Strict 4-size typography system
const typographyScale = {
  'text-sm': '0.875rem',   // 14px - Small text, labels
  'text-base': '1rem',     // 16px - Body text
  'text-lg': '1.125rem',   // 18px - Subheadings
  'text-xl': '1.25rem',    // 20px - Main headings
} as const

// Only 2 font weights allowed
const fontWeights = {
  'font-normal': '400',    // Body text, regular content
  'font-semibold': '600',  // Headings, emphasis
} as const

// Forbidden typography utilities
const forbiddenTypography = [
  'text-xs', 'text-2xl', 'text-3xl', // Size violations
  'font-bold', 'font-medium', 'font-light', // Weight violations
]
```

### Spacing System
```typescript
// 8pt Grid System - all values must be divisible by 8 or 4
const spacingScale = {
  'spacing-1': '0.25rem',  // 4px
  'spacing-2': '0.5rem',   // 8px
  'spacing-3': '0.75rem',  // 12px
  'spacing-4': '1rem',     // 16px
  'spacing-6': '1.5rem',   // 24px
  'spacing-8': '2rem',     // 32px
  'spacing-12': '3rem',    // 48px
  'spacing-16': '4rem',    // 64px
  'spacing-20': '5rem',    // 80px
  'spacing-24': '6rem',    // 96px
} as const

// Forbidden spacing values (not divisible by 4)
const forbiddenSpacing = [
  'p-1', 'p-3', 'p-5', 'p-7', 'p-9', 'p-10', 'p-11',
  'gap-1', 'gap-3', 'gap-5', 'gap-7', 'gap-9', 'gap-10'
]
```

### Color System
```typescript
// 60/30/10 Color Distribution Rule
interface ColorDistribution {
  neutral: string[]      // 60% - Background colors
  complementary: string[] // 30% - Text and UI elements
  accent: string[]       // 10% - Brand colors and CTAs
}

const decoyColorScheme: ColorDistribution = {
  // 60% Neutral colors
  neutral: [
    'bg-background',     // Primary surface color
    'bg-card',          // Card backgrounds
    'bg-muted',         // Subtle backgrounds
    'border',           // Border colors
  ],
  
  // 30% Complementary colors
  complementary: [
    'text-foreground',   // Primary text
    'text-muted-foreground', // Secondary text
    'bg-secondary',      // Secondary surfaces
  ],
  
  // 10% Accent colors (use sparingly)
  accent: [
    'bg-primary',        // Primary CTA buttons
    'text-primary',      // Primary links
    'bg-destructive',    // Error states
    'bg-success',        // Success states
  ]
}

// Color validation function
const validateColorUsage = (element: HTMLElement): boolean => {
  const classes = element.className.split(' ')
  const accentClasses = classes.filter(cls => 
    cls.startsWith('bg-primary') || 
    cls.startsWith('text-primary') ||
    cls.startsWith('border-primary')
  )
  
  // Accent colors should be used sparingly (max 10% of elements)
  return accentClasses.length <= Math.ceil(classes.length * 0.1)
}
```

### Component Standards
```typescript
// shadcn/ui component patterns with data-slot attributes
const ComponentVariants = {
  Button: {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
}

// Data-slot implementation for consistent styling
interface ComponentWithSlots {
  'data-slot'?: 'base' | 'icon' | 'text' | 'indicator'
  className?: string
}

const TopRibbonComponent = () => (
  <nav data-slot="base" className="border-b border-border bg-background">
    <div data-slot="container" className="flex items-center justify-between px-6 py-3">
      <div data-slot="left" className="flex items-center gap-4">
        <EnvironmentIndicator />
        <ConnectionStatus />
      </div>
      <div data-slot="right" className="flex items-center gap-2">
        <UserMenu />
        <ThemeToggle />
      </div>
    </div>
  </nav>
)
```

### Accessibility Requirements
```typescript
// WCAG 2.1 AA compliance standards
const accessibilityStandards = {
  colorContrast: {
    normalText: 4.5,      // Minimum contrast ratio
    largeText: 3.0,       // For text ≥18px or ≥14px bold
    uiComponents: 3.0,    // For interactive elements
  },
  
  focusIndicators: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: 'var(--color-primary)',
    outlineOffset: '2px',
  },
  
  touchTargets: {
    minSize: '44px',      // Minimum touch target size
    spacing: '8px',       // Minimum spacing between targets
  },
  
  semanticMarkup: {
    headingHierarchy: true,   // Proper h1-h6 usage
    landmarkRoles: true,      // nav, main, aside, etc.
    ariaLabels: true,         // Required for icons and buttons
  }
}

// Focus management for keyboard navigation
const focusManagement = {
  trapFocus: (container: HTMLElement) => {
    // Implementation for modal dialogs
  },
  
  restoreFocus: (previousElement: HTMLElement) => {
    // Return focus after modal close
  },
  
  skipLinks: ['#main-content', '#primary-navigation'],
}
```

## 12. Technical Implementation Details

### Database Design
No database schema changes required for frontend design enhancement.

### API Specifications
```typescript
// Theme preference storage (optional enhancement)
interface UserPreferences {
  userId: Id<'users'>
  theme: 'light' | 'dark' | 'system'
  colorScheme: 'decoy-green' | 'custom'
  sidebarCollapsed: boolean
  updatedAt: number
}

// Convex mutation for preference storage
export const updateUserPreferences = mutation({
  args: {
    theme: v.optional(v.string()),
    colorScheme: v.optional(v.string()),
    sidebarCollapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Unauthorized')
    
    await ctx.db.patch(user.preferencesId, {
      ...args,
      updatedAt: Date.now(),
    })
  }
})
```

### Security Implementation

#### Content Security Policy
```typescript
// CSP headers for design assets
const cspDirectives = {
  'default-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // For CSS custom properties
  'font-src': ["'self'", 'data:'],
  'img-src': ["'self'", 'data:', 'blob:'],
  'script-src': ["'self'"],
}
```

#### Theme Security
```typescript
// Validate theme inputs to prevent XSS
const validateThemeInput = (theme: string): boolean => {
  const allowedThemes = ['light', 'dark', 'system']
  return allowedThemes.includes(theme)
}

// Sanitize CSS custom property values
const sanitizeCSSValue = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9#().,%-]/g, '')
}
```

#### Error Handling
```typescript
// Secure error reporting for theme system
interface ThemeError {
  code: 'THEME_LOAD_FAILED' | 'INVALID_COLOR_FORMAT' | 'CSS_PARSE_ERROR'
  message: string
  context: Record<string, unknown>
}

const handleThemeError = (error: ThemeError): void => {
  // Log error without exposing sensitive information
  console.error('[Theme System]', error.code, error.message)
  
  // Fallback to default theme
  document.documentElement.setAttribute('data-theme', 'dark')
  
  // Show user-friendly error message
  toast.error('Theme loading failed, using default appearance')
}
```

### Performance Requirements

#### Response Times
```typescript
// Performance benchmarks for design system
const performanceTargets = {
  themeApplication: 200,        // ms - Complete theme change
  iconRendering: 50,            // ms - SVG icon render time
  navigationResponse: 100,      // ms - Sidebar/ribbon interactions
  colorTransition: 300,         // ms - Color scheme transitions
  
  // Bundle size targets
  maxCSSBundle: 150,            // KB - Tailwind CSS bundle
  maxIconBundle: 50,            // KB - SVG icon bundle
  maxComponentBundle: 100,      // KB - Component library
}

// Performance monitoring
const measureThemePerformance = (): void => {
  performance.mark('theme-start')
  
  // Apply theme changes
  document.documentElement.setAttribute('data-theme', newTheme)
  
  requestAnimationFrame(() => {
    performance.mark('theme-end')
    performance.measure('theme-application', 'theme-start', 'theme-end')
    
    const measure = performance.getEntriesByName('theme-application')[0]
    if (measure.duration > performanceTargets.themeApplication) {
      console.warn('Theme application exceeded target:', measure.duration)
    }
  })
}
```

#### Bundle Size Optimization
```typescript
// Tailwind CSS purging configuration
const tailwindConfig = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Preserve dynamic theme classes
    'data-theme',
    /^text-(sm|base|lg|xl)$/,
    /^font-(normal|semibold)$/,
    /^(p|m|gap)-(2|4|6|8|12|16|20|24)$/,
  ],
  blocklist: [
    // Remove forbidden utilities
    'text-xs', 'text-2xl', 'text-3xl',
    'font-bold', 'font-medium', 'font-light',
  ]
}

// Code splitting for theme-related components
const ThemeProvider = lazy(() => import('./components/ThemeProvider'))
const TopRibbon = lazy(() => import('./components/layout/TopRibbon'))
const PrimarySidebar = lazy(() => import('./components/layout/PrimarySidebar'))
```

#### Caching Strategy
```typescript
// Theme asset caching
const themeCache = new Map<string, CSSStyleSheet>()

const loadThemeStylesheet = async (theme: string): Promise<CSSStyleSheet> => {
  if (themeCache.has(theme)) {
    return themeCache.get(theme)!
  }
  
  const response = await fetch(`/themes/${theme}.css`)
  const cssText = await response.text()
  const stylesheet = new CSSStyleSheet()
  await stylesheet.replace(cssText)
  
  themeCache.set(theme, stylesheet)
  return stylesheet
}

// Service worker for icon caching
const cacheStrategy = {
  icons: 'CacheFirst',     // Icons rarely change
  themes: 'StaleWhileRevalidate', // Themes may update
  fonts: 'CacheFirst',     // System fonts
}
```

## 13. Development Standards

### Backend Standards (Convex)
No backend changes required for design system implementation.

### Frontend Standards (React)

#### Component Patterns
```typescript
// Standard component structure with design system compliance
interface ComponentProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  children?: React.ReactNode
}

const DesignSystemComponent = ({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}: ComponentProps) => {
  return (
    <div
      data-slot="base"
      className={cn(
        // Base styles following design system
        'text-base font-normal', // Typography compliance
        'p-4 gap-4',            // 8pt grid compliance
        'bg-background text-foreground', // Color system compliance
        componentVariants({ variant, size }),
        className
      )}
      {...props}
    />
  )
}

// HOC for design system validation
const withDesignSystemValidation = <T extends object>(
  Component: React.ComponentType<T>
) => {
  return (props: T) => {
    if (process.env.NODE_ENV === 'development') {
      validateDesignSystemCompliance(Component.name, props)
    }
    return <Component {...props} />
  }
}
```

#### State Management
```typescript
// Reactive patterns with Convex for theme preferences
const useThemePreferences = () => {
  const user = useQuery(api.users.getCurrentUser)
  const updatePreferences = useMutation(api.users.updatePreferences)
  
  const theme = useMemo(() => {
    return user?.preferences?.theme || 'dark'
  }, [user?.preferences?.theme])
  
  const setTheme = useCallback(async (newTheme: string) => {
    // Immediate UI update (optimistic)
    document.documentElement.setAttribute('data-theme', newTheme)
    
    // Persist to database
    try {
      await updatePreferences({ theme: newTheme })
    } catch (error) {
      // Revert on error
      document.documentElement.setAttribute('data-theme', theme)
      toast.error('Failed to save theme preference')
    }
  }, [theme, updatePreferences])
  
  return { theme, setTheme }
}
```

#### Performance Optimization
```typescript
// Memoization for expensive design system calculations
const useOptimizedIconRendering = (icons: IconDefinition[]) => {
  return useMemo(() => {
    return icons.map(icon => ({
      ...icon,
      component: lazy(() => import(`./icons/${icon.name}`)),
      preload: () => import(`./icons/${icon.name}`), // Preload on hover
    }))
  }, [icons])
}

// Virtual scrolling for large navigation lists
const VirtualizedNavigation = ({ items, itemHeight = 48 }) => {
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(10)
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])
  
  return (
    <div className="overflow-auto" onScroll={handleScroll}>
      {visibleItems.map(item => (
        <NavigationItem key={item.id} {...item} />
      ))}
    </div>
  )
}
```

#### Testing Strategy
```typescript
// Component testing with design system validation
describe('TopRibbon Component', () => {
  it('follows design system typography standards', () => {
    render(<TopRibbon />)
    
    const headings = screen.getAllByRole('heading')
    headings.forEach(heading => {
      const computedStyle = getComputedStyle(heading)
      const fontSize = computedStyle.fontSize
      
      // Validate only allowed font sizes
      expect(['14px', '16px', '18px', '20px']).toContain(fontSize)
      
      const fontWeight = computedStyle.fontWeight
      expect(['400', '600']).toContain(fontWeight)
    })
  })
  
  it('follows 8pt grid spacing system', () => {
    render(<TopRibbon />)
    
    const container = screen.getByRole('navigation')
    const computedStyle = getComputedStyle(container)
    
    // Check padding values are divisible by 4
    const padding = parseInt(computedStyle.padding)
    expect(padding % 4).toBe(0)
  })
  
  it('follows 60/30/10 color distribution', () => {
    render(<TopRibbon />)
    
    const elements = container.querySelectorAll('*')
    const colorUsage = analyzeColorDistribution(elements)
    
    expect(colorUsage.neutral).toBeGreaterThan(0.5) // ~60%
    expect(colorUsage.accent).toBeLessThan(0.15)    // ~10%
  })
})

// Visual regression testing
const visualRegressionTests = {
  'top-ribbon-light': () => render(<TopRibbon theme="light" />),
  'top-ribbon-dark': () => render(<TopRibbon theme="dark" />),
  'sidebar-collapsed': () => render(<PrimarySidebar collapsed />),
  'sidebar-expanded': () => render(<PrimarySidebar collapsed={false} />),
}
```

### Code Quality

#### TypeScript Standards
```typescript
// Strict typing for design system components
interface StrictDesignSystemProps {
  // Only allow design system compliant sizes
  size: 'sm' | 'base' | 'lg' | 'xl'
  
  // Only allow design system compliant weights
  weight: 'normal' | 'semibold'
  
  // Type-safe color variants
  variant: keyof typeof designSystemColors
  
  // Enforce spacing compliance
  spacing: 2 | 4 | 6 | 8 | 12 | 16 | 20 | 24
}

// Utility types for design system
type DesignSystemColor = `bg-${string}` | `text-${string}` | `border-${string}`
type SpacingValue = `p-${2 | 4 | 6 | 8}` | `m-${2 | 4 | 6 | 8}` | `gap-${2 | 4 | 8}`
type TypographySize = 'text-sm' | 'text-base' | 'text-lg' | 'text-xl'
type TypographyWeight = 'font-normal' | 'font-semibold'

// Design system validation at compile time
type ValidDesignSystemClass<T extends string> = 
  T extends TypographySize ? T :
  T extends TypographyWeight ? T :
  T extends SpacingValue ? T :
  T extends DesignSystemColor ? T :
  never

const validateClassName = <T extends string>(
  className: ValidDesignSystemClass<T>
): T => className
```

#### ESLint Configuration
```typescript
// ESLint rules for design system compliance
const eslintRules = {
  // Typography enforcement
  'no-restricted-syntax': [
    'error',
    {
      selector: 'Literal[value=/text-(xs|2xl|3xl|4xl)/]',
      message: 'Only 4 font sizes allowed: text-sm, text-base, text-lg, text-xl'
    },
    {
      selector: 'Literal[value=/font-(bold|medium|light)/]',
      message: 'Only 2 font weights allowed: font-normal, font-semibold'
    }
  ],
  
  // Spacing enforcement
  'design-system/spacing-compliance': [
    'error',
    {
      allowedValues: [2, 4, 6, 8, 12, 16, 20, 24],
      message: 'Spacing must follow 8pt grid (divisible by 4)'
    }
  ],
  
  // Color distribution enforcement
  'design-system/color-distribution': [
    'warn',
    {
      accentColorLimit: 0.1,
      message: 'Accent colors should be used sparingly (≤10%)'
    }
  ]
}
```

#### Git Hooks Integration
```bash
#!/bin/bash
# .claude/hooks/design-system-check.sh

echo "🎨 Checking design system compliance..."

# Check for forbidden typography
if grep -r "text-xs\|text-2xl\|text-3xl\|font-bold\|font-medium" src/; then
  echo "❌ Typography violations found"
  echo "Only allowed: text-sm, text-base, text-lg, text-xl"
  echo "Only allowed: font-normal, font-semibold"
  exit 1
fi

# Check for spacing violations
if grep -r "p-[135790]\|m-[135790]\|gap-[135790]" src/; then
  echo "❌ Spacing violations found"
  echo "Only allowed: Values divisible by 4 (p-2, p-4, p-6, p-8, etc.)"
  exit 1
fi

# Check for arbitrary color values
if grep -r "bg-\[#\|text-\[#" src/; then
  echo "❌ Arbitrary color values found"
  echo "Use semantic color tokens instead"
  exit 1
fi

echo "✅ Design system compliance verified"
exit 0
```

## 14. Quality Assurance Requirements

### Testing Strategy

#### Unit Testing
```typescript
// Design system component unit tests
describe('Design System Compliance', () => {
  describe('Typography Standards', () => {
    it('only uses approved font sizes', () => {
      const component = render(<TopRibbon />)
      const elements = component.container.querySelectorAll('*')
      
      elements.forEach(element => {
        const computedStyle = getComputedStyle(element)
        const fontSize = computedStyle.fontSize
        
        if (fontSize && fontSize !== '0px') {
          expect(['14px', '16px', '18px', '20px']).toContain(fontSize)
        }
      })
    })
    
    it('only uses approved font weights', () => {
      const component = render(<PrimarySidebar />)
      const textElements = component.container.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6')
      
      textElements.forEach(element => {
        const computedStyle = getComputedStyle(element)
        const fontWeight = computedStyle.fontWeight
        
        expect(['400', '600']).toContain(fontWeight)
      })
    })
  })
  
  describe('Spacing Standards', () => {
    it('follows 8pt grid system', () => {
      const component = render(<TableEditor />)
      const spacedElements = component.container.querySelectorAll('[class*="p-"], [class*="m-"], [class*="gap-"]')
      
      spacedElements.forEach(element => {
        const classList = Array.from(element.classList)
        const spacingClasses = classList.filter(cls => 
          cls.match(/^(p|m|gap)-\d+$/)
        )
        
        spacingClasses.forEach(cls => {
          const value = parseInt(cls.split('-')[1])
          const pixelValue = value * 4 // Tailwind uses 0.25rem = 4px base
          expect(pixelValue % 4).toBe(0)
        })
      })
    })
  })
  
  describe('Color Standards', () => {
    it('follows 60/30/10 color distribution', async () => {
      const component = render(<App />)
      await waitFor(() => {
        const colorAnalysis = analyzeColorDistribution(component.container)
        
        expect(colorAnalysis.neutralPercentage).toBeGreaterThan(50)
        expect(colorAnalysis.accentPercentage).toBeLessThan(15)
      })
    })
  })
})

// Helper function for color distribution analysis
const analyzeColorDistribution = (container: HTMLElement) => {
  const elements = container.querySelectorAll('*')
  let neutralCount = 0
  let complementaryCount = 0
  let accentCount = 0
  
  elements.forEach(element => {
    const classList = Array.from(element.classList)
    
    if (classList.some(cls => cls.includes('bg-background') || cls.includes('bg-card'))) {
      neutralCount++
    } else if (classList.some(cls => cls.includes('text-foreground') || cls.includes('text-muted'))) {
      complementaryCount++
    } else if (classList.some(cls => cls.includes('bg-primary') || cls.includes('text-primary'))) {
      accentCount++
    }
  })
  
  const total = elements.length
  return {
    neutralPercentage: (neutralCount / total) * 100,
    complementaryPercentage: (complementaryCount / total) * 100,
    accentPercentage: (accentCount / total) * 100,
  }
}
```

#### Integration Testing
```typescript
// End-to-end design system testing with Playwright
test('design system consistency across user flows', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Test theme switching
  await page.click('[data-testid="theme-toggle"]')
  
  // Verify theme application
  const bodyClass = await page.getAttribute('html', 'data-theme')
  expect(bodyClass).toBe('light')
  
  // Check color contrast ratios
  const contrastResults = await page.evaluate(() => {
    return window.checkColorContrast(document.body)
  })
  
  expect(contrastResults.minimumRatio).toBeGreaterThan(4.5)
  
  // Test responsive design
  await page.setViewportSize({ width: 768, height: 1024 })
  
  const sidebarCollapsed = await page.isVisible('[data-testid="sidebar-toggle"]')
  expect(sidebarCollapsed).toBe(true)
})

// Performance testing for theme switching
test('theme switching performance', async ({ page }) => {
  await page.goto('/dashboard')
  
  const startTime = Date.now()
  await page.click('[data-testid="theme-toggle"]')
  
  // Wait for theme application
  await page.waitForFunction(() => {
    return document.documentElement.getAttribute('data-theme') === 'light'
  })
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  expect(duration).toBeLessThan(200) // 200ms target
})
```

#### Visual Regression Testing
```typescript
// Automated visual regression testing
const visualTests = [
  {
    name: 'top-ribbon-dark-theme',
    component: () => <TopRibbon theme="dark" />,
    viewports: ['desktop', 'tablet', 'mobile'],
  },
  {
    name: 'primary-sidebar-expanded',
    component: () => <PrimarySidebar collapsed={false} />,
    viewports: ['desktop', 'tablet'],
  },
  {
    name: 'table-editor-with-new-colors',
    component: () => <TableEditor datasetId="test" tableType="vehicles" />,
    viewports: ['desktop'],
  },
]

// Chromatic integration for visual testing
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-design-tokens',
  ],
  features: {
    buildStoriesJson: true,
  },
  chromatic: {
    modes: {
      'light-desktop': { theme: 'light', viewport: 'desktop' },
      'dark-desktop': { theme: 'dark', viewport: 'desktop' },
      'light-mobile': { theme: 'light', viewport: 'mobile' },
      'dark-mobile': { theme: 'dark', viewport: 'mobile' },
    },
  },
}
```

### Performance Monitoring

#### Real-time Performance Tracking
```typescript
// Performance monitoring for design system
const DesignSystemPerformanceMonitor = {
  // Theme switching performance
  measureThemeSwitch: (fromTheme: string, toTheme: string) => {
    performance.mark('theme-switch-start')
    
    return {
      end: () => {
        performance.mark('theme-switch-end')
        performance.measure(
          'theme-switch',
          'theme-switch-start',
          'theme-switch-end'
        )
        
        const measure = performance.getEntriesByName('theme-switch')[0]
        
        // Report to analytics
        analytics.track('design-system.theme-switch', {
          fromTheme,
          toTheme,
          duration: measure.duration,
          timestamp: Date.now(),
        })
      }
    }
  },
  
  // Bundle size monitoring
  trackBundleSize: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      analytics.track('design-system.bundle-load', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        cssSize: getCSSBundleSize(),
        jsSize: getJSBundleSize(),
      })
    }
  },
  
  // Color contrast validation
  validateContrast: (element: HTMLElement) => {
    const style = getComputedStyle(element)
    const textColor = style.color
    const backgroundColor = style.backgroundColor
    
    const contrastRatio = calculateContrastRatio(textColor, backgroundColor)
    
    if (contrastRatio < 4.5) {
      console.warn('Color contrast below WCAG AA standard:', {
        element: element.tagName,
        textColor,
        backgroundColor,
        contrastRatio,
      })
    }
    
    return contrastRatio >= 4.5
  }
}

// Integration with existing error monitoring
const designSystemErrorBoundary = (error: Error, errorInfo: ErrorInfo) => {
  if (error.message.includes('design-system')) {
    analytics.track('design-system.error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }
}
```

#### Bundle Size Monitoring
```typescript
// Webpack bundle analyzer for design system assets
const bundleAnalysis = {
  css: {
    target: 150, // KB
    threshold: 200, // KB - fail build if exceeded
  },
  
  icons: {
    target: 50, // KB
    threshold: 75, // KB
  },
  
  components: {
    target: 100, // KB
    threshold: 150, // KB
  },
}

// Build-time bundle size validation
const validateBundleSize = (stats: webpack.Stats) => {
  const assets = stats.toJson().assets
  
  const cssSize = assets
    .filter(asset => asset.name.endsWith('.css'))
    .reduce((total, asset) => total + asset.size, 0) / 1024
  
  if (cssSize > bundleAnalysis.css.threshold) {
    throw new Error(`CSS bundle size exceeded: ${cssSize}KB > ${bundleAnalysis.css.threshold}KB`)
  }
  
  console.log(`✅ CSS bundle size: ${cssSize}KB (target: ${bundleAnalysis.css.target}KB)`)
}
```

### Security Validation

#### Theme Security Testing
```typescript
// Security testing for theme system
describe('Theme Security', () => {
  it('prevents CSS injection through theme values', () => {
    const maliciousTheme = "dark'; background: url('http://evil.com'); /*"
    
    expect(() => {
      setTheme(maliciousTheme)
    }).toThrow('Invalid theme value')
  })
  
  it('sanitizes custom color values', () => {
    const maliciousColor = "red; background: url('http://evil.com')"
    
    const sanitized = sanitizeCSSValue(maliciousColor)
    expect(sanitized).toBe('red')
    expect(sanitized).not.toContain('url(')
  })
  
  it('validates theme source integrity', () => {
    const themeContent = getThemeStylesheet('dark')
    const expectedHash = 'sha256-abc123...'
    
    const actualHash = calculateSHA256(themeContent)
    expect(actualHash).toBe(expectedHash)
  })
})

// Content Security Policy testing
test('CSP compliance for design assets', async ({ page }) => {
  // Monitor CSP violations
  const cspViolations: any[] = []
  
  page.on('console', msg => {
    if (msg.text().includes('Content Security Policy')) {
      cspViolations.push(msg.text())
    }
  })
  
  await page.goto('/dashboard')
  await page.click('[data-testid="theme-toggle"]')
  
  expect(cspViolations).toHaveLength(0)
})
```

### Accessibility Testing

#### Automated Accessibility Validation
```typescript
// axe-core integration for accessibility testing
import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

describe('Design System Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(<TopRibbon />)
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })
  
  it('provides proper focus management', () => {
    render(<PrimarySidebar />)
    
    const firstFocusable = screen.getByRole('button', { name: /dashboard/i })
    const lastFocusable = screen.getByRole('button', { name: /settings/i })
    
    // Test tab order
    firstFocusable.focus()
    userEvent.tab()
    
    expect(document.activeElement).not.toBe(firstFocusable)
    
    // Test reverse tab
    userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(firstFocusable)
  })
  
  it('provides sufficient color contrast', () => {
    render(<TableEditor />)
    
    const textElements = screen.getAllByText(/./i)
    
    textElements.forEach(element => {
      const contrastRatio = getContrastRatio(element)
      expect(contrastRatio).toBeGreaterThan(4.5)
    })
  })
})

// Keyboard navigation testing
test('keyboard navigation works correctly', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Test sidebar navigation
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  
  // Verify navigation occurred
  expect(page.url()).toContain('/projects')
  
  // Test theme toggle with keyboard
  await page.keyboard.press('Shift+Tab') // Go to theme toggle
  await page.keyboard.press('Enter')
  
  // Verify theme changed
  const theme = await page.getAttribute('html', 'data-theme')
  expect(theme).toBe('light')
})
```

## 15. Deployment & Operations

### Build Process

#### Optimized Build Configuration
```typescript
// Vite configuration for design system optimization
export default defineConfig({
  plugins: [
    react(),
    
    // Design system specific optimizations
    {
      name: 'design-system-optimizer',
      generateBundle(options, bundle) {
        // Extract and optimize CSS
        Object.keys(bundle).forEach(fileName => {
          if (fileName.endsWith('.css')) {
            const asset = bundle[fileName] as OutputAsset
            asset.source = optimizeDesignSystemCSS(asset.source as string)
          }
        })
      }
    }
  ],
  
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          // Purge unused design system utilities
          content: ['./src/**/*.{js,ts,jsx,tsx}'],
          safelist: [
            // Preserve dynamic theme classes
            'data-theme',
            /^text-(sm|base|lg|xl)$/,
            /^font-(normal|semibold)$/,
          ],
          blocklist: [
            // Remove forbidden utilities
            'text-xs', 'text-2xl', 'font-bold', 'font-medium',
          ]
        }),
        autoprefixer(),
        cssnano({
          preset: ['default', {
            // Preserve CSS custom properties
            normalizeWhitespace: false,
          }]
        })
      ]
    }
  },
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'design-system': ['./src/styles/globals.css'],
          'theme-provider': ['./src/components/ThemeProvider'],
          'icons': ['./src/components/icons/index'],
        }
      }
    }
  }
})

// CSS optimization for design system
const optimizeDesignSystemCSS = (css: string): string => {
  return css
    .replace(/\/\*.*?\*\//g, '') // Remove comments
    .replace(/\s{2,}/g, ' ')     // Collapse whitespace
    .replace(/;\s*}/g, '}')     // Remove trailing semicolons
    .trim()
}
```

#### Asset Bundling Strategy
```typescript
// Design system asset bundling
const assetBundling = {
  // Critical CSS inlining
  inlineCriticalCSS: async (html: string): Promise<string> => {
    const criticalCSS = await extractCriticalCSS()
    return html.replace(
      '<head>',
      `<head><style>${criticalCSS}</style>`
    )
  },
  
  // Icon sprite generation
  generateIconSprite: (icons: IconDefinition[]): string => {
    return icons.map(icon => 
      `<symbol id="${icon.name}" viewBox="${icon.viewBox}">${icon.path}</symbol>`
    ).join('')
  },
  
  // Theme CSS splitting
  splitThemeCSS: {
    'light-theme.css': extractLightThemeStyles,
    'dark-theme.css': extractDarkThemeStyles,
    'base.css': extractBaseStyles,
  }
}
```

### Environment Configuration

#### Environment-Specific Theming
```typescript
// Environment configuration for design system
interface EnvironmentConfig {
  name: 'development' | 'staging' | 'production'
  theme: {
    defaultTheme: 'light' | 'dark'
    allowThemeSwitching: boolean
    customColors: Record<string, string>
  }
  performance: {
    enableAnimations: boolean
    preloadThemes: boolean
    enableVisualRegression: boolean
  }
  debugging: {
    showDesignSystemGrid: boolean
    highlightColorViolations: boolean
    logPerformanceMetrics: boolean
  }
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.MODE
  
  switch (env) {
    case 'production':
      return {
        name: 'production',
        theme: {
          defaultTheme: 'dark',
          allowThemeSwitching: true,
          customColors: {
            primary: 'oklch(65% 0.15 160)', // Decoy Green
            background: 'oklch(22% 0.02 260)', // Dark Navy
          }
        },
        performance: {
          enableAnimations: true,
          preloadThemes: true,
          enableVisualRegression: false,
        },
        debugging: {
          showDesignSystemGrid: false,
          highlightColorViolations: false,
          logPerformanceMetrics: false,
        }
      }
      
    case 'development':
      return {
        name: 'development',
        theme: {
          defaultTheme: 'dark',
          allowThemeSwitching: true,
          customColors: {
            primary: 'oklch(65% 0.15 160)',
            background: 'oklch(22% 0.02 260)',
          }
        },
        performance: {
          enableAnimations: true,
          preloadThemes: false,
          enableVisualRegression: true,
        },
        debugging: {
          showDesignSystemGrid: true,
          highlightColorViolations: true,
          logPerformanceMetrics: true,
        }
      }
      
    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}
```

#### Theme Asset Management
```typescript
// Dynamic theme loading based on environment
const ThemeAssetManager = {
  async loadTheme(themeName: string): Promise<void> {
    const config = getEnvironmentConfig()
    
    if (config.performance.preloadThemes) {
      // Preload all themes in production
      await Promise.all([
        this.loadThemeAsset('light'),
        this.loadThemeAsset('dark'),
      ])
    } else {
      // Load on-demand in development
      await this.loadThemeAsset(themeName)
    }
  },
  
  async loadThemeAsset(themeName: string): Promise<void> {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `/themes/${themeName}.css`
    link.dataset.theme = themeName
    
    return new Promise((resolve, reject) => {
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load theme: ${themeName}`))
      document.head.appendChild(link)
    })
  },
  
  unloadTheme(themeName: string): void {
    const existingLink = document.querySelector(`link[data-theme="${themeName}"]`)
    if (existingLink) {
      existingLink.remove()
    }
  }
}
```

### Monitoring & Logging

#### Design System Analytics
```typescript
// Analytics for design system usage
const DesignSystemAnalytics = {
  // Track theme usage patterns
  trackThemeUsage: (theme: string, userAgent: string) => {
    analytics.track('design-system.theme-selected', {
      theme,
      userAgent,
      timestamp: Date.now(),
      sessionId: getSessionId(),
    })
  },
  
  // Track performance metrics
  trackPerformance: (metric: string, value: number, context: Record<string, any>) => {
    analytics.track('design-system.performance', {
      metric,
      value,
      context,
      timestamp: Date.now(),
    })
  },
  
  // Track accessibility violations
  trackA11yViolations: (violations: any[]) => {
    if (violations.length > 0) {
      analytics.track('design-system.accessibility-violation', {
        violationCount: violations.length,
        violations: violations.map(v => ({
          id: v.id,
          impact: v.impact,
          tags: v.tags,
        })),
        url: window.location.pathname,
      })
    }
  },
  
  // Track color contrast issues
  trackContrastIssues: (element: HTMLElement, contrastRatio: number) => {
    if (contrastRatio < 4.5) {
      analytics.track('design-system.contrast-violation', {
        contrastRatio,
        tagName: element.tagName,
        className: element.className,
        url: window.location.pathname,
      })
    }
  }
}

// Real-time monitoring dashboard
const DesignSystemMonitoring = {
  // Bundle size monitoring
  monitorBundleSize: () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        if (entry.name.includes('design-system')) {
          DesignSystemAnalytics.trackPerformance(
            'bundle-size',
            entry.transferSize,
            { name: entry.name, type: 'asset' }
          )
        }
      })
    })
    
    observer.observe({ entryTypes: ['resource'] })
  },
  
  // Theme switch performance
  monitorThemePerformance: () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-theme') {
          const startTime = performance.now()
          
          requestAnimationFrame(() => {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            DesignSystemAnalytics.trackPerformance(
              'theme-switch-duration',
              duration,
              { theme: (mutation.target as HTMLElement).dataset.theme }
            )
          })
        }
      })
    })
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    })
  }
}
```

#### Error Tracking
```typescript
// Design system specific error tracking
const DesignSystemErrorTracking = {
  // Theme loading errors
  handleThemeError: (theme: string, error: Error) => {
    console.error(`[Design System] Theme loading failed: ${theme}`, error)
    
    // Report to error tracking service
    errorReporting.captureException(error, {
      tags: {
        component: 'design-system',
        theme,
        action: 'theme-load',
      },
      extra: {
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    })
    
    // Fallback to default theme
    document.documentElement.setAttribute('data-theme', 'dark')
    
    // Show user notification
    toast.error('Theme loading failed, using default appearance', {
      action: {
        label: 'Retry',
        onClick: () => ThemeAssetManager.loadTheme(theme)
      }
    })
  },
  
  // CSS parsing errors
  handleCSSError: (cssText: string, error: Error) => {
    console.error('[Design System] CSS parsing failed', error)
    
    errorReporting.captureException(error, {
      tags: {
        component: 'design-system',
        action: 'css-parse',
      },
      extra: {
        cssText: cssText.substring(0, 1000), // Truncate for privacy
      }
    })
  },
  
  // Color contrast warnings
  handleContrastWarning: (element: HTMLElement, ratio: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Design System] Low contrast ratio: ${ratio.toFixed(2)}`,
        element
      )
      
      // Highlight element in development
      element.style.outline = '2px solid red'
      element.title = `Contrast ratio: ${ratio.toFixed(2)} (minimum: 4.5)`
    }
  }
}
```

### Maintenance Windows

#### Update Procedures
```typescript
// Design system update procedure
const DesignSystemUpdates = {
  // Version management
  checkForUpdates: async (): Promise<UpdateInfo | null> => {
    const currentVersion = '1.0.0'
    const latestVersion = await fetchLatestVersion()
    
    if (semver.gt(latestVersion, currentVersion)) {
      return {
        currentVersion,
        latestVersion,
        changes: await fetchChangelog(currentVersion, latestVersion),
        breaking: await fetchBreakingChanges(currentVersion, latestVersion),
      }
    }
    
    return null
  },
  
  // Gradual rollout
  applyUpdate: async (version: string, rolloutPercentage: number = 100) => {
    const userId = getCurrentUserId()
    const userHash = hashCode(userId) % 100
    
    if (userHash < rolloutPercentage) {
      await loadDesignSystemVersion(version)
      
      // Track update adoption
      DesignSystemAnalytics.trackThemeUsage(
        `updated-${version}`,
        navigator.userAgent
      )
    }
  },
  
  // Rollback procedure
  rollback: async (previousVersion: string) => {
    console.warn(`[Design System] Rolling back to version: ${previousVersion}`)
    
    await loadDesignSystemVersion(previousVersion)
    
    // Clear cached themes
    ThemeAssetManager.clearCache()
    
    // Notify users
    toast.info('Design updated, refreshing interface...')
    
    // Track rollback
    errorReporting.captureMessage('Design system rollback', {
      level: 'warning',
      tags: { version: previousVersion }
    })
  }
}

// Automated rollback triggers
const AutomatedRollback = {
  // Monitor error rates
  monitorErrorRate: () => {
    const errorThreshold = 0.05 // 5% error rate
    const timeWindow = 5 * 60 * 1000 // 5 minutes
    
    let errorCount = 0
    let totalEvents = 0
    
    const checkErrorRate = () => {
      const errorRate = errorCount / totalEvents
      
      if (errorRate > errorThreshold && totalEvents > 100) {
        console.error(`[Design System] High error rate detected: ${(errorRate * 100).toFixed(2)}%`)
        DesignSystemUpdates.rollback('1.0.0')
      }
      
      // Reset counters
      errorCount = 0
      totalEvents = 0
    }
    
    // Check every time window
    setInterval(checkErrorRate, timeWindow)
    
    // Track events
    window.addEventListener('error', () => {
      errorCount++
      totalEvents++
    })
    
    window.addEventListener('unhandledrejection', () => {
      errorCount++
      totalEvents++
    })
    
    // Track successful operations
    document.addEventListener('click', () => totalEvents++)
    document.addEventListener('keydown', () => totalEvents++)
  }
}
```

---

**Document Approval**:
- [ ] Product Owner: ___________________ Date: ___________
- [ ] UI/UX Lead: ____________________ Date: ___________
- [ ] Technical Lead: __________________ Date: ___________
- [ ] Brand Manager: __________________ Date: ___________