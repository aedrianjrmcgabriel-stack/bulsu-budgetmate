
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addSavingsGoal,
  updateSavingsGoal,
  removeSavingsGoal,
  subscribeToSavingsGoals,
  subscribeToSavingsHistory,
  addSavingsContribution,
  withdrawSavings,
} from '../services/savingsService'

import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from 'lucide-react'

import './Savings.css'

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

export default function Savings() {
  const { currentUser } = useAuth()

  const [goals, setGoals] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showMoneyForm, setShowMoneyForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [moneyAction, setMoneyAction] = useState('contribution')

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
  })

  const [moneyForm, setMoneyForm] = useState({
    amount: '',
    note: '',
  })

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribeGoals = subscribeToSavingsGoals(
      currentUser.uid,
      (data) => {
        setGoals(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Unable to load savings goals.')
        setLoading(false)
      }
    )

    const unsubscribeHistory = subscribeToSavingsHistory(
      currentUser.uid,
      setHistory,
      (err) => {
        console.error(err)
        setError('Unable to load savings history.')
      }
    )

    return () => {
      unsubscribeGoals()
      unsubscribeHistory()
    }
  }, [currentUser?.uid])

  const totalSaved = useMemo(
    () =>
      goals.reduce(
        (total, goal) =>
          total + (Number(goal.savedAmountCentavos) || 0),
        0
      ),
    [goals]
  )

  const totalTarget = useMemo(
    () =>
      goals.reduce(
        (total, goal) =>
          total + (Number(goal.targetAmountCentavos) || 0),
        0
      ),
    [goals]
  )

  function openAddGoal() {
    setEditingId(null)
    setGoalForm({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
    })
    setError('')
    setShowGoalForm(true)
  }

  function openEditGoal(goal) {
    setEditingId(goal.id)
    setGoalForm({
      name: goal.name || '',
      targetAmount: (
        Number(goal.targetAmountCentavos || 0) / 100
      ).toString(),
      targetDate: goal.targetDate || '',
      description: goal.description || '',
    })
    setError('')
    setShowGoalForm(true)
  }

  async function handleGoalSubmit(event) {
    event.preventDefault()
    setError('')

    const amount = Number(goalForm.targetAmount)

    if (!goalForm.name.trim()) {
      setError('Please enter a goal name.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid target amount.')
      return
    }

    const goalData = {
      name: goalForm.name.trim(),
      targetAmountCentavos: Math.round(amount * 100),
      targetDate: goalForm.targetDate,
      description: goalForm.description.trim(),
    }

    try {
      setSaving(true)

      if (editingId) {
        await updateSavingsGoal(currentUser.uid, editingId, goalData)
      } else {
        await addSavingsGoal(currentUser.uid, goalData)
      }

      setShowGoalForm(false)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setError('Unable to save your savings goal.')
    } finally {
      setSaving(false)
    }
  }

  function openMoneyForm(goal, action) {
    setSelectedGoal(goal)
    setMoneyAction(action)
    setMoneyForm({
      amount: '',
      note: '',
    })
    setError('')
    setShowMoneyForm(true)
  }

  async function handleMoneySubmit(event) {
    event.preventDefault()
    setError('')

    const amount = Number(moneyForm.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    const amountCentavos = Math.round(amount * 100)

    try {
      setSaving(true)

      if (moneyAction === 'contribution') {
        await addSavingsContribution(
          currentUser.uid,
          selectedGoal.id,
          amountCentavos,
          moneyForm.note.trim()
        )
      } else {
        await withdrawSavings(
          currentUser.uid,
          selectedGoal.id,
          amountCentavos,
          moneyForm.note.trim()
        )
      }

      setShowMoneyForm(false)
      setSelectedGoal(null)
    } catch (err) {
      console.error(err)
      setError(
        err.message === 'Withdrawal amount exceeds your saved amount.'
          ? err.message
          : 'Unable to process this transaction. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteGoal(goalId) {
    const confirmed = window.confirm(
      'Delete this savings goal? Its contribution history will remain in your history.'
    )

    if (!confirmed) return

    try {
      setError('')
      await removeSavingsGoal(currentUser.uid, goalId)
    } catch (err) {
      console.error(err)
      setError('Unable to delete this savings goal.')
    }
  }

  function closeGoalForm() {
    if (saving) return
    setShowGoalForm(false)
    setEditingId(null)
    setError('')
  }

  function closeMoneyForm() {
    if (saving) return
    setShowMoneyForm(false)
    setSelectedGoal(null)
    setError('')
  }

  return (
    <div className="savings-page">
      <div className="savings-page-heading">
        <div>
          <h1>Savings</h1>
          <p>Set goals and build your savings one step at a time.</p>
        </div>

        <button className="savings-primary-btn" onClick={openAddGoal}>
          <Plus size={18} />
          Create Savings Goal
        </button>
      </div>

      {error && !showGoalForm && !showMoneyForm && (
        <div className="savings-alert">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="savings-summary-grid">
        <div className="savings-summary-card">
          <div className="savings-summary-top">
            <span>Total Savings</span>
            <div className="savings-summary-icon">
              <Wallet size={22} />
            </div>
          </div>
          <h2>{formatMoney(totalSaved)}</h2>
          <p>Current amount saved across all goals</p>
        </div>

        <div className="savings-summary-card">
          <div className="savings-summary-top">
            <span>Total Savings Targets</span>
            <div className="savings-summary-icon">
              <Target size={22} />
            </div>
          </div>
          <h2>{formatMoney(totalTarget)}</h2>
          <p>Combined target amount of your goals</p>
        </div>
      </div>

      <section className="savings-section">
        <div className="savings-section-heading">
          <div>
            <h2>Your Savings Goals</h2>
            <p>Track your progress toward each financial goal.</p>
          </div>
          <span className="savings-count">{goals.length} goals</span>
        </div>

        {loading ? (
          <div className="savings-empty-state">
            <div className="savings-spinner" />
            <p>Loading savings goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="savings-empty-state">
            <div className="savings-empty-icon">
              <Target size={32} />
            </div>
            <h3>No savings goals yet</h3>
            <p>Create a goal and start saving for something important.</p>
            <button className="savings-primary-btn" onClick={openAddGoal}>
              <Plus size={17} />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="savings-goals-grid">
            {goals.map((goal) => {
              const saved = Number(goal.savedAmountCentavos) || 0
              const target = Number(goal.targetAmountCentavos) || 0
              const percentage = target > 0 ? (saved / target) * 100 : 0
              const completed = target > 0 && saved >= target

              return (
                <article className="savings-goal-card" key={goal.id}>
                  <div className="savings-goal-header">
                    <div className="savings-goal-title">
                      <div className="savings-goal-icon">
                        <Target size={22} />
                      </div>
                      <div className="savings-goal-name">
                        <h3>{goal.name}</h3>
                        <p>
                          {goal.targetDate
                            ? `Target date: ${goal.targetDate}`
                            : 'No target date'}
                        </p>
                      </div>
                    </div>

                    <div className="savings-goal-actions">
                      <button
                        onClick={() => openEditGoal(goal)}
                        title="Edit goal"
                        aria-label="Edit goal"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="savings-delete-action"
                        onClick={() => handleDeleteGoal(goal.id)}
                        title="Delete goal"
                        aria-label="Delete goal"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="savings-goal-description">
                      {goal.description}
                    </p>
                  )}

                  <div className="savings-amount-row">
                    <div>
                      <span>Saved</span>
                      <strong>{formatMoney(saved)}</strong>
                    </div>
                    <div className="savings-target-amount">
                      <span>Target</span>
                      <strong>{formatMoney(target)}</strong>
                    </div>
                  </div>

                  <div
                    className="savings-progress-track"
                    role="progressbar"
                    aria-valuenow={Math.min(Math.round(percentage), 100)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${goal.name} progress`}
                  >
                    <div
                      className="savings-progress-fill"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="savings-progress-labels">
                    <span>{Math.round(percentage)}% completed</span>
                    <strong className={completed ? 'is-completed' : ''}>
                      {completed
                        ? 'Goal reached!'
                        : `${formatMoney(Math.max(target - saved, 0))} to go`}
                    </strong>
                  </div>

                  <div className="savings-goal-buttons">
                    <button
                      className="savings-add-btn"
                      onClick={() => openMoneyForm(goal, 'contribution')}
                    >
                      <TrendingUp size={17} />
                      Add Savings
                    </button>

                    <button
                      className="savings-withdraw-btn"
                      onClick={() => openMoneyForm(goal, 'withdrawal')}
                      disabled={saved <= 0}
                    >
                      <ArrowUpCircle size={17} />
                      Withdraw
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="savings-history-card">
        <div className="savings-section-heading">
          <div>
            <h2>Savings History</h2>
            <p>Your recorded contributions and withdrawals.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="savings-history-empty">
            <p>No contributions or withdrawals recorded yet.</p>
          </div>
        ) : (
          <div className="savings-history-list">
            {history.map((item) => (
              <div className="savings-history-item" key={item.id}>
                <div className="savings-history-info">
                  <div
                    className={`savings-history-icon ${
                      item.type === 'contribution'
                        ? 'is-contribution'
                        : 'is-withdrawal'
                    }`}
                  >
                    {item.type === 'contribution' ? (
                      <ArrowDownCircle size={21} />
                    ) : (
                      <ArrowUpCircle size={21} />
                    )}
                  </div>

                  <div className="savings-history-text">
                    <strong>{item.goalName || 'Savings Goal'}</strong>
                    <span>
                      {item.type}
                      {item.note ? ` • ${item.note}` : ''}
                    </span>
                  </div>
                </div>

                <strong
                  className={`savings-history-amount ${
                    item.type === 'contribution'
                      ? 'is-positive'
                      : 'is-negative'
                  }`}
                >
                  {item.type === 'contribution' ? '+' : '-'}
                  {formatMoney(item.amountCentavos)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {showGoalForm && (
        <div className="savings-modal-overlay" onMouseDown={closeGoalForm}>
          <div
            className="savings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="savings-modal-header">
              <div>
                <h2>
                  {editingId ? 'Edit Savings Goal' : 'Create Savings Goal'}
                </h2>
                <p>Set a target and start planning your savings.</p>
              </div>
              <button
                className="savings-modal-close"
                onClick={closeGoalForm}
                aria-label="Close"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="savings-form">
              <div className="savings-form-field">
                <label htmlFor="goalName">Goal Name</label>
                <input
                  id="goalName"
                  type="text"
                  value={goalForm.name}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, name: event.target.value })
                  }
                  placeholder="e.g. New Laptop"
                  required
                />
              </div>

              <div className="savings-form-field">
                <label htmlFor="targetAmount">Target Amount (₱)</label>
                <input
                  id="targetAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={goalForm.targetAmount}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      targetAmount: event.target.value,
                    })
                  }
                  placeholder="e.g. 25000"
                  required
                />
              </div>

              <div className="savings-form-field">
                <label htmlFor="targetDate">Target Date</label>
                <input
                  id="targetDate"
                  type="date"
                  min={getToday()}
                  value={goalForm.targetDate}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      targetDate: event.target.value,
                    })
                  }
                />
              </div>

              <div className="savings-form-field">
                <label htmlFor="goalDescription">Description (Optional)</label>
                <textarea
                  id="goalDescription"
                  value={goalForm.description}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      description: event.target.value,
                    })
                  }
                  rows="3"
                  placeholder="What are you saving for?"
                />
              </div>

              {error && <p className="savings-form-error">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="savings-form-submit"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMoneyForm && selectedGoal && (
        <div className="savings-modal-overlay" onMouseDown={closeMoneyForm}>
          <div
            className="savings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="savings-modal-header">
              <div>
                <h2>
                  {moneyAction === 'contribution'
                    ? 'Add Savings'
                    : 'Withdraw Savings'}
                </h2>
                <p>{selectedGoal.name}</p>
              </div>
              <button
                className="savings-modal-close"
                onClick={closeMoneyForm}
                aria-label="Close"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-current-amount">
              <span>Current saved amount</span>
              <strong>
                {formatMoney(selectedGoal.savedAmountCentavos)}
              </strong>
            </div>

            <form onSubmit={handleMoneySubmit} className="savings-form">
              <div className="savings-form-field">
                <label htmlFor="moneyAmount">Amount (₱)</label>
                <input
                  id="moneyAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={moneyForm.amount}
                  onChange={(event) =>
                    setMoneyForm({
                      ...moneyForm,
                      amount: event.target.value,
                    })
                  }
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="savings-form-field">
                <label htmlFor="moneyNote">Note (Optional)</label>
                <input
                  id="moneyNote"
                  type="text"
                  value={moneyForm.note}
                  onChange={(event) =>
                    setMoneyForm({
                      ...moneyForm,
                      note: event.target.value,
                    })
                  }
                  placeholder="e.g. Weekly allowance"
                />
              </div>

              {error && <p className="savings-form-error">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="savings-form-submit"
              >
                {saving
                  ? 'Processing...'
                  : moneyAction === 'contribution'
                    ? 'Confirm Contribution'
                    : 'Confirm Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
