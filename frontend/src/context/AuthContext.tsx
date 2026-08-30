import { createContext, type ReactNode, useContext, useState } from 'react'
import { api } from '../api/client'
import type { LoginResponse } from '../api/types'

interface AuthContextType {
  token: string | null
  role: string | null
  login: (email: string, password: string) => Promise<void>
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

  async function login(email: string, password: string) {
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
    })
    const data = response.data
    setToken(data.access_token)
    setRole(data.role)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
  }

  function logout() {
    setToken(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}