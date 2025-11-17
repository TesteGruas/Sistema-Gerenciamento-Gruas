"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  Calendar,
  MapPin,
  LogOut,
  Edit,
  Save,
  X,
  Camera,
  Clock,
  FileText,
  CheckCircle,
  ShieldCheck,
  Users,
  Monitor,
  Smartphone,
  Eye,
  ExternalLink,
  CheckSquare,
  Building2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePWAUser } from "@/hooks/use-pwa-user"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { useEmpresa } from "@/hooks/use-empresa"

export default function PWAPerfilPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, pontoHoje, documentosPendentes, horasTrabalhadas, loading } = usePWAUser()
  const { userRole } = usePWAPermissions()
  const { empresa, getEnderecoCompleto, getContatoCompleto, getHorarioFuncionamento } = useEmpresa()
  
  // Verificar se é admin - verificar também no localStorage como fallback
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const userDataFromStorage = localStorage.getItem('user_data')
      const parsedUserData = userDataFromStorage ? JSON.parse(userDataFromStorage) : null
      const userRoleFromStorage = parsedUserData?.role || parsedUserData?.cargo
      
      const adminCheck = userRole === 'Admin' || 
                        userRoleFromStorage === 'Admin' || 
                        userRoleFromStorage === 'admin' || 
                        userRoleFromStorage === 'Administrador' ||
                        (typeof userRoleFromStorage === 'string' && userRoleFromStorage.toLowerCase().includes('admin'))
      
      setIsAdmin(adminCheck)
    } catch (error) {
      console.warn('Erro ao verificar se é admin:', error)
      setIsAdmin(false)
    }
  }, [userRole])
  
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    telefone: '',
    email: ''
  })
  const [isSimulatingManager, setIsSimulatingManager] = useState(false)
  const [funcionarioCompleto, setFuncionarioCompleto] = useState<any>(null)
  const [loadingFuncionario, setLoadingFuncionario] = useState(true)

  // Carregar dados completos do funcionário da API
  useEffect(() => {
    const carregarFuncionarioCompleto = async () => {
      if (!user || typeof window === 'undefined') {
        setLoadingFuncionario(false)
        return
      }

      try {
        setLoadingFuncionario(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          setLoadingFuncionario(false)
          return
        }

        let funcionarioId: number | null = null
        
        try {
          funcionarioId = await getFuncionarioIdWithFallback(
            user,
            token,
            'ID do funcionário não encontrado'
          )
        } catch (idError) {
          // Se não encontrar o ID, não é um erro crítico - apenas logar e continuar
          console.warn('ID do funcionário não encontrado, usando dados do localStorage:', idError)
          setLoadingFuncionario(false)
          return
        }

        if (funcionarioId) {
          try {
            const response = await funcionariosApi.obterFuncionario(funcionarioId)
            if (response.success && response.data) {
              setFuncionarioCompleto(response.data)
              // Atualizar userData com dados da API
              setUserData({
                telefone: response.data.telefone || '',
                email: response.data.email || user.email || ''
              })
            }
          } catch (apiError) {
            console.warn('Erro ao buscar dados do funcionário da API, usando dados do localStorage:', apiError)
            // Não é um erro crítico - continuar com dados do localStorage
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do funcionário, usando dados do localStorage:', error)
      } finally {
        setLoadingFuncionario(false)
      }
    }

    carregarFuncionarioCompleto()
    
    // Carregar estado de simulação do localStorage
    const simulatingManager = localStorage.getItem('simulating_manager') === 'true'
    setIsSimulatingManager(simulatingManager)
  }, [user])

  const handleToggleSimulateManager = (checked: boolean) => {
    setIsSimulatingManager(checked)
    localStorage.setItem('simulating_manager', checked.toString())
    
    // Atualizar dados do usuário no localStorage para incluir cargo de gestor
    if (checked) {
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
      const updatedUser = {
        ...currentUser,
        cargo_original: currentUser.cargo,
        cargo: 'Encarregador Simulado'
      }
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      
      toast({
        title: "✅ Modo Gestor Ativado",
        description: "Você agora tem acesso a funcionalidades de encarregador",
        variant: "default"
      })
      
      // Recarregar página para aplicar mudanças
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
      const updatedUser = {
        ...currentUser,
        cargo: currentUser.cargo_original || currentUser.cargo
      }
      delete updatedUser.cargo_original
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      
      toast({
        title: "Modo Gestor Desativado",
        description: "Você voltou ao seu cargo original",
        variant: "default"
      })
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    })
    
    // Como estamos na página PWA, sempre redirecionar para /pwa/login
    router.push('/pwa/login')
  }

  const handleSave = async () => {
    try {
      // Aqui você faria a chamada para a API para atualizar os dados
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Não foi possível carregar os dados do perfil</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto e Informações Principais */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {funcionarioCompleto?.nome || user.nome || 'Usuário'}
              </h2>
              <p className="text-gray-600 mb-2">
                {funcionarioCompleto?.cargo || user.cargo || 'Sem cargo'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
                <Badge variant="outline">
                  ID: {user.id}
                </Badge>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Hoje</p>
                <p className="text-lg font-bold text-gray-900">{horasTrabalhadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Ponto</p>
                <p className="text-lg font-bold text-green-600">
                  {pontoHoje?.entrada ? 'Registrado' : 'Pendente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-lg font-bold text-orange-600">{documentosPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links de Teste - Apenas para Admin */}
      {isAdmin && (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Eye className="w-5 h-5" />
            Links de Teste
            <Badge variant="outline" className="text-xs">Desenvolvimento</Badge>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Acesso rápido às páginas de teste do sistema de aprovação de horas extras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Assinatura Digital */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacao-assinatura')}
            >
              <Monitor className="w-4 h-4 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-800">Assinatura Digital</p>
                <p className="text-xs text-blue-600">Aprovar horas extras com assinatura</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-blue-500" />
            </Button>

            {/* PWA de Aprovações */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacoes')}
            >
              <Smartphone className="w-4 h-4 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-800">Minhas Aprovações</p>
                <p className="text-xs text-green-600">Interface mobile para funcionários</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-green-500" />
            </Button>

            {/* Aprovação em Massa */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacao-massa')}
            >
              <CheckSquare className="w-4 h-4 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-800">Aprovação em Massa</p>
                <p className="text-xs text-purple-600">Selecionar múltiplas aprovações</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-purple-500" />
            </Button>

            {/* Página de Demonstração */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => window.open('/teste-aprovacoes', '_blank')}
            >
              <Eye className="w-4 h-4 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-800">Demonstração Completa</p>
                <p className="text-xs text-purple-600">Todas as funcionalidades em uma página</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-purple-500" />
            </Button>

            {/* Fluxo de Demonstração */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/fluxo-aprovacao-demo')}
            >
              <Calendar className="w-4 h-4 mr-3 text-indigo-600" />
              <div className="text-left">
                <p className="font-medium text-indigo-800">Fluxo de Aprovação</p>
                <p className="text-xs text-indigo-600">Demonstração completa do processo</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-indigo-500" />
            </Button>

            {/* Navegação de Teste */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => window.open('/navegacao-teste', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-3 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">Navegação de Teste</p>
                <p className="text-xs text-gray-600">Acesso rápido a todas as páginas</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-500" />
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Informações</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>Assinatura:</strong> Para gestores aprovarem com assinatura digital</li>
              <li>• <strong>PWA:</strong> Para funcionários acompanharem aprovações</li>
              <li>• <strong>Massa:</strong> Selecionar múltiplas aprovações para assinar</li>
              <li>• <strong>Demonstração:</strong> Visualização completa do sistema</li>
              <li>• <strong>Fluxo:</strong> Processo completo passo a passo</li>
              <li>• <strong>Navegação:</strong> Links organizados para testes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Modo de Teste - Simular Gestor - Apenas para Admin */}
      {isAdmin && (
      <Card className={isSimulatingManager ? "border-2 border-orange-500 bg-orange-50" : "border border-gray-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Modo de Teste - Simular Gestor
            {isSimulatingManager && (
              <Badge className="bg-orange-600 text-white">
                Ativo
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Ative esta opção para testar funcionalidades de encarregador/supervisor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSimulatingManager ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Users className={`w-5 h-5 ${isSimulatingManager ? 'text-orange-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">Simular cargo de Encarregador</p>
                  <p className="text-sm text-gray-600">
                    {isSimulatingManager 
                      ? 'Você tem acesso às funções de aprovação' 
                      : 'Ative para testar aprovações de ponto e horas extras'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSimulatingManager}
                onCheckedChange={handleToggleSimulateManager}
              />
            </div>

            {isSimulatingManager && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Modo Gestor Ativo</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Você agora tem acesso a:
                    </p>
                    <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Página do Encarregador no menu</li>
                      <li>Aprovação de horas extras</li>
                      <li>Gestão de funcionários</li>
                      <li>Relatórios de equipe</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informações de contato e identificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                E-mail
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">
                  {funcionarioCompleto?.email || userData.email || user.email || 'Não informado'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="telefone">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </Label>
              {isEditing ? (
                <Input
                  id="telefone"
                  type="tel"
                  value={userData.telefone}
                  onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">
                  {funcionarioCompleto?.telefone || userData.telefone || 'Não informado'}
                </p>
              )}
            </div>

            <div>
              <Label>
                <Briefcase className="w-4 h-4 inline mr-2" />
                Cargo
              </Label>
              <p className="mt-1 text-gray-900">
                {funcionarioCompleto?.cargo || user.cargo || 'Não informado'}
              </p>
            </div>

            <div>
              <Label>
                <Calendar className="w-4 h-4 inline mr-2" />
                Data de Admissão
              </Label>
              <p className="mt-1 text-gray-900">
                {funcionarioCompleto?.data_admissao 
                  ? new Date(funcionarioCompleto.data_admissao).toLocaleDateString('pt-BR')
                  : (user as any).dataAdmissao 
                    ? new Date((user as any).dataAdmissao).toLocaleDateString('pt-BR')
                    : 'Não informado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ponto Hoje */}
      {pontoHoje && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Ponto Hoje</CardTitle>
            <CardDescription>Horários registrados no dia de hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Entrada</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.entrada 
                    ? new Date(pontoHoje.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Saída Almoço</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.saida_almoco 
                    ? new Date(pontoHoje.saida_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Volta Almoço</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.volta_almoco 
                    ? new Date(pontoHoje.volta_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Saída</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.saida 
                    ? new Date(pontoHoje.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações da Empresa */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>Dados de contato e localização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Endereço</Label>
            <p className="text-sm text-gray-900 mt-1">{getEnderecoCompleto()}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Contato</Label>
            <p className="text-sm text-gray-900 mt-1">{getContatoCompleto()}</p>
          </div>
          {empresa.horario_funcionamento && (
            <div>
              <Label className="text-xs text-gray-500">Horário de Funcionamento</Label>
              <p className="text-sm text-gray-900 mt-1">{getHorarioFuncionamento()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Logout */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Aplicativo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

