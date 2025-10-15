'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenEmail, setTokenEmail] = useState('')
  const [tokenError, setTokenError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`)

        if (response.data.valid) {
          setTokenValid(true)
          setTokenEmail(response.data.email)
        } else {
          setTokenError(response.data.error || 'Token inválido')
        }
      } catch (err: any) {
        console.error('Erro ao validar token:', err)
        setTokenError(err.response?.data?.error || 'Token inválido ou expirado')
      } finally {
        setValidatingToken(false)
      }
    }

    if (token) {
      validateToken()
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword
      })

      if (response.data.success) {
        setSuccess(true)
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err)
      setError(err.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Estado: Validando token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Validando token...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: Token inválido/expirado
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Token Inválido</CardTitle>
            <CardDescription>{tokenError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Este link de redefinição pode ter expirado ou já foi usado.
                Os links são válidos por apenas 1 hora.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              onClick={() => router.push('/auth/forgot-password')}
            >
              Solicitar Novo Link
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Voltar para Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Estado: Sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Você será redirecionado para a página de login em alguns segundos...
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Ir para Login Agora
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Estado: Formulário de redefinição
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha para a conta: <strong>{tokenEmail}</strong>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite novamente sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Indicador de força da senha */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[!@#$%^&*]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Força da senha: {
                    password.length < 6 ? 'Muito fraca' :
                    password.length < 8 ? 'Fraca' :
                    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Forte' :
                    'Média'
                  }
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Redefinir Senha
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-4">
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Voltar para Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

