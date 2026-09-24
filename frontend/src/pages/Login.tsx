import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Brand from '../components/Brand'
import Icon from '../components/Icon'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch {
      setErro('Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-container">
      <section className="login-story"><Brand /><div className="login-pitch"><span className="eyebrow">TECNOLOGIA A SERVIÇO DAS PESSOAS</span><h1>Menos interrupções.<br /><span>Mais possibilidades.</span></h1><p>O suporte de TI que conecta pessoas e soluções em escolas e empresas.</p><div className="login-audiences"><div><Icon name="school" size={26} /><strong>Para escolas</strong><span>Salas de aula, laboratórios e secretaria.</span></div><div><Icon name="building" size={26} /><strong>Para empresas</strong><span>Escritórios, equipes e operações.</span></div></div><div className="login-process"><span>01 <strong>Abra um chamado</strong></span><Icon name="arrow" size={16} /><span>02 <strong>Acompanhe o suporte</strong></span></div></div><small className="login-story-footer">Call Help · Central de suporte de TI</small></section>
      <section className="login-access"><div className="login-form-wrap"><span className="login-symbol"><Icon name="headset" size={28} /></span><span className="eyebrow">BEM-VINDO AO CALL HELP</span><h2>Acesse sua central de suporte</h2><p>Entre com sua conta institucional para abrir e acompanhar chamados.</p><form onSubmit={handleSubmit} className="login-form">
        {erro && <p className="erro" role="alert">{erro}</p>}
        <label>E-mail institucional<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@instituicao.com.br" autoComplete="username" required /></label>
        <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required /></label>
        <button type="submit" className="btn-primario" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}<Icon name="arrow" size={18} /></button>
      </form><p className="login-help"><Icon name="info" size={18} />Precisa de acesso? Procure o administrador de TI da sua instituição.</p></div><span className="login-access-footer">Um só lugar para cuidar da sua tecnologia.</span></section>
    </main>
  )
}
