import { describe, it, expect } from 'vitest'
import { detectDuplicateVehicles } from '@/components/table-editor/bulk-operations/utils/duplicateDetector'
import { createMockVehicle } from '../../mock-data'

describe('duplicateDetector', () => {
  describe('detectDuplicateVehicles', () => {
    it('should detect vehicles with same coordinates', () => {
      const vehicles = [
        createMockVehicle({ 
          startLat: 40.7128, 
          startLon: -74.0060,
          optimizerId: 'vehicle_1'
        }),
        createMockVehicle({ 
          startLat: 40.7128, 
          startLon: -74.0060,
          optimizerId: 'vehicle_2'
        }),
        createMockVehicle({ 
          startLat: 41.8781, 
          startLon: -87.6298,
          optimizerId: 'vehicle_3'
        })
      ]

      const duplicates = detectDuplicateVehicles(vehicles)

      expect(duplicates).toHaveLength(2)
      expect(duplicates[0].optimizerId).toBe('vehicle_1')
      expect(duplicates[1].optimizerId).toBe('vehicle_2')
    })

    it('should detect vehicles with same optimizer ID', () => {
      const vehicles = [
        createMockVehicle({ optimizerId: 'duplicate_id' }),
        createMockVehicle({ optimizerId: 'duplicate_id' }),
        createMockVehicle({ optimizerId: 'unique_id' })
      ]

      const duplicates = detectDuplicateVehicles(vehicles)

      expect(duplicates).toHaveLength(2)
      expect(duplicates.every(v => v.optimizerId === 'duplicate_id')).toBe(true)
    })

    it('should return empty array when no duplicates exist', () => {
      const vehicles = [
        createMockVehicle({ 
          startLat: 40.7128, 
          startLon: -74.0060,
          optimizerId: 'vehicle_1'
        }),
        createMockVehicle({ 
          startLat: 41.8781, 
          startLon: -87.6298,
          optimizerId: 'vehicle_2'
        })
      ]

      const duplicates = detectDuplicateVehicles(vehicles)

      expect(duplicates).toHaveLength(0)
    })

    it('should handle empty vehicle array', () => {
      const duplicates = detectDuplicateVehicles([])
      expect(duplicates).toHaveLength(0)
    })
  })
})