
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addChallenge,
  updateChallenge,
  deleteChallenge,
  subscribeToChallenges,
  addChallengeProgress,
} from '../services/challengeService'

import {
  Plus,
  Trophy,
  Target,
  Pencil,
  Trash2,
  X,
  Medal,
  CheckCircle,
  TrendingUp,
  CalendarDays,
  Flag,
  Award,
} from 'lucide-react'

import './Challenges.css'

function formatMoney(centavos) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format((Number(centavos) || 0) / 100)
}

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value) {
  if (!value) return 'No deadline'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Challenges() {
  const { currentUser } = useAuth()

  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
  })

  const [progressAmount, setProgressAmount] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const unsubscribe = subscribeToChallenges(
      currentUser.uid,
      (data) => {
        setChallenges(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Unable to load challenges.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  const activeChallenges = useMemo(
    () => challenges.filter((item) => item.status === 'active'),
    [challenges]
  )

  const completedChallenges = useMemo(
    () => challenges.filter((item) => item.status === 'completed'),
    [challenges]
  )

  function openAddForm() {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      targetAmount: '',
      deadline: '',
    })
    setError('')
    setShowForm(true)
  }

  function openEditForm(challenge) {
    setEditingId(challenge.id)
    setForm({
      name: challenge.name || '',
      description: challenge.description || '',
      targetAmount: (
        Number(challenge.targetAmountCentavos || 0) / 100
      ).toString(),
      deadline: challenge.deadline || '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function closeProgressForm() {
    if (saving) return
    setShowProgressForm(false)
    setSelectedChallenge(null)
    setProgressAmount('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const amount = Number(form.targetAmount)

    if (!form.name.trim()) {
      setError('Please enter a challenge name.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid target amount.')
      return
    }

    const challengeData = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetAmountCentavos: Math.round(amount * 100),
      deadline: form.deadline,
    }

    try {
      setSaving(true)

      if (editingId) {
        await updateChallenge(
          currentUser.uid,
          editingId,
          challengeData
        )
      } else {
        await addChallenge(currentUser.uid, challengeData)
      }

      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setError('Unable to save challenge.')
    } finally {
      setSaving(false)
    }
  }

  function openProgressForm(challenge) {
    setSelectedChallenge(challenge)
    setProgressAmount('')
    setError('')
    setShowProgressForm(true)
  }

  async function handleProgressSubmit(event) {
    event.preventDefault()
    setError('')

    const amount = Number(progressAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    try {
      setSaving(true)

      await addChallengeProgress(
        currentUser.uid,
        selectedChallenge.id,
        Math.round(amount * 100)
      )

      setShowProgressForm(false)
      setSelectedChallenge(null)
      setProgressAmount('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to update challenge progress.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(challengeId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this challenge?'
    )

    if (!confirmed) return

    try {
      setError('')
      await deleteChallenge(currentUser.uid, challengeId)
    } catch (err) {
      console.error(err)
      setError('Unable to delete challenge.')
    }
  }

  function renderChallenge(challenge) {
    const saved = Number(challenge.savedAmountCentavos) || 0
    const target = Number(challenge.targetAmountCentavos) || 0
    const percentage = target > 0 ? (saved / target) * 100 : 0
    const completed = challenge.status === 'completed'

    return (
      <article
        key={challenge.id}
        className={`bm-challenge-card ${completed ? 'is-completed' : ''}`}
      >
        <div className="bm-challenge-card-top">
          <div className="bm-challenge-heading">
            <div className={`bm-challenge-icon ${completed ? 'completed' : ''}`}>
              {completed ? <Trophy size={22} /> : <Target size={22} />}
            </div>

            <div className="bm-challenge-title-wrap">
              <h3>{challenge.name}</h3>
              <span className="bm-challenge-deadline">
                <CalendarDays size={13} />
                {challenge.deadline
                  ? `Due ${formatDate(challenge.deadline)}`
                  : 'No deadline'}
              </span>
            </div>
          </div>

          <div className="bm-challenge-actions">
            {!completed && (
              <button
                type="button"
                onClick={() => openEditForm(challenge)}
                title="Edit challenge"
                aria-label="Edit challenge"
                className="bm-icon-button"
              >
                <Pencil size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDelete(challenge.id)}
              title="Delete challenge"
              aria-label="Delete challenge"
              className="bm-icon-button danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {challenge.description && (
          <p className="bm-challenge-description">
            {challenge.description}
          </p>
        )}

        <div className="bm-challenge-amounts">
          <div>
            <span className="bm-challenge-label">Current Progress</span>
            <strong className="bm-challenge-saved">{formatMoney(saved)}</strong>
          </div>

          <div className="bm-challenge-target">
            <span className="bm-challenge-label">Target Amount</span>
            <strong>{formatMoney(target)}</strong>
          </div>
        </div>

        <div
          className="bm-challenge-progress-track"
          role="progressbar"
          aria-valuenow={Math.min(Math.round(percentage), 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${challenge.name} progress`}
        >
          <div
            className="bm-challenge-progress-fill"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="bm-challenge-progress-info">
          <span>{Math.round(percentage)}% completed</span>
          <strong>
            {completed
              ? 'Goal reached!'
              : `${formatMoney(Math.max(target - saved, 0))} remaining`}
          </strong>
        </div>

        {completed ? (
          <div className="bm-challenge-success">
            <CheckCircle size={18} />
            <span>Congratulations! You reached your target.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openProgressForm(challenge)}
            className="bm-challenge-add-progress"
          >
            <TrendingUp size={17} />
            Add Progress
          </button>
        )}
      </article>
    )
  }

  return (
    <div className="bm-challenges-page">
      <div className="bm-challenges-header">
        <div>
          <div className="bm-page-eyebrow">
            <span className="bm-eyebrow-line" />
            BUILD BETTER MONEY HABITS
          </div>
          <h1>Savings Challenges</h1>
          <p>Set a target, stay consistent, and celebrate every milestone.</p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="bm-primary-button"
        >
          <Plus size={18} />
          Create Challenge
        </button>
      </div>

      {error && !showForm && !showProgressForm && (
        <div className="bm-challenge-alert">
          {error}
        </div>
      )}

      <div className="bm-challenge-stats">
        <div className="bm-challenge-stat-card">
          <div className="bm-challenge-stat-icon active">
            <Target size={21} />
          </div>
          <div>
            <span>Active Challenges</span>
            <strong>{activeChallenges.length}</strong>
            <small>Goals in progress</small>
          </div>
        </div>

        <div className="bm-challenge-stat-card">
          <div className="bm-challenge-stat-icon earned">
            <Trophy size={21} />
          </div>
          <div>
            <span>Achievements Earned</span>
            <strong>{completedChallenges.length}</strong>
            <small>Goals successfully reached</small>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bm-challenge-loading">
          <div className="bm-loading-spinner" />
          <p>Loading your challenges...</p>
        </div>
      ) : (
        <>
          <section className="bm-challenge-section">
            <div className="bm-section-heading">
              <div>
                <span className="bm-section-kicker">KEEP GOING</span>
                <h2>Active Challenges</h2>
              </div>
              <span className="bm-section-count">{activeChallenges.length}</span>
            </div>

            {activeChallenges.length === 0 ? (
              <div className="bm-challenge-empty">
                <div className="bm-empty-icon">
                  <Target size={28} />
                </div>
                <h3>No active challenges yet</h3>
                <p>Create your first savings challenge and start working toward a goal.</p>
                <button type="button" onClick={openAddForm}>
                  <Plus size={16} />
                  Create a Challenge
                </button>
              </div>
            ) : (
              <div className="bm-challenge-grid">
                {activeChallenges.map(renderChallenge)}
              </div>
            )}
          </section>

          <section className="bm-challenge-section">
            <div className="bm-section-heading">
              <div>
                <span className="bm-section-kicker">YOUR MILESTONES</span>
                <h2><Medal size={21} /> Achievements</h2>
              </div>
              <span className="bm-section-count">{completedChallenges.length}</span>
            </div>

            {completedChallenges.length === 0 ? (
              <div className="bm-challenge-empty compact">
                <div className="bm-empty-icon">
                  <Award size={28} />
                </div>
                <h3>Your achievements will appear here</h3>
                <p>Complete a savings challenge to earn your first achievement.</p>
              </div>
            ) : (
              <div className="bm-challenge-grid">
                {completedChallenges.map(renderChallenge)}
              </div>
            )}
          </section>
        </>
      )}

      {showForm && (
        <div className="bm-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm()
        }}>
          <div className="bm-challenge-modal">
            <div className="bm-modal-header">
              <div>
                <span className="bm-modal-kicker">
                  {editingId ? 'UPDATE YOUR GOAL' : 'START A NEW GOAL'}
                </span>
                <h2>{editingId ? 'Edit Challenge' : 'Create Challenge'}</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="bm-modal-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bm-challenge-form">
              <div className="bm-form-field">
                <label htmlFor="challenge-name">Challenge Name</label>
                <input
                  id="challenge-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. 7-Day Savings Challenge"
                  required
                />
              </div>

              <div className="bm-form-field">
                <label htmlFor="challenge-target">Target Amount (₱)</label>
                <input
                  id="challenge-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={(event) =>
                    setForm({ ...form, targetAmount: event.target.value })
                  }
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="bm-form-field">
                <label htmlFor="challenge-deadline">Deadline <span>Optional</span></label>
                <input
                  id="challenge-deadline"
                  type="date"
                  min={getToday()}
                  value={form.deadline}
                  onChange={(event) =>
                    setForm({ ...form, deadline: event.target.value })
                  }
                />
              </div>

              <div className="bm-form-field">
                <label htmlFor="challenge-description">Description <span>Optional</span></label>
                <textarea
                  id="challenge-description"
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What are you saving for?"
                />
              </div>

              {error && <p className="bm-form-error">{error}</p>}

              <button type="submit" disabled={saving} className="bm-modal-submit">
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Challenge'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showProgressForm && selectedChallenge && (
        <div className="bm-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeProgressForm()
        }}>
          <div className="bm-challenge-modal progress-modal">
            <div className="bm-modal-header">
              <div>
                <span className="bm-modal-kicker">SAVINGS MILESTONE</span>
                <h2>Update Progress</h2>
                <p>{selectedChallenge.name}</p>
              </div>
              <button
                type="button"
                onClick={closeProgressForm}
                disabled={saving}
                className="bm-modal-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className="bm-challenge-form">
              <div className="bm-form-field">
                <label htmlFor="progress-amount">Amount to Add (₱)</label>
                <input
                  id="progress-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={progressAmount}
                  onChange={(event) => setProgressAmount(event.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              {error && <p className="bm-form-error">{error}</p>}

              <button type="submit" disabled={saving} className="bm-modal-submit">
                {saving ? 'Updating...' : 'Update Progress'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
