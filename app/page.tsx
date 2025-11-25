"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/app/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Lock, User } from "lucide-react"
import { useEnhancedToast } from "@/hooks/use-enhanced-toast"
import { loadUserPermissions } from "@/lib/auth-permissions"
import { useEmpresa, EmpresaProvider } from "@/hooks/use-empresa"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  return (
    <EmpresaProvider>
      <LoginPageContent />
    </EmpresaProvider>
  )
}

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberEmail, setRememberEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const { showAuthError, showSuccess } = useEnhancedToast()
  const { empresa, getEnderecoCompleto, getContatoCompleto } = useEmpresa()

  // Carregar email salvo ao montar o componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberEmail(true)
    }
  }, [])

  // Verificar se já está logado
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      // Se já tem token, redirecionar para dashboard
      window.location.href = '/dashboard'
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      console.log('Tentando fazer login com:', { email, password })
      
      // Fazer login com as credenciais do formulário
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })

      console.log('Resposta recebida:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro na resposta:', errorData)
        
        // Usar a mensagem do backend se disponível, senão usar mensagem padrão
        const errorMessage = errorData.message || errorData.error || 'Erro no login'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Dados da resposta:', data)
      
      const token = data.data.access_token
      
      if (!token) {
        throw new Error('Token não recebido na resposta')
      }
      
      // Salvar ou remover email conforme a opção "Lembrar email"
      if (rememberEmail) {
        localStorage.setItem('remembered_email', email)
      } else {
        localStorage.removeItem('remembered_email')
      }
      
      // Salvar dados no localStorage
      localStorage.setItem('access_token', token)
      localStorage.setItem('user_profile', JSON.stringify(data.data.profile))
      localStorage.setItem('user_perfil', JSON.stringify(data.data.perfil))
      localStorage.setItem('user_permissoes', JSON.stringify(data.data.permissoes))
      console.log('Dados salvos no localStorage:', {
        token: !!token,
        profile: !!data.data.profile,
        perfil: !!data.data.perfil,
        permissoes: data.data.permissoes?.length || 0
      })
      
      // Carregar permissões do backend antes do redirect
      try {
        console.log('🔐 Carregando permissões do backend...')
        await loadUserPermissions()
        console.log('🔐 Permissões carregadas com sucesso!')
      } catch (error) {
        console.warn('🔐 Aviso: Não foi possível carregar permissões do backend:', error)
        // Continuar mesmo se não conseguir carregar permissões
      }
      
      // Redirecionar para dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Erro no login:', error)
      showAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 relative">
              {empresa.logo ? (
                <Image
                  src={empresa.logo}
                  alt={empresa.nome}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{empresa.nome || "Sistema IRBANA"}</CardTitle>
            <CardDescription>
              Sistema de Gestão Empresarial
              <br />
              <span className="text-xs text-gray-500">{empresa.razao_social || empresa.nome}</span>
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs text-blue-600 hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberEmail"
                checked={rememberEmail}
                onCheckedChange={(checked) => setRememberEmail(checked === true)}
              />
              <Label
                htmlFor="rememberEmail"
                className="text-sm font-normal cursor-pointer"
              >
                Lembrar email
              </Label>
            </div>
            <Button
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
      
      {/* Footer com informações da empresa */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-900">{empresa.razao_social || empresa.nome}</p>
            <p className="text-xs text-gray-600">{getEnderecoCompleto()}</p>
            <p className="text-xs text-gray-600">{getContatoCompleto()}</p>
            {empresa.horario_funcionamento && (
              <p className="text-xs text-gray-600">{empresa.horario_funcionamento}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">© {new Date().getFullYear()} - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
