"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Eye,
  XCircle,
  User,
  FileText,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  File,
  Image,
  Bell,
  Megaphone,
  Download,
} from "lucide-react"
import { clientesApi, Cliente, ClienteFormData } from "@/lib/api-clientes"
import { obrasApi, Obra } from "@/lib/api-obras"
import { apiArquivos } from "@/lib/api-arquivos"
import { buscarEnderecoPorCep as buscarViaCep } from "@/lib/api-cep"
import { DebugButton } from "@/components/debug-button"
import { NovaNotificacaoDialog } from "@/components/nova-notificacao-dialog"
import { ClienteSearch } from "@/components/cliente-search"
import { NotificarClientesSelecionadosDialog } from "@/components/notificar-clientes-selecionados-dialog"
import { NotificarUmClienteDialog } from "@/components/notificar-um-cliente-dialog"

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

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
    inscricao_estadual: '',
    inscricao_municipal: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    endereco_complemento: '',
    endereco_obra: '',
    endereco_obra_complemento: '',
    cidade: '',
    estado: '',
    cep: '',
    cidade_obra: '',
    estado_obra: '',
    cep_obra: '',
    contato: '',
    contato_cargo: '',
    contato_email: '',
    contato_cpf: '',
    contato_telefone: '',
    status: 'ativo',
    criar_usuario: true,
    usuario_senha: '' // Não será usado - backend gera senha automaticamente
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
  const initialLoadDoneRef = useRef(false)
  const prevPageRef = useRef(pagination.page)
  const prevLimitRef = useRef(pagination.limit)
  const prevSearchRef = useRef(searchTerm)
  const prevStatusRef = useRef(statusFilter)
  
  // Estados para upload de arquivos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [clienteArquivos, setClienteArquivos] = useState<any[]>([])
  const [loadingArquivos, setLoadingArquivos] = useState(false)

  const [destinatariosNotificacaoClientes, setDestinatariosNotificacaoClientes] = useState<
    Array<{ id: number; nome: string; info?: string }>
  >([])
  const [notificarSelecionadosOpen, setNotificarSelecionadosOpen] = useState(false)
  const [clienteNotificarIndividual, setClienteNotificarIndividual] = useState<Cliente | null>(null)
  const [notificarIndividualOpen, setNotificarIndividualOpen] = useState(false)
  const [exportandoCsv, setExportandoCsv] = useState(false)
  const [modoNotificacaoMassa, setModoNotificacaoMassa] = useState(false)
  const destinatariosNotificacaoClientesRef = useRef(destinatariosNotificacaoClientes)
  destinatariosNotificacaoClientesRef.current = destinatariosNotificacaoClientes

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
    
    // Evitar carregamento duplo - só carregar uma vez
    if (initialLoadDoneRef.current) return
    
    if (!isLoadingObrasRef.current && !isLoadingRef.current) {
      initialLoadDoneRef.current = true
      console.log('⏳ [Preload] Iniciando carregamento da página de clientes...')
      const pageStartTime = performance.now()

      // Carregar obras e clientes em paralelo (skipLoadingCheck para evitar conflito)
      Promise.all([
        carregarObras(),
        carregarClientes(true) // skipLoadingCheck = true para carregamento inicial
      ]).finally(() => {
        const pageDuration = Math.round(performance.now() - pageStartTime)
        console.log(`✅ [Preload] Página de clientes pronta (${pageDuration}ms total)`)
        setDadosIniciaisCarregados(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // Não executar se ainda não carregou os dados iniciais
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real nos parâmetros (não apenas no primeiro render)
    const pageChanged = prevPageRef.current !== pagination.page
    const limitChanged = prevLimitRef.current !== pagination.limit
    const searchChanged = prevSearchRef.current !== searchTerm
    const statusChanged = prevStatusRef.current !== statusFilter
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!pageChanged && !limitChanged && !searchChanged && !statusChanged) {
      return
    }
    
    // Atualizar refs
    prevPageRef.current = pagination.page
    prevLimitRef.current = pagination.limit
    prevSearchRef.current = searchTerm
    prevStatusRef.current = statusFilter
    
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

      // Carregar todas as páginas para garantir vínculo correto no card de clientes.
      const limitPorPagina = 200
      const primeiraPagina = await obrasApi.listarObras({ page: 1, limit: limitPorPagina })
      const totalPaginas = Math.max(primeiraPagina?.pagination?.pages || 1, 1)
      const todasObras: Obra[] = [...(primeiraPagina.data || [])]

      if (totalPaginas > 1) {
        const requisicoesPaginas = Array.from({ length: totalPaginas - 1 }, (_, index) => {
          const page = index + 2
          return obrasApi
            .listarObras({ page, limit: limitPorPagina })
            .then((res) => res.data || [])
            .catch(() => [])
        })

        const paginasRestantes = await Promise.all(requisicoesPaginas)
        paginasRestantes.forEach((pagina) => {
          if (pagina.length > 0) todasObras.push(...pagina)
        })
      }

      const duration = Math.round(performance.now() - startTime)
      console.log(`✅ [Preload] Obras carregadas (${duration}ms) - ${todasObras.length} registros`)

      setObras(todasObras)
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
    return obras.filter((obra) => Number(obra.cliente_id) === Number(clienteId))
  }

  // Os clientes já vêm filtrados do backend, não precisamos filtrar novamente
  const filteredClientes = clientes

  const formatarLinhaCidadeEstado = (cidade?: string, estado?: string) => {
    if (cidade && estado) return `${cidade}/${estado}`
    return cidade || estado || ''
  }

  const formatarEnderecoObra = (cliente: Cliente) => {
    const partes = [
      cliente.endereco_obra,
      cliente.endereco_obra_complemento,
      formatarLinhaCidadeEstado(cliente.cidade_obra, cliente.estado_obra),
      cliente.cep_obra ? `CEP ${cliente.cep_obra}` : ''
    ].filter(Boolean)

    return partes.join(' - ')
  }

  const escapeCsvCelula = (valor: unknown) => {
    const s = valor == null ? "" : String(valor)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const rotuloStatusCliente = (s?: string) => {
    if (s === "ativo") return "Ativo"
    if (s === "inativo") return "Inativo"
    if (s === "bloqueado") return "Bloqueado"
    if (s === "pendente") return "Pendente"
    return s || ""
  }

  const buscarTodosClientesParaExport = async (): Promise<Cliente[]> => {
    const PAGE_SIZE = 100
    const status = statusFilter || undefined
    const termo = searchTerm.trim()
    const todos: Cliente[] = []
    let page = 1
    let totalPaginas = 1
    do {
      const res =
        termo.length >= 2
          ? await clientesApi.buscarClientes(termo, page, PAGE_SIZE, status)
          : await clientesApi.listarClientes({ page, limit: PAGE_SIZE, status })
      const lote = res.data || []
      todos.push(...lote)
      totalPaginas = res.pagination?.pages ?? 1
      page += 1
    } while (page <= totalPaginas)
    return todos
  }

  const exportarClientesCsv = async () => {
    try {
      setExportandoCsv(true)
      const lista = await buscarTodosClientesParaExport()
      if (lista.length === 0) {
        toast({
          title: "Nada para exportar",
          description: "Não há clientes com os filtros atuais.",
          variant: "default",
        })
        return
      }
      const cabecalho = [
        "ID",
        "Nome",
        "CNPJ",
        "Email",
        "Telefone",
        "Cidade",
        "Estado",
        "Contato",
        "Email do contato",
        "Telefone do contato",
        "Status",
        "Criado em",
      ]
      const linhas = lista.map((c) =>
        [
          c.id,
          c.nome,
          c.cnpj,
          c.email,
          c.telefone,
          c.cidade,
          c.estado,
          c.contato,
          c.contato_email,
          c.contato_telefone,
          rotuloStatusCliente(c.status),
          c.created_at ? new Date(c.created_at).toLocaleString("pt-BR") : "",
        ].map(escapeCsvCelula).join(","),
      )
      const csv = "\ufeff" + [cabecalho.join(","), ...linhas].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Exportação concluída",
        description: `${lista.length} cliente(s) exportado(s) para CSV.`,
      })
    } catch (e) {
      console.error("Erro ao exportar clientes CSV:", e)
      toast({
        title: "Erro na exportação",
        description: e instanceof Error ? e.message : "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsDetailsDialogOpen(true)
  }

  const handleEdit = async (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setClienteFormData({
      nome: cliente.nome,
      inscricao_estadual: cliente.inscricao_estadual || '',
      inscricao_municipal: cliente.inscricao_municipal || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      cnpj: cliente.cnpj,
      endereco: cliente.endereco || '',
      endereco_complemento: cliente.endereco_complemento || '',
      endereco_obra: cliente.endereco_obra || '',
      endereco_obra_complemento: cliente.endereco_obra_complemento || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      cidade_obra: cliente.cidade_obra || '',
      estado_obra: cliente.estado_obra || '',
      cep_obra: cliente.cep_obra || '',
      contato: cliente.contato || '',
      contato_cargo: cliente.contato_cargo || '',
      contato_email: cliente.contato_email || '',
      contato_cpf: cliente.contato_cpf || '',
      contato_telefone: cliente.contato_telefone || '',
      status: cliente.status || 'ativo',
      criar_usuario: cliente.usuario_existe || false,
      usuario_senha: ''
    })
    setSelectedFiles([])
    setIsEditDialogOpen(true)
    
    // Carregar arquivos do cliente
    await carregarArquivosCliente(cliente.id)
  }

  const carregarArquivosCliente = async (clienteId: number) => {
    try {
      setLoadingArquivos(true)
      const response = await apiArquivos.obterPorEntidade('cliente', clienteId)
      setClienteArquivos(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar arquivos do cliente:', error)
      setClienteArquivos([])
    } finally {
      setLoadingArquivos(false)
    }
  }

  const handleRemoverArquivoCliente = async (arquivoId: number) => {
    try {
      await apiArquivos.excluir(arquivoId)
      
      // Recarregar lista de arquivos
      if (selectedCliente) {
        await carregarArquivosCliente(selectedCliente.id)
      }
      
      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao remover arquivo:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover arquivo. Verifique os logs do console para mais detalhes.",
        variant: "destructive"
      })
    }
  }

  // Função para fazer upload de arquivos após criar/atualizar cliente
  const uploadClienteFiles = async (clienteId: number, clienteNome?: string) => {
    if (selectedFiles.length === 0) {
      console.log('⚠️ Nenhum arquivo selecionado para upload')
      return
    }

    try {
      setUploadingFiles(true)
      console.log(`📤 Iniciando upload de ${selectedFiles.length} arquivo(s) para cliente ID: ${clienteId}`)
      
      const uploadResults = await Promise.allSettled(
        selectedFiles.map(async (file) => {
          try {
            console.log(`📤 Fazendo upload do arquivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
            const result = await apiArquivos.upload(file, {
              nome: file.name,
              descricao: `Arquivo do cliente: ${clienteNome || clienteFormData.nome || ''}`,
              modulo: 'clientes',
              entidade_id: clienteId,
              entidade_tipo: 'cliente',
              publico: false
            })
            console.log(`✅ Upload bem-sucedido: ${file.name}`, result)
            return { success: true, file, result }
          } catch (error) {
            console.error(`❌ Erro ao fazer upload do arquivo ${file.name}:`, error)
            return { success: false, file, error }
          }
        })
      )

      const sucessos = uploadResults.filter(r => r.status === 'fulfilled' && r.value.success).length
      const erros = uploadResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
      
      console.log(`📊 Resultado do upload: ${sucessos} sucesso(s), ${erros} erro(s)`)
      
      if (sucessos > 0) {
        toast({
          title: "Sucesso",
          description: `${sucessos} arquivo(s) enviado(s) com sucesso!${erros > 0 ? ` ${erros} arquivo(s) falharam.` : ''}`
        })
      }
      
      if (erros > 0 && sucessos === 0) {
        toast({
          title: "Erro",
          description: "Nenhum arquivo pôde ser enviado. Verifique os logs do console para mais detalhes.",
          variant: "destructive"
        })
      }
      
      setSelectedFiles([])
    } catch (error) {
      console.error('❌ Erro geral ao fazer upload dos arquivos:', error)
      toast({
        title: "Erro",
        description: "Erro ao fazer upload dos arquivos. Verifique os logs do console para mais detalhes.",
        variant: "destructive"
      })
    } finally {
      setUploadingFiles(false)
    }
  }

  // Função para adicionar arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 10MB`,
          variant: "destructive"
        })
        return false
      }
      return true
    })
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (e.target) {
      e.target.value = ''
    }
  }

  // Função para remover arquivo da lista
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Função para obter ícone do arquivo
  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes('word') || type.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-600" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleCreateCliente = async (e: React.FormEvent, formDataOverride?: ClienteFormData) => {
    e.preventDefault()
    const dadosForm = formDataOverride || clienteFormData
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!dadosForm.nome || !dadosForm.nome.trim()) {
      camposFaltando.push('Nome da Empresa')
    }
    
    if (!dadosForm.cnpj || !dadosForm.cnpj.trim()) {
      camposFaltando.push('CNPJ')
    }
    
    if (!dadosForm.contato || !dadosForm.contato.trim()) {
      camposFaltando.push('Nome do Representante')
    }
    if (!dadosForm.contato_email || !dadosForm.contato_email.trim()) {
      camposFaltando.push('Email do Contato')
    }
    if (camposFaltando.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${camposFaltando.join(', ')}`,
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...dadosForm,
        cnpj: dadosForm.cnpj.replace(/\D/g, ''),
        telefone: dadosForm.telefone ? dadosForm.telefone.replace(/\D/g, '') : '',
        cep: dadosForm.cep ? dadosForm.cep.replace(/\D/g, '') : '',
        cep_obra: dadosForm.cep_obra ? dadosForm.cep_obra.replace(/\D/g, '') : '',
        contato_cpf: dadosForm.contato_cpf ? dadosForm.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: dadosForm.contato_telefone ? dadosForm.contato_telefone.replace(/\D/g, '') : '',
        // Incluir campos de usuário se estiver criando
        criar_usuario: clienteFormData.criar_usuario || false,
        // Backend gera senha automaticamente quando criar_usuario é true
        // Não enviar senha - será gerada pelo backend e enviada por email/WhatsApp
      }
      
      const response = await clientesApi.criarCliente(dadosFormatados)
      
      console.log('📦 Resposta da criação do cliente:', response)
      console.log('📦 ID do cliente criado:', response.data?.id)
      console.log('📦 Arquivos selecionados:', selectedFiles.length)
      
      // Fazer upload dos arquivos se houver
      if (selectedFiles.length > 0) {
        const clienteId = response.data?.id
        if (clienteId) {
          console.log('📤 Iniciando upload de arquivos para cliente ID:', clienteId)
          await uploadClienteFiles(clienteId, dadosForm.nome)
        } else {
          console.error('❌ ID do cliente não encontrado na resposta:', response)
          toast({
            title: "Aviso",
            description: "Cliente criado, mas não foi possível fazer upload dos arquivos. ID do cliente não encontrado.",
            variant: "default"
          })
        }
      }
      
      // Recarregar lista de clientes
      await carregarClientes()
      
      // Resetar formulário e fechar dialog
      setClienteFormData({
        nome: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        email: '',
        telefone: '',
        cnpj: '',
        endereco: '',
        endereco_complemento: '',
        endereco_obra: '',
        endereco_obra_complemento: '',
        cidade: '',
        estado: '',
        cep: '',
        cidade_obra: '',
        estado_obra: '',
        cep_obra: '',
        contato: '',
        contato_cargo: '',
        contato_email: '',
        contato_cpf: '',
        contato_telefone: '',
        status: 'ativo',
        criar_usuario: true,
        usuario_senha: '' // Não será usado - backend gera senha automaticamente
      })
      setSelectedFiles([])
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

  const handleUpdateCliente = async (e: React.FormEvent, formDataOverride?: ClienteFormData) => {
    e.preventDefault()
    const dadosForm = formDataOverride || clienteFormData
    
    if (!selectedCliente) return
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!dadosForm.nome || !dadosForm.nome.trim()) {
      camposFaltando.push('Nome da Empresa')
    }
    
    if (!dadosForm.cnpj || !dadosForm.cnpj.trim()) {
      camposFaltando.push('CNPJ')
    }
    
    if (!dadosForm.contato || !dadosForm.contato.trim()) {
      camposFaltando.push('Nome do Representante')
    }
    if (!dadosForm.contato_email || !dadosForm.contato_email.trim()) {
      camposFaltando.push('Email do Contato')
    }
    if (camposFaltando.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${camposFaltando.join(', ')}`,
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...dadosForm,
        cnpj: dadosForm.cnpj.replace(/\D/g, ''),
        telefone: dadosForm.telefone ? dadosForm.telefone.replace(/\D/g, '') : '',
        cep: dadosForm.cep ? dadosForm.cep.replace(/\D/g, '') : '',
        cep_obra: dadosForm.cep_obra ? dadosForm.cep_obra.replace(/\D/g, '') : '',
        contato_cpf: dadosForm.contato_cpf ? dadosForm.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: dadosForm.contato_telefone ? dadosForm.contato_telefone.replace(/\D/g, '') : '',
        // Remover campos de usuário na edição (não devem ser enviados)
        criar_usuario: undefined,
        usuario_senha: undefined
      }
      
      await clientesApi.atualizarCliente(selectedCliente.id, dadosFormatados)
      
      // Fazer upload dos arquivos se houver
      if (selectedFiles.length > 0) {
        await uploadClienteFiles(selectedCliente.id, dadosForm.nome)
      }
      
      // Recarregar lista de clientes
      await carregarClientes()
      
      // Recarregar arquivos do cliente antes de fechar
      if (selectedCliente) {
        await carregarArquivosCliente(selectedCliente.id)
      }
      
      setIsEditDialogOpen(false)
      setSelectedFiles([])
      
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

  const destinatariosClientesIdSet = useMemo(
    () => new Set(destinatariosNotificacaoClientes.map((d) => d.id)),
    [destinatariosNotificacaoClientes],
  )

  const toggleClienteNotificacao = useCallback((c: Cliente) => {
    setDestinatariosNotificacaoClientes((prev) => {
      const exists = prev.some((d) => d.id === c.id)
      if (exists) return prev.filter((d) => d.id !== c.id)
      return [...prev, { id: c.id, nome: c.nome, info: c.cnpj || c.email || undefined }]
    })
  }, [])

  const abrirNotificarIndividualCliente = useCallback((c: Cliente) => {
    setClienteNotificarIndividual(c)
    setNotificarIndividualOpen(true)
  }, [])

  const onNotificarClienteIndividualOpenChange = useCallback((v: boolean) => {
    setNotificarIndividualOpen(v)
    if (!v) setClienteNotificarIndividual(null)
  }, [])

  const visIdsPaginaClientes = useMemo(() => filteredClientes.map((c) => c.id), [filteredClientes])
  const nSelecionadosClientesNaPagina = useMemo(
    () => visIdsPaginaClientes.filter((id) => destinatariosClientesIdSet.has(id)).length,
    [visIdsPaginaClientes, destinatariosClientesIdSet],
  )
  const todosClientesPaginaSelecionados =
    visIdsPaginaClientes.length > 0 && nSelecionadosClientesNaPagina === visIdsPaginaClientes.length
  const algunsClientesPaginaSelecionados =
    nSelecionadosClientesNaPagina > 0 && nSelecionadosClientesNaPagina < visIdsPaginaClientes.length

  const onNotificarSelectAllPaginaClientes = useCallback(
    (checked: boolean | "indeterminate") => {
      if (checked === true) {
        setDestinatariosNotificacaoClientes((prev) => {
          const map = new Map(prev.map((d) => [d.id, d]))
          for (const c of filteredClientes) {
            map.set(c.id, {
              id: c.id,
              nome: c.nome,
              info: c.cnpj || c.email || undefined,
            })
          }
          return Array.from(map.values())
        })
        return
      }
      const visSet = new Set(visIdsPaginaClientes)
      setDestinatariosNotificacaoClientes((prev) => prev.filter((d) => !visSet.has(d.id)))
    },
    [filteredClientes, visIdsPaginaClientes],
  )

  const adicionarClienteBuscaNotificacao = useCallback(
    (raw: unknown) => {
      if (!raw || typeof raw !== "object") return
      const obj = raw as Record<string, unknown>
      const id = Number(obj.id)
      if (!Number.isFinite(id)) return
      const nome = String(obj.nome ?? "Cliente")
      const info =
        (typeof obj.cnpj === "string" && obj.cnpj) ||
        (typeof obj.email === "string" && obj.email) ||
        undefined

      if (destinatariosNotificacaoClientesRef.current.some((d) => d.id === id)) {
        toast({
          title: "Já está na lista",
          description: nome,
        })
        return
      }
      setDestinatariosNotificacaoClientes((prev) => [...prev, { id, nome, info }])
    },
    [toast],
  )

  return (
    <ProtectedRoute permission="clientes:visualizar">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">Gerenciamento de clientes e suas obras</p>
          </div>
          <div className="flex items-center gap-2">
            <NovaNotificacaoDialog
              dialogTitle="Enviar notificação"
              dialogDescription="A notificação aparece no painel do usuário. Você pode enviar para um funcionário, obra, cliente ou para todos."
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 flex items-center gap-2 h-9"
                  title="Abrir envio de notificação para um usuário"
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Enviar notificação</span>
                </Button>
              }
            />
            <Button
              type="button"
              variant={modoNotificacaoMassa ? "default" : "outline"}
              className="shrink-0 flex items-center gap-2 h-9"
              aria-pressed={modoNotificacaoMassa}
              title={
                modoNotificacaoMassa
                  ? "Desativar modo notificação em massa"
                  : "Ativar notificação em massa"
              }
              onClick={() => setModoNotificacaoMassa((v) => !v)}
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Notificação em massa</span>
            </Button>
            {modoNotificacaoMassa && destinatariosNotificacaoClientes.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => setNotificarSelecionadosOpen(true)}
              >
                Enviar mensagem ({destinatariosNotificacaoClientes.length})
              </Button>
            )}
            <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

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

      {/* Clientes: filtros + tabela (ou vazio / carregando) */}
      {!error && (
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Visualize e gerencie os cadastros</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-6 border-b">
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
                    <SelectTrigger id="status">
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("")
                    }}
                    className="w-full sm:flex-1"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    disabled={loading || exportandoCsv}
                    onClick={exportarClientesCsv}
                    title="Exportar todos os clientes que correspondem aos filtros atuais (várias páginas)"
                  >
                    {exportandoCsv ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    ) : (
                      <Download className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </div>

            {modoNotificacaoMassa && (
              <div className="px-6 pt-4 pb-4 border-b bg-muted/20">
                <div className="min-w-0 max-w-2xl space-y-1.5">
                  <Label className="text-sm text-muted-foreground font-medium">
                    Selecionar para notificação em massa
                  </Label>
                  <ClienteSearch
                    className="w-full"
                    placeholder="Digite nome ou CNPJ para incluir na lista…"
                    onClienteSelect={(c) => c && adicionarClienteBuscaNotificacao(c)}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12 px-6">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Carregando clientes...</span>
              </div>
            ) : filteredClientes.length > 0 ? (
              <div className="p-6 space-y-4">
            <div className="rounded-md border">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    {modoNotificacaoMassa ? (
                      <TableHead className="w-11 px-2 text-center">
                        <div className="flex justify-center py-0.5">
                          <Checkbox
                            checked={
                              todosClientesPaginaSelecionados
                                ? true
                                : algunsClientesPaginaSelecionados
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={onNotificarSelectAllPaginaClientes}
                            disabled={filteredClientes.length === 0}
                            aria-label="Selecionar ou limpar todos desta página para notificação em massa"
                          />
                        </div>
                      </TableHead>
                    ) : null}
                    <TableHead className="w-48 min-w-[12rem] px-3 text-left whitespace-nowrap">
                      Cliente
                    </TableHead>
                    <TableHead className="whitespace-nowrap">CNPJ</TableHead>
                    <TableHead className="min-w-[140px]">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Telefone</TableHead>
                    <TableHead className="min-w-[120px]">Localização</TableHead>
                    <TableHead className="min-w-[100px]">Contato</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right w-[168px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      {modoNotificacaoMassa ? (
                        <TableCell className="w-11 px-2 align-middle">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={destinatariosClientesIdSet.has(cliente.id)}
                              onCheckedChange={() => toggleClienteNotificacao(cliente)}
                              aria-label={`Incluir ${cliente.nome} na notificação em massa`}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell className="w-48 min-w-[12rem] px-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <span className="truncate text-sm font-medium" title={cliente.nome}>
                            {cliente.nome}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {cliente.cnpj || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cliente.email ? (
                          <span className="truncate block max-w-[200px]" title={cliente.email}>
                            {cliente.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {cliente.telefone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(cliente.cidade || cliente.estado)
                          ? formatarLinhaCidadeEstado(cliente.cidade, cliente.estado)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cliente.contato ? (
                          <span className="truncate block max-w-[140px]" title={cliente.contato}>
                            {cliente.contato}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            cliente.status === "ativo"
                              ? "default"
                              : cliente.status === "inativo"
                                ? "secondary"
                                : cliente.status === "bloqueado"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {cliente.status === "ativo"
                            ? "Ativo"
                            : cliente.status === "inativo"
                              ? "Inativo"
                              : cliente.status === "bloqueado"
                                ? "Bloqueado"
                                : cliente.status === "pendente"
                                  ? "Pendente"
                                  : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Enviar notificação para este cliente"
                            onClick={() => abrirNotificarIndividualCliente(cliente)}
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Ver detalhes"
                            onClick={() => handleViewDetails(cliente)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Editar"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                            onClick={() => handleDeleteCliente(cliente)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}{" "}
                  clientes
                </span>
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

              {pagination.pages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={pagination.page === 1}
                    className="hidden sm:flex"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="hidden sm:flex items-center gap-1">
                    {(() => {
                      const pages = []
                      const totalPages = pagination.pages
                      const currentPage = pagination.page
                      let startPage = Math.max(1, currentPage - 2)
                      let endPage = Math.min(totalPages, currentPage + 2)
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
                          </Button>,
                        )
                      }
                      return pages
                    })()}
                  </div>
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pagination.page === pagination.pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
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
              )}
            </div>
              </div>
            ) : hasLoadedOnce ? (
              <div className="px-6 py-10 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando seu primeiro cliente."}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
            ) : null}
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
            onSubmit={handleCreateCliente}
            onClose={() => setIsCreateDialogOpen(false)}
            isEdit={false}
            isSubmitting={isSubmitting}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            uploadingFiles={uploadingFiles}
            handleFileSelect={handleFileSelect}
            handleRemoveFile={handleRemoveFile}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
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
            onSubmit={handleUpdateCliente}
            onClose={() => {
              setIsEditDialogOpen(false)
              setClienteArquivos([])
            }}
            isEdit={true}
            isSubmitting={isSubmitting}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            uploadingFiles={uploadingFiles}
            handleFileSelect={handleFileSelect}
            handleRemoveFile={handleRemoveFile}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            clienteArquivos={clienteArquivos}
            loadingArquivos={loadingArquivos}
            onRemoverArquivo={handleRemoverArquivoCliente}
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

      <NotificarClientesSelecionadosDialog
        open={notificarSelecionadosOpen}
        onOpenChange={setNotificarSelecionadosOpen}
        clientes={destinatariosNotificacaoClientes}
        onEnviado={() => setDestinatariosNotificacaoClientes([])}
      />
      <NotificarUmClienteDialog
        open={notificarIndividualOpen}
        onOpenChange={onNotificarClienteIndividualOpenChange}
        cliente={
          clienteNotificarIndividual
            ? {
                id: clienteNotificarIndividual.id,
                nome: clienteNotificarIndividual.nome,
                info:
                  clienteNotificarIndividual.cnpj ||
                  clienteNotificarIndividual.email ||
                  undefined,
              }
            : null
        }
      />
      </div>
    </ProtectedRoute>
  )

function ClienteForm({ 
  formData, 
  onSubmit, 
  onClose, 
  isEdit, 
  isSubmitting,
  selectedFiles,
  setSelectedFiles,
  uploadingFiles,
  handleFileSelect,
  handleRemoveFile,
  getFileIcon,
  formatFileSize,
  clienteArquivos = [],
  loadingArquivos = false,
  onRemoverArquivo
}: { 
  formData: ClienteFormData; 
  onSubmit: (e: React.FormEvent, formData: ClienteFormData) => void; 
  onClose: () => void;
  isEdit: boolean;
  isSubmitting: boolean;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  uploadingFiles: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;
  getFileIcon: (file: File) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  clienteArquivos?: any[];
  loadingArquivos?: boolean;
  onRemoverArquivo?: (arquivoId: number) => void;
}) {
  const [localFormData, setLocalFormData] = useState<ClienteFormData>(formData)
  const [buscandoCepCliente, setBuscandoCepCliente] = useState(false)
  const [buscandoCepObra, setBuscandoCepObra] = useState(false)
  const [erroCepCliente, setErroCepCliente] = useState('')
  const [erroCepObra, setErroCepObra] = useState('')

  useEffect(() => {
    setLocalFormData(formData)
  }, [formData])

  const formatarCep = (rawValue: string) => {
    const numeric = rawValue.replace(/\D/g, '').slice(0, 8)
    if (numeric.length <= 5) return numeric
    return `${numeric.slice(0, 5)}-${numeric.slice(5)}`
  }

  const aplicarEnderecoPorCep = async (cep: string, tipo: 'cliente' | 'obra') => {
    const cepNumerico = cep.replace(/\D/g, '')
    if (cepNumerico.length !== 8) return

    if (tipo === 'cliente') {
      setBuscandoCepCliente(true)
      setErroCepCliente('')
    } else {
      setBuscandoCepObra(true)
      setErroCepObra('')
    }

    try {
      const data = await buscarViaCep(cepNumerico)

      if (tipo === 'cliente') {
        setLocalFormData((prev) => ({
          ...prev,
          endereco: [data.logradouro, data.bairro].filter(Boolean).join(' - ') || prev.endereco,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
          cep: formatarCep(cepNumerico)
        }))
        setErroCepCliente('')
        return
      }

      setLocalFormData((prev) => ({
        ...prev,
        endereco_obra: [data.logradouro, data.bairro].filter(Boolean).join(' - ') || prev.endereco_obra,
        cidade_obra: data.localidade || prev.cidade_obra,
        estado_obra: data.uf || prev.estado_obra,
        cep_obra: formatarCep(cepNumerico)
      }))
      setErroCepObra('')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      if (tipo === 'cliente') {
        setErroCepCliente('CEP não encontrado. Verifique o número informado.')
      } else {
        const cepClienteNumerico = (localFormData.cep || '').replace(/\D/g, '')
        // Fallback: se CEP da obra for igual ao da empresa, reaproveita os dados já preenchidos da empresa
        if (cepClienteNumerico === cepNumerico && (localFormData.endereco || localFormData.cidade || localFormData.estado)) {
          setLocalFormData((prev) => ({
            ...prev,
            endereco_obra: prev.endereco || prev.endereco_obra,
            cidade_obra: prev.cidade || prev.cidade_obra,
            estado_obra: prev.estado || prev.estado_obra,
            cep_obra: formatarCep(cepNumerico)
          }))
          setErroCepObra('')
          return
        }
        setErroCepObra('CEP não encontrado. Verifique o número informado.')
      }
    } finally {
      if (tipo === 'cliente') {
        setBuscandoCepCliente(false)
      } else {
        setBuscandoCepObra(false)
      }
    }
  }

  const gerarCnpjAleatorioFormatado = () => {
    const gerarDigito = (numeros: number[]) => {
      let peso = numeros.length - 7
      let soma = 0

      for (let i = 0; i < numeros.length; i++) {
        soma += numeros[i] * peso
        peso = peso === 2 ? 9 : peso - 1
      }

      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }

    const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
    const filial = [0, 0, 0, 1]
    const semDigitos = [...base, ...filial]
    const digito1 = gerarDigito(semDigitos)
    const digito2 = gerarDigito([...semDigitos, digito1])
    const cnpjNumerico = [...semDigitos, digito1, digito2].join("")

    return cnpjNumerico.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }

  const preencherDadosDebug = () => {
    setLocalFormData({
      nome: 'Construtora ABC Ltda',
      cnpj: gerarCnpjAleatorioFormatado(),
      inscricao_estadual: '110.042.490.114',
      inscricao_municipal: '1234567',
      email: 'contato@construtoraabc.com.br',
      telefone: '(11) 98765-4321',
      endereco: 'Rua das Construções, 123',
      endereco_complemento: 'Sala 402',
      endereco_obra: 'Av. Paulista, 1500 - Bela Vista',
      endereco_obra_complemento: 'Torre B',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      cidade_obra: 'São Paulo',
      estado_obra: 'SP',
      cep_obra: '01311-000',
      contato: 'João Silva',
      contato_cargo: 'Engenheiro Responsável',
      contato_email: 'joao.silva@construtoraabc.com.br',
      contato_telefone: '(11) 91234-5678',
      status: 'ativo',
      criar_usuario: true,
      usuario_senha: ''
    })
  }

  return (
    <form onSubmit={(e) => onSubmit(e, localFormData)} className="space-y-2">
      <div className="flex justify-end mb-4">
        <DebugButton
          onClick={preencherDadosDebug}
          disabled={isSubmitting}
          variant="outline"
          label="Preencher Todos os Dados"
          title="Preencher todos os campos com dados de exemplo"
        />
      </div>
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome da Empresa *</Label>
            <Input
              id="nome"
              value={localFormData.nome}
              onChange={(e) => setLocalFormData({ ...localFormData, nome: e.target.value })}
              placeholder="Ex: Construtora ABC Ltda"
              required
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={localFormData.cnpj}
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
                setLocalFormData({ ...localFormData, cnpj: value })
              }}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
            <Input
              id="inscricao_estadual"
              value={localFormData.inscricao_estadual || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, inscricao_estadual: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
            <Input
              id="inscricao_municipal"
              value={localFormData.inscricao_municipal || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, inscricao_municipal: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={localFormData.status || 'ativo'}
              onValueChange={(value) => setLocalFormData({ ...localFormData, status: value })}
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
            <Label htmlFor="email">Email da Empresa</Label>
            <Input
              id="email"
              type="email"
              value={localFormData.email || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, email: e.target.value })}
              placeholder="contato@empresa.com.br"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone da Empresa</Label>
            <Input
              id="telefone"
              value={localFormData.telefone || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) {
                  value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                }
                if (value.length >= 10) {
                  value = value.substring(0, 10) + '-' + value.substring(10, 14)
                }
                setLocalFormData({ ...localFormData, telefone: value })
              }}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
        
      </div>

      {/* Endereço da Empresa */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={localFormData.cep || ''}
              onChange={(e) => {
                const value = formatarCep(e.target.value)
                setLocalFormData({ ...localFormData, cep: value })
                setErroCepCliente('')
                if (value.length === 9) {
                  aplicarEnderecoPorCep(value, 'cliente')
                }
              }}
              onBlur={() => {
                if ((localFormData.cep || '').length === 9) {
                  aplicarEnderecoPorCep(localFormData.cep || '', 'cliente')
                }
              }}
              placeholder="01234-567"
              maxLength={9}
            />
            {buscandoCepCliente && <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>}
            {erroCepCliente && <p className="text-xs text-red-600 mt-1">{erroCepCliente}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={localFormData.endereco || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, endereco: e.target.value })}
              placeholder="Rua, número e bairro"
            />
          </div>
          <div>
            <Label htmlFor="endereco_complemento">Complemento</Label>
            <Input
              id="endereco_complemento"
              value={localFormData.endereco_complemento || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, endereco_complemento: e.target.value })}
              placeholder="Sala, bloco, andar (opcional)"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={localFormData.cidade || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, cidade: e.target.value })}
              placeholder="São Paulo"
            />
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={localFormData.estado || undefined}
              onValueChange={(value) => setLocalFormData({ ...localFormData, estado: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

     

      {/* Informações de Contato */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações de Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contato">Nome do Contato *</Label>
            <Input
              id="contato"
              value={localFormData.contato || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, contato: e.target.value })}
              placeholder="João Silva"
              required
            />
          </div>
          <div>
            <Label htmlFor="contato_cargo">Cargo do Contato</Label>
            <Input
              id="contato_cargo"
              value={localFormData.contato_cargo || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, contato_cargo: e.target.value })}
              placeholder="Ex: Engenheiro, Comprador, Administrador"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contato_email">Email do Contato *</Label>
            <Input
              id="contato_email"
              type="email"
              value={localFormData.contato_email || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, contato_email: e.target.value })}
              placeholder="joao.silva@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="contato_telefone">Telefone do Contato</Label>
            <Input
              id="contato_telefone"
              value={localFormData.contato_telefone || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) {
                  value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                }
                if (value.length >= 10) {
                  value = value.substring(0, 10) + '-' + value.substring(10, 14)
                }
                setLocalFormData({ ...localFormData, contato_telefone: value })
              }}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
      </div>

      {/* Endereço da Obra */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço da Obra</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cep_obra">CEP</Label>
            <Input
              id="cep_obra"
              value={localFormData.cep_obra || ''}
              onChange={(e) => {
                const value = formatarCep(e.target.value)
                setLocalFormData({ ...localFormData, cep_obra: value })
                setErroCepObra('')
                if (value.length === 9) {
                  aplicarEnderecoPorCep(value, 'obra')
                }
              }}
              onBlur={() => {
                if ((localFormData.cep_obra || '').length === 9) {
                  aplicarEnderecoPorCep(localFormData.cep_obra || '', 'obra')
                }
              }}
              placeholder="01234-567"
              maxLength={9}
            />
            {buscandoCepObra && <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>}
            {erroCepObra && <p className="text-xs text-red-600 mt-1">{erroCepObra}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endereco_obra">Endereço</Label>
            <Input
              id="endereco_obra"
              value={localFormData.endereco_obra || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, endereco_obra: e.target.value })}
              placeholder="Rua, número e bairro"
            />
          </div>
          <div>
            <Label htmlFor="endereco_obra_complemento">Complemento</Label>
            <Input
              id="endereco_obra_complemento"
              value={localFormData.endereco_obra_complemento || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, endereco_obra_complemento: e.target.value })}
              placeholder="Sala, bloco, andar (opcional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade_obra">Cidade</Label>
            <Input
              id="cidade_obra"
              value={localFormData.cidade_obra || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, cidade_obra: e.target.value })}
              placeholder="São Paulo"
            />
          </div>
          <div>
            <Label htmlFor="estado_obra">Estado</Label>
            <Select
              value={localFormData.estado_obra || undefined}
              onValueChange={(value) => setLocalFormData({ ...localFormData, estado_obra: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={`obra-${uf}`} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            checked={localFormData.criar_usuario || false}
            onChange={(e) => setLocalFormData({ ...localFormData, criar_usuario: e.target.checked })}
            disabled={isEdit && localFormData.criar_usuario}
            className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Label htmlFor="criar_usuario" className={`text-sm font-medium ${isEdit && localFormData.criar_usuario ? 'text-gray-500' : ''}`}>
            {isEdit && localFormData.criar_usuario 
              ? 'Usuário já criado para o representante' 
              : 'Criar usuário para o representante'
            }
          </Label>
        </div>

        {localFormData.criar_usuario && (
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

      {/* Seção de Upload de Arquivos */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <Label className="text-base font-medium">Arquivos do Cliente</Label>
          <p className="text-sm text-gray-500 mb-3">
            Você pode fazer upload de múltiplos arquivos relacionados ao cliente (documentos, contratos, etc.)
          </p>
          
          <div className="space-y-3">
            {/* Arquivos existentes (apenas na edição) */}
            {isEdit && clienteArquivos.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Arquivos existentes ({clienteArquivos.length})
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {loadingArquivos ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Carregando arquivos...</span>
                    </div>
                  ) : (
                    clienteArquivos.map((arquivo) => (
                      <div
                        key={arquivo.id}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{arquivo.nome_original}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(arquivo.tamanho)} • {new Date(arquivo.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(arquivo.caminho, '_blank')}
                            disabled={isSubmitting || uploadingFiles}
                            className="h-8 w-8 p-0"
                            title="Visualizar arquivo"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onRemoverArquivo && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoverArquivo(arquivo.id)}
                              disabled={isSubmitting || uploadingFiles}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              title="Remover arquivo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Input de arquivo */}
            <div>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                disabled={isSubmitting || uploadingFiles}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: PDF, Word, Excel, Imagens, TXT. Tamanho máximo: 10MB por arquivo.
              </p>
            </div>

            {/* Lista de arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Arquivos selecionados para upload ({selectedFiles.length})
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isSubmitting || uploadingFiles}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || uploadingFiles}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || uploadingFiles}>
          {(isSubmitting || uploadingFiles) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
  const [arquivos, setArquivos] = useState<any[]>([])
  const [loadingArquivos, setLoadingArquivos] = useState(false)

  const formatarLinhaCidadeEstado = (cidade?: string, estado?: string) => {
    if (cidade && estado) return `${cidade}/${estado}`
    return cidade || estado || ''
  }

  // Carregar arquivos quando o componente é montado
  useEffect(() => {
    const carregarArquivos = async () => {
      try {
        setLoadingArquivos(true)
        const response = await apiArquivos.obterPorEntidade('cliente', cliente.id)
        setArquivos(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Erro ao carregar arquivos do cliente:', error)
        setArquivos([])
      } finally {
        setLoadingArquivos(false)
      }
    }
    carregarArquivos()
  }, [cliente.id])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
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
            {cliente.inscricao_estadual && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inscrição Estadual:</span>
                <span className="text-sm">{cliente.inscricao_estadual}</span>
              </div>
            )}
            {cliente.inscricao_municipal && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inscrição Municipal:</span>
                <span className="text-sm">{cliente.inscricao_municipal}</span>
              </div>
            )}
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
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</p>
              {cliente.endereco && (
                <p className="text-sm">{cliente.endereco}</p>
              )}
              {cliente.endereco_complemento && (
                <p className="text-sm">Complemento: {cliente.endereco_complemento}</p>
              )}
              {(cliente.cidade || cliente.estado) && (
                <p className="text-sm">{formatarLinhaCidadeEstado(cliente.cidade, cliente.estado)}</p>
              )}
              {cliente.cep && (
                <p className="text-sm">CEP: {cliente.cep}</p>
              )}
            </div>

            {(cliente.endereco_obra || cliente.endereco_obra_complemento || cliente.cidade_obra || cliente.estado_obra || cliente.cep_obra) && (
              <div className="space-y-1 pt-3 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Obra</p>
                {cliente.endereco_obra && (
                  <p className="text-sm">{cliente.endereco_obra}</p>
                )}
                {cliente.endereco_obra_complemento && (
                  <p className="text-sm">Complemento: {cliente.endereco_obra_complemento}</p>
                )}
                {(cliente.cidade_obra || cliente.estado_obra) && (
                  <p className="text-sm">{formatarLinhaCidadeEstado(cliente.cidade_obra, cliente.estado_obra)}</p>
                )}
                {cliente.cep_obra && (
                  <p className="text-sm">CEP: {cliente.cep_obra}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pessoa de Contato */}
      {(cliente.contato || cliente.contato_email || cliente.contato_cargo || cliente.contato_telefone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cliente.contato && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nome:</span>
                <span className="text-sm font-medium">{cliente.contato}</span>
              </div>
            )}
            {cliente.contato_cargo && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cargo:</span>
                <span className="text-sm">{cliente.contato_cargo}</span>
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

      {/* Arquivos do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Arquivos ({arquivos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingArquivos ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Carregando arquivos...</span>
            </div>
          ) : arquivos.length > 0 ? (
            <div className="space-y-2">
              {arquivos.map((arquivo) => (
                <div
                  key={arquivo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{arquivo.nome_original}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(arquivo.tamanho)}</span>
                        <span>•</span>
                        <span>{new Date(arquivo.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(arquivo.caminho, '_blank')}
                    className="flex-shrink-0"
                    title="Visualizar arquivo"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum arquivo encontrado para este cliente
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
}












