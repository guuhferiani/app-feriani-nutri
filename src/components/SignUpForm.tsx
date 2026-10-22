import React, { useState } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { BrandLogo } from './BrandLogo'
import { useAuth } from '@/contexts/AuthContext'

interface SignUpFormProps {
  onNavigateToLogin: () => void
  onSuccess: () => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onNavigateToLogin,
  onSuccess,
}) => {
  const { signUp } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Validações em tempo real
  const isPasswordLongEnough = password.length >= 9
  const doPasswordsMatch = password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validação do Nome
    if (!nome.trim() || nome.trim().length < 3) {
      setErrorMessage('Por favor, informe seu nome completo (mínimo de 3 caracteres).')
      return
    }

    // Validação do E-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.')
      return
    }

    // Validação da Senha (mínimo 9 caracteres conforme regra)
    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres para sua segurança.')
      return
    }

    // Validação de confirmação de senha
    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Verifique a confirmação.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(nome, email, password)

      if (result.success) {
        setSuccessMessage(
          'Conta criada com sucesso! Sincronizando dados com o Neon...'
        )
        setTimeout(() => {
          onSuccess()
        }, 800)
      } else {
        setErrorMessage(
          result.error ||
            'Não foi possível criar sua conta. Verifique os dados informados ou tente outro e-mail.'
        )
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Ocorreu um erro ao processar o cadastro. Tente novamente.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl shadow-emerald-900/5 border-emerald-100/80 bg-white/95 backdrop-blur-sm animate-fade-in">
      <CardHeader className="text-center pb-5">
        <div className="flex justify-center mb-3">
          <BrandLogo size="md" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">
          Criar conta profissional
        </CardTitle>
        <CardDescription className="text-slate-500">
          Cadastre-se para iniciar a gestão clínica dos seus pacientes
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-4 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Nome Completo */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-name" required>
              Nome completo
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Dr(a). Maria Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 h-11"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Campo Email */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-email" required>
              E-mail profissional
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-password" required>
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 9 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-0.5"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Requisito de senha (9 caracteres) */}
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              {isPasswordLongEnough ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
              )}
              <span
                className={
                  isPasswordLongEnough
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-500'
                }
              >
                Mínimo de 9 caracteres
              </span>
            </div>
          </div>

          {/* Campo Confirmar Senha */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-confirm-password" required>
              Confirmar senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-0.5"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                {doPasswordsMatch ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-medium">
                      As senhas coincidem
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-amber-600 font-medium">
                      As senhas não conferem
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Destaque de segurança Neon */}
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-2.5 flex items-center gap-2 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Conta integrada e sincronizada automaticamente no <strong>Neon Postgres</strong>.
            </span>
          </div>

          {/* Botão Criar Conta */}
          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-700/20 mt-2"
            isLoading={isLoading}
          >
            {!isLoading && (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>

          {/* Link para Login */}
          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
              >
                Faça login
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
