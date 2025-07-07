# VRP System v4 - Functional Requirements

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-07-06
- **Status**: Production Ready
- **Owner**: VRP System Development Team

## 1. System Overview

### 1.1 Purpose
VRP System v4 is a web-based Vehicle Routing Problem management system that enables users to create, manage, and optimize routing scenarios for logistics operations.

### 1.2 Core Hierarchy
The system follows a strict four-level data hierarchy:
**Projects → Scenarios → Datasets → Tables** (vehicles, jobs, locations, routes)

## 2. User Stories and Acceptance Criteria

### 2.1 Project Management

#### US-001: Create Project
**As a** logistics manager  
**I want to** create a new VRP project  
**So that** I can organize my routing optimization work

**Acceptance Criteria:**
- ✅ User can create project with required name field
- ✅ User can add optional metadata (description, currency, contact info)
- ✅ Project is automatically assigned to the creating user (ownerId)
- ✅ Project gets automatic timestamps (createdAt, updatedAt)
- ✅ User can specify planning parameters (estimated vehicles/jobs, horizon days)
- ✅ Project name must be 1-100 characters
- ✅ Currency must be 3-character code (USD, EUR, etc.)
- ✅ Priority must be one of: low, medium, high, critical

#### US-002: List User Projects
**As a** logistics manager  
**I want to** view all my projects  
**So that** I can select and manage my work

**Acceptance Criteria:**
- ✅ User sees only projects they own (filtered by ownerId)
- ✅ Projects displayed with name, description, creation date
- ✅ Projects sorted by most recently updated
- ✅ Project cards show summary metrics (scenarios, datasets, vehicles, jobs)

#### US-003: Update Project
**As a** logistics manager  
**I want to** edit project details  
**So that** I can keep project information current

**Acceptance Criteria:**
- ✅ User can only edit projects they own
- ✅ All optional fields can be updated
- ✅ updatedAt timestamp automatically updated
- ✅ Validation applied to all fields
- ✅ Changes saved immediately with real-time sync

### 2.2 Scenario Management

#### US-004: Create Scenario
**As a** logistics manager  
**I want to** create optimization scenarios within a project  
**So that** I can test different routing approaches

**Acceptance Criteria:**
- ✅ Scenario must belong to a valid project (projectId required)
- ✅ Scenario name is required (1-100 characters)
- ✅ User can set optimization objectives and parameters
- ✅ User can define time windows (startDate, endDate)
- ✅ End date must be after start date if both specified
- ✅ User can mark scenarios as active/inactive
- ✅ Scenarios inherit project ownership

#### US-005: Manage Scenario Lifecycle
**As a** logistics manager  
**I want to** track scenario status  
**So that** I can manage optimization workflows

**Acceptance Criteria:**
- ✅ Scenario status: draft, active, completed, archived
- ✅ Only one scenario per project can be active at a time
- ✅ User can track optimization run count and last optimization time
- ✅ User can add tags for organization

### 2.3 Dataset Management

#### US-006: Create Dataset
**As a** logistics manager  
**I want to** create versioned datasets  
**So that** I can manage different data configurations

**Acceptance Criteria:**
- ✅ Dataset must belong to a valid project (projectId required)
- ✅ Dataset name is required (1-100 characters)
- ✅ Version number automatically assigned (incremental)
- ✅ User can clone from existing dataset
- ✅ User can mark dataset as baseline
- ✅ Dataset can be assigned to specific scenario
- ✅ System tracks entity counts (vehicles, jobs, locations)

### 2.4 Vehicle Management

#### US-007: Define Vehicle Fleet
**As a** logistics manager  
**I want to** define vehicle specifications  
**So that** I can model my fleet accurately

**Acceptance Criteria:**
- ✅ Vehicle must belong to a valid project (projectId required)
- ✅ Vehicle gets unique optimizerId for API compatibility
- ✅ User can specify vehicle profile (car, truck, bike)
- ✅ User can set capacity constraints (multi-dimensional array)
- ✅ User can define time windows (twStart, twEnd)
- ✅ User can set cost structure (fixed, per hour, per km)
- ✅ User can assign skills to vehicles
- ✅ Vehicle can have start/end coordinates or location references
- ✅ Vehicle constraints include max tasks, travel time, distance

### 2.5 Job Management

#### US-008: Define Jobs/Tasks
**As a** logistics manager  
**I want to** define jobs for vehicles to complete  
**So that** I can model my service requirements

**Acceptance Criteria:**
- ✅ Job must belong to a valid project (projectId required)
- ✅ Job gets unique optimizerId for API compatibility
- ✅ User can specify job location (coordinates or location reference)
- ✅ User can define time requirements (setup, service time)
- ✅ User can set capacity requirements (delivery, pickup arrays)
- ✅ User can define skill requirements
- ✅ User can set job priority (0-100 range)
- ✅ User can define time windows for service
- ✅ Multiple time windows supported per job

### 2.6 Location Management

#### US-009: Manage Locations
**As a** logistics manager  
**I want to** define and manage geographic locations  
**So that** I can reference them in vehicles and jobs

**Acceptance Criteria:**
- ✅ Location must belong to a valid project (projectId required)
- ✅ Location name is required
- ✅ User can specify coordinates (longitude, latitude)
- ✅ User can add address and contact information
- ✅ User can categorize locations by type (depot, customer, warehouse)
- ✅ User can set operating hours
- ✅ User can group locations into clusters

## 3. Business Rules

### 3.1 Data Ownership and Security
- **BR-001**: All entities must belong to a project owned by the authenticated user
- **BR-002**: Users can only access data they own (enforced by ownerId validation)
- **BR-003**: All data modifications require user authentication
- **BR-004**: Soft delete preferred over hard delete for audit trail

### 3.2 Data Integrity
- **BR-005**: projectId is required for all entities (vehicles, jobs, locations, scenarios, datasets)
- **BR-006**: optimizerId must be unique within project scope for vehicles and jobs
- **BR-007**: Dataset version numbers must be incremental within project
- **BR-008**: Only one active scenario per project at any time
- **BR-009**: End dates must be after start dates when both specified

### 3.3 Optimization Engine Compatibility
- **BR-010**: Vehicle and job capacity arrays must have matching dimensions
- **BR-011**: Priority values must be in 0-100 range for optimization engines
- **BR-012**: Skill IDs must be positive integers
- **BR-013**: Time values must be in seconds since epoch or duration in seconds

## 4. Edge Cases and Error Scenarios

### 4.1 Data Validation Errors
- **EC-001**: Empty required fields → Return 400 with specific field validation errors
- **EC-002**: Invalid data types → Return 400 with type validation errors
- **EC-003**: String length violations → Return 400 with length limit information
- **EC-004**: Invalid enum values → Return 400 with valid options list
- **EC-005**: Referential integrity violations → Return 400 with referenced entity info

### 4.2 Authorization Errors
- **EC-006**: Unauthenticated access → Return 401 with authentication required
- **EC-007**: Cross-user data access → Return 403 with ownership denial
- **EC-008**: Non-existent resource access → Return 404 with resource not found
- **EC-009**: Insufficient permissions → Return 403 with permission requirements

### 4.3 Business Logic Violations
- **EC-010**: Multiple active scenarios → Automatically deactivate previous scenario
- **EC-011**: Invalid time window ranges → Return 400 with time constraint explanation
- **EC-012**: Capacity dimension mismatches → Return 400 with dimension requirements
- **EC-013**: Circular dataset references → Return 400 with circular dependency error

### 4.4 System Constraints
- **EC-014**: Maximum entity limits exceeded → Return 413 with current limits
- **EC-015**: Database connection failures → Return 503 with retry instructions
- **EC-016**: Concurrent modification conflicts → Return 409 with conflict resolution options
- **EC-017**: Bulk operation timeouts → Return 202 with async processing status

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-001**: API responses must be under 200ms for single entity operations
- **NFR-002**: List operations must support pagination for datasets > 100 items
- **NFR-003**: Real-time updates must be delivered within 1 second via WebSocket
- **NFR-004**: Bulk operations must support batch sizes up to 1000 entities

### 5.2 Scalability
- **NFR-005**: System must support 1000+ entities per project
- **NFR-006**: System must support 100+ concurrent users
- **NFR-007**: Database must handle 10,000+ read operations per minute
- **NFR-008**: System must support horizontal scaling via Convex platform

### 5.3 Reliability
- **NFR-009**: System uptime must be 99.9% availability
- **NFR-010**: Data backup frequency must be every 15 minutes
- **NFR-011**: Recovery time objective (RTO) must be under 1 hour
- **NFR-012**: Recovery point objective (RPO) must be under 15 minutes

### 5.4 Usability
- **NFR-013**: Frontend must be responsive across desktop, tablet, mobile
- **NFR-014**: Loading states must be shown for operations > 500ms
- **NFR-015**: Error messages must be user-friendly with actionable guidance
- **NFR-016**: UI must follow accessibility guidelines (WCAG 2.1 AA)

## 6. Acceptance Testing Scenarios

### 6.1 Happy Path Scenarios
1. **Complete Project Setup**: Create project → Create scenario → Create dataset → Add vehicles → Add jobs → Run optimization
2. **Data Management**: Create entities → Edit entities → Duplicate dataset → Version management
3. **Multi-User Isolation**: User A creates data → User B cannot access User A's data

### 6.2 Error Handling Scenarios
1. **Validation Failures**: Submit invalid data → Receive specific error messages → Correct data → Succeed
2. **Authorization Failures**: Access other user's data → Receive 403 error → Access own data → Succeed
3. **Network Failures**: Lose connection → Reconnect → Data synchronized → Continue work

### 6.3 Edge Case Scenarios
1. **Large Datasets**: Import 1000+ vehicles → System remains responsive → Data correctly stored
2. **Concurrent Editing**: Multiple users edit same project → Changes merged correctly → No data loss
3. **Resource Limits**: Exceed entity limits → Graceful degradation → Clear limit messaging