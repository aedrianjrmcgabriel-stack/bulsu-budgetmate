import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'

import { db } from '../firebase/firebase'

function challengesCollection(userId) {
  return collection(db, 'users', userId, 'challenges')
}

export function subscribeToChallenges(userId, callback, onError) {
  return onSnapshot(
    challengesCollection(userId),
    (snapshot) => {
      const challenges = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))

      challenges.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })

      callback(challenges)
    },
    onError
  )
}

export function addChallenge(userId, challenge) {
  return addDoc(challengesCollection(userId), {
    ...challenge,
    savedAmountCentavos: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateChallenge(userId, challengeId, challenge) {
  const challengeRef = doc(
    db,
    'users',
    userId,
    'challenges',
    challengeId
  )

  return updateDoc(challengeRef, {
    ...challenge,
    updatedAt: serverTimestamp(),
  })
}

export function deleteChallenge(userId, challengeId) {
  const challengeRef = doc(
    db,
    'users',
    userId,
    'challenges',
    challengeId
  )

  return deleteDoc(challengeRef)
}

export async function addChallengeProgress(
  userId,
  challengeId,
  amountCentavos
) {
  const challengeRef = doc(
    db,
    'users',
    userId,
    'challenges',
    challengeId
  )

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(challengeRef)

    if (!snapshot.exists()) {
      throw new Error('Challenge not found.')
    }

    const challenge = snapshot.data()

    if (challenge.status === 'completed') {
      throw new Error('This challenge is already completed.')
    }

    const currentSaved = Number(challenge.savedAmountCentavos) || 0
    const target = Number(challenge.targetAmountCentavos) || 0
    const newSaved = currentSaved + amountCentavos

    transaction.update(challengeRef, {
      savedAmountCentavos: newSaved,
      status: newSaved >= target ? 'completed' : 'active',
      completedAt: newSaved >= target ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    })
  })
}