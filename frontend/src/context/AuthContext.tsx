import { createContext, type ReactNode, useContext, useState } from 'react'
import { api } from '../api/client'
import type { LoginResponse } from '../api/types'

interface AuthContextType {
  token: string | null
  role: string | null
  userId: number | null
  name: string | null
  mustChangePassword: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token'),
  )
  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem('role'),
  )
  const [userId, setUserId] = useState<number | null>(() => {
    const value = localStorage.getItem('user_id')
    return value ? Number(value) : null
  })
  const [name, setName] = useState<string | null>(() => localStorage.getItem('user_name'))
  const [mustChangePassword, setMustChangePassword] = useState(
    () => localStorage.getItem('must_change_password') === 'true',
  )

  async function login(email: string, password: string) {
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
    })
    const data = response.data
    setToken(data.access_token)
    setRole(data.role)
    setUserId(data.user_id)
    setName(data.name)
    setMustChangePassword(data.must_change_password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('user_id', String(data.user_id))
    localStorage.setItem('user_name', data.name)
    localStorage.setItem('must_change_password', String(data.must_change_password))
    return data
  }

  function logout() {
    setToken(null)
    setRole(null)
    setUserId(null)
    setName(null)
    setMustChangePassword(false)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
    localStorage.removeItem('must_change_password')
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, name, mustChangePassword, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
