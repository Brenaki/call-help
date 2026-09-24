import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, mustChangePassword } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace />
  if (mustChangePassword && location.pathname !== '/alterar-senha') {
    return <Navigate to="/alterar-senha" replace />
  }
  return <>{children}</>
}
