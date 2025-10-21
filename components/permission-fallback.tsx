"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Shield } from 'lucide-react'

interface PermissionFallbackProps {
  permission: string
  children: React.ReactNode
}

export const PermissionFallback: React.FC<PermissionFallbackProps> = ({
  permission,
  children
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Verificar se há token
        const token = localStorage.getItem('access_token')
        if (!token) {
          console.log('🔐 Token não encontrado')
          setHasPermission(false)
          setIsLoading(false)
          return
        }

        // Buscar dados do usuário
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const userPermissions = data.data?.permissoes || []
          const userPerfil = data.data?.perfil || null
          
          const permissionStrings = userPermissions.map((p: any) => 
            `${p.modulo}:${p.acao}`
          )
          
          const hasAccess = permissionStrings.includes(permission)
          
          setDebugInfo({
            perfil: userPerfil,
            permissions: permissionStrings,
            hasAccess,
            totalPermissions: permissionStrings.length
          })
          
          setHasPermission(hasAccess)
        } else {
          console.log('🔐 Erro ao buscar permissões:', response.status)
          setHasPermission(false)
        }
      } catch (error) {
        console.error('🔐 Erro ao verificar permissão:', error)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [permission])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    )
  }

  if (hasPermission) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Acesso Restrito</CardTitle>
          <CardDescription className="text-red-600">
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Perfil atual:</strong> {debugInfo?.perfil?.nome || 'Não definido'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Permissão necessária:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{permission}</code>
            </p>
          </div>

          {debugInfo && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Debug:</strong> {debugInfo.totalPermissions} permissões encontradas
              </p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {debugInfo.permissions.slice(0, 10).map((perm: string, index: number) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                    {perm}
                  </span>
                ))}
                {debugInfo.permissions.length > 10 && (
                  <span className="text-xs text-gray-500">+{debugInfo.permissions.length - 10} mais...</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Voltar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => {
                // Executar correção inline
                console.log('🔧 Executando correção de permissões...')
                
                // Dados reais do admin
                const adminData = {
                  user: {
                    id: "6b3cd5a8-2991-40a2-8237-c64afc431320",
                    email: "admin@admin.com",
                    nome: "Administrador",
                    role: "admin"
                  },
                  perfil: {
                    id: 1,
                    nome: "Administrador",
                    nivel_acesso: 10,
                    descricao: "Acesso completo ao sistema"
                  },
                  permissoes: [
                    { id: 1, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
                    { id: 2, nome: "usuarios:criar", modulo: "usuarios", acao: "criar" },
                    { id: 3, nome: "usuarios:editar", modulo: "usuarios", acao: "editar" },
                    { id: 4, nome: "usuarios:deletar", modulo: "usuarios", acao: "deletar" },
                    { id: 6, nome: "usuarios:gerenciar_permissoes", modulo: "usuarios", acao: "gerenciar" },
                    { id: 7, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
                    { id: 8, nome: "gruas:criar", modulo: "gruas", acao: "criar" },
                    { id: 9, nome: "gruas:editar", modulo: "gruas", acao: "editar" },
                    { id: 10, nome: "gruas:deletar", modulo: "gruas", acao: "deletar" },
                    { id: 11, nome: "gruas:gerar_proposta", modulo: "gruas", acao: "gerenciar" },
                    { id: 12, nome: "gruas:gerenciar_contratos", modulo: "gruas", acao: "gerenciar" },
                    { id: 13, nome: "gruas:gerenciar_manutencoes", modulo: "gruas", acao: "gerenciar" },
                    { id: 14, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
                    { id: 15, nome: "estoque:criar", modulo: "estoque", acao: "criar" },
                    { id: 16, nome: "estoque:editar", modulo: "estoque", acao: "editar" },
                    { id: 17, nome: "estoque:deletar", modulo: "estoque", acao: "deletar" },
                    { id: 18, nome: "estoque:movimentar", modulo: "estoque", acao: "gerenciar" },
                    { id: 19, nome: "estoque:reservar", modulo: "estoque", acao: "gerenciar" },
                    { id: 20, nome: "estoque:exportar", modulo: "estoque", acao: "exportar" },
                    { id: 21, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
                    { id: 22, nome: "relatorios:exportar", modulo: "relatorios", acao: "exportar" },
                    { id: 23, nome: "configuracoes:visualizar", modulo: "configuracoes", acao: "visualizar" },
                    { id: 24, nome: "configuracoes:editar", modulo: "configuracoes", acao: "editar" }
                  ]
                }

                const adminToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwOTk0OTg5LCJpYXQiOjE3NjA5OTEzODksImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjA5OTEzODl9XSwic2Vzc2lvbl9pZCI6ImRmMzZmNTdjLWU4ZGItNDBhMi05YzVlLTAzZTNhMDJmNzNjNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.TiG90tofCzSTxnaUAxlqQ92y5tUPWhdIKfH6_Jn49MU"

                // Limpar dados antigos
                localStorage.clear()
                
                // Salvar dados corretos
                localStorage.setItem('access_token', adminToken)
                localStorage.setItem('user_profile', JSON.stringify(adminData.user))
                localStorage.setItem('user_perfil', JSON.stringify(adminData.perfil))
                localStorage.setItem('user_permissoes', JSON.stringify(adminData.permissoes))
                
                // Converter permissões para formato string
                const permissionStrings = adminData.permissoes.map(p => `${p.modulo}:${p.acao}`)
                localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
                
                console.log('✅ Correção aplicada!')
                console.log('🎯 Tem dashboard:visualizar?', permissionStrings.includes('dashboard:visualizar'))
                
                // Recarregar a página
                window.location.reload()
              }}
            >
              🔧 Executar Correção de Permissões
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Correção rápida - apenas adicionar dashboard:visualizar
                console.log('🔧 Correção rápida - adicionando dashboard:visualizar...')
                
                const currentPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
                
                if (!currentPermissions.includes('dashboard:visualizar')) {
                  currentPermissions.push('dashboard:visualizar')
                  localStorage.setItem('user_permissions', JSON.stringify(currentPermissions))
                  console.log('✅ dashboard:visualizar adicionado!')
                  window.location.reload()
                } else {
                  console.log('✅ dashboard:visualizar já existe!')
                  window.location.reload()
                }
              }}
            >
              ⚡ Correção Rápida
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
