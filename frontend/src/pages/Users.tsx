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
      setErro('Erro ao carregar usuarios')
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
      setErro('Erro ao cadastrar usuario')
    }
  }

  async function remover(id: number) {
    try {
      await api.delete(`/usuarios/${id}`)
      await carregar()
    } catch {
      setErro('Erro ao remover usuario')
    }
  }

  return (
    <div>
      <h1>Usuarios</h1>
      {erro && <p className="erro">{erro}</p>}

      <form onSubmit={criar} className="formulario">
        <h2>Novo Usuario</h2>
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
          Papel
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="comum">Comum</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Setor
          <input value={sector} onChange={(e) => setSector(e.target.value)} />
        </label>
        <button type="submit" className="btn-primario">Cadastrar</button>
      </form>

      {usuarios.length === 0 ? (
        <p>Nenhum usuario cadastrado.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Papel</th>
              <th>Setor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.sector ?? '-'}</td>
                <td>
                  <button className="btn-remover" onClick={() => remover(u.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}