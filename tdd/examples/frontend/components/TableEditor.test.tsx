import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TableEditor } from '@/components/table-editor/TableEditor'
import { createMockVehicle } from '../../mock-data'

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn())
}))

describe('TableEditor', () => {
  const defaultProps = {
    datasetId: 'dataset_123',
    tableType: 'vehicles' as const,
    projectId: 'project_123'
  }

  it('should render loading state', () => {
    const { useQuery } = require('convex/react')
    useQuery.mockReturnValue(undefined)

    render(<TableEditor {...defaultProps} />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render vehicle data in table', () => {
    const mockVehicles = [
      createMockVehicle({ 
        description: 'Test Vehicle 1',
        capacity: [1000]
      }),
      createMockVehicle({ 
        description: 'Test Vehicle 2',
        capacity: [500]
      })
    ]

    const { useQuery } = require('convex/react')
    useQuery.mockReturnValue(mockVehicles)

    render(<TableEditor {...defaultProps} />)

    expect(screen.getByText('Test Vehicle 1')).toBeInTheDocument()
    expect(screen.getByText('Test Vehicle 2')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('should handle cell editing', async () => {
    const mockVehicles = [createMockVehicle({ description: 'Original' })]
    const mockMutation = vi.fn()

    const { useQuery, useMutation } = require('convex/react')
    useQuery.mockReturnValue(mockVehicles)
    useMutation.mockReturnValue(mockMutation)

    render(<TableEditor {...defaultProps} />)

    const cell = screen.getByText('Original')
    fireEvent.click(cell)

    // Should switch to edit mode
    const input = screen.getByDisplayValue('Original')
    fireEvent.change(input, { target: { value: 'Updated' } })
    fireEvent.blur(input)

    expect(mockMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Updated'
      })
    )
  })
})