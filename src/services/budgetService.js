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

function budgetsCollection(userId) {
  return collection(db, 'users', userId, 'budgets')
}

export function subscribeToBudgets(userId, callback, onError) {
  return onSnapshot(
    budgetsCollection(userId),
    (snapshot) => {
      const budgets = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      callback(budgets)
    },
    onError
  )
}

export function addBudget(userId, budget) {
  return addDoc(budgetsCollection(userId), {
    ...budget,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateBudget(userId, budgetId, budget) {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId)

  return updateDoc(budgetRef, {
    ...budget,
    updatedAt: serverTimestamp(),
  })
}

export function removeBudget(userId, budgetId) {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId)

  return deleteDoc(budgetRef)
}