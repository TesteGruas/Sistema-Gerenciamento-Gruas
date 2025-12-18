"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Edit,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  UserX,
  Lock,
  Unlock,
  Activity,
  Settings,
  Key
} from "lucide-react"
import AdminGuard from "@/components/admin-guard"
import { apiUsuarios, type Usuario } from "@/lib/api-usuarios"

const roleLabels = {
  admin: "Administrador",
  gestor: "Gestor",
  cliente: "Cliente", 
  funcionario_nivel_1: "Funcionário Nível 1",
  funcionario_nivel_2: "Funcionário Nível 2",
  funcionario_nivel_3: "Funcionário Nível 3"
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  gestor: "bg-purple-100 text-purple-800", 
  cliente: "bg-blue-100 text-blue-800",
  funcionario_nivel_1: "bg-green-100 text-green-800",
  funcionario_nivel_2: "bg-yellow-100 text-yellow-800",
  funcionario_nivel_3: "bg-orange-100 text-orange-800"
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800"
}

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo", 
  suspended: "Suspenso"
}

interface UsuarioDetalhes {
  id: number
  name: string
  email: string
  phone?: string
  role: string
  status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'
  createdAt: string
  lastLogin?: string
  permissions: string[]
  profile?: {
    department?: string
    position?: string
    hireDate?: string
    manager?: string
  }
  activity?: Array<{
    id: string
    action: string
    timestamp: string
    ip?: string
  }>
}

export default function UsuarioDetalhesPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [usuario, setUsuario] = useState<UsuarioDetalhes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsuario = async () => {
      try {
        setLoading(true)
        const userId = parseInt(params.id as string)
        
        if (isNaN(userId)) {
          toast({
            title: "Erro",
            description: "ID de usuário inválido",
            variant: "destructive"
          })
          router.push('/dashboard/usuarios')
          return
        }

        // Buscar usuário da API
        const usuarioData = await apiUsuarios.buscar(userId)
        
        // Buscar atividades do usuário
        let atividades: Array<{
          id: string
          action: string
          timestamp: string
          ip?: string
        }> = []
        
        try {
          const atividadesResponse = await apiUsuarios.buscarAtividades(userId, { limit: 50 })
          atividades = atividadesResponse.data.map((atividade) => ({
            id: atividade.id,
            action: atividade.titulo || `${atividade.acao} em ${atividade.entidade}`,
            timestamp: atividade.timestamp,
            ip: atividade.ip_address
          }))
        } catch (error) {
          console.warn('Erro ao carregar atividades do usuário:', error)
          // Não bloquear o carregamento se falhar
        }
        
        // Converter dados da API para o formato esperado
        const usuarioDetalhes: UsuarioDetalhes = {
          id: usuarioData.id,
          name: usuarioData.nome,
          email: usuarioData.email,
          phone: usuarioData.telefone,
          role: usuarioData.usuario_perfis 
            ? (Array.isArray(usuarioData.usuario_perfis) 
                ? usuarioData.usuario_perfis[0]?.perfis?.nome || usuarioData.cargo || 'funcionario'
                : usuarioData.usuario_perfis.perfis?.nome || usuarioData.cargo || 'funcionario')
            : usuarioData.cargo || 'funcionario',
          status: usuarioData.status,
          createdAt: usuarioData.created_at,
          lastLogin: usuarioData.ultimo_acesso,
          permissions: usuarioData.usuario_perfis
            ? (Array.isArray(usuarioData.usuario_perfis) 
                ? ['*'] // Admin ou gestor tem todas as permissões
                : ['*'])
            : [],
          profile: {
            department: usuarioData.cargo,
            position: usuarioData.cargo,
            hireDate: usuarioData.data_admissao,
          },
          activity: atividades
        }
        
        setUsuario(usuarioDetalhes)
      } catch (error: any) {
        console.error('Erro ao carregar usuário:', error)
        toast({
          title: "Erro",
          description: error.message || "Erro ao carregar dados do usuário",
          variant: "destructive"
        })
        router.push('/dashboard/usuarios')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadUsuario()
    }
  }, [params.id, router, toast])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'gestor': return <Settings className="w-4 h-4" />
      case 'cliente': return <User className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <UserX className="w-4 h-4" />
      case 'suspended': return <Lock className="w-4 h-4" />
      default: return <UserX className="w-4 h-4" />
    }
  }

  const toggleUserStatus = async () => {
    if (!usuario) return
    
    try {
      const newStatus = usuario.status === 'Ativo' ? 'Inativo' : 'Ativo'
      
      // Atualizar na API
      await apiUsuarios.atualizar(usuario.id, { status: newStatus })
      
      // Atualizar estado local
      setUsuario({ ...usuario, status: newStatus })
      
      toast({
        title: "Sucesso",
        description: `Usuário ${newStatus === 'Ativo' ? 'ativado' : 'desativado'} com sucesso!`,
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar status do usuário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status do usuário",
        variant: "destructive"
      })
    }
  }

  if (loading || !usuario) {
    return (
      <AdminGuard>
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando dados do usuário...</p>
            </div>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{usuario.name}</h1>
              <p className="text-gray-600">Detalhes do usuário</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={toggleUserStatus}
              className={usuario.status === 'Ativo' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
            >
              {usuario.status === 'Ativo' ? <UserX className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                <p className="font-medium">{usuario.name}</p>
                <p className="text-sm text-gray-500">{usuario.profile?.position || usuario.role}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{usuario.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{usuario.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{usuario.profile?.hireDate ? `Admitido em ${new Date(usuario.profile.hireDate).toLocaleDateString('pt-BR')}` : 'Data de admissão não informada'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Acesso e Permissões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={roleColors[usuario.role as keyof typeof roleColors]}>
                  {getRoleIcon(usuario.role)}
                  <span className="ml-1">{roleLabels[usuario.role as keyof typeof roleLabels]}</span>
                </Badge>
              </div>
              <div>
                <Badge className={
                  usuario.status === 'Ativo' ? statusColors.active :
                  usuario.status === 'Inativo' ? statusColors.inactive :
                  statusColors.suspended
                }>
                  {getStatusIcon(usuario.status === 'Ativo' ? 'active' : usuario.status === 'Inativo' ? 'inactive' : 'suspended')}
                  <span className="ml-1">{usuario.status}</span>
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Departamento:</strong> {usuario.profile?.department || 'Não informado'}</p>
                <p><strong>Gerente:</strong> {usuario.profile?.manager || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p><strong>Último Login:</strong></p>
                <p className="text-gray-600">
                  {usuario.lastLogin ? new Date(usuario.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                </p>
              </div>
              <div className="text-sm">
                <p><strong>Conta Criada:</strong></p>
                <p className="text-gray-600">
                  {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-sm">
                <p><strong>Status da Conta:</strong></p>
                <p className="text-gray-600">
                  {usuario.status === 'Ativo' ? 'Ativa e funcionando' : usuario.status}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Detalhes */}
        <Tabs defaultValue="permissoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            <TabsTrigger value="atividade">Atividade</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Permissões do Sistema
                </CardTitle>
                <CardDescription>
                  Lista de todas as permissões atribuídas a este usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usuario.permissions && usuario.permissions.length > 0 ? (
                    usuario.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {permission === '*' || permission === 'all' ? 'Acesso Total' : permission.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-500">Nenhuma permissão específica</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividade" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Histórico de Atividades
                </CardTitle>
                <CardDescription>
                  Registro de todas as ações realizadas por este usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuario.activity && usuario.activity.length > 0 ? (
                    usuario.activity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.timestamp).toLocaleString('pt-BR')}
                            </span>
                            {activity.ip && <span>IP: {activity.ip}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma atividade registrada</p>
                      <p className="text-sm text-gray-400 mt-1">O histórico de atividades aparecerá aqui quando disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações da Conta
                </CardTitle>
                <CardDescription>
                  Configurações específicas para este usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Notificações por Email</label>
                    <p className="text-sm text-gray-500">Receber notificações importantes</p>
                    <Badge variant="outline" className="mt-1">Ativado</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Autenticação em 2 Fatores</label>
                    <p className="text-sm text-gray-500">Segurança adicional para login</p>
                    <Badge variant="outline" className="mt-1">Desativado</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sessão Simultânea</label>
                    <p className="text-sm text-gray-500">Permitir múltiplas sessões</p>
                    <Badge variant="outline" className="mt-1">Permitido</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Logs de Atividade</label>
                    <p className="text-sm text-gray-500">Registrar todas as ações</p>
                    <Badge variant="outline" className="mt-1">Ativado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  )
}
