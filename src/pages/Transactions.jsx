
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Wallet,
  CalendarDays,
  ReceiptText,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import {
  subscribeToTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from '../services/transactionService'

import './Transactions.css'

const categories = {
  income: [
    'Allowance',
    'Salary',
    'Gift',
    'Business',
    'Other Income',
  ],
  expense: [
    'Food',
    'Transportation',
    'Education',
    'Bills',
    'Shopping',
    'Entertainment',
    'Health',
    'Other Expense',
  ],
}

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatMoney(centavos) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format((centavos || 0) / 100)
}

function formatDate(dateString) {
  if (!dateString) return '—'

  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Transactions() {
  const { currentUser } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getToday())

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  // REAL-TIME TRANSACTION LISTENER
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToTransactions(
      currentUser.uid,
      (data) => {
        setTransactions(data)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error(err)
        setError('Unable to load transactions. Please try again.')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [currentUser])

  // RESET FORM
  function resetForm() {
    setType('expense')
    setAmount('')
    setCategory('Food')
    setNote('')
    setDate(getToday())
    setEditingId(null)
    setFormError('')
    setShowForm(false)
  }

  // OPEN ADD FORM
  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  // CHANGE TRANSACTION TYPE
  function handleTypeChange(newType) {
    setType(newType)
    setCategory(categories[newType][0])
  }

  // EDIT TRANSACTION
  function handleEdit(transaction) {
    setEditingId(transaction.id)
    setType(transaction.type)
    setAmount((transaction.amountCentavos / 100).toFixed(2))
    setCategory(transaction.category)
    setNote(transaction.note || '')
    setDate(transaction.date || getToday())
    setFormError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // SAVE TRANSACTION
  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.')
      return
    }

    if (!category || !date) {
      setFormError('Please complete all required fields.')
      return
    }

    const amountCentavos = Math.round(numericAmount * 100)

    if (!Number.isSafeInteger(amountCentavos) || amountCentavos <= 0) {
      setFormError('Please enter a valid amount.')
      return
    }

    const transactionData = {
      type,
      amountCentavos,
      category,
      note: note.trim(),
      date,
    }

    try {
      setSaving(true)

      if (editingId) {
        await updateTransaction(
          currentUser.uid,
          editingId,
          transactionData
        )
      } else {
        await addTransaction(
          currentUser.uid,
          transactionData
        )
      }

      resetForm()
    } catch (err) {
      console.error(err)
      setFormError('Could not save the transaction. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // DELETE TRANSACTION
  async function handleDelete(transactionId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    )

    if (!confirmed) return

    try {
      await removeTransaction(currentUser.uid, transactionId)
    } catch (err) {
      console.error(err)
      setError('Could not delete the transaction. Please try again.')
    }
  }

  // FILTER AND SORT TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const matchesType =
          filter === 'all' || transaction.type === filter

        const searchText = search.toLowerCase().trim()

        const matchesSearch =
          (transaction.category || '')
            .toLowerCase()
            .includes(searchText) ||
          (transaction.note || '')
            .toLowerCase()
            .includes(searchText)

        return matchesType && matchesSearch
      })
      .sort((a, b) => {
        const comparison = (a.date || '').localeCompare(b.date || '')

        return sortOrder === 'newest' ? -comparison : comparison
      })
  }, [transactions, filter, search, sortOrder])

  // TOTAL INCOME
  const totalIncome = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'income')
      .reduce(
        (total, item) => total + (item.amountCentavos || 0),
        0
      )
  }, [transactions])

  // TOTAL EXPENSES
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce(
        (total, item) => total + (item.amountCentavos || 0),
        0
      )
  }, [transactions])

  return (
    <div className="bm-transactions-page">

      {/* PAGE HEADING */}
      <div className="bm-page-heading">
        <div>
          <div className="bm-page-eyebrow">
            <ReceiptText size={15} />
            FINANCIAL RECORDS
          </div>

          <h1>Transactions</h1>

          <p>
            Track and manage your income and expenses in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="bm-primary-button"
        >
          <Plus size={19} />
          Add Transaction
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <section className="bm-transaction-summary">

        <div className="bm-transaction-summary-card income-summary">
          <div className="bm-summary-icon">
            <TrendingUp size={22} />
          </div>

          <div className="bm-summary-details">
            <span>Total Income</span>
            <h2>{formatMoney(totalIncome)}</h2>
            <small>All recorded income</small>
          </div>
        </div>

        <div className="bm-transaction-summary-card expense-summary">
          <div className="bm-summary-icon">
            <TrendingDown size={22} />
          </div>

          <div className="bm-summary-details">
            <span>Total Expenses</span>
            <h2>{formatMoney(totalExpenses)}</h2>
            <small>All recorded expenses</small>
          </div>
        </div>

        <div className="bm-transaction-summary-card balance-summary">
          <div className="bm-summary-icon">
            <Wallet size={22} />
          </div>

          <div className="bm-summary-details">
            <span>Net Transactions</span>
            <h2>{formatMoney(totalIncome - totalExpenses)}</h2>
            <small>Income minus expenses</small>
          </div>
        </div>

      </section>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <section className="bm-transaction-form-card">

          <div className="bm-form-heading">
            <div>
              <span className="bm-form-eyebrow">
                TRANSACTION DETAILS
              </span>

              <h2>
                {editingId ? 'Edit Transaction' : 'Add New Transaction'}
              </h2>

              <p>
                Enter the details of your financial activity.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="bm-icon-button"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          {formError && (
            <div className="bm-transaction-error">
              {formError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bm-transaction-form"
          >

            {/* TRANSACTION TYPE */}
            <div className="bm-form-field bm-type-field">
              <label>Transaction Type</label>

              <div className="bm-type-options">
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`bm-type-option income-option ${
                    type === 'income' ? 'selected' : ''
                  }`}
                >
                  <TrendingUp size={19} />
                  <span>Income</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`bm-type-option expense-option ${
                    type === 'expense' ? 'selected' : ''
                  }`}
                >
                  <TrendingDown size={19} />
                  <span>Expense</span>
                </button>
              </div>
            </div>

            <div className="bm-form-grid">

              {/* AMOUNT */}
              <div className="bm-form-field">
                <label htmlFor="transaction-amount">
                  Amount (₱)
                </label>

                <div className="bm-amount-input">
                  <span className="bm-amount-currency">₱</span>

                  <input
                    id="transaction-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="bm-form-field">
                <label htmlFor="transaction-category">
                  Category
                </label>

                <select
                  id="transaction-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories[type].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE */}
              <div className="bm-form-field">
                <label htmlFor="transaction-date">
                  Date
                </label>

                <div className="bm-input-with-icon">

                  <input
                    id="transaction-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* NOTE */}
              <div className="bm-form-field">
                <label htmlFor="transaction-note">
                  Note <span>(Optional)</span>
                </label>

                <input
                  id="transaction-note"
                  type="text"
                  maxLength={100}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Weekly allowance"
                />
              </div>

            </div>

            {/* FORM ACTIONS */}
            <div className="bm-form-actions">
              <button
                type="button"
                onClick={resetForm}
                className="bm-secondary-button"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bm-primary-button"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Transaction'
                    : 'Save Transaction'}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* TRANSACTION HISTORY */}
      <section className="bm-transaction-history">

        <div className="bm-history-heading">
          <div>
            <h2>Transaction History</h2>
            <p>
              View and manage your recorded transactions.
            </p>
          </div>

          <span className="bm-transaction-count">
            {filteredTransactions.length} records
          </span>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bm-transaction-toolbar">

          <div className="bm-search-box">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="bm-history-filters">

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter transaction type"
            >
              <option value="all">All Transactions</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            <button
              type="button"
              className="bm-sort-button"
              onClick={() =>
                setSortOrder((current) =>
                  current === 'newest' ? 'oldest' : 'newest'
                )
              }
            >
              {sortOrder === 'newest' ? (
                <ArrowDown size={16} />
              ) : (
                <ArrowUp size={16} />
              )}

              {sortOrder === 'newest'
                ? 'Newest First'
                : 'Oldest First'}
            </button>

          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bm-transaction-error bm-history-error">
            {error}
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="bm-transaction-state">
            <div className="bm-loading-spinner" />
            <p>Loading transactions...</p>
          </div>

        ) : filteredTransactions.length === 0 ? (

          /* EMPTY STATE */
          <div className="bm-transaction-state">
            <div className="bm-empty-icon">
              <ArrowUpDown size={27} />
            </div>

            <h3>
              {search || filter !== 'all'
                ? 'No matching transactions'
                : 'No transactions yet'}
            </h3>

            <p>
              {search || filter !== 'all'
                ? 'Try changing your search or filter.'
                : 'Start tracking your money by adding your first transaction.'}
            </p>

            {!search && filter === 'all' && (
              <button
                type="button"
                onClick={openAddForm}
                className="bm-primary-button"
              >
                <Plus size={17} />
                Add Transaction
              </button>
            )}
          </div>

        ) : (

          /* TRANSACTION TABLE */
          <div className="bm-transaction-table-wrapper">
            <table className="bm-transaction-table">

              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="amount-column">Amount</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>

                    {/* DESCRIPTION */}
                    <td>
                      <div className="bm-transaction-description">
                        <div
                          className={`bm-transaction-type-icon ${
                            transaction.type === 'income'
                              ? 'income'
                              : 'expense'
                          }`}
                        >
                          {transaction.type === 'income' ? (
                            <TrendingUp size={18} />
                          ) : (
                            <TrendingDown size={18} />
                          )}
                        </div>

                        <div>
                          <strong>
                            {transaction.note || transaction.category}
                          </strong>

                          <span>{transaction.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td>
                      <span className="bm-category-label">
                        {transaction.category}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="bm-date-cell">
                      {formatDate(transaction.date)}
                    </td>

                    {/* TYPE */}
                    <td>
                      <span
                        className={`bm-transaction-badge ${
                          transaction.type === 'income'
                            ? 'income'
                            : 'expense'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>

                    {/* AMOUNT */}
                    <td
                      className={`bm-transaction-amount ${
                        transaction.type === 'income'
                          ? 'income'
                          : 'expense'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatMoney(transaction.amountCentavos)}
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="bm-transaction-actions">

                        <button
                          type="button"
                          onClick={() => handleEdit(transaction)}
                          className="bm-table-action edit-action"
                          aria-label="Edit transaction"
                          title="Edit transaction"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(transaction.id)}
                          className="bm-table-action delete-action"
                          aria-label="Delete transaction"
                          title="Delete transaction"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </section>
    </div>
  )
}

export default Transactions
