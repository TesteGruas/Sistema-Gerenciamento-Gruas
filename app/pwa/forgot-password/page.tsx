'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'

export default function PWAForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/forgot-password', { email })

      if (response.data.success) {
        setSuccess(true)
      }
    } catch (err: any) {
      console.error('Erro ao solicitar redefinição:', err)
      setError(err.response?.data?.error || 'Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription>
              Se o email informado estiver cadastrado, você receberá instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Verifique sua caixa de entrada e também a pasta de spam.
                O link de redefinição expira em 1 hora.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/pwa/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Login
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
            >
              Enviar para outro email
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-[#871b0b]" />
          </div>
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs text-muted-foreground">
                Por questões de segurança, você receberá um email apenas se o endereço
                estiver cadastrado em nosso sistema.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full h-11 bg-[#871b0b] hover:bg-[#6b1509]"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Link de Redefinição
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-4">
              Lembrou sua senha?{' '}
              <Link href="/pwa/login" className="text-[#871b0b] hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}











