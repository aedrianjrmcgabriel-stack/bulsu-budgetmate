
import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { useAuth } from '../context/AuthContext'
import { subscribeToTransactions } from '../services/transactionService'

import './Analytics.css'

const CHART_COLORS = [
  '#800000',
  '#A52A2A',
  '#D97777',
  '#E7A3A3',
  '#F0CACA',
  '#8B6B6B',
  '#B76E79',
  '#D9A0A0',
]

function formatMoney(amountCentavos = 0) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format((Number(amountCentavos) || 0) / 100)
}

function formatChartMoney(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    maximumFractionDigits: 2,
  })}`
}

function Analytics() {
  const { currentUser } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const unsubscribe = subscribeToTransactions(
      currentUser.uid,
      (data) => {
        setTransactions(data)
        setLoading(false)
      },
      (err) => {
        console.error('Analytics error:', err)
        setError('Unable to load your financial data.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  const incomeTransactions = transactions.filter(
    (item) => item.type === 'income'
  )

  const expenseTransactions = transactions.filter(
    (item) => item.type === 'expense'
  )

  const totalIncome = incomeTransactions.reduce(
    (sum, item) => sum + (Number(item.amountCentavos) || 0),
    0
  )

  const totalExpenses = expenseTransactions.reduce(
    (sum, item) => sum + (Number(item.amountCentavos) || 0),
    0
  )

  const netCashFlow = totalIncome - totalExpenses

  const monthlyData = useMemo(() => {
    const months = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setDate(1)
      date.setHours(0, 0, 0, 0)
      date.setMonth(date.getMonth() - i)

      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: date.toLocaleDateString('en-PH', {
          month: 'short',
          year: '2-digit',
        }),
        income: 0,
        expenses: 0,
      })
    }

    transactions.forEach((item) => {
      if (!item.date) return

      const transactionDate = new Date(`${item.date}T00:00:00`)
      if (Number.isNaN(transactionDate.getTime())) return

      const month = months.find(
        (entry) =>
          entry.year === transactionDate.getFullYear() &&
          entry.month === transactionDate.getMonth()
      )

      if (!month) return

      const value = (Number(item.amountCentavos) || 0) / 100

      if (item.type === 'income') {
        month.income += value
      } else if (item.type === 'expense') {
        month.expenses += value
      }
    })

    return months
  }, [transactions])

  const categoryData = useMemo(() => {
    const totals = {}

    expenseTransactions.forEach((item) => {
      const category = item.category || 'Uncategorized'

      totals[category] =
        (totals[category] || 0) +
        (Number(item.amountCentavos) || 0) / 100
    })

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenseTransactions])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5)
  }, [transactions])

  const currentMonthLabel = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

  const summaryCards = [
    {
      title: 'Total Income',
      amount: formatMoney(totalIncome),
      description: 'All recorded money received',
      icon: TrendingUp,
      type: 'income',
    },
    {
      title: 'Total Expenses',
      amount: formatMoney(totalExpenses),
      description: 'All recorded money spent',
      icon: TrendingDown,
      type: 'expense',
    },
    {
      title: 'Net Cash Flow',
      amount: formatMoney(netCashFlow),
      description: 'Income minus expenses',
      icon: Wallet,
      type: 'balance',
    },
  ]

  if (loading) {
    return (
      <div className="analytics-state">
        <div className="analytics-loader" />
        <p>Loading your financial analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-error">
        <Activity size={24} />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="analytics-page">

      {/* PAGE INTRO */}
      <section className="analytics-intro">
        <div>
          <div className="analytics-eyebrow">
            <SparklesIcon />
            FINANCIAL OVERVIEW
          </div>

          <h1>Analytics</h1>
          <p>
            Understand your income, spending patterns, and financial habits.
          </p>
        </div>

        <div className="analytics-date">
          <span>REPORTING PERIOD</span>
          <strong>{currentMonthLabel}</strong>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="analytics-summary">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const isPositive = card.type === 'income' ||
            (card.type === 'balance' && netCashFlow >= 0)

          return (
            <article
              key={card.title}
              className={`analytics-stat-card ${card.type}`}
            >
              <div className="analytics-stat-top">
                <div className="analytics-stat-icon">
                  <Icon size={21} />
                </div>

                <span className="analytics-stat-label">
                  {card.title}
                </span>

                <span className={`analytics-stat-indicator ${
                  isPositive ? 'positive' : 'negative'
                }`}>
                  {isPositive
                    ? <ArrowUpRight size={17} />
                    : <ArrowDownRight size={17} />
                  }
                </span>
              </div>

              <h2>{card.amount}</h2>
              <p>{card.description}</p>
            </article>
          )
        })}
      </section>

      {/* CHARTS */}
      <section className="analytics-chart-grid">

        {/* INCOME VS EXPENSES */}
        <article className="analytics-panel analytics-bar-panel">
          <div className="analytics-panel-heading">
            <div>
              <span className="analytics-panel-eyebrow">
                CASH FLOW
              </span>
              <h2>Income vs. Expenses</h2>
              <p>Monthly comparison for the last six months.</p>
            </div>

            <div className="analytics-panel-icon">
              <ChartNoAxesCombined size={21} />
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="analytics-empty-chart">
              <ChartNoAxesCombined size={35} />
              <strong>No financial data yet</strong>
              <span>
                Add income or expenses to see your monthly chart.
              </span>
            </div>
          ) : (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                  barGap={7}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--analytics-grid)"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--analytics-muted)', fontSize: 11 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--analytics-muted)', fontSize: 10 }}
                    tickFormatter={(value) => `₱${value}`}
                    width={65}
                  />

                  <Tooltip
                    formatter={(value) => formatChartMoney(value)}
                    contentStyle={{
                      background: 'var(--analytics-tooltip)',
                      border: '1px solid var(--analytics-border)',
                      borderRadius: '12px',
                      color: 'var(--analytics-text)',
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingTop: '15px',
                    }}
                  />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#16834A"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#800000"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        {/* EXPENSE CATEGORY */}
        <article className="analytics-panel analytics-pie-panel">
          <div className="analytics-panel-heading">
            <div>
              <span className="analytics-panel-eyebrow">
                SPENDING BREAKDOWN
              </span>
              <h2>Expenses by Category</h2>
              <p>See where most of your money goes.</p>
            </div>

            <div className="analytics-panel-icon">
              <Wallet size={21} />
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="analytics-empty-chart">
              <Wallet size={35} />
              <strong>No expenses to analyze</strong>
              <span>
                Your expense categories will appear here.
              </span>
            </div>
          ) : (
            <>
              <div className="analytics-chart analytics-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={58}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatChartMoney(value)}
                      contentStyle={{
                        background: 'var(--analytics-tooltip)',
                        border: '1px solid var(--analytics-border)',
                        borderRadius: '12px',
                        color: 'var(--analytics-text)',
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: '11px',
                        paddingTop: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="analytics-category-list">
                {categoryData.slice(0, 4).map((item, index) => (
                  <div className="analytics-category-item" key={item.name}>
                    <span
                      className="analytics-category-dot"
                      style={{
                        background: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="analytics-category-name">
                      {item.name}
                    </span>
                    <strong>{formatMoney(item.value * 100)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="analytics-panel analytics-activity-panel">
        <div className="analytics-panel-heading">
          <div>
            <span className="analytics-panel-eyebrow">
              TRANSACTION HISTORY
            </span>
            <h2>Recent Financial Activity</h2>
            <p>Your latest five recorded transactions.</p>
          </div>

          <div className="analytics-panel-icon">
            <Activity size={21} />
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="analytics-empty-activity">
            <Activity size={30} />
            <strong>No transactions recorded yet</strong>
            <span>Your recent financial activity will appear here.</span>
          </div>
        ) : (
          <div className="analytics-activity-list">
            {recentTransactions.map((item) => {
              const isIncome = item.type === 'income'

              return (
                <div className="analytics-activity-item" key={item.id}>
                  <div className={`analytics-activity-icon ${
                    isIncome ? 'income' : 'expense'
                  }`}>
                    {isIncome
                      ? <TrendingUp size={19} />
                      : <TrendingDown size={19} />
                    }
                  </div>

                  <div className="analytics-activity-info">
                    <strong>
                      {item.title ||
                        item.description ||
                        item.category ||
                        'Transaction'}
                    </strong>
                    <span>
                      {item.category || 'Uncategorized'} · {item.date || 'No date'}
                    </span>
                  </div>

                  <div className={`analytics-activity-amount ${
                    isIncome ? 'income' : 'expense'
                  }`}>
                    <strong>
                      {isIncome ? '+' : '-'}
                      {formatMoney(item.amountCentavos)}
                    </strong>
                    <span>{isIncome ? 'Income' : 'Expense'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="analytics-footnote">
        <Activity size={13} />
        Savings transfers are not included in income or expense totals.
      </p>
    </div>
  )
}

function SparklesIcon() {
  return <ChartNoAxesCombined size={14} />
}

export default Analytics
