"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ConeIcon as Crane,
  Plus,
  Search,
  Edit,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  FileText,
  Calculator,
  Users,
  Settings,
  Eye,
  Trash2,
  Upload,
  Download,
  File,
  Image,
  FileImage,
  Download as ExportIcon,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
} from "lucide-react"


const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
export default function GruasPage() {
  const { toast } = useToast()
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPropostaOpen, setIsPropostaOpen] = useState(false)
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false)
  const [editingGrua, setEditingGrua] = useState<any>(null)
  const [selectedGrua, setSelectedGrua] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Função para fazer requisições autenticadas
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    return AuthService.authenticatedRequest(url, options)
  }

  // Função para criar relacionamentos (funcionários, equipamentos, obras)
  const criarRelacionamentos = async (gruaId: string) => {
    try {
      console.log('🔍 DEBUG: Criando relacionamentos para grua:', gruaId)
      console.log('🔍 DEBUG: Funcionários:', funcionarios)
      console.log('🔍 DEBUG: Equipamentos:', equipamentos)
      console.log('🔍 DEBUG: Obra Data:', obraData)
      
      // Se não há dados para criar relacionamentos, não fazer nada
      if (funcionarios.length === 0 && equipamentos.length === 0 && 
          (!obraData.nomeObra || !obraData.enderecoObra || !obraData.cidadeObra)) {
        console.log('🔍 DEBUG: Nenhum relacionamento para criar')
        return
      }
      
      // 1. Criar/relacionar funcionários se houver
      if (funcionarios.length > 0) {
        for (const funcionario of funcionarios) {
          let funcionarioId = funcionario.id
          
          // Se não é um funcionário existente, criar novo
          if (!funcionario.existente) {
            const funcionarioData = {
              nome: funcionario.nome,
              cargo: funcionario.cargo,
              telefone: funcionario.telefone || null,
              email: null, // Pode ser adicionado depois se necessário
              status: "Ativo"
            }
            
            const funcionarioResponse = await apiRequest(buildApiUrl(API_ENDPOINTS.FUNCIONARIOS), {
              method: 'POST',
              body: JSON.stringify(funcionarioData),
            })
            
            funcionarioId = funcionarioResponse.data.id
          }
          
          // Criar relacionamento grua-funcionário
          const relacionamentoData = {
            grua_id: gruaId,
            funcionario_id: funcionarioId,
            data_inicio: new Date().toISOString().split('T')[0],
            status: "Ativo"
          }
          
          await apiRequest(buildApiUrl(`${API_ENDPOINTS.RELACIONAMENTOS}/grua-funcionario`), {
            method: 'POST',
            body: JSON.stringify(relacionamentoData),
          })
        }
      }

      // 2. Criar equipamentos se houver
      if (equipamentos.length > 0) {
        for (const equipamento of equipamentos) {
          // Primeiro, criar o equipamento
          const equipamentoData = {
            nome: equipamento.nome,
            tipo: equipamento.tipo,
            capacidade: "Não especificado", // Pode ser adicionado depois
            status: "Disponível" // API só aceita: Disponível, Operacional, Manutenção
          }
          
          const equipamentoResponse = await apiRequest(buildApiUrl(API_ENDPOINTS.EQUIPAMENTOS), {
            method: 'POST',
            body: JSON.stringify(equipamentoData),
          })
          
          // Criar relacionamento grua-equipamento
          const relacionamentoData = {
            grua_id: gruaId,
            equipamento_id: equipamentoResponse.data.id,
            data_inicio: new Date().toISOString().split('T')[0],
            status: "Ativo"
          }
          
          await apiRequest(buildApiUrl(`${API_ENDPOINTS.RELACIONAMENTOS}/grua-equipamento`), {
            method: 'POST',
            body: JSON.stringify(relacionamentoData),
          })
        }
      }

      // 3. Criar obra se houver dados
      if (obraData.nomeObra && obraData.enderecoObra && obraData.cidadeObra) {
        // Primeiro, criar a obra
        const obraDataToSend = {
          nome: obraData.nomeObra,
          cliente_id: clienteSelecionado?.id ? parseInt(clienteSelecionado.id) : 1, // Usar cliente padrão se não houver selecionado
          endereco: obraData.enderecoObra,
          cidade: obraData.cidadeObra,
          estado: "SP", // Pode ser adicionado depois
          tipo: obraData.tipoObra,
          cep: obraData.cepObra || null,
          contato_obra: obraData.contato || null,
          telefone_obra: obraData.telefoneContato || null,
          email_obra: obraData.emailContato || null,
          status: "Pausada",
          // Incluir dados do cliente para criação automática se necessário
          cliente_nome: clienteSelecionado?.nome || obraData.nomeObra,
          cliente_cnpj: clienteSelecionado?.cnpj || obraData.cnpjCliente || "00000000000000",
          cliente_email: clienteSelecionado?.email || obraData.emailContato || null,
          cliente_telefone: clienteSelecionado?.telefone || obraData.telefoneContato || null
        }
        
        console.log('🔍 DEBUG - Dados da obra a ser enviada:', obraDataToSend)
        
        const obraResponse = await apiRequest(buildApiUrl(API_ENDPOINTS.OBRAS), {
          method: 'POST',
          body: JSON.stringify(obraDataToSend),
        })
        
        // Criar relacionamento grua-obra
        const relacionamentoData = {
          grua_id: gruaId,
          obra_id: obraResponse.data.id,
          data_inicio_locacao: obraData.dataInicio || new Date().toISOString().split('T')[0],
          status: "Ativa"
        }
        
        await apiRequest(buildApiUrl(`${API_ENDPOINTS.RELACIONAMENTOS}/grua-obra`), {
          method: 'POST',
          body: JSON.stringify(relacionamentoData),
        })
      }
      
      console.log('✅ Relacionamentos criados com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar relacionamentos:', error)
      // Não falhar a criação da grua se os relacionamentos falharem
    }
  }

  // Carregar gruas do backend
  const loadGruas = async (page = pagination.page, limit = pagination.limit, status = filtros.status, tipo = filtros.tipo) => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir query string com parâmetros
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (status) params.append('status', status)
      if (tipo) params.append('tipo', tipo)
      
      const response = await apiRequest(`${buildApiUrl(API_ENDPOINTS.GRUAS)}?${params.toString()}`)
      
      if (response.success) {
        setGruas(response.data || [])
        
        // Atualizar paginação se disponível
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        throw new Error('Erro ao carregar guindastes')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar guindastes'
      setError(errorMessage)
      console.error('Erro ao carregar gruas:', err)
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    loadGruas()
    loadEquipamentosExistentes()
    loadFuncionariosExistentes()
  }, [])

  // Função para carregar equipamentos existentes
  const loadEquipamentosExistentes = async () => {
    try {
      const response = await apiRequest(buildApiUrl(API_ENDPOINTS.EQUIPAMENTOS))
      if (response.success) {
        setEquipamentosExistentes(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    }
  }

  // Função para carregar funcionários existentes
  const loadFuncionariosExistentes = async () => {
    try {
      const response = await apiRequest(buildApiUrl(API_ENDPOINTS.FUNCIONARIOS))
      if (response.success) {
        setFuncionariosExistentes(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  // Função para carregar detalhes completos da grua
  const loadGruaDetalhes = async (gruaId: string) => {
    try {
      setLoading(true)
      const response = await apiRequest(buildApiUrl(`${API_ENDPOINTS.GRUAS}/${gruaId}`))
      
      if (response.success) {
        setSelectedGrua(response.data)
        return response.data
      } else {
        throw new Error('Erro ao carregar detalhes da grua')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes da grua'
      console.error('Erro ao carregar detalhes da grua:', err)
      toast({
        title: "Erro ao carregar detalhes",
        description: errorMessage,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    id: "",
    modelo: "",
    fabricante: "",
    tipo: "Grua Torre",
    capacidade: "",
    capacidade_ponta: "",
    lanca: "",
    altura_trabalho: "",
    ano: "",
    status: "Disponível",
    localizacao: "",
    cliente: "",
    operador: "",
    sinaleiro: "",
    horas_operacao: 0,
    valor_locacao: 0,
    valor_real: 0,
    valor_operacao: 0,
    valor_sinaleiro: 0,
  })

  // Estados para gerenciamento de clientes
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [buscaCliente, setBuscaCliente] = useState("")
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [criandoCliente, setCriandoCliente] = useState(false)

  const [obraData, setObraData] = useState({
    nomeObra: "",
    enderecoObra: "",
    cidadeObra: "",
    cepObra: "",
    tipoObra: "Residencial",
    contato: "",
    telefoneContato: "",
    emailContato: "",
    cnpjCliente: "",
    prazoMeses: 6,
    dataInicio: "",
    dataFim: "",
  })

  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [funcionariosExistentes, setFuncionariosExistentes] = useState<any[]>([])
  const [buscaFuncionario, setBuscaFuncionario] = useState("")
  const [mostrarSugestoesFuncionarios, setMostrarSugestoesFuncionarios] = useState(false)
  const [criandoNovoFuncionario, setCriandoNovoFuncionario] = useState(false)
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [equipamentosExistentes, setEquipamentosExistentes] = useState<any[]>([])
  const [buscaEquipamento, setBuscaEquipamento] = useState("")
  const [mostrarSugestoesEquipamentos, setMostrarSugestoesEquipamentos] = useState(false)
  const [criandoNovoEquipamento, setCriandoNovoEquipamento] = useState(false)

  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: "",
    cargo: "Operador",
    telefone: "",
    turno: "Diurno",
  })

  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: "",
    tipo: "Garra",
    status: "Disponível",
    responsavel: "",
  })

  const [propostaData, setPropostaData] = useState({
    cliente: "",
    cnpj: "",
    obra: "",
    endereco: "",
    cidade: "",
    prazoMeses: 6,
    dataInicio: "",
    alturaFinal: "",
    tipoBase: "Base Fixa",
    voltagem: "380V",
    potencia: "72 KVA",
    observacoes: "",
    // Novos campos da API
    fabricante: "",
    modelo: "",
    tipo: "",
    capacidade: "",
    capacidadePonta: "",
    lanca: "",
    ano: "",
    status: "",
    localizacao: "",
    horasOperacao: 0,
    valorLocacao: 0,
    valorOperacao: 0,
    valorSinaleiro: 0,
    funcionarios: [],
    equipamentos: [],
    contatoObra: "",
    telefoneObra: "",
    emailObra: "",
  })

  // Estados para gerenciamento de arquivos
  const [arquivos, setArquivos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  // Estados para paginação e filtros
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filtros, setFiltros] = useState({
    status: "",
    tipo: ""
  })

  // Filtro local apenas para busca por texto (searchTerm)
  const filteredGruas = gruas.filter(
    (grua) =>
      grua.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grua.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grua.localizacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grua.grua_obras && grua.grua_obras.length > 0 && grua.grua_obras[0].obra?.nome?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disponível":
        return <Badge className="bg-green-100 text-green-800">Disponível</Badge>
      case "Operacional":
        return <Badge className="bg-blue-100 text-blue-800">Operacional</Badge>
      case "Manutenção":
        return <Badge className="bg-yellow-100 text-yellow-800">Manutenção</Badge>
      case "Vendida":
        return <Badge className="bg-red-100 text-red-800">Vendida</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0,00"
    }
    return Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para buscar clientes
  const buscarClientes = async (query: string) => {
    if (query.length < 2) {
      setClientes([])
      return
    }

    try {
      const data = await apiRequest(buildApiUrl(`${API_ENDPOINTS.GRUAS}/clientes/buscar?q=${encodeURIComponent(query)}`))
      setClientes(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
    }
  }

  // Função para buscar funcionários existentes
  const buscarFuncionarios = async (query: string) => {
    if (query.length < 2) {
      setFuncionariosExistentes([])
      return
    }

    try {
      const data = await apiRequest(buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/buscar?q=${encodeURIComponent(query)}`))
      setFuncionariosExistentes(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error)
      setFuncionariosExistentes([])
    }
  }

  // Função para selecionar cliente
  const selecionarCliente = (cliente: any) => {
    setClienteSelecionado(cliente)
    setBuscaCliente(cliente.nome)
    setFormData({ ...formData, cliente: cliente.nome })
    setMostrarSugestoes(false)
  }

  // Função para limpar seleção de cliente
  const limparCliente = () => {
    setClienteSelecionado(null)
    setBuscaCliente("")
    setFormData({ ...formData, cliente: "" })
    setClientes([])
    setMostrarSugestoes(false)
  }

  // Função para selecionar funcionário existente
  const selecionarFuncionarioExistente = (funcionario: any) => {
    adicionarFuncionarioExistente(funcionario)
  }

  // Função para alternar entre criar novo e selecionar existente
  const alternarModoFuncionario = () => {
    setCriandoNovoFuncionario(!criandoNovoFuncionario)
    setBuscaFuncionario("")
    setFuncionariosExistentes([])
    setMostrarSugestoesFuncionarios(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validação de campos obrigatórios
    if (!formData.modelo.trim()) {
      setError("Modelo é obrigatório")
      setSubmitting(false)
      return
    }
    if (!formData.fabricante.trim()) {
      setError("Fabricante é obrigatório")
      setSubmitting(false)
      return
    }
    if (!formData.capacidade.trim()) {
      setError("Capacidade é obrigatória")
      setSubmitting(false)
      return
    }
    if (!formData.capacidade_ponta.trim()) {
      setError("Capacidade na ponta é obrigatória")
      setSubmitting(false)
      return
    }
    if (!formData.lanca.trim()) {
      setError("Comprimento da lança é obrigatório")
      setSubmitting(false)
      return
    }

    try {
      // Preparar dados base - baseado no schema real da tabela gruas do Supabase
      const baseData: any = {
        // Campos obrigatórios
        modelo: formData.modelo,
        fabricante: formData.fabricante,
        tipo: formData.tipo,
        capacidade: formData.capacidade,
        capacidade_ponta: formData.capacidade_ponta || "Não especificado",
        lanca: formData.lanca || "Não especificado",
        status: formData.status,
        
        // Campos com valores padrão conforme schema da tabela
        altura_trabalho: formData.altura_trabalho || null,
        ano: formData.ano ? parseInt(formData.ano) : null,
        localizacao: formData.localizacao || null,
        horas_operacao: formData.horas_operacao || 0, // Valor padrão da tabela
        valor_locacao: formData.valor_locacao || null,
        valor_real: formData.valor_real || 0, // Valor padrão para evitar NOT NULL
        valor_operacao: formData.valor_operacao || 0, // Valor padrão para evitar NOT NULL
        valor_sinaleiro: formData.valor_sinaleiro || 0, // Valor padrão para evitar NOT NULL
        
        // Dados do cliente - usar dados da aba Obra/Cliente se cliente selecionado não tiver
        cliente_nome: formData.cliente || null,
        cliente_documento: clienteSelecionado?.cnpj || obraData.cnpjCliente || null,
        cliente_email: clienteSelecionado?.email || obraData.emailContato || null,
        cliente_telefone: clienteSelecionado?.telefone || obraData.telefoneContato || null,
      }

      if (editingGrua) {
        // Atualizar grua existente - não incluir id no corpo da requisição
        await apiRequest(buildApiUrl(`${API_ENDPOINTS.GRUAS}/${editingGrua.id}`), {
          method: 'PUT',
          body: JSON.stringify(baseData),
        })
        
        // Criar/atualizar relacionamentos se houver dados
        await criarRelacionamentos(editingGrua.id)
        
        toast({
          title: "Sucesso!",
          description: "Guindaste atualizado com sucesso.",
        })
      } else {
        // Criar nova grua - não incluir id
        const gruaResponse = await apiRequest(buildApiUrl(API_ENDPOINTS.GRUAS), {
          method: 'POST',
          body: JSON.stringify(baseData),
        })
        
        const novaGruaId = gruaResponse.data.id
        
        // Criar relacionamentos se houver dados
        await criarRelacionamentos(novaGruaId)
        
        toast({
          title: "Sucesso!",
          description: "Guindaste criado com sucesso.",
        })
      }

      // Recarregar lista de guindastes
      await loadGruas(pagination.page, pagination.limit, filtros.status, filtros.tipo)

      // Limpar formulário e fechar modal
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar guindaste'
      setError(errorMessage)
      console.error('Erro ao salvar grua:', err)
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      id: "",
      modelo: "",
      fabricante: "",
      tipo: "Grua Torre",
      capacidade: "",
      capacidade_ponta: "",
      lanca: "",
      altura_trabalho: "",
      ano: "",
      status: "Disponível",
      localizacao: "",
      cliente: "",
      operador: "",
      sinaleiro: "",
      horas_operacao: 0,
      valor_locacao: 0,
      valor_real: 0,
      valor_operacao: 0,
      valor_sinaleiro: 0,
    })
    
    setObraData({
      nomeObra: "",
      enderecoObra: "",
      cidadeObra: "",
      cepObra: "",
      tipoObra: "Residencial",
      contato: "",
      telefoneContato: "",
      emailContato: "",
      cnpjCliente: "",
      prazoMeses: 6,
      dataInicio: "",
      dataFim: "",
    })
    
    setFuncionarios([])
    setEquipamentos([])
    setEditingGrua(null)
    setIsDialogOpen(false)
    // Limpar dados do cliente
    setClienteSelecionado(null)
    setBuscaCliente("")
    setClientes([])
    setMostrarSugestoes(false)
    // Limpar dados dos funcionários
    setFuncionariosExistentes([])
    setBuscaFuncionario("")
    setMostrarSugestoesFuncionarios(false)
    setCriandoNovoFuncionario(false)
  }

  // Função para deletar grua
  const handleDelete = async (gruaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta grua?')) {
      return
    }

    try {
      setError(null)
      await apiRequest(buildApiUrl(`${API_ENDPOINTS.GRUAS}/${gruaId}`), {
        method: 'DELETE',
      })
      await loadGruas(pagination.page, pagination.limit, filtros.status, filtros.tipo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir grua')
      console.error('Erro ao excluir grua:', err)
    }
  }

  // Função para carregar dados completos da grua
  const carregarDadosCompletosGrua = async (gruaId: string) => {
    try {
      const data = await apiRequest(buildApiUrl(`${API_ENDPOINTS.GRUAS}/${gruaId}`))
      return data.data
    } catch (error) {
      console.error('Erro ao carregar dados da grua:', error)
      return null
    }
  }

  const handleEdit = async (grua: any) => {
    setEditingGrua(grua)
    
    // Carregar dados completos da grua com relacionamentos
    const dadosCompletos = await carregarDadosCompletosGrua(grua.id)
    
    if (dadosCompletos) {
      // Preencher dados básicos da grua
      setFormData({
        id: dadosCompletos.id,
        modelo: dadosCompletos.modelo,
        fabricante: dadosCompletos.fabricante,
        tipo: dadosCompletos.tipo,
        capacidade: dadosCompletos.capacidade,
        capacidade_ponta: dadosCompletos.capacidade_ponta || "",
        lanca: dadosCompletos.lanca,
        altura_trabalho: dadosCompletos.altura_trabalho || "",
        ano: dadosCompletos.ano || "",
        status: dadosCompletos.status,
        localizacao: dadosCompletos.localizacao || "",
        cliente: dadosCompletos.cliente_nome || "",
        operador: "",
        sinaleiro: "",
        horas_operacao: dadosCompletos.horas_operacao || 0,
        valor_locacao: dadosCompletos.valor_locacao || 0,
        valor_real: dadosCompletos.valor_real || 0,
        valor_operacao: dadosCompletos.valor_operacao || 0,
        valor_sinaleiro: dadosCompletos.valor_sinaleiro || 0,
      })
      
      // Preencher dados da obra se existir
      if (dadosCompletos.grua_obras && dadosCompletos.grua_obras.length > 0) {
        const obra = dadosCompletos.grua_obras[0].obra
        setObraData({
          nomeObra: obra?.nome || "",
          enderecoObra: obra?.endereco || "",
          cidadeObra: obra?.cidade || "",
          cepObra: obra?.cep || "",
          tipoObra: obra?.tipo || "Residencial",
          contato: obra?.contato_obra || "",
          telefoneContato: obra?.telefone_obra || "",
          emailContato: obra?.email_obra || "",
          cnpjCliente: dadosCompletos.cliente_documento || "",
          prazoMeses: 6,
          dataInicio: dadosCompletos.grua_obras[0].data_inicio_locacao || "",
          dataFim: dadosCompletos.grua_obras[0].data_fim_locacao || "",
        })
      } else {
        // Limpar dados da obra se não existir
        setObraData({
          nomeObra: "",
          enderecoObra: "",
          cidadeObra: "",
          cepObra: "",
          tipoObra: "Residencial",
          contato: "",
          telefoneContato: "",
          emailContato: "",
          cnpjCliente: dadosCompletos.cliente_documento || "",
          prazoMeses: 6,
          dataInicio: "",
          dataFim: "",
        })
      }
      
      // Preencher funcionários existentes
      if (dadosCompletos.grua_funcionarios && dadosCompletos.grua_funcionarios.length > 0) {
        const funcionariosExistentes = dadosCompletos.grua_funcionarios.map((rel: any) => ({
          id: rel.funcionario.id,
          nome: rel.funcionario.nome,
          cargo: rel.funcionario.cargo,
          telefone: rel.funcionario.telefone || "",
          turno: "Diurno", // Valor padrão, pode ser expandido depois
        }))
        setFuncionarios(funcionariosExistentes)
      } else {
        setFuncionarios([])
      }
      
      // Preencher equipamentos existentes
      if (dadosCompletos.grua_equipamentos && dadosCompletos.grua_equipamentos.length > 0) {
        const equipamentosExistentes = dadosCompletos.grua_equipamentos.map((rel: any) => ({
          id: rel.equipamento.id,
          nome: rel.equipamento.nome,
          tipo: rel.equipamento.tipo,
          status: rel.equipamento.status,
          responsavel: "", // Valor padrão, pode ser expandido depois
        }))
        setEquipamentos(equipamentosExistentes)
      } else {
        setEquipamentos([])
      }
      
      // Se houver dados de cliente, definir como selecionado
      // Primeiro, tentar dados diretos da grua
      if (dadosCompletos.cliente_nome) {
        setClienteSelecionado({
          id: dadosCompletos.cliente_id || null,
          nome: dadosCompletos.cliente_nome,
          cnpj: dadosCompletos.cliente_documento,
          email: dadosCompletos.cliente_email,
          telefone: dadosCompletos.cliente_telefone,
        })
        setBuscaCliente(dadosCompletos.cliente_nome)
      } 
      // Se não houver dados diretos, tentar através da obra
      else if (dadosCompletos.grua_obras && dadosCompletos.grua_obras.length > 0 && dadosCompletos.grua_obras[0].obra?.cliente) {
        const cliente = dadosCompletos.grua_obras[0].obra.cliente
        setClienteSelecionado({
          id: cliente.id,
          nome: cliente.nome,
          cnpj: cliente.cnpj,
          email: cliente.email,
          telefone: cliente.telefone,
        })
        setBuscaCliente(cliente.nome)
      }
    } else {
      // Fallback para dados básicos se não conseguir carregar dados completos
      setFormData({
        id: grua.id,
        modelo: grua.modelo,
        fabricante: grua.fabricante,
        tipo: grua.tipo,
        capacidade: grua.capacidade,
        capacidade_ponta: grua.capacidade_ponta || "",
        lanca: grua.lanca,
        altura_trabalho: grua.altura_trabalho || "",
        ano: grua.ano || "",
        status: grua.status,
        localizacao: grua.localizacao || "",
        cliente: grua.cliente || "",
        operador: "",
        sinaleiro: "",
        horas_operacao: grua.horas_operacao || 0,
        valor_locacao: grua.valor_locacao || 0,
        valor_real: grua.valor_real || 0,
        valor_operacao: grua.valor_operacao || 0,
        valor_sinaleiro: grua.valor_sinaleiro || 0,
      })
      
      setObraData({
        nomeObra: "",
        enderecoObra: "",
        cidadeObra: "",
        cepObra: "",
        tipoObra: "Residencial",
        contato: "",
        telefoneContato: "",
        emailContato: "",
        cnpjCliente: "",
        prazoMeses: 6,
        dataInicio: "",
        dataFim: "",
      })
      
      setFuncionarios([])
      setEquipamentos([])
    }
    
    setIsDialogOpen(true)
  }

  const adicionarFuncionario = () => {
    if (criandoNovoFuncionario) {
      // Modo criar novo funcionário
      if (novoFuncionario.nome && novoFuncionario.cargo) {
        setFuncionarios([...funcionarios, { ...novoFuncionario, id: Date.now(), existente: false }])
        setNovoFuncionario({ nome: "", cargo: "Operador", telefone: "", turno: "Diurno" })
      }
    } else {
      // Modo selecionar existente - apenas mostrar mensagem se não há busca
      if (!buscaFuncionario || buscaFuncionario.length < 2) {
        toast({
          title: "Busca necessária",
          description: "Digite pelo menos 2 caracteres para buscar funcionários existentes",
          variant: "destructive",
        })
      }
    }
  }

  const removerFuncionario = (id: number) => {
    setFuncionarios(funcionarios.filter(f => f.id !== id))
  }

  const adicionarEquipamento = () => {
    if (novoEquipamento.nome) {
      setEquipamentos([...equipamentos, { ...novoEquipamento, id: Date.now() }])
      setNovoEquipamento({ nome: "", tipo: "Garra", status: "Disponível", responsavel: "" })
    }
  }

  const removerEquipamento = (id: number) => {
    setEquipamentos(equipamentos.filter(e => e.id !== id))
  }

  // Função para adicionar equipamento existente
  const adicionarEquipamentoExistente = (equipamento: any) => {
    if (!equipamentos.find(e => e.id === equipamento.id)) {
      setEquipamentos([...equipamentos, {
        id: equipamento.id,
        nome: equipamento.nome,
        tipo: equipamento.tipo,
        status: equipamento.status,
        responsavel: "",
      }])
    }
    setBuscaEquipamento("")
    setMostrarSugestoesEquipamentos(false)
  }

  // Função para adicionar equipamento existente à grua selecionada
  const adicionarEquipamentoExistenteAGrua = async (equipamento: any) => {
    try {
      if (!selectedGrua) return

      // Criar relacionamento no backend
      const relacionamentoData = {
        grua_id: selectedGrua.id,
        equipamento_id: equipamento.id,
        data_inicio: new Date().toISOString().split('T')[0],
        status: "Ativo"
      }
      
      await apiRequest(buildApiUrl(`${API_ENDPOINTS.RELACIONAMENTOS}/grua-equipamento`), {
        method: 'POST',
        body: JSON.stringify(relacionamentoData),
      })

      // Adicionar equipamento ao array local também (para exibição no formulário)
      if (!equipamentos.find(e => e.id === equipamento.id)) {
        setEquipamentos([...equipamentos, {
          id: equipamento.id,
          nome: equipamento.nome,
          tipo: equipamento.tipo,
          status: equipamento.status,
          responsavel: "",
        }])
      }

      // Atualizar a grua selecionada
      const dadosCompletos = await carregarDadosCompletosGrua(selectedGrua.id)
      if (dadosCompletos) {
        setSelectedGrua(dadosCompletos)
      }

      setBuscaEquipamento("")
      setMostrarSugestoesEquipamentos(false)
      
      toast({
        title: "Equipamento adicionado",
        description: `${equipamento.nome} foi adicionado à grua com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar equipamento à grua",
        variant: "destructive",
      })
    }
  }

  // Função para adicionar funcionário existente
  const adicionarFuncionarioExistente = (funcionario: any) => {
    if (!funcionarios.find(f => f.id === funcionario.id)) {
      setFuncionarios([...funcionarios, {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        telefone: funcionario.telefone || "",
        turno: "Diurno",
      }])
    }
    setBuscaFuncionario("")
    setMostrarSugestoesFuncionarios(false)
  }

  // Função para adicionar funcionário existente à grua selecionada
  const adicionarFuncionarioExistenteAGrua = async (funcionario: any) => {
    try {
      if (!selectedGrua) return

      // Criar relacionamento no backend
      const relacionamentoData = {
        grua_id: selectedGrua.id,
        funcionario_id: funcionario.id,
        data_inicio: new Date().toISOString().split('T')[0],
        status: "Ativo"
      }
      
      await apiRequest(buildApiUrl(`${API_ENDPOINTS.RELACIONAMENTOS}/grua-funcionario`), {
        method: 'POST',
        body: JSON.stringify(relacionamentoData),
      })

      // Atualizar a grua selecionada
      const dadosCompletos = await carregarDadosCompletosGrua(selectedGrua.id)
      if (dadosCompletos) {
        setSelectedGrua(dadosCompletos)
      }

      setBuscaFuncionario("")
      setMostrarSugestoesFuncionarios(false)
      
      toast({
        title: "Funcionário adicionado",
        description: `${funcionario.nome} foi adicionado à grua com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar funcionário à grua",
        variant: "destructive",
      })
    }
  }

  // Função para remover equipamento da grua
  const removerEquipamentoDaGrua = async (equipamentoId: number) => {
    try {
      // Aqui você pode implementar a lógica para remover o relacionamento no backend
      // Por enquanto, apenas remove do estado local
      setEquipamentos(equipamentos.filter(e => e.id !== equipamentoId))
      
      toast({
        title: "Equipamento removido",
        description: "Equipamento removido da grua com sucesso",
      })
    } catch (error) {
      console.error('Erro ao remover equipamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover equipamento da grua",
        variant: "destructive",
      })
    }
  }

  // Função para remover equipamento da grua selecionada
  const removerEquipamentoDaGruaSelecionada = async (equipamentoId: number) => {
    try {
      if (!selectedGrua) return

      // Aqui você pode implementar a lógica para remover o relacionamento no backend
      // Por enquanto, apenas atualiza a grua selecionada
      const dadosCompletos = await carregarDadosCompletosGrua(selectedGrua.id)
      if (dadosCompletos) {
        setSelectedGrua(dadosCompletos)
      }
      
      toast({
        title: "Equipamento removido",
        description: "Equipamento removido da grua com sucesso",
      })
    } catch (error) {
      console.error('Erro ao remover equipamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover equipamento da grua",
        variant: "destructive",
      })
    }
  }

  // Função para remover funcionário da grua
  const removerFuncionarioDaGrua = async (funcionarioId: number) => {
    try {
      // Aqui você pode implementar a lógica para remover o relacionamento no backend
      // Por enquanto, apenas remove do estado local
      setFuncionarios(funcionarios.filter(f => f.id !== funcionarioId))
      
      toast({
        title: "Funcionário removido",
        description: "Funcionário removido da grua com sucesso",
      })
    } catch (error) {
      console.error('Erro ao remover funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover funcionário da grua",
        variant: "destructive",
      })
    }
  }

  // Função para remover funcionário da grua selecionada
  const removerFuncionarioDaGruaSelecionada = async (funcionarioId: number) => {
    try {
      if (!selectedGrua) return

      // Aqui você pode implementar a lógica para remover o relacionamento no backend
      // Por enquanto, apenas atualiza a grua selecionada
      const dadosCompletos = await carregarDadosCompletosGrua(selectedGrua.id)
      if (dadosCompletos) {
        setSelectedGrua(dadosCompletos)
      }
      
      toast({
        title: "Funcionário removido",
        description: "Funcionário removido da grua com sucesso",
      })
    } catch (error) {
      console.error('Erro ao remover funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover funcionário da grua",
        variant: "destructive",
      })
    }
  }

  const gerarProposta = async (grua: any) => {
    try {
      // Carregar dados completos da grua
      const dadosCompletos = await carregarDadosCompletosGrua(grua.id)
      
      if (dadosCompletos) {
        setSelectedGrua(dadosCompletos)
        
        // Preencher campos da proposta com dados completos da grua
        setPropostaData({
          cliente: dadosCompletos.grua_obras?.[0]?.obra?.cliente?.nome || "",
          cnpj: dadosCompletos.grua_obras?.[0]?.obra?.cliente?.cnpj || "",
          obra: dadosCompletos.grua_obras?.[0]?.obra?.nome || "",
          endereco: dadosCompletos.grua_obras?.[0]?.obra?.endereco || dadosCompletos.localizacao || "",
          cidade: dadosCompletos.grua_obras?.[0]?.obra?.cidade || "",
          prazoMeses: dadosCompletos.grua_obras?.[0]?.prazo_meses || 6,
          dataInicio: dadosCompletos.grua_obras?.[0]?.data_inicio_locacao || new Date().toISOString().split('T')[0],
          alturaFinal: dadosCompletos.altura_trabalho || dadosCompletos.alturaTrabalho || "",
          tipoBase: "Base Fixa",
          voltagem: dadosCompletos.voltagem || "380V",
          potencia: dadosCompletos.potencia || "72 KVA",
          observacoes: dadosCompletos.observacoes || "",
          // Dados da grua
          fabricante: dadosCompletos.fabricante || "",
          modelo: dadosCompletos.modelo || "",
          tipo: dadosCompletos.tipo || "",
          capacidade: dadosCompletos.capacidade || "",
          capacidadePonta: dadosCompletos.capacidade_ponta || dadosCompletos.capacidadePonta || "",
          lanca: dadosCompletos.lanca || "",
          ano: dadosCompletos.ano?.toString() || "",
          status: dadosCompletos.status || "",
          localizacao: dadosCompletos.localizacao || "",
          horasOperacao: dadosCompletos.horas_operacao || dadosCompletos.horasOperacao || 0,
          valorLocacao: dadosCompletos.valor_locacao || dadosCompletos.valorLocacao || 0,
          valorOperacao: dadosCompletos.valor_operacao || dadosCompletos.valorOperacao || 0,
          valorSinaleiro: dadosCompletos.valor_sinaleiro || dadosCompletos.valorSinaleiro || 0,
          // Funcionários e equipamentos
          funcionarios: dadosCompletos.grua_funcionarios || [],
          equipamentos: dadosCompletos.grua_equipamentos || [],
          // Dados de contato da obra
          contatoObra: dadosCompletos.grua_obras?.[0]?.obra?.contato_obra || "",
          telefoneObra: dadosCompletos.grua_obras?.[0]?.obra?.telefone_obra || "",
          emailObra: dadosCompletos.grua_obras?.[0]?.obra?.email_obra || "",
        })
      } else {
        // Fallback para dados básicos se não conseguir carregar dados completos
        setSelectedGrua(grua)
        setPropostaData({
          cliente: "",
          cnpj: "",
          obra: "",
          endereco: grua.localizacao || "",
          cidade: "",
          prazoMeses: 6,
          dataInicio: new Date().toISOString().split('T')[0],
          alturaFinal: grua.altura_trabalho || "",
          tipoBase: "Base Fixa",
          voltagem: "380V",
          potencia: "72 KVA",
          observacoes: "",
          // Dados da grua
          fabricante: grua.fabricante || "",
          modelo: grua.modelo || "",
          tipo: grua.tipo || "",
          capacidade: grua.capacidade || "",
          capacidadePonta: grua.capacidade_ponta || "",
          lanca: grua.lanca || "",
          ano: grua.ano?.toString() || "",
          status: grua.status || "",
          localizacao: grua.localizacao || "",
          horasOperacao: grua.horas_operacao || 0,
          valorLocacao: grua.valor_locacao || 0,
          valorOperacao: grua.valor_operacao || 0,
          valorSinaleiro: grua.valor_sinaleiro || 0,
          funcionarios: [],
          equipamentos: [],
          contatoObra: "",
          telefoneObra: "",
          emailObra: "",
        })
      }
      
      setIsPropostaOpen(true)
    } catch (error) {
      console.error('Erro ao carregar dados da grua para proposta:', error)
      // Fallback para dados básicos em caso de erro
      setSelectedGrua(grua)
      setPropostaData({
        cliente: "",
        cnpj: "",
        obra: "",
        endereco: grua.localizacao || "",
        cidade: "",
        prazoMeses: 6,
        dataInicio: new Date().toISOString().split('T')[0],
        alturaFinal: grua.altura_trabalho || "",
        tipoBase: "Base Fixa",
        voltagem: "380V",
        potencia: "72 KVA",
        observacoes: "",
        // Dados da grua
        fabricante: grua.fabricante || "",
        modelo: grua.modelo || "",
        tipo: grua.tipo || "",
        capacidade: grua.capacidade || "",
        capacidadePonta: grua.capacidade_ponta || "",
        lanca: grua.lanca || "",
        ano: grua.ano?.toString() || "",
        status: grua.status || "",
        localizacao: grua.localizacao || "",
        horasOperacao: grua.horas_operacao || 0,
        valorLocacao: grua.valor_locacao || 0,
        valorOperacao: grua.valor_operacao || 0,
        valorSinaleiro: grua.valor_sinaleiro || 0,
        funcionarios: [],
        equipamentos: [],
        contatoObra: "",
        telefoneObra: "",
        emailObra: "",
      })
      setIsPropostaOpen(true)
    }
  }

  const calcularValorTotal = () => {
    if (!selectedGrua) return 0
    const valorMensal =
      (selectedGrua.valor_locacao || 0) +
      (selectedGrua.valor_operacao || 0) +
      (selectedGrua.valor_sinaleiro || 0)
    return valorMensal * propostaData.prazoMeses
  }

  // Função para exportar proposta comercial para PDF
  const exportarPropostaPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const { autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF()
      
      // Cabeçalho
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('PROPOSTA COMERCIAL', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Grua: ${propostaData.modelo} - ${propostaData.fabricante}`, 105, 30, { align: 'center' })
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 35, { align: 'center' })
      
      let yPosition = 50
      
      // Dados do Cliente
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('DADOS DO CLIENTE', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Cliente: ${propostaData.cliente}`, 20, yPosition)
      yPosition += 5
      doc.text(`CNPJ: ${propostaData.cnpj}`, 20, yPosition)
      yPosition += 5
      doc.text(`Obra: ${propostaData.obra}`, 20, yPosition)
      yPosition += 5
      doc.text(`Endereço: ${propostaData.endereco}`, 20, yPosition)
      yPosition += 5
      doc.text(`Cidade: ${propostaData.cidade}`, 20, yPosition)
      yPosition += 5
      doc.text(`Contato: ${propostaData.contatoObra}`, 20, yPosition)
      yPosition += 5
      doc.text(`Telefone: ${propostaData.telefoneObra}`, 20, yPosition)
      yPosition += 5
      doc.text(`Email: ${propostaData.emailObra}`, 20, yPosition)
      yPosition += 15
      
      // Dados da Grua
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ESPECIFICAÇÕES DA GRUA', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Modelo: ${propostaData.modelo}`, 20, yPosition)
      yPosition += 5
      doc.text(`Fabricante: ${propostaData.fabricante}`, 20, yPosition)
      yPosition += 5
      doc.text(`Tipo: ${propostaData.tipo}`, 20, yPosition)
      yPosition += 5
      doc.text(`Capacidade: ${propostaData.capacidade}`, 20, yPosition)
      yPosition += 5
      doc.text(`Capacidade na Ponta: ${propostaData.capacidadePonta}`, 20, yPosition)
      yPosition += 5
      doc.text(`Lança: ${propostaData.lanca}`, 20, yPosition)
      yPosition += 5
      doc.text(`Altura de Trabalho: ${propostaData.alturaFinal}`, 20, yPosition)
      yPosition += 5
      doc.text(`Ano: ${propostaData.ano}`, 20, yPosition)
      yPosition += 5
      doc.text(`Status: ${propostaData.status}`, 20, yPosition)
      yPosition += 5
      doc.text(`Localização: ${propostaData.localizacao}`, 20, yPosition)
      yPosition += 5
      doc.text(`Horas de Operação: ${propostaData.horasOperacao}`, 20, yPosition)
      yPosition += 15
      
      // Dados da Locação
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('DADOS DA LOCAÇÃO', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Data de Início: ${propostaData.dataInicio}`, 20, yPosition)
      yPosition += 5
      doc.text(`Prazo: ${propostaData.prazoMeses} meses`, 20, yPosition)
      yPosition += 5
      doc.text(`Tipo de Base: ${propostaData.tipoBase}`, 20, yPosition)
      yPosition += 5
      doc.text(`Voltagem: ${propostaData.voltagem}`, 20, yPosition)
      yPosition += 5
      doc.text(`Potência: ${propostaData.potencia}`, 20, yPosition)
      yPosition += 15
      
      // Valores
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('VALORES', 20, yPosition)
      yPosition += 10
      
      const valorMensal = propostaData.valorLocacao + propostaData.valorOperacao + propostaData.valorSinaleiro
      const valorTotal = valorMensal * propostaData.prazoMeses
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Valor Locação: R$ ${propostaData.valorLocacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 5
      doc.text(`Valor Operação: R$ ${propostaData.valorOperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 5
      doc.text(`Valor Sinaleiro: R$ ${propostaData.valorSinaleiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 5
      doc.text(`Valor Mensal Total: R$ ${valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 5
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`VALOR TOTAL DO CONTRATO: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 15
      
      // Funcionários
      if (propostaData.funcionarios && propostaData.funcionarios.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('FUNCIONÁRIOS', 20, yPosition)
        yPosition += 10
        
        const funcionariosData = propostaData.funcionarios.map((rel: any) => [
          rel.funcionario?.nome || '',
          rel.funcionario?.cargo || '',
          rel.funcionario?.telefone || '',
          rel.status || ''
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Cargo', 'Telefone', 'Status']],
          body: funcionariosData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 10
      }
      
      // Equipamentos
      if (propostaData.equipamentos && propostaData.equipamentos.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('EQUIPAMENTOS', 20, yPosition)
        yPosition += 10
        
        const equipamentosData = propostaData.equipamentos.map((rel: any) => [
          rel.equipamento?.nome || '',
          rel.equipamento?.tipo || '',
          rel.equipamento?.capacidade || '',
          rel.status || ''
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Tipo', 'Capacidade', 'Status']],
          body: equipamentosData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        })
      }
      
      // Observações
      if (propostaData.observacoes) {
        yPosition = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : yPosition + 20
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('OBSERVAÇÕES', 20, yPosition)
        yPosition += 10
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitObservacoes = doc.splitTextToSize(propostaData.observacoes, 170)
        doc.text(splitObservacoes, 20, yPosition)
      }
      
      // Rodapé
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Proposta gerada automaticamente pelo Sistema de Gerenciamento de Gruas', 105, pageHeight - 20, { align: 'center' })
      doc.text(`Data de geração: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 15, { align: 'center' })
      
      // Salvar PDF
      doc.save(`proposta-comercial-${propostaData.modelo}-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Sucesso!",
        description: "Proposta comercial exportada para PDF com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar proposta PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar proposta para PDF.",
        variant: "destructive",
      })
    }
  }

  // Funções para gerenciamento de arquivos
  const carregarArquivos = async (gruaId: string) => {
    try {
      console.log('🔍 DEBUG: Carregando arquivos para grua:', gruaId)
      
      // Tentar carregar arquivos da API (rota específica para gruas)
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/arquivos/grua/${gruaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Mapear os dados da API para o formato esperado pelo frontend
          const arquivosMapeados = result.data.map((arquivo: any) => ({
            id: arquivo.id,
            nome: arquivo.nome_original,
            caminho: arquivo.caminho, // Incluir o caminho completo do arquivo
            tipo: arquivo.tipo_mime,
            tamanho: arquivo.tamanho,
            dataUpload: arquivo.created_at ? arquivo.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            descricao: arquivo.descricao || `Arquivo enviado em ${new Date().toLocaleDateString('pt-BR')}`,
            url: null, // URL será gerada dinamicamente quando necessário
            categoria: arquivo.categoria || 'geral'
          }))
          
          setArquivos(arquivosMapeados)
          console.log('🔍 DEBUG: Arquivos carregados da API:', arquivosMapeados.length)
          return
        }
      }
      
      // Se não conseguir carregar da API, definir array vazio
      console.log('🔍 DEBUG: Nenhum arquivo encontrado na API')
      setArquivos([])
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
      // Em caso de erro, definir array vazio
      setArquivos([])
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos da API.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para fazer upload",
        variant: "destructive",
      })
      return
    }

    if (!selectedGrua?.id) {
      toast({
        title: "Erro",
        description: "ID da grua não encontrado",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      console.log('🔍 DEBUG: Iniciando upload de arquivos')
      console.log('🔍 DEBUG: Grua ID:', selectedGrua.id)
      console.log('🔍 DEBUG: Arquivos selecionados:', selectedFiles.length)

      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        console.log('🔍 DEBUG: Enviando arquivo:', file.name)
        
        const formData = new FormData()
        formData.append('arquivo', file)
        formData.append('categoria', 'geral')
        formData.append('descricao', `Arquivo da grua ${selectedGrua.id}`)

        // Usar a rota principal para gruas (com autenticação)
        const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/arquivos/upload/grua/${selectedGrua.id}`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`Erro no upload: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('🔍 DEBUG: Resultado do upload:', result)

        return {
          id: result.data?.id || Date.now() + Math.random(),
          nome: result.data?.nome_original || file.name,
          tipo: result.data?.tipo_mime || file.type,
          tamanho: result.data?.tamanho || file.size,
          dataUpload: new Date().toISOString().split('T')[0],
          descricao: `Arquivo enviado em ${new Date().toLocaleDateString('pt-BR')}`,
          url: result.data?.url || null,
          categoria: result.data?.categoria || 'geral'
        }
      })

      const novosArquivos = await Promise.all(uploadPromises)
      setArquivos([...arquivos, ...novosArquivos])
      setSelectedFiles(null)
      
      // Limpar o input de arquivo
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      toast({
        title: "Upload realizado com sucesso",
        description: `${novosArquivos.length} arquivo(s) enviado(s) com sucesso`,
      })

      console.log('🔄 DEBUG: Iniciando processo de refresh após upload')
      console.log('🔄 DEBUG: selectedGrua:', selectedGrua)
      console.log('🔄 DEBUG: selectedGrua.id:', selectedGrua?.id)
      
      // Salvar o ID da grua antes de fazer o refresh
      const gruaIdParaReabrir = selectedGrua?.id
      console.log('🔄 DEBUG: ID da grua salvo para reabertura:', gruaIdParaReabrir)
      
      if (!gruaIdParaReabrir) {
        console.error('🔄 DEBUG: ERRO - ID da grua não encontrado!')
        toast({
          title: "Erro",
          description: "ID da grua não encontrado para reabertura",
          variant: "destructive",
        })
        return
      }
      
      // Mostrar toast de atualização
      toast({
        title: "Atualizando dados",
        description: "Recarregando informações da grua e arquivos...",
      })
      
      // Fazer apenas um GET geral dos dados da grua (incluindo arquivos)
      console.log('🔄 DEBUG: Fazendo GET geral dos dados da grua:', gruaIdParaReabrir)
      
      try {
        // Fazer um GET completo dos dados da grua que inclui todos os relacionamentos
        // A função loadGruaDetalhes já gerencia o loading internamente
        const dadosCompletos = await loadGruaDetalhes(gruaIdParaReabrir)
        console.log('🔄 DEBUG: Dados completos recebidos:', dadosCompletos)
        
        if (dadosCompletos) {
          console.log('🔄 DEBUG: Dados da grua atualizados no estado')
          
          // Recarregar arquivos da grua separadamente (já que loadGruaDetalhes não inclui arquivos)
          console.log('🔄 DEBUG: Recarregando arquivos da grua:', gruaIdParaReabrir)
          await carregarArquivos(gruaIdParaReabrir)
          console.log('🔍 DEBUG: Arquivos recarregados com sucesso')
        }
        
        // Pequeno delay para garantir que tudo foi carregado
        console.log('🔄 DEBUG: Aguardando 200ms antes de reabrir modal')
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Reabrir o modal
        console.log('🔄 DEBUG: Reabrindo modal de detalhes')
        setIsDetalhesOpen(true)
        console.log('🔄 DEBUG: Modal reaberto com sucesso!')
        
        // Mostrar toast de confirmação
        toast({
          title: "Dados atualizados",
          description: "A grua foi atualizada com os arquivos mais recentes",
        })
      } catch (error) {
        console.error('🔄 DEBUG: Erro ao recarregar dados:', error)
        console.error('🔄 DEBUG: Stack trace:', error instanceof Error ? error.stack : 'N/A')
        
        // Mostrar toast de erro
        toast({
          title: "Erro ao atualizar",
          description: "Houve um problema ao recarregar os dados da grua",
          variant: "destructive",
        })
        
        // Mesmo com erro, tentar reabrir o modal
        console.log('🔄 DEBUG: Tentando reabrir modal mesmo com erro')
        setIsDetalhesOpen(true)
      }
      
    } catch (error) {
      console.error('Erro no upload:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro no upload",
        description: `Não foi possível fazer upload dos arquivos: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (arquivo: any) => {
    try {
      console.log('🔍 DEBUG: Iniciando download do arquivo:', arquivo.nome)
      
      // Gerar URL com token de assinatura usando a API
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/arquivos/${arquivo.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.url) {
          window.open(result.url, '_blank')
          toast({
            title: "Download iniciado",
            description: `Baixando ${arquivo.nome}`,
          })
          return
        }
      }
      
      // Fallback: usar URL pública direta (pode não funcionar se bucket não for público)
      console.log('🔍 DEBUG: Tentando URL pública direta')
      console.log('🔍 DEBUG: Caminho do arquivo:', arquivo.caminho)
      console.log('🔍 DEBUG: Nome do arquivo:', arquivo.nome)
      
      // Usar o caminho completo se disponível, senão construir o caminho
      const caminhoArquivo = arquivo.caminho || `gruas/${selectedGrua?.id}/${arquivo.nome}`
      const urlPublica = `https://mghdktkoejobsmdbvssl.supabase.co/storage/v1/object/public/arquivos-obras/${caminhoArquivo}`
      console.log('🔍 DEBUG: URL pública construída:', urlPublica)
      window.open(urlPublica, '_blank')
      toast({
        title: "Download iniciado",
        description: `Baixando ${arquivo.nome}`,
      })
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast({
        title: "Erro no download",
        description: `Não foi possível baixar ${arquivo.nome}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteFile = async (arquivoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return
    }

    try {
      console.log('🔍 DEBUG: Deletando arquivo ID:', arquivoId)
      
      // Tentar deletar da API
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/arquivos/${arquivoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setArquivos(arquivos.filter(arquivo => arquivo.id !== arquivoId))
          toast({
            title: "Arquivo excluído",
            description: "Arquivo removido com sucesso",
          })
          return
        }
      }
      
      // Se não conseguir deletar da API, remover apenas do estado local
      console.log('🔍 DEBUG: Removendo arquivo apenas do estado local')
      setArquivos(arquivos.filter(arquivo => arquivo.id !== arquivoId))
      toast({
        title: "Arquivo excluído",
        description: "Arquivo removido da lista (não foi possível deletar do servidor)",
      })
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      // Em caso de erro, remover apenas do estado local
      setArquivos(arquivos.filter(arquivo => arquivo.id !== arquivoId))
      toast({
        title: "Arquivo excluído",
        description: "Arquivo removido da lista (erro ao deletar do servidor)",
        variant: "default",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (tipo: string | undefined | null) => {
    if (!tipo) {
      return <File className="h-4 w-4 text-gray-500" />
    }
    
    if (tipo.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    } else if (tipo === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // Funções para paginação e filtros
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    loadGruas(newPage, pagination.limit, filtros.status, filtros.tipo)
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    loadGruas(1, newLimit, filtros.status, filtros.tipo)
  }

  const handleStatusFilter = (status: string) => {
    setFiltros(prev => ({ ...prev, status }))
    setPagination(prev => ({ ...prev, page: 1 }))
    loadGruas(1, pagination.limit, status, filtros.tipo)
  }

  const handleTipoFilter = (tipo: string) => {
    setFiltros(prev => ({ ...prev, tipo }))
    setPagination(prev => ({ ...prev, page: 1 }))
    loadGruas(1, pagination.limit, filtros.status, tipo)
  }

  const clearFilters = () => {
    setFiltros({ status: "", tipo: "" })
    setPagination(prev => ({ ...prev, page: 1 }))
    loadGruas(1, pagination.limit, "", "")
  }

  // Função para carregar todos os dados para exportação (sem paginação)
  const loadAllGruasForExport = async () => {
    try {
      setLoading(true)
      
      // Construir query string com filtros atuais
      const params = new URLSearchParams()
      if (filtros.status) params.append('status', filtros.status)
      if (filtros.tipo) params.append('tipo', filtros.tipo)
      
      const queryString = params.toString()
      const url = `${buildApiUrl(API_ENDPOINTS.GRUAS)}/export${queryString ? `?${queryString}` : ''}`
      
      const response = await apiRequest(url)
      
      if (response.success) {
        return response.data || []
      } else {
        throw new Error('Erro ao carregar dados para exportação')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados para exportação'
      console.error('Erro ao carregar dados para exportação:', err)
      toast({
        title: "Erro na exportação",
        description: errorMessage,
        variant: "destructive",
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  // Funções de exportação
  const exportToCSV = async () => {
    try {
      // Carregar todos os dados do servidor
      const todasGruas = await loadAllGruasForExport()
      
      if (todasGruas.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para exportar",
          variant: "destructive",
        })
        return
      }

      const dadosParaExportar = todasGruas.map((grua: any) => ({
        'ID': grua.id,
        'Modelo': grua.modelo,
        'Fabricante': grua.fabricante,
        'Tipo': grua.tipo,
        'Capacidade': grua.capacidade,
        'Capacidade na Ponta': grua.capacidade_ponta,
        'Lança': grua.lanca,
        'Altura de Trabalho': grua.altura_trabalho,
        'Ano': grua.ano,
        'Status': grua.status,
        'Localização': grua.localizacao,
        'Horas de Operação': grua.horas_operacao,
        'Valor Locação': grua.valor_locacao,
        'Valor Real': grua.valor_real,
        'Valor Operação': grua.valor_operacao,
        'Valor Sinaleiro': grua.valor_sinaleiro,
        'Última Manutenção': grua.ultima_manutencao,
        'Próxima Manutenção': grua.proxima_manutencao,
        'Cliente': grua.grua_obras && grua.grua_obras.length > 0 ? grua.grua_obras[0].obra?.cliente?.nome || '-' : '-',
        'Obra': grua.grua_obras && grua.grua_obras.length > 0 ? grua.grua_obras[0].obra?.nome || '-' : '-',
        'Funcionários': grua.grua_funcionarios && grua.grua_funcionarios.length > 0 ? 
          grua.grua_funcionarios.map((f: any) => f.funcionario?.nome).join(', ') : '-',
        'Equipamentos': grua.grua_equipamentos && grua.grua_equipamentos.length > 0 ? 
          grua.grua_equipamentos.map((e: any) => e.equipamento?.nome).join(', ') : '-'
      }))

      const headers = Object.keys(dadosParaExportar[0] || {})
      const csvContent = [
        headers.join(','),
        ...dadosParaExportar.map((row: any) => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escapar aspas e vírgulas
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `gruas_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação realizada",
        description: `Arquivo CSV baixado com sucesso (${todasGruas.length} registros)`,
      })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo CSV",
        variant: "destructive",
      })
    }
  }

  const exportToExcel = async () => {
    try {
      // Carregar todos os dados do servidor
      const todasGruas = await loadAllGruasForExport()
      
      if (todasGruas.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para exportar",
          variant: "destructive",
        })
        return
      }

      const dadosParaExportar = todasGruas.map((grua: any) => ({
        'ID': grua.id,
        'Modelo': grua.modelo,
        'Fabricante': grua.fabricante,
        'Tipo': grua.tipo,
        'Capacidade': grua.capacidade,
        'Capacidade na Ponta': grua.capacidade_ponta,
        'Lança': grua.lanca,
        'Altura de Trabalho': grua.altura_trabalho,
        'Ano': grua.ano,
        'Status': grua.status,
        'Localização': grua.localizacao,
        'Horas de Operação': grua.horas_operacao,
        'Valor Locação': grua.valor_locacao,
        'Valor Real': grua.valor_real,
        'Valor Operação': grua.valor_operacao,
        'Valor Sinaleiro': grua.valor_sinaleiro,
        'Última Manutenção': grua.ultima_manutencao,
        'Próxima Manutenção': grua.proxima_manutencao,
        'Cliente': grua.grua_obras && grua.grua_obras.length > 0 ? grua.grua_obras[0].obra?.cliente?.nome || '-' : '-',
        'Obra': grua.grua_obras && grua.grua_obras.length > 0 ? grua.grua_obras[0].obra?.nome || '-' : '-',
        'Funcionários': grua.grua_funcionarios && grua.grua_funcionarios.length > 0 ? 
          grua.grua_funcionarios.map((f: any) => f.funcionario?.nome).join(', ') : '-',
        'Equipamentos': grua.grua_equipamentos && grua.grua_equipamentos.length > 0 ? 
          grua.grua_equipamentos.map((e: any) => e.equipamento?.nome).join(', ') : '-'
      }))

      // Por enquanto, exportar como CSV com extensão .xlsx
      const headers = Object.keys(dadosParaExportar[0] || {})
      const csvContent = [
        headers.join(','),
        ...dadosParaExportar.map((row: any) => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `gruas_${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação realizada",
        description: `Arquivo Excel baixado com sucesso (${todasGruas.length} registros)`,
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo Excel",
        variant: "destructive",
      })
    }
  }

  const exportToPDF = async () => {
    try {
      // Carregar todos os dados do servidor
      const todasGruas = await loadAllGruasForExport()
      
      if (todasGruas.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para exportar",
          variant: "destructive",
        })
        return
      }

      // Importar jsPDF dinamicamente
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      // Criar novo documento PDF
      const doc = new jsPDF('l', 'mm', 'a4') // Orientação landscape para mais espaço

      // Adicionar cabeçalho
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de Gruas', 14, 22)

      // Adicionar data de geração e total de registros
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30)
      doc.text(`Total de registros: ${todasGruas.length}`, 14, 35)

      // Preparar dados para a tabela
      const dadosParaExportar = todasGruas.map((grua: any) => [
        grua.id,
        grua.modelo || '-',
        grua.fabricante || '-',
        grua.tipo || '-',
        grua.status || '-',
        grua.localizacao || '-',
        grua.grua_obras && grua.grua_obras.length > 0 ? grua.grua_obras[0].obra?.cliente?.nome || '-' : '-',
        grua.capacidade || '-',
        grua.lanca || '-',
        grua.altura_trabalho || '-',
        grua.ano || '-',
        grua.horas_operacao ? grua.horas_operacao.toLocaleString() : '-',
        grua.valor_locacao ? `R$ ${formatCurrency(grua.valor_locacao)}` : '-'
      ])

      // Cabeçalhos da tabela
      const headers = [
        'ID',
        'Modelo',
        'Fabricante',
        'Tipo',
        'Status',
        'Localização',
        'Cliente',
        'Capacidade',
        'Lança',
        'Altura',
        'Ano',
        'Horas Op.',
        'Valor Locação'
      ]

      // Adicionar tabela
      autoTable(doc, {
        head: [headers],
        body: dadosParaExportar,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 15 }, // ID
          1: { cellWidth: 25 }, // Modelo
          2: { cellWidth: 20 }, // Fabricante
          3: { cellWidth: 20 }, // Tipo
          4: { cellWidth: 20 }, // Status
          5: { cellWidth: 30 }, // Localização
          6: { cellWidth: 35 }, // Cliente/Obra
          7: { cellWidth: 20 }, // Capacidade
          8: { cellWidth: 15 }, // Lança
          9: { cellWidth: 15 }, // Altura
          10: { cellWidth: 10 }, // Ano
          11: { cellWidth: 15 }, // Horas
          12: { cellWidth: 20 }, // Valor
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Adicionar número da página
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, 14, doc.internal.pageSize.height - 10)
        }
      })

      // Adicionar rodapé com estatísticas
      const finalY = (doc as any).lastAutoTable.finalY || 40
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo:', 14, finalY + 15)
      
      doc.setFont('helvetica', 'normal')
      doc.text(`• Total de Gruas: ${filteredGruas.length}`, 14, finalY + 25)
      doc.text(`• Operacionais: ${filteredGruas.filter(g => g.status === 'Operacional').length}`, 14, finalY + 35)
      doc.text(`• Em Manutenção: ${filteredGruas.filter(g => g.status === 'Manutenção').length}`, 14, finalY + 45)
      doc.text(`• Disponíveis: ${filteredGruas.filter(g => g.status === 'Disponível').length}`, 14, finalY + 55)

      // Salvar o PDF
      const fileName = `relatorio_gruas_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Exportação realizada",
        description: "Relatório PDF gerado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive",
      })
    }
  }

  // Funções de exportação para grua específica
  const exportGruaToCSV = () => {
    if (!selectedGrua) return

    try {
      const dadosParaExportar = {
        'ID': selectedGrua.id,
        'Modelo': selectedGrua.modelo,
        'Fabricante': selectedGrua.fabricante,
        'Tipo': selectedGrua.tipo,
        'Capacidade': selectedGrua.capacidade,
        'Capacidade na Ponta': selectedGrua.capacidade_ponta,
        'Lança': selectedGrua.lanca,
        'Altura de Trabalho': selectedGrua.altura_trabalho,
        'Ano': selectedGrua.ano,
        'Status': selectedGrua.status,
        'Localização': selectedGrua.localizacao,
        'Horas de Operação': selectedGrua.horas_operacao,
        'Valor Locação': selectedGrua.valor_locacao,
        'Valor Operação': selectedGrua.valor_operacao,
        'Valor Sinaleiro': selectedGrua.valor_sinaleiro,
        'Valor Real da Grua': selectedGrua.valor_real,
        'Cliente': selectedGrua.grua_obras && selectedGrua.grua_obras.length > 0 ? selectedGrua.grua_obras[0].obra?.nome : '-',
        'Funcionários': selectedGrua.grua_funcionarios && selectedGrua.grua_funcionarios.length > 0 ? 
          selectedGrua.grua_funcionarios.map((f: any) => f.funcionario?.nome).join(', ') : '-',
        'Equipamentos': selectedGrua.grua_equipamentos && selectedGrua.grua_equipamentos.length > 0 ? 
          selectedGrua.grua_equipamentos.map((e: any) => e.equipamento?.nome).join(', ') : '-'
      }

      const headers = Object.keys(dadosParaExportar)
      const csvContent = [
        headers.join(','),
        headers.map(header => {
          const value = dadosParaExportar[header as keyof typeof dadosParaExportar]
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `grua_${selectedGrua.id}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação realizada",
        description: `Dados da grua ${selectedGrua.id} exportados com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao exportar grua CSV:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados da grua",
        variant: "destructive",
      })
    }
  }

  const exportGruaToPDF = async () => {
    if (!selectedGrua) return

    try {
      // Importar jsPDF dinamicamente
      const { default: jsPDF } = await import('jspdf')

      // Criar novo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4')

      // Adicionar cabeçalho
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(`Relatório da Grua ${selectedGrua.id}`, 14, 22)

      // Adicionar data de geração
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30)

      let yPosition = 50

      // Dados Básicos
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Dados Básicos', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const dadosBasicos = [
        `Modelo: ${selectedGrua.modelo || '-'}`,
        `Fabricante: ${selectedGrua.fabricante || '-'}`,
        `Tipo: ${selectedGrua.tipo || '-'}`,
        `Ano: ${selectedGrua.ano || '-'}`,
        `Status: ${selectedGrua.status || '-'}`,
        `Localização: ${selectedGrua.localizacao || '-'}`
      ]

      dadosBasicos.forEach(dado => {
        doc.text(dado, 14, yPosition)
        yPosition += 6
      })

      yPosition += 10

      // Especificações Técnicas
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Especificações Técnicas', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const especificacoes = [
        `Capacidade: ${selectedGrua.capacidade || '-'}`,
        `Capacidade na Ponta: ${selectedGrua.capacidade_ponta || '-'}`,
        `Lança: ${selectedGrua.lanca || '-'}`,
        `Altura de Trabalho: ${selectedGrua.altura_trabalho || '-'}`,
        `Horas de Operação: ${selectedGrua.horas_operacao ? selectedGrua.horas_operacao.toLocaleString() : '-'}`
      ]

      especificacoes.forEach(espec => {
        doc.text(espec, 14, yPosition)
        yPosition += 6
      })

      yPosition += 10

      // Dados Financeiros
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Dados Financeiros', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const financeiros = [
        `Valor Real da Grua: ${selectedGrua.valor_real ? `R$ ${formatCurrency(selectedGrua.valor_real)}` : '-'}`,
        `Valor Locação: ${selectedGrua.valor_locacao ? `R$ ${formatCurrency(selectedGrua.valor_locacao)}` : '-'}`,
        `Valor Operação: ${selectedGrua.valor_operacao ? `R$ ${formatCurrency(selectedGrua.valor_operacao)}` : '-'}`,
        `Valor Sinaleiro: ${selectedGrua.valor_sinaleiro ? `R$ ${formatCurrency(selectedGrua.valor_sinaleiro)}` : '-'}`,
      ]

      financeiros.forEach(fin => {
        doc.text(fin, 14, yPosition)
        yPosition += 6
      })

      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Obras Relacionadas
      if (selectedGrua.grua_obras && selectedGrua.grua_obras.length > 0) {
        yPosition += 10
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Obras Relacionadas', 14, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        selectedGrua.grua_obras.forEach((obra: any, index: number) => {
          doc.text(`Obra ${index + 1}: ${obra.obra?.nome || '-'}`, 14, yPosition)
          yPosition += 6
          doc.text(`Status: ${obra.status || '-'}`, 14, yPosition)
          yPosition += 6
          doc.text(`Início: ${obra.data_inicio_locacao || '-'}`, 14, yPosition)
          yPosition += 6
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
        })
      }

      // Funcionários
      if (selectedGrua.grua_funcionarios && selectedGrua.grua_funcionarios.length > 0) {
        yPosition += 10
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Funcionários', 14, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        selectedGrua.grua_funcionarios.forEach((func: any, index: number) => {
          doc.text(`Funcionário ${index + 1}: ${func.funcionario?.nome || '-'}`, 14, yPosition)
          yPosition += 6
          doc.text(`Cargo: ${func.funcionario?.cargo || '-'}`, 14, yPosition)
          yPosition += 6
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
        })
      }

      // Equipamentos
      if (selectedGrua.grua_equipamentos && selectedGrua.grua_equipamentos.length > 0) {
        yPosition += 10
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Equipamentos', 14, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        selectedGrua.grua_equipamentos.forEach((equip: any, index: number) => {
          doc.text(`Equipamento ${index + 1}: ${equip.equipamento?.nome || '-'}`, 14, yPosition)
          yPosition += 6
          doc.text(`Tipo: ${equip.equipamento?.tipo || '-'}`, 14, yPosition)
          yPosition += 6
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
        })
      }

      // Salvar o PDF
      const fileName = `grua_${selectedGrua.id}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Exportação realizada",
        description: `Relatório da grua ${selectedGrua.id} gerado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao exportar grua PDF:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório da grua",
        variant: "destructive",
      })
    }
  }

  const stats = [
    { title: "Total de Gruas", value: gruas.length, icon: Crane, color: "bg-blue-500" },
    {
      title: "Operacionais",
      value: gruas.filter((g) => g.status === "Operacional").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Em Manutenção",
      value: gruas.filter((g) => g.status === "Manutenção").length,
      icon: Wrench,
      color: "bg-red-500",
    },
    {
      title: "Disponíveis",
      value: gruas.filter((g) => g.status === "Disponível").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento completo da frota de gruas torre</p>
        </div>
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ExportIcon className="mr-2 h-4 w-4" />
                Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar como Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Grua
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGrua ? "Editar Grua" : "Cadastrar Nova Grua"}</DialogTitle>
              <DialogDescription>
                {editingGrua ? "Atualize as informações da grua" : "Preencha os dados da nova grua torre"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="tecnico">Especificações</TabsTrigger>
                  <TabsTrigger value="obra">Obra/Cliente</TabsTrigger>
                  <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
                  <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="Ex: SITI MI2348"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fabricante">Fabricante</Label>
                      <Input
                        id="fabricante"
                        value={formData.fabricante}
                        onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                        placeholder="Ex: SITI, Liebherr, Potain"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                          <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                          <SelectItem value="Guincho">Guincho</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ano">Ano</Label>
                      <Input
                        id="ano"
                        value={formData.ano}
                        onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                        placeholder="2020"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponível">Disponível</SelectItem>
                          <SelectItem value="Operacional">Operacional</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Vendida">Vendida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      placeholder="Ex: Base Itu/SP ou Obra Centro - SP"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_real">Valor Real da Grua (R$)</Label>
                    <Input
                      id="valor_real"
                      type="number"
                      step="0.01"
                      value={formData.valor_real}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_real: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Ex: 150000.00"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tecnico" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacidade">Capacidade Máxima</Label>
                      <Input
                        id="capacidade"
                        value={formData.capacidade}
                        onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                        placeholder="Ex: 5.000 kg (23m)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacidade_ponta">Capacidade na Ponta</Label>
                      <Input
                        id="capacidade_ponta"
                        value={formData.capacidade_ponta}
                        onChange={(e) => setFormData({ ...formData, capacidade_ponta: e.target.value })}
                        placeholder="Ex: 2.300 kg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lanca">Comprimento da Lança</Label>
                      <Input
                        id="lanca"
                        value={formData.lanca}
                        onChange={(e) => setFormData({ ...formData, lanca: e.target.value })}
                        placeholder="Ex: 48 metros"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura_trabalho">Altura de Trabalho</Label>
                      <Input
                        id="altura_trabalho"
                        value={formData.altura_trabalho}
                        onChange={(e) => setFormData({ ...formData, altura_trabalho: e.target.value })}
                        placeholder="Ex: 52 metros"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horas_operacao">Horas de Operação</Label>
                      <Input
                        id="horas_operacao"
                        type="number"
                        value={formData.horas_operacao}
                        onChange={(e) =>
                          setFormData({ ...formData, horas_operacao: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_locacao">Valor Locação (R$/mês)</Label>
                      <Input
                        id="valor_locacao"
                        type="number"
                        step="0.01"
                        value={formData.valor_locacao}
                        onChange={(e) =>
                          setFormData({ ...formData, valor_locacao: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="26300.00"
                      />
                    </div>
                  </div>

                </TabsContent>

                <TabsContent value="obra" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Nome do Cliente</Label>
                      <div className="relative">
                        <Input
                          id="cliente"
                          value={buscaCliente}
                          onChange={(e) => {
                            const value = e.target.value
                            setBuscaCliente(value)
                            setFormData({ ...formData, cliente: value })
                            if (value.length >= 2) {
                              buscarClientes(value)
                              setMostrarSugestoes(true)
                            } else {
                              setClientes([])
                              setMostrarSugestoes(false)
                            }
                          }}
                          onFocus={() => {
                            if (clientes.length > 0) {
                              setMostrarSugestoes(true)
                            }
                          }}
                          placeholder="Digite para buscar cliente existente ou criar novo"
                        />
                        
                        {/* Botão para limpar seleção */}
                        {clienteSelecionado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={limparCliente}
                          >
                            ×
                          </Button>
                        )}

                        {/* Lista de sugestões */}
                        {mostrarSugestoes && clientes.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {clientes.map((cliente) => (
                              <div
                                key={cliente.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selecionarCliente(cliente)}
                              >
                                <div className="font-medium">{cliente.nome}</div>
                                {cliente.cnpj && (
                                  <div className="text-sm text-gray-500">
                                    {cliente.cnpj}
                                  </div>
                                )}
                                {cliente.email && (
                                  <div className="text-sm text-gray-500">
                                    {cliente.email}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Indicador de cliente selecionado */}
                        {clienteSelecionado && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm text-green-800">
                              <strong>Cliente selecionado:</strong> {clienteSelecionado.nome}
                            </div>
                            {clienteSelecionado.cnpj && (
                              <div className="text-xs text-green-600">
                                CNPJ: {clienteSelecionado.cnpj}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjCliente">CNPJ do Cliente</Label>
                      <Input
                        id="cnpjCliente"
                        value={obraData.cnpjCliente}
                        onChange={(e) => setObraData({ ...obraData, cnpjCliente: e.target.value })}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomeObra">Nome da Obra</Label>
                    <Input
                      id="nomeObra"
                      value={obraData.nomeObra}
                      onChange={(e) => setObraData({ ...obraData, nomeObra: e.target.value })}
                      placeholder="Ex: Residencial Quinta das Amoras"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enderecoObra">Endereço da Obra</Label>
                      <Input
                        id="enderecoObra"
                        value={obraData.enderecoObra}
                        onChange={(e) => setObraData({ ...obraData, enderecoObra: e.target.value })}
                        placeholder="Rua, número"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidadeObra">Cidade</Label>
                      <Input
                        id="cidadeObra"
                        value={obraData.cidadeObra}
                        onChange={(e) => setObraData({ ...obraData, cidadeObra: e.target.value })}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cepObra">CEP</Label>
                      <Input
                        id="cepObra"
                        value={obraData.cepObra}
                        onChange={(e) => setObraData({ ...obraData, cepObra: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoObra">Tipo de Obra</Label>
                      <Select
                        value={obraData.tipoObra}
                        onValueChange={(value) => setObraData({ ...obraData, tipoObra: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residencial">Residencial</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio">Data de Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={obraData.dataInicio}
                        onChange={(e) => setObraData({ ...obraData, dataInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                      <Input
                        id="prazoMeses"
                        type="number"
                        value={obraData.prazoMeses}
                        onChange={(e) => setObraData({ ...obraData, prazoMeses: Number.parseInt(e.target.value) || 0 })}
                        placeholder="6"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato na Obra</Label>
                      <Input
                        id="contato"
                        value={obraData.contato}
                        onChange={(e) => setObraData({ ...obraData, contato: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoneContato">Telefone</Label>
                      <Input
                        id="telefoneContato"
                        value={obraData.telefoneContato}
                        onChange={(e) => setObraData({ ...obraData, telefoneContato: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailContato">E-mail</Label>
                      <Input
                        id="emailContato"
                        type="email"
                        value={obraData.emailContato}
                        onChange={(e) => setObraData({ ...obraData, emailContato: e.target.value })}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="funcionarios" className="space-y-4">
                  {/* Seção de busca e seleção de funcionários */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Adicionar Funcionário</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={alternarModoFuncionario}
                      >
                        {criandoNovoFuncionario ? "Selecionar Existente" : "Criar Novo"}
                      </Button>
                    </div>

                    {criandoNovoFuncionario ? (
                      /* Formulário para criar novo funcionário */
                      <div className="grid grid-cols-4 gap-3">
                        <Input
                          placeholder="Nome completo"
                          value={novoFuncionario.nome}
                          onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                        />
                        <Select
                          value={novoFuncionario.cargo}
                          onValueChange={(value) => setNovoFuncionario({ ...novoFuncionario, cargo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Operador">Operador</SelectItem>
                            <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                            <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Mecânico">Mecânico</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Telefone"
                          value={novoFuncionario.telefone}
                          onChange={(e) => setNovoFuncionario({ ...novoFuncionario, telefone: e.target.value })}
                        />
                        <Select
                          value={novoFuncionario.turno}
                          onValueChange={(value) => setNovoFuncionario({ ...novoFuncionario, turno: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diurno">Diurno</SelectItem>
                            <SelectItem value="Noturno">Noturno</SelectItem>
                            <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      /* Busca de funcionários existentes */
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            placeholder="Buscar funcionário existente..."
                            value={buscaFuncionario}
                            onChange={(e) => {
                              const value = e.target.value
                              setBuscaFuncionario(value)
                              if (value.length >= 2) {
                                buscarFuncionarios(value)
                                setMostrarSugestoesFuncionarios(true)
                              } else {
                                setFuncionariosExistentes([])
                                setMostrarSugestoesFuncionarios(false)
                              }
                            }}
                            onFocus={() => {
                              if (funcionariosExistentes.length > 0) {
                                setMostrarSugestoesFuncionarios(true)
                              }
                            }}
                          />
                          
                          {/* Lista de sugestões de funcionários */}
                          {mostrarSugestoesFuncionarios && funcionariosExistentes.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {funcionariosExistentes.map((funcionario) => (
                                <div
                                  key={funcionario.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => selecionarFuncionarioExistente(funcionario)}
                                >
                                  <div className="font-medium">{funcionario.nome}</div>
                                  <div className="text-sm text-gray-500">
                                    {funcionario.cargo} • {funcionario.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Digite pelo menos 2 caracteres para buscar funcionários existentes
                        </p>
                      </div>
                    )}

                    <Button 
                      type="button" 
                      onClick={adicionarFuncionario} 
                      className="mt-3" 
                      size="sm"
                      disabled={criandoNovoFuncionario && !novoFuncionario.nome}
                    >
                      {criandoNovoFuncionario ? "Adicionar Novo Funcionário" : "Selecionar da Lista"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Funcionários Cadastrados ({funcionarios.length})</h4>
                    {funcionarios.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum funcionário cadastrado</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {funcionarios.map((funcionario, index) => (
                          <div key={funcionario.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{funcionario.nome}</p>
                                {funcionario.existente && (
                                  <Badge variant="secondary" className="text-xs">
                                    Existente
                                  </Badge>
                                )}
                                {!funcionario.existente && (
                                  <Badge variant="outline" className="text-xs">
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {funcionario.cargo} • {funcionario.turno} • {funcionario.telefone || "Sem telefone"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removerFuncionario(funcionario.id || index)}
                              >
                                Remover
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removerFuncionarioDaGrua(funcionario.id || index)}
                              >
                                Remover da Grua
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="equipamentos" className="space-y-4">
                  {/* Adicionar Equipamento Existente */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Adicionar Equipamento Existente</h4>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="Buscar equipamento existente..."
                          value={buscaEquipamento}
                          onChange={(e) => {
                            setBuscaEquipamento(e.target.value)
                            setMostrarSugestoesEquipamentos(e.target.value.length > 0)
                          }}
                          onFocus={() => setMostrarSugestoesEquipamentos(buscaEquipamento.length > 0)}
                        />
                        {mostrarSugestoesEquipamentos && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {equipamentosExistentes
                              .filter(equip => 
                                equip.nome.toLowerCase().includes(buscaEquipamento.toLowerCase()) &&
                                !equipamentos.find(e => e.id === equip.id)
                              )
                              .map((equipamento) => (
                                <div
                                  key={equipamento.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    adicionarEquipamentoExistente(equipamento)
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    adicionarEquipamentoExistente(equipamento)
                                  }}
                                >
                                  <div className="font-medium">{equipamento.nome}</div>
                                  <div className="text-sm text-gray-600">
                                    {equipamento.tipo} • {equipamento.status}
                                  </div>
                                </div>
                              ))}
                            {equipamentosExistentes.filter(equip => 
                              equip.nome.toLowerCase().includes(buscaEquipamento.toLowerCase()) &&
                              !equipamentos.find(e => e.id === equip.id)
                            ).length === 0 && (
                              <div className="p-2 text-gray-500 text-sm">
                                Nenhum equipamento encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adicionar Novo Equipamento */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Adicionar Novo Equipamento</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <Input
                        placeholder="Nome do equipamento"
                        value={novoEquipamento.nome}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                      />
                      <Select
                        value={novoEquipamento.tipo}
                        onValueChange={(value) => setNovoEquipamento({ ...novoEquipamento, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Garfo Paleteiro">Garfo Paleteiro</SelectItem>
                          <SelectItem value="Balde Concreto">Balde Concreto</SelectItem>
                          <SelectItem value="Caçamba Entulho">Caçamba Entulho</SelectItem>
                          <SelectItem value="Plataforma Descarga">Plataforma Descarga</SelectItem>
                          <SelectItem value="Garra">Garra</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Responsável"
                        value={novoEquipamento.responsavel}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, responsavel: e.target.value })}
                      />
                      <Select
                        value={novoEquipamento.status}
                        onValueChange={(value) => setNovoEquipamento({ ...novoEquipamento, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponível">Disponível</SelectItem>
                          <SelectItem value="Operacional">Operacional</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={adicionarEquipamento} className="mt-3" size="sm">
                      Adicionar Novo Equipamento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Equipamentos Cadastrados ({equipamentos.length})</h4>
                    {equipamentos.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum equipamento cadastrado</p>
                    ) : (
                      <div className="space-y-2">
                        {equipamentos.map((equipamento, index) => (
                          <div key={equipamento.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{equipamento.nome}</p>
                              <p className="text-sm text-gray-600">
                                {equipamento.tipo} • {equipamento.status} • Responsável: {equipamento.responsavel}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removerEquipamento(equipamento.id || index)}
                              >
                                Remover
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removerEquipamentoDaGrua(equipamento.id || index)}
                              >
                                Remover da Grua
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? "Salvando..." : editingGrua ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gruas</CardTitle>
          <CardDescription>Visualize e gerencie todas as gruas da frota</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={filtros.status || "all"} onValueChange={(value) => handleStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Vendida">Vendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="tipo-filter">Tipo:</Label>
              <Select value={filtros.tipo || "all"} onValueChange={(value) => handleTipoFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                  <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                  <SelectItem value="Guincho">Guincho</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="limit-filter">Por página:</Label>
              <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filtros.status || filtros.tipo) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Busca por texto */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, modelo, localização ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Cliente/Obra</TableHead>
                  <TableHead>Funcionários</TableHead>
                  <TableHead>Equipamentos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Carregando gruas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredGruas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma grua encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGruas.map((grua) => (
                  <TableRow key={grua.id}>
                    <TableCell className="font-medium">{grua.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{grua.modelo}</p>
                        <p className="text-sm text-gray-500">{grua.fabricante}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(grua.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                        <span className="text-sm">{grua.localizacao || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {grua.grua_obras && grua.grua_obras.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium">{grua.grua_obras[0].obra?.nome}</div>
                          <div className="text-gray-500">
                            {grua.grua_obras[0].obra?.contato_obra && (
                              <span>Contato: {grua.grua_obras[0].obra.contato_obra}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {grua.grua_funcionarios && grua.grua_funcionarios.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium">{grua.grua_funcionarios[0].funcionario?.nome}</div>
                          <div className="text-gray-500">{grua.grua_funcionarios[0].funcionario?.cargo}</div>
                          {grua.grua_funcionarios.length > 1 && (
                            <div className="text-xs text-blue-600">+{grua.grua_funcionarios.length - 1} mais</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {grua.grua_equipamentos && grua.grua_equipamentos.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium">{grua.grua_equipamentos[0].equipamento?.nome}</div>
                          <div className="text-gray-500">{grua.grua_equipamentos[0].equipamento?.tipo}</div>
                          {grua.grua_equipamentos.length > 1 && (
                            <div className="text-xs text-blue-600">+{grua.grua_equipamentos.length - 1} mais</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Carregar dados completos da grua para visualização
                            const dadosCompletos = await carregarDadosCompletosGrua(grua.id)
                            setSelectedGrua(dadosCompletos || grua)
                            // Carregar arquivos da grua
                            await carregarArquivos(grua.id)
                            setIsDetalhesOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => await handleEdit(grua)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => gerarProposta(grua)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(grua.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Controles de Paginação */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} gruas
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="w-[1200px] max-w-[1200px] max-h-[80vh] overflow-y-auto dialog-content">
          <DialogHeader className="relative">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle>Detalhes da Grua - {selectedGrua?.id}</DialogTitle>
                <DialogDescription>Equipamentos e funcionários atrelados à grua</DialogDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ExportIcon className="mr-2 h-4 w-4" />
                    Exportar
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportGruaToCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportGruaToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          {selectedGrua && (
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
                <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                <TabsTrigger value="equipe">Equipe</TabsTrigger>
                <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Grua</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Modelo:</strong> {selectedGrua.modelo || "N/A"}
                      </div>
                      <div>
                        <strong>Fabricante:</strong> {selectedGrua.fabricante || "N/A"}
                      </div>
                      <div>
                        <strong>Tipo:</strong> {selectedGrua.tipo}
                      </div>
                      <div>
                        <strong>Capacidade:</strong> {selectedGrua.capacidade}
                      </div>
                      <div>
                        <strong>Capacidade na Ponta:</strong> {selectedGrua.capacidade_ponta}
                      </div>
                      <div>
                        <strong>Lança:</strong> {selectedGrua.lanca}
                      </div>
                      <div>
                        <strong>Altura de Trabalho:</strong> {selectedGrua.altura_trabalho}
                      </div>
                      <div>
                        <strong>Ano:</strong> {selectedGrua.ano}
                      </div>
                      <div>
                        <strong>Status:</strong> {getStatusBadge(selectedGrua.status)}
                      </div>
                      <div>
                        <strong>Localização:</strong> {selectedGrua.localizacao}
                      </div>
                      <div>
                        <strong>Valor Real da Grua:</strong> {selectedGrua.valor_real ? `R$ ${formatCurrency(selectedGrua.valor_real)}` : 'Não informado'}
                      </div>
                      <div>
                        <strong>Horas de Operação:</strong> {selectedGrua.horas_operacao?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados Financeiros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Valor Locação:</strong> R$ {formatCurrency(selectedGrua.valor_locacao)}
                      </div>
                      <div>
                        <strong>Valor Operação:</strong> R$ {formatCurrency(selectedGrua.valor_operacao)}
                      </div>
                      <div>
                        <strong>Valor Sinaleiro:</strong> R$ {formatCurrency(selectedGrua.valor_sinaleiro)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Informações das Obras */}
                {selectedGrua.grua_obras && selectedGrua.grua_obras.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Obras Relacionadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedGrua.grua_obras.map((relacionamento: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-lg">{relacionamento.obra?.nome}</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div><strong>Tipo:</strong> {relacionamento.obra?.tipo}</div>
                                  <div><strong>Status da Obra:</strong> {relacionamento.obra?.status}</div>
                                  <div><strong>Status da Locação:</strong> {relacionamento.status}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><strong>Início da Locação:</strong> {relacionamento.data_inicio_locacao}</div>
                                <div><strong>Fim da Locação:</strong> {relacionamento.data_fim_locacao || "Em andamento"}</div>
                                <div><strong>Valor Mensal:</strong> R$ {formatCurrency(relacionamento.valor_locacao_mensal)}</div>
                                {relacionamento.obra?.contato_obra && (
                                  <div><strong>Contato:</strong> {relacionamento.obra.contato_obra}</div>
                                )}
                                {relacionamento.obra?.telefone_obra && (
                                  <div><strong>Telefone:</strong> {relacionamento.obra.telefone_obra}</div>
                                )}
                                {relacionamento.obra?.email_obra && (
                                  <div><strong>Email:</strong> {relacionamento.obra.email_obra}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="equipamentos" className="space-y-4">
                {/* Adicionar Equipamento Existente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Adicionar Equipamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="Buscar equipamento existente..."
                          value={buscaEquipamento}
                          onChange={(e) => {
                            setBuscaEquipamento(e.target.value)
                            setMostrarSugestoesEquipamentos(e.target.value.length > 0)
                          }}
                          onFocus={() => setMostrarSugestoesEquipamentos(buscaEquipamento.length > 0)}
                        />
                        {mostrarSugestoesEquipamentos && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {equipamentosExistentes
                              .filter(equip => 
                                equip.nome.toLowerCase().includes(buscaEquipamento.toLowerCase()) &&
                                !selectedGrua?.grua_equipamentos?.find((rel: any) => rel.equipamento?.id === equip.id)
                              )
                              .map((equipamento) => (
                                <div
                                  key={equipamento.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    adicionarEquipamentoExistenteAGrua(equipamento)
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    adicionarEquipamentoExistenteAGrua(equipamento)
                                  }}
                                >
                                  <div className="font-medium">{equipamento.nome}</div>
                                  <div className="text-sm text-gray-600">
                                    {equipamento.tipo} • {equipamento.status}
                                  </div>
                                </div>
                              ))}
                            {equipamentosExistentes.filter(equip => 
                              equip.nome.toLowerCase().includes(buscaEquipamento.toLowerCase()) &&
                              !selectedGrua?.grua_equipamentos?.find((rel: any) => rel.equipamento?.id === equip.id)
                            ).length === 0 && (
                              <div className="p-2 text-gray-500 text-sm">
                                Nenhum equipamento encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Equipamentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Equipamentos Auxiliares ({selectedGrua?.grua_equipamentos?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGrua && selectedGrua.grua_equipamentos && selectedGrua.grua_equipamentos.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipamento</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Capacidade</TableHead>
                              <TableHead>Status do Equipamento</TableHead>
                              <TableHead>Status do Relacionamento</TableHead>
                              <TableHead>Data Início</TableHead>
                              <TableHead>Data Fim</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedGrua.grua_equipamentos.map((relacionamento: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{relacionamento.equipamento?.nome}</TableCell>
                                <TableCell>{relacionamento.equipamento?.tipo}</TableCell>
                                <TableCell>{relacionamento.equipamento?.capacidade}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    relacionamento.equipamento?.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                                    relacionamento.equipamento?.status === 'Operacional' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }>
                                    {relacionamento.equipamento?.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    relacionamento.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }>
                                    {relacionamento.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{relacionamento.data_inicio}</TableCell>
                                <TableCell>{relacionamento.data_fim || "Em andamento"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removerEquipamentoDaGruaSelecionada(relacionamento.equipamento?.id)}
                                  >
                                    Remover
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum equipamento auxiliar atrelado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="equipe" className="space-y-4">
                {/* Adicionar Funcionário Existente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Adicionar Funcionário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="Buscar funcionário existente..."
                          value={buscaFuncionario}
                          onChange={(e) => {
                            setBuscaFuncionario(e.target.value)
                            setMostrarSugestoesFuncionarios(e.target.value.length > 0)
                          }}
                          onFocus={() => setMostrarSugestoesFuncionarios(buscaFuncionario.length > 0)}
                        />
                        {mostrarSugestoesFuncionarios && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {funcionariosExistentes
                              .filter(func => 
                                func.nome.toLowerCase().includes(buscaFuncionario.toLowerCase()) &&
                                !selectedGrua?.grua_funcionarios?.find((rel: any) => rel.funcionario?.id === func.id)
                              )
                              .map((funcionario) => (
                                <div
                                  key={funcionario.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                  onClick={() => adicionarFuncionarioExistenteAGrua(funcionario)}
                                >
                                  <div className="font-medium">{funcionario.nome}</div>
                                  <div className="text-sm text-gray-600">
                                    {funcionario.cargo} • {funcionario.status}
                                  </div>
                                </div>
                              ))}
                            {funcionariosExistentes.filter(func => 
                              func.nome.toLowerCase().includes(buscaFuncionario.toLowerCase()) &&
                              !selectedGrua?.grua_funcionarios?.find((rel: any) => rel.funcionario?.id === func.id)
                            ).length === 0 && (
                              <div className="p-2 text-gray-500 text-sm">
                                Nenhum funcionário encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Funcionários */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Funcionários da Grua ({selectedGrua?.grua_funcionarios?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGrua && selectedGrua.grua_funcionarios && selectedGrua.grua_funcionarios.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Telefone</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status do Funcionário</TableHead>
                              <TableHead>Status do Relacionamento</TableHead>
                              <TableHead>Data Início</TableHead>
                              <TableHead>Data Fim</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedGrua.grua_funcionarios.map((relacionamento: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{relacionamento.funcionario?.nome}</TableCell>
                                <TableCell>{relacionamento.funcionario?.cargo}</TableCell>
                                <TableCell>{relacionamento.funcionario?.telefone || "-"}</TableCell>
                                <TableCell>{relacionamento.funcionario?.email || "-"}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    relacionamento.funcionario?.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }>
                                    {relacionamento.funcionario?.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    relacionamento.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }>
                                    {relacionamento.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{relacionamento.data_inicio}</TableCell>
                                <TableCell>{relacionamento.data_fim || "Em andamento"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removerFuncionarioDaGruaSelecionada(relacionamento.funcionario?.id)}
                                  >
                                    Remover
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum funcionário atrelado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="arquivos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileImage className="mr-2 h-5 w-5" />
                      Arquivos da Grua
                    </CardTitle>
                    <CardDescription>
                      Gerencie documentos, manuais, certificados e outros arquivos relacionados à grua
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Seção de Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Clique para selecionar arquivos ou arraste e solte aqui
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (máx. 10MB por arquivo)
                            </span>
                          </Label>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            onChange={handleFileSelect}
                          />
                        </div>
                        {selectedFiles && selectedFiles.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">
                              {selectedFiles.length} arquivo(s) selecionado(s):
                            </p>
                            <ul className="mt-2 text-xs text-gray-500">
                              {Array.from(selectedFiles).map((file, index) => (
                                <li key={index}>• {file.name} ({formatFileSize(file.size)})</li>
                              ))}
                            </ul>
                            <Button
                              onClick={handleUpload}
                              disabled={uploading}
                              className="mt-3"
                              size="sm"
                            >
                              {uploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Enviar Arquivos
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista de Arquivos */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Arquivos Existentes ({arquivos.length})</h4>
                      {arquivos.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhum arquivo encontrado</p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {arquivos.map((arquivo) => (
                            <div key={arquivo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center space-x-3 flex-1">
                                {getFileIcon(arquivo.tipo)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {arquivo.nome}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(arquivo.tamanho)} • {arquivo.dataUpload}
                                  </p>
                                  {arquivo.descricao && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {arquivo.descricao}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(arquivo)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteFile(arquivo.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Proposta */}
      <Dialog open={isPropostaOpen} onOpenChange={setIsPropostaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Proposta Comercial</DialogTitle>
            <DialogDescription>Proposta para locação da grua {selectedGrua?.modelo}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações da Grua */}
            {selectedGrua && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Equipamento:</strong> {selectedGrua.modelo}
                      </p>
                      <p>
                        <strong>Fabricante:</strong> {selectedGrua.fabricante}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {selectedGrua.tipo}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Lança:</strong> {selectedGrua.lanca}
                      </p>
                      <p>
                        <strong>Altura:</strong> {selectedGrua.altura_trabalho}
                        <strong>Altura:</strong> {selectedGrua.altura_trabalho}
                      </p>
                      <p>
                        <strong>Capacidade:</strong> {selectedGrua.capacidade}
                      </p>
                      <p>
                        <strong>Capacidade na Ponta:</strong> {selectedGrua.capacidade_ponta}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Cliente e Obra */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <Input
                  id="cliente"
                  value={propostaData.cliente}
                  onChange={(e) => setPropostaData({ ...propostaData, cliente: e.target.value })}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={propostaData.cnpj}
                  onChange={(e) => setPropostaData({ ...propostaData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obra">Nome da Obra</Label>
              <Input
                id="obra"
                value={propostaData.obra}
                onChange={(e) => setPropostaData({ ...propostaData, obra: e.target.value })}
                placeholder="Nome do empreendimento"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço da Obra</Label>
                <Input
                  id="endereco"
                  value={propostaData.endereco}
                  onChange={(e) => setPropostaData({ ...propostaData, endereco: e.target.value })}
                  placeholder="Rua, número"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={propostaData.cidade}
                  onChange={(e) => setPropostaData({ ...propostaData, cidade: e.target.value })}
                  placeholder="Cidade - UF"
                  required
                />
              </div>
            </div>

            {/* Condições Técnicas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                <Input
                  id="prazoMeses"
                  type="number"
                  value={propostaData.prazoMeses}
                  onChange={(e) =>
                    setPropostaData({ ...propostaData, prazoMeses: Number.parseInt(e.target.value) || 6 })
                  }
                  min="1"
                  max="24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={propostaData.dataInicio}
                  onChange={(e) => setPropostaData({ ...propostaData, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alturaFinal">Altura Final</Label>
                <Input
                  id="alturaFinal"
                  value={propostaData.alturaFinal}
                  onChange={(e) => setPropostaData({ ...propostaData, alturaFinal: e.target.value })}
                  placeholder="52 metros"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoBase">Tipo de Base</Label>
                <Select
                  value={propostaData.tipoBase}
                  onValueChange={(value) => setPropostaData({ ...propostaData, tipoBase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Base Fixa">Base Fixa</SelectItem>
                    <SelectItem value="Base Móvel">Base Móvel</SelectItem>
                    <SelectItem value="Trilhos">Trilhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voltagem">Voltagem</Label>
                <Select
                  value={propostaData.voltagem}
                  onValueChange={(value) => setPropostaData({ ...propostaData, voltagem: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="220V">220V</SelectItem>
                    <SelectItem value="380V">380V</SelectItem>
                    <SelectItem value="440V">440V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="potencia">Potência</Label>
                <Input
                  id="potencia"
                  value={propostaData.potencia}
                  onChange={(e) => setPropostaData({ ...propostaData, potencia: e.target.value })}
                  placeholder="72 KVA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={propostaData.observacoes}
                onChange={(e) => setPropostaData({ ...propostaData, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre a obra ou condições especiais"
                rows={3}
              />
            </div>

            {/* Resumo Financeiro */}
            {selectedGrua && (
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium">Valores Mensais:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Locação:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_locacao)}</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_locacao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Operação:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_operacao)}</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_operacao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sinaleiro:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_sinaleiro)}</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_sinaleiro)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-medium">
                          <span>Total Mensal:</span>
                          <span>
                            R${" "}
                            {formatCurrency(
                              (selectedGrua?.valor_locacao || 0) +
                              (selectedGrua?.valor_operacao || 0) +
                              (selectedGrua?.valor_sinaleiro || 0) +
                              (selectedGrua?.valor_locacao || 0) +
                              (selectedGrua?.valor_operacao || 0) +
                              (selectedGrua?.valor_sinaleiro || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Valor Total do Contrato:</h4>
                      <div className="text-2xl font-bold text-green-700">
                        R$ {formatCurrency(calcularValorTotal())}
                      </div>
                      <p className="text-sm text-gray-600">{propostaData.prazoMeses} meses de locação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPropostaOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={exportarPropostaPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Proposta PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}