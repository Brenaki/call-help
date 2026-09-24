import { useEffect, useState, type FormEvent } from 'react'
import PageHeader from '../components/PageHeader'
import { api } from '../api/client'
import type { Equipment, Room } from '../api/types'

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [name, setName] = useState('')
  const [localization, setLocalization] = useState('')
  const [equipmentIds, setEquipmentIds] = useState<number[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const [roomsResponse, equipmentsResponse] = await Promise.all([
        api.get<Room[]>('/salas'), api.get<Equipment[]>('/equipamentos'),
      ])
      setRooms(roomsResponse.data)
      setEquipments(equipmentsResponse.data)
    } catch { setError('Não foi possível carregar as salas.') }
  }
  useEffect(() => { void load() }, [])

  async function create(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api.post('/salas', { name, localization: localization || null, equipment_ids: equipmentIds })
      setName(''); setLocalization(''); setEquipmentIds([])
      await load()
    } catch { setError('Não foi possível cadastrar a sala.') }
  }

  async function remove(id: number) {
    try { await api.delete(`/salas/${id}`); await load() } catch { setError('Não foi possível remover a sala.') }
  }

  return <div><PageHeader title="Salas" description="Cadastre salas e associe os equipamentos que podem ser usados em cada uma." />{error && <p className="erro" role="alert">{error}</p>}<div className="management-grid"><form onSubmit={create} className="formulario"><h2>Nova sala</h2><label>Nome da sala<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Sala 12" required /></label><label>Local / bloco<input value={localization} onChange={(event) => setLocalization(event.target.value)} placeholder="Ex.: Bloco A" /></label><label>Equipamentos<select multiple value={equipmentIds.map(String)} onChange={(event) => setEquipmentIds(Array.from(event.target.selectedOptions, (option) => Number(option.value)))} size={Math.min(6, Math.max(3, equipments.length))}>{equipments.map((equipment) => <option key={equipment.id} value={equipment.id}>{equipment.name}</option>)}</select></label><p className="field-help">Use Ctrl/Cmd para selecionar mais de um. Um equipamento pode estar em várias salas.</p><button className="btn-primario">Cadastrar</button></form>{rooms.length === 0 ? <p className="empty-state panel">Nenhuma sala cadastrada.</p> : <div className="table-scroll panel" role="region" aria-label="Salas cadastradas" tabIndex={0}><table className="tabela"><thead><tr><th>Sala</th><th>Local</th><th>Equipamentos</th><th>Ações</th></tr></thead><tbody>{rooms.map((room) => <tr key={room.id}><td>{room.name}</td><td>{room.localization || '—'}</td><td>{room.equipment_ids.length}</td><td><button className="btn-remover" onClick={() => void remove(room.id)}>Remover</button></td></tr>)}</tbody></table></div>}</div></div>
}
