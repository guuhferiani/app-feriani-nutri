import React, { useEffect, useState, useMemo } from 'react'
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Weight,
  Ruler,
  Activity,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Coffee,
  Droplets,
  Sun,
  Moon,
  Utensils,
  Pill,
  ShieldAlert,
  Target,
  Save,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  getPacienteComHistorico,
  createConsulta,
  updatePaciente,
  createPlanoAlimentar,
  type PacienteRecord,
  type ConsultaRecord,
  type PlanoAlimentarRecord,
} from '@/lib/neon-db'
import { gerarPlanoManualFallback, type PlanoAlimentarResponse } from '@/lib/gemini-planos'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface PatientProfileProps {
  pacienteId: string
  nutricionistaId: string
  onBack: () => void
  onUpdate?: () => void
}

type MainSection = 'dados' | 'consultas' | 'planos'
type DadosTab = 'pessoal' | 'clinico' | 'habitos'

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
]

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

export const PatientProfile: React.FC<PatientProfileProps> = ({
  pacienteId,
  nutricionistaId,
  onBack,
  onUpdate,
}) => {
  const [paciente, setPaciente] = useState<PacienteRecord | null>(null)
  const [consultas, setConsultas] = useState<ConsultaRecord[]>([])
  const [planos, setPlanos] = useState<PlanoAlimentarRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Seções principais
  const [activeSection, setActiveSection] = useState<MainSection>('dados')

  // Seção 1: Abas de dados do paciente
  const [dadosTab, setDadosTab] = useState<DadosTab>('pessoal')
  const [savingPaciente, setSavingPaciente] = useState(false)
  const [pacienteSaveSuccess, setPacienteSaveSuccess] = useState(false)
  const [pacienteSaveError, setPacienteSaveError] = useState<string | null>(null)

  // Estado editável do formulário de dados do paciente
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    restricoes_alimentares: [] as string[],
    alergias: [] as string[],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: null as boolean | null,
    atividade_fisica_descricao: '',
    observacoes: '',
  })

  // Inputs para adição livre de opções
  const [customPatologia, setCustomPatologia] = useState('')
  const [customRestricao, setCustomRestricao] = useState('')
  const [customAlergia, setCustomAlergia] = useState('')

  // Seção 2: Consultas & Modal
  const [showNewConsultaModal, setShowNewConsultaModal] = useState(false)
  const [savingConsulta, setSavingConsulta] = useState(false)
  const [consultaData, setConsultaData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  })

  // Seção 3: Planos alimentares (geração por IA, edição e histórico)
  const [expandedPlanoId, setExpandedPlanoId] = useState<string | null>(null)
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [loadingMensagem, setLoadingMensagem] = useState('Analisando perfil do paciente...')
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoAlimentarResponse | null>(null)
  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0)
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  const [planoSaveSuccess, setPlanoSaveSuccess] = useState(false)
  const [planoToastError, setPlanoToastError] = useState<string | null>(null)

  // Carrega dados iniciais
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPacienteComHistorico(pacienteId, nutricionistaId)
      if (res) {
        setPaciente(res.paciente)
        setConsultas(res.consultas || [])
        setPlanos(res.planos || [])
        populateForm(res.paciente)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pacienteId, nutricionistaId])

  const populateForm = (p: PacienteRecord) => {
    setFormData({
      nome: p.nome || '',
      data_nascimento: p.data_nascimento ? p.data_nascimento.split('T')[0] : '',
      sexo: p.sexo || '',
      whatsapp: p.whatsapp || p.telefone || '',
      email: p.email || '',
      peso_inicial: p.peso_inicial != null ? String(p.peso_inicial) : '',
      altura: p.altura != null ? (p.altura > 3 ? String(p.altura) : String(Math.round(p.altura * 100))) : '',
      objetivos: p.objetivos || [],
      objetivo_texto: p.objetivo_texto || '',
      nivel_atividade: p.nivel_atividade || '',
      patologias: p.patologias || [],
      restricoes_alimentares: p.restricoes_alimentares || [],
      alergias: p.alergias || [],
      medicamentos: p.medicamentos || '',
      suplementos: p.suplementos || '',
      refeicoes_por_dia: p.refeicoes_por_dia != null ? String(p.refeicoes_por_dia) : '',
      horario_acorda: p.horario_acorda || '',
      horario_dorme: p.horario_dorme || '',
      litros_agua: p.litros_agua != null ? String(p.litros_agua) : '',
      atividade_fisica: p.atividade_fisica ?? null,
      atividade_fisica_descricao: p.atividade_fisica_descricao || '',
      observacoes: p.observacoes || '',
    })
  }

  // Idade calculada
  const idadeCalculada = useMemo(() => {
    if (!formData.data_nascimento) return ''
    const parts = formData.data_nascimento.split('-')
    if (parts.length !== 3) return ''
    const birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    if (isNaN(birthDate.getTime())) return ''

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? `${age} anos` : ''
  }, [formData.data_nascimento])

  // IMC dinâmico da edição de dados
  const imcCalculado = useMemo(() => {
    const peso = parseFloat(formData.peso_inicial.replace(',', '.'))
    let alt = parseFloat(formData.altura.replace(',', '.'))
    if (!peso || !alt || peso <= 0 || alt <= 0) return null
    if (alt > 3) alt = alt / 100
    const imc = peso / (alt * alt)
    return imc.toFixed(1)
  }, [formData.peso_inicial, formData.altura])

  // Formatação de WhatsApp
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    if (!raw) {
      setFormData((prev) => ({ ...prev, whatsapp: '' }))
      return
    }
    let formatted = raw
    if (raw.length <= 2) {
      formatted = `(${raw}`
    } else if (raw.length <= 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    } else if (raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
    } else {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`
    }
    setFormData((prev) => ({ ...prev, whatsapp: formatted }))
  }

  // Toggle de itens com opção "Nenhum"
  const handleToggleOptionWithNone = (field: 'patologias' | 'restricoes_alimentares' | 'alergias', option: string) => {
    setFormData((prev) => {
      const current = prev[field]
      if (option === 'Nenhum') {
        return { ...prev, [field]: current.includes('Nenhum') ? [] : ['Nenhum'] }
      }
      const withoutNone = current.filter((i) => i !== 'Nenhum')
      if (withoutNone.includes(option)) {
        return { ...prev, [field]: withoutNone.filter((i) => i !== option) }
      }
      return { ...prev, [field]: [...withoutNone, option] }
    })
  }

  const handleAddCustom = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    val: string,
    setVal: (v: string) => void
  ) => {
    const trimmed = val.trim()
    if (!trimmed) return
    setFormData((prev) => {
      const withoutNone = prev[field].filter((i) => i !== 'Nenhum')
      if (withoutNone.includes(trimmed)) return prev
      return { ...prev, [field]: [...withoutNone, trimmed] }
    })
    setVal('')
  }

  // Salvar edições do paciente (Seção 1)
  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      setPacienteSaveError('O nome do paciente é obrigatório.')
      return
    }

    setSavingPaciente(true)
    setPacienteSaveError(null)

    try {
      let alturaFinal: number | null = null
      if (formData.altura) {
        const parsed = parseFloat(formData.altura.replace(',', '.'))
        if (!isNaN(parsed) && parsed > 0) {
          alturaFinal = parsed > 3 ? parsed / 100 : parsed
        }
      }

      const pesoFinal = formData.peso_inicial ? parseFloat(formData.peso_inicial.replace(',', '.')) : null
      const refeicoesFinal = formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null
      const aguaFinal = formData.litros_agua ? parseFloat(formData.litros_agua.replace(',', '.')) : null

      const updated = await updatePaciente(pacienteId, nutricionistaId, {
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo || null,
        telefone: formData.whatsapp.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim() || null,
        peso_inicial: pesoFinal,
        altura: alturaFinal,
        objetivos: formData.objetivos.length > 0 ? formData.objetivos : null,
        objetivo_texto: formData.objetivo_texto.trim() || null,
        nivel_atividade: formData.nivel_atividade || null,
        patologias: formData.patologias.length > 0 ? formData.patologias : null,
        restricoes_alimentares: formData.restricoes_alimentares.length > 0 ? formData.restricoes_alimentares : null,
        alergias: formData.alergias.length > 0 ? formData.alergias : null,
        medicamentos: formData.medicamentos.trim() || null,
        suplementos: formData.suplementos.trim() || null,
        refeicoes_por_dia: refeicoesFinal,
        horario_acorda: formData.horario_acorda.trim() || null,
        horario_dorme: formData.horario_dorme.trim() || null,
        litros_agua: aguaFinal,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao:
          formData.atividade_fisica && formData.atividade_fisica_descricao.trim()
            ? formData.atividade_fisica_descricao.trim()
            : null,
        observacoes: formData.observacoes.trim() || null,
      })

      if (updated) {
        setPaciente(updated)
      }
      setPacienteSaveSuccess(true)
      setTimeout(() => setPacienteSaveSuccess(false), 3000)
      if (onUpdate) onUpdate()
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err)
      setPacienteSaveError(err?.message || 'Erro ao salvar alterações do paciente.')
    } finally {
      setSavingPaciente(false)
    }
  }

  // Salvar nova consulta (Seção 2)
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConsulta(true)
    try {
      await createConsulta(pacienteId, {
        data_consulta: consultaData.data_consulta,
        peso: consultaData.peso ? parseFloat(consultaData.peso) : null,
        cintura: consultaData.cintura ? parseFloat(consultaData.cintura) : null,
        quadril: consultaData.quadril ? parseFloat(consultaData.quadril) : null,
        percentual_gordura: consultaData.percentual_gordura
          ? parseFloat(consultaData.percentual_gordura)
          : null,
        observacoes: consultaData.observacoes || null,
        proximo_retorno: consultaData.proximo_retorno || null,
      })

      // Recarrega consultas e atualiza gráfico e lista
      const res = await getPacienteComHistorico(pacienteId, nutricionistaId)
      if (res) {
        setConsultas(res.consultas || [])
        setPaciente(res.paciente)
      }
      setShowNewConsultaModal(false)
      setConsultaData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      })
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Erro ao salvar consulta:', err)
      alert('Erro ao registrar consulta. Verifique os dados inseridos.')
    } finally {
      setSavingConsulta(false)
    }
  }

  // Geração de Plano com IA (Prompt 6)
  const handleGerarPlanoIA = async () => {
    if (!paciente) return
    setGerandoPlano(true)
    setPlanoToastError(null)

    // Mensagens dinâmicas de loading
    const msgs = [
      'Buscando dados do paciente...',
      'Analisando objetivos e restrições alimentares...',
      'IA calculando cardápio semanal e macronutrientes...',
      'Estruturando 5 opções equilibradas por refeição...',
      'Finalizando plano alimentar personalizado...',
    ]
    let msgIdx = 0
    setLoadingMensagem(msgs[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length
      setLoadingMensagem(msgs[msgIdx])
    }, 1800)

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente }),
      })

      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status} na API`)
      }

      const data = await response.json()
      if (data && Array.isArray(data.plano_semanal) && data.plano_semanal.length > 0) {
        setPlanoEmEdicao(data)
        setDiaAtivoIndex(0)
      } else {
        throw new Error('Formato inválido retornado pela IA')
      }
    } catch (err) {
      console.error('Erro na chamada da API Gemini, usando plano manual estruturado:', err)
      setPlanoToastError(
        'Não foi possível gerar o plano com IA no momento. Um plano nutricional estruturado foi criado para personalização manual.'
      )
      const planoFallback = gerarPlanoManualFallback(paciente)
      setPlanoEmEdicao(planoFallback)
      setDiaAtivoIndex(0)
    } finally {
      clearInterval(interval)
      setGerandoPlano(false)
    }
  }

  // Edição dos inputs do plano gerado
  const handleEditRefeicaoOpcao = (
    diaIdx: number,
    refeicaoKey: 'cafe_da_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar',
    opcaoIdx: number,
    newVal: string
  ) => {
    if (!planoEmEdicao) return
    setPlanoEmEdicao((prev) => {
      if (!prev) return null
      const novoPlano = JSON.parse(JSON.stringify(prev)) as PlanoAlimentarResponse
      if (
        novoPlano.plano_semanal[diaIdx] &&
        novoPlano.plano_semanal[diaIdx].refeicoes &&
        novoPlano.plano_semanal[diaIdx].refeicoes[refeicaoKey]
      ) {
        novoPlano.plano_semanal[diaIdx].refeicoes[refeicaoKey][opcaoIdx] = newVal
      }
      return novoPlano
    })
  }

  // Persistir plano alimentar no banco de dados
  const handleSalvarPlanoAlimentar = async () => {
    if (!planoEmEdicao || !pacienteId) return
    setSalvandoPlano(true)
    try {
      await createPlanoAlimentar(pacienteId, planoEmEdicao)
      setPlanoSaveSuccess(true)
      setTimeout(() => setPlanoSaveSuccess(false), 4000)

      // Atualiza o histórico imediatamente e limpa a tela de edição
      const res = await getPacienteComHistorico(pacienteId, nutricionistaId)
      if (res) {
        setPlanos(res.planos || [])
      }
      setPlanoEmEdicao(null)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Erro ao salvar plano alimentar no Neon:', err)
      alert('Erro ao salvar plano alimentar no banco de dados. Tente novamente.')
    } finally {
      setSalvandoPlano(false)
    }
  }

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return '—'
    const clean = dataStr.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dataStr
  }

  // Prepara dados para o gráfico de evolução de peso (ordem cronológica crescente: mais antiga -> mais recente)
  const pesoHistory = useMemo(() => {
    const listWithWeight = consultas
      .filter((c) => c.peso != null && !isNaN(Number(c.peso)))
      .map((c) => ({
        id: c.id,
        data: formatarData(c.data_consulta),
        dataRaw: c.data_consulta,
        peso: Number(c.peso),
      }))

    // Ordena do mais antigo para o mais recente para desenhar a linha do tempo
    listWithWeight.sort((a, b) => (a.dataRaw > b.dataRaw ? 1 : -1))
    return listWithWeight
  }, [consultas])

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 bg-slate-200 rounded-lg" />
          <div className="h-6 w-48 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O paciente solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Cálculo de evolução de peso (primeira consulta vs última consulta)
  const primeiroPeso = pesoHistory.length > 0 ? pesoHistory[0].peso : paciente.peso_inicial
  const ultimoPeso = pesoHistory.length > 0 ? pesoHistory[pesoHistory.length - 1].peso : paciente.peso_inicial
  const diferencaPeso =
    primeiroPeso != null && ultimoPeso != null ? Number((ultimoPeso - primeiroPeso).toFixed(1)) : null

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Barra de Voltar e Identificação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowNewConsultaModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Cartão de Resumo do Paciente */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-700/20">
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{paciente.nome}</h1>
                <Badge variant="success" className="text-xs">
                  Paciente Ativo
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                {paciente.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.email}
                  </span>
                )}
                {(paciente.whatsapp || paciente.telefone) && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.whatsapp || paciente.telefone}
                  </span>
                )}
                {paciente.whatsapp && (
                  <a
                    href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Métricas Resumidas */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Peso Inicial</span>
              <span className="text-base font-bold text-slate-800">
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Peso Atual</span>
              <span className="text-base font-bold text-slate-800">
                {ultimoPeso ? `${ultimoPeso} kg` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Consultas</span>
              <span className="text-base font-bold text-slate-800">{consultas.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais (Prompt 5) */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'dados'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'consultas'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {consultas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'planos'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Planos Alimentares</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {planos.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE                              */}
      {/* ======================================================== */}
      {activeSection === 'dados' && (
        <form onSubmit={handleSavePaciente} className="space-y-6">
          <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
            {/* Sub-abas de cadastro: Pessoal, Clínico e Hábitos */}
            <div className="border-b border-slate-100 bg-slate-50/60 p-2 sm:p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDadosTab('pessoal')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    dadosTab === 'pessoal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  1. Pessoal
                </button>
                <button
                  type="button"
                  onClick={() => setDadosTab('clinico')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    dadosTab === 'clinico'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  2. Clínico
                </button>
                <button
                  type="button"
                  onClick={() => setDadosTab('habitos')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    dadosTab === 'habitos'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  3. Hábitos
                </button>
              </div>

              {/* Botão de Salvar Alterações no Topo */}
              <Button
                type="submit"
                disabled={savingPaciente}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm"
              >
                {savingPaciente ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>

            {/* Alertas de Sucesso ou Erro ao Salvar */}
            {pacienteSaveSuccess && (
              <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dados do paciente atualizados com sucesso no sistema!</span>
              </div>
            )}
            {pacienteSaveError && (
              <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pacienteSaveError}</span>
              </div>
            )}

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* ABA 1: PESSOAL */}
              {dadosTab === 'pessoal' && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <Label htmlFor="edit-nome" className="text-slate-800 font-semibold text-sm block mb-1.5">
                      Nome completo *
                    </Label>
                    <Input
                      id="edit-nome"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="text-base h-11 bg-white focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="edit-nascimento" className="text-slate-800 font-semibold text-sm">
                          Data de Nascimento
                        </Label>
                        {idadeCalculada && (
                          <Badge variant="outline" className="text-emerald-800 bg-emerald-50 border-emerald-200 text-xs">
                            Idade: {idadeCalculada}
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="edit-nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        className="h-11 bg-white"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Sexo
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({ ...formData, sexo: s })}
                            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                              formData.sexo === s
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="edit-whatsapp" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        WhatsApp (número formatado)
                      </Label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          id="edit-whatsapp"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={formData.whatsapp}
                          onChange={handleWhatsAppChange}
                          className="h-11 pl-10 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-email" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        E-mail
                      </Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="paciente@exemplo.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-11 pl-10 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: CLÍNICO */}
              {dadosTab === 'clinico' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-peso" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Peso Inicial
                      </Label>
                      <div className="relative">
                        <Input
                          id="edit-peso"
                          type="number"
                          step="0.1"
                          placeholder="70.5"
                          value={formData.peso_inicial}
                          onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                          className="h-11 pr-10 bg-white"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          kg
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-altura" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Altura
                      </Label>
                      <div className="relative">
                        <Input
                          id="edit-altura"
                          type="number"
                          step="1"
                          placeholder="170"
                          value={formData.altura}
                          onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                          className="h-11 pr-10 bg-white"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-800 font-semibold text-sm block mb-1.5">
                        IMC Inicial
                      </Label>
                      <div className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">
                          {imcCalculado || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Auto</span>
                      </div>
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div>
                    <Label className="text-slate-800 font-semibold text-sm block mb-2">
                      Objetivos (múltipla escolha)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {OBJETIVOS_OPCOES.map((obj) => {
                        const isSelected = formData.objetivos.includes(obj)
                        return (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                objetivos: isSelected
                                  ? prev.objetivos.filter((i) => i !== obj)
                                  : [...prev.objetivos, obj],
                              }))
                            }}
                            className={`p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold shadow-xs'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>{obj}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3">
                      <Input
                        placeholder="Outro objetivo ou observação específica sobre metas..."
                        value={formData.objetivo_texto}
                        onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                        className="bg-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Nível de Atividade Física */}
                  <div>
                    <Label className="text-slate-800 font-semibold text-sm block mb-2">
                      Nível de Atividade Física
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {NIVEIS_ATIVIDADE.map((nv) => (
                        <button
                          key={nv}
                          type="button"
                          onClick={() => setFormData({ ...formData, nivel_atividade: nv })}
                          className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all text-center ${
                            formData.nivel_atividade === nv
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {nv}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patologias */}
                  <div>
                    <Label className="text-slate-800 font-semibold text-sm block mb-2">
                      Patologias ou condições de saúde
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => handleToggleOptionWithNone('patologias', 'Nenhum')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          formData.patologias.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>
                      {PATOLOGIAS_OPCOES.map((pat) => {
                        const sel = formData.patologias.includes(pat)
                        return (
                          <button
                            key={pat}
                            type="button"
                            onClick={() => handleToggleOptionWithNone('patologias', pat)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                              sel
                                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pat}
                          </button>
                        )
                      })}
                      {formData.patologias
                        .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-rose-50 text-rose-800 border-rose-300 text-xs font-semibold"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleToggleOptionWithNone('patologias', custom)}
                              className="text-rose-500 hover:text-rose-700 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar outra patologia..."
                        value={customPatologia}
                        onChange={(e) => setCustomPatologia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCustom('patologias', customPatologia, setCustomPatologia)
                          }
                        }}
                        className="bg-white text-xs h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCustom('patologias', customPatologia, setCustomPatologia)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div>
                    <Label className="text-slate-800 font-semibold text-sm block mb-2">
                      Restrições alimentares
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => handleToggleOptionWithNone('restricoes_alimentares', 'Nenhum')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          formData.restricoes_alimentares.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>
                      {RESTRICOES_OPCOES.map((res) => {
                        const sel = formData.restricoes_alimentares.includes(res)
                        return (
                          <button
                            key={res}
                            type="button"
                            onClick={() => handleToggleOptionWithNone('restricoes_alimentares', res)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                              sel
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {res}
                          </button>
                        )
                      })}
                      {formData.restricoes_alimentares
                        .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleToggleOptionWithNone('restricoes_alimentares', custom)}
                              className="text-amber-500 hover:text-amber-700 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar outra restrição alimentar..."
                        value={customRestricao}
                        onChange={(e) => setCustomRestricao(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCustom('restricoes_alimentares', customRestricao, setCustomRestricao)
                          }
                        }}
                        className="bg-white text-xs h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCustom('restricoes_alimentares', customRestricao, setCustomRestricao)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div>
                    <Label className="text-slate-800 font-semibold text-sm block mb-2">
                      Alergias alimentares
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => handleToggleOptionWithNone('alergias', 'Nenhum')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          formData.alergias.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>
                      {ALERGIAS_OPCOES.map((ale) => {
                        const sel = formData.alergias.includes(ale)
                        return (
                          <button
                            key={ale}
                            type="button"
                            onClick={() => handleToggleOptionWithNone('alergias', ale)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                              sel
                                ? 'bg-orange-50 text-orange-800 border-orange-300 font-bold'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {ale}
                          </button>
                        )
                      })}
                      {formData.alergias
                        .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-orange-50 text-orange-800 border-orange-300 text-xs font-semibold"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleToggleOptionWithNone('alergias', custom)}
                              className="text-orange-500 hover:text-orange-700 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar outra alergia alimentar..."
                        value={customAlergia}
                        onChange={(e) => setCustomAlergia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCustom('alergias', customAlergia, setCustomAlergia)
                          }
                        }}
                        className="bg-white text-xs h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCustom('alergias', customAlergia, setCustomAlergia)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Medicamentos e Suplementos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-meds" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Medicamentos contínuos
                      </Label>
                      <textarea
                        id="edit-meds"
                        rows={2}
                        value={formData.medicamentos}
                        onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                        placeholder="Ex: Metformina 500mg (1x ao dia)..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-supl" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Suplementos em uso
                      </Label>
                      <textarea
                        id="edit-supl"
                        rows={2}
                        value={formData.suplementos}
                        onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                        placeholder="Ex: Creatina 5g, Vitamina D3 2000UI..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: HÁBITOS */}
              {dadosTab === 'habitos' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-refeicoes" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Refeições por dia
                      </Label>
                      <Input
                        id="edit-refeicoes"
                        type="number"
                        placeholder="Ex: 4"
                        value={formData.refeicoes_por_dia}
                        onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                        className="bg-white h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-agua" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Água por dia (litros)
                      </Label>
                      <div className="relative">
                        <Input
                          id="edit-agua"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 2.5"
                          value={formData.litros_agua}
                          onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                          className="bg-white h-11 pr-12"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          litros
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-acorda" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Horário que acorda
                      </Label>
                      <Input
                        id="edit-acorda"
                        placeholder="Ex: 06:30"
                        value={formData.horario_acorda}
                        onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                        className="bg-white h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-dorme" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Horário que dorme
                      </Label>
                      <Input
                        id="edit-dorme"
                        placeholder="Ex: 23:00"
                        value={formData.horario_dorme}
                        onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                        className="bg-white h-11"
                      />
                    </div>
                  </div>

                  {/* Pratica Atividade Física */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <Label className="text-slate-800 font-semibold text-sm block">
                      Pratica atividade física?
                    </Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                          formData.atividade_fisica === true
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            atividade_fisica: false,
                            atividade_fisica_descricao: '',
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                          formData.atividade_fisica === false
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Não
                      </button>
                    </div>

                    {formData.atividade_fisica === true && (
                      <div className="pt-2 animate-fade-in">
                        <Label htmlFor="edit-atv-desc" className="text-slate-700 text-xs font-semibold block mb-1">
                          Qual atividade e frequência semanal?
                        </Label>
                        <Input
                          id="edit-atv-desc"
                          placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                          value={formData.atividade_fisica_descricao}
                          onChange={(e) =>
                            setFormData({ ...formData, atividade_fisica_descricao: e.target.value })
                          }
                          className="bg-white text-sm h-10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Observações Gerais */}
                  <div>
                    <Label htmlFor="edit-obs" className="text-slate-800 font-semibold text-sm block mb-1.5">
                      Observações gerais
                    </Label>
                    <textarea
                      id="edit-obs"
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Detalhes adicionais sobre a rotina alimentar, preferências, aversões ou contexto..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Botão Salvar Alterações no Rodapé */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={savingPaciente}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-sm"
                >
                  {savingPaciente ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Salvando alterações...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO                   */}
      {/* ======================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Card do Gráfico de Evolução de Peso (Sempre visível) */}
          <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/60">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Evolução de Peso
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Histórico ponderal acompanhado em cada consulta registrada ao longo do tempo.
                    </CardDescription>
                  </div>
                </div>

                {pesoHistory.length > 1 && diferencaPeso !== null && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        diferencaPeso < 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : diferencaPeso > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {diferencaPeso < 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Perda de {Math.abs(diferencaPeso)} kg</span>
                        </>
                      ) : diferencaPeso > 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ganho de +{diferencaPeso} kg</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Peso estável</span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {pesoHistory.length === 0 ? (
                /* Gráfico vazio com mensagem obrigatória */
                <div className="p-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Weight className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-700">
                    Nenhuma consulta registrada ainda
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Assim que registrar consultas com pesagem, o gráfico exibirá a trajetória de peso do paciente.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowNewConsultaModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Registrar Primeira Consulta
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico SVG Responsivo de Linha e Pontos */}
                  <div className="w-full bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
                    <div className="relative w-full h-56 sm:h-64">
                      {(() => {
                        const weights = pesoHistory.map((p) => p.peso)
                        const minW = Math.min(...weights) - 2
                        const maxW = Math.max(...weights) + 2
                        const range = maxW - minW || 1

                        const points = pesoHistory.map((item, index) => {
                          const x =
                            pesoHistory.length === 1
                              ? 50
                              : (index / (pesoHistory.length - 1)) * 90 + 5
                          const y = 85 - ((item.peso - minW) / range) * 70
                          return { ...item, x, y }
                        })

                        const pathD =
                          points.length === 1
                            ? `M 0,${points[0].y} L 100,${points[0].y}`
                            : points.reduce(
                                (acc, pt, i) =>
                                  i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`,
                                ''
                              )

                        return (
                          <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="w-full h-full overflow-visible"
                          >
                            <defs>
                              <linearGradient id="weightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Linhas de grade sutis */}
                            <line x1="0" y1="15" x2="100" y2="15" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                            <line x1="0" y1="85" x2="100" y2="85" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />

                            {/* Área abaixo da linha se mais de 1 ponto */}
                            {points.length > 1 && (
                              <path
                                d={`${pathD} L ${points[points.length - 1].x},95 L ${points[0].x},95 Z`}
                                fill="url(#weightGrad)"
                              />
                            )}

                            {/* Linha principal de tendência */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#059669"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Marcadores circulares */}
                            {points.map((pt, i) => (
                              <g key={i}>
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="2.5"
                                  className="fill-emerald-600 stroke-white"
                                  strokeWidth="1.2"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 4}
                                  textAnchor="middle"
                                  className="fill-slate-800 text-[3.8px] font-bold"
                                >
                                  {pt.peso} kg
                                </text>
                              </g>
                            ))}
                          </svg>
                        )
                      })()}
                    </div>

                    {/* Rótulos de datas no eixo X */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-3 border-t border-slate-200/80 mt-2 px-2">
                      {pesoHistory.map((item, i) => (
                        <div key={i} className="text-center">
                          <span className="block font-bold text-slate-700">{item.data}</span>
                          <span className="text-[10px] text-slate-400">{item.peso} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Consultas em Ordem Cronológica Decrescente */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Histórico Completo de Consultas ({consultas.length})
              </h3>
              <Button
                size="sm"
                onClick={() => setShowNewConsultaModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Nova Consulta
              </Button>
            </div>

            {consultas.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma consulta cadastrada ainda
                </p>
                <p className="text-xs text-slate-400">
                  Cadastre uma consulta para registrar medidas antropométricas e orientações.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultas.map((c, index) => (
                  <Card
                    key={c.id || index}
                    className="border-slate-200/80 hover:border-emerald-200 transition-all bg-white shadow-2xs"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-bold text-slate-800">
                            Consulta em {formatarData(c.data_consulta)}
                          </span>
                          {index === 0 && (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50/50">
                              Mais recente
                            </Badge>
                          )}
                        </div>

                        {c.proximo_retorno ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Próximo retorno: {formatarData(c.proximo_retorno)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Sem retorno agendado</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Peso</span>
                          <strong className="text-slate-900 text-sm">
                            {c.peso != null ? `${c.peso} kg` : '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Cintura</span>
                          <strong className="text-slate-900 text-sm">
                            {c.cintura != null ? `${c.cintura} cm` : '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Quadril</span>
                          <strong className="text-slate-900 text-sm">
                            {c.quadril != null ? `${c.quadril} cm` : '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">% Gordura</span>
                          <strong className="text-slate-900 text-sm">
                            {c.percentual_gordura != null ? `${c.percentual_gordura}%` : '—'}
                          </strong>
                        </div>
                      </div>

                      {c.observacoes && (
                        <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <strong className="block text-slate-900 mb-0.5">Observações:</strong>
                          <p className="leading-relaxed whitespace-pre-wrap">{c.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES (PROMPT 6: IA + EDIÇÃO)   */}
      {/* ======================================================== */}
      {activeSection === 'planos' && (
        <div className="space-y-6 animate-fade-in">
          {/* Banner de Ação com Botão Gerar Plano com IA */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Inteligência Nutricional</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Geração de Planos Alimentares com IA
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
                Crie um cardápio semanal completo estruturado com 5 opções equilibradas por refeição baseado nas metas, rotina e restrições de {paciente.nome}.
              </p>
            </div>

            {/* Botão ✨ Gerar Plano com IA em destaque */}
            <Button
              type="button"
              disabled={gerandoPlano}
              onClick={handleGerarPlanoIA}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-6 py-3 h-auto shadow-md text-sm cursor-pointer shrink-0"
            >
              {gerandoPlano ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-800/30 border-t-emerald-800 rounded-full animate-spin mr-2" />
                  Gerando plano...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-700" />
                  ✨ Gerar Plano com IA
                </>
              )}
            </Button>
          </div>

          {/* Loading Visual com Mensagens Dinâmicas */}
          {gerandoPlano && (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
              <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-emerald-900">{loadingMensagem}</p>
              <p className="text-xs text-emerald-700">
                Aguarde enquanto a inteligência artificial analisa os dados clínicos e calcula a distribuição semanal.
              </p>
            </div>
          )}

          {/* Toast / Alerta de Erro com Fallback */}
          {planoToastError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{planoToastError}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGerarPlanoIA}
                    className="text-xs bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
                  >
                    Tentar novamente com IA
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Sucesso ao Salvar Plano */}
          {planoSaveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Plano alimentar salvo com sucesso no prontuário do paciente!</span>
            </div>
          )}

          {/* INTERFACE DE EDIÇÃO INTERATIVA EM ABAS (DIAS DA SEMANA) */}
          {planoEmEdicao && (
            <Card className="border-emerald-200/90 shadow-md bg-white overflow-hidden animate-fade-in">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
                      <Sparkles className="w-3 h-3 text-emerald-700" />
                      <span>Plano Gerado — Modo de Ajuste & Edição</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Revise e Personalize o Cardápio Semanal
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Você pode alterar livremente qualquer refeição antes de salvar no prontuário.
                    </CardDescription>
                  </div>

                  {/* Botão Salvar Plano Alimentar (visível apenas quando há plano gerado/carregado) */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPlanoEmEdicao(null)}
                      className="text-xs"
                    >
                      Descartar
                    </Button>
                    <Button
                      type="button"
                      disabled={salvandoPlano}
                      onClick={handleSalvarPlanoAlimentar}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 shadow-sm"
                    >
                      {salvandoPlano ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1.5" />
                          Salvar Plano Alimentar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Abas para separar os dias da semana */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1">
                  {planoEmEdicao.plano_semanal.map((diaObj, idx) => (
                    <button
                      key={diaObj.dia}
                      type="button"
                      onClick={() => setDiaAtivoIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        diaAtivoIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {diaObj.dia}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {(() => {
                  const diaAtivo = planoEmEdicao.plano_semanal[diaAtivoIndex]
                  if (!diaAtivo) return null

                  const refeicoesDef: Array<{
                    key: 'cafe_da_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar'
                    titulo: string
                    icone: any
                    cor: string
                  }> = [
                    { key: 'cafe_da_manha', titulo: 'Café da Manhã', icone: Coffee, cor: 'text-amber-600 bg-amber-50' },
                    { key: 'lanche_manha', titulo: 'Lanche da Manhã', icone: Sun, cor: 'text-orange-600 bg-orange-50' },
                    { key: 'almoco', titulo: 'Almoço', icone: Utensils, cor: 'text-emerald-600 bg-emerald-50' },
                    { key: 'lanche_tarde', titulo: 'Lanche da Tarde', icone: Coffee, cor: 'text-teal-600 bg-teal-50' },
                    { key: 'jantar', titulo: 'Jantar', icone: Moon, cor: 'text-indigo-600 bg-indigo-50' },
                  ]

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                          <span>Cardápio para {diaAtivo.dia}</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          5 opções por refeição (totalmente editáveis)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {refeicoesDef.map((ref) => {
                          const IconComp = ref.icone
                          const opcoes = (diaAtivo.refeicoes && diaAtivo.refeicoes[ref.key]) || []

                          return (
                            <div
                              key={ref.key}
                              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${ref.cor}`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <h5 className="text-sm font-bold text-slate-800">{ref.titulo}</h5>
                              </div>

                              <div className="space-y-2">
                                {opcoes.map((opcaoTexto, opIdx) => (
                                  <div key={opIdx} className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 w-16 shrink-0">
                                      Opção {opIdx + 1}:
                                    </span>
                                    <Input
                                      value={opcaoTexto}
                                      onChange={(e) =>
                                        handleEditRefeicaoOpcao(
                                          diaAtivoIndex,
                                          ref.key,
                                          opIdx,
                                          e.target.value
                                        )
                                      }
                                      className="h-9 bg-white text-xs sm:text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Botão Salvar no Rodapé da Edição */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPlanoEmEdicao(null)}
                          className="text-xs"
                        >
                          Cancelar Edição
                        </Button>
                        <Button
                          type="button"
                          disabled={salvandoPlano}
                          onClick={handleSalvarPlanoAlimentar}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 text-xs sm:text-sm shadow-sm"
                        >
                          {salvandoPlano ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Salvando no Prontuário...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Plano Alimentar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Todos os Planos Salvos */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Histórico de Planos Salvos ({planos.length})
            </h4>

            {planos.length === 0 ? (
              /* Mensagem obrigatória do Prompt 5 e 6 */
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Utensils className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Clique no botão "✨ Gerar Plano com IA" acima para criar e prescrever o primeiro cardápio para {paciente.nome}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {planos.map((plano) => {
                  const isExpanded = expandedPlanoId === plano.id
                  const parsedContent =
                    typeof plano.conteudo === 'string'
                      ? (() => {
                          try {
                            return JSON.parse(plano.conteudo)
                          } catch {
                            return plano.conteudo
                          }
                        })()
                      : plano.conteudo

                  const isStructured = parsedContent && Array.isArray(parsedContent.plano_semanal)

                  return (
                    <Card
                      key={plano.id}
                      className="border-slate-200/80 bg-white shadow-2xs hover:border-emerald-200 transition-all overflow-hidden"
                    >
                      <CardHeader className="p-4 sm:p-5 pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                              <Utensils className="w-4 h-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-slate-900">
                                Plano Alimentar Semanal Prescrito
                              </CardTitle>
                              <CardDescription className="text-xs text-slate-500">
                                Gerado e salvo em {formatarData(plano.created_at)}
                              </CardDescription>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedPlanoId(isExpanded ? null : plano.id)}
                            className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
                          >
                            <span>{isExpanded ? 'Ocultar detalhes' : 'Ver conteúdo completo'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-1.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Exibição Estruturada do Conteúdo do Plano ao Expandir */}
                      {isExpanded && (
                        <CardContent className="px-5 pb-5 pt-3 border-t border-slate-100 animate-fade-in bg-slate-50/40">
                          {isStructured ? (
                            <div className="space-y-4">
                              {parsedContent.plano_semanal.map((diaObj: any, dIdx: number) => (
                                <div
                                  key={dIdx}
                                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3"
                                >
                                  <h5 className="text-sm font-bold text-emerald-900 pb-1 border-b border-slate-100">
                                    {diaObj.dia}
                                  </h5>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                    {Object.entries(diaObj.refeicoes || {}).map(([refKey, opcoes]: [string, any]) => {
                                      const label =
                                        refKey === 'cafe_da_manha'
                                          ? 'Café da Manhã'
                                          : refKey === 'lanche_manha'
                                          ? 'Lanche da Manhã'
                                          : refKey === 'almoco'
                                          ? 'Almoço'
                                          : refKey === 'lanche_tarde'
                                          ? 'Lanche da Tarde'
                                          : refKey === 'jantar'
                                          ? 'Jantar'
                                          : refKey

                                      return (
                                        <div
                                          key={refKey}
                                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                        >
                                          <strong className="block text-slate-800 font-bold mb-1">
                                            {label}
                                          </strong>
                                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                            {Array.isArray(opcoes) ? (
                                              opcoes.map((op: string, oIdx: number) => (
                                                <li key={oIdx} className="leading-snug">
                                                  {op}
                                                </li>
                                              ))
                                            ) : (
                                              <li>{String(opcoes)}</li>
                                            )}
                                          </ul>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 overflow-x-auto font-mono">
                              <pre className="whitespace-pre-wrap leading-relaxed">
                                {typeof parsedContent === 'string'
                                  ? parsedContent
                                  : JSON.stringify(parsedContent, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL — NOVA CONSULTA (PROMPT 5)                         */}
      {/* ======================================================== */}
      {showNewConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Nova Consulta
                </h3>
                <p className="text-xs text-slate-500">
                  Paciente: <strong>{paciente.nome}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowNewConsultaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsulta} className="space-y-4">
              {/* Data da consulta e Próximo retorno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="data_consulta" className="text-xs font-semibold text-slate-700">
                    Data da Consulta *
                  </Label>
                  <Input
                    id="data_consulta"
                    type="date"
                    required
                    value={consultaData.data_consulta}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, data_consulta: e.target.value })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="proximo_retorno" className="text-xs font-semibold text-slate-700">
                    Próximo Retorno
                  </Label>
                  <Input
                    id="proximo_retorno"
                    type="date"
                    value={consultaData.proximo_retorno}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, proximo_retorno: e.target.value })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
              </div>

              {/* Peso, Cintura, Quadril, % Gordura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="peso" className="text-xs font-semibold text-slate-700">
                    Peso atual (kg)
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68.5"
                    value={consultaData.peso}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, peso: e.target.value })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cintura" className="text-xs font-semibold text-slate-700">
                    Cintura (cm) <span className="text-slate-400 text-[10px]">(opcional)</span>
                  </Label>
                  <Input
                    id="cintura"
                    type="number"
                    step="0.5"
                    placeholder="Ex: 74"
                    value={consultaData.cintura}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, cintura: e.target.value })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="quadril" className="text-xs font-semibold text-slate-700">
                    Quadril (cm) <span className="text-slate-400 text-[10px]">(opcional)</span>
                  </Label>
                  <Input
                    id="quadril"
                    type="number"
                    step="0.5"
                    placeholder="Ex: 98"
                    value={consultaData.quadril}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, quadril: e.target.value })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gordura" className="text-xs font-semibold text-slate-700">
                    % de gordura <span className="text-slate-400 text-[10px]">(opcional)</span>
                  </Label>
                  <Input
                    id="gordura"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 22.5"
                    value={consultaData.percentual_gordura}
                    onChange={(e) =>
                      setConsultaData({
                        ...consultaData,
                        percentual_gordura: e.target.value,
                      })
                    }
                    className="h-10 text-xs mt-1"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes" className="text-xs font-semibold text-slate-700">
                  Observações (texto livre)
                </Label>
                <textarea
                  id="observacoes"
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Orientações dadas, evolução, exames laboratoriais, relato do paciente..."
                  value={consultaData.observacoes}
                  onChange={(e) =>
                    setConsultaData({ ...consultaData, observacoes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewConsultaModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingConsulta}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {savingConsulta ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar consulta'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
