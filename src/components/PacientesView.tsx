import React, { useEffect, useState } from 'react'
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Mail,
  ChevronRight,
  Calendar,
  Sparkles,
  Target,
  ArrowRight,
  Clock,
} from 'lucide-react'
import {
  getPacientesList,
  type PacienteRecord,
} from '@/lib/neon-db'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface PacientesViewProps {
  nutricionistaId: string
  onSelectPaciente: (pacienteId: string) => void
  onNovoPaciente: () => void
  onSeedDemoData?: () => void
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  nutricionistaId,
  onSelectPaciente,
  onNovoPaciente,
  onSeedDemoData,
}) => {
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPacientes = async () => {
    setLoading(true)
    try {
      const list = await getPacientesList(nutricionistaId)
      setPacientes(list)
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (nutricionistaId) {
      loadPacientes()
    }
  }, [nutricionistaId])

  // Formatação de data (DD/MM/AAAA)
  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return 'Sem consultas'
    const clean = dataStr.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dataStr
  }

  // Obter objetivo formatado para exibição
  const getObjetivoDisplay = (p: PacienteRecord) => {
    if (p.objetivo_texto && p.objetivo_texto.trim()) {
      return p.objetivo_texto
    }
    if (p.objetivos && p.objetivos.length > 0) {
      return p.objetivos.join(', ')
    }
    return 'Não informado'
  }

  // Filtro por nome no topo da listagem
  const filteredPacientes = pacientes.filter((p) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return p.nome.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Cabeçalho da página de Pacientes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              Pacientes
            </h1>
            <Badge variant="outline" className="text-xs font-semibold text-emerald-800 bg-emerald-50 border-emerald-200">
              {pacientes.length} cadastrado(s)
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Listagem e gestão completa dos pacientes cadastrados pela nutricionista logada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={onNovoPaciente}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold px-4"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Campo de Busca por Nome no Topo da Listagem */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar paciente por nome..."
            className="pl-10 bg-white h-11 text-sm shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Pacientes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 bg-slate-200/70 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : pacientes.length === 0 ? (
        /* Se não houver pacientes cadastrados: "Nenhum paciente cadastrado ainda" */
        <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">
              Nenhum paciente cadastrado ainda
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Cadastre seu primeiro paciente com formulário completo de dados pessoais, clínicos e hábitos.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={onNovoPaciente}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>

            {onSeedDemoData && (
              <Button
                variant="outline"
                onClick={async () => {
                  await onSeedDemoData()
                  await loadPacientes()
                }}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Sparkles className="w-4 h-4 mr-2 text-emerald-600" />
                Carregar Pacientes de Exemplo
              </Button>
            )}
          </div>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Busca com 0 resultados */
        <div className="p-10 bg-white rounded-2xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">
            Nenhum paciente encontrado para "{searchTerm}"
          </h4>
          <p className="text-xs text-slate-500">
            Verifique a ortografia do nome ou limpe a busca.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-xs"
          >
            Limpar Busca
          </Button>
        </div>
      ) : (
        /* Grid de Pacientes do Prompt 4 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((p) => {
            const ultimaConsultaText = formatarData(p.ultima_consulta)
            const objetivoText = getObjetivoDisplay(p)

            return (
              <div
                key={p.id}
                onClick={() => onSelectPaciente(p.id)}
                className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                title={`Abrir perfil de ${p.nome}`}
              >
                <div className="space-y-3.5">
                  {/* Topo do Card: Nome e Botão Clicável */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-base flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {/* Nome do paciente */}
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {p.nome}
                        </h4>
                        {/* Contato rápido se houver */}
                        {p.whatsapp || p.telefone ? (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.whatsapp || p.telefone}
                          </span>
                        ) : p.email ? (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[170px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {p.email}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Informações Obrigatórias do Prompt 4 */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    {/* Objetivo */}
                    <div className="flex items-start gap-2">
                      <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="text-slate-400 font-medium block text-[11px]">
                          Objetivo:
                        </span>
                        <span className="text-slate-800 font-semibold line-clamp-1">
                          {objetivoText}
                        </span>
                      </div>
                    </div>

                    {/* Data da Última Consulta */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="text-slate-400 font-medium block text-[11px]">
                          Última consulta:
                        </span>
                        <span
                          className={`font-semibold ${
                            p.ultima_consulta
                              ? 'text-slate-800'
                              : 'text-amber-600 italic text-[11px]'
                          }`}
                        >
                          {ultimaConsultaText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé do card com ação clara */}
                <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {p.peso_inicial ? `${p.peso_inicial} kg` : ''}
                    {p.peso_inicial && p.altura ? ' • ' : ''}
                    {p.altura ? `${p.altura} m` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 group-hover:text-emerald-800 group-hover:underline">
                    <span>Ver Prontuário</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
