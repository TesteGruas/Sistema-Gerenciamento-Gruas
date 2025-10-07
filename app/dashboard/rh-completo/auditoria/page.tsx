"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Shield, 
  Search,
  User,
  ArrowLeft,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  UserCheck,
  Settings,
  Lock,
  Unlock
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { rhApi, AuditoriaRH, PerfilUsuario, PermissaoRH } from "@/lib/api-rh-completo"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AuditoriaPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados
  const [auditoria, setAuditoria] = useState<AuditoriaRH[]>([])
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([])
  const [permissoes, setPermissoes] = useState<PermissaoRH[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroTabela, setFiltroTabela] = useState("all")
  const [filtroAcao, setFiltroAcao] = useState("all")
  const [filtroUsuario, setFiltroUsuario] = useState("all")
  const [filtroData, setFiltroData] = useState("7d")
  
  // Estados para modais
  const [isPerfilDialogOpen, setIsPerfilDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<PerfilUsuario | null>(null)
  
  // Formulário de perfil
  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    descricao: '',
    permissoes: [] as number[],
    ativo: true
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar auditoria
      const auditoriaResponse = await rhApi.obterAuditoria()
      setAuditoria(auditoriaResponse.data || [])
      
      // Simular carregamento de perfis e permissões
      const perfisSimulados: PerfilUsuario[] = [
        {
          id: 1,
          nome: 'Administrador RH',
          descricao: 'Acesso total ao módulo de RH',
          permissoes: [],
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          nome: 'Gestor RH',
          descricao: 'Acesso para gestão de funcionários e relatórios',
          permissoes: [],
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          nome: 'Operador RH',
          descricao: 'Acesso básico para operações do dia a dia',
          permissoes: [],
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setPerfis(perfisSimulados)
      
      const permissoesSimuladas: PermissaoRH[] = [
        { id: 1, modulo: 'funcionarios', acao: 'visualizar', descricao: 'Visualizar funcionários' },
        { id: 2, modulo: 'funcionarios', acao: 'criar', descricao: 'Criar funcionários' },
        { id: 3, modulo: 'funcionarios', acao: 'editar', descricao: 'Editar funcionários' },
        { id: 4, modulo: 'funcionarios', acao: 'excluir', descricao: 'Excluir funcionários' },
        { id: 5, modulo: 'cargos', acao: 'visualizar', descricao: 'Visualizar cargos' },
        { id: 6, modulo: 'cargos', acao: 'criar', descricao: 'Criar cargos' },
        { id: 7, modulo: 'cargos', acao: 'editar', descricao: 'Editar cargos' },
        { id: 8, modulo: 'cargos', acao: 'excluir', descricao: 'Excluir cargos' },
        { id: 9, modulo: 'ponto', acao: 'visualizar', descricao: 'Visualizar ponto' },
        { id: 10, modulo: 'ponto', acao: 'aprovar', descricao: 'Aprovar registros de ponto' },
        { id: 11, modulo: 'ferias', acao: 'visualizar', descricao: 'Visualizar férias' },
        { id: 12, modulo: 'ferias', acao: 'aprovar', descricao: 'Aprovar férias' },
        { id: 13, modulo: 'remuneracao', acao: 'visualizar', descricao: 'Visualizar remuneração' },
        { id: 14, modulo: 'remuneracao', acao: 'editar', descricao: 'Editar remuneração' },
        { id: 15, modulo: 'relatorios', acao: 'visualizar', descricao: 'Visualizar relatórios' },
        { id: 16, modulo: 'relatorios', acao: 'excluir', descricao: 'Exportar relatórios' }
      ]
      setPermissoes(permissoesSimuladas)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de auditoria",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar auditoria
  const auditoriaFiltrada = auditoria.filter(item => {
    const matchesSearch = !searchTerm || 
      item.tabela.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.acao.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTabela = filtroTabela === "all" || item.tabela === filtroTabela
    const matchesAcao = filtroAcao === "all" || item.acao === filtroAcao
    const matchesUsuario = filtroUsuario === "all" || item.usuario_id.toString() === filtroUsuario
    
    return matchesSearch && matchesTabela && matchesAcao && matchesUsuario
  })

  // Handlers
  const handleCriarPerfil = async () => {
    try {
      const perfilData = {
        ...perfilForm,
        permissoes: perfilForm.permissoes
      }

      // Simular criação de perfil
      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso!",
      })
      setIsPerfilDialogOpen(false)
      resetPerfilForm()
      await carregarDados()
    } catch (error: any) {
      console.error('Erro ao criar perfil:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive"
      })
    }
  }

  const handleTogglePermissao = (permissaoId: number) => {
    setPerfilForm(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(id => id !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }))
  }

  const resetPerfilForm = () => {
    setPerfilForm({
      nome: '',
      descricao: '',
      permissoes: [],
      ativo: true
    })
  }

  const getAcaoColor = (acao: string) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800'
    }
    return colors[acao as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'CREATE': return <CheckCircle className="w-3 h-3" />
      case 'UPDATE': return <Settings className="w-3 h-3" />
      case 'DELETE': return <XCircle className="w-3 h-3" />
      default: return <AlertTriangle className="w-3 h-3" />
    }
  }

  const getModuloColor = (modulo: string) => {
    const colors = {
      'funcionarios': 'bg-blue-100 text-blue-800',
      'cargos': 'bg-green-100 text-green-800',
      'setores': 'bg-purple-100 text-purple-800',
      'ponto': 'bg-yellow-100 text-yellow-800',
      'ferias': 'bg-orange-100 text-orange-800',
      'remuneracao': 'bg-pink-100 text-pink-800',
      'relatorios': 'bg-indigo-100 text-indigo-800'
    }
    return colors[modulo as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dados de auditoria...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
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
            <h1 className="text-3xl font-bold text-gray-900">Auditoria e Permissões</h1>
            <p className="text-gray-600">Controle de acesso, permissões e trilha de auditoria</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsPerfilDialogOpen(true)}>
            <UserCheck className="w-4 h-4 mr-2" />
            Novo Perfil
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Tabela, usuário ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tabela">Tabela</Label>
              <Select value={filtroTabela} onValueChange={setFiltroTabela}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="funcionarios">Funcionários</SelectItem>
                  <SelectItem value="cargos">Cargos</SelectItem>
                  <SelectItem value="setores">Setores</SelectItem>
                  <SelectItem value="ponto">Ponto</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="remuneracao">Remuneração</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acao">Ação</Label>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CREATE">Criar</SelectItem>
                  <SelectItem value="UPDATE">Atualizar</SelectItem>
                  <SelectItem value="DELETE">Excluir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="usuario">Usuário</Label>
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">Gestor RH</SelectItem>
                  <SelectItem value="3">Operador RH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="data">Período</Label>
              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="auditoria" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auditoria">Trilha de Auditoria</TabsTrigger>
          <TabsTrigger value="perfis">Perfis de Usuário</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
        </TabsList>

        {/* Tab Auditoria */}
        <TabsContent value="auditoria" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Trilha de Auditoria
              </CardTitle>
              <CardDescription>
                Registro de todas as ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoriaFiltrada.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          <div className="text-gray-500">
                            {format(new Date(item.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{item.usuario_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getModuloColor(item.tabela)}>
                          {item.tabela}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAcaoColor(item.acao)}>
                          {getAcaoIcon(item.acao)}
                          <span className="ml-1">{item.acao}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          ID: {item.registro_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {item.ip_address || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {auditoriaFiltrada.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum registro de auditoria encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Perfis */}
        <TabsContent value="perfis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Perfis de Usuário
              </CardTitle>
              <CardDescription>
                Gerencie perfis de acesso e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perfis.map((perfil) => (
                  <Card key={perfil.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{perfil.nome}</CardTitle>
                          <CardDescription>{perfil.descricao}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingPerfil(perfil)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={perfil.ativo ? "default" : "secondary"}>
                          {perfil.ativo ? (
                            <>
                              <Unlock className="w-3 h-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Permissões:</h4>
                        <div className="flex flex-wrap gap-1">
                          {perfil.permissoes.slice(0, 3).map((permId) => {
                            const permissao = permissoes.find(p => p.id === permId)
                            return (
                              <Badge key={permId} variant="outline" className="text-xs">
                                {permissao?.descricao || 'Permissão'}
                              </Badge>
                            )
                          })}
                          {perfil.permissoes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{perfil.permissoes.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Criado em: {format(new Date(perfil.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {perfis.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum perfil encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Permissões do Sistema
              </CardTitle>
              <CardDescription>
                Lista de todas as permissões disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  permissoes.reduce((acc, permissao) => {
                    if (!acc[permissao.modulo]) {
                      acc[permissao.modulo] = []
                    }
                    acc[permissao.modulo].push(permissao)
                    return acc
                  }, {} as Record<string, PermissaoRH[]>)
                ).map(([modulo, moduloPermissoes]) => (
                  <div key={modulo} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getModuloColor(modulo)}>
                        {modulo}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {moduloPermissoes.length} permissões
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {moduloPermissoes.map((permissao) => (
                        <div key={permissao.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Badge variant="outline" className="text-xs">
                            {permissao.acao}
                          </Badge>
                          <span className="text-sm">{permissao.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação de Perfil */}
      <Dialog open={isPerfilDialogOpen} onOpenChange={setIsPerfilDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Perfil de Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="perfil_nome">Nome do Perfil *</Label>
                <Input
                  id="perfil_nome"
                  value={perfilForm.nome}
                  onChange={(e) => setPerfilForm({ ...perfilForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="perfil_ativo">Status</Label>
                <Select 
                  value={perfilForm.ativo.toString()} 
                  onValueChange={(value) => setPerfilForm({ ...perfilForm, ativo: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="perfil_descricao">Descrição</Label>
              <Input
                id="perfil_descricao"
                value={perfilForm.descricao}
                onChange={(e) => setPerfilForm({ ...perfilForm, descricao: e.target.value })}
                placeholder="Descrição do perfil e suas responsabilidades..."
              />
            </div>

            <div>
              <Label>Permissões</Label>
              <div className="space-y-4">
                {Object.entries(
                  permissoes.reduce((acc, permissao) => {
                    if (!acc[permissao.modulo]) {
                      acc[permissao.modulo] = []
                    }
                    acc[permissao.modulo].push(permissao)
                    return acc
                  }, {} as Record<string, PermissaoRH[]>)
                ).map(([modulo, moduloPermissoes]) => (
                  <div key={modulo} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getModuloColor(modulo)}>
                        {modulo}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {moduloPermissoes.length} permissões
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {moduloPermissoes.map((permissao) => (
                        <div key={permissao.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={perfilForm.permissoes.includes(permissao.id)}
                            onCheckedChange={() => handleTogglePermissao(permissao.id)}
                          />
                          <span className="text-sm">{permissao.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPerfilDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarPerfil}>
                Criar Perfil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
