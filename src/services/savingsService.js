import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  setDoc,
} from 'firebase/firestore'

import { db } from '../firebase/firebase'

function goalsCollection(userId) {
  return collection(db, 'users', userId, 'savingsGoals')
}

function contributionsCollection(userId) {
  return collection(db, 'users', userId, 'savingsContributions')
}

// Listen to savings goals
export function subscribeToSavingsGoals(userId, callback, onError) {
  return onSnapshot(
    goalsCollection(userId),
    (snapshot) => {
      const goals = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      callback(goals)
    },
    onError
  )
}

// Listen to savings contribution and withdrawal history
export function subscribeToSavingsHistory(userId, callback, onError) {
  return onSnapshot(
    contributionsCollection(userId),
    (snapshot) => {
      const history = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      history.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })

      callback(history)
    },
    onError
  )
}

// Create a savings goal
export function addSavingsGoal(userId, goal) {
  return addDoc(goalsCollection(userId), {
    ...goal,
    savedAmountCentavos: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Update a savings goal's details
export function updateSavingsGoal(userId, goalId, goal) {
  const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId)

  return updateDoc(goalRef, {
    ...goal,
    updatedAt: serverTimestamp(),
  })
}

// Delete a savings goal
export function removeSavingsGoal(userId, goalId) {
  const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId)

  return deleteDoc(goalRef)
}

// Add a contribution to a savings goal
export async function addSavingsContribution(
  userId,
  goalId,
  amountCentavos,
  note = ''
) {
  const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId)
  const historyRef = doc(contributionsCollection(userId))

  await runTransaction(db, async (transaction) => {
    const goalSnapshot = await transaction.get(goalRef)

    if (!goalSnapshot.exists()) {
      throw new Error('Savings goal not found.')
    }

    const goal = goalSnapshot.data()
    const currentSaved = Number(goal.savedAmountCentavos) || 0
    const newSaved = currentSaved + amountCentavos

    transaction.update(goalRef, {
      savedAmountCentavos: newSaved,
      updatedAt: serverTimestamp(),
    })

    transaction.set(historyRef, {
      goalId,
      goalName: goal.name,
      type: 'contribution',
      amountCentavos,
      note,
      createdAt: serverTimestamp(),
    })
  })
}

// Withdraw money from a savings goal
export async function withdrawSavings(
  userId,
  goalId,
  amountCentavos,
  note = ''
) {
  const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId)
  const historyRef = doc(contributionsCollection(userId))

  await runTransaction(db, async (transaction) => {
    const goalSnapshot = await transaction.get(goalRef)

    if (!goalSnapshot.exists()) {
      throw new Error('Savings goal not found.')
    }

    const goal = goalSnapshot.data()
    const currentSaved = Number(goal.savedAmountCentavos) || 0

    if (amountCentavos > currentSaved) {
      throw new Error('Withdrawal amount exceeds your saved amount.')
    }

    transaction.update(goalRef, {
      savedAmountCentavos: currentSaved - amountCentavos,
      updatedAt: serverTimestamp(),
    })

    transaction.set(historyRef, {
      goalId,
      goalName: goal.name,
      type: 'withdrawal',
      amountCentavos,
      note,
      createdAt: serverTimestamp(),
    })
  })
}