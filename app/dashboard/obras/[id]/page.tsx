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
import { apiComponentes, ComponenteGrua } from "@/lib/api-componentes"

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
  
  // Estados para devolução de componentes
  const [componentesDevolucao, setComponentesDevolucao] = useState<Array<ComponenteGrua & { grua_nome?: string }>>([])
  const [loadingComponentesDevolucao, setLoadingComponentesDevolucao] = useState(false)
  const [devolucoes, setDevolucoes] = useState<Record<number, {
    tipo: 'completa' | 'parcial' | null
    quantidade_devolvida?: number
    valor?: number
    observacoes?: string
  }>>({})
  const [processandoDevolucao, setProcessandoDevolucao] = useState(false)
  
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
    // Carregar funcionários quando abrir o modal
    carregarFuncionariosParaSelect()
  }

  // Carregar funcionários para os selects do modal de nova entrada
  const carregarFuncionariosParaSelect = async () => {
    try {
      const response = await funcionariosApi.listarFuncionarios({
        limit: 1000,
        status: 'Ativo'
      })
      
      if (response.success && response.data) {
        // Converter para formato esperado
        const funcionariosFormatados = response.data.map((f: any) => ({
          id: f.id,
          nome: f.nome,
          name: f.nome, // Para compatibilidade
          cargo: f.cargo_info?.nome || f.cargo || 'Sem cargo',
          cargo_info: f.cargo_info
        }))
        setFuncionariosDisponiveis(funcionariosFormatados)
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      setFuncionariosDisponiveis([])
    }
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
        // Supervisor não é mais um cargo, é uma atribuição. Qualquer funcionário pode ser supervisor.
        // Filtrar apenas funcionários já vinculados à obra
        const funcionariosVinculadosIds = funcionariosVinculados
          .filter((func: any) => isSupervisor(func))
          .map((func: any) => {
            // Tentar diferentes campos possíveis
            return func.funcionarioId || 
                   func.funcionario_id || 
                   func.userId || 
                   parseInt(func.id)
          })
        
        // Mostrar todos os funcionários ativos (qualquer um pode ser designado como supervisor)
        const supervisoresFiltrados = response.data.filter((f: any) => {
          return !funcionariosVinculadosIds.includes(f.id) &&
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
        setFuncionariosDisponiveis(funcionariosFiltrados)
      }
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error)
      setFuncionariosDisponiveis([])
    } finally {
      setLoadingFuncionariosSearch(false)
    }
  }

  // TODO: Adicionar return com JSX do componente
  return null
}

export default function ObraDetailsPage() {
  return <ObraDetailsPageContent />
}