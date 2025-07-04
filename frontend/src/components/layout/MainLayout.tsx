import { Outlet } from 'react-router-dom'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <PrimarySidebar />
      <SecondarySidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout