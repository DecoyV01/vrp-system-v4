import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useVehicleStatus } from '@/hooks/useVRPData'
import { createMockVehicle } from '../../mock-data'

// Mock the useVehicles hook
vi.mock('@/hooks/useVRPData', async () => {
  const actual = await vi.importActual('@/hooks/useVRPData')
  return {
    ...actual,
    useVehicles: vi.fn()
  }
})

describe('useVehicleStatus', () => {
  it('should return loading state when vehicles is undefined', () => {
    const { useVehicles } = require('@/hooks/useVRPData')
    useVehicles.mockReturnValue(undefined)

    const { result } = renderHook(() => useVehicleStatus('dataset_123'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.vehicleStatuses).toEqual([])
    expect(result.current.totalVehicles).toBe(0)
  })

  it('should calculate vehicle status correctly', () => {
    const mockVehicles = [
      createMockVehicle({ 
        capacity: [1000], 
        startLat: 40.7128, 
        startLon: -74.0060 
      }),
      createMockVehicle({ 
        capacity: [500], 
        startLat: null, 
        startLon: null 
      })
    ]

    const { useVehicles } = require('@/hooks/useVRPData')
    useVehicles.mockReturnValue(mockVehicles)

    const { result } = renderHook(() => useVehicleStatus('dataset_123'))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.totalVehicles).toBe(2)
    expect(result.current.statusCounts.active).toBe(1)
    expect(result.current.statusCounts.inactive).toBe(1)
  })

  it('should calculate average utilization correctly', () => {
    const mockVehicles = [
      createMockVehicle({ capacity: [1000] }), // 20% utilization
      createMockVehicle({ capacity: [2000] })  // 40% utilization  
    ]

    const { useVehicles } = require('@/hooks/useVRPData')
    useVehicles.mockReturnValue(mockVehicles)

    const { result } = renderHook(() => useVehicleStatus('dataset_123'))

    expect(result.current.averageUtilization).toBe(30) // (20 + 40) / 2
  })
})