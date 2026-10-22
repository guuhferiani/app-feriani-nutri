import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { BrandLogo } from './BrandLogo'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onNavigateToSignUp: () => void
  onSuccess: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onNavigateToSignUp,
  onSuccess,
}) => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.')
      return
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha de acesso.')
      return
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.success) {
        setSuccessMessage('Login realizado com sucesso! Redirecionando...')
        setTimeout(() => {
          onSuccess()
        }, 600)
      } else {
        setErrorMessage(
          result.error || 'Falha ao autenticar. Verifique seu e-mail e senha.'
        )
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Ocorreu um erro inesperado ao conectar. Tente novamente.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl shadow-emerald-900/5 border-emerald-100/80 bg-white/95 backdrop-blur-sm animate-fade-in">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-3">
          <BrandLogo size="md" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription className="text-slate-500">
          Acesse sua área profissional para gerenciar seus pacientes
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-5 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-5 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Email */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email" required>
              E-mail profissional
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu.nome@exemplo.com"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" required>
                Senha
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
          </div>

          {/* Botão Entrar */}
          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-700/20 mt-2"
            isLoading={isLoading}
          >
            {!isLoading && (
              <>
                Entrar no sistema
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Link para Cadastro */}
          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
