
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../firebase/firebase'

function transactionsCollection(userId) {
  return collection(db, 'users', userId, 'transactions')
}

// Listen for the user's transactions in real time
export function subscribeToTransactions(userId, callback, onError) {
  return onSnapshot(
    transactionsCollection(userId),
    (snapshot) => {
      const transactions = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      transactions.sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      )

      callback(transactions)
    },
    onError
  )
}

// Add a transaction
export function addTransaction(userId, transaction) {
  return addDoc(transactionsCollection(userId), {
    ...transaction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Update a transaction
export function updateTransaction(userId, transactionId, transaction) {
  const transactionRef = doc(
    db,
    'users',
    userId,
    'transactions',
    transactionId
  )

  return updateDoc(transactionRef, {
    ...transaction,
    updatedAt: serverTimestamp(),
  })
}

// Delete a transaction
export function removeTransaction(userId, transactionId) {
  const transactionRef = doc(
    db,
    'users',
    userId,
    'transactions',
    transactionId
  )

  return deleteDoc(transactionRef)
}
