import React from 'react'
import {
  LayoutDashboard,
  Users,
  LogOut,
  Database,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

export type NavView = 'dashboard' | 'pacientes'

interface SidebarProps {
  currentView: NavView
  onSelectView: (view: NavView) => void
  user: {
    nome?: string
    email?: string
  } | null
  onLogout: () => void
  totalPacientes?: number
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  user,
  onLogout,
  totalPacientes = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'FN'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
    },
    {
      id: 'pacientes' as NavView,
      label: 'Pacientes',
      icon: Users,
      badge: totalPacientes > 0 ? totalPacientes : undefined,
      description: 'Gestão de prontuários',
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Topo com Logo Nutri APP */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
        <BrandLogo
          size="sm"
          title="Nutri"
          highlightTitle="APP"
          subtitle="Gestão Nutricional"
        />
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navegação principal */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id)
                if (onCloseMobile) onCloseMobile()
              }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative text-left',
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-semibold'
                  : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full transition-colors',
                      isActive
                        ? 'bg-white text-emerald-800'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                )}
              </div>
            </button>
          )
        })}

        {/* Separador e Informações de Segurança */}
        <div className="pt-6 px-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Neon Serverless</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Dados sincronizados em tempo real com Row Level Security.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-700">
                Conexão ativa e segura
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Menu com Perfil e Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {getInitials(user?.nome)}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs font-bold text-slate-800 truncate"
                title={user?.nome || 'Nutricionista'}
              >
                {user?.nome || 'Nutricionista'}
              </span>
              <span
                className="text-[11px] text-slate-500 truncate"
                title={user?.email || ''}
              >
                {user?.email || ''}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            title="Sair do sistema"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 h-8 w-8 rounded-lg shrink-0 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar fixo no desktop */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 border-r border-slate-200/80 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Drawer mobile com overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Painel lateral */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
