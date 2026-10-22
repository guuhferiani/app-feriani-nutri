import React, { useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/LoginForm'
import { SignUpForm } from '@/components/SignUpForm'
import { Dashboard } from '@/components/Dashboard'
import { BrandLogo } from '@/components/BrandLogo'
import { ShieldCheck, HeartPulse, Sparkles, CheckCircle2 } from 'lucide-react'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  // Estado de carregamento inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <BrandLogo size="lg" showSubtitle={false} />
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mt-2">
            <svg
              className="h-5 w-5 animate-spin text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Verificando sessão segura...</span>
          </div>
        </div>
      </div>
    )
  }

  // Se o nutricionista já estiver logado, redireciona diretamente para o Dashboard
  if (user) {
    return <Dashboard onLogout={() => setAuthView('login')} />
  }

  // Telas públicas de Autenticação (Login e Cadastro)
  return (
    <div className="min-h-screen health-gradient-bg flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Topo com Logotipo Feriani Nutri */}
      <header className="w-full py-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <BrandLogo size="md" />

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-200/80 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Ambiente Seguro • Neon Auth</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Coluna Informativa / Benefícios (visível em telas médias/grandes) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Gestão Nutricional de Alta Performance
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Potencialize o atendimento dos seus pacientes.
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              O Feriani Nutri foi desenvolvido sob medida para nutricionistas que buscam excelência clínica, planos alimentares inteligentes e total segurança de dados.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900">Histórico Clínico e Anamnese</strong>
                  Acompanhe a evolução e histórico completo dos seus pacientes.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900">Prescrição e Planos Alimentares</strong>
                  Cálculo de dietas e distribuição de macronutrientes.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900">Segurança com Neon Postgres</strong>
                  Proteção de dados com criptografia e Row Level Security (RLS).
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Dedicado a profissionais da saúde e nutrição.</span>
            </div>
          </div>

          {/* Coluna do Formulário (Login ou Cadastro) */}
          <div className="lg:col-span-7 flex justify-center">
            {authView === 'login' ? (
              <LoginForm
                onNavigateToSignUp={() => setAuthView('signup')}
                onSuccess={() => {
                  // O AuthContext atualizará o `user` e causará o redirecionamento para o Dashboard
                }}
              />
            ) : (
              <SignUpForm
                onNavigateToLogin={() => setAuthView('login')}
                onSuccess={() => {
                  // O AuthContext atualizará o `user` e causará o redirecionamento para o Dashboard
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Rodapé institucional */}
      <footer className="w-full py-4 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <p>
          Feriani Nutri &copy; {new Date().getFullYear()} — Plataforma de Gestão Nutricional.
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
