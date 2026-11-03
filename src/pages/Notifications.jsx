
import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Wallet,
  Target,
  PiggyBank,
  AlertCircle,
  Info,
  Clock,
  Check,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationService'

import './Notifications.css'

export default function Notifications() {
  const { currentUser } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (data) => {
        setNotifications(data)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('Notifications error:', err)
        setError('Unable to load notifications.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length

  const readCount = notifications.length - unreadCount

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'Unread') return !item.isRead
    if (filter === 'Read') return item.isRead
    return true
  })

  function getNotificationIcon(type) {
    switch (type) {
      case 'transaction':
        return <Wallet size={21} />
      case 'budget':
        return <Target size={21} />
      case 'savings':
        return <PiggyBank size={21} />
      case 'warning':
        return <AlertCircle size={21} />
      default:
        return <Info size={21} />
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Just now'

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp)

    if (Number.isNaN(date.getTime())) return 'Just now'

    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  async function handleMarkAsRead(id) {
    if (!currentUser?.uid) return

    try {
      await markNotificationAsRead(currentUser.uid, id)
    } catch (err) {
      console.error(err)
      alert('Unable to mark notification as read.')
    }
  }

  async function handleMarkAllAsRead() {
    if (!currentUser?.uid || unreadCount === 0) return

    try {
      setProcessing(true)
      await markAllNotificationsAsRead(currentUser.uid)
    } catch (err) {
      console.error(err)
      alert('Unable to update notifications.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete(id) {
    if (!currentUser?.uid) return
    if (!window.confirm('Delete this notification?')) return

    try {
      await deleteNotification(currentUser.uid, id)
    } catch (err) {
      console.error(err)
      alert('Unable to delete notification.')
    }
  }

  async function handleDeleteAll() {
    if (!currentUser?.uid || notifications.length === 0) return

    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return
    }

    try {
      setProcessing(true)
      await deleteAllNotifications(currentUser.uid)
    } catch (err) {
      console.error(err)
      alert('Unable to delete notifications.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bm-notifications-page">

      {/* Page Header */}
      <div className="bm-notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your BudgetMate activities.</p>
        </div>

        <div className="bm-notification-header-actions">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || processing}
            className="bm-notification-action-btn"
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={notifications.length === 0 || processing}
            className="bm-notification-action-btn bm-delete-all-btn"
          >
            <Trash2 size={17} />
            Delete all
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bm-notification-summary">

        <div className="bm-notification-summary-card">
          <div className="bm-notification-summary-icon bm-summary-maroon">
            <Bell size={23} />
          </div>
          <div>
            <p>Total Notifications</p>
            <h2>{notifications.length}</h2>
          </div>
        </div>

        <div className="bm-notification-summary-card">
          <div className="bm-notification-summary-icon bm-summary-amber">
            <Clock size={23} />
          </div>
          <div>
            <p>Unread</p>
            <h2>{unreadCount}</h2>
          </div>
        </div>

        <div className="bm-notification-summary-card">
          <div className="bm-notification-summary-icon bm-summary-green">
            <Check size={23} />
          </div>
          <div>
            <p>Read</p>
            <h2>{readCount}</h2>
          </div>
        </div>

      </div>

      {/* Notification List */}
      <section className="bm-notification-panel">

        <div className="bm-notification-panel-header">
          <div>
            <h2>All Notifications</h2>
            <p>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
                : 'You are all caught up!'}
            </p>
          </div>

          <div className="bm-notification-filters">
            {['All', 'Unread', 'Read'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={
                  filter === item
                    ? 'bm-notification-filter active'
                    : 'bm-notification-filter'
                }
              >
                {item}
                {item === 'Unread' && unreadCount > 0 && (
                  <span>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bm-notification-state">
            <div className="bm-notification-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bm-notification-state bm-notification-error">
            <AlertCircle size={30} />
            <p>{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bm-notification-empty">
            <div className="bm-notification-empty-icon">
              <Bell size={32} />
            </div>

            <h3>
              {filter === 'All'
                ? 'No notifications yet'
                : `No ${filter.toLowerCase()} notifications`}
            </h3>

            <p>
              {filter === 'All'
                ? 'You will see updates about your transactions, budgets, and savings here.'
                : 'There are no notifications in this category.'}
            </p>
          </div>
        ) : (
          <div className="bm-notification-list">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`bm-notification-item ${
                  !item.isRead ? 'unread' : ''
                }`}
              >
                <div className="bm-notification-item-content">
                  <div className="bm-notification-type-icon">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="bm-notification-details">
                    <div className="bm-notification-title-row">
                      <h3>{item.title || 'Notification'}</h3>

                      {!item.isRead && (
                        <span className="bm-notification-new-badge">
                          New
                        </span>
                      )}
                    </div>

                    <p className="bm-notification-message">
                      {item.message || 'You have a new update.'}
                    </p>

                    <span className="bm-notification-date">
                      <Clock size={13} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="bm-notification-item-actions">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="bm-notification-icon-btn bm-mark-read-btn"
                    >
                      <Check size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete notification"
                    aria-label="Delete notification"
                    className="bm-notification-icon-btn bm-delete-notification-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>
    </div>
  )
}
