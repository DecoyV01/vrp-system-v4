import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  primary: {
    collapsed: boolean
    width: number // 64px collapsed, 240px expanded
  }
  secondary: {
    collapsed: boolean
    width: number // 0px collapsed, 256px expanded
  }
  isMobile: boolean
  isTablet: boolean
}

interface SidebarActions {
  togglePrimary: () => void
  toggleSecondary: () => void
  setPrimaryCollapsed: (collapsed: boolean) => void
  setSecondaryCollapsed: (collapsed: boolean) => void
  setResponsiveState: (isMobile: boolean, isTablet: boolean) => void
  autoCollapsePrimary: () => void
  restorePrimary: () => void
}

type SidebarStore = SidebarState & SidebarActions

// Design System Compliant Widths (8pt grid)
const SIDEBAR_WIDTHS = {
  PRIMARY_COLLAPSED: 64,  // 8×8
  PRIMARY_EXPANDED: 240,  // 8×30
  SECONDARY_COLLAPSED: 0, // Hidden
  SECONDARY_EXPANDED: 256 // 8×32
} as const

const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      primary: {
        collapsed: false, // Desktop default: expanded
        width: SIDEBAR_WIDTHS.PRIMARY_EXPANDED
      },
      secondary: {
        collapsed: false, // Default: visible
        width: SIDEBAR_WIDTHS.SECONDARY_EXPANDED
      },
      isMobile: false,
      isTablet: false,

      // Actions
      togglePrimary: () => {
        const { primary } = get()
        set({
          primary: {
            collapsed: !primary.collapsed,
            width: primary.collapsed 
              ? SIDEBAR_WIDTHS.PRIMARY_EXPANDED 
              : SIDEBAR_WIDTHS.PRIMARY_COLLAPSED
          }
        })
      },

      toggleSecondary: () => {
        const { secondary } = get()
        set({
          secondary: {
            collapsed: !secondary.collapsed,
            width: secondary.collapsed 
              ? SIDEBAR_WIDTHS.SECONDARY_EXPANDED 
              : SIDEBAR_WIDTHS.SECONDARY_COLLAPSED
          }
        })
      },

      setPrimaryCollapsed: (collapsed: boolean) => {
        set({
          primary: {
            collapsed,
            width: collapsed 
              ? SIDEBAR_WIDTHS.PRIMARY_COLLAPSED 
              : SIDEBAR_WIDTHS.PRIMARY_EXPANDED
          }
        })
      },

      setSecondaryCollapsed: (collapsed: boolean) => {
        set({
          secondary: {
            collapsed,
            width: collapsed 
              ? SIDEBAR_WIDTHS.SECONDARY_COLLAPSED 
              : SIDEBAR_WIDTHS.SECONDARY_EXPANDED
          }
        })
      },

      setResponsiveState: (isMobile: boolean, isTablet: boolean) => {
        const currentState = get()
        set({ isMobile, isTablet })

        // Auto-collapse behavior based on screen size
        if (isMobile) {
          // Mobile: Both sidebars hidden by default
          set({
            primary: {
              collapsed: true,
              width: SIDEBAR_WIDTHS.PRIMARY_COLLAPSED
            },
            secondary: {
              collapsed: true,
              width: SIDEBAR_WIDTHS.SECONDARY_COLLAPSED
            }
          })
        } else if (isTablet) {
          // Tablet: Auto-collapse primary, secondary user-controlled
          set({
            primary: {
              collapsed: true,
              width: SIDEBAR_WIDTHS.PRIMARY_COLLAPSED
            }
            // Keep secondary state as is
          })
        } else {
          // Desktop: Restore previous state or defaults
          if (currentState.isMobile || currentState.isTablet) {
            set({
              primary: {
                collapsed: false,
                width: SIDEBAR_WIDTHS.PRIMARY_EXPANDED
              }
              // Keep secondary state as user preference
            })
          }
        }
      },

      autoCollapsePrimary: () => {
        set({
          primary: {
            collapsed: true,
            width: SIDEBAR_WIDTHS.PRIMARY_COLLAPSED
          }
        })
      },

      restorePrimary: () => {
        const { isMobile, isTablet } = get()
        if (!isMobile && !isTablet) {
          set({
            primary: {
              collapsed: false,
              width: SIDEBAR_WIDTHS.PRIMARY_EXPANDED
            }
          })
        }
      }
    }),
    {
      name: 'vrp-sidebar-state', // localStorage key
      partialize: (state) => ({
        // Only persist user preferences, not responsive states
        primary: { 
          collapsed: state.primary.collapsed,
          width: state.primary.width
        },
        secondary: { 
          collapsed: state.secondary.collapsed,
          width: state.secondary.width
        }
        // Don't persist isMobile/isTablet - these are detected on load
      })
    }
  )
)

export default useSidebarStore