"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  BookOpen,
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
  Shield
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
import { EditarSinaleiroDialog } from "@/components/editar-sinaleiro-dialog"
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
import { sinaleirosApi } from "@/lib/api-sinaleiros"
import { DocumentoUpload } from "@/components/documento-upload"
import api from "@/lib/api"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { clientesApi } from "@/lib/api-clientes"
import { ValorMonetarioOculto, ValorFormatadoOculto } from "@/components/valor-oculto"

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
  
  // Estados para edição inline
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [artArquivo, setArtArquivo] = useState<File | null>(null)
  const [apoliceArquivo, setApoliceArquivo] = useState<File | null>(null)
  
  // Função para iniciar edição
  const iniciarEdicao = () => {
    if (!obra) return
    setEditingData({
      nome: obra.name || '',
      descricao: obra.description || '',
      status: obra.status || 'Em Andamento',
      data_inicio: obra.startDate ? new Date(obra.startDate).toISOString().split('T')[0] : '',
      data_fim: obra.endDate ? new Date(obra.endDate).toISOString().split('T')[0] : '',
      orcamento: obra?.budget || 0,
      endereco: obra?.location || '',
      cno: obra?.cno || '',
      art_numero: obra?.art_numero || '',
      apolice_numero: obra?.apolice_numero || '',
      observacoes: obra?.observations || ''
    })
    setIsEditing(true)
  }
  
  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditingData({})
    setArtArquivo(null)
    setApoliceArquivo(null)
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
      const updateData: any = {
        nome: editingData.nome,
        descricao: editingData.descricao,
        status: editingData.status,
        data_inicio: editingData.data_inicio || null,
        data_fim: editingData.data_fim || null,
        orcamento: editingData.orcamento ? parseFloat(editingData.orcamento.toString()) : null,
        endereco: editingData.endereco || null,
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
      
      // Remover campos vazios
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === '' || updateData[key] === undefined) {
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
  
  // Função para carregar sinaleiros reais da API
  const carregarSinaleiros = async () => {
    if (!obraId) return
    
    setLoadingSinaleiros(true)
    try {
      const response = await sinaleirosApi.listarPorObra(parseInt(obraId))
      if (response.success && response.data) {
        // Converter para formato esperado pelo componente
        const sinaleirosConvertidos = response.data.map((s: any) => ({
          id: s.id, // UUID real do banco
          obra_id: s.obra_id,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          cpf: s.rg_cpf, // Assumir que rg_cpf pode ser CPF
          rg: s.rg_cpf, // Assumir que rg_cpf pode ser RG
          telefone: s.telefone || '',
          email: s.email || '',
          tipo: s.tipo, // 'principal' ou 'reserva'
          tipo_vinculo: s.tipo === 'principal' ? 'interno' : 'cliente', // Mapear para compatibilidade
          cliente_informou: s.tipo === 'reserva',
          documentos: [],
          certificados: []
        }))
        setSinaleirosReais(sinaleirosConvertidos)
      }
    } catch (error) {
      console.error('Erro ao carregar sinaleiros:', error)
    } finally {
      setLoadingSinaleiros(false)
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
  const [historicosGruas, setHistoricosGruas] = useState<Record<string, EntradaLivroGruaCompleta[]>>({})
  
  // Estados para funcionários
  const [funcionariosVinculados, setFuncionariosVinculados] = useState<any[]>([])
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)
  const [isAdicionarFuncionarioOpen, setIsAdicionarFuncionarioOpen] = useState(false)
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<any[]>([])
  const [funcionarioSearchValue, setFuncionarioSearchValue] = useState('')
  const [loadingFuncionariosSearch, setLoadingFuncionariosSearch] = useState(false)
  const [novoFuncionarioData, setNovoFuncionarioData] = useState({
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
  
  // Estados para edição de sinaleiro
  const [isEditarSinaleiroOpen, setIsEditarSinaleiroOpen] = useState(false)
  const [sinaleiroSelecionado, setSinaleiroSelecionado] = useState<any>(null)
  const [sinaleirosReais, setSinaleirosReais] = useState<any[]>([])
  const [loadingSinaleiros, setLoadingSinaleiros] = useState(false)

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
      // Fallback para função mockada
      const mesesStrings = gerarMesesDisponiveis()
      const meses = mesesStrings.map(mes => ({
        value: mes,
        label: formatarMes(mes.split('-')[1]) + ' ' + mes.split('-')[0]
      }))
      setMesesDisponiveis(meses)
      setIsNovoMesOpen(true)
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

  // Funções para gerenciar funcionários
  const carregarFuncionariosVinculados = async () => {
    if (!obra) return
    
    try {
      setLoadingFuncionarios(true)
      
      const response = await obrasApi.buscarFuncionariosVinculados(parseInt(obra.id))
      
      if (response.success && response.data) {
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
        const payload = {
          funcionario_id: funcionario.id,
          obra_id: parseInt(obraId),
          data_inicio: novoFuncionarioData.dataInicio || new Date().toISOString().split('T')[0],
          data_fim: novoFuncionarioData.dataFim || undefined,
          observacoes: novoFuncionarioData.observacoes || `Funcionário adicionado à obra ${obra?.name || 'obra'}`
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
      setFuncionariosSelecionados([...funcionariosSelecionados, funcionario])
    }
  }

  const handleRemoverFuncionario = (funcionarioId: string) => {
    setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== funcionarioId))
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
          role: f.cargo,
          email: f.email,
          telefone: f.telefone
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
            
            const gruaConvertida = {
              id: relacao.gruaId || relacao.grua?.id || '',
              relacaoId: relacao.id, // ID da relação grua_obra
              name: gruaData.name || `${gruaData.manufacturer || gruaData.fabricante || 'Grua'} ${gruaData.model || gruaData.modelo || relacao.gruaId || 'N/A'}`,
              modelo: gruaData.model || gruaData.modelo || 'Modelo não informado',
              fabricante: gruaData.manufacturer || gruaData.fabricante || 'Fabricante não informado',
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
          
          // Carregar históricos das gruas
          const historicosCarregados: Record<string, EntradaLivroGruaCompleta[]> = {}
          for (const grua of gruasConvertidas) {
            try {
              const historicoResponse = await livroGruaApi.listarEntradas({ 
                grua_id: grua.id.toString(),
                limit: 5 // Apenas as últimas 5 entradas para exibição rápida
              })
              if (historicoResponse.success && historicoResponse.data) {
                historicosCarregados[grua.id.toString()] = Array.isArray(historicoResponse.data) 
                  ? historicoResponse.data 
                  : [historicoResponse.data]
              }
            } catch (error) {
              console.error(`Erro ao carregar histórico da grua ${grua.id}:`, error)
              historicosCarregados[grua.id.toString()] = []
            }
          }
          setHistoricosGruas(historicosCarregados)
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
        
        // Carregar documentos, arquivos e sinaleiros em paralelo
        await Promise.all([
          carregarDocumentos(),
          carregarArquivos(),
          carregarSinaleiros()
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
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editingData.nome || ''}
                  onChange={(e) => setEditingData({ ...editingData, nome: e.target.value })}
                  className="text-3xl font-bold"
                  placeholder="Nome da obra"
                />
                <Textarea
                  value={editingData.descricao || ''}
                  onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                  className="text-gray-600"
                  placeholder="Descrição da obra"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{obra?.name || ''}</h1>
                <p className="text-gray-600">{obra?.description || ''}</p>
              </>
            )}
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
      <TabsList className="grid w-full grid-cols-10">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="gruas">Gruas</TabsTrigger>
        <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        <TabsTrigger value="custos">Custos</TabsTrigger>
        <TabsTrigger value="complementos">Complementos</TabsTrigger>
        <TabsTrigger value="documentos">Documentos</TabsTrigger>
        <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        <TabsTrigger value="checklists">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Checklists Diários
        </TabsTrigger>
        <TabsTrigger value="manutencoes">
          Manutenções
        </TabsTrigger>
        <TabsTrigger value="livro-grua">
          Livro da Grua
        </TabsTrigger>
      </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="flex flex-col gap-4 w-full" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label className="text-sm text-gray-600">Endereço:</Label>
                    {isEditing ? (
                      <Input
                        value={editingData.endereco || ''}
                        onChange={(e) => setEditingData({ ...editingData, endereco: e.target.value })}
                        placeholder="Endereço da obra"
                      />
                    ) : (
                      <span className="text-sm block mt-1">{obra?.location || 'Não informado'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Responsável:</Label>
                    <span className="text-sm block mt-1">{obra?.responsavelName || 'Não informado'}</span>
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

            {/* Card de Sinaleiros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sinaleiros
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Prioridade: 1) sinaleiros_obra da API /obras/:id, 2) sinaleirosReais carregados separadamente, 3) obra.sinaleiros (fallback)
                  const sinaleirosDaObra = obra?.sinaleiros_obra ? obra.sinaleiros_obra.map((s: any) => ({
                    id: s.id,
                    obra_id: s.obra_id,
                    nome: s.nome,
                    rg_cpf: s.rg_cpf,
                    cpf: s.rg_cpf,
                    rg: s.rg_cpf,
                    telefone: s.telefone || '',
                    email: s.email || '',
                    tipo: s.tipo,
                    tipo_vinculo: s.tipo === 'principal' ? 'interno' : 'cliente',
                    cliente_informou: s.tipo === 'reserva',
                    documentos: [],
                    certificados: []
                  })) : []
                  
                  const sinaleirosDisponiveis = sinaleirosDaObra.length > 0 
                    ? sinaleirosDaObra 
                    : (sinaleirosReais.length > 0 ? sinaleirosReais : (obra?.sinaleiros || []))
                  
                  // Garantir que sempre existam 2 sinaleiros (principal e reserva)
                  const sinaleiroPrincipal = sinaleirosDisponiveis.find((s: any) => s.tipo === 'principal' || s.tipo_vinculo === 'interno')
                  const sinaleiroReserva = sinaleirosDisponiveis.find((s: any) => s.tipo === 'reserva' || s.tipo_vinculo === 'cliente')
                  
                  const sinaleirosParaExibir = [
                    sinaleiroPrincipal || {
                      id: null,
                      nome: 'Não cadastrado',
                      tipo_vinculo: 'interno',
                      tipo: 'principal',
                      cpf: '',
                      rg: '',
                      rg_cpf: '',
                      telefone: '',
                      email: '',
                      documentos: [],
                      certificados: []
                    },
                    sinaleiroReserva || {
                      id: null,
                      nome: 'Não cadastrado',
                      tipo_vinculo: 'cliente',
                      tipo: 'reserva',
                      cpf: '',
                      rg: '',
                      rg_cpf: '',
                      telefone: '',
                      email: '',
                      documentos: [],
                      certificados: []
                    }
                  ]
                  
                  return (
                    <div className="space-y-3">
                      {sinaleirosParaExibir.map((s: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={s.tipo_vinculo === 'interno' ? 'default' : 'outline'} className="text-xs">
                              {s.tipo_vinculo === 'interno' ? 'Interno' : 'Indicado pelo Cliente'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                try {
                                  const sinaleiroFormatado: any = {
                                    id: s.id || null,
                                    obra_id: s.obra_id || parseInt(obraId) || 0,
                                    nome: s.nome || '',
                                    cpf: s.cpf || s.rg_cpf || '',
                                    rg: s.rg || s.rg_cpf || '',
                                    rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
                                    telefone: s.telefone || '',
                                    email: s.email || '',
                                    tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva'),
                                    tipo_vinculo: s.tipo_vinculo || (s.tipo === 'principal' ? 'interno' : 'cliente'),
                                    cliente_informou: s.tipo === 'reserva' || s.tipo_vinculo === 'cliente',
                                    documentos: s.documentos || [],
                                    certificados: s.certificados || []
                                  }
                                  
                                  setSinaleiroSelecionado(sinaleiroFormatado)
                                  setIsEditarSinaleiroOpen(true)
                                } catch (error) {
                                  console.error('Erro ao abrir modal de edição:', error)
                                  toast({
                                    title: "Erro",
                                    description: "Erro ao abrir modal de edição",
                                    variant: "destructive"
                                  })
                                }
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              {s.id ? 'Editar' : 'Cadastrar'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Nome</p>
                              <p className="font-medium text-sm">{s.nome || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">CPF</p>
                              <p className="font-medium text-sm">{s.cpf || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">RG</p>
                              <p className="font-medium text-sm">{s.rg || s.rg_cpf || 'Não informado'}</p>
                            </div>
                            {s.telefone && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Telefone</p>
                                <p className="font-medium text-sm">{s.telefone}</p>
                              </div>
                            )}
                            {s.email && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="font-medium text-sm">{s.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
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
                    const historico = historicosGruas[grua.id?.toString() || ''] || []
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
                        
                        {/* Sinaleiros da Grua */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium text-sm mb-3">Sinaleiros</h4>
                          {(() => {
                            // Prioridade: 1) sinaleiros_obra da API /obras/:id, 2) sinaleirosReais carregados separadamente, 3) obra.sinaleiros (fallback)
                            const sinaleirosDaObra = obra?.sinaleiros_obra ? obra.sinaleiros_obra.map((s: any) => ({
                              id: s.id,
                              obra_id: s.obra_id,
                              nome: s.nome,
                              rg_cpf: s.rg_cpf,
                              cpf: s.rg_cpf,
                              rg: s.rg_cpf,
                              telefone: s.telefone || '',
                              email: s.email || '',
                              tipo: s.tipo,
                              tipo_vinculo: s.tipo === 'principal' ? 'interno' : 'cliente',
                              cliente_informou: s.tipo === 'reserva',
                              documentos: [],
                              certificados: []
                            })) : []
                            
                            const sinaleirosDisponiveis = sinaleirosDaObra.length > 0 
                              ? sinaleirosDaObra 
                              : (sinaleirosReais.length > 0 ? sinaleirosReais : (obra?.sinaleiros || []))
                            
                            // Garantir que sempre existam 2 sinaleiros (principal e reserva)
                            const sinaleiroPrincipal = sinaleirosDisponiveis.find((s: any) => s.tipo === 'principal' || s.tipo_vinculo === 'interno')
                            const sinaleiroReserva = sinaleirosDisponiveis.find((s: any) => s.tipo === 'reserva' || s.tipo_vinculo === 'cliente')
                            
                            const sinaleirosParaExibir = [
                              sinaleiroPrincipal || {
                                id: null, // Sem ID = não salvo no banco
                                nome: 'Não cadastrado',
                                tipo_vinculo: 'interno',
                                tipo: 'principal',
                                cpf: '',
                                rg: '',
                                rg_cpf: '',
                                telefone: '',
                                email: '',
                                documentos: [],
                                certificados: []
                              },
                              sinaleiroReserva || {
                                id: null, // Sem ID = não salvo no banco
                                nome: 'Não cadastrado',
                                tipo_vinculo: 'cliente',
                                tipo: 'reserva',
                                cpf: '',
                                rg: '',
                                rg_cpf: '',
                                telefone: '',
                                email: '',
                                documentos: [],
                                certificados: []
                              }
                            ]
                            
                            return (
                              <div className="space-y-3">
                                {sinaleirosParaExibir.map((s: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant={s.tipo_vinculo === 'interno' ? 'default' : 'outline'} className="text-xs">
                                        {s.tipo_vinculo === 'interno' ? 'Interno' : 'Indicado pelo Cliente'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          try {
                                            // Converter para o formato Sinaleiro esperado pelo componente
                                            const sinaleiroFormatado: any = {
                                              id: s.id || null,
                                              obra_id: s.obra_id || parseInt(obraId) || 0,
                                              nome: s.nome || '',
                                              cpf: s.cpf || s.rg_cpf || '',
                                              rg: s.rg || s.rg_cpf || '',
                                              rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
                                              telefone: s.telefone || '',
                                              email: s.email || '',
                                              tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva'),
                                              tipo_vinculo: s.tipo_vinculo || (s.tipo === 'principal' ? 'interno' : 'cliente'),
                                              cliente_informou: s.tipo === 'reserva' || s.tipo_vinculo === 'cliente',
                                              documentos: s.documentos || [],
                                              certificados: s.certificados || []
                                            }
                                            
                                            setSinaleiroSelecionado(sinaleiroFormatado)
                                            setIsEditarSinaleiroOpen(true)
                                          } catch (error) {
                                            console.error('Erro ao abrir modal de edição:', error)
                                            toast({
                                              title: "Erro",
                                              description: "Erro ao abrir modal de edição",
                                              variant: "destructive"
                                            })
                                          }
                                        }}
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        {s.id ? 'Editar' : 'Cadastrar'}
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Nome</p>
                                        <p className="font-medium text-sm">{s.nome || 'Não informado'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">CPF</p>
                                        <p className="font-medium text-sm">{s.cpf || 'Não informado'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">RG</p>
                                        <p className="font-medium text-sm">{s.rg || s.rg_cpf || 'Não informado'}</p>
                                      </div>
                                      {(s.documentos && s.documentos.length > 0) || (s.certificados && s.certificados.length > 0) ? (
                                        <>
                                          {s.documentos && s.documentos.length > 0 && (
                                            <div className="md:col-span-2">
                                              <p className="text-xs text-gray-500 mb-1">Documentos</p>
                                              <div className="flex flex-wrap gap-1">
                                                {s.documentos.map((doc: any, docIdx: number) => (
                                                  <Badge key={docIdx} variant="outline" className="flex items-center gap-1 text-xs">
                                                    <FileText className="w-3 h-3" />
                                                    {doc.nome || doc.tipo || 'Documento'}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {s.certificados && s.certificados.length > 0 && (
                                            <div className="md:col-span-2">
                                              <p className="text-xs text-gray-500 mb-1">Certificados</p>
                                              <div className="flex flex-wrap gap-1">
                                                {s.certificados.map((cert: any, certIdx: number) => (
                                                  <Badge key={certIdx} variant="outline" className="flex items-center gap-1 text-xs">
                                                    <Shield className="w-3 h-3" />
                                                    {cert.nome || cert.tipo || 'Certificado'}
                                                    {cert.numero && ` - ${cert.numero}`}
                                                    {cert.validade && ` (${new Date(cert.validade).toLocaleDateString('pt-BR')})`}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="md:col-span-2">
                                          <p className="text-xs text-gray-500">Documentos e Certificados: Não informado</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>

                        {/* Histórico da Grua */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-sm">Livro da Grua</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/dashboard/gruas/${grua.id}/livro`}
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              Abrir Livro
                            </Button>
                          </div>
                          {historico.length > 0 ? (
                            <div className="space-y-2">
                              {historico.slice(0, 5).map((entry) => {
                                // Mapear propriedades da API para o formato esperado
                                const status = (entry as any).status_entrada || (entry as any).status || 'ok'
                                const observacoes = entry.observacoes || entry.descricao || 'Sem observações'
                                const data = entry.data_entrada || (entry as any).data || entry.created_at || new Date().toISOString()
                                
                                return (
                                  <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        status === 'ok' ? 'bg-green-500' : 
                                        status === 'falha' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`} />
                                      <span className="text-sm">{observacoes}</span>
                                      {status === 'falha' && (
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(data).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                )
                              })}
                              {historico.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{historico.length - 5} entradas anteriores
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum histórico registrado</p>
                          )}
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
                  Funcionários Vinculados ({funcionariosVinculados.length})
                  {loadingFuncionarios && <InlineLoader size="sm" />}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setIsAdicionarFuncionarioOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Funcionário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFuncionarios ? (
                <CardLoader text="Carregando funcionários vinculados..." />
              ) : funcionariosVinculados.length > 0 ? (
                <div className="space-y-4">
                  {funcionariosVinculados.map((funcionario) => (
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
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário vinculado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui funcionários vinculados.</p>
                  <Button 
                    onClick={() => setIsAdicionarFuncionarioOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Vincular Primeiro Funcionário
                  </Button>
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

        <TabsContent value="custos" className="space-y-4">
          {/* Controles de Mês */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Custos Mensais - {obra?.name || 'Obra'}
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os meses</SelectItem>
                      {getMesesDisponiveisDaAPI().map(mes => (
                        <SelectItem key={mes} value={mes}>
                          {new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportarCustos('geral')}
                    disabled={custosFiltrados.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Geral
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportarCustos('mes')}
                    disabled={custosFiltrados.length === 0 || (mesSelecionado === 'todos' || !mesSelecionado)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Mês
                  </Button>
                  <Button 
                    variant="default"
                    onClick={handleAbrirCustosIniciais}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Custos Iniciais
                  </Button>
                  <Button onClick={handleAbrirNovoMes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Mês
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsNovoCustoOpen(true)}
                    disabled={!mesSelecionado || mesSelecionado === 'todos'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Custo
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Valor Total da Obra</Label>
                  <p className="text-lg font-bold text-blue-600">
                    <ValorMonetarioOculto valor={obra?.valorTotalObra || 0} />
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos do Mês Passado</Label>
                  <p className="text-lg font-bold text-orange-600">
                    <ValorMonetarioOculto valor={gastosMesPassado} />
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos do Mês</Label>
                  <p className="text-lg font-bold text-yellow-600">
                    <ValorMonetarioOculto valor={gastosMesAtual} />
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Saldo Restante</Label>
                  <p className={`text-lg font-bold ${
                    (obra?.orcamento || 0) - totalTodosCustos >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    <ValorMonetarioOculto valor={(obra?.orcamento || 0) - totalTodosCustos} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos Mensais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Custos Mensais {mesSelecionado && mesSelecionado !== 'todos' && `- ${new Date(mesSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
              </CardTitle>
              <CardDescription>
                {custosFiltrados.length > 0 ? `${custosFiltrados.length} itens encontrados` : 'Nenhum custo encontrado para este período'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCustos ? (
                <CardLoader text="Carregando custos mensais..." />
              ) : errorCustos ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-700 mb-2">Erro ao carregar custos</h3>
                  <p className="text-red-600 mb-4">{errorCustos}</p>
                  <Button onClick={() => carregarCustosMensais(obraId)} variant="outline">
                    Tentar novamente
                  </Button>
                </div>
              ) : custosFiltrados.length > 0 ? (
                <div className="space-y-4">
                  {/* Tabela Desktop */}
                  <div className="hidden lg:block overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                          <TableHead className="w-[100px] font-semibold text-blue-900 text-center">Item</TableHead>
                          <TableHead className="min-w-[180px] font-semibold text-blue-900">Descrição</TableHead>
                          <TableHead className="w-[80px] font-semibold text-blue-900 text-center">UND</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Orçamento</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Acumulado Anterior</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Saldo Contrato</TableHead>
                          <TableHead className="w-[100px] font-semibold text-blue-900 text-center">Mês</TableHead>
                          <TableHead className="w-[120px] font-semibold text-blue-900 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {custosFiltrados.map((custo, index) => (
                        <TableRow key={custo.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <TableCell className="font-semibold text-center text-blue-700">
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {custo.item}
                              </Badge>
                              {/* Indicador de status */}
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  custo.valor_acumulado === 0 ? 'bg-gray-400' :
                                  custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'bg-yellow-400' :
                                  custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'bg-blue-400' :
                                  'bg-green-400'
                                }`}></div>
                                <span className="text-xs text-gray-600">
                                  {custo.valor_acumulado === 0 ? 'Não iniciado' :
                                   custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'Iniciado' :
                                   custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'Em andamento' :
                                   'Quase concluído'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">
                            {custo.descricao}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {custo.unidade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                              <div className="text-xs text-blue-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_orcamento)}</div>
                              <div className="text-xs text-blue-600 mb-1">Unit: <ValorFormatadoOculto valor={custo.valor_unitario} formatar={(v) => `R$ ${formatarValor(v)}`} /></div>
                              <div className="text-sm font-bold text-blue-800">Total: <ValorFormatadoOculto valor={custo.total_orcamento} formatar={(v) => `R$ ${formatarValor(v)}`} /></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_acumulada - custo.quantidade_realizada)}</div>
                              <div className="text-sm font-medium text-gray-800"><ValorFormatadoOculto valor={custo.valor_acumulado - custo.valor_realizado} formatar={(v) => `R$ ${formatarValor(v)}`} /></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`p-2 rounded-lg border ${custo.valor_saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="text-xs mb-1">Qtd: {formatarQuantidade(custo.quantidade_saldo)}</div>
                              <div className={`text-sm font-medium ${custo.valor_saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                <ValorFormatadoOculto valor={custo.valor_saldo} formatar={(v) => `R$ ${formatarValor(v)}`} />
                              </div>
                              {/* Barra de progresso */}
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      custo.valor_saldo >= 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, (custo.valor_acumulado / custo.total_orcamento) * 100))}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.round((custo.valor_acumulado / custo.total_orcamento) * 100)}% executado
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                                onClick={() => handleEditarCusto(custo)}
                                title="Editar custo"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                                onClick={() => handleExcluirCusto(custo.id)}
                                title="Excluir custo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                        <TableCell colSpan={3} className="font-bold text-lg text-gray-800 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            TOTAIS (R$)
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-blue-100 p-2 rounded-lg border-2 border-blue-300">
                            <div className="text-sm font-bold text-blue-900">
                              <ValorFormatadoOculto valor={custosMensais.reduce((sum, custo) => sum + custo.total_orcamento, 0)} formatar={(v) => `R$ ${formatarValor(v)}`} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-gray-100 p-2 rounded-lg border-2 border-gray-300">
                            <div className="text-sm font-bold text-gray-900">
                              <ValorFormatadoOculto valor={custosMensais.reduce((sum, custo) => sum + (custo.valor_acumulado - custo.valor_realizado), 0)} formatar={(v) => `R$ ${formatarValor(v)}`} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`p-2 rounded-lg border-2 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                            <div className={`text-sm font-bold ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                              R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Cards Mobile/Tablet */}
                <div className="lg:hidden space-y-4">
                  {custosFiltrados.map((custo, index) => (
                    <Card key={custo.id} className="p-4">
                      <div className="space-y-4">
                        {/* Header do Card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {custo.item}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${
                              custo.valor_acumulado === 0 ? 'bg-gray-400' :
                              custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'bg-yellow-400' :
                              custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'bg-blue-400' :
                              'bg-green-400'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {custo.valor_acumulado === 0 ? 'Não iniciado' :
                               custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'Iniciado' :
                               custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'Em andamento' :
                               'Quase concluído'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                              onClick={() => handleEditarCusto(custo)}
                              title="Editar custo"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              onClick={() => handleExcluirCusto(custo.id)}
                              title="Excluir custo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Descrição */}
                        <div>
                          <p className="font-medium text-gray-800">{custo.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {custo.unidade}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            </Badge>
                          </div>
                        </div>

                        {/* Valores em Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-600 mb-1">Orçamento</div>
                            <div className="text-xs text-blue-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_orcamento)}</div>
                            <div className="text-xs text-blue-600 mb-1">Unit: R$ {formatarValor(custo.valor_unitario)}</div>
                            <div className="text-sm font-bold text-blue-800">Total: R$ {formatarValor(custo.total_orcamento)}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Acumulado Anterior</div>
                            <div className="text-xs text-gray-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_acumulada - custo.quantidade_realizada)}</div>
                            <div className="text-sm font-medium text-gray-800">R$ {formatarValor(custo.valor_acumulado - custo.valor_realizado)}</div>
                          </div>

                        </div>

                        {/* Saldo e Progresso */}
                        <div className={`p-3 rounded-lg border ${custo.valor_saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-xs mb-1">Saldo Contrato</div>
                          <div className="text-xs mb-1">Qtd: {formatarQuantidade(custo.quantidade_saldo)}</div>
                          <div className={`text-sm font-medium mb-2 ${custo.valor_saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            R$ {formatarValor(custo.valor_saldo)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                custo.valor_saldo >= 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, Math.max(0, (custo.valor_acumulado / custo.total_orcamento) * 100))}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((custo.valor_acumulado / custo.total_orcamento) * 100)}% executado
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Resumo Mobile */}
                  <Card className="p-4 bg-gradient-to-r from-gray-100 to-gray-200">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-bold text-lg text-gray-800">TOTAIS (R$)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-300">
                        <div className="text-blue-600 font-medium mb-1">Orçamento</div>
                        <div className="font-bold text-blue-900">
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.total_orcamento, 0))}
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-medium mb-1">Acumulado Anterior</div>
                        <div className="font-bold text-gray-900">
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + (custo.valor_acumulado - custo.valor_realizado), 0))}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border-2 col-span-2 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                        <div className={`font-medium mb-1 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>Saldo Contrato</div>
                        <div className={`font-bold ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum custo encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    {mesSelecionado && mesSelecionado !== 'todos'
                      ? `Não há custos registrados para ${new Date(mesSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                      : 'Esta obra ainda não possui custos mensais registrados.'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleAbrirCustosIniciais} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Custos Iniciais
                    </Button>
                    <Button onClick={handleAbrirNovoMes} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Mês
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
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
        </TabsContent>

        {/* Aba: Arquivos */}
        <TabsContent value="arquivos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Arquivos Adicionais
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsNovoArquivoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Arquivo
                  </Button>
                  <Button 
                    type="button"
                    size="sm"
                    onClick={() => setIsNovoDocumentoOpen(true)}
                  >
                    <FileSignature className="w-4 h-4 mr-2" />
                    Novo Documento
                  </Button>
                </div>
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
            <div className="space-y-4">
              {gruasVinculadas.map((grua) => (
                <Card key={grua.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {grua.name}
                    </CardTitle>
                    <CardDescription>
                      {grua.fabricante} {grua.modelo} - {grua.capacidade}
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
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">
                    Esta obra ainda não possui gruas vinculadas para exibir checklists diários.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Manutenções */}
        <TabsContent value="manutencoes" className="space-y-4">
          {gruasVinculadas.length > 0 ? (
            <div className="space-y-4">
              {gruasVinculadas.map((grua) => (
                <Card key={grua.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {grua.name}
                    </CardTitle>
                    <CardDescription>
                      {grua.fabricante} {grua.modelo} - {grua.capacidade}
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
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">
                    Esta obra ainda não possui gruas vinculadas para exibir manutenções.
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
                        <div>
                          <p className="font-medium">{funcionario.name}</p>
                          <p className="text-sm text-gray-600">{funcionario.role}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoverFuncionario(funcionario.id)}
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
          <LivroGruaChecklistDiario
            gruaId={gruaSelecionadaChecklist}
            onSave={handleSucessoChecklist}
            onCancel={() => setIsNovoChecklistOpen(false)}
          />
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

      {/* Modal Editar Sinaleiro */}
      <EditarSinaleiroDialog
        open={isEditarSinaleiroOpen}
        onOpenChange={setIsEditarSinaleiroOpen}
        sinaleiro={sinaleiroSelecionado}
        obraId={parseInt(obraId)}
        onSave={async (sinaleiroAtualizado) => {
          // Atualizar o sinaleiro na obra
          if (obra) {
            const sinaleirosAtualizados = obra?.sinaleiros?.map((s: any) => 
              s.id === sinaleiroAtualizado.id ? sinaleiroAtualizado : s
            ) || [sinaleiroAtualizado]
            
            // Atualizar obra localmente (em produção, isso seria feito via API)
            // obra.sinaleiros = sinaleirosAtualizados
          }
          
          toast({
            title: "Sucesso",
            description: "Sinaleiro atualizado com sucesso"
          })
          
          // Recarregar a obra e sinaleiros para atualizar os dados
          if (obraId) {
            await Promise.all([
              carregarObra(obraId),
              carregarSinaleiros()
            ])
          }
        }}
        readOnly={false}
      />

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
    </div>
  )
}

export default function ObraDetailsPage() {
  return <ObraDetailsPageContent />
}

