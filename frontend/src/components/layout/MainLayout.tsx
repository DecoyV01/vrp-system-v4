import { Outlet } from 'react-router-dom'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-muted/30">
      <PrimarySidebar />
      <SecondarySidebar />
      <main className="flex-1 overflow-hidden bg-background">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout