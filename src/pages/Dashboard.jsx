
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Target,
  Receipt,
  Sparkles,
  CalendarDays,
  Activity,
  Clock3,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { subscribeToTransactions } from '../services/transactionService'
import {
  subscribeToSavingsGoals,
  subscribeToSavingsHistory,
} from '../services/savingsService'

function formatMoney(centavos = 0) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format((Number(centavos) || 0) / 100)
}

function getDateValue(value) {
  if (!value) return null

  if (typeof value === 'string') {
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (value?.toDate) return value.toDate()

  if (value instanceof Date) return value

  return null
}

function formatDate(value) {
  const date = getDateValue(value)

  if (!date) return 'Date unavailable'

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [savingsHistory, setSavingsHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) return

    setLoading(true)
    setError('')

    let transactionsLoaded = false
    let goalsLoaded = false
    let historyLoaded = false

    const checkLoading = () => {
      if (transactionsLoaded && goalsLoaded && historyLoaded) {
        setLoading(false)
      }
    }

    const handleError = (err) => {
      console.error('Dashboard subscription error:', err)
      setError('Unable to load your financial information.')
      setLoading(false)
    }

    const unsubscribeTransactions = subscribeToTransactions(
      currentUser.uid,
      (data) => {
        setTransactions(data)
        transactionsLoaded = true
        checkLoading()
      },
      handleError
    )

    const unsubscribeGoals = subscribeToSavingsGoals(
      currentUser.uid,
      (data) => {
        setSavingsGoals(data)
        goalsLoaded = true
        checkLoading()
      },
      handleError
    )

    const unsubscribeHistory = subscribeToSavingsHistory(
      currentUser.uid,
      (data) => {
        setSavingsHistory(data)
        historyLoaded = true
        checkLoading()
      },
      handleError
    )

    return () => {
      unsubscribeTransactions()
      unsubscribeGoals()
      unsubscribeHistory()
    }
  }, [currentUser?.uid])

  const financialData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const isThisMonth = (value) => {
      const date = getDateValue(value)

      return date &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
    }

    const totalIncome = transactions
      .filter((item) => item.type === 'income')
      .reduce(
        (sum, item) => sum + (Number(item.amountCentavos) || 0),
        0
      )

    const totalExpenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce(
        (sum, item) => sum + (Number(item.amountCentavos) || 0),
        0
      )

    const monthlyIncome = transactions
      .filter((item) => item.type === 'income' && isThisMonth(item.date))
      .reduce(
        (sum, item) => sum + (Number(item.amountCentavos) || 0),
        0
      )

    const monthlyExpenses = transactions
      .filter((item) => item.type === 'expense' && isThisMonth(item.date))
      .reduce(
        (sum, item) => sum + (Number(item.amountCentavos) || 0),
        0
      )

    const totalSavings = savingsGoals.reduce(
      (sum, goal) => sum + (Number(goal.savedAmountCentavos) || 0),
      0
    )

    const availableBalance = totalIncome - totalExpenses - totalSavings

    const recentTransactions = [
      ...transactions.map((item) => ({
        id: item.id,
        name: item.description || item.name || item.title || 'Transaction',
        category: item.category || 'Uncategorized',
        date: item.date,
        amountCentavos: Number(item.amountCentavos) || 0,
        type: item.type,
      })),

      ...savingsHistory.map((item) => ({
        id: item.id,
        name: item.type === 'withdrawal'
          ? 'Savings Withdrawal'
          : 'Savings Contribution',
        category: 'Savings',
        date: item.date || item.createdAt,
        amountCentavos: Number(item.amountCentavos) || 0,
        type: item.type === 'withdrawal' ? 'withdrawal' : 'savings',
      })),
    ]
      .sort((a, b) => {
        const dateA = getDateValue(a.date)?.getTime() || 0
        const dateB = getDateValue(b.date)?.getTime() || 0
        return dateB - dateA
      })
      .slice(0, 5)

    return {
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      totalSavings,
      availableBalance,
      recentTransactions,
    }
  }, [transactions, savingsGoals, savingsHistory])

  const currentMonthLabel = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

  const summaryCards = [
    {
      title: 'Total Income',
      amount: formatMoney(financialData.totalIncome),
      description: 'All recorded money received',
      icon: TrendingUp,
      type: 'income',
    },
    {
      title: 'Total Expenses',
      amount: formatMoney(financialData.totalExpenses),
      description: 'All recorded money spent',
      icon: TrendingDown,
      type: 'expense',
    },
    {
      title: 'Total Savings',
      amount: formatMoney(financialData.totalSavings),
      description: 'Money allocated to savings',
      icon: PiggyBank,
      type: 'savings',
    },
  ]

  if (loading) {
    return (
      <div className="bm-dashboard-state">
        <div className="bm-loading-spinner" />
        <p>Preparing your financial dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bm-dashboard-state bm-dashboard-error">
        <Activity size={35} />
        <h2>Something went wrong</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="bm-dashboard">

      {/* PAGE HEADING */}
      <section className="bm-dashboard-heading">
        <div>
          <div className="bm-dashboard-eyebrow">
            <Sparkles size={14} />
            YOUR FINANCIAL OVERVIEW
          </div>

          <h1>Dashboard</h1>

          <p>
            Keep track of your money and stay on top of your finances.
          </p>
        </div>

        <div className="bm-date-chip">
          <CalendarDays size={17} />
          <span>{currentMonthLabel}</span>
        </div>
      </section>

      {/* AVAILABLE BALANCE HERO */}
      <section className="bm-balance-hero">
        <div className="bm-balance-decoration bm-decoration-one" />
        <div className="bm-balance-decoration bm-decoration-two" />

        <div className="bm-balance-content">
          <div className="bm-balance-label">
            <div className="bm-balance-icon">
              <Wallet size={21} />
            </div>
            <span>AVAILABLE BALANCE</span>
          </div>

          <h2>{formatMoney(financialData.availableBalance)}</h2>

          <p>
            Your current balance after recorded expenses and savings.
          </p>

          <div className="bm-balance-bottom">
            <span>
              <Activity size={14} />
              Financial snapshot
            </span>

            <span className="bm-balance-month">
              {currentMonthLabel}
            </span>
          </div>
        </div>

        <div className="bm-balance-art">
          <div className="bm-balance-art-circle">
            <Wallet size={62} strokeWidth={1.2} />
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="bm-summary-grid">

        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              className={`bm-summary-card bm-summary-${card.type}`}
              key={card.title}
            >
              <div className="bm-summary-top">
                <div className="bm-summary-icon">
                  <Icon size={21} />
                </div>

                <span className="bm-summary-indicator">
                  <span />
                  OVERALL
                </span>
              </div>

              <p className="bm-summary-title">{card.title}</p>

              <h3>{card.amount}</h3>

              <p className="bm-summary-description">
                {card.description}
              </p>
            </div>
          )
        })}
      </section>

      {/* MAIN DASHBOARD GRID */}
      <section className="bm-dashboard-grid">

        {/* FINANCIAL OVERVIEW */}
        <div className="bm-panel bm-financial-panel">
          <div className="bm-panel-heading">
            <div>
              <span className="bm-panel-eyebrow">YOUR MONEY</span>
              <h2>Financial Overview</h2>
              <p>Income and expenses for this month</p>
            </div>

            <div className="bm-panel-heading-icon">
              <Activity size={21} />
            </div>
          </div>

          <div className="bm-monthly-overview">
            <div className="bm-monthly-item">
              <div className="bm-monthly-label">
                <span className="bm-monthly-dot income-dot" />
                Income This Month
              </div>

              <div className="bm-monthly-value income-text">
                <ArrowUpRight size={20} />
                {formatMoney(financialData.monthlyIncome)}
              </div>
            </div>

            <div className="bm-monthly-divider" />

            <div className="bm-monthly-item">
              <div className="bm-monthly-label">
                <span className="bm-monthly-dot expense-dot" />
                Expenses This Month
              </div>

              <div className="bm-monthly-value expense-text">
                <ArrowDownRight size={20} />
                {formatMoney(financialData.monthlyExpenses)}
              </div>
            </div>
          </div>

          <div className="bm-financial-note">
            <div className="bm-note-icon">
              <Sparkles size={16} />
            </div>

            <p>
              Your monthly figures update automatically when you record
              a new income or expense.
            </p>
          </div>
        </div>

        {/* SAVINGS GOALS */}
        <div className="bm-panel bm-savings-panel">
          <div className="bm-panel-heading">
            <div>
              <span className="bm-panel-eyebrow">BUILD YOUR FUTURE</span>
              <h2>Savings Goals</h2>
              <p>Track your savings progress</p>
            </div>

            <div className="bm-panel-heading-icon savings-heading-icon">
              <PiggyBank size={21} />
            </div>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="bm-empty-savings">
              <div className="bm-empty-icon">
                <PiggyBank size={31} />
              </div>

              <h3>No savings goals yet</h3>

              <p>
                Start building your savings by creating your first goal.
              </p>

              <button
                type="button"
                onClick={() => navigate('/savings')}
                className="bm-create-goal-button"
              >
                <Plus size={16} />
                Create a Goal
              </button>
            </div>
          ) : (
            <>
              <div className="bm-goals-list">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const saved = Number(goal.savedAmountCentavos) || 0
                  const target = Number(goal.targetAmountCentavos) || 0

                  const percentage = target > 0
                    ? Math.min((saved / target) * 100, 100)
                    : 0

                  return (
                    <div className="bm-goal-item" key={goal.id}>
                      <div className="bm-goal-info">
                        <div>
                          <h3>
                            {goal.name || goal.title || 'Savings Goal'}
                          </h3>

                          <p>{formatMoney(saved)} saved</p>
                        </div>

                        <span>{percentage.toFixed(0)}%</span>
                      </div>

                      <div className="bm-progress-track">
                        <div
                          className="bm-progress-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="bm-goal-target">
                        Target: {formatMoney(target)}
                      </p>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => navigate('/savings')}
                className="bm-view-goals-button"
              >
                View All Savings Goals
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="bm-quick-actions">
        <div className="bm-quick-heading">
          <div>
            <span className="bm-panel-eyebrow">GET THINGS DONE</span>
            <h2>Quick Actions</h2>
          </div>
        </div>

        <div className="bm-quick-grid">
          <button
            type="button"
            className="bm-quick-card"
            onClick={() => navigate('/transactions')}
          >
            <div className="bm-quick-icon quick-income">
              <Plus size={21} />
            </div>
            <span>
              <strong>Add Transaction</strong>
              <small>Record income or expense</small>
            </span>
            <ArrowRight size={17} className="bm-quick-arrow" />
          </button>

          <button
            type="button"
            className="bm-quick-card"
            onClick={() => navigate('/budgets')}
          >
            <div className="bm-quick-icon quick-budget">
              <Target size={21} />
            </div>
            <span>
              <strong>Manage Budgets</strong>
              <small>Monitor your spending limits</small>
            </span>
            <ArrowRight size={17} className="bm-quick-arrow" />
          </button>

          <button
            type="button"
            className="bm-quick-card"
            onClick={() => navigate('/savings')}
          >
            <div className="bm-quick-icon quick-savings">
              <PiggyBank size={21} />
            </div>
            <span>
              <strong>Build Savings</strong>
              <small>Contribute to your goals</small>
            </span>
            <ArrowRight size={17} className="bm-quick-arrow" />
          </button>
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="bm-panel bm-recent-panel">
        <div className="bm-recent-heading">
          <div>
            <span className="bm-panel-eyebrow">LATEST ACTIVITY</span>
            <h2>Recent Transactions</h2>
            <p>Your latest income, expenses, and savings activities</p>
          </div>

          <button
            type="button"
            className="bm-view-all-button"
            onClick={() => navigate('/transactions')}
          >
            View All
            <ArrowRight size={16} />
          </button>
        </div>

        {financialData.recentTransactions.length === 0 ? (
          <div className="bm-empty-transactions">
            <div className="bm-empty-icon">
              <Receipt size={30} />
            </div>

            <h3>No transactions yet</h3>

            <p>
              Your financial activities will appear here once you start
              recording them.
            </p>

            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="bm-create-goal-button"
            >
              <Plus size={16} />
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <div className="bm-transaction-list">
            {financialData.recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income'
              const isWithdrawal = transaction.type === 'withdrawal'
              const isSavings = transaction.type === 'savings'

              const isPositive = isIncome || isWithdrawal

              return (
                <div
                  className="bm-transaction-row"
                  key={`${transaction.type}-${transaction.id}`}
                >
                  <div className={`bm-transaction-icon ${
                    isIncome
                      ? 'transaction-income'
                      : isSavings
                        ? 'transaction-savings'
                        : isWithdrawal
                          ? 'transaction-withdrawal'
                          : 'transaction-expense'
                  }`}>
                    {isIncome ? (
                      <TrendingUp size={19} />
                    ) : isWithdrawal ? (
                      <ArrowDownRight size={19} />
                    ) : isSavings ? (
                      <PiggyBank size={19} />
                    ) : (
                      <TrendingDown size={19} />
                    )}
                  </div>

                  <div className="bm-transaction-details">
                    <strong>{transaction.name}</strong>
                    <span>{transaction.category}</span>
                  </div>

                  <div className="bm-transaction-date">
                    <Clock3 size={13} />
                    {formatDate(transaction.date)}
                  </div>

                  <div className={`bm-transaction-amount ${
                    isPositive ? 'amount-positive' : 'amount-negative'
                  }`}>
                    {isPositive ? '+' : '-'}
                    {formatMoney(transaction.amountCentavos)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}

export default Dashboard
