import * as Papa from 'papaparse'
import type { VRPTableType } from '../types/shared.types'

interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'id'
  required: boolean
  description?: string
  example?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: string[]
  }
}

interface TableSchema {
  fields: SchemaField[]
  primaryKey?: string
  foreignKeys?: Record<string, string>
  indexes?: string[]
}

export class CSVTemplateGenerator {
  private tableSchemas: Record<VRPTableType, TableSchema> = {
    vehicles: {
      fields: [
        { name: '_id', type: 'id', required: false, description: 'Convex unique ID (leave empty for new records)' },
        { name: 'description', type: 'string', required: false, description: 'Vehicle name or description', example: 'Truck 01' },
        { name: 'profile', type: 'string', required: false, description: 'Vehicle type (car, truck, bike)', example: 'truck' },
        { name: 'startLon', type: 'number', required: false, description: 'Starting longitude', example: -122.4194 },
        { name: 'startLat', type: 'number', required: false, description: 'Starting latitude', example: 37.7749 },
        { name: 'endLon', type: 'number', required: false, description: 'Ending longitude (defaults to start)', example: -122.4194 },
        { name: 'endLat', type: 'number', required: false, description: 'Ending latitude (defaults to start)', example: 37.7749 },
        { name: 'capacity', type: 'array', required: false, description: 'Multi-dimensional capacity [weight, volume, count]', example: '[1000, 50, 20]' },
        { name: 'skills', type: 'array', required: false, description: 'Skill IDs (comma-separated)', example: '[1, 3, 7]' },
        { name: 'twStart', type: 'number', required: false, description: 'Time window start (seconds since midnight)', example: 28800 },
        { name: 'twEnd', type: 'number', required: false, description: 'Time window end (seconds since midnight)', example: 61200 },
        { name: 'speedFactor', type: 'number', required: false, description: 'Speed modification factor (1.0 = normal)', example: 1.0 },
        { name: 'maxTasks', type: 'number', required: false, description: 'Maximum tasks per route', example: 50 },
        { name: 'maxTravelTime', type: 'number', required: false, description: 'Maximum travel time (seconds)', example: 28800 },
        { name: 'maxDistance', type: 'number', required: false, description: 'Maximum distance (meters)', example: 200000 },
        { name: 'costFixed', type: 'number', required: false, description: 'Fixed cost per vehicle', example: 100 },
        { name: 'costPerHour', type: 'number', required: false, description: 'Hourly operating cost', example: 50 },
        { name: 'costPerKm', type: 'number', required: false, description: 'Cost per kilometer', example: 1.5 },
      ],
      primaryKey: '_id',
      foreignKeys: {
        'startLocationId': 'locations',
        'endLocationId': 'locations'
      }
    },
    jobs: {
      fields: [
        { name: '_id', type: 'id', required: false, description: 'Convex unique ID (leave empty for new records)' },
        { name: 'description', type: 'string', required: false, description: 'Job description', example: 'Delivery to Customer A' },
        { name: 'locationLon', type: 'number', required: false, description: 'Job longitude', example: -122.4194 },
        { name: 'locationLat', type: 'number', required: false, description: 'Job latitude', example: 37.7749 },
        { name: 'setup', type: 'number', required: false, description: 'Setup time (seconds)', example: 300 },
        { name: 'service', type: 'number', required: false, description: 'Service time (seconds)', example: 600 },
        { name: 'delivery', type: 'array', required: false, description: 'Delivery quantities [weight, volume, count]', example: '[100, 5, 2]' },
        { name: 'pickup', type: 'array', required: false, description: 'Pickup quantities [weight, volume, count]', example: '[0, 0, 0]' },
        { name: 'skills', type: 'array', required: false, description: 'Required skill IDs (comma-separated)', example: '[1, 3]' },
        { name: 'priority', type: 'number', required: false, description: 'Job priority (0-100)', example: 50, validation: { min: 0, max: 100 } },
        { name: 'timeWindows', type: 'array', required: false, description: 'Time windows [{start, end}]', example: '[{"start": 28800, "end": 36000}]' },
      ],
      primaryKey: '_id',
      foreignKeys: {
        'locationId': 'locations'
      }
    },
    locations: {
      fields: [
        { name: '_id', type: 'id', required: false, description: 'Convex unique ID (leave empty for new records)' },
        { name: 'name', type: 'string', required: true, description: 'Location name', example: 'Warehouse Central' },
        { name: 'address', type: 'string', required: false, description: 'Physical address', example: '123 Main St, San Francisco, CA 94105' },
        { name: 'description', type: 'string', required: false, description: 'Location description', example: 'Main distribution center' },
        { name: 'locationLon', type: 'number', required: false, description: 'Longitude coordinate', example: -122.4194 },
        { name: 'locationLat', type: 'number', required: false, description: 'Latitude coordinate', example: 37.7749 },
        { name: 'locationType', type: 'string', required: false, description: 'Type (depot, customer, warehouse)', example: 'depot' },
        { name: 'operatingHours', type: 'string', required: false, description: 'Operating hours', example: 'Mon-Fri 8AM-6PM' },
        { name: 'contactInfo', type: 'string', required: false, description: 'Contact information', example: 'John Doe: 555-1234' },
        { name: 'timezone', type: 'string', required: false, description: 'Location timezone', example: 'America/Los_Angeles' },
      ],
      primaryKey: '_id',
      foreignKeys: {
        'clusterId': 'locationClusters'
      }
    },
    routes: {
      fields: [
        { name: '_id', type: 'id', required: false, description: 'Convex unique ID (leave empty for new records)' },
        { name: 'vehicleId', type: 'id', required: false, description: 'Assigned vehicle ID', example: '' },
        { name: 'cost', type: 'number', required: false, description: 'Total route cost', example: 250.50 },
        { name: 'distance', type: 'number', required: false, description: 'Total distance (meters)', example: 125000 },
        { name: 'duration', type: 'number', required: false, description: 'Total duration (seconds)', example: 21600 },
        { name: 'waitingTime', type: 'number', required: false, description: 'Total waiting time (seconds)', example: 1800 },
        { name: 'serviceTime', type: 'number', required: false, description: 'Total service time (seconds)', example: 3600 },
        { name: 'setupTime', type: 'number', required: false, description: 'Total setup time (seconds)', example: 900 },
        { name: 'deliveries', type: 'array', required: false, description: 'Delivery quantities', example: '[500, 25, 10]' },
        { name: 'pickups', type: 'array', required: false, description: 'Pickup quantities', example: '[0, 0, 0]' },
        { name: 'priority', type: 'number', required: false, description: 'Route priority', example: 50 },
        { name: 'deliveryCount', type: 'number', required: false, description: 'Number of deliveries', example: 10 },
        { name: 'geometry', type: 'string', required: false, description: 'Route geometry (WKT/GeoJSON)', example: '' },
      ],
      primaryKey: '_id',
      foreignKeys: {
        'vehicleId': 'vehicles',
        'optimizationRunId': 'optimizationRuns'
      }
    }
  }

  generateTemplate(
    tableType: VRPTableType,
    options: {
      includeSystemFields?: boolean
      includeSampleData?: boolean
      sampleRowCount?: number
      includeDescriptions?: boolean
    } = {}
  ): string {
    const {
      includeSystemFields = true,
      includeSampleData = true,
      sampleRowCount = 3,
      includeDescriptions = true
    } = options

    const schema = this.tableSchemas[tableType]
    if (!schema) {
      throw new Error(`Unknown table type: ${tableType}`)
    }

    const fields = includeSystemFields 
      ? schema.fields 
      : schema.fields.filter(f => !f.name.startsWith('_'))

    const rows: any[] = []

    // Add description row
    if (includeDescriptions) {
      const descriptionRow: Record<string, string> = {}
      fields.forEach(field => {
        descriptionRow[field.name] = field.description || ''
      })
      rows.push(descriptionRow)
    }

    // Add header row (field names)
    const headerRow: Record<string, string> = {}
    fields.forEach(field => {
      headerRow[field.name] = field.name
    })

    // Add sample data rows
    if (includeSampleData) {
      for (let i = 0; i < sampleRowCount; i++) {
        const dataRow: Record<string, any> = {}
        fields.forEach(field => {
          dataRow[field.name] = this.generateSampleValue(field, i)
        })
        rows.push(dataRow)
      }
    }

    // Convert to CSV
    const csv = Papa.unparse(rows, {
      header: true,
      columns: fields.map(f => f.name),
      delimiter: ',',
      newline: '\n',
      quoteChar: '"',
      escapeChar: '"',
      skipEmptyLines: false
    })

    return csv
  }

  private generateSampleValue(field: SchemaField, index: number): any {
    // For ID fields, leave empty for new records
    if (field.type === 'id' && field.name === '_id') {
      return ''
    }

    // Use example if provided
    if (field.example !== undefined) {
      if (typeof field.example === 'string' && field.example.includes('{{index}}')) {
        return field.example.replace('{{index}}', String(index + 1))
      }
      return field.example
    }

    // Generate based on type and name
    switch (field.type) {
      case 'string':
        if (field.name.includes('description')) {
          return `Sample ${field.name} ${index + 1}`
        }
        if (field.name.includes('name')) {
          return `${field.name} ${index + 1}`
        }
        if (field.validation?.enum) {
          return field.validation.enum[index % field.validation.enum.length]
        }
        return `Sample ${field.name}`

      case 'number':
        if (field.validation?.min !== undefined && field.validation?.max !== undefined) {
          const range = field.validation.max - field.validation.min
          return field.validation.min + (index * range / 10)
        }
        if (field.name.includes('lat')) return 37.7749 + (index * 0.01)
        if (field.name.includes('lon')) return -122.4194 + (index * 0.01)
        if (field.name.includes('cost')) return 100 + (index * 50)
        if (field.name.includes('time') || field.name.includes('duration')) return 3600 * (index + 1)
        if (field.name.includes('distance')) return 10000 * (index + 1)
        return index + 1

      case 'boolean':
        return index % 2 === 0

      case 'array':
        if (field.name === 'capacity' || field.name === 'delivery' || field.name === 'pickup') {
          return `[${100 * (index + 1)}, ${10 * (index + 1)}, ${index + 1}]`
        }
        if (field.name === 'skills') {
          return `[${index + 1}, ${index + 2}]`
        }
        if (field.name === 'timeWindows') {
          const start = 28800 + (index * 3600) // 8 AM + index hours
          const end = start + 7200 // 2 hour window
          return `[{"start": ${start}, "end": ${end}}]`
        }
        return '[]'

      case 'object':
        return '{}'

      case 'date': {
        const date = new Date()
        date.setDate(date.getDate() + index)
        return date.toISOString()
      }

      default:
        return ''
    }
  }

  getFieldDescriptions(tableType: VRPTableType): Record<string, string> {
    const schema = this.tableSchemas[tableType]
    if (!schema) {
      throw new Error(`Unknown table type: ${tableType}`)
    }

    const descriptions: Record<string, string> = {}
    schema.fields.forEach(field => {
      descriptions[field.name] = field.description || `${field.name} field`
    })
    return descriptions
  }

  getRequiredFields(tableType: VRPTableType): string[] {
    const schema = this.tableSchemas[tableType]
    if (!schema) {
      throw new Error(`Unknown table type: ${tableType}`)
    }

    return schema.fields
      .filter(field => field.required)
      .map(field => field.name)
  }

  getFieldValidation(tableType: VRPTableType): Record<string, any> {
    const schema = this.tableSchemas[tableType]
    if (!schema) {
      throw new Error(`Unknown table type: ${tableType}`)
    }

    const validation: Record<string, any> = {}
    schema.fields.forEach(field => {
      if (field.validation || field.required) {
        validation[field.name] = {
          type: field.type,
          required: field.required,
          ...field.validation
        }
      }
    })
    return validation
  }
}

// Export singleton instance
export const templateGenerator = new CSVTemplateGenerator()