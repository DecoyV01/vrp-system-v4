import { create } from 'zustand'

interface TreeNode {
  id: string
  type: 'project' | 'scenario' | 'dataset' | 'table'
  name: string
  children?: TreeNode[]
  expanded?: boolean
}

interface HierarchyState {
  selectedNode: TreeNode | null
  expandedNodes: Set<string>
  treeData: TreeNode[]
  
  setSelectedNode: (node: TreeNode | null) => void
  toggleNode: (nodeId: string) => void
  setTreeData: (data: TreeNode[]) => void
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
}

export const useHierarchy = create<HierarchyState>()((set) => ({
  selectedNode: null,
  expandedNodes: new Set(),
  treeData: [],
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  toggleNode: (nodeId) => set((state) => {
    const newExpandedNodes = new Set(state.expandedNodes)
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId)
    } else {
      newExpandedNodes.add(nodeId)
    }
    return { expandedNodes: newExpandedNodes }
  }),
  
  setTreeData: (data) => set({ treeData: data }),
  
  expandNode: (nodeId) => set((state) => {
    const newExpandedNodes = new Set(state.expandedNodes)
    newExpandedNodes.add(nodeId)
    return { expandedNodes: newExpandedNodes }
  }),
  
  collapseNode: (nodeId) => set((state) => {
    const newExpandedNodes = new Set(state.expandedNodes)
    newExpandedNodes.delete(nodeId)
    return { expandedNodes: newExpandedNodes }
  }),
}))