import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Home, ChevronRight, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'
import type { Id } from '../../../../convex/_generated/dataModel'

// Enhanced MainLayout with TopRibbon integration - FRT-BRAND-001 compliant
const MainLayout = () => {
  const location = useLocation()
  const params = useParams()
  const { resolvedTheme } = useTheme()

  // connectionStatus and convex status for contract validation
  const testQuery = useQuery(api.auth.currentUser)
  const isConnected = testQuery !== undefined

  // EnvironmentConfig for environment indicator (contract: mild-elephant-70)
  const environment = import.meta.env.PROD ? 'production' : 'development'
  const EnvironmentConfig = {
    current: environment,
    convexUrl: 'mild-elephant-70.convex.cloud',
    isDevelopment: environment === 'development',
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
    <div className="flex flex-col h-screen bg-background">
      {/* TopRibbon spanning FULL WIDTH - above everything like browser tabs */}
      <div
        className="h-12 bg-muted/30 border-b border-border flex items-center justify-between px-6 w-full z-50"
        data-slot="TopRibbon"
        role="banner"
        aria-label="Navigation breadcrumb and status indicators"
      >
        {/* Breadcrumb navigation - ALWAYS show, not conditional */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2"
          role="navigation"
        >
          <Home className="w-4 h-4 text-muted-foreground" aria-hidden="true" />

          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((item, index) => (
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
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded hover:bg-muted/80 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-current={item.isActive ? 'page' : undefined}
                    tabIndex={0}
                    role="link"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={cn(
                      'text-sm px-2 py-1 rounded',
                      item.isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-muted text-muted-foreground'
                    )}
                    aria-current={item.isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))
          ) : (
            // Always show something - never empty
            <div className="flex items-center gap-2">
              <ChevronRight
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">
                VRP System
              </span>
            </div>
          )}
        </nav>

        {/* Status indicators - clean professional look */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" aria-hidden="true" />
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                  aria-label={`Connected to ${EnvironmentConfig.convexUrl}`}
                >
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" aria-hidden="true" />
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200"
                  aria-label="Disconnected from backend"
                >
                  Disconnected
                </Badge>
              </>
            )}
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Environment indicator */}
          <Badge
            variant={
              EnvironmentConfig.current === 'production'
                ? 'production'
                : 'secondary'
            }
            className="text-xs"
            aria-label={`Environment: ${EnvironmentConfig.current}`}
          >
            {EnvironmentConfig.isDevelopment && '🔧'}
            {EnvironmentConfig.current === 'production' && '🚀'}{' '}
            {EnvironmentConfig.current.charAt(0).toUpperCase() +
              EnvironmentConfig.current.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Main layout container - positioned BELOW TopRibbon */}
      <div className="flex flex-1 overflow-hidden">
        <PrimarySidebar />
        <SecondarySidebar />
        <main className="flex-1 overflow-hidden bg-background">
          <div className="h-full overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
