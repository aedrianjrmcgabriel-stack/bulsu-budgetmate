
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PiggyBank,
  Trophy,
  Calculator,
  ChartNoAxesCombined,
  Bell,
  Settings,
  LogOut,
  X,
  AlertCircle,
  Flame,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
  { name: 'Challenges', path: '/challenges', icon: Trophy },
  { name: 'What-If Simulator', path: '/what-if', icon: Calculator },
  { name: 'Analytics', path: '/analytics', icon: ChartNoAxesCombined },
  { name: 'Notifications', path: '/notifications', icon: Bell },
]

function Sidebar() {
  const { logout } = useAuth()

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    try {
      setLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      alert('Unable to log out. Please try again.')
    } finally {
      setLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <>
      <aside className="bm-sidebar">

        {/* BRAND LOGO */}
        <div className="bm-brand">
          <img
            src="/budgetmate-logo.png"
            alt="BulSU BudgetMate Logo"
            className="bm-brand-logo"
          />
        </div>

        {/* NAVIGATION LABEL */}
        <div className="bm-menu-label">
          <span>MAIN MENU</span>
        </div>

        {/* MAIN NAVIGATION */}
        <nav className="bm-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `bm-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={19} strokeWidth={2} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* BOTTOM NAVIGATION */}
        <div className="bm-sidebar-bottom">

          <div className="bm-menu-label">
            <span>PREFERENCES</span>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `bm-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Settings size={19} strokeWidth={2} />
            <span>Settings</span>
          </NavLink>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="bm-logout-button"
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>

        </div>

        {/* SIDEBAR FOOTER */}
        <div className="bm-sidebar-footer">
          <div className="bm-footer-icon">
            <Flame size={22} />
          </div>

          <div className="bm-footer-text">
            <strong>BulSU BudgetMate</strong>
            <span>Manage your money wisely.</span>
          </div>
        </div>

      </aside>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="bm-modal-overlay"
          onClick={() => {
            if (!loggingOut) setShowLogoutModal(false)
          }}
        >
          <div
            className="bm-logout-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              type="button"
              className="bm-modal-close"
              onClick={() => setShowLogoutModal(false)}
              disabled={loggingOut}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="bm-modal-icon">
              <AlertCircle size={30} />
            </div>

            <h2>Confirm Logout</h2>

            <p>
              Are you sure you want to log out of your
              BulSU BudgetMate account?
            </p>

            <div className="bm-modal-actions">
              <button
                type="button"
                className="bm-cancel-button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>

              <button
                type="button"
                className="bm-confirm-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
