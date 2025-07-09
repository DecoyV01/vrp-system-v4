import { create } from 'zustand'
import { useProjects, useScenarios, useDatasets } from './useVRPData'
import { useMemo } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'

export interface TreeNode {
  id: string
  type: 'project' | 'scenario' | 'dataset' | 'table'
  name: string
  realId?: Id<'projects'> | Id<'scenarios'> | Id<'datasets'> | string // Real Convex ID
  children?: TreeNode[]
  expanded?: boolean
  metadata?: {
    projectId?: Id<'projects'>
    scenarioId?: Id<'scenarios'>
    datasetId?: Id<'datasets'>
    tableType?: 'vehicles' | 'jobs' | 'locations' | 'routes'
  }
}

interface HierarchyState {
  selectedNode: TreeNode | null
  expandedNodes: Set<string>

  setSelectedNode: (node: TreeNode | null) => void
  toggleNode: (nodeId: string) => void
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
  isNodeExpanded: (nodeId: string) => boolean
}

export const useHierarchy = create<HierarchyState>()((set, get) => ({
  selectedNode: null,
  expandedNodes: new Set(),

  setSelectedNode: node => set({ selectedNode: node }),

  toggleNode: nodeId =>
    set(state => {
      const newExpandedNodes = new Set(state.expandedNodes)
      if (newExpandedNodes.has(nodeId)) {
        newExpandedNodes.delete(nodeId)
      } else {
        newExpandedNodes.add(nodeId)
      }
      return { expandedNodes: newExpandedNodes }
    }),

  expandNode: nodeId =>
    set(state => {
      const newExpandedNodes = new Set(state.expandedNodes)
      newExpandedNodes.add(nodeId)
      return { expandedNodes: newExpandedNodes }
    }),

  collapseNode: nodeId =>
    set(state => {
      const newExpandedNodes = new Set(state.expandedNodes)
      newExpandedNodes.delete(nodeId)
      return { expandedNodes: newExpandedNodes }
    }),

  isNodeExpanded: nodeId => get().expandedNodes.has(nodeId),
}))

// Hook to build tree data from Convex queries
export const useTreeData = () => {
  const projects = useProjects()
  const { expandedNodes } = useHierarchy()

  const treeData = useMemo(() => {
    if (!projects || projects.length === 0) return []

    return projects.map(project => {
      const projectId = `project-${project._id}`
      const isExpanded = expandedNodes.has(projectId)

      const projectNode: TreeNode = {
        id: projectId,
        type: 'project',
        name: project.name,
        realId: project._id,
        expanded: isExpanded,
        metadata: { projectId: project._id },
        children: isExpanded ? [] : undefined, // Will be populated by child components
      }

      return projectNode
    })
  }, [projects, expandedNodes])

  return treeData
}

// Hook for getting scenarios for a specific project
export const useProjectScenarios = (projectId: Id<'projects'> | undefined) => {
  const scenarios = useScenarios(projectId)
  const { expandedNodes } = useHierarchy()

  return useMemo(() => {
    if (!scenarios || !projectId) return []

    return scenarios.map(scenario => {
      const scenarioId = `scenario-${scenario._id}`
      const isExpanded = expandedNodes.has(scenarioId)

      const scenarioNode: TreeNode = {
        id: scenarioId,
        type: 'scenario',
        name: scenario.name,
        realId: scenario._id,
        expanded: isExpanded,
        metadata: {
          projectId: projectId,
          scenarioId: scenario._id,
        },
        children: isExpanded ? [] : undefined, // Will be populated by child components
      }

      return scenarioNode
    })
  }, [scenarios, projectId, expandedNodes])
}

// Hook for getting datasets for a specific scenario
export const useScenarioDatasets = (
  scenarioId: Id<'scenarios'> | undefined,
  projectId?: Id<'projects'>
) => {
  const datasets = useDatasets(scenarioId)
  const { expandedNodes } = useHierarchy()

  return useMemo(() => {
    if (!datasets || !scenarioId) return []

    return datasets.map(dataset => {
      const datasetId = `dataset-${dataset._id}`
      const isExpanded = expandedNodes.has(datasetId)

      const datasetNode: TreeNode = {
        id: datasetId,
        type: 'dataset',
        name: `${dataset.name} v${dataset.version}`,
        realId: dataset._id,
        expanded: isExpanded,
        metadata: {
          projectId: projectId,
          scenarioId: scenarioId,
          datasetId: dataset._id,
        },
        children: isExpanded
          ? [
              {
                id: `table-${dataset._id}-vehicles`,
                type: 'table',
                name: 'Vehicles',
                metadata: {
                  projectId: projectId,
                  scenarioId: scenarioId,
                  datasetId: dataset._id,
                  tableType: 'vehicles',
                },
              },
              {
                id: `table-${dataset._id}-jobs`,
                type: 'table',
                name: 'Jobs',
                metadata: {
                  projectId: projectId,
                  scenarioId: scenarioId,
                  datasetId: dataset._id,
                  tableType: 'jobs',
                },
              },
              {
                id: `table-${dataset._id}-locations`,
                type: 'table',
                name: 'Locations',
                metadata: {
                  projectId: projectId,
                  scenarioId: scenarioId,
                  datasetId: dataset._id,
                  tableType: 'locations',
                },
              },
              {
                id: `table-${dataset._id}-routes`,
                type: 'table',
                name: 'Routes',
                metadata: {
                  projectId: projectId,
                  scenarioId: scenarioId,
                  datasetId: dataset._id,
                  tableType: 'routes',
                },
              },
            ]
          : undefined,
      }

      return datasetNode
    })
  }, [datasets, scenarioId, projectId, expandedNodes])
}

// Helper to parse node ID and extract type and ID
export const parseNodeId = (nodeId: string) => {
  const [type, id] = nodeId.split('-')
  return { type, id }
}

// Helper to generate URL from tree node
export const getNodeUrl = (node: TreeNode): string => {
  if (node.type === 'project') {
    return `/projects/${node.realId}`
  } else if (node.type === 'scenario') {
    return `/projects/${node.metadata?.projectId}/scenarios/${node.realId}`
  } else if (node.type === 'dataset') {
    return `/projects/${node.metadata?.projectId}/scenarios/${node.metadata?.scenarioId}/datasets/${node.realId}`
  } else if (node.type === 'table') {
    return `/projects/${node.metadata?.projectId}/scenarios/${node.metadata?.scenarioId}/datasets/${node.metadata?.datasetId}/${node.metadata?.tableType}`
  }
  return '/projects'
}
