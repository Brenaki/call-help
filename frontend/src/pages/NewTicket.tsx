import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Equipment } from '../api/types'

export default function NewTicket() {
  const [user_name, setUserName] = useState('')
  const [equipment_id, setEquipmentId] = useState('')
  const [equipment_name, setEquipmentName] = useState('')
  const [localization, setLocalization] = useState('')
  const [sector, setSector] = useState('')
  const [problem_type, setProblemType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('media')
  const [equipamentos, setEquipamentos] = useState<Equipment[]>([])
  const [erro, setErro] = useState('')
  const { token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      api
        .get<Equipment[]>('/equipamentos')
        .then((r) => setEquipamentos(r.data))
        .catch(() => {})
    }
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const hoje = new Date().toLocaleDateString('pt-BR')
    try {
      await api.post('/chamados', {
        user_name,
        equipment_id: equipment_id ? Number(equipment_id) : null,
        equipment_name: equipment_name || null,
        localization: localization || null,
        sector: sector || null,
        problem_type: problem_type || null,
        description,
        priority,
        date: hoje,
      })
      navigate('/chamados')
    } catch {
      setErro('Erro ao abrir chamado')
    }
  }

  function selecionarEquipamento(id: string) {
    setEquipmentId(id)
    const eq = equipamentos.find((e) => e.id === Number(id))
    setEquipmentName(eq?.name ?? '')
    setLocalization(eq?.localization ?? localization)
  }

  return (
    <div>
      <h1>Abrir Chamado</h1>
      {erro && <p className="erro">{erro}</p>}
      <form onSubmit={handleSubmit} className="formulario">
        <label>
          Nome
          <input
            value={user_name}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </label>

        <label>
          Equipamento
          <select value={equipment_id} onChange={(e) => selecionarEquipamento(e.target.value)}>
            <option value="">Selecione...</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Local
          <input
            value={localization}
            onChange={(e) => setLocalization(e.target.value)}
          />
        </label>

        <label>
          Setor
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </label>

        <label>
          Tipo do Problema
          <select value={problem_type} onChange={(e) => setProblemType(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="Hardware">Hardware</option>
            <option value="Rede">Rede</option>
            <option value="Software">Software</option>
            <option value="Outro">Outro</option>
          </select>
        </label>

        <label>
          Descricao
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Prioridade
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="baixa">Baixa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </label>

        <button type="submit" className="btn-primario">Abrir Chamado</button>
      </form>
    </div>
  )
}