 Create a full-stack VRP project management web app using Convex backend + React frontend with Cloudflare Pages
    hosting, implementing a four-level hierarchical structure (Projects → Scenarios → Datasets → Tables) with dual
  sidebar
    navigation and a powerful inline table editor.

    🏗️ Four-Level Hierarchy System

    Database Architecture

    - Projects: Root level entities with user ownership
    - Scenarios: Optimization scenarios belonging to projects\
    - Datasets: belonging to scenarios\
    - Tables: Dynamic data tables (locations) within scenarios
    - Clean Relationships: Proper foreign keys with cascading operations
    - User Authentication: Convex Auth with role-based access control

    Data Flow

    User → Projects → Scenarios → Tables (vehicles/jobs/locations/routes)
    ├── Project Management (CRUD operations)
    ├── Scenario Planning (optimization parameters)\
    ├── Datasets
    └── Table Data Management (spreadsheet-like editing)

    🎯 Dual Sidebar Navigation System

    Primary Sidebar (Left)

    - Single "Projects" Menu Item: Clean, minimal navigation
    - Icon-Based Design: Lucide React icons with consistent sizing
    - Visual States: Active, hover, and focus states
    - Expandable: Can accommodate future menu items
    - User Profile: Authentication status and user menu

    Secondary Sidebar (Right/Expandable)

    - Hierarchical Tree Structure:
      - 📁 Projects (expandable nodes)
      - └── 📋 Scenarios (child nodes)\
                   Datasets
      - └──── 📊 Tables (leaf nodes: locations)
    - Interactive Elements:
      - Chevron icons for expand/collapse
      - Context menus for CRUD operations
      - Drag-and-drop for reorganization
      - Search/filter functionality
    - Real-time Updates: Tree reflects data changes instantly

    📊 Advanced Editable Table Editor

    Core Editing Features

    - Click-to-Edit Cells: Double-click activation with proper data type handling
    - Column Management:
      - Add/remove columns dynamically
      - Rename columns inline with validation
      - Reorder columns via drag-and-drop
      - Data type specification (string, number, date, boolean)
    - Row Operations:
      - Add rows with keyboard shortcuts (Enter, Tab navigation)
      - Delete rows with confirmation
      - Row selection and bulk operations
      - Insert rows at specific positions

    Data Type Handling

    - String Fields: Text input with validation
    - Numeric Fields: Number input with min/max constraints
    - Date Fields: Date picker integration
    - Boolean Fields: Checkbox or toggle switches
    - Reference Fields: Dropdown selection for foreign keys
    - Validation: Real-time validation with error highlighting

    Spreadsheet-like Interface

    - Keyboard Navigation: Arrow keys, Tab, Enter for cell navigation
    - Selection: Single cell, row, column, and range selection
    - Copy/Paste: Clipboard operations with format preservation
    - Undo/Redo: Action history with keyboard shortcuts
    - Auto-save: Automatic persistence with optimistic updates

    🎨 Clean, Professional Design System

    Visual Hierarchy

    - Typography: Consistent font sizes using Tailwind's type scale
    - Color Palette: Neutral grays with accent colors for interactions
    - Spacing: 4px grid system for consistent padding/margins
    - Border Radius: Consistent rounding (4px, 8px, 12px)

    Interactive States

    - Hover Effects: Subtle background color changes and elevation
    - Focus States: Clear focus rings for accessibility
    - Active States: Visual feedback for pressed/selected elements
    - Loading States: Skeleton loaders and spinners
    - Error States: Red borders and error messages

    Responsive Layout

    - Desktop: Full dual-sidebar layout with wide table editor
    - Tablet: Collapsible sidebars with overlay behavior
    - Mobile: Bottom navigation with swipe gestures

    ✨ Enhanced User Experience Features

    Real-time Collaboration

    - Live Updates: Convex real-time subscriptions across all components
    - Conflict Resolution: Optimistic updates with automatic rollback
    - User Presence: Show who's editing what in real-time
    - Change History: Audit trail for all data modifications

    Feedback & Notifications

    - Toast Notifications: Success, error, and info messages using sonner
    - Progress Indicators: For long-running operations
    - Confirmation Dialogs: For destructive actions
    - Status Indicators: Connection status, save status, sync status

    Advanced Interactions

    - Keyboard Shortcuts: Power user functionality
    - Bulk Operations: Multi-select for batch actions
    - Import/Export: CSV upload/download with progress tracking
    - Search & Filter: Global search across all data
    - Bookmarks: Save frequently accessed tables/scenarios

    🛠️ Technical Implementation Stack

    Backend: Convex Platform

    // schema.ts - Complete hierarchy
    projects: defineTable({
      name: v.string(),
      ownerId: v.string(),
      description: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),

    scenarios: defineTable({
      projectId: v.id("projects"),
      name: v.string(),
      parameters: v.optional(v.object({})),
      createdAt: v.number(),
    }).index("by_project", ["projectId"]),

    tables: defineTable({
      scenarioId: v.id("scenarios"),
      name: v.string(),
      type: v.string(), // "vehicles", "jobs", "locations", "routes"
      schema: v.array(v.object({})),
      data: v.array(v.object({})),
    }).index("by_scenario", ["scenarioId"])

    Frontend: React + shadcn/ui

    // Component Structure
    <MainLayout>
      <PrimarySidebar />
      <SecondarySidebar>
        <HierarchyTree />
      </SecondarySidebar>
      <MainContent>
        <TableEditor />
      </MainContent>
    </MainLayout>

    Key Dependencies

    {
      "convex": "^1.16.0",
      "react": "^18.3.1",
      "@radix-ui/react-*": "latest",
      "tailwindcss": "^3.4.0",
      "lucide-react": "^0.441.0",
      "sonner": "^1.0.0",
      "react-hook-form": "^7.53.0",
      "zod": "^3.23.8"
    }

    Deployment Pipeline

    1. Convex Backend: npx convex deploy → Convex Cloud
    2. React Frontend: GitHub → Cloudflare Pages auto-deployment
    3. Environment: Secure API keys via Cloudflare environment variables

    This creates a comprehensive VRP management platform with intuitive navigation, powerful data editing
    capabilities, and real-time collaboration features, all wrapped in a clean, professional interface. Ultrathink
  create a detail plan with tasks and subtasks.