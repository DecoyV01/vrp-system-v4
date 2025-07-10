# Master Locations System - User Guide

**Version**: 1.0  
**Date**: July 10, 2025  
**Audience**: End Users, System Administrators  

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [User Interface Guide](#user-interface-guide)
4. [Location Management](#location-management)
5. [Map Interface](#map-interface)
6. [Search and Filtering](#search-and-filtering)
7. [Bulk Operations](#bulk-operations)
8. [Import/Export](#importexport)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

The Master Locations System is a centralized geographic data management platform that serves as the single source of truth for all location data in your VRP System. It provides automated geocoding, interactive map visualization, and comprehensive location management capabilities.

### Key Benefits

- **Centralized Data**: Single source of truth for all geographic information
- **Automated Geocoding**: Convert addresses to coordinates automatically
- **Visual Management**: Interactive map interface for location management
- **Real-time Collaboration**: Multiple users can edit locations simultaneously
- **Data Quality**: Built-in validation and quality scoring
- **Enterprise Scale**: Handle thousands of locations efficiently

### Core Concepts

- **Location Master**: Centralized location repository with complete geographic data
- **Geocoding Quality**: Automatic quality scoring (Exact, Interpolated, Approximate, Manual)
- **Location Types**: Categorization (Depot, Customer, Warehouse, Distribution Center, etc.)
- **Location Clusters**: Grouping of nearby locations for optimization
- **Usage Analytics**: Track how locations are used across vehicles, jobs, and shipments

## Getting Started

### Accessing Master Locations

1. **Navigation Path**: Projects → [Project Name] → [Dataset Name] → Locations
2. **Direct URL**: `/projects/{projectId}/datasets/{datasetId}/locations`
3. **Quick Access**: Use the sidebar navigation or breadcrumb links

### Initial Setup

When accessing the Master Locations system for the first time:

1. **Review Existing Locations**: Check if any locations were imported or created
2. **Configure View Preferences**: Choose between Map, Grid, or List view
3. **Set Up Filters**: Configure location type and quality filters
4. **Import Data**: Use CSV import if you have existing location data

## User Interface Guide

### Page Layout

The Master Locations page consists of four main areas:

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (Breadcrumbs, Title, Action Buttons)                    │
├─────────────────────────────────────────────────────────────────┤
│ Search & Filters Bar                                           │
├─────────────────────────────────────────────────────────────────┤
│ Main Content Area (Map/Grid/List View)                         │
├─────────────────────────────────────────────────────────────────┤
│ Selection & Bulk Operations (when items selected)              │
└─────────────────────────────────────────────────────────────────┘
```

### Header Controls

- **View Toggle**: Switch between Map, Grid, and List views
- **Add Location**: Create new locations manually
- **Bulk Operations**: Edit or delete multiple locations
- **More Menu**: Access import/export and additional tools

### View Modes

#### Map View
- **Best For**: Spatial analysis, route planning, geographic overview
- **Features**: Interactive map, location clustering, coordinate selection
- **Controls**: Zoom, pan, layer toggle, search overlay

#### Grid View
- **Best For**: Visual browsing, quick comparison, detailed information
- **Features**: Card-based layout, usage metrics, quick actions
- **Layout**: Responsive grid (1-4 columns based on screen size)

#### List View
- **Best For**: Data analysis, sorting, bulk selection
- **Features**: Tabular format, sortable columns, compact information
- **Columns**: Name, Type, Address, Coordinates, Quality, Usage

## Location Management

### Creating Locations

#### Manual Creation

1. Click **"Add Location"** button in the header
2. Fill in the location form:
   - **Name** (Required): Unique identifier for the location
   - **Address**: Full street address for geocoding
   - **Coordinates**: Manual latitude/longitude entry
   - **Type**: Select location category
   - **Operating Hours**: Business hours (optional)
   - **Contact Info**: Phone, email, contact person (optional)
   - **Description**: Additional notes (optional)

3. **Geocoding Options**:
   - **Auto-geocode**: Enter address to automatically get coordinates
   - **Manual Entry**: Enter coordinates directly
   - **Map Selection**: Click on map to select coordinates

4. Click **"Save"** to create the location

#### Map-Based Creation

1. Switch to **Map View**
2. Right-click on the desired location on the map
3. Select **"Create Location Here"**
4. Fill in the location details form
5. Coordinates will be automatically populated

### Editing Locations

#### Individual Editing

1. **From Grid/List View**: Click the edit (pencil) icon
2. **From Map View**: Click location marker, then "Edit" in popup
3. **From Location Card**: Click "Edit" button
4. Modify the desired fields
5. Click **"Save Changes"**

#### Quick Edits

- **Inline Editing**: In list view, click directly on editable fields
- **Drag Coordinates**: In map view, drag location markers to new positions
- **Bulk Updates**: Use bulk edit for multiple locations simultaneously

### Deleting Locations

#### Safety Checks

Before deletion, the system performs:
- **Usage Analysis**: Check if location is referenced by vehicles, jobs, or shipments
- **Impact Assessment**: Show which entities will be affected
- **Confirmation Dialog**: Require explicit confirmation

#### Deletion Process

1. Select location(s) to delete
2. Click delete (trash) icon
3. Review the impact assessment
4. Confirm deletion in the dialog
5. Location will be removed from the system

**⚠️ Warning**: Deleting locations that are in use will break references in vehicles, jobs, and shipments.

## Map Interface

### Navigation Controls

- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag to move the map
- **Full Screen**: Expand map to full screen view
- **Layer Toggle**: Show/hide different map layers

### Location Markers

- **Color Coding**: Different colors for location types
- **Clustering**: Nearby locations group into clusters at lower zoom levels
- **Selection**: Click markers to select and view details
- **Info Popups**: Hover or click for location information

### Map Interactions

#### Viewing Locations
- **Hover**: Quick preview of location details
- **Click**: Select location and show full details panel
- **Cluster Click**: Zoom in to expand clustered locations

#### Creating Locations
- **Right-click**: Context menu with "Create Location" option
- **Coordinate Selection**: Automatically capture coordinates
- **Address Lookup**: Reverse geocode to get address

#### Editing Locations
- **Drag Markers**: Move locations by dragging markers
- **Coordinate Updates**: Automatically update coordinates
- **Confirmation**: Confirm coordinate changes

### Clustering Features

- **Automatic Clustering**: Groups nearby locations based on zoom level
- **Cluster Information**: Shows count of locations in each cluster
- **Drill Down**: Click clusters to zoom in and expand
- **Performance**: Maintains smooth performance with thousands of locations

## Search and Filtering

### Global Search

The search bar accepts multiple query types:

- **Location Name**: Exact or partial name matching
- **Address**: Search by street address, city, or region
- **Description**: Search in location descriptions
- **Type**: Search by location type (e.g., "depot", "warehouse")

#### Search Examples

```
warehouse          # Find all warehouses
San Francisco      # Find locations in San Francisco
depot main         # Find depot with "main" in name
customer sites     # Find customer locations
```

### Advanced Filters

#### Location Type Filter
- **Options**: Depot, Customer, Warehouse, Distribution Center, Pickup Point, Delivery Point
- **Multi-Select**: Choose multiple types simultaneously
- **Quick Filters**: Preset combinations for common use cases

#### Quality Filter
- **Exact**: Precisely geocoded locations
- **Interpolated**: Estimated coordinates with high confidence
- **Approximate**: General area coordinates
- **Manual**: Manually entered coordinates

#### Usage Filter
- **Has Usage**: Locations referenced by vehicles, jobs, or shipments
- **No Usage**: Unused locations that could be cleaned up
- **High Usage**: Most frequently referenced locations

#### Custom Filters
- **Coordinate Range**: Filter by latitude/longitude boundaries
- **Creation Date**: Filter by when locations were created
- **Last Modified**: Filter by recent updates
- **Dataset Source**: Filter by originating dataset

### Filter Combinations

Combine multiple filters for precise results:

```
Type: Customer + Quality: Exact + Usage: Has Usage
→ Find all customer locations with exact coordinates that are actively used

Type: Warehouse + Address: "California"
→ Find all warehouses in California

Quality: Manual + Usage: No Usage
→ Find manually entered locations that might need cleanup
```

## Bulk Operations

### Selection Methods

#### Individual Selection
- **Checkbox**: Click checkbox next to each location
- **Ctrl+Click**: Select multiple items individually
- **Shift+Click**: Select range of items

#### Bulk Selection
- **Select All**: Checkbox in header selects all visible locations
- **Select Filtered**: Select all locations matching current filters
- **Clear Selection**: Remove all selections

#### Selection Indicators
- **Count Display**: Shows "X of Y selected"
- **Visual Feedback**: Selected items highlighted
- **Bulk Actions**: Actions appear when items selected

### Bulk Edit Operations

#### Supported Bulk Edits
- **Location Type**: Change type for multiple locations
- **Operating Hours**: Update business hours
- **Contact Information**: Update contact details
- **Custom Fields**: Modify custom attributes

#### Bulk Edit Process
1. Select locations to edit
2. Click **"Bulk Edit"** button
3. Choose fields to update
4. Enter new values
5. Preview changes
6. Apply updates

#### Validation
- **Field Validation**: Ensure data meets requirements
- **Conflict Resolution**: Handle conflicting values
- **Error Reporting**: Show validation failures
- **Partial Success**: Apply valid changes, report failures

### Bulk Delete Operations

#### Safety Features
- **Impact Analysis**: Show affected vehicles, jobs, shipments
- **Confirmation Required**: Multiple confirmation steps
- **Batch Processing**: Delete in manageable batches
- **Rollback**: Ability to undo deletions (if caught quickly)

#### Delete Process
1. Select locations to delete
2. Click **"Delete Selected"**
3. Review impact analysis
4. Confirm understanding of consequences
5. Execute deletion

## Import/Export

### CSV Import

#### Supported Formats
- **Standard CSV**: Comma-separated values
- **Excel CSV**: Excel-compatible format
- **UTF-8 Encoding**: International character support

#### Required Fields
- **Name**: Unique location identifier
- **Coordinates OR Address**: Either lat/lon or street address

#### Optional Fields
- Address, Type, Operating Hours, Contact Info, Description, Custom Fields

#### Import Process

1. **File Upload**
   - Click **"Import CSV"** button
   - Select your CSV file
   - Choose encoding (UTF-8 recommended)

2. **Column Mapping**
   - Map CSV columns to location fields
   - Preview mapping results
   - Adjust mappings as needed

3. **Validation**
   - Check for missing required fields
   - Validate data formats
   - Identify potential duplicates

4. **Geocoding**
   - Automatically geocode addresses
   - Review geocoding quality
   - Manually adjust low-quality results

5. **Duplicate Handling**
   - Choose merge or skip duplicates
   - Define duplicate detection rules
   - Review merge strategies

6. **Import Execution**
   - Import in batches for large files
   - Monitor progress
   - Review results and errors

#### Import Templates

Download CSV templates with proper headers:
- **Basic Template**: Essential fields only
- **Complete Template**: All available fields
- **Example Data**: Template with sample data

### CSV Export

#### Export Options

1. **Current View**: Export visible/filtered locations
2. **Selected Items**: Export only selected locations
3. **All Locations**: Export complete location dataset
4. **Custom Selection**: Choose specific fields to export

#### Export Formats
- **CSV**: Standard comma-separated values
- **Excel**: Microsoft Excel compatible
- **GeoJSON**: Geographic data format for GIS tools

#### Field Selection
- **Standard Fields**: Name, type, coordinates, address
- **Extended Fields**: All available location data
- **Custom Fields**: Choose specific fields to include
- **Usage Analytics**: Include usage statistics

#### Export Process

1. Click **"Export CSV"** button
2. Choose export scope (all, filtered, selected)
3. Select fields to include
4. Choose format and encoding
5. Download generated file

## Best Practices

### Location Naming

#### Naming Conventions
- **Consistent Format**: Use standardized naming patterns
- **Descriptive Names**: Include relevant identifying information
- **Avoid Duplicates**: Ensure unique names within project
- **Version Control**: Include version info for evolving locations

#### Examples
```
✅ Good Examples:
- "Warehouse_NYC_Main"
- "Customer_Acme_Corp_HQ"
- "Depot_Chicago_North"

❌ Poor Examples:
- "Location1"
- "Warehouse"
- "Site A"
```

### Data Quality Management

#### Geocoding Quality
- **Prioritize Exact**: Aim for exact geocoding when possible
- **Review Approximate**: Manually verify low-quality results
- **Re-geocode**: Periodically update old geocoding results
- **Manual Override**: Use for special cases requiring precision

#### Address Formatting
- **Complete Addresses**: Include street, city, state, country
- **Standardized Format**: Use consistent address formats
- **Postal Codes**: Include ZIP/postal codes for better geocoding
- **International Support**: Use proper international formats

### Performance Optimization

#### Large Datasets
- **Use Filters**: Narrow down results for better performance
- **Batch Operations**: Process large changes in batches
- **Clustering**: Enable clustering for map view with many locations
- **Progressive Loading**: Load locations as needed

#### Map Performance
- **Appropriate Zoom**: Use suitable zoom levels for data density
- **Selective Layers**: Show only necessary map layers
- **Clustering Thresholds**: Adjust clustering settings for performance
- **Browser Limits**: Be aware of browser memory limitations

### Collaboration Guidelines

#### Multi-User Editing
- **Communication**: Coordinate with team members before bulk changes
- **Test Changes**: Use test datasets for experimental modifications
- **Documentation**: Document significant location changes
- **Backup**: Export data before major modifications

#### Access Control
- **Role-Based Access**: Ensure appropriate permissions
- **Edit Restrictions**: Limit bulk edit access to authorized users
- **Audit Trail**: Monitor location changes through audit logs
- **Data Governance**: Establish data quality standards

## Troubleshooting

### Common Issues

#### Geocoding Problems

**Issue**: Address not found
- **Solution**: Try simplified address or manual coordinates
- **Check**: Address spelling and formatting
- **Alternative**: Use nearest known address as reference

**Issue**: Poor geocoding quality
- **Solution**: Manually verify and adjust coordinates
- **Prevention**: Use complete, standardized addresses
- **Monitoring**: Regular quality audits

#### Map Display Issues

**Issue**: Locations not showing on map
- **Check**: Filter settings and search criteria
- **Verify**: Coordinate ranges and zoom level
- **Solution**: Clear filters or adjust map bounds

**Issue**: Map loading slowly
- **Solution**: Enable clustering for large datasets
- **Check**: Internet connection and browser performance
- **Alternative**: Use list/grid view for large datasets

#### Import/Export Problems

**Issue**: CSV import failing
- **Check**: File format and encoding (use UTF-8)
- **Verify**: Required fields are present
- **Solution**: Download and use provided templates

**Issue**: Duplicate locations created
- **Prevention**: Use duplicate detection during import
- **Solution**: Use bulk operations to merge or delete duplicates
- **Tools**: Built-in duplicate detection tools

#### Performance Issues

**Issue**: Slow page loading
- **Solution**: Use filters to reduce dataset size
- **Check**: Browser memory usage and available resources
- **Alternative**: Close other browser tabs/applications

**Issue**: Bulk operations timing out
- **Solution**: Process smaller batches
- **Check**: Network connectivity and server status
- **Retry**: Use automatic retry for failed operations

### Error Messages

#### Validation Errors
- **"Name already exists"**: Choose unique location name
- **"Invalid coordinates"**: Check latitude (-90 to 90) and longitude (-180 to 180)
- **"Address not found"**: Verify address spelling and completeness

#### Permission Errors
- **"Access denied"**: Contact administrator for proper permissions
- **"Read-only mode"**: Check project access level and user role

#### System Errors
- **"Network error"**: Check internet connection and retry
- **"Server timeout"**: Try again later or contact support
- **"Data sync error"**: Refresh page to resolve temporary issues

### Getting Help

#### Documentation Resources
- **User Guide**: This comprehensive guide
- **API Documentation**: Technical integration details
- **Video Tutorials**: Step-by-step walkthroughs
- **FAQ**: Frequently asked questions

#### Support Channels
- **In-App Help**: Context-sensitive help throughout the application
- **Support Tickets**: Submit detailed problem descriptions
- **User Community**: Connect with other users for tips and solutions
- **Training Sessions**: Scheduled training for new features

#### Escalation Process
1. **Self-Service**: Check documentation and FAQ
2. **Community Support**: Ask in user forums
3. **Support Ticket**: Submit formal support request
4. **Escalation**: Critical issues escalated to development team

---

## Appendix

### Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Search | Ctrl+F | Focus search bar |
| Select All | Ctrl+A | Select all visible locations |
| New Location | Ctrl+N | Open new location form |
| Save | Ctrl+S | Save current form |
| Cancel | Esc | Cancel current operation |
| Map View | Alt+M | Switch to map view |
| List View | Alt+L | Switch to list view |
| Grid View | Alt+G | Switch to grid view |

### API Integration

For developers integrating with the Master Locations System:

- **GraphQL API**: Real-time location queries
- **REST Endpoints**: Traditional HTTP API access
- **WebSocket Subscriptions**: Real-time location updates
- **Batch API**: Bulk operations for large datasets

### Compliance and Security

- **Data Privacy**: Location data encrypted at rest and in transit
- **Access Control**: Role-based permissions and audit logging
- **GDPR Compliance**: Data retention and deletion policies
- **API Security**: Rate limiting and authentication requirements

---

**Last Updated**: July 10, 2025  
**Version**: 1.0  
**Next Review**: October 10, 2025