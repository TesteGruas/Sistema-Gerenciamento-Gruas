"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Calendar,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { clientesApi, Cliente, ClienteFormData } from "@/lib/api-clientes"
import { obrasApi, Obra } from "@/lib/api-obras"
import { DebugButton } from "@/components/debug-button"

export default function ClientesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [clienteFormData, setClienteFormData] = useState<ClienteFormData>({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato: '',
    contato_email: '',
    contato_cpf: '',
    contato_telefone: '',
    status: 'ativo',
    criar_usuario: true,
    usuario_senha: '' // Não será usado pelo usuário, apenas mockado no envio
  })
  
  // Estados para gerenciar dados da API
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoadingRef = useRef(false)
  const isLoadingObrasRef = useRef(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)

  // Verificar autenticação e carregar dados da API - apenas uma vez
  useEffect(() => {
    // Verificar se há token de autenticação
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('Usuário não autenticado. Redirecionando para login...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return
    }
    
    if (!dadosIniciaisCarregados && !isLoadingObrasRef.current) {
      console.log('⏳ [Preload] Iniciando carregamento da página de clientes...')
      const pageStartTime = performance.now()
      
      isLoadingObrasRef.current = true
      // Carregar obras e clientes em paralelo (skipLoadingCheck para evitar conflito)
      Promise.all([
        carregarObras(),
        carregarClientes(true) // skipLoadingCheck = true para carregamento inicial
      ]).finally(() => {
        const pageDuration = Math.round(performance.now() - pageStartTime)
        console.log(`✅ [Preload] Página de clientes pronta (${pageDuration}ms total)`)
        setDadosIniciaisCarregados(true)
        isLoadingObrasRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  // Verificar query param para abrir dialog de criação
  useEffect(() => {
    const createParam = searchParams.get('create')
    if (createParam === 'true' && dadosIniciaisCarregados) {
      setIsCreateDialogOpen(true)
      // Remover query param da URL sem recarregar a página
      router.replace('/dashboard/clientes', { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, dadosIniciaisCarregados])

  // Resetar página quando busca ou filtro mudarem
  const prevSearchTermRef = useRef(searchTerm)
  const prevStatusFilterRef = useRef(statusFilter)
  
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se busca ou filtro mudaram (não apenas paginação)
    const searchChanged = prevSearchTermRef.current !== searchTerm
    const filterChanged = prevStatusFilterRef.current !== statusFilter
    
    if (searchChanged || filterChanged) {
      setPagination(prev => ({ ...prev, page: 1 }))
      prevSearchTermRef.current = searchTerm
      prevStatusFilterRef.current = statusFilter
    }
  }, [searchTerm, statusFilter, dadosIniciaisCarregados])

  // Carregar clientes quando paginação, busca ou filtro mudarem (com debounce)
  // NOTA: Este useEffect só roda APÓS dadosIniciaisCarregados ser true
  // O carregamento inicial é feito no useEffect anterior
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timer = setTimeout(() => {
      // Executar busca ou carregamento
      if (searchTerm.trim()) {
        buscarClientes()
      } else {
        carregarClientes()
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, dadosIniciaisCarregados])


  const carregarClientes = async (skipLoadingCheck = false) => {
    try {
      if (!skipLoadingCheck && isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      console.log('⏳ [Preload] Carregando clientes...')
      const startTime = performance.now()
      setError(null)
      const response = await clientesApi.listarClientes({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined
      })
      const duration = Math.round(performance.now() - startTime)
      console.log(`✅ [Preload] Clientes carregados (${duration}ms) - ${response.data.length} registros`)
      
      setClientes(response.data)
      setPagination(response.pagination || {
        page: 1,
        limit: 9,
        total: 0,
        pages: 0
      })
      setHasLoadedOnce(true)
    } catch (err) {
      console.error('❌ [Preload] Erro ao carregar clientes:', err instanceof Error ? err.message : 'Erro desconhecido')
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
      setHasLoadedOnce(true)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  const carregarObras = async () => {
    try {
      if (isLoadingObrasRef.current) return
      isLoadingObrasRef.current = true
      console.log('⏳ [Preload] Carregando obras...')
      const startTime = performance.now()
      
      // Carregar todas as obras (sem paginação para ter acesso completo)
      const response = await obrasApi.listarObras({ page: 1, limit: 10 })
      const duration = Math.round(performance.now() - startTime)
      console.log(`✅ [Preload] Obras carregadas (${duration}ms) - ${response.data.length} registros`)
      
      setObras(response.data)
    } catch (err) {
      console.error('❌ [Preload] Erro ao carregar obras:', err instanceof Error ? err.message : 'Erro desconhecido')
      // Não definir erro aqui para não quebrar a interface de clientes
    } finally {
      isLoadingObrasRef.current = false
    }
  }

  const buscarClientes = async () => {
    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)
      console.log('🔍 Buscando clientes com termo:', searchTerm, 'página:', pagination.page)
      const response = await clientesApi.buscarClientes(
        searchTerm, 
        pagination.page, 
        pagination.limit,
        statusFilter || undefined
      )
      console.log('✅ Busca concluída:', response.data.length, 'clientes encontrados')
      setClientes(response.data)
      setPagination(response.pagination || {
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
        pages: 0
      })
      setHasLoadedOnce(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar clientes')
      console.error('❌ Erro ao buscar clientes:', err)
      setHasLoadedOnce(true)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  // Funções de paginação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(pagination.pages)
  const goToPreviousPage = () => goToPage(pagination.page - 1)
  const goToNextPage = () => goToPage(pagination.page + 1)

  const changePageSize = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  // Função para obter obras por cliente
  const getObrasByCliente = (clienteId: number) => {
    return obras.filter(obra => obra.cliente_id === clienteId)
  }

  // Os clientes já vêm filtrados do backend, não precisamos filtrar novamente
  const filteredClientes = clientes


  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsDetailsDialogOpen(true)
  }

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setClienteFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      cnpj: cliente.cnpj,
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      contato: cliente.contato || '',
      contato_email: cliente.contato_email || '',
      contato_cpf: cliente.contato_cpf || '',
      contato_telefone: cliente.contato_telefone || '',
      status: cliente.status || 'ativo',
      criar_usuario: cliente.usuario_existe || false,
      usuario_senha: ''
    })
    setIsEditDialogOpen(true)
  }

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...clienteFormData,
        cnpj: clienteFormData.cnpj.replace(/\D/g, ''),
        telefone: clienteFormData.telefone ? clienteFormData.telefone.replace(/\D/g, '') : '',
        cep: clienteFormData.cep ? clienteFormData.cep.replace(/\D/g, '') : '',
        contato_cpf: clienteFormData.contato_cpf ? clienteFormData.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: clienteFormData.contato_telefone ? clienteFormData.contato_telefone.replace(/\D/g, '') : '',
        // Incluir campos de usuário se estiver criando
        criar_usuario: clienteFormData.criar_usuario || false,
        // Enviar senha mockada temporariamente (backend ainda exige, mas será gerada automaticamente)
        usuario_senha: clienteFormData.criar_usuario ? 'TempPass123!' : undefined
      }
      
      const response = await clientesApi.criarCliente(dadosFormatados)
      
      // Recarregar lista de clientes
      await carregarClientes()
      
      // Resetar formulário e fechar dialog
      setClienteFormData({
        nome: '',
        email: '',
        telefone: '',
        cnpj: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        contato: '',
        contato_email: '',
        contato_cpf: '',
        contato_telefone: '',
        status: 'ativo',
        criar_usuario: true,
        usuario_senha: '' // Não será usado pelo usuário
      })
      setIsCreateDialogOpen(false)
      
      const message = response.data?.usuario_criado 
        ? "Cliente e usuário criados com sucesso! O representante receberá um email e uma mensagem no WhatsApp com as instruções de acesso e senha temporária."
        : "Cliente criado com sucesso!"
      
      toast({
        title: "Informação",
        description: message,
        variant: "default"
      })
    } catch (err) {
      console.error('Erro ao criar cliente:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao criar cliente',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCliente) return
    
    try {
      setIsSubmitting(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...clienteFormData,
        cnpj: clienteFormData.cnpj.replace(/\D/g, ''),
        telefone: clienteFormData.telefone ? clienteFormData.telefone.replace(/\D/g, '') : '',
        cep: clienteFormData.cep ? clienteFormData.cep.replace(/\D/g, '') : '',
        contato_cpf: clienteFormData.contato_cpf ? clienteFormData.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: clienteFormData.contato_telefone ? clienteFormData.contato_telefone.replace(/\D/g, '') : '',
        // Remover campos de usuário na edição (não devem ser enviados)
        criar_usuario: undefined,
        usuario_senha: undefined
      }
      
      await clientesApi.atualizarCliente(selectedCliente.id, dadosFormatados)
      
      // Recarregar lista de clientes
      await carregarClientes()
      
      setIsEditDialogOpen(false)
      
      toast({
        title: "Informação",
        description: "Cliente atualizado com sucesso!",
        variant: "default"
      })
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao atualizar cliente',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCliente = (cliente: Cliente) => {
    setClienteToDelete(cliente)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCliente = async () => {
    if (!clienteToDelete) return

    // Verificar se o cliente tem obras vinculadas
    const obrasVinculadas = getObrasByCliente(clienteToDelete.id)
    if (obrasVinculadas.length > 0) {
      toast({
        title: "Informação",
        description: `Não é possível excluir o cliente "${clienteToDelete.nome}" pois ele possui ${obrasVinculadas.length} obra(s) vinculada(s). Remova as obras primeiro.`,
        variant: "default"
      })
      setIsDeleteDialogOpen(false)
      return
    }

    try {
      setIsSubmitting(true)
      await clientesApi.excluirCliente(clienteToDelete.id)
      
      // Recarregar lista de clientes
      await carregarClientes()
      
      setIsDeleteDialogOpen(false)
      setClienteToDelete(null)
      
      toast({
        title: "Informação",
        description: `Cliente "${clienteToDelete.nome}" excluído com sucesso!`,
        variant: "default"
      })
    } catch (err) {
      console.error('Erro ao excluir cliente:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao excluir cliente',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular estatísticas dos clientes
  const totalClientes = pagination.total || clientes.length
  
  // Qtd de Obras atreladas (total de obras)
  const qtdObrasAtreladas = obras.length
  
  // Total de Novos Clientes do mês atual
  const mesAtual = new Date().getMonth()
  const anoAtual = new Date().getFullYear()
  const novosClientesMes = clientes.filter(cliente => {
    const dataCriacao = new Date(cliente.created_at)
    return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual
  }).length

  const stats = [
    { 
      title: "Total de Clientes", 
      value: totalClientes, 
      icon: Building2, 
      color: "bg-blue-500" 
    },
    { 
      title: "Qtd de Obras Atreladas", 
      value: qtdObrasAtreladas, 
      icon: FileText, 
      color: "bg-purple-500" 
    },
    { 
      title: "Clientes com Obras", 
      value: clientes.filter(cliente => {
        return obras.some(obra => obra.cliente_id === cliente.id)
      }).length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Novos Clientes (Mês)", 
      value: novosClientesMes, 
      icon: XCircle, 
      color: "bg-gray-500" 
    },
  ]

  return (
    <ProtectedRoute permission="clientes:visualizar">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">Gerenciamento de clientes e suas obras</p>
          </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar clientes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, email ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter || "todos"} onValueChange={(value) => setStatusFilter(value === "todos" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando clientes...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">
                {error.includes('autenticado') || error.includes('Sessão expirada') 
                  ? 'Problema de Autenticação' 
                  : 'Erro ao carregar clientes'}
              </span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            {!error.includes('autenticado') && !error.includes('Sessão expirada') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => carregarClientes(false)}
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            )}
            {(error.includes('autenticado') || error.includes('Sessão expirada')) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/'}
                className="mt-4"
              >
                Ir para Login
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => {
            const obrasCliente = getObrasByCliente(cliente.id)
            const obrasAtivas = obrasCliente.filter(obra => obra.status === 'Em Andamento')
            
            return (
              <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                    </div>
                    <Badge 
                      variant={
                        cliente.status === 'ativo' ? 'default' :
                        cliente.status === 'inativo' ? 'secondary' :
                        cliente.status === 'bloqueado' ? 'destructive' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {cliente.status === 'ativo' ? 'Ativo' :
                       cliente.status === 'inativo' ? 'Inativo' :
                       cliente.status === 'bloqueado' ? 'Bloqueado' :
                       cliente.status === 'pendente' ? 'Pendente' :
                       'N/A'}
                    </Badge>
                  </div>
                  <CardDescription>{cliente.cnpj}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{cliente.email}</span>
                      </div>
                    )}
                    
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{cliente.telefone}</span>
                      </div>
                    )}
                    
                    {(cliente.cidade || cliente.estado) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{cliente.cidade}, {cliente.estado}</span>
                      </div>
                    )}
                    
                    {cliente.contato && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{cliente.contato}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Obras</h4>
                        <Badge variant="outline">
                          {obrasCliente.length} total
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Em Andamento:</span>
                          <span className="font-medium text-green-600">{obrasAtivas.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outras:</span>
                          <span className="font-medium text-gray-600">{obrasCliente.length - obrasAtivas.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(cliente)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cliente)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCliente(cliente)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hasLoadedOnce && filteredClientes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro cliente.'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Controles de Paginação */}
      {!loading && !error && filteredClientes.length > 0 && pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Informações da paginação */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} clientes
                </span>
                
                {/* Seletor de itens por página */}
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select value={pagination.limit.toString()} onValueChange={(value) => changePageSize(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="27">27</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Controles de navegação */}
              <div className="flex items-center gap-2">
                {/* Primeira página - Desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={pagination.page === 1}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Página anterior */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Números das páginas - Desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const totalPages = pagination.pages
                    const currentPage = pagination.page
                    
                    // Mostrar até 5 páginas
                    let startPage = Math.max(1, currentPage - 2)
                    let endPage = Math.min(totalPages, currentPage + 2)
                    
                    // Ajustar se estiver no início ou fim
                    if (endPage - startPage < 4) {
                      if (startPage === 1) {
                        endPage = Math.min(totalPages, startPage + 4)
                      } else {
                        startPage = Math.max(1, endPage - 4)
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(i)}
                          className="w-8 h-8 p-0"
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                {/* Indicador de página atual - Mobile */}
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                </div>

                {/* Próxima página */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Última página - Desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={pagination.page === pagination.pages}
                  className="hidden sm:flex"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <ClienteForm 
            formData={clienteFormData}
            setFormData={setClienteFormData}
            onSubmit={handleCreateCliente}
            onClose={() => setIsCreateDialogOpen(false)}
            isEdit={false}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Cliente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <ClienteForm 
            formData={clienteFormData}
            setFormData={setClienteFormData}
            onSubmit={handleUpdateCliente}
            onClose={() => setIsEditDialogOpen(false)}
            isEdit={true}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          {selectedCliente && <ClienteDetails 
            cliente={selectedCliente} 
            getObrasByCliente={getObrasByCliente}
          />}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir o cliente <strong>{clienteToDelete?.nome}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. O cliente será permanentemente removido do sistema.
            </p>
            {clienteToDelete && getObrasByCliente(clienteToDelete.id).length > 0 && (
              <p className="text-xs text-orange-600">
                ⚠️ Este cliente possui obras vinculadas. A exclusão será bloqueada.
              </p>
            )}
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCliente}
              disabled={(clienteToDelete && getObrasByCliente(clienteToDelete.id).length > 0) || isSubmitting}
            >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

function ClienteForm({ formData, setFormData, onSubmit, onClose, isEdit, isSubmitting }: { 
  formData: ClienteFormData; 
  setFormData: (data: ClienteFormData) => void; 
  onSubmit: (e: React.FormEvent) => void; 
  onClose: () => void;
  isEdit: boolean;
  isSubmitting: boolean;
}) {
  const preencherDadosDebug = () => {
    setFormData({
      nome: 'Construtora ABC Ltda',
      email: 'contato@construtoraabc.com.br',
      telefone: '(11) 98765-4321',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Construções, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      contato: 'João Silva',
      contato_email: 'joao.silva@construtoraabc.com.br',
      contato_cpf: '123.456.789-00',
      contato_telefone: '(11) 91234-5678',
      status: 'ativo',
      criar_usuario: true,
      usuario_senha: ''
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex justify-end">
        <DebugButton onClick={preencherDadosDebug} disabled={isSubmitting} />
      </div>
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome da Empresa *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Construtora ABC Ltda"
              required
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) {
                  value = value.substring(0, 2) + '.' + value.substring(2)
                }
                if (value.length >= 6) {
                  value = value.substring(0, 6) + '.' + value.substring(6)
                }
                if (value.length >= 10) {
                  value = value.substring(0, 10) + '/' + value.substring(10)
                }
                if (value.length >= 15) {
                  value = value.substring(0, 15) + '-' + value.substring(15, 17)
                }
                setFormData({ ...formData, cnpj: value })
              }}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status || 'ativo'}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) {
                  value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                }
                if (value.length >= 10) {
                  value = value.substring(0, 10) + '-' + value.substring(10, 14)
                }
                setFormData({ ...formData, telefone: value })
              }}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
        
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco || ''}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, bairro"
            />
          </div>
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 5) {
                  value = value.substring(0, 5) + '-' + value.substring(5, 8)
                }
                setFormData({ ...formData, cep: value })
              }}
              placeholder="01234-567"
              maxLength={9}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade || ''}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="São Paulo"
            />
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado || undefined}
              onValueChange={(value) => setFormData({ ...formData, estado: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre (AC)</SelectItem>
                <SelectItem value="AL">Alagoas (AL)</SelectItem>
                <SelectItem value="AP">Amapá (AP)</SelectItem>
                <SelectItem value="AM">Amazonas (AM)</SelectItem>
                <SelectItem value="BA">Bahia (BA)</SelectItem>
                <SelectItem value="CE">Ceará (CE)</SelectItem>
                <SelectItem value="DF">Distrito Federal (DF)</SelectItem>
                <SelectItem value="ES">Espírito Santo (ES)</SelectItem>
                <SelectItem value="GO">Goiás (GO)</SelectItem>
                <SelectItem value="MA">Maranhão (MA)</SelectItem>
                <SelectItem value="MT">Mato Grosso (MT)</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul (MS)</SelectItem>
                <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                <SelectItem value="PA">Pará (PA)</SelectItem>
                <SelectItem value="PB">Paraíba (PB)</SelectItem>
                <SelectItem value="PR">Paraná (PR)</SelectItem>
                <SelectItem value="PE">Pernambuco (PE)</SelectItem>
                <SelectItem value="PI">Piauí (PI)</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte (RN)</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul (RS)</SelectItem>
                <SelectItem value="RO">Rondônia (RO)</SelectItem>
                <SelectItem value="RR">Roraima (RR)</SelectItem>
                <SelectItem value="SC">Santa Catarina (SC)</SelectItem>
                <SelectItem value="SP">São Paulo (SP)</SelectItem>
                <SelectItem value="SE">Sergipe (SE)</SelectItem>
                <SelectItem value="TO">Tocantins (TO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

     

      {/* Contato */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pessoa de Contato (Representante)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contato">Nome do Representante *</Label>
            <Input
              id="contato"
              value={formData.contato || ''}
              onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
              placeholder="João Silva"
              required
            />
          </div>
          <div>
            <Label htmlFor="contato_cpf">CPF do Representante</Label>
            <Input
              id="contato_cpf"
              value={formData.contato_cpf || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 3) {
                  value = value.substring(0, 3) + '.' + value.substring(3)
                }
                if (value.length >= 7) {
                  value = value.substring(0, 7) + '.' + value.substring(7)
                }
                if (value.length >= 11) {
                  value = value.substring(0, 11) + '-' + value.substring(11, 13)
                }
                setFormData({ ...formData, contato_cpf: value })
              }}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contato_email">Email do Representante</Label>
            <Input
              id="contato_email"
              type="email"
              value={formData.contato_email || ''}
              onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
              placeholder="joao.silva@empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="contato_telefone">Telefone do Representante</Label>
            <Input
              id="contato_telefone"
              value={formData.contato_telefone || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) {
                  value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                }
                if (value.length >= 10) {
                  value = value.substring(0, 10) + '-' + value.substring(10, 14)
                }
                setFormData({ ...formData, contato_telefone: value })
              }}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
      </div>

       {/* Configuração de Usuário */}
       <div className="space-y-4">
        <h3 className="text-lg font-medium">Configuração de Usuário</h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="criar_usuario"
            checked={formData.criar_usuario || false}
            onChange={(e) => setFormData({ ...formData, criar_usuario: e.target.checked })}
            disabled={isEdit && formData.criar_usuario}
            className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Label htmlFor="criar_usuario" className={`text-sm font-medium ${isEdit && formData.criar_usuario ? 'text-gray-500' : ''}`}>
            {isEdit && formData.criar_usuario 
              ? 'Usuário já criado para o representante' 
              : 'Criar usuário para o representante'
            }
          </Label>
        </div>

        {formData.criar_usuario && (
          <div className={`border rounded-lg p-4 ${isEdit ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <User className={`w-5 h-5 mt-0.5 ${isEdit ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <h4 className={`text-sm font-medium mb-1 ${isEdit ? 'text-green-900' : 'text-blue-900'}`}>
                  {isEdit ? 'Usuário Existente' : 'Criação de Usuário'}
                </h4>
                <p className={`text-sm mb-3 ${isEdit ? 'text-green-700' : 'text-blue-700'}`}>
                  {isEdit 
                    ? 'Este cliente já possui um usuário vinculado com acesso ao sistema.'
                    : 'Será criado um usuário para o representante com acesso limitado ao sistema.'
                  }
                </p>
                {!isEdit && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                      Uma senha temporária será gerada automaticamente e enviada por email e WhatsApp ao representante.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Atualizar' : 'Criar'} Cliente
        </Button>
      </div>
    </form>
  )
}

function ClienteDetails({ 
  cliente, 
  getObrasByCliente
}: { 
  cliente: Cliente; 
  getObrasByCliente: (id: number) => Obra[];
}) {
  const obras = getObrasByCliente(cliente.id)
  
  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nome:</span>
              <span className="text-sm font-medium">{cliente.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">CNPJ:</span>
              <span className="text-sm">{cliente.cnpj}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge 
                variant={
                  cliente.status === 'ativo' ? 'default' :
                  cliente.status === 'inativo' ? 'secondary' :
                  cliente.status === 'bloqueado' ? 'destructive' :
                  'outline'
                }
                className="text-xs"
              >
                {cliente.status === 'ativo' ? 'Ativo' :
                 cliente.status === 'inativo' ? 'Inativo' :
                 cliente.status === 'bloqueado' ? 'Bloqueado' :
                 cliente.status === 'pendente' ? 'Pendente' :
                 'N/A'}
              </Badge>
            </div>
            {cliente.email && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm">{cliente.email}</span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Telefone:</span>
                <span className="text-sm">{cliente.telefone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cliente.endereco && (
              <p className="text-sm">{cliente.endereco}</p>
            )}
            {(cliente.cidade || cliente.estado) && (
              <p className="text-sm">
                {cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : cliente.cidade || cliente.estado}
              </p>
            )}
            {cliente.cep && (
              <p className="text-sm">CEP: {cliente.cep}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pessoa de Contato */}
      {(cliente.contato || cliente.contato_email || cliente.contato_cpf || cliente.contato_telefone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pessoa de Contato (Representante)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cliente.contato && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nome:</span>
                <span className="text-sm font-medium">{cliente.contato}</span>
              </div>
            )}
            {cliente.contato_cpf && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPF:</span>
                <span className="text-sm">{cliente.contato_cpf}</span>
              </div>
            )}
            {cliente.contato_email && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm">{cliente.contato_email}</span>
              </div>
            )}
            {cliente.contato_telefone && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Telefone:</span>
                <span className="text-sm">{cliente.contato_telefone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Obras do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Obras ({obras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {obras.length > 0 ? (
            <div className="space-y-2">
              {obras.map((obra) => (
                <div key={obra.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{obra.nome}</p>
                    <p className="text-xs text-gray-500">{obra.endereco}, {obra.cidade}/{obra.estado}</p>
                    <p className="text-xs text-gray-500">Tipo: {obra.tipo}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      obra.status === 'Em Andamento' ? 'bg-green-100 text-green-800' : 
                      obra.status === 'Concluída' ? 'bg-blue-100 text-blue-800' :
                      obra.status === 'Pausada' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {obra.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Criada em: {new Date(obra.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma obra encontrada para este cliente
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}