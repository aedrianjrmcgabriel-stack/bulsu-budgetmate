import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addBudget,
  updateBudget,
  removeBudget,
  subscribeToBudgets,
} from '../services/budgetService'
import { subscribeToTransactions } from '../services/transactionService'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  CheckCircle,
  X,
  Target,
  CalendarDays,
  TrendingUp,
  PiggyBank,
} from 'lucide-react'

import './Budgets.css'

const categories = [
  'All Categories',
  'Food',
  'Transportation',
  'Education',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other Expense',
]

const periods = ['Daily', 'Weekly', 'Monthly']

function formatMoney(centavos) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format((Number(centavos) || 0) / 100)
}

function getPeriodRange(period) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  const end = new Date(today)

  if (period === 'Weekly') {
    const day = today.getDay()
    const daysSinceMonday = (day + 6) % 7

    start.setDate(today.getDate() - daysSinceMonday)
    end.setDate(start.getDate() + 6)
  } else if (period === 'Monthly') {
    start.setDate(1)
    end.setMonth(today.getMonth() + 1, 0)
  }

  const toDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return {
    start: toDateString(start),
    end: toDateString(end),
  }
}

function getMatchingCategory(budgetCategory, transactionCategory) {
  if (budgetCategory === 'All Categories') return true

  // Compatibility with previously saved budget categories.
  if (budgetCategory === 'School') {
    return transactionCategory === 'Education'
  }

  if (budgetCategory === 'Other') {
    return transactionCategory === 'Other Expense'
  }

  return budgetCategory === transactionCategory
}

export default function Budgets() {
  const { currentUser } = useAuth()

  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    category: 'Food',
    period: 'Monthly',
    amount: '',
  })

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const unsubscribeBudgets = subscribeToBudgets(
      currentUser.uid,
      (data) => {
        setBudgets(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Unable to load budgets. Please try again.')
        setLoading(false)
      }
    )

    const unsubscribeTransactions = subscribeToTransactions(
      currentUser.uid,
      setTransactions,
      (err) => {
        console.error(err)
        setError('Unable to load transactions. Please try again.')
      }
    )

    return () => {
      unsubscribeBudgets()
      unsubscribeTransactions()
    }
  }, [currentUser?.uid])

  const budgetCards = useMemo(() => {
    return budgets.map((budget) => {
      const range = getPeriodRange(budget.period)

      const spent = transactions
        .filter((transaction) => {
          if (transaction.type !== 'expense') return false

          const matchesCategory = getMatchingCategory(
            budget.category,
            transaction.category
          )

          const transactionDate = transaction.date || ''

          return (
            matchesCategory &&
            transactionDate >= range.start &&
            transactionDate <= range.end
          )
        })
        .reduce(
          (total, transaction) =>
            total + (Number(transaction.amountCentavos) || 0),
          0
        )

      const limit = Number(budget.amountCentavos) || 0
      const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0
      const remaining = limit - spent

      return {
        ...budget,
        spent,
        limit,
        percentage: Math.min(rawPercentage, 100),
        rawPercentage,
        remaining,
        exceeded: spent > limit,
        warning: rawPercentage >= 80 && spent <= limit,
      }
    })
  }, [budgets, transactions])

  const totalBudget = budgetCards.reduce(
    (total, budget) => total + budget.limit,
    0
  )

  const totalSpent = budgetCards.reduce(
    (total, budget) => total + budget.spent,
    0
  )

  const exceededCount = budgetCards.filter(
    (budget) => budget.exceeded
  ).length

  const warningCount = budgetCards.filter(
    (budget) => budget.warning
  ).length

  function openAddForm() {
    setEditingId(null)
    setForm({
      category: 'Food',
      period: 'Monthly',
      amount: '',
    })
    setError('')
    setShowForm(true)
  }

  function openEditForm(budget) {
    setEditingId(budget.id)
    setForm({
      category: budget.category,
      period: budget.period,
      amount: (Number(budget.amountCentavos) / 100).toString(),
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingId(null)
    setForm({
      category: 'Food',
      period: 'Monthly',
      amount: '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const amount = Number(form.amount)
    const amountCentavos = Math.round(amount * 100)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid budget amount.')
      return
    }

    if (!Number.isSafeInteger(amountCentavos) || amountCentavos <= 0) {
      setError('Please enter a valid budget amount.')
      return
    }

    const budgetData = {
      category: form.category,
      period: form.period,
      amountCentavos,
    }

    try {
      setSaving(true)

      if (editingId) {
        await updateBudget(currentUser.uid, editingId, budgetData)
      } else {
        await addBudget(currentUser.uid, budgetData)
      }

      closeForm()
    } catch (err) {
      console.error(err)
      setError('Unable to save budget. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(budgetId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this budget?'
    )

    if (!confirmed) return

    try {
      await removeBudget(currentUser.uid, budgetId)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Unable to delete budget. Please try again.')
    }
  }

  return (
    <div className="bm-budgets-page">

      {/* Page Heading */}
      <div className="bm-budget-heading">
        <div>
          <div className="bm-budget-eyebrow">
            <Target size={15} />
            SPENDING MANAGEMENT
          </div>

          <h1>Budgets</h1>

          <p>
            Set spending limits and stay in control of your money.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="bm-budget-primary-button"
        >
          <Plus size={19} />
          Add Budget
        </button>
      </div>

      {/* Error */}
      {error && !showForm && (
        <div className="bm-budget-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="bm-budget-summary">

        <div className="bm-budget-summary-card">
          <div className="bm-budget-summary-top">
            <span>Combined Budget Limits</span>
            <div className="bm-budget-summary-icon maroon-icon">
              <Wallet size={21} />
            </div>
          </div>

          <h2>{formatMoney(totalBudget)}</h2>

          <p>
            <Target size={14} />
            Sum of all your budget limits
          </p>
        </div>

        <div className="bm-budget-summary-card">
          <div className="bm-budget-summary-top">
            <span>Tracked Expenses</span>
            <div className="bm-budget-summary-icon red-icon">
              <TrendingUp size={21} />
            </div>
          </div>

          <h2>{formatMoney(totalSpent)}</h2>

          <p>
            <CalendarDays size={14} />
            Based on each budget's current period
          </p>
        </div>

        <div className="bm-budget-summary-card">
          <div className="bm-budget-summary-top">
            <span>Budget Alerts</span>
            <div className="bm-budget-summary-icon yellow-icon">
              <AlertTriangle size={21} />
            </div>
          </div>

          <h2>{exceededCount + warningCount}</h2>

          <p>
            <AlertTriangle size={14} />
            {exceededCount} exceeded · {warningCount} nearing limit
          </p>
        </div>

      </section>

      {/* Budget List Heading */}
      <section className="bm-budget-list-section">

        <div className="bm-budget-list-heading">
          <div>
            <h2>Your Budgets</h2>
            <p>Monitor your spending progress and remaining limits.</p>
          </div>

          <span className="bm-budget-count">
            {budgets.length} {budgets.length === 1 ? 'Budget' : 'Budgets'}
          </span>
        </div>

        {loading ? (
          <div className="bm-budget-state">
            <div className="bm-budget-spinner" />
            <p>Loading your budgets...</p>
          </div>
        ) : budgetCards.length === 0 ? (
          <div className="bm-budget-empty">
            <div className="bm-budget-empty-icon">
              <PiggyBank size={32} />
            </div>

            <h3>No budgets yet</h3>

            <p>
              Create your first budget to start tracking your spending.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="bm-budget-primary-button"
            >
              <Plus size={17} />
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="bm-budget-grid">
            {budgetCards.map((budget) => (
              <article
                key={budget.id}
                className={`bm-budget-card ${
                  budget.exceeded
                    ? 'budget-exceeded'
                    : budget.warning
                      ? 'budget-warning'
                      : ''
                }`}
              >
                <div className="bm-budget-card-header">
                  <div className="bm-budget-card-title">
                    <div className="bm-budget-category-icon">
                      <Wallet size={19} />
                    </div>

                    <div>
                      <h3>{budget.category}</h3>
                      <span>{budget.period} Budget</span>
                    </div>
                  </div>

                  <div className="bm-budget-card-actions">
                    <button
                      type="button"
                      onClick={() => openEditForm(budget)}
                      title="Edit budget"
                      aria-label="Edit budget"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(budget.id)}
                      title="Delete budget"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bm-budget-amounts">
                  <div>
                    <span>Amount Spent</span>
                    <strong>{formatMoney(budget.spent)}</strong>
                  </div>

                  <div className="budget-limit-amount">
                    <span>Budget Limit</span>
                    <strong>{formatMoney(budget.limit)}</strong>
                  </div>
                </div>

                <div className="bm-budget-progress-track">
                  <div
                    className={`bm-budget-progress-fill ${
                      budget.exceeded
                        ? 'progress-red'
                        : budget.warning
                          ? 'progress-yellow'
                          : 'progress-maroon'
                    }`}
                    style={{
                      width: `${budget.percentage}%`,
                    }}
                  />
                </div>

                <div className="bm-budget-progress-info">
                  <span>
                    {Math.round(budget.rawPercentage)}% used
                  </span>

                  <strong
                    className={
                      budget.exceeded
                        ? 'text-danger'
                        : budget.warning
                          ? 'text-warning'
                          : 'text-success'
                    }
                  >
                    {budget.exceeded
                      ? `${formatMoney(Math.abs(budget.remaining))} over`
                      : `${formatMoney(budget.remaining)} left`}
                  </strong>
                </div>

                <div
                  className={`bm-budget-status ${
                    budget.exceeded
                      ? 'status-danger'
                      : budget.warning
                        ? 'status-warning'
                        : 'status-success'
                  }`}
                >
                  {budget.exceeded ? (
                    <>
                      <AlertTriangle size={16} />
                      <span>You have exceeded this budget.</span>
                    </>
                  ) : budget.warning ? (
                    <>
                      <AlertTriangle size={16} />
                      <span>You have used at least 80% of this budget.</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>You are within your budget.</span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      {showForm && (
        <div
          className="bm-budget-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <section
            className="bm-budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bm-budget-modal-title"
          >
            <div className="bm-budget-modal-header">
              <div>
                <span>SPENDING PLAN</span>

                <h2 id="bm-budget-modal-title">
                  {editingId ? 'Edit Budget' : 'Create Budget'}
                </h2>

                <p>
                  Set a spending limit for a category and period.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bm-budget-modal-form"
            >
              <div className="bm-budget-form-field">
                <label htmlFor="budget-category">Category</label>

                <select
                  id="budget-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bm-budget-form-field">
                <label htmlFor="budget-period">Budget Period</label>

                <select
                  id="budget-period"
                  value={form.period}
                  onChange={(event) =>
                    setForm({ ...form, period: event.target.value })
                  }
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>

                <small>
                  Weekly budgets run from Monday to Sunday.
                </small>
              </div>

              <div className="bm-budget-form-field">
                <label htmlFor="budget-amount">Budget Amount (₱)</label>

                <div className="bm-budget-amount-input">
                  <span>₱</span>

                  <input
                    id="budget-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    placeholder="e.g. 2000"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bm-budget-error">
                  <AlertTriangle size={17} />
                  {error}
                </div>
              )}

              <div className="bm-budget-modal-actions">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="bm-budget-cancel-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bm-budget-primary-button"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Budget'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </div>
  )
}