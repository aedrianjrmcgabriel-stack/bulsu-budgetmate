
import Avatar from '../components/Avatar'
import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import {
  User,
  Mail,
  Sun,
  Moon,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { auth, db } from '../firebase/firebase'

import './Settings.css'

export default function Settings() {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [name, setName] = useState(
    currentUser?.displayName || ''
  )

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)

  async function handleSaveProfile(e) {
    e.preventDefault()

    if (!name.trim()) {
      setMessage('Please enter your name.')
      setMessageError(true)
      return
    }

    if (!auth.currentUser || !currentUser?.uid) {
      setMessage('You must be logged in to update your profile.')
      setMessageError(true)
      return
    }

    try {
      setSaving(true)
      setMessage('')
      setMessageError(false)

      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      })

      await updateDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: name.trim(),
          updatedAt: new Date(),
        }
      )

      setMessage('Name updated successfully!')
      setMessageError(false)
    } catch (error) {
      console.error('Profile update error:', error)

      setMessage('Unable to update your name. Please try again.')
      setMessageError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bm-settings-page">

      {/* PAGE HEADER */}
      <div className="bm-settings-header">
        <h1>Settings</h1>
        <p>Manage your account and application preferences.</p>
      </div>

      {/* PROFILE SETTINGS */}
      <section className="bm-settings-card">

        <div className="bm-settings-profile">
          <Avatar
            name={name || currentUser?.email || 'User'}
            size="xl"
          />

          <div className="bm-settings-profile-info">
            <h3>{name || 'BudgetMate User'}</h3>
            <p>{currentUser?.email}</p>
          </div>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="bm-settings-form"
        >

          {/* FULL NAME */}
          <div className="bm-settings-field">
            <label htmlFor="settings-name">Full Name</label>

            <div className="bm-settings-input-wrapper">
              <User size={18} />

              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setMessage('')
                }}
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* EMAIL ADDRESS */}
          <div className="bm-settings-field">
            <label htmlFor="settings-email">Email Address</label>

            <div className="bm-settings-input-wrapper disabled">
              <Mail size={18} />

              <input
                id="settings-email"
                type="email"
                value={currentUser?.email || ''}
                disabled
              />
            </div>

            <p className="bm-settings-hint">
              Your registered email address cannot be changed here.
            </p>
          </div>

          {/* SAVE BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="bm-settings-save-btn"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* SUCCESS OR ERROR MESSAGE */}
          {message && (
            <div
              className={`bm-settings-message ${
                messageError ? 'error' : 'success'
              }`}
            >
              {messageError ? (
                <AlertCircle size={17} />
              ) : (
                <CheckCircle size={17} />
              )}
              <span>{message}</span>
            </div>
          )}

        </form>
      </section>

      {/* APPEARANCE SETTINGS */}
      <section className="bm-settings-card">

        <div className="bm-settings-section-heading">
          <div className="bm-settings-appearance-icon">
            {theme === 'light' ? (
              <Sun size={22} />
            ) : (
              <Moon size={22} />
            )}
          </div>

          <div>
            <h2>Appearance</h2>
            <p>Customize how BudgetMate looks.</p>
          </div>
        </div>

        <div className="bm-settings-appearance-row">
          <div>
            <h3>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</h3>

            <p>
              {theme === 'light'
                ? 'You are currently using light appearance.'
                : 'You are currently using dark appearance.'}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="bm-settings-theme-btn"
          >
            {theme === 'light' ? (
              <>
                <Moon size={17} />
                Enable Dark Mode
              </>
            ) : (
              <>
                <Sun size={17} />
                Enable Light Mode
              </>
            )}
          </button>
        </div>

      </section>
    </div>
  )
}
