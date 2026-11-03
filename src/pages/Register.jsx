import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Register.css'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    try {
      setLoading(true)
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bm-auth-page">
      <div className="bm-auth-card bm-register-card">

        {/* Logo and Branding */}
        <div className="bm-auth-brand">
          <img
            src="/budgetmate-logo.png"
            alt="BulSU BudgetMate Logo"
            className="bm-auth-logo"
          />

          <h1>Create Account</h1>

          <p>
            Start managing your student finances with BulSU BudgetMate.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bm-auth-error">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bm-auth-form">

          <div className="bm-auth-field">
            <label htmlFor="register-name">Full Name</label>

            <div className="bm-auth-input-wrapper">
              <User size={19} />
              <input
                id="register-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="bm-auth-field">
            <label htmlFor="register-email">Email Address</label>

            <div className="bm-auth-input-wrapper">
              <Mail size={19} />
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="bm-auth-field">
            <label htmlFor="register-password">Password</label>

            <div className="bm-auth-input-wrapper">
              <Lock size={19} />
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="bm-auth-field">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>

            <div className="bm-auth-input-wrapper">
              <Lock size={19} />
              <input
                id="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bm-auth-submit"
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <UserPlus size={19} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="bm-auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </p>

      </div>
    </div>
  )
}

export default Register