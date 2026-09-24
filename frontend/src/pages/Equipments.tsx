import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { CatalogOptions, Equipment } from '../api/types'

export default function Equipments() {
  const [equipamentos, setEquipamentos] = useState<Equipment[]>([])
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')
  const [local, setLocal] = useState('')
  const [erro, setErro] = useState('')
  const [opcoes, setOpcoes] = useState<CatalogOptions>({ localizations: [], types: [] })

  async function carregar() {
    try {
      const [r, options] = await Promise.all([api.get<Equipment[]>('/equipamentos'), api.get<CatalogOptions>('/equipamentos/opcoes')])
      setEquipamentos(r.data)
      setOpcoes(Array.isArray(options.data) ? { localizations: [], types: [] } : options.data)
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
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setErro(detail || 'Erro ao cadastrar equipamento')
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
      <PageHeader title="Equipamentos" description="Organize os computadores, impressoras e demais equipamentos de TI da sua instituição." />
      {erro && <p className="erro" role="alert">{erro}</p>}

      <div className="management-grid">
      <form onSubmit={criar} className="formulario">
        <h2>Novo Equipamento</h2>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Tipo
          <><input list="tipos-existentes" placeholder="Ex.: notebook, impressora ou projetor" value={tipo} onChange={(e) => setTipo(e.target.value)} /><datalist id="tipos-existentes">{opcoes.types?.map((value) => <option key={value} value={value} />)}</datalist></>
        </label>
        <label>
          Local
          <><input list="locais-existentes" placeholder="Ex.: laboratório 2 ou escritório Central" value={local} onChange={(e) => setLocal(e.target.value)} /><datalist id="locais-existentes">{opcoes.localizations.map((value) => <option key={value} value={value} />)}</datalist></>
        </label>
        <button type="submit" className="btn-primario">Cadastrar</button>
      </form>

      {equipamentos.length === 0 ? (
        <p className="empty-state panel">Nenhum equipamento cadastrado.</p>
      ) : (
        <div className="table-scroll panel" role="region" aria-label="Registros cadastrados" tabIndex={0}><table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Local</th>
              <th>Ações</th>
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
        </table></div>
      )}
      </div>
    </div>
  )
}
