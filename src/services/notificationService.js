import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore'

import { db } from '../firebase/firebase'

function notificationsCollection(userId) {
  return collection(db, 'users', userId, 'notifications')
}

// Real-time notifications
export function subscribeToNotifications(userId, callback, onError) {
  const q = query(
    notificationsCollection(userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      callback(notifications)
    },
    onError
  )
}

// Add notification
export function addNotification(userId, notification) {
  return addDoc(notificationsCollection(userId), {
    ...notification,
    isRead: false,
    createdAt: serverTimestamp(),
  })
}

// Mark one as read
export function markNotificationAsRead(userId, notificationId) {
  const notificationRef = doc(
    db,
    'users',
    userId,
    'notifications',
    notificationId
  )

  return updateDoc(notificationRef, {
    isRead: true,
  })
}

// Mark all as read
export async function markAllNotificationsAsRead(userId) {
  const snapshot = await getDocs(notificationsCollection(userId))
  const batch = writeBatch(db)

  snapshot.docs.forEach((item) => {
    if (!item.data().isRead) {
      batch.update(item.ref, { isRead: true })
    }
  })

  return batch.commit()
}

// Delete one notification
export function deleteNotification(userId, notificationId) {
  const notificationRef = doc(
    db,
    'users',
    userId,
    'notifications',
    notificationId
  )

  return deleteDoc(notificationRef)
}

// Delete all notifications
export async function deleteAllNotifications(userId) {
  const snapshot = await getDocs(notificationsCollection(userId))
  const batch = writeBatch(db)

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref)
  })

  return batch.commit()
}