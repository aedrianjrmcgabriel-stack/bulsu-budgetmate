
import { useEffect, useState } from 'react'
import {
  Calculator,
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  ShoppingBag,
  ArrowDownRight,
  PiggyBank,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToTransactions } from '../services/transactionService'
import { subscribeToSavingsHistory } from '../services/savingsService'

import './WhatIf.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format((Number(amount) || 0) / 100)
}

function WhatIf() {
  const { currentUser } = useAuth()

  const [expenseName, setExpenseName] = useState('')
  const [amount, setAmount] = useState('')
  const [actualIncome, setActualIncome] = useState(0)
  const [actualExpenses, setActualExpenses] = useState(0)
  const [netSavings, setNetSavings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false)
      return
    }

    let transactionsLoaded = false
    let savingsLoaded = false
    let transactionsTotalIncome = 0
    let transactionsTotalExpenses = 0
    let savingsTotal = 0

    const updateBalance = () => {
      setActualIncome(transactionsTotalIncome)
      setActualExpenses(transactionsTotalExpenses)
      setNetSavings(savingsTotal)

      if (transactionsLoaded && savingsLoaded) {
        setLoading(false)
      }
    }

    const unsubscribeTransactions = subscribeToTransactions(
      currentUser.uid,
      (transactions) => {
        transactionsTotalIncome = transactions
          .filter((item) => item.type === 'income')
          .reduce(
            (sum, item) => sum + (Number(item.amountCentavos) || 0),
            0
          )

        transactionsTotalExpenses = transactions
          .filter((item) => item.type === 'expense')
          .reduce(
            (sum, item) => sum + (Number(item.amountCentavos) || 0),
            0
          )

        transactionsLoaded = true
        updateBalance()
      },
      (error) => {
        console.error(error)
        setLoadError('Unable to load your transactions.')
        setLoading(false)
      }
    )

    const unsubscribeSavings = subscribeToSavingsHistory(
      currentUser.uid,
      (history) => {
        savingsTotal = history.reduce((sum, item) => {
          const value = Number(item.amountCentavos) || 0
          return sum + (item.type === 'withdrawal' ? -value : value)
        }, 0)

        savingsLoaded = true
        updateBalance()
      },
      (error) => {
        console.error(error)
        setLoadError('Unable to load your savings activity.')
        setLoading(false)
      }
    )

    return () => {
      unsubscribeTransactions()
      unsubscribeSavings()
    }
  }, [currentUser?.uid])

  const availableBalance = actualIncome - actualExpenses - netSavings

  const numericAmount = Number(amount)
  const hasInput =
    amount.trim() !== '' &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0

  const expenseCentavos = hasInput
    ? Math.round(numericAmount * 100)
    : 0

  const projectedBalance = availableBalance - expenseCentavos
  const warning = hasInput && projectedBalance < 0

  function resetSimulation() {
    setExpenseName('')
    setAmount('')
  }

  if (loading) {
    return (
      <div className="bm-whatif-loading">
        <div className="bm-whatif-spinner" />
        <p>Loading your financial data...</p>
      </div>
    )
  }

  return (
    <div className="bm-whatif-page">
      <div className="bm-whatif-header">
        <div className="bm-whatif-heading">
          <div className="bm-whatif-main-icon">
            <Calculator size={25} />
          </div>

          <div>
            <div className="bm-whatif-eyebrow">
              PLAN BEFORE YOU SPEND
            </div>
            <h1>What-If Simulator</h1>
            <p>
              See how a planned purchase could affect your available balance.
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="bm-whatif-error">
          <AlertTriangle size={18} />
          {loadError}
        </div>
      )}

      <div className="bm-whatif-balance-grid">
        <div className="bm-whatif-balance-card">
          <div className="bm-whatif-card-top">
            <div className="bm-whatif-card-icon balance">
              <Wallet size={21} />
            </div>
            <span className="bm-whatif-card-label">Available Balance</span>
          </div>

          <strong className="bm-whatif-balance-value">
            {formatMoney(availableBalance)}
          </strong>

          <p>Based on your recorded income, expenses, and savings activity.</p>
        </div>

        <div className={`bm-whatif-balance-card projected ${warning ? 'negative' : ''}`}>
          <div className="bm-whatif-card-top">
            <div className={`bm-whatif-card-icon ${warning ? 'warning' : 'projected'}`}>
              <TrendingDown size={21} />
            </div>
            <span className="bm-whatif-card-label">Projected Balance</span>
          </div>

          <strong className={`bm-whatif-balance-value ${warning ? 'negative-text' : 'positive-text'}`}>
            {formatMoney(projectedBalance)}
          </strong>

          <p>
            {hasInput
              ? 'Estimated balance after your planned expense.'
              : 'Your balance before the simulated purchase.'}
          </p>
        </div>
      </div>

      <div className="bm-whatif-content-grid">
        <section className="bm-whatif-panel bm-whatif-simulator">
          <div className="bm-whatif-panel-heading">
            <div className="bm-whatif-panel-icon">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2>Simulate an Expense</h2>
              <p>Enter a planned purchase to see its financial impact.</p>
            </div>
          </div>

          <div className="bm-whatif-form">
            <div className="bm-whatif-field">
              <label htmlFor="whatif-expense-name">Expense Name</label>
              <input
                id="whatif-expense-name"
                type="text"
                value={expenseName}
                onChange={(event) => setExpenseName(event.target.value)}
                placeholder="e.g. New shoes"
              />
            </div>

            <div className="bm-whatif-field">
              <label htmlFor="whatif-amount">Planned Amount (₱)</label>
              <input
                id="whatif-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
              />
            </div>

            {hasInput && (
              <div className={`bm-whatif-result ${warning ? 'warning' : 'success'}`}>
                <div className="bm-whatif-result-heading">
                  {warning ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}

                  <strong>
                    {warning
                      ? 'Insufficient Available Balance'
                      : 'This expense is within your available balance'}
                  </strong>
                </div>

                <p>
                  {warning
                    ? 'This purchase would make your projected balance negative. Consider reducing the amount or saving more first.'
                    : `After purchasing ${expenseName.trim() || 'this item'}, you would have ${formatMoney(projectedBalance)} remaining.`}
                </p>
              </div>
            )}

            <div className="bm-whatif-form-actions">
              <button
                type="button"
                onClick={resetSimulation}
                className="bm-whatif-reset-button"
              >
                <RotateCcw size={16} />
                Reset Simulation
              </button>
            </div>
          </div>
        </section>

        <section className="bm-whatif-panel bm-whatif-breakdown">
          <div className="bm-whatif-panel-heading">
            <div className="bm-whatif-panel-icon">
              <Calculator size={20} />
            </div>
            <div>
              <h2>Financial Breakdown</h2>
              <p>See how your available balance is calculated.</p>
            </div>
          </div>

          <div className="bm-whatif-breakdown-list">
            <div className="bm-whatif-breakdown-item">
              <div className="bm-whatif-breakdown-label">
                <span className="bm-breakdown-dot income" />
                <span>Total Income</span>
              </div>
              <strong>{formatMoney(actualIncome)}</strong>
            </div>

            <div className="bm-whatif-breakdown-item">
              <div className="bm-whatif-breakdown-label">
                <span className="bm-breakdown-dot expense" />
                <span>Total Expenses</span>
              </div>
              <strong>{formatMoney(actualExpenses)}</strong>
            </div>

            <div className="bm-whatif-breakdown-item">
              <div className="bm-whatif-breakdown-label">
                <span className="bm-breakdown-dot savings" />
                <span>Net Savings Contributions</span>
              </div>
              <strong>{formatMoney(netSavings)}</strong>
            </div>

            <div className="bm-whatif-breakdown-total">
              <div>
                <Wallet size={18} />
                <strong>Available Balance</strong>
              </div>
              <strong>{formatMoney(availableBalance)}</strong>
            </div>

            {hasInput && (
              <>
                <div className="bm-whatif-breakdown-item planned">
                  <div className="bm-whatif-breakdown-label">
                    <ArrowDownRight size={16} />
                    <span>Planned Expense</span>
                  </div>
                  <strong>-{formatMoney(expenseCentavos)}</strong>
                </div>

                <div className="bm-whatif-projected-total">
                  <span>Projected Balance</span>
                  <strong className={warning ? 'negative-text' : 'positive-text'}>
                    {formatMoney(projectedBalance)}
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="bm-whatif-note">
            <PiggyBank size={17} />
            <p>
              Savings contributions are treated as transfers, not expenses,
              to avoid counting them twice.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default WhatIf
