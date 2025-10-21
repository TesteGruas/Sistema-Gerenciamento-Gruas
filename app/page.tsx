"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/app/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Building2, Lock, User } from "lucide-react"
import { useEnhancedToast } from "@/hooks/use-enhanced-toast"
import { loadUserPermissions } from "@/lib/auth-permissions"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const { showAuthError, showSuccess } = useEnhancedToast()

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Sistema IRBANA</CardTitle>
          <CardDescription>
            Sistema de Gestão Empresarial
            <br />
            <span className="text-xs text-gray-500">IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA</span>
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
            <Button
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-500">
            @Copyright 2025 - IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA 
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
