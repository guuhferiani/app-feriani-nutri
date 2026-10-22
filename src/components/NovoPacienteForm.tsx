import React, { useState, useMemo } from 'react'
import {
  User,
  HeartPulse,
  Coffee,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  Save,
  Phone,
  Mail,
  Scale,
  Ruler,
  Activity,
  Droplets,
  Moon,
  Sun,
  Utensils,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { createPaciente } from '@/lib/neon-db'

interface NovoPacienteFormProps {
  nutricionistaId: string
  onCancel: () => void
  onSuccess: (pacienteId: string) => void
}

type TabKey = 'pessoal' | 'clinico' | 'habitos'

// Opções pré-definidas do Prompt 4
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

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  nutricionistaId,
  onCancel,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('pessoal')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Aba 1 — Pessoal
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro' | ''>('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // Aba 2 — Clínico
  const [pesoAtual, setPesoAtual] = useState('')
  const [alturaCm, setAlturaCm] = useState('')
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([])
  const [objetivoTextoLivre, setObjetivoTextoLivre] = useState('')
  const [nivelAtividade, setNivelAtividade] = useState('')

  // Patologias com opção "Nenhum" e adição livre
  const [patologias, setPatologias] = useState<string[]>([])
  const [customPatologiaInput, setCustomPatologiaInput] = useState('')

  // Restrições com opção "Nenhum" e adição livre
  const [restricoes, setRestricoes] = useState<string[]>([])
  const [customRestricaoInput, setCustomRestricaoInput] = useState('')

  // Alergias com opção "Nenhum" e adição livre
  const [alergias, setAlergias] = useState<string[]>([])
  const [customAlergiaInput, setCustomAlergiaInput] = useState('')

  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(null)
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Cálculo de idade automático
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return ''
    const parts = dataNascimento.split('-')
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
  }, [dataNascimento])

  // Cálculo de IMC automático e diagnóstico
  const imcInfo = useMemo(() => {
    const peso = parseFloat(pesoAtual.replace(',', '.'))
    let alt = parseFloat(alturaCm.replace(',', '.'))

    if (!peso || !alt || peso <= 0 || alt <= 0) return null

    // Se informado em centímetros (ex: 175), converter para metros (1.75)
    if (alt > 3) {
      alt = alt / 100
    }

    const imc = peso / (alt * alt)
    let status = 'Eutrofia (Peso normal)'
    let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200'

    if (imc < 18.5) {
      status = 'Baixo peso'
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (imc >= 25 && imc < 30) {
      status = 'Sobrepeso'
      colorClass = 'text-orange-700 bg-orange-50 border-orange-200'
    } else if (imc >= 30 && imc < 35) {
      status = 'Obesidade Grau I'
      colorClass = 'text-rose-700 bg-rose-50 border-rose-200'
    } else if (imc >= 35) {
      status = 'Obesidade Grau II/III'
      colorClass = 'text-red-800 bg-red-100 border-red-300'
    }

    return {
      valor: imc.toFixed(1),
      status,
      colorClass,
    }
  }, [pesoAtual, alturaCm])

  // Formatação do WhatsApp (11) 98765-4321
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    if (!raw) {
      setWhatsapp('')
      return
    }
    if (raw.length <= 2) {
      setWhatsapp(`(${raw}`)
    } else if (raw.length <= 6) {
      setWhatsapp(`(${raw.slice(0, 2)}) ${raw.slice(2)}`)
    } else if (raw.length <= 10) {
      setWhatsapp(`(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`)
    } else {
      setWhatsapp(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`)
    }
  }

  // Conversor inteligente de horário (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00)
  const formatTimeInput = (val: string): string => {
    if (!val) return ''
    const clean = val.replace(/\D/g, '')
    if (!clean) return val

    if (clean.length === 1 || clean.length === 2) {
      let h = parseInt(clean, 10)
      if (h > 23) h = 23
      return `${String(h).padStart(2, '0')}:00`
    }
    if (clean.length === 3) {
      const h = parseInt(clean.slice(0, 1), 10)
      let m = parseInt(clean.slice(1), 10)
      if (m > 59) m = 59
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    if (clean.length >= 4) {
      let h = parseInt(clean.slice(0, 2), 10)
      let m = parseInt(clean.slice(2, 4), 10)
      if (h > 23) h = 23
      if (m > 59) m = 59
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    return val
  }

  // Toggle para listas com opção "Nenhum"
  const handleToggleOptionWithNone = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    option: string
  ) => {
    if (option === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([])
      } else {
        setList(['Nenhum'])
      }
      return
    }

    const withoutNone = currentList.filter((item) => item !== 'Nenhum')
    if (withoutNone.includes(option)) {
      setList(withoutNone.filter((item) => item !== option))
    } else {
      setList([...withoutNone, option])
    }
  }

  // Adicionar item customizado livremente
  const handleAddCustomItem = (
    value: string,
    setValue: (val: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const withoutNone = list.filter((item) => item !== 'Nenhum')
    if (!withoutNone.includes(trimmed)) {
      setList([...withoutNone, trimmed])
    }
    setValue('')
  }

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      setActiveTab('pessoal')
      setErrorMessage('O Nome Completo é obrigatório para cadastrar o paciente.')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      // Normalização de altura em metros para o banco
      let alturaFinal: number | null = null
      if (alturaCm) {
        const parsed = parseFloat(alturaCm.replace(',', '.'))
        if (!isNaN(parsed) && parsed > 0) {
          alturaFinal = parsed > 3 ? parsed / 100 : parsed
        }
      }

      const pesoFinal = pesoAtual ? parseFloat(pesoAtual.replace(',', '.')) : null
      const refeicoesFinal = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null
      const aguaFinal = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null

      const newRecord = await createPaciente(nutricionistaId, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: whatsapp.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial: pesoFinal,
        altura: alturaFinal,
        objetivos: objetivosSelecionados.length > 0 ? objetivosSelecionados : null,
        objetivo_texto: objetivoTextoLivre.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesFinal,
        horario_acorda: horarioAcorda.trim() || null,
        horario_dorme: horarioDorme.trim() || null,
        litros_agua: aguaFinal,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao:
          praticaAtividadeFisica && atividadeFisicaDescricao.trim()
            ? atividadeFisicaDescricao.trim()
            : null,
        observacoes: observacoes.trim() || null,
      })

      setSaveSuccess(true)

      // Aguarda 700ms para feedback visual e redireciona ao perfil do paciente
      setTimeout(() => {
        if (newRecord?.id) {
          onSuccess(newRecord.id)
        } else {
          onCancel()
        }
      }, 700)
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err)
      setErrorMessage(
        err?.message || 'Ocorreu um erro ao salvar o paciente no Neon. Tente novamente.'
      )
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Barra superior de navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onCancel}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cadastro Completo do Prontuário</span>
        </div>
      </div>

      {/* Título da Página */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
            <User className="w-5 h-5" />
          </div>
          <span>Cadastrar Novo Paciente</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Preencha os dados pessoais, clínicos e hábitos de vida. O único campo obrigatório é o <strong>Nome completo</strong>.
        </p>
      </div>

      {/* Alerta de Sucesso */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Paciente cadastrado com sucesso!</h4>
            <p className="text-xs text-emerald-700">
              Redirecionando agora para o perfil completo do paciente...
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Navegação entre as 3 Abas (Pessoal, Clínico, Hábitos) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Aba 1 — Pessoal</span>
          {nome.trim() && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" title="Preenchido" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-4 h-4 shrink-0" />
          <span>Aba 2 — Clínico</span>
          {(pesoAtual || alturaCm || objetivosSelecionados.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" title="Preenchido" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
          }`}
        >
          <Coffee className="w-4 h-4 shrink-0" />
          <span>Aba 3 — Hábitos</span>
          {(litrosAgua || refeicoesPorDia || praticaAtividadeFisica !== null) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" title="Preenchido" />
          )}
        </button>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* ABA 1: PESSOAL */}
            {activeTab === 'pessoal' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Dados Pessoais e de Contato
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Identificação básica do paciente no consultório
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nome Completo (obrigatório) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="nome" className="text-slate-800 font-semibold text-sm">
                        Nome Completo <span className="text-emerald-600 font-bold">*</span>
                      </Label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Único campo obrigatório
                      </span>
                    </div>
                    <Input
                      id="nome"
                      required
                      placeholder="Ex: Amanda Silva Santos"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="text-base h-11 bg-white focus:ring-emerald-500"
                    />
                  </div>

                  {/* Data de Nascimento com Idade Calculada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="dataNascimento" className="text-slate-800 font-semibold text-sm">
                          Data de Nascimento
                        </Label>
                        {idadeCalculada && (
                          <Badge variant="outline" className="text-emerald-800 bg-emerald-50 border-emerald-200 text-xs">
                            Idade: {idadeCalculada}
                          </Badge>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="h-11 bg-white"
                        />
                      </div>
                    </div>

                    {/* Sexo (seleção única: Feminino, Masculino, Outro) */}
                    <div>
                      <Label className="text-slate-800 font-semibold text-sm block mb-1.5">
                        Sexo
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSexo(s)}
                            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                              sexo === s
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

                  {/* WhatsApp e Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="whatsapp" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        WhatsApp (número formatado)
                      </Label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={whatsapp}
                          onChange={handleWhatsAppChange}
                          className="h-11 pl-10 bg-white"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Formato automático com DDD
                      </span>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-slate-800 font-semibold text-sm block mb-1.5">
                        E-mail
                      </Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="paciente@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 pl-10 bg-white"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Para envio de planos e orientações
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeTab === 'clinico' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-emerald-600" />
                    Avaliação Clínica e Nutricional
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Biometria, objetivos, condições de saúde, restrições e histórico
                  </p>
                </div>

                {/* Peso, Altura e IMC Automático */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  {/* Peso atual */}
                  <div>
                    <Label htmlFor="peso" className="text-slate-800 font-semibold text-xs block mb-1">
                      Peso Atual (kg)
                    </Label>
                    <div className="relative">
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        value={pesoAtual}
                        onChange={(e) => setPesoAtual(e.target.value)}
                        className="h-11 pr-12 bg-white"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Altura em cm */}
                  <div>
                    <Label htmlFor="altura" className="text-slate-800 font-semibold text-xs block mb-1">
                      Altura em cm
                    </Label>
                    <div className="relative">
                      <Input
                        id="altura"
                        type="number"
                        step="1"
                        placeholder="175"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        className="h-11 pr-12 bg-white"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* IMC Calculado Automaticamente */}
                  <div className="flex flex-col justify-end">
                    <Label className="text-slate-800 font-semibold text-xs block mb-1">
                      IMC (Calculado automaticamente)
                    </Label>
                    <div className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {imcInfo ? `${imcInfo.valor} kg/m²` : '—'}
                      </span>
                      {imcInfo && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${imcInfo.colorClass}`}>
                          {imcInfo.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos Nutricionais (múltipla escolha + campo livre) */}
                <div className="space-y-2">
                  <Label className="text-slate-800 font-semibold text-sm block">
                    Objetivo Clínico e Nutricional
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_OPCOES.map((obj) => {
                      const isSelected = objetivosSelecionados.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setObjetivosSelecionados(
                                objetivosSelecionados.filter((o) => o !== obj)
                              )
                            } else {
                              setObjetivosSelecionados([...objetivosSelecionados, obj])
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{obj}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-1.5">
                    <Input
                      placeholder="Outro objetivo ou complemento livre (Ex: Ganho de força para corrida)..."
                      value={objetivoTextoLivre}
                      onChange={(e) => setObjetivoTextoLivre(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Nível de Atividade Física (seleção única) */}
                <div className="space-y-2">
                  <Label className="text-slate-800 font-semibold text-sm block">
                    Nível de Atividade Física
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setNivelAtividade(nivel)}
                        className={`py-2.5 px-2 rounded-xl border text-xs text-center font-medium transition-all ${
                          nivelAtividade === nivel
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias ou Condições de Saúde (múltipla escolha + Nenhum + campo livre) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-800 font-semibold text-sm">
                      Patologias ou Condições de Saúde
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      Selecione ou digite abaixo
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Opção "Nenhum" */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOptionWithNone(patologias, setPatologias, 'Nenhum')
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Nenhum
                    </button>

                    {PATOLOGIAS_OPCOES.map((pat) => {
                      const isSelected = patologias.includes(pat)
                      return (
                        <button
                          key={pat}
                          type="button"
                          onClick={() =>
                            handleToggleOptionWithNone(patologias, setPatologias, pat)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {pat}
                        </button>
                      )
                    })}

                    {/* Chips livres adicionados pelo usuário */}
                    {patologias
                      .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPatologias(patologias.filter((p) => p !== custom))
                            }
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra patologia..."
                      value={customPatologiaInput}
                      onChange={(e) => setCustomPatologiaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(
                            customPatologiaInput,
                            setCustomPatologiaInput,
                            patologias,
                            setPatologias
                          )
                        }
                      }}
                      className="bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddCustomItem(
                          customPatologiaInput,
                          setCustomPatologiaInput,
                          patologias,
                          setPatologias
                        )
                      }
                      className="text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares (múltipla escolha + Nenhum + campo livre) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-800 font-semibold text-sm">
                      Restrições Alimentares
                    </Label>
                    <span className="text-[11px] text-slate-400">Dietas e intolerâncias</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOptionWithNone(restricoes, setRestricoes, 'Nenhum')
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        restricoes.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Nenhum
                    </button>

                    {RESTRICOES_OPCOES.map((rest) => {
                      const isSelected = restricoes.includes(rest)
                      return (
                        <button
                          key={rest}
                          type="button"
                          onClick={() =>
                            handleToggleOptionWithNone(restricoes, setRestricoes, rest)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {rest}
                        </button>
                      )
                    })}

                    {restricoes
                      .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setRestricoes(restricoes.filter((r) => r !== custom))
                            }
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra restrição alimentar..."
                      value={customRestricaoInput}
                      onChange={(e) => setCustomRestricaoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(
                            customRestricaoInput,
                            setCustomRestricaoInput,
                            restricoes,
                            setRestricoes
                          )
                        }
                      }}
                      className="bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddCustomItem(
                          customRestricaoInput,
                          setCustomRestricaoInput,
                          restricoes,
                          setRestricoes
                        )
                      }
                      className="text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias Alimentares (múltipla escolha + Nenhum + campo livre) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-800 font-semibold text-sm">
                      Alergias Alimentares
                    </Label>
                    <span className="text-[11px] text-slate-400">Reações alérgicas severas</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOptionWithNone(alergias, setAlergias, 'Nenhum')
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        alergias.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Nenhum
                    </button>

                    {ALERGIAS_OPCOES.map((ale) => {
                      const isSelected = alergias.includes(ale)
                      return (
                        <button
                          key={ale}
                          type="button"
                          onClick={() =>
                            handleToggleOptionWithNone(alergias, setAlergias, ale)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {ale}
                        </button>
                      )
                    })}

                    {alergias
                      .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAlergias(alergias.filter((a) => a !== custom))
                            }
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra alergia alimentar..."
                      value={customAlergiaInput}
                      onChange={(e) => setCustomAlergiaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(
                            customAlergiaInput,
                            setCustomAlergiaInput,
                            alergias,
                            setAlergias
                          )
                        }
                      }}
                      className="bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddCustomItem(
                          customAlergiaInput,
                          setCustomAlergiaInput,
                          alergias,
                          setAlergias
                        )
                      }
                      className="text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <Label htmlFor="medicamentos" className="text-slate-800 font-semibold text-sm block mb-1">
                      Medicamentos Contínuos
                    </Label>
                    <textarea
                      id="medicamentos"
                      rows={2}
                      placeholder="Ex: Puran T4 50mcg em jejum, Losartana..."
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="suplementos" className="text-slate-800 font-semibold text-sm block mb-1">
                      Suplementos em Uso
                    </Label>
                    <textarea
                      id="suplementos"
                      rows={2}
                      placeholder="Ex: Creatina 5g/dia, Whey protein isolado, Vitamina D..."
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeTab === 'habitos' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-emerald-600" />
                    Rotina e Hábitos de Vida
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Refeições, rotina circadiana, hidratação e atividades
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quantas refeições faz por dia */}
                  <div>
                    <Label htmlFor="refeicoes" className="text-slate-800 font-semibold text-xs block mb-1">
                      Refeições por dia
                    </Label>
                    <div className="relative">
                      <Utensils className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="refeicoes"
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Ex: 4"
                        value={refeicoesPorDia}
                        onChange={(e) => setRefeicoesPorDia(e.target.value)}
                        className="pl-9 bg-white h-11"
                      />
                    </div>
                  </div>

                  {/* Horário que acorda (conversão automática ex: 6 -> 06:00, 630 -> 06:30) */}
                  <div>
                    <Label htmlFor="acorda" className="text-slate-800 font-semibold text-xs block mb-1">
                      Horário que acorda
                    </Label>
                    <div className="relative">
                      <Sun className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="acorda"
                        placeholder="Ex: 6 ou 630"
                        value={horarioAcorda}
                        onChange={(e) => setHorarioAcorda(e.target.value)}
                        onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))}
                        className="pl-9 bg-white h-11"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Formata automático (ex: 630 → 06:30)
                    </span>
                  </div>

                  {/* Horário que dorme (conversão automática ex: 23 -> 23:00, 2230 -> 22:30) */}
                  <div>
                    <Label htmlFor="dorme" className="text-slate-800 font-semibold text-xs block mb-1">
                      Horário que dorme
                    </Label>
                    <div className="relative">
                      <Moon className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="dorme"
                        placeholder="Ex: 23 ou 2230"
                        value={horarioDorme}
                        onChange={(e) => setHorarioDorme(e.target.value)}
                        onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))}
                        className="pl-9 bg-white h-11"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Formata automático (ex: 2230 → 22:30)
                    </span>
                  </div>

                  {/* Quantidade de água por dia */}
                  <div>
                    <Label htmlFor="agua" className="text-slate-800 font-semibold text-xs block mb-1">
                      Água por dia
                    </Label>
                    <div className="relative">
                      <Droplets className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="agua"
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        className="pl-9 pr-14 bg-white h-11"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pratica atividade física (sim/não) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Label className="text-slate-800 font-bold text-sm block">
                        Pratica atividade física?
                      </Label>
                      <p className="text-xs text-slate-500">
                        Exercícios regulares, treinos ou esportes semanais
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white shrink-0">
                      <button
                        type="button"
                        onClick={() => setPraticaAtividadeFisica(true)}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          praticaAtividadeFisica === true
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setPraticaAtividadeFisica(false)}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          praticaAtividadeFisica === false
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Se sim, abre campo de texto */}
                  {praticaAtividadeFisica === true && (
                    <div className="pt-2 animate-fade-in">
                      <Label htmlFor="atividadeDesc" className="text-slate-800 font-semibold text-xs block mb-1">
                        Qual atividade e frequência semanal?
                      </Label>
                      <Input
                        id="atividadeDesc"
                        placeholder="Ex: Musculação 4x por semana e corrida aos sábados (45 min)..."
                        value={atividadeFisicaDescricao}
                        onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                        className="bg-white h-11"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div>
                  <Label htmlFor="observacoes" className="text-slate-800 font-semibold text-sm block mb-1">
                    Observações Gerais
                  </Label>
                  <textarea
                    id="observacoes"
                    rows={3}
                    placeholder="Informações adicionais, preferências alimentares, histórico familiar ou anotações clínicas..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white leading-relaxed"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé de Ações e Navegação entre Abas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div>
            {activeTab === 'clinico' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('pessoal')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Aba Anterior (Pessoal)
              </Button>
            )}
            {activeTab === 'habitos' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('clinico')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Aba Anterior (Clínico)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </Button>

            {activeTab === 'pessoal' && (
              <Button
                type="button"
                onClick={() => {
                  if (!nome.trim()) {
                    setErrorMessage('O Nome Completo é obrigatório para avançar.')
                    return
                  }
                  setErrorMessage(null)
                  setActiveTab('clinico')
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Próximo: Clínico</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}

            {activeTab === 'clinico' && (
              <Button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Próximo: Hábitos</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}

            {/* Botão de Salvar */}
            <Button
              type="submit"
              disabled={saving || saveSuccess}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold px-6"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Salvando no Neon...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Paciente Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Salvar Paciente
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
