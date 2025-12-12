"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Building2, 
  ArrowLeft,
  Calendar, 
  Users, 
  DollarSign,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  FileSignature,
  ExternalLink,
  Upload,
  Download,
  FileText,
  Send,
  RefreshCw,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  File,
  Trash2,
  Paperclip,
  X,
  Shield,
  Calculator,
  XCircle
} from "lucide-react"
import { custosMensaisApi, CustoMensal as CustoMensalApi, CustoMensalObra, CustoMensalObraCreate, CustoMensalObraUpdate, formatarMes, formatarValor, formatarQuantidade } from "@/lib/api-custos-mensais"
import { livroGruaApi, EntradaLivroGrua, EntradaLivroGruaCompleta, FiltrosLivroGrua } from "@/lib/api-livro-grua"
import { obrasDocumentosApi, DocumentoObra, DocumentoCreate } from "@/lib/api-obras-documentos"
import { obrasArquivosApi, ArquivoObra, ArquivoCreate } from "@/lib/api-obras-arquivos"
import LivroGruaForm from "@/components/livro-grua-form"
import LivroGruaList from "@/components/livro-grua-list"
import { LivroGruaChecklistDiario } from "@/components/livro-grua-checklist-diario"
import { LivroGruaManutencao } from "@/components/livro-grua-manutencao"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { LivroGruaObra } from "@/components/livro-grua-obra"
import { CheckCircle2 } from "lucide-react"
import { exportTabToPDF } from "@/lib/utils/export-pdf"
import { Progress } from "@/components/ui/progress"
import GruaComplementosManager from "@/components/grua-complementos-manager"
import { useParams, useRouter } from "next/navigation"
import { obrasApi, converterObraBackendParaFrontend, ObraBackend, ensureAuthenticated } from "@/lib/api-obras"
import { createFuncionarioObra, deleteFuncionarioObra } from "@/lib/api-funcionarios-obras"
import { PageLoader, CardLoader, InlineLoader } from "@/components/ui/loader"
import { AlertCircle } from "lucide-react"
import GruaSearch from "@/components/grua-search"
import { gruasApi, converterGruaBackendParaFrontend } from "@/lib/api-gruas"
import { obraGruasApi } from "@/lib/api-obra-gruas"
import { useObraStore } from "@/lib/obra-store"
import { DocumentoUpload } from "@/components/documento-upload"
import api, { fetchWithAuth } from "@/lib/api"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { clientesApi } from "@/lib/api-clientes"
import { ValorMonetarioOculto, ValorFormatadoOculto } from "@/components/valor-oculto"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { medicoesUtils } from "@/lib/medicoes-utils"
import { getOrcamentos } from "@/lib/api-orcamentos"
import FuncionarioSearch from "@/components/funcionario-search"
import { sinaleirosApi, type SinaleiroBackend, type DocumentoSinaleiroBackend } from "@/lib/api-sinaleiros"

function ObraDetailsPageContent() {

  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const obraId = params.id as string
  
  // Usar store de obra
  const {
    obra,
    loading,
    error,
    custosMensais,
    loadingCustos,
    errorCustos,
    carregarObra,
    carregarCustosMensais
  } = useObraStore()
  
  // Estados locais para dados não armazenados no store
  const [documentos, setDocumentos] = useState<any[]>([])
  const [arquivos, setArquivos] = useState<any[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null)
  const [errorArquivos, setErrorArquivos] = useState<string | null>(null)
  const [notificandoEnvolvidos, setNotificandoEnvolvidos] = useState(false)
  
  // Estados para medições mensais
  const [medicoesMensais, setMedicoesMensais] = useState<MedicaoMensal[]>([])
  const [orcamentosObra, setOrcamentosObra] = useState<any[]>([])
  const [loadingMedicoes, setLoadingMedicoes] = useState(false)
  const [errorMedicoes, setErrorMedicoes] = useState<string | null>(null)
  
  // Estados para filtros de medições
  const [filtroAno, setFiltroAno] = useState<string>("todos")
  const [filtroMes, setFiltroMes] = useState<string>("todos")
  
  // Estados para sinaleiros
  const [sinaleiros, setSinaleiros] = useState<SinaleiroBackend[]>([])
  const [loadingSinaleiros, setLoadingSinaleiros] = useState(false)
  const [errorSinaleiros, setErrorSinaleiros] = useState<string | null>(null)
  const [documentosSinaleiros, setDocumentosSinaleiros] = useState<Record<string, DocumentoSinaleiroBackend[]>>({})
  
  // Estados para edição inline
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [artArquivo, setArtArquivo] = useState<File | null>(null)
  const [apoliceArquivo, setApoliceArquivo] = useState<File | null>(null)
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<any>(null)
  
  // Estado para diálogo de criação manual de medição
  const [isCriarMedicaoOpen, setIsCriarMedicaoOpen] = useState(false)
  const [medicaoFormData, setMedicaoFormData] = useState({
    periodo: '',
    data_medicao: '',
    valor_mensal_bruto: 0,
    observacoes: ''
  })
  const [criandoMedicao, setCriandoMedicao] = useState(false)
  
  // Função para iniciar edição
  const iniciarEdicao = () => {
    if (!obra) return
    
    // Inicializar responsável selecionado se existir
    if (obra?.responsavelId && obra?.responsavelName) {
      setResponsavelSelecionado({
        id: parseInt(obra.responsavelId),
        name: obra.responsavelName
      })
    } else {
      setResponsavelSelecionado(null)
    }
    
    setEditingData({
      nome: obra.name || '',
      descricao: obra.description || '',
      status: obra.status || 'Em Andamento',
      data_inicio: obra.startDate ? new Date(obra.startDate).toISOString().split('T')[0] : '',
      data_fim: obra.endDate ? new Date(obra.endDate).toISOString().split('T')[0] : '',
      orcamento: obra?.budget || 0,
      endereco: obra?.endereco || obra?.location || '',
      cidade: obra?.cidade || '',
      estado: obra?.estado || '',
      cep: obra?.cep || '',
      tipo: obra?.tipo || '',
      responsavel_id: obra?.responsavelId ? parseInt(obra.responsavelId) : null,
      responsavel_nome: obra?.responsavelName || '',
      cno: obra?.cno || '',
      art_numero: obra?.art_numero || '',
      apolice_numero: obra?.apolice_numero || '',
      observacoes: obra?.observations || ''
    })
    setIsEditing(true)
  }
  
  // Função para lidar com seleção de responsável
  const handleResponsavelSelect = (responsavel: any) => {
    setResponsavelSelecionado(responsavel)
    if (responsavel) {
      setEditingData({ 
        ...editingData, 
        responsavel_id: responsavel.id,
        responsavel_nome: responsavel.name
      })
    } else {
      setEditingData({ 
        ...editingData, 
        responsavel_id: null,
        responsavel_nome: ''
      })
    }
  }
  
  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditingData({})
    setArtArquivo(null)
    setApoliceArquivo(null)
    setResponsavelSelecionado(null)
    setIsEditing(false)
  }
  
  // Função para salvar edição
  const salvarEdicao = async () => {
    if (!obra?.id) return
    
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      let artArquivoUrl = obra?.art_arquivo || ''
      let apoliceArquivoUrl = obra?.apolice_arquivo || ''
      
      // 1. Fazer upload dos arquivos ART e Apólice se houver novos arquivos
      if (artArquivo) {
        try {
          const formDataArt = new FormData()
          formDataArt.append('arquivo', artArquivo)
          formDataArt.append('categoria', 'art')
          
          const uploadArtResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataArt
          })
          
          if (uploadArtResponse.ok) {
            const uploadArtResult = await uploadArtResponse.json()
            artArquivoUrl = uploadArtResult.data?.caminho || uploadArtResult.data?.arquivo || ''
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload da ART:', uploadError)
        }
      }
      
      if (apoliceArquivo) {
        try {
          const formDataApolice = new FormData()
          formDataApolice.append('arquivo', apoliceArquivo)
          formDataApolice.append('categoria', 'apolice')
          
          const uploadApoliceResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataApolice
          })
          
          if (uploadApoliceResponse.ok) {
            const uploadApoliceResult = await uploadApoliceResponse.json()
            apoliceArquivoUrl = uploadApoliceResult.data?.caminho || uploadApoliceResult.data?.arquivo || ''
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload da Apólice:', uploadError)
        }
      }
      
      // 2. Converter dados para formato do backend
      // Campos obrigatórios devem sempre ser enviados
      const updateData: any = {
        nome: editingData.nome || obra?.name || '',
        cliente_id: obra?.cliente?.id ? parseInt(obra.cliente.id) : null,
        endereco: editingData.endereco || obra?.endereco || obra?.location || '',
        cidade: editingData.cidade || obra?.cidade || '',
        estado: editingData.estado || obra?.estado || '',
        tipo: editingData.tipo || obra?.tipo || '',
        // Campos opcionais
        descricao: editingData.descricao || null,
        status: editingData.status || obra?.status || 'Em Andamento',
        data_inicio: editingData.data_inicio || null,
        data_fim: editingData.data_fim || null,
        orcamento: editingData.orcamento ? parseFloat(editingData.orcamento.toString()) : null,
        cep: editingData.cep || null,
        responsavel_id: editingData.responsavel_id || null,
        responsavel_nome: editingData.responsavel_nome || null,
        cno: editingData.cno || null,
        art_numero: editingData.art_numero || null,
        apolice_numero: editingData.apolice_numero || null,
        observacoes: editingData.observacoes || null
      }
      
      // Adicionar URLs dos arquivos se houver
      if (artArquivoUrl) {
        updateData.art_arquivo = artArquivoUrl
      }
      if (apoliceArquivoUrl) {
        updateData.apolice_arquivo = apoliceArquivoUrl
      }
      
      // Remover apenas campos opcionais vazios (manter obrigatórios mesmo se vazios)
      const camposObrigatorios = ['nome', 'cliente_id', 'endereco', 'cidade', 'estado', 'tipo']
      Object.keys(updateData).forEach(key => {
        if (!camposObrigatorios.includes(key) && (updateData[key] === null || updateData[key] === '' || updateData[key] === undefined)) {
          delete updateData[key]
        }
      })
      
      // 3. Atualizar obra
      const response = await obrasApi.atualizarObra(parseInt(obra.id), updateData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Obra atualizada com sucesso",
          variant: "default"
        })
        
        // Recarregar obra atualizada
        await carregarObra(obraId)
        setIsEditing(false)
        setEditingData({})
        setArtArquivo(null)
        setApoliceArquivo(null)
      } else {
        throw new Error('Erro ao atualizar obra')
      }
    } catch (error: any) {
      console.error('Erro ao salvar edição:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar obra",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Função para carregar sinaleiros da obra
  const carregarSinaleiros = async () => {
    if (!obraId) return
    
    setLoadingSinaleiros(true)
    setErrorSinaleiros(null)
    try {
      const response = await sinaleirosApi.listarPorObra(parseInt(obraId))
      
      if (response.success && response.data) {
        setSinaleiros(response.data)
        
        // Carregar documentos de cada sinaleiro
        const documentosMap: Record<string, DocumentoSinaleiroBackend[]> = {}
        for (const sinaleiro of response.data) {
          try {
            const docsResponse = await sinaleirosApi.listarDocumentos(sinaleiro.id)
            if (docsResponse.success && docsResponse.data) {
              documentosMap[sinaleiro.id] = docsResponse.data
            }
          } catch (error) {
            console.error(`Erro ao carregar documentos do sinaleiro ${sinaleiro.id}:`, error)
          }
        }
        setDocumentosSinaleiros(documentosMap)
      }
    } catch (error: any) {
      console.error('Erro ao carregar sinaleiros:', error)
      setErrorSinaleiros(error.message || 'Erro ao carregar sinaleiros')
    } finally {
      setLoadingSinaleiros(false)
    }
  }

  // Função para carregar medições mensais da obra
  const carregarMedicoesMensais = async () => {
    if (!obraId) return
    
    setLoadingMedicoes(true)
    setErrorMedicoes(null)
    try {
      // Buscar orçamentos vinculados à obra (para exibição)
      const orcamentosResponse = await getOrcamentos({ 
        page: 1, 
        limit: 100,
        obra_id: parseInt(obraId)
      })
      
      const orcamentos = orcamentosResponse.data || []
      setOrcamentosObra(orcamentos)
      
      // Usar o mesmo endpoint que a página de medições usa
      const response = await medicoesMensaisApi.listar({ 
        obra_id: parseInt(obraId),
        limit: 1000 
      })
      
      if (response.success) {
        const todasMedicoes = response.data || []
        
        // Ordenar por período (mais recente primeiro)
        todasMedicoes.sort((a, b) => {
          if (b.periodo > a.periodo) return 1
          if (b.periodo < a.periodo) return -1
          return 0
        })
        
        setMedicoesMensais(todasMedicoes)
      } else {
        setErrorMedicoes('Erro ao carregar medições')
      }
    } catch (error: any) {
      console.error('Erro ao carregar medições mensais:', error)
      setErrorMedicoes(error.message || 'Erro ao carregar medições mensais')
    } finally {
      setLoadingMedicoes(false)
    }
  }

  // Função para criar medição manual (sem orçamento)
  const handleCriarMedicaoManual = async () => {
    if (!obraId || !obra) return
    
    // Validar campos obrigatórios
    if (!medicaoFormData.periodo || !medicaoFormData.data_medicao) {
      toast({
        title: "Erro",
        description: "Preencha o período e a data da medição",
        variant: "destructive"
      })
      return
    }

    // Validar formato do período (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(medicaoFormData.periodo)) {
      toast({
        title: "Erro",
        description: "Período deve estar no formato YYYY-MM (ex: 2025-01)",
        variant: "destructive"
      })
      return
    }

    setCriandoMedicao(true)
    try {
      const [ano, mes] = medicaoFormData.periodo.split('-').map(Number)
      
      // Gerar número da medição (formato: MED-YYYY-MM-001)
      const numero = `MED-${medicaoFormData.periodo}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      
      const medicaoData = {
        obra_id: parseInt(obraId),
        orcamento_id: null, // Sem orçamento
        numero: numero,
        periodo: medicaoFormData.periodo,
        data_medicao: medicaoFormData.data_medicao,
        mes_referencia: mes,
        ano_referencia: ano,
        valor_mensal_bruto: medicaoFormData.valor_mensal_bruto || 0,
        valor_aditivos: 0,
        valor_custos_extras: 0,
        valor_descontos: 0,
        status: 'pendente' as const,
        observacoes: medicaoFormData.observacoes || undefined
      }

      const response = await medicoesMensaisApi.criar(medicaoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição criada com sucesso",
          variant: "default"
        })
        
        // Limpar formulário
        setMedicaoFormData({
          periodo: '',
          data_medicao: '',
          valor_mensal_bruto: 0,
          observacoes: ''
        })
        
        // Fechar diálogo
        setIsCriarMedicaoOpen(false)
        
        // Recarregar medições
        await carregarMedicoesMensais()
      }
    } catch (error: any) {
      console.error('Erro ao criar medição:', error)
      // Extrair mensagem do response do backend
      let errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         "Erro ao criar medição"
      
      // Formatar período na mensagem se ainda estiver no formato YYYY-MM
      errorMessage = errorMessage.replace(/(\d{4}-\d{2})/g, (match) => {
        return medicoesUtils.formatPeriodo(match);
      });
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setCriandoMedicao(false)
    }
  }

  // Função para gerar PDF de medição mensal
  const handleGerarPDFMedicao = async (medicao: MedicaoMensal) => {
    try {
      // Verificar se a medição tem orçamento
      if (!medicao.orcamento_id) {
        toast({
          title: "Aviso",
          description: "Esta medição não possui orçamento vinculado. O PDF só pode ser gerado para medições com orçamento.",
          variant: "destructive"
        })
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      // Usar fetchWithAuth que trata refresh de token automaticamente
      const response = await fetchWithAuth(
        `${API_URL}/api/relatorios/medicoes/${medicao.orcamento_id}/pdf?medicao_id=${medicao.id}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        // Tentar ler a mensagem de erro da resposta
        let errorMessage = 'Erro ao gerar PDF'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Se não conseguir ler JSON, usar mensagem padrão
        }
        
        // Se for erro de autenticação, sugerir refresh
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Erro de autenticação",
            description: "Sua sessão expirou. Por favor, recarregue a página e tente novamente.",
            variant: "destructive"
          })
          return
        }
        
        throw new Error(errorMessage)
      }

      // Obter o blob do PDF
      const blob = await response.blob()
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Medicao-${medicao.numero}-${medicao.periodo}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "PDF da medição gerado com sucesso!",
      })
    } catch (error: any) {
      console.error('Erro ao gerar PDF da medição:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar PDF da medição. Tente novamente.",
        variant: "destructive"
      })
    }
  }


  // Funções para carregar documentos e arquivos
  const carregarDocumentos = async () => {
    if (!obraId) return
    
    setLoadingDocumentos(true)
    setErrorDocumentos(null)
    
    try {
      const response = await obrasDocumentosApi.listarPorObra(parseInt(obraId))
      if (response.success && response.data) {
        setDocumentos(Array.isArray(response.data) ? response.data : [response.data])
      } else {
        setErrorDocumentos('Erro ao carregar documentos')
      }
    } catch (error) {
      setErrorDocumentos('Erro ao carregar documentos')
    } finally {
      setLoadingDocumentos(false)
    }
  }
  
  const carregarArquivos = async () => {
    if (!obraId) return
    
    setLoadingArquivos(true)
    setErrorArquivos(null)
    
    try {
      const response = await obrasArquivosApi.listarPorObra(parseInt(obraId))
      if (response.success && response.data) {
        setArquivos(Array.isArray(response.data) ? response.data : [response.data])
      } else {
        setErrorArquivos('Erro ao carregar arquivos')
      }
    } catch (error) {
      setErrorArquivos('Erro ao carregar arquivos')
    } finally {
      setLoadingArquivos(false)
    }
  }
  
  // Estados locais que não estão no store
  const [gruasReais, setGruasReais] = useState<any[]>([])
  const [loadingGruas, setLoadingGruas] = useState(false)
  
  // Estados para funcionários
  const [funcionariosVinculados, setFuncionariosVinculados] = useState<any[]>([])
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)
  const [isAdicionarFuncionarioOpen, setIsAdicionarFuncionarioOpen] = useState(false)
  const [isAdicionarSupervisorOpen, setIsAdicionarSupervisorOpen] = useState(false)
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  const [supervisoresSelecionados, setSupervisoresSelecionados] = useState<any[]>([])
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<any[]>([])
  const [supervisoresDisponiveis, setSupervisoresDisponiveis] = useState<any[]>([])
  const [funcionarioSearchValue, setFuncionarioSearchValue] = useState('')
  const [supervisorSearchValue, setSupervisorSearchValue] = useState('')
  const [loadingFuncionariosSearch, setLoadingFuncionariosSearch] = useState(false)
  const [loadingSupervisoresSearch, setLoadingSupervisoresSearch] = useState(false)
  const [novoFuncionarioData, setNovoFuncionarioData] = useState({
    dataInicio: '',
    dataFim: '',
    observacoes: ''
  })
  const [novoSupervisorData, setNovoSupervisorData] = useState({
    dataInicio: '',
    dataFim: '',
    observacoes: ''
  })
  
  // Estados para modal de adicionar grua
  const [isAdicionarGruaOpen, setIsAdicionarGruaOpen] = useState(false)
  const [gruasSelecionadas, setGruasSelecionadas] = useState<any[]>([])
  const [novaGruaData, setNovaGruaData] = useState({
    dataInicioLocacao: '',
    dataFimLocacao: '',
    observacoes: ''
  })
  
  // Estados para documentos e arquivos - agora no store

  // Estado para tab ativa (para exportação PDF)
  const [activeTab, setActiveTab] = useState<string>('geral')

  // Estados para livro da grua - Checklist Diários
  const [isNovoChecklistOpen, setIsNovoChecklistOpen] = useState(false)
  const [isEditarChecklistOpen, setIsEditarChecklistOpen] = useState(false)
  const [isVisualizarChecklistOpen, setIsVisualizarChecklistOpen] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<any>(null)
  const [gruaSelecionadaChecklist, setGruaSelecionadaChecklist] = useState<string>("")
  
  // Estados para livro da grua - Manutenções
  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState(false)
  const [isEditarManutencaoOpen, setIsEditarManutencaoOpen] = useState(false)
  const [isVisualizarManutencaoOpen, setIsVisualizarManutencaoOpen] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<any>(null)
  const [gruaSelecionadaManutencao, setGruaSelecionadaManutencao] = useState<string>("")
  
  // Estados para filtros e nova entrada (mantidos para compatibilidade)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrua, setSelectedGrua] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNovaEntradaOpen, setIsNovaEntradaOpen] = useState(false)
  const [isVisualizarEntradaOpen, setIsVisualizarEntradaOpen] = useState(false)
  const [entradaSelecionada, setEntradaSelecionada] = useState<EntradaLivroGruaCompleta | null>(null)
  const [isEditarEntradaOpen, setIsEditarEntradaOpen] = useState(false)
  const [isNovoArquivoOpen, setIsNovoArquivoOpen] = useState(false)
  const [isNovoDocumentoOpen, setIsNovoDocumentoOpen] = useState(false)
  const [arquivosAdicionais, setArquivosAdicionais] = useState<any[]>([])
  const [novoArquivoData, setNovoArquivoData] = useState({
    nome: '',
    descricao: '',
    categoria: 'geral',
    arquivo: null as File | null
  })
  
  // Estados para novo documento
  const [novoDocumentoData, setNovoDocumentoData] = useState({
    titulo: '',
    descricao: '',
    arquivo: null as File | null,
    linkAssinatura: ''
  })
  const [documentoAssinantes, setDocumentoAssinantes] = useState<Array<{
    userId: string,
    ordem: number,
    status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado',
    tipo: 'interno' | 'cliente',
    docuSignLink?: string,
    userInfo?: {
      id: number,
      nome: string,
      email: string,
      cargo?: string,
      role?: string
    }
  }>>([])
  const [tipoAssinante, setTipoAssinante] = useState<'interno' | 'cliente' | ''>('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [assinanteFilter, setAssinanteFilter] = useState('')
  const [assinantesFiltrados, setAssinantesFiltrados] = useState<any[]>([])
  const [isSubmittingDocumento, setIsSubmittingDocumento] = useState(false)
  const [isNovoItemOpen, setIsNovoItemOpen] = useState(false)
  const [isNovoAditivoOpen, setIsNovoAditivoOpen] = useState(false)
  const [itensContrato, setItensContrato] = useState<any[]>([])
  const [aditivos, setAditivos] = useState<any[]>([])
  const [novoItemData, setNovoItemData] = useState({
    item: '',
    descricao: '',
    unidade: 'mês',
    quantidadeOrcamento: 0,
    valorUnitario: 0,
    quantidadeAnterior: 0,
    valorAnterior: 0,
    quantidadePeriodo: 0,
    valorPeriodo: 0
  })
  
  // Estados para custos mensais - agora no store
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [isNovoMesOpen, setIsNovoMesOpen] = useState(false)
  const [novoMesData, setNovoMesData] = useState({
    mes: ''
  })
  const [mesesDisponiveis, setMesesDisponiveis] = useState<Array<{value: string, label: string}>>([])
  const [isNovoCustoOpen, setIsNovoCustoOpen] = useState(false)
  const [isEditandoCusto, setIsEditandoCusto] = useState(false)
  const [custoSelecionado, setCustoSelecionado] = useState<CustoMensalObra | null>(null)
  const [novoCustoData, setNovoCustoData] = useState({
    item: '',
    descricao: '',
    unidade: 'mês',
    quantidade_orcamento: 0,
    valor_unitario: 0,
    quantidade_realizada: 0,
    quantidade_acumulada: 0,
    valor_acumulado: 0,
    tipo: 'contrato' as 'contrato' | 'aditivo'
  })
  const [isCustosIniciaisOpen, setIsCustosIniciaisOpen] = useState(false)
  const [custosIniciaisData, setCustosIniciaisData] = useState({
    mes: '',
    custos: [{
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidade_orcamento: 0,
      valor_unitario: 0,
      tipo: 'contrato' as 'contrato' | 'aditivo'
    }]
  })
  const [novaEntradaData, setNovaEntradaData] = useState({
    gruaId: '',
    funcionarioId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'checklist',
    status: 'ok',
    descricao: '',
    responsavelResolucao: '',
    observacoes: ''
  })
  
  // Estas variáveis serão definidas dentro do return principal
  
  // Função para abrir modal de nova entrada
  const handleNovaEntrada = () => {
    setEntradaSelecionada(null)
    setIsNovaEntradaOpen(true)
  }

  const handleVisualizarEntrada = (entrada: any) => {
    setEntradaSelecionada(entrada)
    setIsVisualizarEntradaOpen(true)
  }

  const handleExportarEntradas = async () => {
    if (!gruasReais.length) return
    
    try {
      // Exportar para cada grua vinculada
      for (const grua of gruasReais) {
        await livroGruaApi.baixarCSV(grua.id.toString())
      }
      
      toast({
        title: "Informação",
        description: "Arquivos CSV baixados com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao exportar entradas",
        variant: "default"
      })
    }
  }

  const handleImprimirEntradas = () => {
    window.print()
  }

  // Handlers Checklist Diários
  const handleNovoChecklist = (gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(null)
    setIsNovoChecklistOpen(true)
  }

  const handleEditarChecklist = (checklist: any, gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(checklist)
    setIsEditarChecklistOpen(true)
  }

  const handleVisualizarChecklist = (checklist: any) => {
    setChecklistSelecionado(checklist)
    setIsVisualizarChecklistOpen(true)
  }

  const handleExcluirChecklist = async (checklist: any) => {
    if (!checklist.id) return

    if (confirm(`Tem certeza que deseja excluir este checklist?`)) {
      try {
        await livroGruaApi.excluirEntrada(checklist.id)
        toast({
          title: "Sucesso",
          description: "Checklist excluído com sucesso"
        })
        window.location.reload()
      } catch (err) {
        console.error('Erro ao excluir checklist:', err)
        toast({
          title: "Erro",
          description: "Erro ao excluir checklist",
          variant: "destructive"
        })
      }
    }
  }

  const handleSucessoChecklist = () => {
    setIsNovoChecklistOpen(false)
    setIsEditarChecklistOpen(false)
    window.location.reload()
  }

  // Handlers Manutenções
  const handleNovaManutencao = (gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(null)
    setIsNovaManutencaoOpen(true)
  }

  const handleEditarManutencao = (manutencao: any, gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(manutencao)
    setIsEditarManutencaoOpen(true)
  }

  const handleVisualizarManutencao = (manutencao: any) => {
    setManutencaoSelecionada(manutencao)
    setIsVisualizarManutencaoOpen(true)
  }

  const handleExcluirManutencao = async (manutencao: any) => {
    if (!manutencao.id) return

    if (confirm(`Tem certeza que deseja excluir esta manutenção?`)) {
      try {
        await livroGruaApi.excluirEntrada(manutencao.id)
        toast({
          title: "Sucesso",
          description: "Manutenção excluída com sucesso"
        })
        window.location.reload()
      } catch (err) {
        console.error('Erro ao excluir manutenção:', err)
        toast({
          title: "Erro",
          description: "Erro ao excluir manutenção",
          variant: "destructive"
        })
      }
    }
  }

  const handleSucessoManutencao = () => {
    setIsNovaManutencaoOpen(false)
    setIsEditarManutencaoOpen(false)
    window.location.reload()
  }

  const handleNovoArquivo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return
    if (!novoArquivoData.arquivo) {
      toast({
        title: "Informação",
        description: "Por favor, selecione um arquivo",
        variant: "default"
      })
      return
    }

    try {
      const dadosArquivo: ArquivoCreate = {
        obra_id: parseInt(obra.id),
        nome_original: novoArquivoData.arquivo.name,
        descricao: novoArquivoData.descricao,
        categoria: novoArquivoData.categoria as any,
        arquivo: novoArquivoData.arquivo
      }

      await obrasArquivosApi.upload(dadosArquivo)
      await carregarArquivos()
      
      setNovoArquivoData({
        nome: '',
        descricao: '',
        categoria: 'geral',
        arquivo: null
      })
      setIsNovoArquivoOpen(false)
      toast({
        title: "Informação",
        description: "Arquivo adicionado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao adicionar arquivo",
        variant: "default"
      })
    }
  }

  const handleRemoverArquivo = async (arquivoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return

    try {
      await obrasArquivosApi.excluir(arquivoId)
      await carregarArquivos()
      toast({
        title: "Informação",
        description: "Arquivo excluído com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao excluir arquivo",
        variant: "default"
      })
    }
  }

  const formatarTamanhoArquivo = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleNovoItem = (e: React.FormEvent) => {
    e.preventDefault()
    
    const novoItem = {
      id: Date.now().toString(),
      item: novoItemData.item,
      descricao: novoItemData.descricao,
      unidade: novoItemData.unidade,
      quantidadeOrcamento: novoItemData.quantidadeOrcamento,
      valorUnitario: novoItemData.valorUnitario,
      totalOrcamento: novoItemData.quantidadeOrcamento * novoItemData.valorUnitario,
      quantidadeAnterior: novoItemData.quantidadeAnterior,
      valorAnterior: novoItemData.valorAnterior,
      quantidadePeriodo: novoItemData.quantidadePeriodo,
      valorPeriodo: novoItemData.valorPeriodo,
      quantidadeAcumulada: novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo,
      valorAcumulado: novoItemData.valorAnterior + novoItemData.valorPeriodo,
      quantidadeSaldo: novoItemData.quantidadeOrcamento - (novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo),
      valorSaldo: (novoItemData.quantidadeOrcamento * novoItemData.valorUnitario) - (novoItemData.valorAnterior + novoItemData.valorPeriodo)
    }

    setItensContrato([...itensContrato, novoItem])
    setNovoItemData({
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      quantidadeAnterior: 0,
      valorAnterior: 0,
      quantidadePeriodo: 0,
      valorPeriodo: 0
    })
    setIsNovoItemOpen(false)
    toast({
        title: "Informação",
        description: "Item adicionado com sucesso!",
        variant: "default"
      })
  }

  const handleNovoAditivo = (e: React.FormEvent) => {
    e.preventDefault()
    
    const novoAditivo = {
      id: Date.now().toString(),
      item: novoItemData.item,
      descricao: novoItemData.descricao,
      unidade: novoItemData.unidade,
      quantidadeOrcamento: novoItemData.quantidadeOrcamento,
      valorUnitario: novoItemData.valorUnitario,
      totalOrcamento: novoItemData.quantidadeOrcamento * novoItemData.valorUnitario,
      quantidadeAnterior: novoItemData.quantidadeAnterior,
      valorAnterior: novoItemData.valorAnterior,
      quantidadePeriodo: novoItemData.quantidadePeriodo,
      valorPeriodo: novoItemData.valorPeriodo,
      quantidadeAcumulada: novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo,
      valorAcumulado: novoItemData.valorAnterior + novoItemData.valorPeriodo,
      quantidadeSaldo: novoItemData.quantidadeOrcamento - (novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo),
      valorSaldo: (novoItemData.quantidadeOrcamento * novoItemData.valorUnitario) - (novoItemData.valorAnterior + novoItemData.valorPeriodo)
    }

    setAditivos([...aditivos, novoAditivo])
    setNovoItemData({
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      quantidadeAnterior: 0,
      valorAnterior: 0,
      quantidadePeriodo: 0,
      valorPeriodo: 0
    })
    setIsNovoAditivoOpen(false)
    toast({
        title: "Informação",
        description: "Aditivo adicionado com sucesso!",
        variant: "default"
      })
  }

  // Funções para custos mensais
  const gerarMesesDisponiveis = () => {
    if (!obra) return []
    
    const mesesExistentes = getMesesDisponiveisDaAPI()
    const mesesDisponiveis: string[] = []
    
    // Gerar próximos 12 meses a partir do mês atual
    const hoje = new Date()
    for (let i = 0; i < 12; i++) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesStr = mes.toISOString().slice(0, 7)
      
      // Só adicionar se não existir ainda
      if (!mesesExistentes.includes(mesStr)) {
        mesesDisponiveis.push(mesStr)
      }
    }
    
    return mesesDisponiveis
  }

  // Função para extrair meses dos dados reais da API
  const getMesesDisponiveisDaAPI = () => {
    if (!custosMensais || custosMensais.length === 0) return []
    
    const meses = [...new Set(custosMensais.map(custo => custo.mes))]
    return meses.sort()
  }

  // Custos filtrados baseados no mês selecionado
  const custosFiltrados = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return []
    
    if (mesSelecionado === 'todos' || !mesSelecionado) {
      return custosMensais
    }
    
    return custosMensais.filter(custo => custo.mes === mesSelecionado)
  }, [custosMensais, mesSelecionado])

  const handleNovoMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!obra) return
    if (!novoMesData.mes) {
      toast({
        title: "Informação",
        description: "Selecione um mês válido!",
        variant: "default"
      })
      return
    }
    
    try {
      // Buscar o último mês com custos para replicar
      const mesesExistentes = await custosMensaisApi.obterMesesDisponiveis(parseInt(obra.id))
      if (mesesExistentes.length === 0) {
        toast({
        title: "Informação",
        description: "Não há custos anteriores para replicar. Crie primeiro os custos iniciais da obra.",
        variant: "default"
      })
        return
      }
      
      const ultimoMes = mesesExistentes[mesesExistentes.length - 1] as string
      
      await custosMensaisApi.replicar({
        obra_id: parseInt(obra.id),
        mes_origem: ultimoMes,
        mes_destino: novoMesData.mes
      })
      
      await carregarCustosMensais(obraId)
      setMesSelecionado(novoMesData.mes)
      setNovoMesData({ mes: '' })
      setIsNovoMesOpen(false)
      toast({
        title: "Informação",
        description: "Custos criados para ${formatarMes(novoMesData.mes)} com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao criar novo mês",
        variant: "default"
      })
    }
  }

  const handleAbrirNovoMes = async () => {
    if (!obra) return
    
    try {
      const mesesExistentes = await custosMensaisApi.obterMesesDisponiveis(parseInt(obra.id))
      const meses = custosMensaisApi.gerarProximosMeses(mesesExistentes as string[])
      setMesesDisponiveis(meses)
      setIsNovoMesOpen(true)
    } catch (error: any) {
      console.error('Erro ao obter meses disponíveis:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar meses disponíveis. Por favor, tente novamente.",
        variant: "destructive"
      })
      // Não abrir o diálogo se houver erro
    }
  }

  const handleDuplicarParaProximoMes = async () => {
    if (!obra) return
    
    try {
      const mesesExistentes = await custosMensaisApi.obterMesesDisponiveis(parseInt(obra.id))
      if (mesesExistentes.length === 0) {
        toast({
          title: "Informação",
          description: "Não há custos anteriores para duplicar. Crie primeiro os custos iniciais da obra.",
          variant: "default"
        })
        return
      }
      
      const ultimoMes = mesesExistentes[mesesExistentes.length - 1] as string
      const proximoMes = new Date(ultimoMes + '-01')
      proximoMes.setMonth(proximoMes.getMonth() + 1)
      const proximoMesStr = proximoMes.toISOString().slice(0, 7)
      
      await custosMensaisApi.replicar({
        obra_id: parseInt(obra.id),
        mes_origem: ultimoMes,
        mes_destino: proximoMesStr
      })
      
      await carregarCustosMensais(obraId)
      setMesSelecionado(proximoMesStr)
      toast({
        title: "Sucesso",
        description: `Custos duplicados para ${formatarMes(proximoMesStr)} com sucesso!`,
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao duplicar custos para o próximo mês",
        variant: "destructive"
      })
    }
  }

  const handleAtualizarQuantidade = async (custoId: number, novaQuantidade: number) => {
    try {
      await custosMensaisApi.atualizarQuantidadeRealizada(custoId, novaQuantidade)
      
      // Recarregar custos no store
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar quantidade",
        variant: "destructive"
      })
    }
  }

  const handleNovoCusto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return

    try {
      const dadosCusto: CustoMensalObraCreate = {
        obra_id: parseInt(obra.id),
        item: novoCustoData.item,
        descricao: novoCustoData.descricao,
        unidade: novoCustoData.unidade,
        quantidade_orcamento: novoCustoData.quantidade_orcamento,
        valor_unitario: novoCustoData.valor_unitario,
        mes: mesSelecionado || new Date().toISOString().slice(0, 7),
        quantidade_realizada: novoCustoData.quantidade_realizada,
        quantidade_acumulada: novoCustoData.quantidade_acumulada,
        valor_acumulado: novoCustoData.valor_acumulado,
        tipo: novoCustoData.tipo as 'contrato' | 'aditivo'
      }

      await custosMensaisApi.criarCustoObra(dadosCusto)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      // Resetar formulário
      setNovoCustoData({
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        quantidade_realizada: 0,
        quantidade_acumulada: 0,
        valor_acumulado: 0,
        tipo: 'contrato'
      })
      setIsNovoCustoOpen(false)
      toast({
        title: "Sucesso",
        description: "Custo criado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      // Tratamento específico para item duplicado
      if (error.response?.status === 409 || error.message?.includes('já existe')) {
        toast({
          title: "Item duplicado",
          description: `O item ${novoCustoData.item} já existe para esta obra no mês ${mesSelecionado ? formatarMes(mesSelecionado.split('-')[1]) + ' ' + mesSelecionado.split('-')[0] : 'selecionado'}. Use outro código ou edite o item existente.`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar custo",
          variant: "destructive"
        })
      }
    }
  }

  const handleEditarCusto = (custo: CustoMensalObra | any) => {
    setCustoSelecionado(custo)
    setNovoCustoData({
      item: custo.item,
      descricao: custo.descricao,
      unidade: custo.unidade,
      quantidade_orcamento: custo.quantidade_orcamento,
      valor_unitario: custo.valor_unitario,
      quantidade_realizada: custo.quantidade_realizada,
      quantidade_acumulada: custo.quantidade_acumulada,
      valor_acumulado: custo.valor_acumulado,
      tipo: custo.tipo
    })
    setIsEditandoCusto(true)
    setIsNovoCustoOpen(true)
  }

  const handleAtualizarCusto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!custoSelecionado) return

    try {
      const dadosAtualizacao: CustoMensalObraUpdate = {
        item: novoCustoData.item,
        descricao: novoCustoData.descricao,
        unidade: novoCustoData.unidade,
        quantidade_orcamento: novoCustoData.quantidade_orcamento,
        valor_unitario: novoCustoData.valor_unitario,
        quantidade_realizada: novoCustoData.quantidade_realizada,
        quantidade_acumulada: novoCustoData.quantidade_acumulada,
        valor_acumulado: novoCustoData.valor_acumulado,
        tipo: novoCustoData.tipo as 'contrato' | 'aditivo'
      }
      await custosMensaisApi.atualizarCustoObra(custoSelecionado.id, dadosAtualizacao)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      // Resetar formulário
      setCustoSelecionado(null)
      setNovoCustoData({
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        quantidade_realizada: 0,
        quantidade_acumulada: 0,
        valor_acumulado: 0,
        tipo: 'contrato'
      })
      setIsEditandoCusto(false)
      setIsNovoCustoOpen(false)
      toast({
        title: "Informação",
        description: "Custo atualizado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao atualizar custo",
        variant: "default"
      })
    }
  }

  const handleExcluirCusto = async (custoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return

    try {
      await custosMensaisApi.excluir(custoId)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      toast({
        title: "Informação",
        description: "Custo excluído com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao excluir custo",
        variant: "default"
      })
    }
  }

  // Funções para custos iniciais
  const handleAbrirCustosIniciais = () => {
    const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
    setCustosIniciaisData({
      mes: mesAtual,
      custos: [{
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        tipo: 'contrato'
      }]
    })
    setIsCustosIniciaisOpen(true)
  }

  const handleAdicionarCustoInicial = () => {
    setCustosIniciaisData(prev => ({
      ...prev,
      custos: [...prev.custos, {
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        tipo: 'contrato'
      }]
    }))
  }

  const handleRemoverCustoInicial = (index: number) => {
    if (custosIniciaisData.custos.length > 1) {
      setCustosIniciaisData(prev => ({
        ...prev,
        custos: prev.custos.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAtualizarCustoInicial = (index: number, campo: string, valor: any) => {
    setCustosIniciaisData(prev => ({
      ...prev,
      custos: prev.custos.map((custo, i) => 
        i === index ? { ...custo, [campo]: valor } : custo
      )
    }))
  }

  const handleCriarCustosIniciais = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return

    try {
      // Validar dados
      const custosValidos = custosIniciaisData.custos.filter(custo => 
        custo.item && custo.descricao && custo.quantidade_orcamento > 0 && custo.valor_unitario > 0
      )

      if (custosValidos.length === 0) {
        toast({
        title: "Informação",
        description: "Adicione pelo menos um custo válido!",
        variant: "default"
      })
        return
      }

      // Criar cada custo
      for (const custo of custosValidos) {
        const dadosCusto: CustoMensalObraCreate = {
          obra_id: parseInt(obra.id),
          item: custo.item,
          descricao: custo.descricao,
          unidade: custo.unidade,
          quantidade_orcamento: custo.quantidade_orcamento,
          valor_unitario: custo.valor_unitario,
          mes: custosIniciaisData.mes,
          quantidade_realizada: 0,
          quantidade_acumulada: 0,
          valor_acumulado: 0,
          tipo: custo.tipo as 'contrato' | 'aditivo'
        }

        await custosMensaisApi.criarCustoObra(dadosCusto)
      }

      await carregarCustosMensais(obraId)
      setMesSelecionado(custosIniciaisData.mes)
      setIsCustosIniciaisOpen(false)
      toast({
        title: "Informação",
        description: "${custosValidos.length} custos iniciais criados com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Informação",
        description: "Erro ao criar custos iniciais",
        variant: "default"
      })
    }
  }

  // Funções para adicionar grua
  const handleAdicionarGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (gruasSelecionadas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma grua para adicionar",
        variant: "destructive"
      })
      return
    }

    try {
      setLoadingGruas(true)
      
      // Vincular cada grua selecionada à obra
      const promises = gruasSelecionadas.map(async (grua) => {
        const payload = {
          obra_id: parseInt(obraId),
          grua_id: grua.id,
          data_instalacao: novaGruaData.dataInicioLocacao || new Date().toISOString().split('T')[0],
          observacoes: novaGruaData.observacoes || `Valor locação: R$ ${grua.valorLocacao || 0}, Taxa mensal: R$ ${grua.taxaMensal || 0}`
        }
        
        return obraGruasApi.adicionarGruaObra(payload)
      })
      
      const results = await Promise.all(promises)
      
      // Verificar se todas as operações foram bem-sucedidas
      const sucessos = results.filter(result => result.success).length
      const falhas = results.length - sucessos
      
      if (sucessos > 0) {
        toast({
          title: "Sucesso",
          description: `${sucessos} grua(s) adicionada(s) à obra com sucesso!${falhas > 0 ? ` (${falhas} falharam)` : ''}`,
        })
      }
      
      if (falhas > 0) {
        toast({
          title: "Atenção",
          description: `${falhas} grua(s) não puderam ser adicionadas. Verifique se já estão vinculadas à obra.`,
          variant: "destructive"
        })
      }
      
      // Fechar modal e limpar dados
      setIsAdicionarGruaOpen(false)
      setGruasSelecionadas([])
      setNovaGruaData({
        dataInicioLocacao: '',
        dataFimLocacao: '',
        observacoes: ''
      })
      
      // Recarregar gruas vinculadas
      await carregarGruasVinculadas()
      
      // Recarregar a obra para atualizar os dados
      await carregarObra(obraId)
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar gruas à obra",
        variant: "destructive"
      })
    } finally {
      setLoadingGruas(false)
    }
  }

  const handleCancelarAdicionarGrua = () => {
    setIsAdicionarGruaOpen(false)
    setGruasSelecionadas([])
    setNovaGruaData({
      dataInicioLocacao: '',
      dataFimLocacao: '',
      observacoes: ''
    })
  }

  const handleGruaSelect = (grua: any) => {
    if (!gruasSelecionadas.find(g => g.id === grua.id)) {
      setGruasSelecionadas([...gruasSelecionadas, {
        ...grua,
        valorLocacao: 0,
        taxaMensal: 0
      }])
    }
  }

  const handleRemoverGrua = (gruaId: string) => {
    setGruasSelecionadas(gruasSelecionadas.filter(g => g.id !== gruaId))
  }

  // Função auxiliar para verificar se é supervisor
  const isSupervisor = (funcionario: any): boolean => {
    return funcionario.isSupervisor === true || 
           funcionario.isSupervisor === 'true' || 
           funcionario.isSupervisor === 1 ||
           funcionario.isSupervisor === '1'
  }

  // Funções para gerenciar funcionários
  const carregarFuncionariosVinculados = async () => {
    if (!obra) return
    
    try {
      setLoadingFuncionarios(true)
      
      const response = await obrasApi.buscarFuncionariosVinculados(parseInt(obra.id))
      
      if (response.success && response.data) {
        // Debug: verificar dados recebidos
        console.log('🔍 DEBUG - Funcionários carregados:', response.data.map((f: any) => ({
          id: f.id,
          name: f.name,
          isSupervisor: f.isSupervisor,
          isSupervisorType: typeof f.isSupervisor,
          isSupervisorCheck: isSupervisor(f),
          role: f.role
        })))
        setFuncionariosVinculados(response.data)
      } else {
        setFuncionariosVinculados([])
      }
    } catch (err) {
      console.error('❌ Erro ao carregar funcionários:', err)
      setFuncionariosVinculados([])
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const handleAdicionarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (funcionariosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um funcionário para adicionar",
        variant: "destructive"
      })
      return
    }

    try {
      setLoadingFuncionarios(true)
      
      // Adicionar cada funcionário selecionado à obra
      const promises = funcionariosSelecionados.map(async (funcionario) => {
        const isSupervisor = funcionario.isSupervisor === true
        const payload = {
          funcionario_id: funcionario.id,
          obra_id: parseInt(obraId),
          data_inicio: novoFuncionarioData.dataInicio || new Date().toISOString().split('T')[0],
          data_fim: novoFuncionarioData.dataFim || undefined,
          is_supervisor: isSupervisor,
          observacoes: novoFuncionarioData.observacoes || (isSupervisor 
            ? `Supervisor ${funcionario.name} adicionado à obra ${obra?.name || 'obra'}`
            : `Funcionário ${funcionario.name} adicionado à obra ${obra?.name || 'obra'}`)
        }
        
        // Debug: verificar payload
        console.log('🔍 DEBUG - Payload ao adicionar funcionário:', {
          funcionario: funcionario.name,
          isSupervisor: funcionario.isSupervisor,
          is_supervisor: payload.is_supervisor,
          payload_completo: payload
        })
        
        return createFuncionarioObra(payload)
      })
      
      const results = await Promise.all(promises)
      
      // Verificar se todas as operações foram bem-sucedidas
      const sucessos = results.filter(result => result.success).length
      const falhas = results.length - sucessos
      
      if (sucessos > 0) {
        toast({
          title: "Sucesso",
          description: `${sucessos} funcionário(s) adicionado(s) à obra com sucesso!${falhas > 0 ? ` (${falhas} falharam)` : ''}`,
        })
      }
      
      if (falhas > 0) {
        toast({
          title: "Atenção",
          description: `${falhas} funcionário(s) não puderam ser adicionados. Verifique se já estão vinculados à obra.`,
          variant: "destructive"
        })
      }
      
      // Fechar modal e limpar dados
      setIsAdicionarFuncionarioOpen(false)
      setFuncionariosSelecionados([])
      setNovoFuncionarioData({
        dataInicio: '',
        dataFim: '',
        observacoes: ''
      })
      
      // Recarregar funcionários vinculados
      await carregarFuncionariosVinculados()
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar funcionários à obra",
        variant: "destructive"
      })
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const handleCancelarAdicionarFuncionario = () => {
    setIsAdicionarFuncionarioOpen(false)
    setFuncionariosSelecionados([])
    setNovoFuncionarioData({
      dataInicio: '',
      dataFim: '',
      observacoes: ''
    })
  }

  const handleFuncionarioSelect = (funcionario: any) => {
    if (!funcionariosSelecionados.find(f => f.id === funcionario.id)) {
      // Usar eh_supervisor do funcionário se existir, senão false
      const isSupervisor = funcionario.eh_supervisor === true || 
                          funcionario.eh_supervisor === 'true' || 
                          funcionario.eh_supervisor === 1 ||
                          funcionario.isSupervisor === true
      
      // Debug: verificar valores
      console.log('🔍 DEBUG - Selecionando funcionário:', {
        id: funcionario.id,
        name: funcionario.name,
        eh_supervisor: funcionario.eh_supervisor,
        eh_supervisor_type: typeof funcionario.eh_supervisor,
        isSupervisor_calculado: isSupervisor
      })
      
      setFuncionariosSelecionados([...funcionariosSelecionados, { ...funcionario, isSupervisor }])
    }
  }

  const handleToggleSupervisor = (funcionarioId: string) => {
    setFuncionariosSelecionados(funcionariosSelecionados.map(f => 
      f.id === funcionarioId ? { ...f, isSupervisor: !f.isSupervisor } : f
    ))
  }

  const handleRemoverFuncionario = (funcionarioId: string) => {
    setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== funcionarioId))
  }

  // Funções para supervisores
  const handleSupervisorSelect = (supervisor: any) => {
    if (!supervisoresSelecionados.find(f => f.id === supervisor.id)) {
      // Supervisores sempre são marcados como supervisor
      setSupervisoresSelecionados([...supervisoresSelecionados, { ...supervisor, isSupervisor: true }])
    }
  }

  const handleRemoverSupervisor = (supervisorId: string) => {
    setSupervisoresSelecionados(supervisoresSelecionados.filter(f => f.id !== supervisorId))
  }

  // Buscar supervisores para o modal (filtra apenas supervisores)
  const buscarSupervisores = async (searchTerm: string = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setSupervisoresDisponiveis([])
      return
    }

    setLoadingSupervisoresSearch(true)
    try {
      const response = await funcionariosApi.buscarFuncionarios(searchTerm, {
        status: 'Ativo'
      })

      if (response.success && response.data) {
        // Filtrar apenas supervisores (eh_supervisor = true ou cargo de supervisor)
        const supervisoresFiltrados = response.data.filter((f: any) => {
          const ehSupervisor = f.eh_supervisor === true || 
                              f.eh_supervisor === 'true' || 
                              f.eh_supervisor === 1 ||
                              f.cargo_info?.nivel === 'Supervisor' ||
                              f.cargo_info?.nome?.toLowerCase().includes('supervisor') ||
                              f.cargo?.toLowerCase().includes('supervisor')
          
          if (!ehSupervisor) return false
          
          // Filtrar supervisores já vinculados à obra
          const supervisoresVinculadosIds = funcionariosVinculados
            .filter((func: any) => isSupervisor(func))
            .map((func: any) => {
              // Tentar diferentes campos possíveis
              return func.funcionarioId || 
                     func.funcionario_id || 
                     func.userId || 
                     parseInt(func.id)
            })
          
          return !supervisoresVinculadosIds.includes(f.id) &&
                 !supervisoresSelecionados.find((sel: any) => sel.id === f.id)
        })
        
        // Converter para formato esperado
        const supervisoresFormatados = supervisoresFiltrados.map((f: any) => ({
          id: f.id,
          name: f.nome,
          role: f.cargo_info?.nome || f.cargo || 'Cargo não informado',
          email: f.email,
          telefone: f.telefone,
          eh_supervisor: true
        }))
        
        setSupervisoresDisponiveis(supervisoresFormatados)
      } else {
        setSupervisoresDisponiveis([])
      }
    } catch (error) {
      console.error('Erro ao buscar supervisores:', error)
      setSupervisoresDisponiveis([])
    } finally {
      setLoadingSupervisoresSearch(false)
    }
  }

  const handleAdicionarSupervisor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (supervisoresSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um supervisor para adicionar",
        variant: "destructive"
      })
      return
    }

    try {
      setLoadingFuncionarios(true)
      
      // Adicionar cada supervisor selecionado à obra (sempre como supervisor)
      const promises = supervisoresSelecionados.map(async (supervisor) => {
        const payload = {
          funcionario_id: supervisor.id,
          obra_id: parseInt(obraId),
          data_inicio: novoSupervisorData.dataInicio || new Date().toISOString().split('T')[0],
          data_fim: novoSupervisorData.dataFim || undefined,
          is_supervisor: true, // Sempre true para supervisores
          observacoes: novoSupervisorData.observacoes || `Supervisor ${supervisor.name} adicionado à obra ${obra?.name || 'obra'}`
        }
        
        return createFuncionarioObra(payload)
      })
      
      const results = await Promise.all(promises)
      
      // Verificar se todas as operações foram bem-sucedidas
      const sucessos = results.filter(result => result.success).length
      const falhas = results.length - sucessos
      
      if (sucessos > 0) {
        toast({
          title: "Sucesso",
          description: `${sucessos} supervisor(es) adicionado(s) à obra com sucesso!${falhas > 0 ? ` (${falhas} falharam)` : ''}`,
        })
      }
      
      if (falhas > 0) {
        toast({
          title: "Atenção",
          description: `${falhas} supervisor(es) não puderam ser adicionados. Verifique se já estão vinculados à obra.`,
          variant: "destructive"
        })
      }
      
      // Fechar modal e limpar dados
      setIsAdicionarSupervisorOpen(false)
      setSupervisoresSelecionados([])
      setNovoSupervisorData({
        dataInicio: '',
        dataFim: '',
        observacoes: ''
      })
      
      // Recarregar funcionários vinculados
      await carregarFuncionariosVinculados()
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar supervisores à obra",
        variant: "destructive"
      })
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const handleCancelarAdicionarSupervisor = () => {
    setIsAdicionarSupervisorOpen(false)
    setSupervisoresSelecionados([])
    setNovoSupervisorData({
      dataInicio: '',
      dataFim: '',
      observacoes: ''
    })
  }

  // Buscar funcionários para o modal
  const buscarFuncionarios = async (searchTerm: string = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setFuncionariosDisponiveis([])
      return
    }

    setLoadingFuncionariosSearch(true)
    try {
      const response = await funcionariosApi.buscarFuncionarios(searchTerm, {
        status: 'Ativo'
      })

      if (response.success && response.data) {
        // Filtrar funcionários já vinculados à obra
        const funcionariosVinculadosIds = funcionariosVinculados.map(f => f.funcionario_id || f.id)
        const funcionariosFiltrados = response.data.filter((f: any) => 
          !funcionariosVinculadosIds.includes(f.id) &&
          !funcionariosSelecionados.find(sel => sel.id === f.id)
        )
        
        // Converter para formato esperado
        const funcionariosFormatados = funcionariosFiltrados.map((f: any) => ({
          id: f.id,
          name: f.nome,
          role: f.cargo_info?.nome || f.cargo || 'Cargo não informado',
          email: f.email,
          telefone: f.telefone,
          eh_supervisor: f.eh_supervisor === true || f.eh_supervisor === 'true' || f.eh_supervisor === 1
        }))
        
        setFuncionariosDisponiveis(funcionariosFormatados)
      } else {
        setFuncionariosDisponiveis([])
      }
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error)
      setFuncionariosDisponiveis([])
    } finally {
      setLoadingFuncionariosSearch(false)
    }
  }

  // Debounce para busca de funcionários
  useEffect(() => {
    if (!isAdicionarFuncionarioOpen) {
      setFuncionarioSearchValue('')
      setFuncionariosDisponiveis([])
      return
    }

    const timeoutId = setTimeout(() => {
      buscarFuncionarios(funcionarioSearchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [funcionarioSearchValue, isAdicionarFuncionarioOpen, funcionariosVinculados, funcionariosSelecionados])

  // Debounce para busca de supervisores
  useEffect(() => {
    if (!isAdicionarSupervisorOpen) {
      setSupervisorSearchValue('')
      setSupervisoresDisponiveis([])
      return
    }

    const timeoutId = setTimeout(() => {
      buscarSupervisores(supervisorSearchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorSearchValue, isAdicionarSupervisorOpen, funcionariosVinculados, supervisoresSelecionados])

  const handleRemoverFuncionarioVinculado = async (funcionarioId: string) => {
    try {
      setLoadingFuncionarios(true)
      
      const response = await deleteFuncionarioObra(parseInt(funcionarioId))
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário removido da obra com sucesso!",
        })
        
        // Recarregar funcionários vinculados
        await carregarFuncionariosVinculados()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover funcionário da obra",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover funcionário da obra",
        variant: "destructive"
      })
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const handleAtualizarGrua = (gruaId: string, campo: string, valor: number) => {
    setGruasSelecionadas(gruasSelecionadas.map(g => 
      g.id === gruaId ? { ...g, [campo]: valor } : g
    ))
  }

  const calcularResumo = () => {
    const totalGruas = gruasSelecionadas.length
    const valorTotalLocacao = gruasSelecionadas.reduce((sum, g) => sum + (g.valorLocacao || 0), 0)
    const taxaMensalTotal = gruasSelecionadas.reduce((sum, g) => sum + (g.taxaMensal || 0), 0)
    
    return {
      totalGruas,
      valorTotalLocacao,
      taxaMensalTotal
    }
  }

  // Função carregarCustosMensais agora está no store

  const handleExportarCustos = (tipo: 'geral' | 'mes') => {
    if (!obra) return
    
    let dadosParaExportar = custosMensais
    
    if (dadosParaExportar.length === 0) {
      toast({
        title: "Informação",
        description: "Não há dados para exportar!",
        variant: "default"
      })
      return
    }

    // Cabeçalho do CSV
    const cabecalho = [
      'Item',
      'Descrição',
      'Unidade',
      'Qtd Orçamento',
      'Valor Unitário',
      'Total Orçamento',
      'Qtd Realizada',
      'Valor Realizado',
      'Qtd Acumulada',
      'Valor Acumulado',
      'Qtd Saldo',
      'Valor Saldo',
      'Mês',
      'Tipo'
    ]

    // Dados do CSV
    const linhas = dadosParaExportar.map(custo => [
      custo.item,
      custo.descricao,
      custo.unidade,
      formatarQuantidade(custo.quantidade_orcamento),
      formatarValor(custo.valor_unitario),
      formatarValor(custo.total_orcamento),
      formatarQuantidade(custo.quantidade_realizada),
      formatarValor(custo.valor_realizado),
      formatarQuantidade(custo.quantidade_acumulada),
      formatarValor(custo.valor_acumulado),
      formatarQuantidade(custo.quantidade_saldo),
      formatarValor(custo.valor_saldo),
      formatarMes(custo.mes),
      custo.tipo
    ])

    // Criar CSV
    const csvContent = [cabecalho, ...linhas]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const nomeArquivo = tipo === 'geral' 
      ? `custos_geral_${obra.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      : `custos_${mesSelecionado}_${obra.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    
    link.setAttribute('download', nomeArquivo)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
        title: "Informação",
        description: "Arquivo ${nomeArquivo} baixado com sucesso!",
        variant: "default"
      })
  }

  // Função carregarObra agora está no store

  // Carregar gruas vinculadas à obra
  const carregarGruasVinculadas = async () => {
    if (!obra) return
    
    try {
      setLoadingGruas(true)
      
      // Usar grua_obra como fonte única de verdade
      const response = await obrasApi.buscarGruasVinculadas(parseInt(obra.id))
      
      if (response.success && response.data) {
        const gruasVinculadas = response.data
        
        if (gruasVinculadas.length > 0) {
          // Converter dados das gruas vinculadas de grua_obra
          // Os dados já vêm convertidos de buscarGruasVinculadas, mas precisamos ajustar para o formato esperado
          const gruasConvertidas = gruasVinculadas.map((relacao: any, index: number) => {
            const gruaData = relacao.grua || {}
            
            // Converter status de 'ativa'/'concluida'/'suspensa' para 'Ativa'/'Concluída'/'Suspensa'
            const statusLegacy = relacao.status === 'ativa' ? 'Ativa' : 
                                relacao.status === 'concluida' ? 'Concluída' : 
                                relacao.status === 'suspensa' ? 'Suspensa' : 'Ativa'
            
            const fabricante = (gruaData.manufacturer || gruaData.fabricante || '').trim()
            const modelo = (gruaData.model || gruaData.modelo || '').trim()
            const nomeGrua = (gruaData.name || '').trim()
            
            // Construir nome da grua de forma segura
            let nameFinal = nomeGrua
            if (!nameFinal || nameFinal.toLowerCase().includes('fabricante') || nameFinal.toLowerCase().includes('modelo')) {
              // Se o nome contém palavras-chave estranhas, construir um novo
              if (fabricante && modelo) {
                nameFinal = `${fabricante} ${modelo}`
              } else if (fabricante) {
                nameFinal = fabricante
              } else if (modelo) {
                nameFinal = modelo
              } else {
                nameFinal = `Grua ${relacao.gruaId || relacao.grua?.id || 'N/A'}`
              }
            }
            
            const gruaConvertida = {
              id: relacao.gruaId || relacao.grua?.id || '',
              relacaoId: relacao.id, // ID da relação grua_obra
              name: nameFinal,
              modelo: modelo || 'Modelo não informado',
              fabricante: fabricante || 'Fabricante não informado',
              tipo: gruaData.type || gruaData.tipo || 'Tipo não informado',
              capacidade: gruaData.capacity || gruaData.capacidade || 'Capacidade não informada',
              status: statusLegacy,
              data_instalacao: relacao.dataInicioLocacao || relacao.data_inicio_locacao,
              data_inicio_locacao: relacao.dataInicioLocacao || relacao.data_inicio_locacao,
              dataFimLocacao: relacao.dataFimLocacao || relacao.data_fim_locacao,
              data_fim_locacao: relacao.dataFimLocacao || relacao.data_fim_locacao,
              valor_locacao_mensal: relacao.valorLocacaoMensal || relacao.valor_locacao_mensal || 0,
              valorLocacaoMensal: relacao.valorLocacaoMensal || relacao.valor_locacao_mensal || 0,
              observacoes: relacao.observacoes || '',
              // Campos adicionais para compatibilidade
              status_legacy: statusLegacy,
              // Dados da grua para exibição
              grua: {
                id: relacao.gruaId || relacao.grua?.id || '',
                modelo: gruaData.model || gruaData.modelo,
                fabricante: gruaData.manufacturer || gruaData.fabricante,
                tipo: gruaData.type || gruaData.tipo
              }
            }
            
            return gruaConvertida
          })
          
          // Opcionalmente, buscar dados técnicos de obra_gruas_configuracao para enriquecimento
          try {
            const configResponse = await obraGruasApi.listarGruasObra(parseInt(obra.id))
            if (configResponse.success && configResponse.data && configResponse.data.length > 0) {
              // Enriquecer gruas com dados técnicos quando disponível
              gruasConvertidas.forEach((grua: any) => {
                const configTecnica = configResponse.data.find((c: any) => c.grua_id === grua.id)
                if (configTecnica) {
                  grua.configId = configTecnica.id
                  grua.posicao_x = configTecnica.posicao_x
                  grua.posicao_y = configTecnica.posicao_y
                  grua.angulo_rotacao = configTecnica.angulo_rotacao
                  grua.alcance_operacao = configTecnica.alcance_operacao
                  grua.area_cobertura = configTecnica.area_cobertura
                }
              })
            }
          } catch (configError) {
            // Não é crítico, continuar sem dados técnicos
          }
          setGruasReais(gruasConvertidas)
        } else {
          setGruasReais([])
        }
      } else {
        setGruasReais([])
      }
    } catch (err) {
      console.error('❌ Erro ao carregar gruas:', err)
      setGruasReais([])
    } finally {
      setLoadingGruas(false)
    }
  }

  // Carregar documentos da obra
  // Função movida para o store
  const carregarDocumentosLocal = async () => {
    if (!obra) return
    
    try {
      setLoadingDocumentos(true)
      const response = await obrasDocumentosApi.listarPorObra(parseInt(obra.id))
      setDocumentos(Array.isArray(response.data) ? response.data : [response.data])
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error)
      setDocumentos([])
    } finally {
      setLoadingDocumentos(false)
    }
  }

  // Carregar arquivos da obra
  // Função movida para o store
  const carregarArquivosLocal = async () => {
    if (!obra) return
    
    try {
      setLoadingArquivos(true)
      const response = await obrasArquivosApi.listarPorObra(parseInt(obra.id))
      setArquivos(Array.isArray(response.data) ? response.data : [response.data])
    } catch (error: any) {
      setArquivos([])
    } finally {
      setLoadingArquivos(false)
    }
  }

  // Handlers para livro da grua
  const handleEditarEntrada = (entrada: EntradaLivroGruaCompleta) => {
    setEntradaSelecionada(entrada)
    setIsEditarEntradaOpen(true)
  }

  const handleSucessoEntrada = () => {
    setIsNovaEntradaOpen(false)
    setIsEditarEntradaOpen(false)
    // Recarregar a página para atualizar os dados
    window.location.reload()
  }

  // Carregar funcionários e clientes para assinantes
  useEffect(() => {
    const carregarAssinantes = async () => {
      try {
        // Carregar funcionários
        const funcionariosResponse = await funcionariosApi.listarFuncionarios({ limit: 100 })
        setFuncionarios(funcionariosResponse.data || [])
        
        // Carregar clientes
        const clientesResponse = await clientesApi.listarClientes({ limit: 100 })
        const clientesData = clientesResponse.data as any
        setClientes(Array.isArray(clientesData) ? clientesData : (Array.isArray(clientesData?.data) ? clientesData.data : []))
      } catch (error) {
        console.error('Erro ao carregar assinantes:', error)
      }
    }
    
    if (isNovoDocumentoOpen) {
      carregarAssinantes()
    }
  }, [isNovoDocumentoOpen])
  
  // Buscar assinantes dinamicamente
  const buscarAssinantes = async (termo: string) => {
    if (!tipoAssinante || !termo.trim()) {
      setAssinantesFiltrados([])
      return
    }

    try {
      let response
      if (tipoAssinante === 'interno') {
        response = await api.get(`/funcionarios?search=${encodeURIComponent(termo)}&limit=50`)
      } else if (tipoAssinante === 'cliente') {
        response = await api.get(`/clientes?search=${encodeURIComponent(termo)}&limit=50`)
      }
      
      if (response?.data?.data) {
        setAssinantesFiltrados(response.data.data)
      }
    } catch (error) {
      console.error('Erro na busca de assinantes:', error)
      setAssinantesFiltrados([])
    }
  }

  // Debounce para busca de assinantes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarAssinantes(assinanteFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [assinanteFilter, tipoAssinante])
  
  // Função para criar documento
  const handleCriarDocumento = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoDocumentoData.arquivo) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para upload",
        variant: "destructive"
      })
      return
    }
    
    if (documentoAssinantes.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um assinante",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmittingDocumento(true)
    try {
      const dadosDocumento: DocumentoCreate = {
        titulo: novoDocumentoData.titulo,
        descricao: novoDocumentoData.descricao || undefined,
        arquivo: novoDocumentoData.arquivo,
        ordem_assinatura: documentoAssinantes.map(ass => ({
          user_id: parseInt(ass.userId),
          ordem: ass.ordem,
          tipo: ass.tipo,
          status: ass.status || 'pendente',
          docu_sign_link: ass.docuSignLink || undefined
        }))
      }
      
      const response = await obrasDocumentosApi.criar(parseInt(obraId), dadosDocumento)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso!",
          variant: "default"
        })
        
        // Limpar formulário
        setNovoDocumentoData({
          titulo: '',
          descricao: '',
          arquivo: null,
          linkAssinatura: ''
        })
        setDocumentoAssinantes([])
        setTipoAssinante('')
        setAssinanteFilter('')
        setAssinantesFiltrados([])
        setIsNovoDocumentoOpen(false)
        
        // Recarregar documentos
        await carregarDocumentos()
      } else {
        throw new Error(response.message || 'Erro ao criar documento')
      }
    } catch (error: any) {
      console.error('Erro ao criar documento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar documento",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingDocumento(false)
    }
  }
  
  // Funções para gerenciar assinantes
  const adicionarAssinante = () => {
    setDocumentoAssinantes([...documentoAssinantes, {
      userId: '',
      ordem: documentoAssinantes.length + 1,
      status: 'pendente',
      tipo: tipoAssinante as 'interno' | 'cliente'
    }])
  }
  
  const removerAssinante = (index: number) => {
    const novosAssinantes = documentoAssinantes.filter((_, i) => i !== index)
    const reordenados = novosAssinantes.map((a, i) => ({ ...a, ordem: i + 1 }))
    setDocumentoAssinantes(reordenados)
  }
  
  const atualizarAssinante = (index: number, field: string, value: any) => {
    const novosAssinantes = [...documentoAssinantes]
    novosAssinantes[index] = { ...novosAssinantes[index], [field]: value }
    setDocumentoAssinantes(novosAssinantes)
  }
  
  const moverAssinante = (index: number, direction: 'up' | 'down') => {
    const novosAssinantes = [...documentoAssinantes]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < novosAssinantes.length) {
      [novosAssinantes[index], novosAssinantes[targetIndex]] = [novosAssinantes[targetIndex], novosAssinantes[index]]
      const reordenados = novosAssinantes.map((a, i) => ({ ...a, ordem: i + 1 }))
      setDocumentoAssinantes(reordenados)
    }
  }

  // Verificar autenticação e carregar obra na inicialização
  useEffect(() => {
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      if (isAuth) {
        await carregarObra(obraId)
        
        // Carregar documentos e arquivos em paralelo
        await Promise.all([
          carregarDocumentos(),
          carregarArquivos()
        ])
      }
    }
    init()
  }, [obraId])

  // Carregar gruas quando a obra for carregada
  useEffect(() => {
    if (obra) {
      carregarGruasVinculadas()
    }
  }, [obra])

  // Carregar funcionários quando a obra for carregada
  useEffect(() => {
    if (obra) {
      carregarFuncionariosVinculados()
    }
  }, [obra])


  // Definir mês padrão após carregar custos
  useEffect(() => {
    if (custosMensais && custosMensais.length > 0) {
      // Obter todos os meses disponíveis e ordenar
      const mesesDisponiveis = [...new Set(custosMensais.map(custo => custo.mes))].sort()
      // Definir o último mês como padrão
      const ultimoMes = mesesDisponiveis[mesesDisponiveis.length - 1]
      setMesSelecionado(ultimoMes)
    }
  }, [custosMensais])

  // Carregar medições mensais quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'medicoes-mensais' && obra && !loadingMedicoes && medicoesMensais.length === 0) {
      carregarMedicoesMensais()
    }
  }, [activeTab, obra])

  // Carregar sinaleiros quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'sinaleiros' && obra && !loadingSinaleiros && sinaleiros.length === 0) {
      carregarSinaleiros()
    }
  }, [activeTab, obra])

  // Filtro de custos agora é feito via useMemo com custosFiltrados

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-green-100 text-green-800'
      case 'Pausada': return 'bg-yellow-100 text-yellow-800'
      case 'Concluída': return 'bg-blue-100 text-blue-800'
      case 'Planejamento': return 'bg-gray-100 text-gray-800'
      case 'Cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'em_assinatura': return 'bg-blue-100 text-blue-800'
      case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'aguardando': return 'bg-yellow-100 text-yellow-800'
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'pausada': return <Clock className="w-4 h-4" />
      case 'concluida': return <AlertTriangle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  // Cálculos memoizados para evitar re-renderizações desnecessárias
  const gastosMesPassado = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return 0
    
    // Obter todos os meses disponíveis e ordenar
    const mesesDisponiveis = [...new Set(custosMensais.map(custo => custo.mes))].sort()
    
    if (mesesDisponiveis.length < 2) return 0 // Precisa de pelo menos 2 meses
    
    // Pegar o penúltimo mês (mês passado)
    const mesPassado = mesesDisponiveis[mesesDisponiveis.length - 2]
    
    
    const gastos = custosMensais
      .filter(custo => custo.mes === mesPassado)
      .reduce((total, custo) => {
        const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
        return total + valor
      }, 0)
    
    return gastos
  }, [custosMensais])

  const gastosMesAtual = useMemo(() => {
    if (!custosFiltrados || custosFiltrados.length === 0) return 0
    
    const gastos = custosFiltrados
      .reduce((total, custo) => {
        const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
        return total + valor
      }, 0)
    
    
    return gastos
  }, [custosFiltrados, mesSelecionado])

  // Total de todos os custos (todos os meses)
  const totalTodosCustos = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return 0
    
    const total = custosMensais.reduce((sum, custo) => {
      const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
      return sum + valor
    }, 0)
    
    
    return total
  }, [custosMensais])

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando detalhes da obra..." />
      </div>
    )
  }

  if (error && !obra) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar obra</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => carregarObra(obraId)} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Se não estiver carregando e não tiver obra, mostrar loading infinito
  if (!loading && !obra) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando detalhes da obra..." />
      </div>
    )
  }

  // Definir variáveis que dependem de obra
  const gruasVinculadas = gruasReais.length > 0 ? gruasReais : (obra?.gruasVinculadas || [])
  // Usar custos que já vêm da API (store ou obra)
  const custos = custosMensais || []
  
  // Função auxiliar para nome da tab
  const getTabName = (tabValue: string): string => {
    const tabNames: Record<string, string> = {
      'geral': 'Geral',
      'gruas': 'Gruas',
      'funcionarios': 'Funcionários',
      'custos': 'Custos',
      'complementos': 'Complementos',
      'documentos': 'Documentos',
      'arquivos': 'Arquivos',
      'checklists': 'Checklists Diários',
      'manutencoes': 'Manutenções',
      'livro-grua': 'Livro da Grua'
    }
    return tabNames[tabValue] || tabValue
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{obra?.name || ''}</h1>
            <p className="text-gray-600">{obra?.description || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelarEdicao}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={salvarEdicao}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={iniciarEdicao}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Obra
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!obra?.id) {
                toast({
                  title: "Erro",
                  description: "Obra não encontrada",
                  variant: "destructive"
                })
                return
              }

              setNotificandoEnvolvidos(true)
              try {
                const resultado = await obrasApi.notificarEnvolvidos(parseInt(obra.id))

                if (resultado.success) {
                  if (resultado.enviados > 0) {
                    toast({
                      title: "Sucesso",
                      description: `Notificações enviadas: ${resultado.enviados} enviada(s)${resultado.erros && resultado.erros.length > 0 ? `, ${resultado.erros.length} erro(s)` : ''}`
                    })
                  } else {
                    toast({
                      title: "Atenção",
                      description: resultado.erros?.join(', ') || "Nenhum destinatário com WhatsApp cadastrado",
                      variant: "default"
                    })
                  }
                } else {
                  toast({
                    title: "Erro",
                    description: resultado.message || resultado.erros?.join(', ') || "Erro ao enviar notificações",
                    variant: "destructive"
                  })
                }
              } catch (error: any) {
                console.error('Erro ao notificar envolvidos:', error)
                toast({
                  title: "Erro",
                  description: error.message || "Erro ao enviar notificações",
                  variant: "destructive"
                })
              } finally {
                setNotificandoEnvolvidos(false)
              }
            }}
            disabled={notificandoEnvolvidos || !obra?.id}
          >
            {notificandoEnvolvidos ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Notificar Envolvidos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                // Aguardar um pouco para garantir que o DOM está atualizado
                await new Promise(resolve => setTimeout(resolve, 200))

                // Encontrar o conteúdo da tab ativa usando múltiplas estratégias
                let tabElement: HTMLElement | null = null

                // Estratégia 1: Buscar pelo TabsContent do Radix UI (mais confiável)
                // O Radix UI usa data-state e data-value nos TabsContent
                const allTabsContent = document.querySelectorAll('[role="tabpanel"], [data-radix-tabs-content]')
                allTabsContent.forEach((el) => {
                  const value = el.getAttribute('data-value') || el.getAttribute('value')
                  const state = el.getAttribute('data-state')
                  
                  if (value === activeTab || (state === 'active' && value === activeTab)) {
                    tabElement = el as HTMLElement
                  }
                })

                // Estratégia 2: Buscar diretamente pelo seletor de classe que contém o value
                if (!tabElement) {
                  // Tentar encontrar pelo seletor CSS que o Radix UI usa
                  const radixContent = document.querySelector(`[data-radix-tabs-content][value="${activeTab}"]`) as HTMLElement
                  if (radixContent) {
                    tabElement = radixContent
                  }
                }

                // Estratégia 3: Buscar pelo TabsContent com value
                if (!tabElement) {
                  const contentByValue = document.querySelector(`[data-value="${activeTab}"]`) as HTMLElement
                  if (contentByValue && contentByValue.classList.contains('space-y-4')) {
                    tabElement = contentByValue
                  }
                }

                // Estratégia 4: Buscar todos os TabsContent e verificar qual está visível
                if (!tabElement) {
                  const allContent = document.querySelectorAll('[class*="TabsContent"], [class*="space-y-4"]')
                  allContent.forEach((el) => {
                    const computedStyle = window.getComputedStyle(el)
                    if (computedStyle.display !== 'none' && el.getAttribute('data-value') === activeTab) {
                      tabElement = el as HTMLElement
                    }
                  })
                }

                if (!tabElement) {
                  throw new Error(`Conteúdo da tab "${getTabName(activeTab)}" não encontrado. Tente recarregar a página.`)
                }

                await exportTabToPDF(tabElement, {
                  titulo: `Relatório - ${obra?.name || 'Obra'}`,
                  subtitulo: `Aba: ${getTabName(activeTab)}`,
                  obraNome: obra?.name || 'Obra',
                  obraId: obra?.id?.toString() || '',
                  tabName: getTabName(activeTab)
                })

                toast({
                  title: "Sucesso",
                  description: "PDF exportado com sucesso"
                })
              } catch (error: any) {
                console.error('Erro ao exportar PDF:', error)
                toast({
                  title: "Erro",
                  description: error.message || "Erro ao exportar PDF",
                  variant: "destructive"
                })
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-9">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="gruas">Gruas</TabsTrigger>
        <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        <TabsTrigger value="sinaleiros">Sinaleiros</TabsTrigger>
        <TabsTrigger value="medicoes-mensais">
          Medições Mensais
        </TabsTrigger>
        <TabsTrigger value="documentos">Arquivos</TabsTrigger>
        <TabsTrigger value="livro-grua">
          Livro da Grua
        </TabsTrigger>
        <TabsTrigger value="checklists">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Checklists e Manutenções
        </TabsTrigger>
        <TabsTrigger value="complementos">Complementos</TabsTrigger>
      </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="flex flex-col gap-4 w-full" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm text-gray-600">Título:</Label>
                    {isEditing ? (
                      <Input
                        value={editingData.nome || ''}
                        onChange={(e) => setEditingData({ ...editingData, nome: e.target.value })}
                        placeholder="Título da obra"
                        className="mt-1"
                      />
                    ) : (
                      <span className="text-sm block mt-1 font-medium">{obra?.name || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Status:</Label>
                    {isEditing ? (
                      <Select
                        value={editingData.status || obra?.status || 'Em Andamento'}
                        onValueChange={(value) => setEditingData({ ...editingData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planejamento">Planejamento</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Pausada">Pausada</SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(obra?.status || 'Em Andamento')}>
                        {getStatusIcon(obra?.status || 'Em Andamento')}
                        <span className="ml-1 capitalize">{obra?.status || 'Em Andamento'}</span>
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Data de Início:</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editingData.data_inicio || ''}
                        onChange={(e) => setEditingData({ ...editingData, data_inicio: e.target.value })}
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.startDate ? new Date(obra.startDate).toLocaleDateString('pt-BR') : 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Data de Fim:</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editingData.data_fim || ''}
                        onChange={(e) => setEditingData({ ...editingData, data_fim: e.target.value })}
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Orçamento:</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.orcamento || ''}
                        onChange={(e) => setEditingData({ ...editingData, orcamento: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-sm block mt-1">
                        {obra?.budget ? (
                          <ValorMonetarioOculto valor={obra.budget} />
                        ) : (
                          'Não informado'
                        )}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Tipo:</Label>
                    {isEditing ? (
                      <Select
                        value={editingData.tipo || obra?.tipo || ''}
                        onValueChange={(value) => setEditingData({ ...editingData, tipo: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residencial">Residencial</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm block mt-1">{obra?.tipo || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Endereço:</Label>
                    {isEditing ? (
                      <Input
                        value={editingData.endereco || ''}
                        onChange={(e) => setEditingData({ ...editingData, endereco: e.target.value })}
                        placeholder="Endereço da obra"
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.endereco || obra?.location || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cidade:</Label>
                    {isEditing ? (
                      <Input
                        value={editingData.cidade || ''}
                        onChange={(e) => setEditingData({ ...editingData, cidade: e.target.value })}
                        placeholder="Cidade"
                        className="mt-1"
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.cidade || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Estado:</Label>
                    {isEditing ? (
                      <Select
                        value={editingData.estado || obra?.estado || ''}
                        onValueChange={(value) => setEditingData({ ...editingData, estado: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="AL">AL</SelectItem>
                          <SelectItem value="AP">AP</SelectItem>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="BA">BA</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                          <SelectItem value="DF">DF</SelectItem>
                          <SelectItem value="ES">ES</SelectItem>
                          <SelectItem value="GO">GO</SelectItem>
                          <SelectItem value="MA">MA</SelectItem>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="MS">MS</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                          <SelectItem value="PA">PA</SelectItem>
                          <SelectItem value="PB">PB</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="PE">PE</SelectItem>
                          <SelectItem value="PI">PI</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="RN">RN</SelectItem>
                          <SelectItem value="RS">RS</SelectItem>
                          <SelectItem value="RO">RO</SelectItem>
                          <SelectItem value="RR">RR</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="SE">SE</SelectItem>
                          <SelectItem value="TO">TO</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm block mt-1">{obra?.estado || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">CEP:</Label>
                    {isEditing ? (
                      <Input
                        value={editingData.cep || ''}
                        onChange={(e) => setEditingData({ ...editingData, cep: e.target.value })}
                        placeholder="00000-000"
                        className="mt-1"
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.cep || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Responsável:</Label>
                    {isEditing ? (
                      <div className="mt-1">
                        <FuncionarioSearch
                          onFuncionarioSelect={handleResponsavelSelect}
                          selectedFuncionario={responsavelSelecionado}
                          placeholder="Buscar responsável por nome ou cargo..."
                          onlyActive={true}
                          allowedRoles={['Engenheiro', 'Chefe de Obras', 'Supervisor', 'Gerente', 'Operador']}
                        />
                      </div>
                    ) : (
                      <span className="text-sm block mt-1">{obra?.responsavelName || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Descrição:</Label>
                    {isEditing ? (
                      <Textarea
                        value={editingData.descricao || ''}
                        onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                        placeholder="Descrição da obra"
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.description || 'Não informado'}</span>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div>
                    <Label className="text-sm text-gray-600">Observações:</Label>
                    <Textarea
                      value={editingData.observacoes || ''}
                      onChange={(e) => setEditingData({ ...editingData, observacoes: e.target.value })}
                      placeholder="Observações sobre a obra"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {obra?.cliente ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nome:</span>
                      <span className="text-sm font-medium">{obra.cliente.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CNPJ:</span>
                      <span className="text-sm">{obra.cliente.cnpj}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm">{obra.cliente.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <span className="text-sm">{obra.cliente.telefone}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Informações do cliente não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos Obrigatórios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CNO */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">CNO:</Label>
                  {isEditing ? (
                    <Input
                      value={editingData.cno || ''}
                      onChange={(e) => setEditingData({ ...editingData, cno: e.target.value })}
                      placeholder="Número do CNO"
                      className="mt-1"
                    />
                  ) : (
                    <span className="text-sm block mt-1">{obra?.cno || <span className="text-gray-400 italic">Não informado</span>}</span>
                  )}
                </div>

                {/* ART */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm font-medium text-gray-700">ART:</Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingData.art_numero || ''}
                        onChange={(e) => setEditingData({ ...editingData, art_numero: e.target.value })}
                        placeholder="Número da ART"
                        className="mt-1"
                      />
                      <DocumentoUpload
                        label="Upload do Documento ART (PDF)"
                        accept="application/pdf"
                        maxSize={10 * 1024 * 1024} // 10MB
                        onUpload={(file) => setArtArquivo(file)}
                        onRemove={() => setArtArquivo(null)}
                        currentFile={artArquivo}
                        fileUrl={obra?.art_arquivo || null}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mt-1">
                        {obra?.art_numero ? (
                          <span className="text-sm">{obra.art_numero}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Não informado</span>
                        )}
                      </div>
                      {obra?.art_arquivo && (
                        <div className="flex justify-end mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                // Gerar URL assinada usando o endpoint do backend
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.art_arquivo || '')}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  } else {
                                    throw new Error('URL não retornada')
                                  }
                                } else {
                                  throw new Error('Erro ao gerar URL')
                                }
                              } catch (error) {
                                console.error('Erro ao baixar ART:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo da ART",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar ART
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Apólice */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm font-medium text-gray-700">Apólice de Seguro:</Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingData.apolice_numero || ''}
                        onChange={(e) => setEditingData({ ...editingData, apolice_numero: e.target.value })}
                        placeholder="Número da Apólice"
                        className="mt-1"
                      />
                      <DocumentoUpload
                        label="Upload da Apólice de Seguro (PDF)"
                        accept="application/pdf"
                        maxSize={10 * 1024 * 1024} // 10MB
                        onUpload={(file) => setApoliceArquivo(file)}
                        onRemove={() => setApoliceArquivo(null)}
                        currentFile={apoliceArquivo}
                        fileUrl={obra?.apolice_arquivo || null}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mt-1">
                        {obra?.apolice_numero ? (
                          <span className="text-sm">{obra.apolice_numero}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Não informado</span>
                        )}
                      </div>
                      {obra?.apolice_arquivo && (
                        <div className="flex justify-end mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                // Gerar URL assinada usando o endpoint do backend
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.apolice_arquivo || '')}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  } else {
                                    throw new Error('URL não retornada')
                                  }
                                } else {
                                  throw new Error('Erro ao gerar URL')
                                }
                              } catch (error) {
                                console.error('Erro ao baixar Apólice:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo da Apólice",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar Apólice
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Total da Obra:</span>
                  <span className="text-sm font-medium text-blue-600">
                    <ValorMonetarioOculto valor={obra?.valorTotalObra || 0} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gastos do Mês Passado:</span>
                  <span className="text-sm font-medium text-orange-600">
                    <ValorMonetarioOculto valor={gastosMesPassado} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gastos do Mês:</span>
                  <span className="text-sm font-medium text-red-600">
                    <ValorMonetarioOculto valor={gastosMesAtual} />
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Saldo Restante:</span>
                  <span className={`text-sm font-bold ${
                    (obra?.orcamento || 0) - totalTodosCustos >= 0
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    <ValorMonetarioOculto valor={(obra?.orcamento || 0) - totalTodosCustos} />
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gruas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">
                  Gruas Vinculadas ({gruasVinculadas.length})
                  {loadingGruas && <InlineLoader size="sm" />}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setIsAdicionarGruaOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Grua
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              {loadingGruas ? (
                <CardLoader text="Carregando gruas vinculadas..." />
              ) : gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {gruasVinculadas.map((grua) => {
                    const isGruaReal = gruasReais.some(gr => gr.id === grua.id)
                    
                    return (
                      <div key={grua.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {grua.grua ? `${grua.grua.fabricante || grua.grua.manufacturer || ''} ${grua.grua.modelo || grua.grua.model || ''}`.trim() || grua.name : `Grua ${grua.gruaId || grua.id}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {grua.grua ? 
                                `${grua.grua.tipo || grua.grua.type || 'N/A'} - ID: ${grua.grua.id}` : 
                                `ID: ${grua.gruaId || grua.id}`
                              }
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500">
                                <strong>Início da Locação:</strong> {(grua.dataInicioLocacao || grua.data_inicio_locacao || grua.data_instalacao) ? new Date(grua.dataInicioLocacao || grua.data_inicio_locacao || grua.data_instalacao).toLocaleDateString('pt-BR') : 'Não informado'}
                              </p>
                              {(grua.dataFimLocacao || grua.data_fim_locacao || grua.data_remocao) && (
                                <p className="text-xs text-gray-500">
                                  <strong>Fim da Locação:</strong> {new Date(grua.dataFimLocacao || grua.data_fim_locacao || grua.data_remocao).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                              {(grua.valorLocacaoMensal || grua.valor_locacao_mensal) && (
                                <p className="text-xs text-gray-500">
                                  <strong>Valor Mensal:</strong> <ValorMonetarioOculto valor={grua.valorLocacaoMensal || grua.valor_locacao_mensal || 0} />
                                </p>
                              )}
                              {grua.observacoes && (
                                <p className="text-xs text-gray-500">
                                  <strong>Observações:</strong> {grua.observacoes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge 
                              variant={(grua.status === 'Ativa' || grua.status === 'ativa' || grua.status === 'em_obra') ? 'default' : 'secondary'}
                              className={(grua.status === 'Ativa' || grua.status === 'ativa') ? 'bg-green-100 text-green-800' : ''}
                            >
                              {grua.status || 'Ativa'}
                            </Badge>
                            {isGruaReal && (
                              <Badge variant="outline" className="text-xs">
                                {grua.tipo || 'Tipo não informado'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui gruas vinculadas.</p>
                  <Button 
                    onClick={() => setIsAdicionarGruaOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Vincular Primeira Grua
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">
                  Funcionários e Supervisores
                  {loadingFuncionarios && <InlineLoader size="sm" />}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAdicionarSupervisorOpen(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Vincular Supervisor
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setIsAdicionarFuncionarioOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Vincular Funcionário
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFuncionarios ? (
                <CardLoader text="Carregando funcionários vinculados..." />
              ) : (
                <div className="space-y-6">
                  {/* Seção de Supervisores */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-base">Supervisores</h3>
                      <Badge variant="outline" className="ml-2">
                        {funcionariosVinculados.filter(isSupervisor).length}
                      </Badge>
                    </div>
                    {funcionariosVinculados.filter(isSupervisor).length > 0 ? (
                      <div className="space-y-4">
                        {funcionariosVinculados.filter(isSupervisor).map((funcionario) => (
                          <div key={funcionario.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{funcionario.name}</h3>
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                    Supervisor
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{funcionario.role}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    <strong>Data de Início:</strong> {funcionario.dataInicio ? new Date(funcionario.dataInicio).toLocaleDateString('pt-BR') : 'Não informado'}
                                  </p>
                                  {funcionario.dataFim && (
                                    <p className="text-xs text-gray-500">
                                      <strong>Data de Fim:</strong> {new Date(funcionario.dataFim).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                  {funcionario.observacoes && (
                                    <p className="text-xs text-gray-500">
                                      <strong>Observações:</strong> {funcionario.observacoes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  variant={funcionario.status === 'ativo' ? 'default' : 'secondary'}
                                  className={funcionario.status === 'ativo' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {funcionario.status}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoverFuncionarioVinculado(funcionario.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg bg-gray-50">
                        <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Nenhum supervisor vinculado</p>
                      </div>
                    )}
                  </div>

                  {/* Seção de Funcionários */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-base">Funcionários</h3>
                      <Badge variant="outline" className="ml-2">
                        {funcionariosVinculados.filter(f => !isSupervisor(f)).length}
                      </Badge>
                    </div>
                    {funcionariosVinculados.filter(f => !isSupervisor(f)).length > 0 ? (
                      <div className="space-y-4">
                        {funcionariosVinculados.filter(f => !isSupervisor(f)).map((funcionario) => (
                          <div key={funcionario.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{funcionario.name}</h3>
                                <p className="text-sm text-gray-600">{funcionario.role}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    <strong>Data de Início:</strong> {funcionario.dataInicio ? new Date(funcionario.dataInicio).toLocaleDateString('pt-BR') : 'Não informado'}
                                  </p>
                                  {funcionario.dataFim && (
                                    <p className="text-xs text-gray-500">
                                      <strong>Data de Fim:</strong> {new Date(funcionario.dataFim).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                  {funcionario.observacoes && (
                                    <p className="text-xs text-gray-500">
                                      <strong>Observações:</strong> {funcionario.observacoes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  variant={funcionario.status === 'ativo' ? 'default' : 'secondary'}
                                  className={funcionario.status === 'ativo' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {funcionario.status}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoverFuncionarioVinculado(funcionario.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg bg-gray-50">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Nenhum funcionário vinculado</p>
                      </div>
                    )}
                  </div>

                  {/* Mensagem quando não há nenhum funcionário ou supervisor */}
                  {funcionariosVinculados.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário vinculado</h3>
                      <p className="text-gray-600 mb-4">Esta obra ainda não possui funcionários ou supervisores vinculados.</p>
                      <Button 
                        onClick={() => setIsAdicionarFuncionarioOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Vincular Primeiro Funcionário
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sinaleiros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Sinaleiros da Obra
              </CardTitle>
              <CardDescription>
                Sinaleiros cadastrados para esta obra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSinaleiros ? (
                <CardLoader text="Carregando sinaleiros..." />
              ) : errorSinaleiros ? (
                <div className="text-red-600 text-sm">{errorSinaleiros}</div>
              ) : sinaleiros.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  Nenhum sinaleiro cadastrado para esta obra
                </div>
              ) : (
                <div className="space-y-4">
                  {sinaleiros.map((sinaleiro) => {
                    const documentos = documentosSinaleiros[sinaleiro.id] || []
                    return (
                      <Card key={sinaleiro.id} className="border-l-4 border-l-purple-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{sinaleiro.nome}</CardTitle>
                              <CardDescription>
                                {sinaleiro.tipo === 'principal' ? 'Sinaleiro Principal' : 'Sinaleiro Reserva'}
                              </CardDescription>
                            </div>
                            <Badge variant={sinaleiro.tipo === 'principal' ? 'default' : 'secondary'}>
                              {sinaleiro.tipo === 'principal' ? 'Principal' : 'Reserva'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-gray-500">RG/CPF</Label>
                              <p className="text-sm font-medium">{sinaleiro.rg_cpf}</p>
                            </div>
                            {sinaleiro.telefone && (
                              <div>
                                <Label className="text-xs text-gray-500">Telefone</Label>
                                <p className="text-sm font-medium">{sinaleiro.telefone}</p>
                              </div>
                            )}
                            {sinaleiro.email && (
                              <div>
                                <Label className="text-xs text-gray-500">Email</Label>
                                <p className="text-sm font-medium">{sinaleiro.email}</p>
                              </div>
                            )}
                          </div>
                          
                          {documentos.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <Label className="text-xs text-gray-500 mb-2 block">Documentos</Label>
                              <div className="space-y-2">
                                {documentos.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm">{doc.tipo}</span>
                                    </div>
                                    <Badge 
                                      variant={
                                        doc.status === 'aprovado' ? 'default' :
                                        doc.status === 'rejeitado' ? 'destructive' :
                                        doc.status === 'vencido' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {doc.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complementos" className="space-y-4">
          {/* Complementos de Obra (sem grua) */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Complementos de Obra
              </CardTitle>
              <CardDescription>
                Acessórios e serviços locados ou comprados para a obra (não vinculados a uma grua específica)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GruaComplementosManager
                obraId={obra?.id ? parseInt(obra.id.toString()) : undefined}
                dataInicioLocacao={obra?.startDate}
                dataFimLocacao={obra?.endDate}
                mesesLocacao={obra?.startDate && obra?.endDate ? 
                  Math.max(1, Math.ceil((new Date(obra.endDate).getTime() - new Date(obra.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 
                  12
                }
              />
            </CardContent>
          </Card>

          {/* Complementos das Gruas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Complementos das Gruas</CardTitle>
              <CardDescription>
                Acessórios e serviços locados ou comprados para as gruas específicas desta obra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGruas ? (
                <CardLoader text="Carregando gruas..." />
              ) : gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {gruasVinculadas.map((grua) => {
                    // Calcular meses de locação
                    const dataInicio = grua.data_inicio_locacao || grua.dataInicioLocacao || grua.data_instalacao
                    const dataFim = grua.dataFimLocacao || grua.data_fim_locacao || grua.data_remocao
                    
                    let mesesLocacao = 12 // Default
                    
                    if (dataInicio) {
                      const inicioDate = new Date(dataInicio)
                      if (dataFim) {
                        const fimDate = new Date(dataFim)
                        const diffTime = Math.abs(fimDate.getTime() - inicioDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        mesesLocacao = Math.max(1, Math.ceil(diffDays / 30))
                      } else {
                        // Se não tem data fim, calcular até hoje ou usar 12 meses como padrão
                        const hoje = new Date()
                        const diffTime = Math.abs(hoje.getTime() - inicioDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        mesesLocacao = Math.max(1, Math.ceil(diffDays / 30))
                      }
                    }
                    
                    const gruaId = grua.gruaId || grua.grua?.id || grua.id
                    const gruaObraId = grua.relacaoId || grua.configId || grua.id?.toString()
                    
                    return (
                      <Card key={grua.id || grua.relacaoId || grua.configId} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            {grua.grua ? `${grua.grua.fabricante} ${grua.grua.modelo}` : `Grua ${gruaId}`}
                            {grua.grua && (
                              <Badge variant="outline" className="ml-2">
                                ID: {grua.grua.id}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {dataInicio && (
                              <span>
                                Locação: {new Date(dataInicio).toLocaleDateString('pt-BR')}
                                {dataFim && (
                                  <> até {new Date(dataFim).toLocaleDateString('pt-BR')}</>
                                )}
                                {grua.valorLocacaoMensal && (
                                  <> • <ValorMonetarioOculto valor={grua.valorLocacaoMensal} />/mês</>
                                )}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <GruaComplementosManager
                            gruaObraId={gruaObraId}
                            obraId={obra?.id ? parseInt(obra.id.toString()) : undefined}
                            gruaId={gruaId}
                            dataInicioLocacao={dataInicio}
                            dataFimLocacao={dataFim}
                            mesesLocacao={mesesLocacao}
                          />
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Nenhuma grua vinculada. Os complementos de obra podem ser gerenciados acima.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          {/* Seção: Documentos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Documentos da Obra
                </CardTitle>
                <Button 
                  type="button"
                  size="sm"
                  onClick={() => setIsNovoDocumentoOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocumentos ? (
                <CardLoader text="Carregando documentos..." />
              ) : documentos.length > 0 ? (
                <div className="space-y-4">
                  {documentos.map((documento) => (
                    <Card key={documento.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{documento.titulo}</CardTitle>
                              <CardDescription className="mt-1">{documento.descricao}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDocumentStatusColor(documento.status)}>
                              {documento.status.replace('_', ' ')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/dashboard/assinatura/${documento.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Informações do documento */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Criado em:</span>
                              <span>{new Date(documento.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Assinantes:</span>
                              <span>{documento.assinaturas?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Progresso:</span>
                              <span>{documento.assinaturas?.length > 0 ? Math.round((documento.assinaturas.filter((a: any) => a.status === 'assinado').length / documento.assinaturas.length) * 100) : 0}%</span>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          {documento.assinaturas?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progresso das Assinaturas</span>
                                <span>{Math.round((documento.assinaturas.filter((a: any) => a.status === 'assinado').length / documento.assinaturas.length) * 100)}%</span>
                              </div>
                              <Progress 
                                value={(documento.assinaturas.filter((a: any) => a.status === 'assinado').length / documento.assinaturas.length) * 100} 
                                className="h-2" 
                              />
                            </div>
                          )}

                          {/* Lista de assinaturas */}
                          {documento.assinaturas?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Ordem de Assinaturas</h4>
                              <div className="space-y-2">
                                {documento.assinaturas
                                  .sort((a: any, b: any) => a.ordem - b.ordem)
                                  .map((assinatura: any, index: number) => (
                                  <div key={assinatura.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                        {assinatura.ordem}
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{assinatura.usuario?.nome || 'Usuário'}</p>
                                        <p className="text-xs text-gray-600">{assinatura.usuario?.role || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getSignatureStatusColor(assinatura.status)}>
                                        {assinatura.status}
                                      </Badge>
                                      {assinatura.arquivo_assinado && (
                                        <Button size="sm" variant="outline">
                                          <Download className="w-3 h-3 mr-1" />
                                          Baixar
                                        </Button>
                                      )}
                                      {assinatura.docu_sign_link && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          DocuSign
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Próximo assinante */}
                          {documento.proximo_assinante_id && documento.assinaturas && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                Próximo a assinar: <strong>{documento.assinaturas.find((a: any) => a.user_id === documento.proximo_assinante_id)?.usuario?.nome || 'Usuário'}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui documentos para assinatura.</p>
                  <Button 
                    type="button"
                    onClick={() => setIsNovoDocumentoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Arquivos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Arquivos Adicionais
                </CardTitle>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNovoArquivoOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Arquivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingArquivos ? (
                <CardLoader text="Carregando arquivos..." />
              ) : arquivos.length > 0 ? (
                <div className="space-y-4">
                  {arquivos.map((arquivo) => (
                    <Card key={arquivo.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-green-600" />
                            <div>
                              <CardTitle className="text-lg">{arquivo.nome_original}</CardTitle>
                              <CardDescription className="mt-1">{arquivo.descricao}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {arquivo.categoria}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  if (obra?.id) {
                                    await obrasArquivosApi.baixar(parseInt(obra.id), arquivo.id)
                                  }
                                } catch (error: any) {
                                  toast({
        title: "Informação",
        description: "Erro ao baixar arquivo",
        variant: "default"
      })
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoverArquivo(arquivo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          {/* <div className="flex items-center gap-2 hidden">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Arquivo:</span>
                            <span className="font-medium">{arquivo.nome_arquivo}</span>
                          </div> */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Upload:</span>
                            <span>{new Date(arquivo.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tamanho:</span>
                            <span>{formatarTamanhoArquivo(arquivo.tamanho)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tipo:</span>
                            <span>{arquivo.tipo_mime}</span>
                          </div>
                        </div>
                        {arquivo.download_count > 0 && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <span>Downloads: {arquivo.download_count}</span>
                            {arquivo.last_download_at && (
                              <span className="ml-4">
                                Último download: {new Date(arquivo.last_download_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui arquivos adicionais.</p>
                  <Button 
                    type="button"
                    onClick={() => setIsNovoArquivoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Arquivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Checklists Diários */}
        <TabsContent value="checklists" className="space-y-4">
          {gruasVinculadas.length > 0 ? (
            <div className="space-y-6">
              {gruasVinculadas.map((grua) => (
                <div key={grua.id} className="space-y-4">
                  {/* Seção: Checklists Diários */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        {grua.name || `Grua ${grua.id}`} - Checklists Diários
                      </CardTitle>
                      <CardDescription>
                        {[grua.fabricante, grua.modelo].filter(Boolean).join(' ') || 'N/A'} - {grua.capacidade || 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LivroGruaChecklistList
                        gruaId={grua.id.toString()}
                        onNovoChecklist={() => handleNovoChecklist(grua.id.toString())}
                        onEditarChecklist={(checklist) => handleEditarChecklist(checklist, grua.id.toString())}
                        onVisualizarChecklist={handleVisualizarChecklist}
                        onExcluirChecklist={handleExcluirChecklist}
                      />
                    </CardContent>
                  </Card>

                  {/* Seção: Manutenções */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        {grua.name || `Grua ${grua.id}`} - Manutenções
                      </CardTitle>
                      <CardDescription>
                        {[grua.fabricante, grua.modelo].filter(Boolean).join(' ') || 'N/A'} - {grua.capacidade || 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LivroGruaManutencaoList
                        gruaId={grua.id.toString()}
                        onNovaManutencao={() => handleNovaManutencao(grua.id.toString())}
                        onEditarManutencao={(manutencao) => handleEditarManutencao(manutencao, grua.id.toString())}
                        onVisualizarManutencao={handleVisualizarManutencao}
                        onExcluirManutencao={handleExcluirManutencao}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">
                    Esta obra ainda não possui gruas vinculadas para exibir checklists e manutenções.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Livro da Grua */}
        <TabsContent value="livro-grua" className="space-y-4">
          <LivroGruaObra obraId={obraId} />
        </TabsContent>

        <TabsContent value="medicoes-mensais" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medições Mensais</CardTitle>
                  <CardDescription>
                    Histórico de medições mensais da obra
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={carregarMedicoesMensais}
                    disabled={loadingMedicoes}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingMedicoes ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMedicoes ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando medições...</span>
                </div>
              ) : errorMedicoes ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>{errorMedicoes}</p>
                </div>
              ) : medicoesMensais.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma medição mensal encontrada</p>
                  <p className="text-sm">
                    {orcamentosObra.length > 0 
                      ? "As medições dos orçamentos vinculados aparecerão aqui"
                      : "Você pode criar medições mensais mesmo sem orçamentos vinculados"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumo */}
                  {(() => {
                    // Calcular medições filtradas
                    const medicoesFiltradas = medicoesMensais.filter((m) => {
                      if (filtroAno && filtroAno !== 'todos' && filtroMes && filtroMes !== 'todos') {
                        const periodoFiltro = `${filtroAno}-${filtroMes}`
                        return m.periodo === periodoFiltro
                      }
                      if (filtroAno && filtroAno !== 'todos') {
                        return m.periodo.startsWith(filtroAno)
                      }
                      if (filtroMes && filtroMes !== 'todos') {
                        return m.periodo.endsWith(`-${filtroMes}`)
                      }
                      return true
                    })

                    // Calcular mês atual e mês passado
                    const agora = new Date()
                    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
                    const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
                    const mesPassadoStr = `${mesPassado.getFullYear()}-${String(mesPassado.getMonth() + 1).padStart(2, '0')}`

                    const medicoesMesAtual = medicoesMensais.filter(m => m.periodo === mesAtual)
                    const medicoesMesPassado = medicoesMensais.filter(m => m.periodo === mesPassadoStr)

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-gray-600">Total de Medições</div>
                            <div className="text-2xl font-bold">{medicoesFiltradas.length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-gray-600">Medição do Mês Passado</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {medicoesMesPassado.length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {medicoesMesPassado.reduce((sum, m) => sum + (m.valor_total || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-gray-600">Medição do Mês Atual</div>
                            <div className="text-2xl font-bold text-green-600">
                              {medicoesMesAtual.length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {medicoesMesAtual.reduce((sum, m) => sum + (m.valor_total || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-gray-600">Total Faturado</div>
                            <div className="text-2xl font-bold text-green-600">
                              R$ {medicoesMensais
                                .filter(m => m.status === 'finalizada')
                                .reduce((sum, m) => sum + (m.valor_total || 0), 0)
                                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()}

                  {/* Lista de Medições */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Histórico de Medições</CardTitle>
                        <div className="flex items-end gap-3">
                          <div className="w-[140px]">
                            <Label htmlFor="filtro-ano" className="text-xs">Ano</Label>
                            <Select value={filtroAno} onValueChange={setFiltroAno}>
                              <SelectTrigger id="filtro-ano" className="h-9">
                                <SelectValue placeholder="Todos os anos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todos">Todos os anos</SelectItem>
                                {Array.from({ length: 5 }, (_, i) => {
                                  const ano = new Date().getFullYear() - i
                                  return (
                                    <SelectItem key={ano} value={ano.toString()}>
                                      {ano}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-[160px]">
                            <Label htmlFor="filtro-mes" className="text-xs">Mês</Label>
                            <Select value={filtroMes} onValueChange={setFiltroMes}>
                              <SelectTrigger id="filtro-mes" className="h-9">
                                <SelectValue placeholder="Todos os meses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todos">Todos os meses</SelectItem>
                                {[
                                  { value: "01", label: "Janeiro" },
                                  { value: "02", label: "Fevereiro" },
                                  { value: "03", label: "Março" },
                                  { value: "04", label: "Abril" },
                                  { value: "05", label: "Maio" },
                                  { value: "06", label: "Junho" },
                                  { value: "07", label: "Julho" },
                                  { value: "08", label: "Agosto" },
                                  { value: "09", label: "Setembro" },
                                  { value: "10", label: "Outubro" },
                                  { value: "11", label: "Novembro" },
                                  { value: "12", label: "Dezembro" }
                                ].map((mes) => (
                                  <SelectItem key={mes.value} value={mes.value}>
                                    {mes.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Orçamento</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor Mensal Bruto</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Filtrar medições baseado nos filtros
                            const medicoesFiltradas = medicoesMensais.filter((m) => {
                              if (filtroAno && filtroAno !== 'todos' && filtroMes && filtroMes !== 'todos') {
                                const periodoFiltro = `${filtroAno}-${filtroMes}`
                                return m.periodo === periodoFiltro
                              }
                              if (filtroAno && filtroAno !== 'todos') {
                                return m.periodo.startsWith(filtroAno)
                              }
                              if (filtroMes && filtroMes !== 'todos') {
                                return m.periodo.endsWith(`-${filtroMes}`)
                              }
                              return true
                            })
                            
                            return medicoesFiltradas.map((medicao) => (
                            <TableRow key={medicao.id}>
                              <TableCell className="font-medium">{medicao.numero}</TableCell>
                              <TableCell>
                                {medicao.orcamento_id 
                                  ? (medicao.orcamentos?.numero || `ORC-${medicao.orcamento_id}`)
                                  : <span className="text-gray-400 italic">Sem orçamento</span>
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  {medicoesUtils.formatPeriodo(medicao.periodo)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(medicao.data_medicao).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                R$ {medicao.valor_mensal_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold">
                                    R$ {medicao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    medicao.status === 'finalizada'
                                      ? 'bg-green-100 text-green-800'
                                      : medicao.status === 'pendente'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : medicao.status === 'cancelada'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {medicao.status === 'finalizada' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {medicao.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                                  {medicao.status === 'cancelada' && <XCircle className="w-3 h-3 mr-1" />}
                                  {medicao.status === 'finalizada'
                                    ? 'Finalizada'
                                    : medicao.status === 'pendente'
                                    ? 'Pendente'
                                    : medicao.status === 'cancelada'
                                    ? 'Cancelada'
                                    : medicao.status === 'enviada'
                                    ? 'Enviada'
                                    : medicao.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    router.push(`/dashboard/medicoes/${medicao.id}`)
                                  }}
                                  title="Ver detalhes da medição"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            ))
                          })()}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Entrada */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Entrada no Livro da Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovaEntrada} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gruaId">Grua *</Label>
                <Select
                  value={novaEntradaData.gruaId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, gruaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma grua" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruasVinculadas.map(grua => (
                      <SelectItem key={grua.id} value={grua.id}>
                        {grua.name} - {grua.modelo || grua.model || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionarioId">Funcionário *</Label>
                <Select
                  value={novaEntradaData.funcionarioId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, funcionarioId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Integrar com API de funcionários */}
                    {[].map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaEntradaData.data}
                  onChange={(e) => setNovaEntradaData({ ...novaEntradaData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={novaEntradaData.tipo}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist Diário</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="falha">Falha/Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={novaEntradaData.status}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="falha">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={novaEntradaData.descricao}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, descricao: e.target.value })}
                placeholder="Descreva a atividade realizada, problema encontrado ou manutenção executada..."
                rows={4}
                required
              />
            </div>

            {novaEntradaData.status === 'falha' && (
              <div>
                <Label htmlFor="responsavelResolucao">Responsável pela Resolução *</Label>
                <Select
                  value={novaEntradaData.responsavelResolucao}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, responsavelResolucao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Integrar com API de funcionários */}
                    {[].map((user: any) => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                value={novaEntradaData.observacoes}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, observacoes: e.target.value })}
                placeholder="Observações complementares, recomendações, próximos passos..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovaEntradaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Entrada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Entrada */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Entrada
            </DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-sm">
                        {new Date(entradaSelecionada.data_entrada).toLocaleDateString('pt-BR')} {entradaSelecionada.hora_entrada && `às ${entradaSelecionada.hora_entrada}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Grua</Label>
                      <p className="text-sm font-medium">{entradaSelecionada.gruaName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                      <p className="text-sm">{entradaSelecionada.funcionarioName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.tipo_entrada === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo_entrada === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo_entrada === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo_entrada}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status_entrada === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status_entrada === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status_entrada}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavel_resolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavel_resolucao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Descrição */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {entradaSelecionada.descricao}
                  </p>
                </CardContent>
              </Card>

              {/* Observações */}
              {entradaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {entradaSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarEntradaOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    // Aqui poderia implementar edição da entrada
                    // Editar entrada
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Arquivo */}
      <Dialog open={isNovoArquivoOpen} onOpenChange={setIsNovoArquivoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Novo Arquivo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoArquivo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Arquivo *</Label>
                <Input
                  id="nome"
                  value={novoArquivoData.nome}
                  onChange={(e) => setNovoArquivoData({ ...novoArquivoData, nome: e.target.value })}
                  placeholder="Ex: Manual de Operação"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={novoArquivoData.categoria}
                  onValueChange={(value) => setNovoArquivoData({ ...novoArquivoData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="certificado">Certificado</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="foto">Foto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novoArquivoData.descricao}
                onChange={(e) => setNovoArquivoData({ ...novoArquivoData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo do arquivo..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="arquivo">Selecionar Arquivo *</Label>
              <div className="mt-2">
                <Input
                  id="arquivo"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNovoArquivoData({ ...novoArquivoData, arquivo: file })
                    }
                  }}
                  accept="*/*"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, etc.
                </p>
              </div>
            </div>

            {novoArquivoData.arquivo && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">{novoArquivoData.arquivo.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatarTamanhoArquivo(novoArquivoData.arquivo.size)} • {novoArquivoData.arquivo.type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoArquivoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Arquivo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar grua */}
      <Dialog open={isAdicionarGruaOpen} onOpenChange={setIsAdicionarGruaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Gruas à Obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdicionarGrua} className="space-y-6">
            <div className="space-y-4">
              {/* Busca de Grua */}
              <div>
                <Label htmlFor="gruaSearch">Buscar Grua</Label>
                <GruaSearch
                  onGruaSelect={handleGruaSelect}
                  selectedGrua={null}
                  placeholder="Digite o nome ou modelo da grua para buscar"
                  onlyAvailable={true}
                />
              </div>

              {/* Gruas Selecionadas */}
              {gruasSelecionadas.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Gruas Selecionadas ({gruasSelecionadas.length})</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {gruasSelecionadas.map((grua) => (
                      <Card key={grua.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{grua.name}</p>
                              <p className="text-sm text-gray-600">
                                {grua.manufacturer} {grua.model} - {grua.capacity}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverGrua(grua.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`valorLocacao-${grua.id}`}>Valor da Locação (R$)</Label>
                            <Input
                              id={`valorLocacao-${grua.id}`}
                              type="text"
                              value={grua.valorLocacao ? grua.valorLocacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
                                handleAtualizarGrua(grua.id, 'valorLocacao', valor)
                              }}
                              placeholder="0,00"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`taxaMensal-${grua.id}`}>Taxa Mensal (R$)</Label>
                            <Input
                              id={`taxaMensal-${grua.id}`}
                              type="text"
                              value={grua.taxaMensal ? grua.taxaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
                                handleAtualizarGrua(grua.id, 'taxaMensal', valor)
                              }}
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados Gerais da Locação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicioLocacao">Data Início Locação *</Label>
                  <Input
                    id="dataInicioLocacao"
                    type="date"
                    value={novaGruaData.dataInicioLocacao}
                    onChange={(e) => setNovaGruaData({...novaGruaData, dataInicioLocacao: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dataFimLocacao">Data Fim Locação</Label>
                  <Input
                    id="dataFimLocacao"
                    type="date"
                    value={novaGruaData.dataFimLocacao}
                    onChange={(e) => setNovaGruaData({...novaGruaData, dataFimLocacao: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novaGruaData.observacoes}
                  onChange={(e) => setNovaGruaData({...novaGruaData, observacoes: e.target.value})}
                  placeholder="Observações sobre a locação..."
                  rows={3}
                />
              </div>

              {/* Resumo das Gruas */}
              {gruasSelecionadas.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Resumo das Gruas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Total de Gruas:</span>
                      <p className="text-blue-900 font-semibold">{calcularResumo().totalGruas}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Valor Total de Locação:</span>
                      <p className="text-blue-900 font-semibold">
                        R$ {calcularResumo().valorTotalLocacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Taxa Mensal Total:</span>
                      <p className="text-blue-900 font-semibold">
                        R$ {calcularResumo().taxaMensalTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelarAdicionarGrua}>
                Cancelar
              </Button>
              <Button type="submit" disabled={gruasSelecionadas.length === 0 || loadingGruas}>
                {loadingGruas ? (
                  <>
                    <InlineLoader size="sm" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Gruas ({gruasSelecionadas.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar funcionário */}
      <Dialog open={isAdicionarFuncionarioOpen} onOpenChange={setIsAdicionarFuncionarioOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Funcionários à Obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdicionarFuncionario} className="space-y-6">
            <div className="space-y-4">
              {/* Busca de Funcionário */}
              <div>
                <Label htmlFor="funcionarioSearch">Buscar Funcionário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="funcionarioSearch"
                    placeholder="Digite o nome do funcionário..."
                    className="pl-10"
                    value={funcionarioSearchValue}
                    onChange={(e) => setFuncionarioSearchValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de funcionários disponíveis */}
              <div className="space-y-2">
                <Label>Funcionários Disponíveis</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {loadingFuncionariosSearch ? (
                    <div className="flex items-center justify-center p-4">
                      <InlineLoader size="sm" />
                      <span className="ml-2 text-sm text-gray-600">Buscando funcionários...</span>
                    </div>
                  ) : funcionariosDisponiveis.length === 0 && funcionarioSearchValue.length >= 2 ? (
                    <div className="text-center p-4 text-sm text-gray-500">
                      Nenhum funcionário encontrado
                    </div>
                  ) : funcionarioSearchValue.length < 2 ? (
                    <div className="text-center p-4 text-sm text-gray-500">
                      Digite pelo menos 2 caracteres para buscar
                    </div>
                  ) : (
                    funcionariosDisponiveis.map((funcionario: any) => (
                    <div 
                      key={funcionario.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleFuncionarioSelect(funcionario)}
                    >
                      <div>
                        <p className="font-medium">{funcionario.name}</p>
                        <p className="text-sm text-gray-600">{funcionario.role}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFuncionarioSelect(funcionario)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    ))
                  )}
                </div>
              </div>

              {/* Funcionários selecionados */}
              {funcionariosSelecionados.length > 0 && (
                <div className="space-y-2">
                  <Label>Funcionários Selecionados</Label>
                  <div className="space-y-2">
                    {funcionariosSelecionados.map(funcionario => (
                      <div key={funcionario.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <p className="font-medium">{funcionario.name}</p>
                            <p className="text-sm text-gray-600">{funcionario.role}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`supervisor-${funcionario.id}`}
                              checked={funcionario.isSupervisor === true}
                              onCheckedChange={() => handleToggleSupervisor(funcionario.id)}
                            />
                            <Label 
                              htmlFor={`supervisor-${funcionario.id}`}
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              <Shield className="w-4 h-4" />
                              Supervisor
                            </Label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoverFuncionario(funcionario.id)}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados da vinculação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={novoFuncionarioData.dataInicio}
                    onChange={(e) => setNovoFuncionarioData({ ...novoFuncionarioData, dataInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={novoFuncionarioData.dataFim}
                    onChange={(e) => setNovoFuncionarioData({ ...novoFuncionarioData, dataFim: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações sobre a vinculação do funcionário..."
                  value={novoFuncionarioData.observacoes}
                  onChange={(e) => setNovoFuncionarioData({ ...novoFuncionarioData, observacoes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelarAdicionarFuncionario}>
                Cancelar
              </Button>
              <Button type="submit" disabled={funcionariosSelecionados.length === 0 || loadingFuncionarios}>
                {loadingFuncionarios ? (
                  <>
                    <InlineLoader size="sm" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Funcionários ({funcionariosSelecionados.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar supervisor */}
      <Dialog open={isAdicionarSupervisorOpen} onOpenChange={setIsAdicionarSupervisorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Vincular Supervisores à Obra
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdicionarSupervisor} className="space-y-6">
            <div className="space-y-4">
              {/* Busca de Supervisor */}
              <div>
                <Label htmlFor="supervisorSearch">Buscar Supervisor</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="supervisorSearch"
                    placeholder="Digite o nome do supervisor..."
                    className="pl-10"
                    value={supervisorSearchValue}
                    onChange={(e) => setSupervisorSearchValue(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas funcionários marcados como supervisores serão exibidos
                </p>
              </div>

              {/* Lista de supervisores disponíveis */}
              <div className="space-y-2">
                <Label>Supervisores Disponíveis</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {loadingSupervisoresSearch ? (
                    <div className="flex items-center justify-center p-4">
                      <InlineLoader size="sm" />
                      <span className="ml-2 text-sm text-gray-600">Buscando supervisores...</span>
                    </div>
                  ) : supervisoresDisponiveis.length === 0 && supervisorSearchValue.length >= 2 ? (
                    <div className="text-center p-4 text-sm text-gray-500">
                      Nenhum supervisor encontrado
                    </div>
                  ) : supervisorSearchValue.length < 2 ? (
                    <div className="text-center p-4 text-sm text-gray-500">
                      Digite pelo menos 2 caracteres para buscar
                    </div>
                  ) : (
                    supervisoresDisponiveis.map((supervisor: any) => (
                    <div 
                      key={supervisor.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSupervisorSelect(supervisor)}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{supervisor.name}</p>
                          <p className="text-sm text-gray-600">{supervisor.role}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSupervisorSelect(supervisor)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    ))
                  )}
                </div>
              </div>

              {/* Supervisores selecionados */}
              {supervisoresSelecionados.length > 0 && (
                <div className="space-y-2">
                  <Label>Supervisores Selecionados</Label>
                  <div className="space-y-2">
                    {supervisoresSelecionados.map(supervisor => (
                      <div key={supervisor.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{supervisor.name}</p>
                            <p className="text-sm text-gray-600">{supervisor.role}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            Supervisor
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoverSupervisor(supervisor.id)}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados da vinculação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supervisorDataInicio">Data de Início *</Label>
                  <Input
                    id="supervisorDataInicio"
                    type="date"
                    value={novoSupervisorData.dataInicio}
                    onChange={(e) => setNovoSupervisorData({ ...novoSupervisorData, dataInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supervisorDataFim">Data de Fim (opcional)</Label>
                  <Input
                    id="supervisorDataFim"
                    type="date"
                    value={novoSupervisorData.dataFim}
                    onChange={(e) => setNovoSupervisorData({ ...novoSupervisorData, dataFim: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supervisorObservacoes">Observações</Label>
                <Textarea
                  id="supervisorObservacoes"
                  placeholder="Observações sobre a vinculação do supervisor..."
                  value={novoSupervisorData.observacoes}
                  onChange={(e) => setNovoSupervisorData({ ...novoSupervisorData, observacoes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelarAdicionarSupervisor}>
                Cancelar
              </Button>
              <Button type="submit" disabled={supervisoresSelecionados.length === 0 || loadingFuncionarios}>
                {loadingFuncionarios ? (
                  <>
                    <InlineLoader size="sm" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Adicionar Supervisores ({supervisoresSelecionados.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Mês */}
      <Dialog open={isNovoMesOpen} onOpenChange={setIsNovoMesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Novo Mês
            </DialogTitle>
            <CardDescription>
              Selecione um mês para criar os custos. Os custos do mês anterior serão replicados automaticamente.
            </CardDescription>
          </DialogHeader>
          
          {mesesDisponiveis.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {mesesDisponiveis.map((mes) => (
                  <Card 
                    key={mes.value} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      novoMesData.mes === mes.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setNovoMesData({ ...novoMesData, mes: mes.value })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {mes.label}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(mes.value + '-01').toLocaleDateString('pt-BR', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        {novoMesData.mes === mes.value && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  setIsNovoMesOpen(false)
                  setNovoMesData({ mes: '' })
                }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleNovoMes}
                  disabled={!novoMesData.mes}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Mês
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os meses já foram criados</h3>
              <p className="text-gray-600 mb-4">
                Não há mais meses disponíveis para criar nos próximos 12 meses.
              </p>
              <Button variant="outline" onClick={() => setIsNovoMesOpen(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Item */}
      <Dialog open={isNovoItemOpen} onOpenChange={setIsNovoItemOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Item do Contrato
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item * (máx. 20 caracteres)</Label>
                <Input
                  id="item"
                  value={novoItemData.item}
                  onChange={(e) => setNovoItemData({ ...novoItemData, item: e.target.value })}
                  placeholder="Ex: 01.16"
                  maxLength={20}
                  required
                />
                {novoItemData.item.length >= 18 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {novoItemData.item.length}/20 caracteres
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoItemData.unidade}
                  onValueChange={(value) => setNovoItemData({ ...novoItemData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={novoItemData.descricao}
                  onChange={(e) => setNovoItemData({ ...novoItemData, descricao: e.target.value })}
                  placeholder="Ex: Hora Extra Operador"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidadeOrcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidadeOrcamento"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeOrcamento}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeOrcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorUnitario}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorUnitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${(novoItemData.quantidadeOrcamento * novoItemData.valorUnitario).toLocaleString('pt-BR')}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadeAnterior">Quantidade Acumulado Anterior</Label>
                <Input
                  id="quantidadeAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorAnterior">Valor Acumulado Anterior</Label>
                <Input
                  id="valorAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadePeriodo">Quantidade Realizado Período</Label>
                <Input
                  id="quantidadePeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadePeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadePeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorPeriodo">Valor Realizado Período</Label>
                <Input
                  id="valorPeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorPeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorPeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoItemOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Aditivo */}
      <Dialog open={isNovoAditivoOpen} onOpenChange={setIsNovoAditivoOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Aditivo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoAditivo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item * (máx. 20 caracteres)</Label>
                <Input
                  id="item"
                  value={novoItemData.item}
                  onChange={(e) => setNovoItemData({ ...novoItemData, item: e.target.value })}
                  placeholder="Ex: 01.20"
                  maxLength={20}
                  required
                />
                {novoItemData.item.length >= 18 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {novoItemData.item.length}/20 caracteres
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoItemData.unidade}
                  onValueChange={(value) => setNovoItemData({ ...novoItemData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={novoItemData.descricao}
                  onChange={(e) => setNovoItemData({ ...novoItemData, descricao: e.target.value })}
                  placeholder="Ex: Caixão de grua"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidadeOrcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidadeOrcamento"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeOrcamento}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeOrcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorUnitario}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorUnitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${(novoItemData.quantidadeOrcamento * novoItemData.valorUnitario).toLocaleString('pt-BR')}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadeAnterior">Quantidade Acumulado Anterior</Label>
                <Input
                  id="quantidadeAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorAnterior">Valor Acumulado Anterior</Label>
                <Input
                  id="valorAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadePeriodo">Quantidade Realizado Período</Label>
                <Input
                  id="quantidadePeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadePeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadePeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorPeriodo">Valor Realizado Período</Label>
                <Input
                  id="valorPeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorPeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorPeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoAditivoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aditivo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo/Editar Custo Mensal */}
      <Dialog open={isNovoCustoOpen} onOpenChange={setIsNovoCustoOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {isEditandoCusto ? 'Editar Custo Mensal' : 'Novo Custo Mensal'}
            </DialogTitle>
            <CardDescription>
              {isEditandoCusto 
                ? 'Edite as informações do custo mensal'
                : `Adicione um novo custo para ${mesSelecionado ? formatarMes(mesSelecionado) : 'o mês selecionado'}`
              }
            </CardDescription>
          </DialogHeader>
          <form onSubmit={isEditandoCusto ? handleAtualizarCusto : handleNovoCusto} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item * (máx. 20 caracteres)</Label>
                <Input
                  id="item"
                  value={novoCustoData.item}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, item: e.target.value })}
                  placeholder="Ex: 01.01"
                  maxLength={20}
                  required
                />
                {novoCustoData.item.length >= 18 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {novoCustoData.item.length}/20 caracteres
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoCustoData.unidade}
                  onValueChange={(value) => setNovoCustoData({ ...novoCustoData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={novoCustoData.tipo}
                  onValueChange={(value: 'contrato' | 'aditivo') => setNovoCustoData({ ...novoCustoData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="aditivo">Aditivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={novoCustoData.descricao}
                onChange={(e) => setNovoCustoData({ ...novoCustoData, descricao: e.target.value })}
                placeholder="Ex: Locação de grua torre PINGON BR47"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidade_orcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidade_orcamento"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_orcamento}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_orcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  value={novoCustoData.valor_unitario}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${formatarValor(novoCustoData.quantidade_orcamento * novoCustoData.valor_unitario)}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidade_realizada">Quantidade Realizada</Label>
                <Input
                  id="quantidade_realizada"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_realizada}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_realizada: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="quantidade_acumulada">Quantidade Acumulada</Label>
                <Input
                  id="quantidade_acumulada"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_acumulada}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_acumulada: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor_acumulado">Valor Acumulado</Label>
              <Input
                id="valor_acumulado"
                type="number"
                step="0.01"
                value={novoCustoData.valor_acumulado}
                onChange={(e) => setNovoCustoData({ ...novoCustoData, valor_acumulado: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsNovoCustoOpen(false)
                  setIsEditandoCusto(false)
                  setCustoSelecionado(null)
                  setNovoCustoData({
                    item: '',
                    descricao: '',
                    unidade: 'mês',
                    quantidade_orcamento: 0,
                    valor_unitario: 0,
                    quantidade_realizada: 0,
                    quantidade_acumulada: 0,
                    valor_acumulado: 0,
                    tipo: 'contrato'
                  })
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditandoCusto ? 'Atualizar Custo' : 'Criar Custo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Entrada Livro da Grua */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada no Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={gruasVinculadas.length > 0 ? (gruasVinculadas[0].grua?.id?.toString() || gruasVinculadas[0].id.toString()) : ''}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsNovaEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Entrada Livro da Grua */}
      <Dialog open={isEditarEntradaOpen} onOpenChange={setIsEditarEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrada do Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={entradaSelecionada?.grua_id || ''}
            modoEdicao={true}
            entrada={entradaSelecionada as any}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsEditarEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Entrada Livro da Grua */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Entrada
            </DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-sm">
                        {new Date(entradaSelecionada.data_entrada).toLocaleDateString('pt-BR')} {entradaSelecionada.hora_entrada && `às ${entradaSelecionada.hora_entrada}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Grua</Label>
                      <p className="text-sm font-medium">{entradaSelecionada.grua_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                      <p className="text-sm">{entradaSelecionada.funcionario_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.tipo_entrada === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo_entrada === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo_entrada === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo_entrada}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status_entrada === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status_entrada === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status_entrada}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavel_resolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavel_resolucao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {entradaSelecionada.descricao}
                  </p>
                </CardContent>
              </Card>
              {entradaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {entradaSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarEntradaOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setIsVisualizarEntradaOpen(false)
                    handleEditarEntrada(entradaSelecionada)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Novo Checklist */}
      <Dialog open={isNovoChecklistOpen} onOpenChange={setIsNovoChecklistOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist Diário</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaChecklist && (
            <LivroGruaChecklistDiario
              gruaId={gruaSelecionadaChecklist}
              onSave={handleSucessoChecklist}
              onCancel={() => setIsNovoChecklistOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Editar Checklist */}
      <Dialog open={isEditarChecklistOpen} onOpenChange={setIsEditarChecklistOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Checklist Diário</DialogTitle>
          </DialogHeader>
          <LivroGruaChecklistDiario
            gruaId={gruaSelecionadaChecklist}
            checklist={checklistSelecionado}
            modoEdicao={true}
            onSave={handleSucessoChecklist}
            onCancel={() => setIsEditarChecklistOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Checklist */}
      <Dialog open={isVisualizarChecklistOpen} onOpenChange={setIsVisualizarChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Checklist</DialogTitle>
          </DialogHeader>
          {checklistSelecionado && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data</p>
                      <p className="text-sm">
                        {new Date(checklistSelecionado.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Funcionário</p>
                      <p className="text-sm">{checklistSelecionado.funcionario_nome || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens Verificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { key: 'cabos', label: 'Cabos' },
                      { key: 'polias', label: 'Polias' },
                      { key: 'estrutura', label: 'Estrutura' },
                      { key: 'movimentos', label: 'Movimentos' },
                      { key: 'freios', label: 'Freios' },
                      { key: 'limitadores', label: 'Limitadores' },
                      { key: 'indicadores', label: 'Indicadores' },
                      { key: 'aterramento', label: 'Aterramento' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        {checklistSelecionado[item.key as keyof typeof checklistSelecionado] ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-300" />
                        )}
                        <span className={checklistSelecionado[item.key as keyof typeof checklistSelecionado] ? 'text-gray-900' : 'text-gray-400'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {checklistSelecionado.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {checklistSelecionado.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarChecklistOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setIsVisualizarChecklistOpen(false)
                    handleEditarChecklist(checklistSelecionado, gruaSelecionadaChecklist)
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Nova Manutenção */}
      <Dialog open={isNovaManutencaoOpen} onOpenChange={setIsNovaManutencaoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
          </DialogHeader>
          <LivroGruaManutencao
            gruaId={gruaSelecionadaManutencao}
            onSave={handleSucessoManutencao}
            onCancel={() => setIsNovaManutencaoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Manutenção */}
      <Dialog open={isEditarManutencaoOpen} onOpenChange={setIsEditarManutencaoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
          </DialogHeader>
          <LivroGruaManutencao
            gruaId={gruaSelecionadaManutencao}
            manutencao={manutencaoSelecionada}
            modoEdicao={true}
            onSave={handleSucessoManutencao}
            onCancel={() => setIsEditarManutencaoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Manutenção */}
      <Dialog open={isVisualizarManutencaoOpen} onOpenChange={setIsVisualizarManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Manutenção</DialogTitle>
          </DialogHeader>
          {manutencaoSelecionada && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data</p>
                      <p className="text-sm">
                        {new Date(manutencaoSelecionada.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Realizado Por</p>
                      <p className="text-sm">{manutencaoSelecionada.realizado_por_nome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cargo</p>
                      <Badge variant="outline">
                        {manutencaoSelecionada.cargo || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {manutencaoSelecionada.descricao && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {manutencaoSelecionada.descricao}
                    </p>
                  </CardContent>
                </Card>
              )}

              {manutencaoSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {manutencaoSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarManutencaoOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setIsVisualizarManutencaoOpen(false)
                    handleEditarManutencao(manutencaoSelecionada, gruaSelecionadaManutencao)
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Custos Iniciais */}
      <Dialog open={isCustosIniciaisOpen} onOpenChange={setIsCustosIniciaisOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Custos Iniciais da Obra
            </DialogTitle>
            <CardDescription>
              Crie os custos iniciais da obra. Estes custos serão replicados automaticamente para os próximos meses.
            </CardDescription>
          </DialogHeader>
          
          <form onSubmit={handleCriarCustosIniciais} className="space-y-6">
            {/* Seleção do Mês */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mes">Mês Inicial *</Label>
                <Input
                  id="mes"
                  type="month"
                  value={custosIniciaisData.mes}
                  onChange={(e) => setCustosIniciaisData(prev => ({ ...prev, mes: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAdicionarCustoInicial}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Custo
                </Button>
              </div>
            </div>

            {/* Lista de Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custos da Obra</h3>
              {custosIniciaisData.custos.map((custo, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Custo {index + 1}</h4>
                    {custosIniciaisData.custos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverCustoInicial(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Item *</Label>
                      <Input
                        value={custo.item}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'item', e.target.value)}
                        placeholder="Ex: 01.01"
                        required
                      />
                    </div>
                    <div>
                      <Label>Unidade *</Label>
                      <Select
                        value={custo.unidade}
                        onValueChange={(value) => handleAtualizarCustoInicial(index, 'unidade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">mês</SelectItem>
                          <SelectItem value="und">und</SelectItem>
                          <SelectItem value="und.">und.</SelectItem>
                          <SelectItem value="km">km</SelectItem>
                          <SelectItem value="h">h</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="m²">m²</SelectItem>
                          <SelectItem value="m³">m³</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo *</Label>
                      <Select
                        value={custo.tipo}
                        onValueChange={(value: 'contrato' | 'aditivo') => handleAtualizarCustoInicial(index, 'tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="aditivo">Aditivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Descrição *</Label>
                    <Input
                      value={custo.descricao}
                      onChange={(e) => handleAtualizarCustoInicial(index, 'descricao', e.target.value)}
                      placeholder="Ex: Locação de grua torre PINGON BR47"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Quantidade Orçamento *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={custo.quantidade_orcamento}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'quantidade_orcamento', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor Unitário *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={custo.valor_unitario}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Total Orçamento:</strong> R$ {formatarValor(custo.quantidade_orcamento * custo.valor_unitario)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Resumo Total */}
            <Card className="p-4 bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-2">Resumo dos Custos Iniciais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total de Itens:</span>
                  <span className="ml-2 font-medium">{custosIniciaisData.custos.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Valor Total:</span>
                  <span className="ml-2 font-medium">
                    R$ {formatarValor(
                      custosIniciaisData.custos.reduce((sum, custo) => 
                        sum + (custo.quantidade_orcamento * custo.valor_unitario), 0
                      )
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Mês:</span>
                  <span className="ml-2 font-medium">
                    {custosIniciaisData.mes ? formatarMes(custosIniciaisData.mes) : 'Não selecionado'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCustosIniciaisOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Custos Iniciais
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      {/* Modal de Novo Documento */}
      <Dialog open={isNovoDocumentoOpen} onOpenChange={setIsNovoDocumentoOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Criar Novo Documento</DialogTitle>
          </DialogHeader>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Configuração Manual de Links DocuSign</h3>
                <p className="text-sm text-blue-700 mt-1">Para cada assinante, você deve preencher:</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• <strong>Ordem:</strong> Sequência de assinatura (1, 2, 3...)</li>
                  <li>• <strong>Assinante:</strong> Selecionar usuário da lista</li>
                  <li>• <strong>Link DocuSign:</strong> URL do envelope no DocuSign</li>
                  <li>• <strong>Status:</strong> Pendente, Aguardando, Assinado ou Rejeitado</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleCriarDocumento} className="space-y-6 overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="titulo">Título do Documento *</Label>
                <Input
                  id="titulo"
                  value={novoDocumentoData.titulo}
                  onChange={(e) => setNovoDocumentoData({...novoDocumentoData, titulo: e.target.value})}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="obra">Obra *</Label>
                <Input
                  id="obra"
                  value={obra?.name || ''}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Obra atual: {obra?.name}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novoDocumentoData.descricao}
                onChange={(e) => setNovoDocumentoData({...novoDocumentoData, descricao: e.target.value})}
                placeholder="Descreva o conteúdo e propósito do documento..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="arquivo">Arquivo Original *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setNovoDocumentoData({...novoDocumentoData, arquivo: file})
                  }}
                  required
                />
                <Button type="button" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, DOC, DOCX</p>
              {novoDocumentoData.arquivo && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✅ Arquivo selecionado: {novoDocumentoData.arquivo.name} ({(novoDocumentoData.arquivo.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="link-assinatura">Link para Assinatura (Opcional)</Label>
              <Input
                id="link-assinatura"
                type="url"
                value={novoDocumentoData.linkAssinatura}
                onChange={(e) => setNovoDocumentoData({...novoDocumentoData, linkAssinatura: e.target.value})}
                placeholder="https://exemplo.com/assinatura"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Link externo onde o usuário pode acessar e assinar o documento (opcional)</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Ordem de Assinatura</Label>
                <div className="text-sm text-gray-500">Use os filtros abaixo para adicionar assinantes</div>
              </div>

              {/* Filtros para seleção de assinantes */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Filtros para Seleção de Assinantes</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tipo-assinante">Tipo de Assinante *</Label>
                    <Select value={tipoAssinante} onValueChange={(value) => setTipoAssinante(value as 'interno' | 'cliente' | '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interno">Interno (Funcionários/Usuários)</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoAssinante && (
                    <div>
                      <Label htmlFor="filtro-assinante">
                        Buscar {tipoAssinante === 'interno' ? 'Funcionário' : 'Cliente'}
                      </Label>
                      <Input
                        id="filtro-assinante"
                        placeholder={`Buscar por nome, email ou função...`}
                        value={assinanteFilter}
                        onChange={(e) => setAssinanteFilter(e.target.value)}
                      />
                    </div>
                  )}

                  {tipoAssinante && assinanteFilter && (
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        {assinantesFiltrados.length} {tipoAssinante === 'interno' ? 'funcionário(s)' : 'cliente(s)'} encontrado(s)
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Assinantes Disponíveis */}
                {tipoAssinante && assinanteFilter && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      {tipoAssinante === 'interno' ? 'Funcionários' : 'Clientes'} Encontrados:
                    </Label>
                    {assinantesFiltrados.length > 0 ? (
                      <div className="mt-2 max-h-40 overflow-y-auto overflow-x-hidden border rounded-lg">
                        {assinantesFiltrados.map((item) => (
                          <div key={item.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{item.nome || item.name}</div>
                                <div className="text-xs text-gray-500 truncate">{item.email}</div>
                                <div className="text-xs text-gray-400 truncate">{item.cargo || item.role}</div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => {
                                  const novoAssinante = {
                                    userId: item.id.toString(),
                                    ordem: documentoAssinantes.length + 1,
                                    status: 'pendente' as const,
                                    tipo: tipoAssinante as 'interno' | 'cliente',
                                    userInfo: {
                                      id: item.id,
                                      nome: item.nome || item.name,
                                      email: item.email,
                                      cargo: item.cargo,
                                      role: item.role
                                    }
                                  }
                                  setDocumentoAssinantes([...documentoAssinantes, novoAssinante])
                                  setAssinanteFilter('')
                                  setAssinantesFiltrados([])
                                }}
                                disabled={documentoAssinantes.some(a => a.userId === item.id.toString())}
                              >
                                {documentoAssinantes.some(a => a.userId === item.id.toString()) ? 'Adicionado' : 'Adicionar'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 p-3 text-center text-gray-500 text-sm border rounded-lg">
                        Nenhum {tipoAssinante === 'interno' ? 'funcionário' : 'cliente'} encontrado para "{assinanteFilter}"
                      </div>
                    )}
                  </div>
                )}

                {tipoAssinante && !assinanteFilter && (
                  <div className="mt-4 p-3 text-center text-gray-500 text-sm border rounded-lg">
                    Digite um termo de busca para encontrar {tipoAssinante === 'interno' ? 'funcionários' : 'clientes'}
                  </div>
                )}
              </div>

              {/* Lista de Assinantes Adicionados */}
              {documentoAssinantes.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Assinantes Adicionados ({documentoAssinantes.length}):
                  </Label>
                  <div className="space-y-3">
                    {documentoAssinantes.map((assinante, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-white overflow-hidden">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="outline" className="shrink-0">{assinante.ordem}</Badge>
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {assinante.userInfo?.nome || `Usuário ${assinante.userId}`}
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {assinante.tipo === 'interno' ? 'Interno' : 'Cliente'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moverAssinante(index, 'up')}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moverAssinante(index, 'down')}
                              disabled={index === documentoAssinantes.length - 1}
                              title="Mover para baixo"
                            >
                              ↓
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerAssinante(index)}
                              className="text-red-600 hover:text-red-700"
                              title="Remover assinante"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3 truncate">
                          {assinante.userInfo?.email || 'Email não disponível'}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`status-${index}`} className="text-sm font-medium">Status *</Label>
                            <Select 
                              value={assinante.status} 
                              onValueChange={(value) => atualizarAssinante(index, 'status', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="aguardando">Aguardando</SelectItem>
                                <SelectItem value="assinado">Assinado</SelectItem>
                                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`docuSign-${index}`} className="text-sm font-medium">Link DocuSign (Opcional)</Label>
                            <Input
                              id={`docuSign-${index}`}
                              type="url"
                              value={assinante.docuSignLink || ''}
                              onChange={(e) => atualizarAssinante(index, 'docuSignLink', e.target.value)}
                              placeholder="https://..."
                              className="font-mono text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {documentoAssinantes.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum assinante adicionado</p>
                  <p className="text-sm">Use os filtros acima para encontrar e adicionar assinantes</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoDocumentoOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingDocumento || documentoAssinantes.length === 0 || documentoAssinantes.some(a => !a.userId)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmittingDocumento ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Criando Documento...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 mr-2" />
                    Criar Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para criar medição manual */}
      <Dialog open={isCriarMedicaoOpen} onOpenChange={setIsCriarMedicaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Medição Mensal Manual</DialogTitle>
            <DialogDescription>
              Crie uma medição mensal diretamente para esta obra, sem necessidade de orçamento vinculado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periodo">Período (YYYY-MM) *</Label>
                <Input
                  id="periodo"
                  type="text"
                  placeholder="2025-01"
                  value={medicaoFormData.periodo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '')
                    if (value.length <= 7) {
                      setMedicaoFormData({ ...medicaoFormData, periodo: value })
                    }
                  }}
                  pattern="\d{4}-\d{2}"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Formato: YYYY-MM (ex: 2025-01)</p>
              </div>
              
              <div>
                <Label htmlFor="data_medicao">Data da Medição *</Label>
                <Input
                  id="data_medicao"
                  type="date"
                  value={medicaoFormData.data_medicao}
                  onChange={(e) => setMedicaoFormData({ ...medicaoFormData, data_medicao: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="valor_mensal_bruto">Valor Mensal Bruto (R$)</Label>
              <Input
                id="valor_mensal_bruto"
                type="number"
                step="0.01"
                min="0"
                value={medicaoFormData.valor_mensal_bruto}
                onChange={(e) => setMedicaoFormData({ 
                  ...medicaoFormData, 
                  valor_mensal_bruto: parseFloat(e.target.value) || 0 
                })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={medicaoFormData.observacoes}
                onChange={(e) => setMedicaoFormData({ ...medicaoFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a medição..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCriarMedicaoOpen(false)
                setMedicaoFormData({
                  periodo: '',
                  data_medicao: '',
                  valor_mensal_bruto: 0,
                  observacoes: ''
                })
              }}
              disabled={criandoMedicao}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarMedicaoManual}
              disabled={criandoMedicao || !medicaoFormData.periodo || !medicaoFormData.data_medicao}
            >
              {criandoMedicao ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Medição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ObraDetailsPage() {
  return <ObraDetailsPageContent />
}

