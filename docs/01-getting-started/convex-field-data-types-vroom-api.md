# VRP System - Field Data Types & VROOM API Format Reference

## Overview

This document provides comprehensive data type specifications and VROOM API format requirements for all fields in the VRP system database tables. Each field includes:
- **Data Type**: Convex/TypeScript data type
- **VROOM Format**: How the field should be formatted for VROOM API calls
- **Nullable**: Whether the field is required or optional
- **Validation Rules**: Format constraints and validation requirements
- **Examples**: Sample values and formats

## ⚠️ **CRITICAL VROOM API Requirements Verified**

Based on analysis of VROOM API documentation and existing Supabase edge functions:

### **✅ Integer Requirements (VROOM API Constraint)**
- **Cost values**: `fixed`, `per_hour`, `per_km` must be integers (no decimals)
- **Priority range**: **0-100** (not 1-1000 as initially assumed)
- **All timing values**: Integers in seconds for VROOM API
- **Capacity/Delivery/Pickup**: Integer arrays only

### **✅ Time Storage Pattern (From Supabase Implementation)**
- **Vehicle time windows**: `tw_start`, `tw_end` stored as **seconds since midnight**
- **Job time windows**: Arrays of Unix timestamp pairs  
- **Service/Setup times**: Already in seconds (VROOM-compatible)
- **Database timestamps**: Unix milliseconds, convert to seconds for VROOM

### **✅ Cost Value Examples (Integer Format)**
- `cost_fixed: 5000` (represents $50.00 in cents)
- `cost_per_hour: 3600` (VROOM default, ~$36.00/hour in cents)
- `cost_per_km: 100` (represents $1.00/km in cents)

---

## 🔧 **Core Data Type Conventions**

### **Coordinate Format**
- **Database**: Stored as separate `longitude` (lon) and `latitude` (lat) fields
- **VROOM API**: Combined as `[longitude, latitude]` array (lon/lat order)
- **Precision**: Up to 6 decimal places for GPS accuracy
- **Range**: Longitude: -180 to 180, Latitude: -90 to 90

### **Time Format**
- **Database**: Unix timestamp milliseconds (`1704067200000`)
- **VROOM API**: Unix epoch seconds (integer) - divide database value by 1000
- **Time Windows**: Arrays of `[start_epoch, end_epoch]` pairs in seconds
- **Conversion**: Database ms → VROOM seconds: `Math.floor(dbValue / 1000)`

### **Capacity & Cargo Format**
- **Database**: JSON arrays of integers `[weight, volume, count]`
- **VROOM API**: Integer arrays `[weight, volume, count]`
- **Units**: Kilograms for weight, cubic meters for volume, units for count

---

## 📋 **Core Collections Data Types**

### **Projects Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("projects")` | Not used | ✅ Required | Auto-generated | `"k7d2m9p8q1r4s6t2"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Delivery Operations Q1"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 1000 chars | `"Quarterly delivery optimization"` |
| `ownerId` | `v.id("users")` | Not used | ✅ Required | Valid user ID | `"usr_abc123def456"` |
| `currency` | `v.string()` | `costs.currency` | ✅ Required | ISO 4217 code | `"USD"`, `"EUR"`, `"ZAR"` |
| `timezone` | `v.optional(v.string())` | Not used | ❓ Optional | IANA timezone | `"Africa/Johannesburg"` |
| `tags` | `v.optional(v.array(v.string()))` | Not used | ❓ Optional | Array of strings | `["logistics", "urgent"]` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Scenarios Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("scenarios")` | Not used | ✅ Required | Auto-generated | `"scn_xyz789abc123"` |
| `projectId` | `v.id("projects")` | Not used | ✅ Required | Valid project ID | `"k7d2m9p8q1r4s6t2"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Peak Season Routes"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 1000 chars | `"High-demand period routing"` |
| `startDate` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |
| `endDate` | `v.optional(v.number())` | Not used | ❓ Optional | Unix timestamp | `1709337600000` |
| `planningHorizonDays` | `v.number()` | Not used | ✅ Required | 1-365 days | `7`, `30`, `90` |
| `isTemplate` | `v.optional(v.boolean())` | Not used | ❓ Optional | Boolean | `false` |
| `tags` | `v.optional(v.array(v.string()))` | Not used | ❓ Optional | Array of strings | `["template", "seasonal"]` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Datasets Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("datasets")` | Not used | ✅ Required | Auto-generated | `"dst_def456ghi789"` |
| `projectId` | `v.id("projects")` | Not used | ✅ Required | Valid project ID | `"k7d2m9p8q1r4s6t2"` |
| `scenarioId` | `v.optional(v.id("scenarios"))` | Not used | ❓ Optional | Valid scenario ID | `"scn_xyz789abc123"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Main Dataset v1.2"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 1000 chars | `"Updated customer locations"` |
| `version` | `v.number()` | Not used | ✅ Required | Positive integer | `1`, `2`, `10` |
| `isBaseline` | `v.optional(v.boolean())` | Not used | ❓ Optional | Boolean | `true`, `false` |
| `vehicleCount` | `v.number()` | Not used | ✅ Required | Non-negative int | `5`, `20`, `100` |
| `jobCount` | `v.number()` | Not used | ✅ Required | Non-negative int | `50`, `200`, `1000` |
| `locationCount` | `v.number()` | Not used | ✅ Required | Non-negative int | `45`, `180`, `950` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

---

## 🚗 **VRP Entity Data Types**

### **Vehicles Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("vehicles")` | `vehicle.id` (as number) | ✅ Required | Auto-generated | `"vhc_abc123def456"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Truck-001"`, `"Van-A12"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"Large delivery truck"` |
| `profile` | `v.string()` | `vehicle.profile` | ✅ Required | Enum: car, truck, bike | `"truck"`, `"car"`, `"bike"` |
| `startLongitude` | `v.number()` | `vehicle.start[0]` | ✅ Required | -180 to 180 | `-26.2041`, `28.0473` |
| `startLatitude` | `v.number()` | `vehicle.start[1]` | ✅ Required | -90 to 90 | `-26.2041`, `28.0473` |
| `endLongitude` | `v.optional(v.number())` | `vehicle.end[0]` | ❓ Optional | -180 to 180 | `-26.2041` |
| `endLatitude` | `v.optional(v.number())` | `vehicle.end[1]` | ❓ Optional | -90 to 90 | `28.0473` |
| `capacity` | `v.array(v.number())` | `vehicle.capacity` | ✅ Required | [weight, volume, count] | `[1000, 15, 50]` |
| `skills` | `v.optional(v.array(v.number()))` | `vehicle.skills` | ❓ Optional | Array of skill IDs | `[1, 3, 5]` |
| `timeWindowStart` | `v.optional(v.number())` | `vehicle.time_window[0]` | ❓ Optional | Unix timestamp ms | `1704067200000` |
| `timeWindowEnd` | `v.optional(v.number())` | `vehicle.time_window[1]` | ❓ Optional | Unix timestamp ms | `1704067200000` |
| `costFixed` | `v.optional(v.number())` | `vehicle.costs.fixed` | ❓ Optional | **Integer** cost units | `50`, `100`, `500` |
| `costPerHour` | `v.optional(v.number())` | `vehicle.costs.per_hour` | ❓ Optional | **Integer** cost per hour | `2500`, `4000`, `3600` |
| `costPerKm` | `v.optional(v.number())` | `vehicle.costs.per_km` | ❓ Optional | **Integer** cost per km | `200`, `350`, `100` |
| `maxDistance` | `v.optional(v.number())` | `vehicle.max_distance` | ❓ Optional | Meters | `100000`, `200000` |
| `maxTravelTime` | `v.optional(v.number())` | `vehicle.max_travel_time` | ❓ Optional | Seconds | `28800`, `36000` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Jobs Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("jobs")` | `job.id` (as number) | ✅ Required | Auto-generated | `"job_ghi789jkl012"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `locationId` | `v.id("locations")` | Not used | ✅ Required | Valid location ID | `"loc_mno345pqr678"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Delivery-001"`, `"Pickup-A12"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"Office supplies delivery"` |
| `longitude` | `v.number()` | `job.location[0]` | ✅ Required | -180 to 180 | `28.0473` |
| `latitude` | `v.number()` | `job.location[1]` | ✅ Required | -90 to 90 | `-26.2041` |
| `setupTime` | `v.optional(v.number())` | `job.setup` | ❓ Optional | Seconds | `300`, `600` |
| `serviceTime` | `v.number()` | `job.service` | ✅ Required | Seconds | `900`, `1800` |
| `delivery` | `v.optional(v.array(v.number()))` | `job.delivery` | ❓ Optional | [weight, volume, count] | `[25, 2, 5]` |
| `pickup` | `v.optional(v.array(v.number()))` | `job.pickup` | ❓ Optional | [weight, volume, count] | `[15, 1, 3]` |
| `skills` | `v.optional(v.array(v.number()))` | `job.skills` | ❓ Optional | Array of skill IDs | `[2, 4]` |
| `priority` | `v.optional(v.number())` | `job.priority` | ❓ Optional | **0-100 range** | `0`, `50`, `100` |
| `timeWindows` | `v.optional(v.array(v.array(v.number())))` | `job.time_windows` | ❓ Optional | Unix timestamp ms arrays | `[[1704067200000, 1704081600000]]` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Locations Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("locations")` | Not used | ✅ Required | Auto-generated | `"loc_mno345pqr678"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Customer A"`, `"Warehouse B"` |
| `address` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"123 Main St, City"` |
| `longitude` | `v.number()` | Used in coordinates | ✅ Required | -180 to 180 | `28.0473` |
| `latitude` | `v.number()` | Used in coordinates | ✅ Required | -90 to 90 | `-26.2041` |
| `contactName` | `v.optional(v.string())` | Not used | ❓ Optional | 1-255 chars | `"John Smith"` |
| `contactPhone` | `v.optional(v.string())` | Not used | ❓ Optional | Phone format | `"+27123456789"` |
| `contactEmail` | `v.optional(v.string())` | Not used | ❓ Optional | Email format | `"john@company.com"` |
| `timezone` | `v.optional(v.string())` | Not used | ❓ Optional | IANA timezone | `"Africa/Johannesburg"` |
| `clusterId` | `v.optional(v.id("locationClusters"))` | Not used | ❓ Optional | Valid cluster ID | `"clst_abc123def456"` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Shipments Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("shipments")` | `shipment.id` (as number) | ✅ Required | Auto-generated | `"shp_stu901vwx234"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `pickupLocationId` | `v.id("locations")` | Not used | ✅ Required | Valid location ID | `"loc_mno345pqr678"` |
| `deliveryLocationId` | `v.id("locations")` | Not used | ✅ Required | Valid location ID | `"loc_yzz987abc321"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Shipment-001"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"Furniture shipment"` |
| `pickupLongitude` | `v.number()` | `shipment.pickup[0]` | ✅ Required | -180 to 180 | `28.0473` |
| `pickupLatitude` | `v.number()` | `shipment.pickup[1]` | ✅ Required | -90 to 90 | `-26.2041` |
| `deliveryLongitude` | `v.number()` | `shipment.delivery[0]` | ✅ Required | -180 to 180 | `28.1234` |
| `deliveryLatitude` | `v.number()` | `shipment.delivery[1]` | ✅ Required | -90 to 90 | `-26.1234` |
| `amount` | `v.array(v.number())` | `shipment.amount` | ✅ Required | [weight, volume, count] | `[100, 5, 1]` |
| `skills` | `v.optional(v.array(v.number()))` | `shipment.skills` | ❓ Optional | Array of skill IDs | `[1, 3]` |
| `priority` | `v.optional(v.number())` | `shipment.priority` | ❓ Optional | **0-100 range** | `50` |
| `pickupSetup` | `v.optional(v.number())` | `shipment.pickup_setup` | ❓ Optional | Seconds | `300` |
| `pickupService` | `v.optional(v.number())` | `shipment.pickup_service` | ❓ Optional | Seconds | `600` |
| `deliverySetup` | `v.optional(v.number())` | `shipment.delivery_setup` | ❓ Optional | Seconds | `300` |
| `deliveryService` | `v.optional(v.number())` | `shipment.delivery_service` | ❓ Optional | Seconds | `900` |
| `pickupTimeWindows` | `v.optional(v.array(v.array(v.number())))` | `shipment.pickup_time_windows` | ❓ Optional | Unix timestamp ms arrays | `[[1704067200000, 1704081600000]]` |
| `deliveryTimeWindows` | `v.optional(v.array(v.array(v.number())))` | `shipment.delivery_time_windows` | ❓ Optional | Unix timestamp ms arrays | `[[1704096000000, 1704110400000]]` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

---

## 🔧 **Supporting Tables Data Types**

### **Skills Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("skills")` | Numeric mapping | ✅ Required | Auto-generated | `"skl_abc123def456"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Hazmat Certified"`, `"Refrigerated"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"Dangerous goods handling"` |
| `skillCode` | `v.optional(v.string())` | Not used | ❓ Optional | Alphanumeric code | `"HAZ001"`, `"REF002"` |
| `parentSkillId` | `v.optional(v.id("skills"))` | Not used | ❓ Optional | Valid skill ID | `"skl_parent123"` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

### **Products Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("products")` | Not used | ✅ Required | Auto-generated | `"prd_ghi789jkl012"` |
| `datasetId` | `v.id("datasets")` | Not used | ✅ Required | Valid dataset ID | `"dst_def456ghi789"` |
| `name` | `v.string()` | Not used | ✅ Required | 1-255 chars | `"Office Chairs"`, `"Laptops"` |
| `description` | `v.optional(v.string())` | Not used | ❓ Optional | Max 500 chars | `"Ergonomic office chairs"` |
| `productCode` | `v.optional(v.string())` | Not used | ❓ Optional | Alphanumeric code | `"CHR001"`, `"LAP002"` |
| `category` | `v.optional(v.string())` | Not used | ❓ Optional | Product category | `"Furniture"`, `"Electronics"` |
| `unitWeight` | `v.optional(v.number())` | Used in calculations | ❓ Optional | Kilograms | `15.5`, `2.3` |
| `unitVolume` | `v.optional(v.number())` | Used in calculations | ❓ Optional | Cubic meters | `0.8`, `0.05` |
| `unitValue` | `v.optional(v.number())` | Not used | ❓ Optional | Currency units | `299.99`, `1200.00` |
| `isActive` | `v.boolean()` | Not used | ✅ Required | Boolean | `true`, `false` |
| `updatedAt` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |

---

## 🎯 **Optimization Tables Data Types**

### **Optimization Runs Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("optimizationRuns")` | Not used | ✅ Required | Auto-generated | `"opt_mno345pqr678"` |
| `scenarioId` | `v.id("scenarios")` | Not used | ✅ Required | Valid scenario ID | `"scn_xyz789abc123"` |
| `datasetId` | `v.optional(v.id("datasets"))` | Not used | ❓ Optional | Valid dataset ID | `"dst_def456ghi789"` |
| `timestamp` | `v.number()` | Not used | ✅ Required | Unix timestamp | `1704067200000` |
| `status` | `v.string()` | From VROOM response | ✅ Required | Enum status | `"completed"`, `"error"` |
| `algorithm` | `v.string()` | Not used | ✅ Required | Algorithm name | `"vroom"` |
| `optimizationEngine` | `v.string()` | Not used | ✅ Required | Engine name | `"vroom"` |
| `computingTime` | `v.optional(v.number())` | From VROOM response | ❓ Optional | Milliseconds | `5432`, `12890` |
| `totalCost` | `v.optional(v.number())` | From `summary.cost` | ❓ Optional | **Integer** cost units | `125050` |
| `totalDistance` | `v.optional(v.number())` | From `summary.distance` | ❓ Optional | Meters | `125000` |
| `totalDuration` | `v.optional(v.number())` | From `summary.duration` | ❓ Optional | Seconds | `18000` |
| `totalRoutes` | `v.optional(v.number())` | From routes array | ❓ Optional | Count | `5`, `10` |
| `totalUnassigned` | `v.optional(v.number())` | From unassigned array | ❓ Optional | Count | `2`, `0` |
| `totalVehicles` | `v.optional(v.number())` | From vehicles array | ❓ Optional | Count | `5` |
| `totalJobs` | `v.optional(v.number())` | From jobs array | ❓ Optional | Count | `50` |
| `totalShipments` | `v.optional(v.number())` | From shipments array | ❓ Optional | Count | `10` |
| `rawRequest` | `v.object({})` | Complete VROOM request | ✅ Required | JSON object | `{vehicles: [...], jobs: [...]}` |
| `rawResponse` | `v.object({})` | Complete VROOM response | ✅ Required | JSON object | `{code: 0, summary: {...}, routes: [...]}` |
| `currencyCode` | `v.string()` | Not used | ✅ Required | ISO 4217 code | `"USD"`, `"EUR"` |
| `createdBy` | `v.id("users")` | Not used | ✅ Required | Valid user ID | `"usr_abc123def456"` |

### **Route Summaries Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("routeSummaries")` | Not used | ✅ Required | Auto-generated | `"rts_stu901vwx234"` |
| `optimizationRunId` | `v.id("optimizationRuns")` | Not used | ✅ Required | Valid run ID | `"opt_mno345pqr678"` |
| `vehicleId` | `v.number()` | From `route.vehicle` | ✅ Required | VROOM vehicle ID | `1`, `2`, `5` |
| `cost` | `v.optional(v.number())` | From `route.cost` | ❓ Optional | **Integer** cost units | `32575` |
| `distance` | `v.optional(v.number())` | From `route.distance` | ❓ Optional | Meters | `45000` |
| `duration` | `v.optional(v.number())` | From `route.duration` | ❓ Optional | Seconds | `7200` |
| `waitingTime` | `v.optional(v.number())` | From `route.waiting_time` | ❓ Optional | Seconds | `300` |
| `serviceTime` | `v.optional(v.number())` | From `route.service` | ❓ Optional | Seconds | `1800` |
| `setupTime` | `v.optional(v.number())` | From `route.setup` | ❓ Optional | Seconds | `600` |
| `deliveries` | `v.optional(v.array(v.number()))` | From `route.delivery` | ❓ Optional | [weight, volume, count] | `[500, 10, 15]` |
| `pickups` | `v.optional(v.array(v.number()))` | From `route.pickup` | ❓ Optional | [weight, volume, count] | `[200, 3, 8]` |
| `priority` | `v.optional(v.number())` | From `route.priority` | ❓ Optional | Priority sum | `1500` |
| `violations` | `v.optional(v.array(v.string()))` | From `route.violations` | ❓ Optional | Violation types | `["capacity", "time_window"]` |
| `geometry` | `v.optional(v.string())` | From `route.geometry` | ❓ Optional | Encoded polyline | `"abcd1234efgh5678"` |
| `currencyCode` | `v.string()` | Not used | ✅ Required | ISO 4217 code | `"USD"` |

### **Route Steps Table**

| Field | Data Type | VROOM Format | Nullable | Validation | Example |
|-------|-----------|--------------|----------|------------|---------|
| `id` | `v.id("routeSteps")` | Not used | ✅ Required | Auto-generated | `"rtp_yza345bcd678"` |
| `routeSummaryId` | `v.id("routeSummaries")` | Not used | ✅ Required | Valid route ID | `"rts_stu901vwx234"` |
| `vehicleId` | `v.number()` | From step context | ✅ Required | VROOM vehicle ID | `1`, `2`, `5` |
| `stepType` | `v.string()` | From `step.type` | ✅ Required | Enum: start, job, end | `"job"`, `"start"`, `"end"` |
| `stepOrder` | `v.number()` | Array index | ✅ Required | 0-based order | `0`, `1`, `2` |
| `jobId` | `v.optional(v.number())` | From `step.id` | ❓ Optional | VROOM job ID | `10`, `25` |
| `longitude` | `v.optional(v.number())` | From `step.location[0]` | ❓ Optional | -180 to 180 | `28.0473` |
| `latitude` | `v.optional(v.number())` | From `step.location[1]` | ❓ Optional | -90 to 90 | `-26.2041` |
| `arrivalTime` | `v.optional(v.number())` | From `step.arrival` | ❓ Optional | **Seconds from start** | `3600`, `7200` |
| `setupTime` | `v.optional(v.number())` | From `step.setup` | ❓ Optional | Seconds | `300` |
| `serviceTime` | `v.optional(v.number())` | From `step.service` | ❓ Optional | Seconds | `900` |
| `waitingTime` | `v.optional(v.number())` | From `step.waiting_time` | ❓ Optional | Seconds | `120` |
| `distance` | `v.optional(v.number())` | From `step.distance` | ❓ Optional | Meters | `5000` |
| `duration` | `v.optional(v.number())` | From `step.duration` | ❓ Optional | Seconds | `600` |
| `load` | `v.optional(v.array(v.number()))` | From `step.load` | ❓ Optional | [weight, volume, count] | `[750, 12, 20]` |
| `violations` | `v.optional(v.array(v.string()))` | From `step.violations` | ❓ Optional | Violation types | `["time_window"]` |
| `description` | `v.optional(v.string())` | From `step.description` | ❓ Optional | Step description | `"Delivery at Customer A"` |

---

## 📊 **VROOM API Data Transformation Rules**

### **Coordinate Transformation**
```typescript
// Database → VROOM API
const vroomLocation = [location.longitude, location.latitude];

// VROOM API → Database  
const dbLocation = {
  longitude: vroomResponse.location[0],
  latitude: vroomResponse.location[1]
};
```

### **Time Window Transformation**
```typescript
// Database (ms) → VROOM API (seconds)
const vroomTimeWindow = vehicle.timeWindowStart && vehicle.timeWindowEnd 
  ? [Math.floor(vehicle.timeWindowStart / 1000), Math.floor(vehicle.timeWindowEnd / 1000)]
  : undefined;

// VROOM API (seconds) → Database (ms)
const dbTimeWindow = {
  timeWindowStart: vroomVehicle.time_window?.[0] * 1000,
  timeWindowEnd: vroomVehicle.time_window?.[1] * 1000
};
```

### **Capacity Transformation**
```typescript
// Database → VROOM API (same format)
const vroomCapacity = vehicle.capacity; // [weight, volume, count]

// Skills ID Mapping (Database ID → VROOM Numeric)
const skillMapping = new Map<string, number>();
const vroomSkills = vehicle.skills?.map(skillId => skillMapping.get(skillId));
```

### **Cost Structure Transformation**
```typescript
// Database → VROOM API (ensure integers)
const vroomCosts = {
  fixed: Math.round(vehicle.costFixed || 0),
  per_hour: Math.round(vehicle.costPerHour || 3600), // VROOM default
  per_km: Math.round(vehicle.costPerKm || 0)
};

// Note: VROOM requires integer cost values
// Convert currency decimals to cents/pence for integer representation
// Example: $25.50 → 2550 cents
```

---

## ⚠️ **Validation Rules & Constraints**

### **Geographic Constraints**
- **Longitude**: -180 ≤ value ≤ 180 (WGS84)
- **Latitude**: -90 ≤ value ≤ 90 (WGS84)
- **Precision**: Maximum 6 decimal places for GPS accuracy

### **Time Constraints**
- **Database Times**: Unix timestamps in milliseconds (positive integers)
- **VROOM Times**: Unix timestamps in seconds (divide database by 1000)
- **Time Windows**: Start time must be less than end time in both formats
- **Service Times**: Non-negative integers in seconds
- **Conversion**: Always use `Math.floor(dbTime / 1000)` for VROOM API

### **Capacity Constraints**
- **Array Length**: Exactly 3 elements [weight, volume, count]
- **Values**: Non-negative numbers
- **Units**: Kilograms, cubic meters, units respectively

### **VROOM API Limits**
- **Maximum Vehicles**: 1000 per request
- **Maximum Jobs**: 10000 per request  
- **Maximum Shipments**: 5000 per request
- **Request Timeout**: 300 seconds
- **Priority Range**: 0-100 (VROOM requirement)
- **Cost Values**: Must be integers (VROOM requirement)
- **Time Values**: Seconds for VROOM, milliseconds in database

### **Database Constraints**
- **String Fields**: UTF-8 encoding, trimmed whitespace
- **Required Fields**: Must not be null or empty
- **Foreign Keys**: Must reference existing records
- **Unique Constraints**: Enforced at database level

---

## 🔗 **Field Relationships & Dependencies**

### **Vehicle Dependencies**
- `startLongitude` + `startLatitude` → Required together
- `endLongitude` + `endLatitude` → Required together if either is set
- `timeWindowStart` + `timeWindowEnd` → Required together if either is set
- `capacity` → Must match job delivery/pickup dimensions

### **Job Dependencies**
- `longitude` + `latitude` → Required together
- `locationId` → Must match coordinates with referenced location
- `delivery` OR `pickup` → At least one must be specified
- `skills` → Must reference existing skill IDs
- `timeWindows` → Each window must have valid start/end pair

### **Shipment Dependencies**
- `pickupLocationId` + `deliveryLocationId` → Must be different locations
- `pickupLongitude/Latitude` + `deliveryLongitude/Latitude` → Required pairs
- `amount` → Required 3-element array
- `pickupTimeWindows` + `deliveryTimeWindows` → Pickup must precede delivery

### **Optimization Dependencies**
- `vehicles` + `jobs` → Minimum 1 vehicle and 1 job required
- `vehicle.capacity` ≥ `sum(job.delivery)` → Feasibility constraint
- `vehicle.skills` ⊇ `job.skills` → Skill matching requirement

---

## 📝 **Usage Examples**

### **VROOM Request Example**
```json
{
  "vehicles": [
    {
      "id": 1,
      "start": [28.0473, -26.2041],
      "end": [28.0473, -26.2041],
      "capacity": [1000, 15, 50],
      "skills": [1, 3],
      "time_window": [25200, 61200],
      "costs": {"fixed": 100, "per_hour": 30, "per_km": 2}
    }
  ],
  "jobs": [
    {
      "id": 10,
      "location": [28.1234, -26.1234],
      "service": 900,
      "delivery": [25, 2, 1],
      "skills": [1],
      "priority": 500,
      "time_windows": [[32400, 46800]]
    }
  ],
  "options": {"g": true, "useMatrix": false, "threads": 4}
}
```

### **Database Record Example**
```typescript
const vehicle: Vehicle = {
  id: "vhc_abc123def456",
  datasetId: "dst_def456ghi789",
  name: "Truck-001",
  profile: "truck",
  startLongitude: 28.0473,
  startLatitude: -26.2041,
  endLongitude: 28.0473,
  endLatitude: -26.2041,
  capacity: [1000, 15, 50],
  skills: [1, 3],
  timeWindowStart: 25200,
  timeWindowEnd: 61200,
  costFixed: 100,
  costPerHour: 30,
  costPerKm: 2,
  isActive: true,
  createdAt: 1704067200000,
  updatedAt: 1704067200000
};
```

---

## 🚀 **Implementation Notes**

### **Data Type Mapping Strategy**
1. **IDs**: Use Convex auto-generated IDs internally, map to integers for VROOM
2. **Coordinates**: Store separately for indexing, combine for VROOM API
3. **Arrays**: Use JSON arrays for capacity, skills, time windows
4. **Timestamps**: Unix milliseconds in DB, seconds for VROOM

### **Performance Considerations**
1. **Indexing**: Create indexes on frequently queried fields (datasetId, isActive)
2. **Pagination**: Use Convex pagination for large result sets
3. **Caching**: Cache skill ID mappings and location lookups
4. **Validation**: Client-side validation before VROOM API calls

### **Error Handling**
1. **Type Validation**: Use Convex validators for data integrity
2. **VROOM Errors**: Handle VROOM response codes gracefully
3. **Constraint Violations**: Provide clear error messages
4. **Rollback Strategy**: Implement transaction rollback for failed optimizations

This comprehensive data type reference ensures proper implementation of the VRP system with full VROOM API compatibility and robust data validation.