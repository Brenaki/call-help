import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { User } from '../api/types'

export default function Users() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('comum')
  const [sector, setSector] = useState('')
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const r = await api.get<User[]>('/usuarios')
      setUsuarios(r.data)
    } catch {
      setErro('Erro ao carregar usuários')
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await api.post('/usuarios', {
        name: nome,
        email,
        password: senha,
        role,
        sector: sector || null,
      })
      setNome('')
      setEmail('')
      setSenha('')
      setRole('comum')
      setSector('')
      await carregar()
    } catch {
      setErro('Erro ao cadastrar usuário')
    }
  }

  async function remover(id: number) {
    try {
      await api.delete(`/usuarios/${id}`)
      await carregar()
    } catch {
      setErro('Erro ao remover usuário')
    }
  }

  return (
    <div>
      <PageHeader title="Usuários" description="Gerencie o acesso de colaboradores, professores e administradores à central de suporte." />
      {erro && <p className="erro" role="alert">{erro}</p>}

      <div className="management-grid">
      <form onSubmit={criar} className="formulario">
        <h2>Novo Usuário</h2>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        <label>
          Perfil de acesso
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="comum">Solicitante</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <label>
          Setor
          <input placeholder="Ex.: pedagógico, secretaria ou financeiro" value={sector} onChange={(e) => setSector(e.target.value)} />
        </label>
        <button type="submit" className="btn-primario">Cadastrar</button>
      </form>

      {usuarios.length === 0 ? (
        <p className="empty-state panel">Nenhum usuário cadastrado.</p>
      ) : (
        <div className="table-scroll panel" role="region" aria-label="Registros cadastrados" tabIndex={0}><table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Setor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="role-badge">{u.role === 'admin' ? 'Administrador' : 'Solicitante'}</span></td>
                <td>{u.sector ?? '-'}</td>
                <td>
                  <button className="btn-remover" onClick={() => remover(u.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      </div>
    </div>
  )
}