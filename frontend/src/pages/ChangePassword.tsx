import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      await api.put('/usuarios/minha-senha', { current_password: currentPassword, new_password: newPassword })
      logout()
      navigate('/login', { replace: true })
    } catch {
      setError('Não foi possível alterar a senha. Confira a senha atual.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="login-container"><section className="login-access"><div className="login-form-wrap"><span className="eyebrow">PRIMEIRO ACESSO</span><h2>Crie sua nova senha</h2><p>Por segurança, a senha padrão só pode ser usada uma vez.</p><form onSubmit={submit} className="login-form">{error && <p className="erro" role="alert">{error}</p>}<label>Senha atual<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></label><label>Nova senha<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} autoComplete="new-password" /></label><button className="btn-primario" disabled={saving}>{saving ? 'Salvando...' : 'Alterar senha'}</button></form></div></section></main>
}
