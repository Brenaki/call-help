import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { CatalogOptions, Equipment, User } from '../api/types'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'

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
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [opcoes, setOpcoes] = useState<CatalogOptions>({ localizations: [] })
  const [solicitanteId, setSolicitanteId] = useState('')
  const [erro, setErro] = useState('')
  const [equipmentError, setEquipmentError] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const { token, role, userId, name } = useAuth()
  const isAdmin = role === 'admin'
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    if (token) {
      Promise.all([
        api.get<Equipment[]>('/equipamentos/catalogo'),
        api.get<CatalogOptions>('/chamados/opcoes'),
        isAdmin ? api.get<User[]>('/usuarios') : Promise.resolve({ data: [] as User[] }),
      ])
        .then(([equipments, options, users]) => { if (active) { setEquipamentos(equipments.data); setOpcoes(Array.isArray(options.data) ? { localizations: [] } : options.data); setUsuarios(users.data); setEquipmentError(false) } })
        .catch(() => { if (active) setEquipmentError(true) })
    }
    return () => { active = false }
  }, [token, isAdmin])

  useEffect(() => {
    if (!isAdmin && name) {
      setUserName(name)
      setSolicitanteId(userId ? String(userId) : '')
    }
  }, [isAdmin, name, userId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await api.post('/chamados', {
        user_name,
        user_id: isAdmin && solicitanteId ? Number(solicitanteId) : undefined,
        equipment_id: equipment_id ? Number(equipment_id) : null,
        equipment_name: equipment_name || null,
        localization: localization || null,
        sector: sector || null,
        problem_type: problem_type || null,
        description,
        priority,
        date: new Date().toLocaleDateString('pt-BR'),
      })
      navigate('/chamados')
    } catch {
      setErro('Erro ao abrir chamado. Seus dados foram mantidos; tente novamente.')
    } finally {
      setEnviando(false)
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
      <PageHeader title="Abrir chamado" description="Conte o que aconteceu. As informações ajudam a equipe de TI a chegar à solução." />
      <div className="form-layout">
        <form onSubmit={handleSubmit} className="formulario ticket-form">
          <p className="form-note">Nome e descrição são obrigatórios. Preencha os demais campos quando souber.</p>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <fieldset><legend><span>01</span>Quem precisa de suporte?</legend><div className="form-grid">
            {isAdmin ? <label className="full-width">Solicitante<select value={solicitanteId} onChange={(e) => { const selected = usuarios.find((user) => user.id === Number(e.target.value)); setSolicitanteId(e.target.value); setUserName(selected?.name || '') }} required><option value="">Selecione quem solicita</option>{usuarios.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.sector || 'Sem setor'}</option>)}</select></label> : <label className="full-width">Solicitante<input value={user_name} readOnly aria-readonly="true" /></label>}
            <label>Local<input list="locais-chamados" value={localization} onChange={(e) => setLocalization(e.target.value)} placeholder="Ex.: sala 12, laboratório ou filial Centro" /><datalist id="locais-chamados">{opcoes.localizations.map((value) => <option key={value} value={value} />)}</datalist></label>
            <label>Setor<input list="setores-chamados" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex.: secretaria, pedagógico ou financeiro" /><datalist id="setores-chamados">{opcoes.sectors?.map((value) => <option key={value} value={value} />)}</datalist></label>
          </div></fieldset>
          <fieldset><legend><span>02</span>O que está acontecendo?</legend><div className="form-grid">
            <label>Equipamento<select value={equipment_id} onChange={(e) => selecionarEquipamento(e.target.value)}><option value="">Sem equipamento / não listado</option>{equipamentos.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}</select></label>
            <label>Tipo do Problema<select value={problem_type} onChange={(e) => setProblemType(e.target.value)}><option value="">Selecione a categoria</option><option value="Hardware">Equipamentos e periféricos</option><option value="Rede">Internet e rede</option><option value="Software">Sistemas e programas</option><option value="Acesso">Contas e acessos</option><option value="Outro">Outro problema de TI</option></select></label>
            {equipmentError && <p className="field-help full-width" role="status">Não foi possível carregar os equipamentos. Você pode informar o nome abaixo e continuar.</p>}
            {!equipment_id && <label className="full-width">Nome do equipamento (opcional)<input value={equipment_name} onChange={(e) => setEquipmentName(e.target.value)} placeholder="Ex.: projetor da sala 12 ou notebook do financeiro" /></label>}
            <label className="full-width">Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema, quando começou e como afeta sua aula ou trabalho. Se houver uma mensagem de erro, inclua o texto." rows={5} required /></label>
          </div></fieldset>
          <fieldset><legend><span>03</span>Qual é o impacto?</legend><label>Prioridade<select value={priority} onChange={(e) => setPriority(e.target.value)} aria-describedby="priority-help"><option value="baixa">Baixa — consigo continuar minhas atividades</option><option value="media">Média — parte das atividades está prejudicada</option><option value="alta">Alta — aula ou operação interrompida</option></select></label><p id="priority-help" className="field-help">Considere quantas pessoas foram afetadas e se existe uma alternativa para continuar.</p></fieldset>
          <div className="form-actions"><Link to="/chamados" className="btn-secundario">Cancelar</Link><button type="submit" className="btn-primario" disabled={enviando}><Icon name="plus" size={18} />{enviando ? 'Enviando...' : 'Abrir Chamado'}</button></div>
        </form>
        <aside className="form-aside"><span className="guide-icon"><Icon name="info" size={24} /></span><h2>Um bom relato faz a diferença.</h2><p>Quanto mais contexto, mais fácil entender o problema.</p><ul><li>Informe a sala, unidade ou setor afetado.</li><li>Identifique o equipamento, se houver.</li><li>Explique o que tentou fazer e o que aconteceu.</li></ul><div className="aside-example"><span className="eyebrow">EXEMPLO</span><p>“O projetor da sala 12 não exibe a imagem do computador. A aula está interrompida desde as 8h.”</p></div><p className="field-help">Não inclua senhas na descrição do chamado.</p></aside>
      </div>
    </div>
  )
}
