
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')

    try {
      setLoading(true)
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      console.error('Google login error:', err)
      setError(err.message || 'Unable to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bm-auth-page">
      <div className="bm-auth-card">

        <div className="bm-auth-branding">
          <img
            src="/budgetmate-logo.png"
            alt="BulSU BudgetMate Logo"
            className="bm-auth-logo"
          />

          <h1>Welcome Back</h1>
          <p>Sign in to your BulSU BudgetMate account.</p>
        </div>

        {error && (
          <div className="bm-auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bm-auth-form">

          <div className="bm-auth-field">
            <label htmlFor="login-email">Email Address</label>

            <div className="bm-auth-input-wrapper">
              <span className="bm-auth-input-icon">
                <Mail size={19} />
              </span>

              <input
                id="login-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="bm-auth-field">
            <label htmlFor="login-password">Password</label>

            <div className="bm-auth-input-wrapper">
              <span className="bm-auth-input-icon">
                <Lock size={19} />
              </span>

              <input
                id="login-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bm-auth-submit"
          >
            <LogIn size={18} />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>

        <div className="bm-auth-divider">
          <span />
          <p>OR</p>
          <span />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="bm-auth-google"
        >
          <svg
            viewBox="0 0 48 48"
            width="19"
            height="19"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.34 5.7c4.28-3.95 7.42-9.76 7.42-17.35z"
            />
            <path
              fill="#FBBC05"
              d="M10.54 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.56 2.56 10.78l7.98-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.47 0 11.9-2.13 15.86-5.8l-7.34-5.7c-2.03 1.36-4.62 2.16-8.52 2.16-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>

          Continue with Google
        </button>

        <p className="bm-auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create Account</Link>
        </p>

      </div>

      <p className="bm-auth-copyright">
        BulSU BudgetMate · Student Finance Tracker
      </p>
    </div>
  )
}

export default Login
