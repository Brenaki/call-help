import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Equipment } from '../api/types'

export default function Equipments() {
  const [equipamentos, setEquipamentos] = useState<Equipment[]>([])
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')
  const [local, setLocal] = useState('')
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const r = await api.get<Equipment[]>('/equipamentos')
      setEquipamentos(r.data)
    } catch {
      setErro('Erro ao carregar equipamentos')
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await api.post('/equipamentos', {
        name: nome,
        type: tipo || null,
        localization: local || null,
      })
      setNome('')
      setTipo('')
      setLocal('')
      await carregar()
    } catch {
      setErro('Erro ao cadastrar equipamento')
    }
  }

  async function remover(id: number) {
    try {
      await api.delete(`/equipamentos/${id}`)
      await carregar()
    } catch {
      setErro('Erro ao remover equipamento')
    }
  }

  return (
    <div>
      <h1>Equipamentos</h1>
      {erro && <p className="erro">{erro}</p>}

      <form onSubmit={criar} className="formulario">
        <h2>Novo Equipamento</h2>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Tipo
          <input value={tipo} onChange={(e) => setTipo(e.target.value)} />
        </label>
        <label>
          Local
          <input value={local} onChange={(e) => setLocal(e.target.value)} />
        </label>
        <button type="submit" className="btn-primario">Cadastrar</button>
      </form>

      {equipamentos.length === 0 ? (
        <p>Nenhum equipamento cadastrado.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Local</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {equipamentos.map((eq) => (
              <tr key={eq.id}>
                <td>{eq.id}</td>
                <td>{eq.name}</td>
                <td>{eq.type ?? '-'}</td>
                <td>{eq.localization ?? '-'}</td>
                <td>
                  <button className="btn-remover" onClick={() => remover(eq.id)}>
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