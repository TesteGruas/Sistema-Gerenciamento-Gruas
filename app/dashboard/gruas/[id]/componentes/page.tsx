"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Package,
  Settings,
  ArrowLeft,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiComponentes, ComponenteGrua, MovimentacaoComponente } from "@/lib/api-componentes"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { estoqueAPI } from "@/lib/api-estoque"
import { Slider } from "@/components/ui/slider"

interface ConfiguracaoGrua {
  id: string
  grua_id: string
  nome: string
  descricao: string
  componentes: Array<{
    componente_id: string
    quantidade: number
  }>
  altura_total: number
  capacidade_total: number
  created_at: string
}

export default function ComponentesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [componentes, setComponentes] = useState<ComponenteGrua[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDevolucaoItensDialogOpen, setIsDevolucaoItensDialogOpen] = useState(false)
  const [editingComponente, setEditingComponente] = useState<ComponenteGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  
  // Estado para gerenciar devoluções de itens
  const [devolucoesItens, setDevolucoesItens] = useState<Record<number, {
    tipo: 'completa' | 'parcial' | null
    quantidade_devolvida?: number
  }>>({})
  const [processandoDevolucoes, setProcessandoDevolucoes] = useState(false)

  // Formulário para componente
  const [componenteForm, setComponenteForm] = useState({
    nome: '',
    tipo: '' as ComponenteGrua['tipo'],
    modelo: '',
    fabricante: '',
    numero_serie: '',
    capacidade: '',
    unidade_medida: 'unidade',
    quantidade_total: 1,
    quantidade_disponivel: 1,
    quantidade_em_uso: 0,
    quantidade_danificada: 0,
    status: 'Disponível' as ComponenteGrua['status'],
    localizacao: '',
    localizacao_tipo: 'Almoxarifado' as ComponenteGrua['localizacao_tipo'],
    obra_id: undefined as number | undefined,
    dimensoes_altura: undefined as number | undefined,
    dimensoes_largura: undefined as number | undefined,
    dimensoes_comprimento: undefined as number | undefined,
    dimensoes_peso: undefined as number | undefined,
    vida_util_percentual: 100,
    valor_unitario: 0,
    data_instalacao: '',
    data_ultima_manutencao: '',
    data_proxima_manutencao: '',
    observacoes: '',
    componente_estoque_id: undefined as number | undefined // ID do componente no estoque, se foi selecionado
  })

  // Estado para lista de obras (para dropdown quando localização for "Obra X")
  const [obras, setObras] = useState<any[]>([])
  const [loadingObras, setLoadingObras] = useState(false)

  // Estados para busca de componentes do estoque
  const [componentesEstoque, setComponentesEstoque] = useState<any[]>([])
  const [buscandoComponentes, setBuscandoComponentes] = useState(false)
  const [buscaComponente, setBuscaComponente] = useState("")
  const [componenteSelecionado, setComponenteSelecionado] = useState<any>(null)
  const [mostrarResultadosBusca, setMostrarResultadosBusca] = useState(false)

  // Formulário para movimentação
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    tipo_movimentacao: 'Instalação' as MovimentacaoComponente['tipo_movimentacao'],
    quantidade_movimentada: 1,
    motivo: '',
    obra_id: '',
    grua_origem_id: '',
    grua_destino_id: '',
    funcionario_responsavel_id: '',
    observacoes: '',
    // Campos específicos para devolução da obra
    tipo_devolucao: 'completa' as 'completa' | 'parcial',
    quantidade_devolvida: 0,
    valor_nao_devolvido: 0
  })


  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const prevSearchTermRef = useRef(searchTerm)
  const prevFilterStatusRef = useRef(filterStatus)
  const prevFilterTipoRef = useRef(filterTipo)

  // Carregar dados - apenas uma vez
  useEffect(() => {
    // Evitar carregamento duplo - só carregar uma vez
    if (initialLoadDoneRef.current) return
    
    if (!loadingRef.current) {
      initialLoadDoneRef.current = true
      loadingRef.current = true
      carregarDados().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruaId])

  // Recarregar dados quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real nos filtros (não apenas no primeiro render)
    const searchChanged = prevSearchTermRef.current !== searchTerm
    const statusChanged = prevFilterStatusRef.current !== filterStatus
    const tipoChanged = prevFilterTipoRef.current !== filterTipo
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!searchChanged && !statusChanged && !tipoChanged) {
      return
    }
    
    // Atualizar refs
    prevSearchTermRef.current = searchTerm
    prevFilterStatusRef.current = filterStatus
    prevFilterTipoRef.current = filterTipo
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        carregarDados().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterTipo, dadosIniciaisCarregados])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar informações da grua
      const gruaResponse = await gruasApi.obterGrua(gruaId)
      setGruaInfo(gruaResponse.data)
      
      // Carregar componentes da grua com filtros aplicados
      const componentesResponse = await apiComponentes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 10, // Aumentar limite para carregar todos os componentes
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        tipo: filterTipo !== 'all' ? filterTipo : undefined
      })
      setComponentes(componentesResponse.data)
      
      // Carregar estatísticas
      const stats = await apiComponentes.obterEstatisticas(gruaId)
      setEstatisticas(stats)
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar componentes da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Os componentes já vêm filtrados da API
  const filteredComponentes = componentes

  // Buscar componentes do estoque
  const buscarComponentesEstoque = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setComponentesEstoque([])
      setMostrarResultadosBusca(false)
      return
    }

    try {
      setBuscandoComponentes(true)
      const response = await estoqueAPI.listarProdutos({
        tipo_item: 'componente',
        page: 1,
        limit: 50
      })

      console.log('Resposta da API de estoque:', response)
      
      // Verificar se a resposta tem a estrutura esperada
      const dados = Array.isArray(response?.data) ? response.data : []
      console.log('Dados recebidos:', dados)
      console.log('Termo de busca:', termo)
      
      // Filtrar componentes que correspondem ao termo de busca
      // A API retorna produtos com estrutura: { id, nome, descricao, classificacao_tipo, estoque: {...} }
      const filtrados = dados.filter((comp: any) => {
        if (!comp) return false
        
        const nome = String(comp.nome || '').toLowerCase()
        const descricao = String(comp.descricao || '').toLowerCase()
        const categoriaNome = String(comp.categorias?.nome || '').toLowerCase()
        const termoLower = termo.toLowerCase().trim()
        
        const match = nome.includes(termoLower) || 
               descricao.includes(termoLower) ||
               categoriaNome.includes(termoLower)
        
        return match
      })
      
      console.log('Componentes filtrados:', filtrados)
      console.log('Mostrar resultados:', filtrados.length > 0)
      
      setComponentesEstoque(filtrados)
      // Sempre mostrar resultados se houver algum componente filtrado ou se não houver resultados (para mostrar mensagem)
      setMostrarResultadosBusca(true)
    } catch (error: any) {
      console.error('Erro ao buscar componentes:', error)
      setComponentesEstoque([])
      setMostrarResultadosBusca(false)
      toast({
        title: "Erro",
        description: "Erro ao buscar componentes do estoque",
        variant: "destructive"
      })
    } finally {
      setBuscandoComponentes(false)
    }
  }, [toast])

  // Selecionar componente do estoque
  const selecionarComponenteEstoque = (componente: any) => {
    setComponenteSelecionado(componente)
    setBuscaComponente(componente.nome)
    setMostrarResultadosBusca(false)
    
    // Obter quantidade disponível do estoque
    // A API retorna estoque como objeto único, não array
    const estoqueDisponivel = componente.estoque?.quantidade_disponivel ?? componente.quantidade_disponivel ?? 0
    
    // Extrair dimensões da descrição se disponível (formato pode variar)
    const descricao = componente.descricao || ''
    let dimensoes_altura: number | undefined
    let dimensoes_largura: number | undefined
    let dimensoes_comprimento: number | undefined
    let dimensoes_peso: number | undefined
    
    // Tentar extrair dimensões da descrição (formato pode variar)
    if (descricao) {
      const alturaMatch = descricao.match(/Alt[ua]*[:\s]*([\d.,]+)\s*(?:m|mm|cm)/i)
      const larguraMatch = descricao.match(/Larg[ura]*[:\s]*([\d.,]+)\s*(?:m|mm|cm)/i)
      const comprimentoMatch = descricao.match(/Comp[rimento]*[:\s]*([\d.,]+)\s*(?:m|mm|cm)/i)
      const pesoMatch = descricao.match(/Peso[:\s]*([\d.,]+)\s*(?:kg|g)/i)
      
      if (alturaMatch) dimensoes_altura = parseFloat(alturaMatch[1].replace(',', '.'))
      if (larguraMatch) dimensoes_largura = parseFloat(larguraMatch[1].replace(',', '.'))
      if (comprimentoMatch) dimensoes_comprimento = parseFloat(comprimentoMatch[1].replace(',', '.'))
      if (pesoMatch) dimensoes_peso = parseFloat(pesoMatch[1].replace(',', '.'))
    }
    
    // Preencher formulário com dados do componente selecionado
    setComponenteForm({
      nome: componente.nome || '',
      tipo: 'Estrutural' as ComponenteGrua['tipo'], // Padrão, pode ser ajustado depois
      modelo: '', // Não disponível na API de estoque
      fabricante: '', // Não disponível na API de estoque
      numero_serie: '',
      capacidade: '',
      unidade_medida: componente.unidade_medida || 'unidade',
      quantidade_total: 1, // Quantidade a adicionar (padrão 1)
      quantidade_disponivel: Math.min(1, estoqueDisponivel), // Não pode exceder o disponível
      quantidade_em_uso: 0,
      quantidade_danificada: 0,
      status: componente.status === 'Ativo' ? 'Disponível' as ComponenteGrua['status'] : 'Disponível' as ComponenteGrua['status'],
      localizacao: componente.localizacao || '',
      localizacao_tipo: componente.localizacao ? 'Almoxarifado' as ComponenteGrua['localizacao_tipo'] : 'Almoxarifado' as ComponenteGrua['localizacao_tipo'],
      obra_id: undefined,
      dimensoes_altura: dimensoes_altura,
      dimensoes_largura: dimensoes_largura,
      dimensoes_comprimento: dimensoes_comprimento,
      dimensoes_peso: dimensoes_peso,
      vida_util_percentual: 100,
      valor_unitario: componente.valor_unitario || 0,
      data_instalacao: '',
      data_ultima_manutencao: '',
      data_proxima_manutencao: '',
      observacoes: componente.descricao || '',
      componente_estoque_id: componente.id // Guardar ID do componente do estoque (ex: "P0006")
    })
  }

  // Handlers
  const handleCreateComponente = async () => {
    // Validar estoque se componente foi selecionado do estoque
    if (componenteSelecionado && componenteForm.componente_estoque_id) {
      // A API retorna estoque como objeto único, não array
      const estoqueDisponivel = componenteSelecionado.estoque?.quantidade_disponivel ?? 
                                 componenteSelecionado.quantidade_disponivel ?? 0
      
      if (componenteForm.quantidade_total > estoqueDisponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Estoque disponível: ${estoqueDisponivel}, quantidade solicitada: ${componenteForm.quantidade_total}`,
          variant: "destructive"
        })
        return
      }
    }

    try {
      const response = await apiComponentes.criar({
        grua_id: gruaId,
        ...componenteForm
      })

      setIsCreateDialogOpen(false)
      resetComponenteForm()
      setComponenteSelecionado(null)
      setBuscaComponente("")
      setComponentesEstoque([])
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Componente adicionado com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao criar componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar componente",
        variant: "destructive"
      })
    }
  }

  const handleUpdateComponente = async () => {
    if (!editingComponente) return

    try {
      const response = await apiComponentes.atualizar(editingComponente.id, {
        ...componenteForm
      })

      setIsEditDialogOpen(false)
      setEditingComponente(null)
      resetComponenteForm()
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Componente atualizado com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar componente",
        variant: "destructive"
      })
    }
  }

  const handleMovimentarComponente = async () => {
    if (!editingComponente) return

    try {
      // Se for devolução da obra, usar endpoint específico de devolução
      if (movimentacaoForm.tipo_movimentacao === 'Devolução da Obra') {
        if (!movimentacaoForm.obra_id) {
          toast({
            title: "Atenção",
            description: "Selecione a obra de origem",
            variant: "destructive"
          })
          return
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        const devolucaoData = {
          obra_id: parseInt(movimentacaoForm.obra_id),
          devolucoes: [{
            componente_id: editingComponente.id,
            tipo: movimentacaoForm.tipo_devolucao,
            quantidade_devolvida: movimentacaoForm.tipo_devolucao === 'completa' 
              ? editingComponente.quantidade_em_uso 
              : movimentacaoForm.quantidade_devolvida,
            valor: movimentacaoForm.tipo_devolucao === 'parcial' ? movimentacaoForm.valor_nao_devolvido : 0,
            observacoes: movimentacaoForm.observacoes || movimentacaoForm.motivo
          }]
        }

        const response = await fetch(`${API_URL}/api/grua-componentes/devolver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(devolucaoData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao processar devolução')
        }

        setIsMovimentacaoDialogOpen(false)
        setEditingComponente(null)
        resetMovimentacaoForm()
        
        // Recarregar dados para atualizar lista e estatísticas
        await carregarDados()

        toast({
          title: "Sucesso",
          description: "Devolução registrada com sucesso"
        })
        return
      }

      // Para outros tipos de movimentação, usar o endpoint padrão
      const movimentacaoData = {
        ...movimentacaoForm,
        obra_id: movimentacaoForm.obra_id ? parseInt(movimentacaoForm.obra_id) : undefined,
        funcionario_responsavel_id: movimentacaoForm.funcionario_responsavel_id ? parseInt(movimentacaoForm.funcionario_responsavel_id) : undefined,
        grua_origem_id: movimentacaoForm.grua_origem_id || undefined,
        grua_destino_id: movimentacaoForm.grua_destino_id || undefined
      }

      const response = await apiComponentes.movimentar(editingComponente.id, movimentacaoData)
      
      setIsMovimentacaoDialogOpen(false)
      setEditingComponente(null)
      resetMovimentacaoForm()
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Movimentação registrada com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao movimentar componente:', error)
      toast({
        title: "Erro",
        description: error.message || error.response?.data?.message || "Erro ao processar movimentação",
        variant: "destructive"
      })
    }
  }

  const handleDeleteComponente = async (id: number) => {
    try {
      const response = await apiComponentes.excluir(id)
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()
      
      toast({
        title: "Sucesso",
        description: response.message || "Componente removido com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao remover componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover componente",
        variant: "destructive"
      })
    }
  }

  // Carregar obras quando necessário
  useEffect(() => {
    if (componenteForm.localizacao_tipo === 'Obra X' && obras.length === 0 && !loadingObras) {
      carregarObras()
    }
  }, [componenteForm.localizacao_tipo])

  // Debounce para busca de componentes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaComponente.length >= 2) {
        buscarComponentesEstoque(buscaComponente)
      } else {
        setComponentesEstoque([])
        setMostrarResultadosBusca(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [buscaComponente, buscarComponentesEstoque])

  // Fechar lista de resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.busca-componente-container')) {
        setMostrarResultadosBusca(false)
      }
    }

    if (mostrarResultadosBusca) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mostrarResultadosBusca])

  const carregarObras = async () => {
    try {
      setLoadingObras(true)
      const response = await obrasApi.listarObras({ page: 1, limit: 100 })
      if (response.success && response.data) {
        setObras(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar obras:', error)
    } finally {
      setLoadingObras(false)
    }
  }

  // Funções auxiliares
  const resetComponenteForm = () => {
    setComponenteForm({
      nome: '',
      tipo: '' as ComponenteGrua['tipo'],
      modelo: '',
      fabricante: '',
      numero_serie: '',
      capacidade: '',
      unidade_medida: 'unidade',
      quantidade_total: 1,
      quantidade_disponivel: 1,
      quantidade_em_uso: 0,
      quantidade_danificada: 0,
      status: 'Disponível' as ComponenteGrua['status'],
      localizacao: '',
      localizacao_tipo: 'Almoxarifado' as ComponenteGrua['localizacao_tipo'],
      obra_id: undefined,
      dimensoes_altura: undefined,
      dimensoes_largura: undefined,
      dimensoes_comprimento: undefined,
      dimensoes_peso: undefined,
      vida_util_percentual: 100,
      valor_unitario: 0,
      data_instalacao: '',
      data_ultima_manutencao: '',
      data_proxima_manutencao: '',
      observacoes: '',
      componente_estoque_id: undefined
    })
    setComponenteSelecionado(null)
    setBuscaComponente("")
    setComponentesEstoque([])
    setMostrarResultadosBusca(false)
  }

  const resetMovimentacaoForm = () => {
    setMovimentacaoForm({
      tipo_movimentacao: 'Instalação' as MovimentacaoComponente['tipo_movimentacao'],
      quantidade_movimentada: 1,
      motivo: '',
      obra_id: '',
      grua_origem_id: '',
      grua_destino_id: '',
      funcionario_responsavel_id: '',
      observacoes: '',
      tipo_devolucao: 'completa' as 'completa' | 'parcial',
      quantidade_devolvida: 0,
      valor_nao_devolvido: 0
    })
  }

  const openEditDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    setComponenteForm({
      nome: componente.nome,
      tipo: componente.tipo,
      modelo: componente.modelo || '',
      fabricante: componente.fabricante || '',
      numero_serie: componente.numero_serie || '',
      capacidade: componente.capacidade || '',
      unidade_medida: componente.unidade_medida,
      quantidade_total: componente.quantidade_total,
      quantidade_disponivel: componente.quantidade_disponivel,
      quantidade_em_uso: componente.quantidade_em_uso,
      quantidade_danificada: componente.quantidade_danificada,
      status: componente.status,
      localizacao: componente.localizacao || '',
      localizacao_tipo: componente.localizacao_tipo || 'Almoxarifado',
      obra_id: componente.obra_id,
      dimensoes_altura: componente.dimensoes_altura,
      dimensoes_largura: componente.dimensoes_largura,
      dimensoes_comprimento: componente.dimensoes_comprimento,
      dimensoes_peso: componente.dimensoes_peso,
      vida_util_percentual: componente.vida_util_percentual || 100,
      valor_unitario: componente.valor_unitario,
      data_instalacao: componente.data_instalacao || '',
      data_ultima_manutencao: componente.data_ultima_manutencao || '',
      data_proxima_manutencao: componente.data_proxima_manutencao || '',
      observacoes: componente.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const openMovimentacaoDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    resetMovimentacaoForm()
    // Inicializar quantidade devolvida com a quantidade em uso se houver
    if (componente.quantidade_em_uso > 0) {
      setMovimentacaoForm(prev => ({
        ...prev,
        quantidade_devolvida: componente.quantidade_em_uso
      }))
    }
    setIsMovimentacaoDialogOpen(true)
  }

  const openViewDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    setIsViewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-green-500'
      case 'Em uso': return 'bg-blue-500'
      case 'Manutenção': return 'bg-yellow-500'
      case 'Danificado': return 'bg-red-500'
      case 'Descontinuado': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    return status
  }

  const getTipoLabel = (tipo: string) => {
    return tipo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando componentes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Componentes da Grua
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                
                if (!token) {
                  toast({
                    title: "Erro",
                    description: "Token de autenticação não encontrado. Por favor, faça login novamente.",
                    variant: "destructive"
                  })
                  return
                }
                
                const response = await fetch(`${API_URL}/api/relatorios/componentes-estoque/pdf?grua_id=${gruaId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                })

                if (!response.ok) {
                  // Verificar se é erro de autenticação
                  if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.message || 'Token inválido ou expirado. Por favor, faça login novamente.')
                  }
                  // Verificar se é erro de permissão
                  if (response.status === 403) {
                    throw new Error('Você não tem permissão para gerar este relatório.')
                  }
                  throw new Error('Erro ao gerar PDF')
                }

                // Obter o blob do PDF
                const blob = await response.blob()
                
                // Criar link de download
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `Relatorio-Componentes-Estoque-${gruaId}-${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)

                toast({
                  title: "Sucesso",
                  description: "Relatório PDF gerado com sucesso!",
                })
              } catch (error) {
                console.error('Erro ao gerar PDF:', error)
                const errorMessage = error instanceof Error ? error.message : "Erro ao gerar relatório PDF. Tente novamente."
                toast({
                  title: "Erro",
                  description: errorMessage,
                  variant: "destructive"
                })
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
          <Button onClick={() => router.push(`/dashboard/gruas/${gruaId}/configuracoes`)}>
            <Settings className="w-4 h-4 mr-2" />
            Especificações Técnicas
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Componente
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              // Inicializar devoluções para todos os componentes (mas só os com quantidade em uso podem ser devolvidos)
              const devolucoesIniciais: Record<number, { tipo: 'completa' | 'parcial' | null, quantidade_devolvida?: number }> = {}
              componentes.forEach(comp => {
                if (comp.quantidade_em_uso > 0) {
                  devolucoesIniciais[comp.id] = {
                    tipo: null,
                    quantidade_devolvida: comp.quantidade_em_uso
                  }
                }
              })
              setDevolucoesItens(devolucoesIniciais)
              setIsDevolucaoItensDialogOpen(true)
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Devolução de Itens
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Componentes</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.disponivel}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Uso</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.em_uso}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {estatisticas.valor_total.toLocaleString('pt-BR')}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome, tipo, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em uso">Em Uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Danificado">Danificado</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Estrutural">Estrutural</SelectItem>
                  <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={carregarDados}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Componentes */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes ({filteredComponentes.length})</CardTitle>
          <CardDescription>
            Lista de todos os componentes desta grua
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComponentes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum componente encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo/Fabricante</TableHead>
                  <TableHead>Quantidades</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponentes.map((componente) => (
                  <TableRow key={componente.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{componente.nome}</div>
                        {componente.localizacao && (
                          <div className="text-sm text-gray-500">{componente.localizacao}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTipoLabel(componente.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {componente.modelo && <div><strong>Modelo:</strong> {componente.modelo}</div>}
                        {componente.fabricante && <div><strong>Fabricante:</strong> {componente.fabricante}</div>}
                        {componente.numero_serie && <div><strong>Série:</strong> {componente.numero_serie}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><strong>Total:</strong> {componente.quantidade_total}</div>
                        <div><strong>Disponível:</strong> {componente.quantidade_disponivel}</div>
                        <div><strong>Em uso:</strong> {componente.quantidade_em_uso}</div>
                        {componente.quantidade_danificada > 0 && (
                          <div className="text-red-600"><strong>Danificado:</strong> {componente.quantidade_danificada}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      R$ {componente.valor_unitario.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(componente.status)}>
                        {getStatusLabel(componente.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openViewDialog(componente)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openMovimentacaoDialog(componente)}
                          title="Movimentar"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(componente)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Componente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o componente "{componente.nome}"? Esta ação não pode ser desfeita.
                                {componente.quantidade_em_uso > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <strong>Atenção:</strong> Este componente possui {componente.quantidade_em_uso} unidades em uso.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComponente(componente.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação de Componente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open)
        if (!open) {
          resetComponenteForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Componente</DialogTitle>
            <DialogDescription>
              Busque e selecione um componente do estoque para adicionar à grua
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateComponente(); }} className="space-y-4">
            {/* Campo de busca de componentes do estoque */}
            <div className="relative busca-componente-container">
              <Label htmlFor="busca_componente">Buscar Componente no Estoque *</Label>
              <div className="relative">
                <Input
                  id="busca_componente"
                  placeholder="Digite o nome do componente..."
                  value={buscaComponente}
                  onChange={(e) => {
                    setBuscaComponente(e.target.value)
                  }}
                  onFocus={() => {
                    if (componentesEstoque.length > 0 && buscaComponente.length >= 2) {
                      setMostrarResultadosBusca(true)
                    }
                  }}
                  required
                />
                {buscandoComponentes && (
                  <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              
              {/* Debug info - remover depois */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-1">
                  Debug: mostrarResultadosBusca={mostrarResultadosBusca.toString()}, 
                  componentesEstoque.length={componentesEstoque.length}, 
                  buscaComponente.length={buscaComponente.length}
                </div>
              )}
              
              {/* Lista de resultados da busca */}
              {mostrarResultadosBusca && componentesEstoque.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {componentesEstoque.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => selecionarComponenteEstoque(comp)}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{comp.nome}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {comp.categorias?.nome && <span className="mr-2">Categoria: {comp.categorias.nome}</span>}
                        {comp.localizacao && <span className="mr-2">Localização: {comp.localizacao}</span>}
                      </div>
                      {comp.estoque ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Disponível: {comp.estoque.quantidade_disponivel ?? comp.estoque[0]?.quantidade_disponivel ?? 0} {comp.unidade_medida || 'unidade(s)'}
                          {comp.valor_unitario && (
                            <span className="ml-2">• R$ {comp.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              
              {mostrarResultadosBusca && buscaComponente.length >= 2 && componentesEstoque.length === 0 && !buscandoComponentes && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 text-sm text-gray-500 dark:text-gray-400">
                  Nenhum componente encontrado
                </div>
              )}
            </div>

            {componenteSelecionado && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900">
                  Componente selecionado: {componenteSelecionado.nome}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Estoque disponível: {componenteSelecionado.estoque?.quantidade_disponivel ?? componenteSelecionado.quantidade_disponivel ?? 0} unidades
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Você pode editar os campos abaixo antes de adicionar
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Componente *</Label>
                <Input
                  id="nome"
                  value={componenteForm.nome}
                  onChange={(e) => setComponenteForm({ ...componenteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={componenteForm.tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, tipo: value as ComponenteGrua['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={componenteForm.modelo}
                  onChange={(e) => setComponenteForm({ ...componenteForm, modelo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={componenteForm.fabricante}
                  onChange={(e) => setComponenteForm({ ...componenteForm, fabricante: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="numero_serie">Número de Série</Label>
                <Input
                  id="numero_serie"
                  value={componenteForm.numero_serie}
                  onChange={(e) => setComponenteForm({ ...componenteForm, numero_serie: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  value={componenteForm.capacidade}
                  onChange={(e) => setComponenteForm({ ...componenteForm, capacidade: e.target.value })}
                  placeholder="Ex: 5 toneladas"
                />
              </div>
              <div>
                <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                <Select 
                  value={componenteForm.unidade_medida} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, unidade_medida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="quilograma">Quilograma</SelectItem>
                    <SelectItem value="tonelada">Tonelada</SelectItem>
                    <SelectItem value="metro_quadrado">Metro Quadrado</SelectItem>
                    <SelectItem value="metro_cubico">Metro Cúbico</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="localizacao_tipo">Localização *</Label>
                <Select 
                  value={componenteForm.localizacao_tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, localizacao_tipo: value as ComponenteGrua['localizacao_tipo'], obra_id: value !== 'Obra X' ? undefined : componenteForm.obra_id })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Obra X">Obra X</SelectItem>
                    <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                    <SelectItem value="Oficina">Oficina</SelectItem>
                    <SelectItem value="Em trânsito">Em trânsito</SelectItem>
                    <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {componenteForm.localizacao_tipo === 'Obra X' && (
              <div>
                <Label htmlFor="obra_id">Selecione a Obra *</Label>
                <Select 
                  value={componenteForm.obra_id?.toString() || ''} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, obra_id: parseInt(value) })}
                  disabled={loadingObras}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingObras ? "Carregando obras..." : "Selecione a obra"} />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((obra) => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        {obra.nome || obra.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="quantidade_total">Quantidade Total *</Label>
                <Input
                  id="quantidade_total"
                  type="number"
                  min="1"
                  max={componenteSelecionado ? (componenteSelecionado.estoque?.quantidade_disponivel ?? componenteSelecionado.quantidade_disponivel ?? 1) : undefined}
                  value={componenteForm.quantidade_total}
                  onChange={(e) => {
                    const qtd = parseInt(e.target.value) || 1
                    setComponenteForm({ 
                      ...componenteForm, 
                      quantidade_total: qtd,
                      quantidade_disponivel: qtd // Sincronizar quantidade disponível com total
                    })
                  }}
                  required
                />
                {componenteSelecionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {componenteSelecionado.estoque?.quantidade_disponivel ?? componenteSelecionado.quantidade_disponivel ?? 0}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="quantidade_disponivel">Disponível *</Label>
                <Input
                  id="quantidade_disponivel"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_disponivel}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_disponivel: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade_em_uso">Em Uso</Label>
                <Input
                  id="quantidade_em_uso"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_em_uso}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_em_uso: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="quantidade_danificada">Danificada</Label>
                <Input
                  id="quantidade_danificada"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_danificada}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_danificada: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="vida_util_percentual">Vida Útil: {componenteForm.vida_util_percentual}%</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[componenteForm.vida_util_percentual]}
                    onValueChange={(value) => setComponenteForm({ ...componenteForm, vida_util_percentual: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    id="vida_util_percentual"
                    type="number"
                    min="0"
                    max="100"
                    value={componenteForm.vida_util_percentual}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setComponenteForm({ ...componenteForm, vida_util_percentual: Math.min(100, Math.max(0, val)) })
                    }}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dimensões (opcional)</Label>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dimensoes_altura">Altura (m)</Label>
                  <Input
                    id="dimensoes_altura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_altura || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_altura: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dimensoes_largura">Largura (m)</Label>
                  <Input
                    id="dimensoes_largura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_largura || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_largura: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dimensoes_comprimento">Comprimento (m)</Label>
                  <Input
                    id="dimensoes_comprimento"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_comprimento || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_comprimento: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dimensoes_peso">Peso (kg)</Label>
                  <Input
                    id="dimensoes_peso"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_peso || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_peso: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={componenteForm.valor_unitario}
                  onChange={(e) => setComponenteForm({ ...componenteForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={componenteForm.status} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, status: value as ComponenteGrua['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Danificado">Danificado</SelectItem>
                    <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_ultima_manutencao">Última Manutenção</Label>
                <Input
                  id="data_ultima_manutencao"
                  type="date"
                  value={componenteForm.data_ultima_manutencao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, data_ultima_manutencao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="data_proxima_manutencao">Próxima Manutenção</Label>
                <Input
                  id="data_proxima_manutencao"
                  type="date"
                  value={componenteForm.data_proxima_manutencao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, data_proxima_manutencao: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={componenteForm.observacoes}
                onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Informações adicionais sobre o componente..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Componente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Componente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Componente</DialogTitle>
            <DialogDescription>
              Edite as informações do componente
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateComponente(); }} className="space-y-4">
            {/* Mesmo formulário da criação, mas com dados preenchidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nome">Nome do Componente *</Label>
                <Input
                  id="edit_nome"
                  value={componenteForm.nome}
                  onChange={(e) => setComponenteForm({ ...componenteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_tipo">Tipo *</Label>
                <Select 
                  value={componenteForm.tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, tipo: value as ComponenteGrua['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_modelo">Modelo</Label>
                <Input
                  id="edit_modelo"
                  value={componenteForm.modelo}
                  onChange={(e) => setComponenteForm({ ...componenteForm, modelo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_fabricante">Fabricante</Label>
                <Input
                  id="edit_fabricante"
                  value={componenteForm.fabricante}
                  onChange={(e) => setComponenteForm({ ...componenteForm, fabricante: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_numero_serie">Número de Série</Label>
                <Input
                  id="edit_numero_serie"
                  value={componenteForm.numero_serie}
                  onChange={(e) => setComponenteForm({ ...componenteForm, numero_serie: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_localizacao_tipo">Localização *</Label>
                <Select 
                  value={componenteForm.localizacao_tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, localizacao_tipo: value as ComponenteGrua['localizacao_tipo'], obra_id: value !== 'Obra X' ? undefined : componenteForm.obra_id })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Obra X">Obra X</SelectItem>
                    <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                    <SelectItem value="Oficina">Oficina</SelectItem>
                    <SelectItem value="Em trânsito">Em trânsito</SelectItem>
                    <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {componenteForm.localizacao_tipo === 'Obra X' && (
                <div>
                  <Label htmlFor="edit_obra_id">Selecione a Obra *</Label>
                  <Select 
                    value={componenteForm.obra_id?.toString() || ''} 
                    onValueChange={(value) => setComponenteForm({ ...componenteForm, obra_id: parseInt(value) })}
                    disabled={loadingObras}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingObras ? "Carregando obras..." : "Selecione a obra"} />
                    </SelectTrigger>
                    <SelectContent>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome || obra.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_quantidade_total">Quantidade Total *</Label>
                <Input
                  id="edit_quantidade_total"
                  type="number"
                  min="1"
                  value={componenteForm.quantidade_total}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_total: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_disponivel">Disponível *</Label>
                <Input
                  id="edit_quantidade_disponivel"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_disponivel}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_disponivel: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_em_uso">Em Uso</Label>
                <Input
                  id="edit_quantidade_em_uso"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_em_uso}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_em_uso: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_vida_util_percentual">Vida Útil: {componenteForm.vida_util_percentual}%</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[componenteForm.vida_util_percentual]}
                    onValueChange={(value) => setComponenteForm({ ...componenteForm, vida_util_percentual: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    id="edit_vida_util_percentual"
                    type="number"
                    min="0"
                    max="100"
                    value={componenteForm.vida_util_percentual}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setComponenteForm({ ...componenteForm, vida_util_percentual: Math.min(100, Math.max(0, val)) })
                    }}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dimensões (opcional)</Label>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit_dimensoes_altura">Altura (m)</Label>
                  <Input
                    id="edit_dimensoes_altura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_altura || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_altura: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dimensoes_largura">Largura (m)</Label>
                  <Input
                    id="edit_dimensoes_largura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_largura || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_largura: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dimensoes_comprimento">Comprimento (m)</Label>
                  <Input
                    id="edit_dimensoes_comprimento"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_comprimento || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_comprimento: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dimensoes_peso">Peso (kg)</Label>
                  <Input
                    id="edit_dimensoes_peso"
                    type="number"
                    step="0.01"
                    min="0"
                    value={componenteForm.dimensoes_peso || ''}
                    onChange={(e) => setComponenteForm({ ...componenteForm, dimensoes_peso: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="edit_valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={componenteForm.valor_unitario}
                  onChange={(e) => setComponenteForm({ ...componenteForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select 
                  value={componenteForm.status} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, status: value as ComponenteGrua['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Danificado">Danificado</SelectItem>
                    <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={componenteForm.observacoes}
                onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Informações adicionais sobre o componente..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Movimentação */}
      <Dialog open={isMovimentacaoDialogOpen} onOpenChange={setIsMovimentacaoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimentar Componente</DialogTitle>
            <DialogDescription>
              Registre uma movimentação para o componente: {editingComponente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleMovimentarComponente(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_tipo">Tipo de Movimentação *</Label>
                <Select 
                  value={movimentacaoForm.tipo_movimentacao} 
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, tipo_movimentacao: value as MovimentacaoComponente['tipo_movimentacao'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instalação">Instalação</SelectItem>
                    <SelectItem value="Remoção">Remoção</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Substituição">Substituição</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Ajuste">Ajuste</SelectItem>
                    <SelectItem value="Devolução da Obra">Devolução da Obra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mov_quantidade">Quantidade Movimentada *</Label>
                <Input
                  id="mov_quantidade"
                  type="number"
                  min="1"
                  max={editingComponente?.quantidade_disponivel || 1}
                  value={movimentacaoForm.quantidade_movimentada}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, quantidade_movimentada: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponível: {editingComponente?.quantidade_disponivel || 0}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="mov_motivo">Motivo *</Label>
              <Input
                id="mov_motivo"
                value={movimentacaoForm.motivo}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, motivo: e.target.value })}
                placeholder="Descreva o motivo da movimentação..."
                required
              />
            </div>

            {movimentacaoForm.tipo_movimentacao === 'Transferência' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mov_grua_origem">Grua de Origem</Label>
                  <Input
                    id="mov_grua_origem"
                    value={movimentacaoForm.grua_origem_id}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, grua_origem_id: e.target.value })}
                    placeholder="ID da grua de origem"
                  />
                </div>
                <div>
                  <Label htmlFor="mov_grua_destino">Grua de Destino</Label>
                  <Input
                    id="mov_grua_destino"
                    value={movimentacaoForm.grua_destino_id}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, grua_destino_id: e.target.value })}
                    placeholder="ID da grua de destino"
                  />
                </div>
              </div>
            )}

            {movimentacaoForm.tipo_movimentacao === 'Devolução da Obra' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <Label htmlFor="mov_obra_devolucao">Obra de Origem *</Label>
                  <Select
                    value={movimentacaoForm.obra_id}
                    onValueChange={(value) => {
                      setMovimentacaoForm({ 
                        ...movimentacaoForm, 
                        obra_id: value,
                        quantidade_devolvida: editingComponente?.quantidade_em_uso || 0
                      })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome || obra.name} - {obra.endereco || obra.location || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mov_tipo_devolucao">Tipo de Devolução *</Label>
                  <Select
                    value={movimentacaoForm.tipo_devolucao}
                    onValueChange={(value) => {
                      setMovimentacaoForm({ 
                        ...movimentacaoForm, 
                        tipo_devolucao: value as 'completa' | 'parcial',
                        quantidade_devolvida: value === 'completa' ? (editingComponente?.quantidade_em_uso || 0) : movimentacaoForm.quantidade_devolvida
                      })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completa">Devolução Completa</SelectItem>
                      <SelectItem value="parcial">Devolução Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {movimentacaoForm.tipo_devolucao === 'parcial' && (
                  <>
                    <div>
                      <Label htmlFor="mov_quantidade_devolvida">Quantidade que Retornou *</Label>
                      <Input
                        id="mov_quantidade_devolvida"
                        type="number"
                        min="0"
                        max={editingComponente?.quantidade_em_uso || 0}
                        value={movimentacaoForm.quantidade_devolvida}
                        onChange={(e) => {
                          const qtd = parseInt(e.target.value) || 0
                          const qtdNaoDevolvida = (editingComponente?.quantidade_em_uso || 0) - qtd
                          setMovimentacaoForm({ 
                            ...movimentacaoForm, 
                            quantidade_devolvida: qtd,
                            valor_nao_devolvido: qtdNaoDevolvida * (editingComponente?.valor_unitario || 0)
                          })
                        }}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Quantidade em uso na obra: {editingComponente?.quantidade_em_uso || 0}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="mov_valor_nao_devolvido">Valor do que Não Retornou (R$) *</Label>
                      <Input
                        id="mov_valor_nao_devolvido"
                        type="number"
                        step="0.01"
                        min="0"
                        value={movimentacaoForm.valor_nao_devolvido}
                        onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, valor_nao_devolvido: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valor calculado: R$ {((editingComponente?.quantidade_em_uso || 0) - movimentacaoForm.quantidade_devolvida) * (editingComponente?.valor_unitario || 0) || 0}
                      </p>
                    </div>
                  </>
                )}

                {movimentacaoForm.tipo_devolucao === 'completa' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Devolução Completa:</strong> Todas as {editingComponente?.quantidade_em_uso || 0} unidades em uso serão devolvidas.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="mov_observacoes">Observações</Label>
              <Textarea
                id="mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações adicionais sobre a movimentação..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsMovimentacaoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      {/* Dialog de Visualização de Componente */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Componente</DialogTitle>
            <DialogDescription>
              Informações completas do componente: {editingComponente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {editingComponente && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div><strong>Nome:</strong> {editingComponente.nome}</div>
                    <div><strong>Tipo:</strong> <Badge variant="outline">{editingComponente.tipo}</Badge></div>
                    <div><strong>Status:</strong> <Badge className={getStatusColor(editingComponente.status)}>{editingComponente.status}</Badge></div>
                    {editingComponente.modelo && <div><strong>Modelo:</strong> {editingComponente.modelo}</div>}
                    {editingComponente.fabricante && <div><strong>Fabricante:</strong> {editingComponente.fabricante}</div>}
                    {editingComponente.numero_serie && <div><strong>Número de Série:</strong> {editingComponente.numero_serie}</div>}
                    {editingComponente.capacidade && <div><strong>Capacidade:</strong> {editingComponente.capacidade}</div>}
                    <div><strong>Unidade de Medida:</strong> {editingComponente.unidade_medida}</div>
                    {editingComponente.localizacao && <div><strong>Localização:</strong> {editingComponente.localizacao}</div>}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quantidades</h3>
                  <div className="space-y-2">
                    <div><strong>Total:</strong> {editingComponente.quantidade_total}</div>
                    <div><strong>Disponível:</strong> {editingComponente.quantidade_disponivel}</div>
                    <div><strong>Em Uso:</strong> {editingComponente.quantidade_em_uso}</div>
                    <div><strong>Danificada:</strong> {editingComponente.quantidade_danificada}</div>
                    <div><strong>Valor Unitário:</strong> R$ {editingComponente.valor_unitario.toLocaleString('pt-BR')}</div>
                    <div><strong>Valor Total:</strong> R$ {(editingComponente.valor_unitario * editingComponente.quantidade_total).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Datas Importantes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {editingComponente.data_instalacao && (
                    <div>
                      <strong>Data de Instalação:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_instalacao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                  {editingComponente.data_ultima_manutencao && (
                    <div>
                      <strong>Última Manutenção:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_ultima_manutencao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                  {editingComponente.data_proxima_manutencao && (
                    <div>
                      <strong>Próxima Manutenção:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_proxima_manutencao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {editingComponente.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {editingComponente.observacoes}
                  </div>
                </div>
              )}

              {/* Informações do Sistema */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Criado em:</strong> {new Date(editingComponente.created_at).toLocaleString('pt-BR')}</div>
                  <div><strong>Atualizado em:</strong> {new Date(editingComponente.updated_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              openEditDialog(editingComponente!)
            }}>
              Editar Componente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Devolução de Itens */}
      <Dialog open={isDevolucaoItensDialogOpen} onOpenChange={setIsDevolucaoItensDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devolução de Itens</DialogTitle>
            <DialogDescription>
              Selecione os componentes que retornaram ao estoque. Marque com check para devolução completa ou X para devolução parcial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {componentes.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum componente encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Quantidade em Uso</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Devolução Completa</TableHead>
                    <TableHead>Devolução Parcial</TableHead>
                    <TableHead>Quantidade Devolvida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentes.map((componente) => {
                      const devolucao = devolucoesItens[componente.id] || { tipo: null, quantidade_devolvida: componente.quantidade_em_uso || 0 }
                      const isCompleta = devolucao.tipo === 'completa'
                      const isParcial = devolucao.tipo === 'parcial'
                      const podeDevolver = componente.quantidade_em_uso > 0
                      
                      return (
                        <TableRow 
                          key={componente.id}
                          className={!podeDevolver ? "opacity-50" : ""}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{componente.nome}</div>
                              <div className="text-xs text-gray-500">{componente.tipo}</div>
                              {componente.modelo && (
                                <div className="text-xs text-gray-500">Modelo: {componente.modelo}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={podeDevolver ? "" : "text-gray-400"}>
                              {componente.quantidade_em_uso}
                            </span>
                          </TableCell>
                          <TableCell>
                            R$ {componente.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={isCompleta ? "default" : "outline"}
                              disabled={!podeDevolver}
                              onClick={() => {
                                setDevolucoesItens({
                                  ...devolucoesItens,
                                  [componente.id]: {
                                    tipo: isCompleta ? null : 'completa',
                                    quantidade_devolvida: componente.quantidade_em_uso
                                  }
                                })
                              }}
                              className={isCompleta ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={isParcial ? "destructive" : "outline"}
                              disabled={!podeDevolver}
                              onClick={() => {
                                if (!isParcial) {
                                  setDevolucoesItens({
                                    ...devolucoesItens,
                                    [componente.id]: {
                                      tipo: 'parcial',
                                      quantidade_devolvida: 0
                                    }
                                  })
                                } else {
                                  setDevolucoesItens({
                                    ...devolucoesItens,
                                    [componente.id]: {
                                      tipo: null,
                                      quantidade_devolvida: componente.quantidade_em_uso
                                    }
                                  })
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            {isParcial ? (
                              <Input
                                type="number"
                                min="0"
                                max={componente.quantidade_em_uso}
                                value={devolucao.quantidade_devolvida || 0}
                                onChange={(e) => {
                                  const qtd = parseInt(e.target.value) || 0
                                  setDevolucoesItens({
                                    ...devolucoesItens,
                                    [componente.id]: {
                                      ...devolucao,
                                      quantidade_devolvida: qtd
                                    }
                                  })
                                }}
                                className="w-24"
                                disabled={!podeDevolver}
                              />
                            ) : (
                              <span className="text-sm text-gray-500">
                                {isCompleta ? componente.quantidade_em_uso : '-'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDevolucoesItens({})
                setIsDevolucaoItensDialogOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const devolucoesSelecionadas = Object.entries(devolucoesItens).filter(
                  ([_, dev]) => dev.tipo !== null
                )
                
                if (devolucoesSelecionadas.length === 0) {
                  toast({
                    title: "Atenção",
                    description: "Selecione pelo menos uma devolução",
                    variant: "destructive"
                  })
                  return
                }

                setProcessandoDevolucoes(true)
                try {
                  // Processar cada devolução atualizando diretamente as quantidades
                  for (const [componente_id, dev] of devolucoesSelecionadas) {
                    const componente = componentes.find(c => c.id === parseInt(componente_id))
                    if (!componente) continue

                    let quantidadeDevolver = 0
                    if (dev.tipo === 'completa') {
                      quantidadeDevolver = componente.quantidade_em_uso
                    } else if (dev.tipo === 'parcial' && dev.quantidade_devolvida) {
                      quantidadeDevolver = dev.quantidade_devolvida
                    }

                    if (quantidadeDevolver > 0 && quantidadeDevolver <= componente.quantidade_em_uso) {
                      // Atualizar componente: diminuir quantidade_em_uso e aumentar quantidade_disponivel
                      const novaQuantidadeEmUso = componente.quantidade_em_uso - quantidadeDevolver
                      const novaQuantidadeDisponivel = componente.quantidade_disponivel + quantidadeDevolver

                      // Atualizar o componente diretamente
                      await apiComponentes.atualizar(parseInt(componente_id), {
                        quantidade_em_uso: novaQuantidadeEmUso,
                        quantidade_disponivel: novaQuantidadeDisponivel,
                        status: novaQuantidadeEmUso === 0 ? 'Disponível' : componente.status,
                        observacoes: `${componente.observacoes || ''}\nDevolução: ${quantidadeDevolver} unidade(s) ao estoque em ${new Date().toLocaleString('pt-BR')}`
                      })

                      // Registrar no histórico diretamente na tabela (opcional, não crítico)
                      try {
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                        
                        const histResponse = await fetch(`${API_URL}/api/historico-componentes`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            componente_id: parseInt(componente_id),
                            tipo_movimentacao: 'Remoção',
                            quantidade_movimentada: quantidadeDevolver,
                            quantidade_anterior: componente.quantidade_em_uso,
                            quantidade_atual: novaQuantidadeEmUso,
                            motivo: dev.tipo === 'completa' ? 'Devolução completa ao estoque' : 'Devolução parcial ao estoque',
                            observacoes: dev.tipo === 'completa' 
                              ? 'Devolução automática via modal de devolução de itens' 
                              : `Devolvido ${quantidadeDevolver} de ${componente.quantidade_em_uso} unidades`
                          })
                        })
                        
                        if (!histResponse.ok) {
                          console.warn('Não foi possível registrar no histórico (não crítico)')
                        }
                      } catch (histError) {
                        // Se der erro no histórico, apenas logar mas não falhar
                        console.warn('Erro ao registrar no histórico (não crítico):', histError)
                      }
                    } else if (quantidadeDevolver > componente.quantidade_em_uso) {
                      toast({
                        title: "Atenção",
                        description: `Componente "${componente.nome}": quantidade a devolver (${quantidadeDevolver}) é maior que a quantidade em uso (${componente.quantidade_em_uso})`,
                        variant: "destructive"
                      })
                    }
                  }

                  toast({
                    title: "Sucesso",
                    description: `${devolucoesSelecionadas.length} devolução(ões) processada(s) com sucesso`
                  })

                  setDevolucoesItens({})
                  setIsDevolucaoItensDialogOpen(false)
                  
                  // Recarregar dados
                  await carregarDados()
                } catch (error: any) {
                  console.error('Erro ao processar devoluções:', error)
                  toast({
                    title: "Erro",
                    description: error.message || error.response?.data?.message || "Erro ao processar devoluções",
                    variant: "destructive"
                  })
                } finally {
                  setProcessandoDevolucoes(false)
                }
              }}
              disabled={processandoDevolucoes}
              className="bg-green-600 hover:bg-green-700"
            >
              {processandoDevolucoes ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Processar Devoluções
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
