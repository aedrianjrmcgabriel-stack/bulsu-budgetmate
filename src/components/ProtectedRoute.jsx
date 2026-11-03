
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-maroon font-medium">
          Loading BudgetBuddy...
        </p>
      </div>
    )
  }

  return currentUser
    ? children
    : <Navigate to="/login" replace />
}

export default ProtectedRoute
