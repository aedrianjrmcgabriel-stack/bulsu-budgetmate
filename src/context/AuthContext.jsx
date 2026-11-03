
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from '../firebase/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function saveUserProfile(user, name = '') {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        name: name || user.displayName || '',
        email: user.email,
        role: 'student',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  async function register(name, email, password) {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    await updateProfile(result.user, {
      displayName: name,
    })

    await saveUserProfile(result.user, name)

    return result.user
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    await saveUserProfile(result.user)

    return result.user
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
