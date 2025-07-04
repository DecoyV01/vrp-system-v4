import { useEffect } from 'react'
import useSidebarStore from '@/stores/useSidebarStore'

// Design system breakpoints
const BREAKPOINTS = {
  MOBILE: 768,  // < 768px
  TABLET: 1024  // 768px - 1024px
} as const

/**
 * Hook to detect responsive breakpoints and update sidebar state accordingly
 * Follows the Design System Guidelines responsive behavior
 */
const useResponsive = () => {
  const { setResponsiveState, isMobile, isTablet } = useSidebarStore()

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth
      const newIsMobile = width < BREAKPOINTS.MOBILE
      const newIsTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET
      
      // Only update if state actually changed to prevent unnecessary re-renders
      if (newIsMobile !== isMobile || newIsTablet !== isTablet) {
        setResponsiveState(newIsMobile, newIsTablet)
      }
    }

    // Initial check
    updateResponsiveState()

    // Listen for window resize
    window.addEventListener('resize', updateResponsiveState)

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateResponsiveState)
    }
  }, [isMobile, isTablet, setResponsiveState])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  }
}

export default useResponsive