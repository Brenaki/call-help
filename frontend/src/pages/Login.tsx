import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await login(email, senha)
      navigate('/')
    } catch {
      setErro('Email ou senha invalidos')
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Call Help</h1>
        <h2>Sistema de Chamados de TI</h2>

        {erro && <p className="erro">{erro}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.edu"
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="******"
            required
          />
        </label>

        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}