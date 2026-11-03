
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PiggyBank,
} from 'lucide-react'

import Sidebar from './Sidebar'
import Header from './Header'

const mobileItems = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
]

function AppLayout() {
  return (
    <div className="bm-app-layout">
      <Sidebar />

      <div className="bm-main-layout">
        <Header />

        <main className="bm-main-content">
          <Outlet />
        </main>
      </div>

      <nav className="bm-mobile-nav">
        {mobileItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `bm-mobile-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={21} strokeWidth={2} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default AppLayout
