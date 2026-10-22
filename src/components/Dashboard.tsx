import React, { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Menu,
  Phone,
  MessageCircle,
  ExternalLink,
  PlusCircle,
  HeartPulse,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDashboardMetrics,
  seedDemoData,
  type DashboardMetrics,
} from '@/lib/neon-db'
import { Sidebar, type NavView } from './Sidebar'
import { PatientProfile } from './PatientProfile'
import { PacientesView } from './PacientesView'
import { NovoPacienteForm } from './NovoPacienteForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface DashboardProps {
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user, nutricionista, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<NavView | 'perfil' | 'novo-paciente'>('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientesAtivos: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    semanaInicio: '',
    semanaFim: '',
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const effectiveNutricionistaId = nutricionista?.id || user?.id || ''

  // Carrega métricas do Neon em tempo real
  const fetchMetrics = useCallback(async () => {
    if (!effectiveNutricionistaId) {
      setLoading(false)
      return
    }

    try {
      const data = await getDashboardMetrics(effectiveNutricionistaId)
      setMetrics(data)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard do Neon:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [effectiveNutricionistaId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
  }

  const handleLogout = async () => {
    await signOut()
    onLogout()
  }

  // Redireciona para o perfil do paciente
  const handleOpenPatientProfile = (pacienteId: string) => {
    setSelectedPatientId(pacienteId)
    setCurrentView('perfil')
  }

  // Gera dados de exemplo caso deseje testar
  const handleSeedDemoData = async () => {
    if (!effectiveNutricionistaId) return
    setSeeding(true)
    try {
      await seedDemoData(effectiveNutricionistaId)
      await fetchMetrics()
    } catch (err) {
      console.error('Erro ao gerar dados de demonstração:', err)
    } finally {
      setSeeding(false)
    }
  }

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '—'
    const clean = dataStr.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dataStr
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Menu Lateral Fixo */}
      <Sidebar
        currentView={currentView === 'perfil' || currentView === 'novo-paciente' ? 'pacientes' : currentView}
        onSelectView={(view) => {
          setSelectedPatientId(null)
          setCurrentView(view)
        }}
        user={{
          nome: nutricionista?.nome || user?.name,
          email: nutricionista?.email || user?.email,
        }}
        onLogout={handleLogout}
        totalPacientes={metrics.totalPacientesAtivos}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Barra superior de utilitários */}
        <header className="sticky top-0 z-20 w-full h-18 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                {currentView === 'dashboard'
                  ? 'Painel Clínico'
                  : currentView === 'pacientes'
                  ? 'Gestão de Pacientes'
                  : currentView === 'novo-paciente'
                  ? 'Cadastro de Prontuário'
                  : 'Prontuário do Paciente'}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {currentView === 'dashboard'
                  ? 'Dashboard Principal'
                  : currentView === 'pacientes'
                  ? 'Lista de Pacientes'
                  : currentView === 'novo-paciente'
                  ? 'Novo Paciente'
                  : 'Perfil do Paciente'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status em tempo real */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Neon em tempo real</span>
            </div>

            {/* Botão de atualização manual */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-slate-600 hover:text-emerald-700 hover:border-emerald-200"
              title="Recarregar dados do Neon"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </header>

        {/* Corpo do Conteúdo Conforme a Rota Ativa */}
        <main className="flex-1">
          {currentView === 'perfil' && selectedPatientId ? (
            <PatientProfile
              pacienteId={selectedPatientId}
              nutricionistaId={effectiveNutricionistaId}
              onBack={() => {
                setSelectedPatientId(null)
                setCurrentView('pacientes')
              }}
              onUpdate={fetchMetrics}
            />
          ) : currentView === 'novo-paciente' ? (
            <NovoPacienteForm
              nutricionistaId={effectiveNutricionistaId}
              onCancel={() => setCurrentView('pacientes')}
              onSuccess={(novoPacienteId) => {
                fetchMetrics()
                setSelectedPatientId(novoPacienteId)
                setCurrentView('perfil')
              }}
            />
          ) : currentView === 'pacientes' ? (
            <PacientesView
              nutricionistaId={effectiveNutricionistaId}
              onSelectPaciente={(id) => handleOpenPatientProfile(id)}
              onNovoPaciente={() => setCurrentView('novo-paciente')}
              onSeedDemoData={handleSeedDemoData}
            />
          ) : (
            /* Dashboard Principal (Prompt 3) */
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
              {/* Banner de Boas-vindas da Nutricionista */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10">
                <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/50 border border-emerald-400/30 text-emerald-100 text-xs font-medium mb-3 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    Bem-vinda de volta
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Olá, {nutricionista?.nome || user?.name || 'Nutricionista'}! 👋
                  </h2>
                  <p className="text-emerald-100/90 text-sm leading-relaxed">
                    Aqui está a visão geral do seu consultório hoje. Acompanhe seus pacientes ativos, consultas programadas e pacientes que necessitam de retorno.
                  </p>
                </div>
              </div>

              {/* Botão de Demonstração (caso o banco esteja vazio ou queira ver dados) */}
              {metrics.totalPacientesAtivos === 0 && !loading && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Comece testando com dados de demonstração
                      </h4>
                      <p className="text-xs text-slate-600">
                        Insira pacientes e consultas de exemplo para visualizar todos os 3 cards do dashboard em tempo real.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSeedDemoData}
                    disabled={seeding}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs shadow-sm"
                  >
                    {seeding ? 'Carregando dados...' : 'Carregar Pacientes de Exemplo'}
                  </Button>
                </div>
              )}

              {/* OS 3 CARDS PRINCIPAIS DO PROMPT 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1 — Total de pacientes ativos */}
                <Card className="border-slate-200/80 hover:border-emerald-200 hover:shadow-lg transition-all duration-200 bg-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-60 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
                        <Users className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50/50 border-emerald-200">
                        Card 1
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 pt-4">
                      Total de pacientes ativos
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Pacientes cadastrados pela nutricionista logada
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 relative z-10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {loading ? '—' : metrics.totalPacientesAtivos}
                      </span>
                      <button
                        onClick={() => setCurrentView('pacientes')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group-hover:underline"
                      >
                        <span>Ver lista</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-emerald-700 bg-emerald-50/70 rounded-xl p-2.5 font-medium border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 shrink-0 text-emerald-600" />
                      <span>Sincronizado diretamente da tabela <code className="font-mono text-emerald-800 font-bold">pacientes</code></span>
                    </div>
                  </CardContent>
                </Card>

                {/* CARD 2 — Consultas da semana */}
                <Card className="border-slate-200/80 hover:border-teal-200 hover:shadow-lg transition-all duration-200 bg-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 opacity-60 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 ring-4 ring-teal-50">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-xs text-teal-800 bg-teal-50/50 border-teal-200">
                        Card 2
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 pt-4">
                      Consultas da semana
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {metrics.semanaInicio && metrics.semanaFim
                        ? `Período da semana atual (${metrics.semanaInicio} a ${metrics.semanaFim})`
                        : 'Consultas registradas na semana corrente'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 relative z-10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {loading ? '—' : metrics.consultasSemana}
                      </span>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                        Semana Atual
                      </span>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-teal-700 bg-teal-50/70 rounded-xl p-2.5 font-medium border border-teal-100">
                      <Clock className="w-3.5 h-3.5 mr-2 shrink-0 text-teal-600" />
                      <span>Sincronizado da tabela <code className="font-mono text-teal-800 font-bold">consultas</code></span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CARD 3 — Pacientes sem retorno */}
              <Card className="border-slate-200/80 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 ring-4 ring-amber-50/60">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold text-slate-900">
                            Card 3 — Pacientes sem retorno
                          </CardTitle>
                          {metrics.pacientesSemRetorno.length > 0 && (
                            <Badge variant="warning" className="text-xs">
                              {metrics.pacientesSemRetorno.length} pendente(s)
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado.
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 space-y-3">
                      <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                      <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    </div>
                  ) : metrics.pacientesSemRetorno.length === 0 ? (
                    /* Mensagem obrigatória do Prompt 3 */
                    <div className="p-12 text-center space-y-3 bg-white">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">
                        Nenhum paciente sem retorno no momento
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Excelente! Todos os seus pacientes atendidos estão com consultas recentes ou possuem próximo retorno devidamente agendado.
                      </p>
                    </div>
                  ) : (
                    /* Lista de Pacientes Sem Retorno */
                    <div className="divide-y divide-slate-100">
                      {metrics.pacientesSemRetorno.map((paciente) => (
                        <div
                          key={paciente.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                              {paciente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              {/* Nome clicável com redirecionamento para o perfil */}
                              <button
                                onClick={() => handleOpenPatientProfile(paciente.id)}
                                className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                                title="Abrir perfil do paciente"
                              >
                                <span>{paciente.nome}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                <span>
                                  Última consulta:{' '}
                                  <strong className="text-slate-700">
                                    {formatarData(paciente.ultima_consulta)}
                                  </strong>
                                </span>
                                {paciente.telefone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {paciente.telefone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Alerta de dias sem retorno */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sem retorno há {paciente.dias_sem_consulta} dias</span>
                            </span>

                            {/* Botão para redirecionar ao perfil do paciente */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPatientProfile(paciente.id)}
                              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 font-semibold"
                            >
                              Ver Perfil
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações complementares de rodapé do Dashboard */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-200/60">
                <span>Feriani Nutri &copy; {new Date().getFullYear()} — Painel Clínico</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <HeartPulse className="w-3.5 h-3.5" />
                  Gestão Nutricional com Neon Serverless Postgres
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
