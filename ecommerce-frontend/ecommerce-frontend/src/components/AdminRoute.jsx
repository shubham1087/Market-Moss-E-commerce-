import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

function AdminRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default AdminRoute
