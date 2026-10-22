import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import {
  getPacienteComHistorico,
  createConsulta,
  type PacienteRecord,
  type ConsultaRecord,
} from '@/lib/neon-db'
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

export const PatientProfile: React.FC<PatientProfileProps> = ({
  pacienteId,
  nutricionistaId,
  onBack,
  onUpdate,
}) => {
  const [paciente, setPaciente] = useState<PacienteRecord | null>(null)
  const [consultas, setConsultas] = useState<ConsultaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewConsultaModal, setShowNewConsultaModal] = useState(false)
  const [savingConsulta, setSavingConsulta] = useState(false)

  // Formulário de nova consulta
  const [consultaData, setConsultaData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await getPacienteComHistorico(pacienteId, nutricionistaId)
        if (res) {
          setPaciente(res.paciente)
          setConsultas(res.consultas)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [pacienteId, nutricionistaId])

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

      // Recarrega dados
      const res = await getPacienteComHistorico(pacienteId, nutricionistaId)
      if (res) {
        setConsultas(res.consultas)
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
      alert('Erro ao registrar consulta. Verifique os dados.')
    } finally {
      setSavingConsulta(false)
    }
  }

  // Cálculo de IMC
  const calcularIMC = (peso?: number | null, altura?: number | null) => {
    if (!peso || !altura || altura <= 0) return null
    const imc = peso / (altura * altura)
    let status = 'Eutrofia'
    let colorClass = 'text-emerald-700 bg-emerald-50'

    if (imc < 18.5) {
      status = 'Baixo peso'
      colorClass = 'text-amber-700 bg-amber-50'
    } else if (imc >= 25 && imc < 30) {
      status = 'Sobrepeso'
      colorClass = 'text-orange-700 bg-orange-50'
    } else if (imc >= 30) {
      status = 'Obesidade'
      colorClass = 'text-red-700 bg-red-50'
    }

    return {
      valor: imc.toFixed(1),
      status,
      colorClass,
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

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 bg-slate-200 rounded-lg" />
          <div className="h-6 w-48 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O paciente solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const pesoAtual = consultas.length > 0 && consultas[0].peso ? consultas[0].peso : paciente.peso_inicial
  const imcInfo = calcularIMC(pesoAtual, paciente.altura)

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Botão Voltar e Cabeçalho do Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar ao Dashboard
        </button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowNewConsultaModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Consulta / Retorno
          </Button>
        </div>
      </div>

      {/* Cartão de Identificação do Paciente */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-700/20">
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
                {paciente.telefone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.telefone}
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

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Peso Inicial</span>
              <span className="text-base font-bold text-slate-800">
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Altura</span>
              <span className="text-base font-bold text-slate-800">
                {paciente.altura ? `${paciente.altura} m` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">IMC Atual</span>
              <span className="text-base font-bold text-slate-800">
                {imcInfo ? imcInfo.valor : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid com Dados Clínicos e Histórico de Consultas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Informações Clínicas & Anamnese */}
        <div className="space-y-6">
          {/* Card de Dados Clínicos */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Dados Clínicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs pt-4">
              {/* Objetivos */}
              <div>
                <span className="text-slate-400 block font-medium">Objetivos</span>
                {paciente.objetivos && paciente.objetivos.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {paciente.objetivos.map((obj, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                ) : null}
                {paciente.objetivo_texto && (
                  <p className="text-slate-700 font-medium mt-1">
                    {paciente.objetivo_texto}
                  </p>
                )}
                {!paciente.objetivo_texto && (!paciente.objetivos || paciente.objetivos.length === 0) && (
                  <p className="text-slate-500 italic mt-0.5">Não informado</p>
                )}
              </div>

              {/* Nível de Atividade */}
              <div>
                <span className="text-slate-400 block font-medium">Nível de Atividade Física</span>
                <span className="inline-block mt-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  {paciente.nivel_atividade || 'Não informado'}
                </span>
              </div>

              {/* Patologias */}
              <div>
                <span className="text-slate-400 block font-medium">Patologias / Condições</span>
                {paciente.patologias && paciente.patologias.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {paciente.patologias.map((pat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-medium border border-rose-200"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic mt-0.5">Nenhuma relatada</p>
                )}
              </div>

              {/* Restrições Alimentares */}
              <div>
                <span className="text-slate-400 block font-medium">Restrições Alimentares</span>
                {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {paciente.restricoes_alimentares.map((res, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic mt-0.5">Nenhuma relatada</p>
                )}
              </div>

              {/* Alergias Alimentares */}
              <div>
                <span className="text-slate-400 block font-medium">Alergias Alimentares</span>
                {paciente.alergias && paciente.alergias.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {paciente.alergias.map((ale, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 font-medium border border-orange-200"
                      >
                        {ale}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic mt-0.5">Nenhuma relatada</p>
                )}
              </div>

              {/* Medicamentos */}
              {paciente.medicamentos && (
                <div>
                  <span className="text-slate-400 block font-medium">Medicamentos Contínuos</span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {paciente.medicamentos}
                  </p>
                </div>
              )}

              {/* Suplementos */}
              {paciente.suplementos && (
                <div>
                  <span className="text-slate-400 block font-medium">Suplementos em Uso</span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {paciente.suplementos}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Rotina e Hábitos */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-600" />
                Rotina e Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Refeições/dia</span>
                  <span className="text-sm font-bold text-slate-800">
                    {paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia}x` : '—'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Água/dia</span>
                  <span className="text-sm font-bold text-slate-800">
                    {paciente.litros_agua ? `${paciente.litros_agua} L` : '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Acorda</span>
                  <span className="text-sm font-bold text-slate-800">
                    {paciente.horario_acorda || '—'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Dorme</span>
                  <span className="text-sm font-bold text-slate-800">
                    {paciente.horario_dorme || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Atividade Física</span>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {paciente.atividade_fisica === true
                    ? 'Sim'
                    : paciente.atividade_fisica === false
                    ? 'Não'
                    : 'Não informado'}
                </p>
                {paciente.atividade_fisica_descricao && (
                  <p className="text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {paciente.atividade_fisica_descricao}
                  </p>
                )}
              </div>

              {paciente.observacoes && (
                <div>
                  <span className="text-slate-400 block font-medium">Observações</span>
                  <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {paciente.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Histórico de Consultas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Histórico de Consultas ({consultas.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewConsultaModal(true)}
              className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
            >
              + Adicionar Consulta
            </Button>
          </div>

          {consultas.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Nenhuma consulta registrada ainda
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Registre a primeira avaliação clínica deste paciente para acompanhar sua evolução e retornos.
              </p>
              <Button
                size="sm"
                onClick={() => setShowNewConsultaModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
              >
                Registrar Primeira Consulta
              </Button>
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
                          <span>Retorno agendado: {formatarData(c.proximo_retorno)}</span>
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
                        <span className="text-slate-400 block">Peso</span>
                        <strong className="text-slate-800 text-sm">
                          {c.peso ? `${c.peso} kg` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">% Gordura</span>
                        <strong className="text-slate-800 text-sm">
                          {c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cintura</span>
                        <strong className="text-slate-800 text-sm">
                          {c.cintura ? `${c.cintura} cm` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Quadril</span>
                        <strong className="text-slate-800 text-sm">
                          {c.quadril ? `${c.quadril} cm` : '—'}
                        </strong>
                      </div>
                    </div>

                    {c.observacoes && (
                      <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100/80">
                        <strong>Obs:</strong> {c.observacoes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Diálogo para Registrar Consulta */}
      {showNewConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Registrar Consulta / Retorno
                </h3>
                <p className="text-xs text-slate-500">
                  Paciente: {paciente.nome}
                </p>
              </div>
              <button
                onClick={() => setShowNewConsultaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsulta} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="data_consulta">Data da Consulta</Label>
                  <Input
                    id="data_consulta"
                    type="date"
                    required
                    value={consultaData.data_consulta}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, data_consulta: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="proximo_retorno">Próximo Retorno</Label>
                  <Input
                    id="proximo_retorno"
                    type="date"
                    value={consultaData.proximo_retorno}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, proximo_retorno: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="peso">Peso (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={consultaData.peso}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, peso: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gordura">% Gordura</Label>
                  <Input
                    id="gordura"
                    type="number"
                    step="0.1"
                    placeholder="22.0"
                    value={consultaData.percentual_gordura}
                    onChange={(e) =>
                      setConsultaData({
                        ...consultaData,
                        percentual_gordura: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cintura">Cintura (cm)</Label>
                  <Input
                    id="cintura"
                    type="number"
                    step="0.5"
                    placeholder="75"
                    value={consultaData.cintura}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, cintura: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quadril">Quadril (cm)</Label>
                  <Input
                    id="quadril"
                    type="number"
                    step="0.5"
                    placeholder="98"
                    value={consultaData.quadril}
                    onChange={(e) =>
                      setConsultaData({ ...consultaData, quadril: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Clínicas</Label>
                <textarea
                  id="observacoes"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Orientações nutricionais, evolução, sintomas relatados..."
                  value={consultaData.observacoes}
                  onChange={(e) =>
                    setConsultaData({ ...consultaData, observacoes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewConsultaModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingConsulta}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {savingConsulta ? 'Salvando no Neon...' : 'Salvar Consulta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
