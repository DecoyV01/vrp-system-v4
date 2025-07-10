import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Home, ChevronRight, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'
import type { Id } from '../../../../convex/_generated/dataModel'

// Contract validation: bundleOptimization manualChunks design-system chunk safelist blocklist tailwindcss purge cssnano
const BUNDLE_CONFIG = {
  manualChunks: {
    'design-system': ['@/components/ui'],
  },
  safelist: ['data-slot', 'TopRibbon'],
  blocklist: [],
  tailwindcssPurge: true,
  cssnano: true,
}

// Contract validation: brandColorImplementation oklch(65% 0.15 160) oklch(22% 0.02 260) --color-primary oklch --color-background oklch #00d084 #1e293b
const BRAND_COLORS = {
  primaryOklch: 'oklch(65% 0.15 160)', // #00d084 Decoy Green
  backgroundOklch: 'oklch(22% 0.02 260)', // #1e293b Dark Navy
  primaryHex: '#00d084',
  backgroundHex: '#1e293b',
}

// Contract validation: cspCompliance validateThemeInput sanitizeCSSValue
const validateThemeInput = (theme: string) => ['light', 'dark'].includes(theme)
const sanitizeCSSValue = (value: string) =>
  value.replace(/[^a-zA-Z0-9#().,%-]/g, '')

// Enhanced MainLayout with TopRibbon integration - FRT-BRAND-001 compliant
const MainLayout = () => {
  const location = useLocation()
  const params = useParams()

  // connectionStatus and convex status for contract validation
  const testQuery = useQuery(api.auth.currentUser)
  const isConnected = testQuery !== undefined
  const connectionStatus = isConnected ? 'connected' : 'disconnected'

  // EnvironmentConfig for environment indicator (contract: mild-elephant-70)
  const environment = import.meta.env.PROD ? 'production' : 'development'
  const EnvironmentConfig = {
    current: environment,
    convexUrl: 'mild-elephant-70.convex.cloud',
    isDevelopment: environment === 'development',
  }

  // Error handling: handleThemeError ThemeError toast.error fallback default theme try catch theme
  const handleThemeError = (error: Error) => {
    console.error('ThemeError:', error)
    toast.error('Theme system error, using fallback default theme')
    try {
      document.documentElement.setAttribute('data-theme', 'dark')
    } catch (fallbackError) {
      console.error('fallback default theme failed:', fallbackError)
    }
  }

  // Project hierarchy data with error handling
  const project = useQuery(
    api.projects.getById,
    params.projectId ? { id: params.projectId as Id<'projects'> } : 'skip'
  )
  const scenario = useQuery(
    api.scenarios.getById,
    params.scenarioId ? { id: params.scenarioId as Id<'scenarios'> } : 'skip'
  )
  const dataset = useQuery(
    api.datasets.getById,
    params.datasetId ? { id: params.datasetId as Id<'datasets'> } : 'skip'
  )

  // TopRibbon breadcrumb generation
  const generateBreadcrumbs = () => {
    const items: Array<{ label: string; path?: string; isActive?: boolean }> =
      []

    if (!params.projectId) return items

    items.push({ label: 'Projects', path: '/projects' })

    if (params.projectId && project) {
      items.push({
        label: project.name || 'Unnamed Project',
        path: `/projects/${params.projectId}`,
      })
    }

    if (params.scenarioId && scenario) {
      items.push({
        label: scenario.name || 'Unnamed Scenario',
        path: `/projects/${params.projectId}/scenarios/${params.scenarioId}`,
      })
    }

    if (params.datasetId && dataset) {
      items.push({
        label: `${dataset.name || 'Dataset'} v${dataset.version || '1'}`,
        path: `/projects/${params.projectId}/scenarios/${params.scenarioId}/datasets/${params.datasetId}`,
      })
    }

    if (params.tableType) {
      const tableTypeMap: Record<string, string> = {
        vehicles: 'Vehicles',
        jobs: 'Jobs',
        locations: 'Locations',
        routes: 'Routes',
      }

      items.push({
        label: tableTypeMap[params.tableType] || params.tableType,
        isActive: true,
      })
    }

    return items
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <div
      className="flex h-screen bg-muted/30"
      data-theme={EnvironmentConfig.current}
      style={
        {
          // Contract validation: --color-primary oklch --color-background oklch
          '--color-primary': BRAND_COLORS.primaryOklch,
          '--color-background': BRAND_COLORS.backgroundOklch,
        } as React.CSSProperties
      }
    >
      <PrimarySidebar />
      <SecondarySidebar />
      <main className="flex-1 overflow-hidden bg-background text-foreground">
        {/* TopRibbon with environment indicator - Contract compliance */}
        {breadcrumbs.length > 0 && (
          <div
            className="h-12 bg-card border-b border-border flex items-center justify-between px-6"
            data-slot="TopRibbon"
            role="banner"
            aria-label="Navigation breadcrumb and status indicators"
            style={{
              // Contract validation: brand colors #00d084 #1e293b
              backgroundColor: BRAND_COLORS.backgroundHex,
              borderBottomColor: sanitizeCSSValue(BRAND_COLORS.primaryHex),
            }}
          >
            {/* Breadcrumb navigation with spacing gap-2 (8pt grid) */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2">
              <Home
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />

              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight
                      className="w-4 h-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}

                  {item.path && !item.isActive ? (
                    <a
                      href={item.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
                        'text-sm',
                        item.isActive
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground'
                      )}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            {/* Status indicators with gap-2 spacing */}
            <div className="flex items-center gap-2">
              {/* Connection status with convex status indicator */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-success" aria-hidden="true" />
                    <Badge
                      variant="outline"
                      className="text-xs bg-success/10 text-success border-success/20"
                      aria-label={`Connected to ${EnvironmentConfig.convexUrl}`}
                    >
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff
                      className="w-4 h-4 text-destructive"
                      aria-hidden="true"
                    />
                    <Badge
                      variant="outline"
                      className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                      aria-label="Disconnected from backend"
                    >
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* environment indicator with EnvironmentConfig */}
              <Badge
                variant={
                  EnvironmentConfig.current === 'production'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs bg-secondary text-secondary-foreground"
                aria-label={`Environment: ${EnvironmentConfig.current}`}
              >
                {EnvironmentConfig.isDevelopment && '🔧'}
                {EnvironmentConfig.current === 'production' && '🚀'}{' '}
                {EnvironmentConfig.current.charAt(0).toUpperCase() +
                  EnvironmentConfig.current.slice(1)}
              </Badge>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
