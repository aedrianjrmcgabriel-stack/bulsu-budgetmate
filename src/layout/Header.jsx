
import { useEffect, useState } from 'react'
import {
  Bell,
  UserRound,
  Sparkles,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeToNotifications } from '../services/notificationService'

function Header() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)

  const userName =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Student'

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadCount(0)
      return
    }

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (notifications) => {
        const unread = notifications.filter(
          (notification) => !notification.isRead
        ).length

        setUnreadCount(unread)
      },
      (error) => {
        console.error('Failed to load notifications:', error)
      }
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  return (
    <header className="bm-header">

      <div className="bm-header-welcome">
        <div className="bm-header-greeting">
          <Sparkles size={15} />
          <span>YOUR FINANCIAL SPACE</span>
        </div>

        <div className="bm-header-title">
          <span>Welcome back, </span>
          <strong>{userName}</strong>
        </div>

        <p className="bm-header-subtitle">
          Here's what's happening with your finances today.
        </p>
      </div>

      <div className="bm-header-actions">

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="bm-header-notification"
          aria-label={`Notifications, ${unreadCount} unread`}
          title="Notifications"
        >
          <Bell size={21} />

          {unreadCount > 0 && (
            <span className="bm-notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="bm-header-profile"
          aria-label="Open profile settings"
          title="Profile Settings"
        >
          <UserRound size={21} />
        </button>

      </div>
    </header>
  )
}

export default Header
