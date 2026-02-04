"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
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
  XCircle,
  Check,
  Loader2,
  Settings
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
import { createFuncionarioObra, deleteFuncionarioObra, updateFuncionarioObra } from "@/lib/api-funcionarios-obras"
import { PageLoader, CardLoader, InlineLoader } from "@/components/ui/loader"
import { AlertCircle, Package as PackageIcon } from "lucide-react"
import GruaSearch from "@/components/grua-search"
import { gruasApi, converterGruaBackendParaFrontend } from "@/lib/api-gruas"
import { obraGruasApi } from "@/lib/api-obra-gruas"
import { useObraStore } from "@/lib/obra-store"
import { DocumentoUpload } from "@/components/documento-upload"
import api, { fetchWithAuth, buildApiUrl } from "@/lib/api"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { clientesApi } from "@/lib/api-clientes"
import { ValorMonetarioOculto, ValorFormatadoOculto } from "@/components/valor-oculto"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { medicoesUtils } from "@/lib/medicoes-utils"
import { getOrcamentos } from "@/lib/api-orcamentos"
import FuncionarioSearch from "@/components/funcionario-search"
import { sinaleirosApi, type SinaleiroBackend, type DocumentoSinaleiroBackend } from "@/lib/api-sinaleiros"
import { apiComponentes, ComponenteGrua } from "@/lib/api-componentes"
import { responsavelTecnicoApi } from "@/lib/api-responsavel-tecnico"
import { ResponsavelTecnicoData } from "@/components/responsavel-tecnico-form"

function ObraDetailsPageContent() {

  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const obraId = params.id as string

  // Função para formatar data no formato YYYY-MM-DD para DD/MM/YYYY sem problemas de timezone
  const formatarDataSemTimezone = (dataString: string | null | undefined): string => {
    if (!dataString) return 'Não informado'
    
    // Se já estiver no formato DD/MM/YYYY, retornar como está
    if (dataString.includes('/')) {
      return dataString
    }
    
    // Se estiver no formato YYYY-MM-DD, formatar diretamente sem usar Date
    if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dataString.split('-')
      return `${dia}/${mes}/${ano}`
    }
    
    // Caso contrário, tentar usar Date com UTC para evitar problemas de timezone
    try {
      const date = new Date(dataString + 'T00:00:00')
      if (!isNaN(date.getTime())) {
        const dia = String(date.getUTCDate()).padStart(2, '0')
        const mes = String(date.getUTCMonth() + 1).padStart(2, '0')
        const ano = date.getUTCFullYear()
        return `${dia}/${mes}/${ano}`
      }
    } catch {
      return dataString
    }
    
    return dataString
  }
  
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
  const [documentosAdicionaisEquipamento, setDocumentosAdicionaisEquipamento] = useState<{
    manual_tecnico?: any
    termo_entrega_tecnica?: any
    plano_carga?: any
    aterramento?: any
  }>({})
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [loadingDocumentosAdicionais, setLoadingDocumentosAdicionais] = useState(false)
  const documentosAdicionaisCarregadosRef = useRef(false)
  const obraCarregadaRef = useRef<string | null>(null)
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
  
  // Estados para modais de atrelar sinaleiros
  const [isModalFuncionarioOpen, setIsModalFuncionarioOpen] = useState(false)
  const [isModalTerceirizadoOpen, setIsModalTerceirizadoOpen] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<any>(null)
  const [tipoSinaleiroFuncionario, setTipoSinaleiroFuncionario] = useState<'principal' | 'reserva'>('principal')
  const [tipoSinaleiroTerceirizado, setTipoSinaleiroTerceirizado] = useState<'principal' | 'reserva'>('principal')
  const [dadosTerceirizado, setDadosTerceirizado] = useState({
    nome: '',
    rg_cpf: '',
    telefone: '',
    email: ''
  })
  const [salvandoSinaleiro, setSalvandoSinaleiro] = useState(false)
  
  // Estado para responsáveis técnicos adicionais dinâmicos
  const [responsaveisAdicionais, setResponsaveisAdicionais] = useState<Array<ResponsavelTecnicoData & { tipo?: string; area?: string }>>([])
  const [responsaveisTecnicosExistentes, setResponsaveisTecnicosExistentes] = useState<any[]>([])
  const [loadingResponsaveisTecnicos, setLoadingResponsaveisTecnicos] = useState(false)
  
  // Estados para devolução de componentes
  const [componentesDevolucao, setComponentesDevolucao] = useState<Array<ComponenteGrua & { grua_nome?: string }>>([])
  const [loadingComponentesDevolucao, setLoadingComponentesDevolucao] = useState(false)
  const componentesDevolucaoCarregadosRef = useRef(false)
  
  // Refs para rastrear se os dados já foram carregados (evita loops quando arrays estão vazios)
  const medicoesCarregadasRef = useRef(false)
  const sinaleirosCarregadosRef = useRef(false)
  const gruasCarregadasRef = useRef<string | null>(null)
  const funcionariosCarregadosRef = useRef<string | null>(null)
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
  const [cnoArquivo, setCnoArquivo] = useState<File | null>(null)
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
    setCnoArquivo(null)
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
      let cnoArquivoUrl = obra?.cno_arquivo || ''
      
      // 1. Fazer upload dos arquivos ART, Apólice e CNO se houver novos arquivos
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
      
      if (cnoArquivo) {
        try {
          const formDataCno = new FormData()
          formDataCno.append('arquivo', cnoArquivo)
          formDataCno.append('categoria', 'cno')
          
          const uploadCnoResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataCno
          })
          
          if (uploadCnoResponse.ok) {
            const uploadCnoResult = await uploadCnoResponse.json()
            cnoArquivoUrl = uploadCnoResult.data?.caminho || uploadCnoResult.data?.arquivo || ''
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload do CNO:', uploadError)
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
      if (cnoArquivoUrl) {
        updateData.cno_arquivo = cnoArquivoUrl
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
        
        // Salvar responsáveis técnicos adicionais dinâmicos
        if (responsaveisAdicionais && responsaveisAdicionais.length > 0) {
          const responsaveisValidos = responsaveisAdicionais.filter(rt => rt.nome && rt.cpf_cnpj)
          
          for (const responsavel of responsaveisValidos) {
            try {
              const payload: any = {
                nome: responsavel.nome,
                cpf_cnpj: responsavel.cpf_cnpj,
                tipo: 'adicional'
              }
              if (responsavel.crea) payload.crea = responsavel.crea
              if (responsavel.email) payload.email = responsavel.email
              if (responsavel.telefone) payload.telefone = responsavel.telefone
              // Incluir área no nome se fornecida (formato: "Nome - Área")
              if (responsavel.area) {
                payload.nome = `${responsavel.nome} - ${responsavel.area}`
              }

              await responsavelTecnicoApi.criarOuAtualizar(parseInt(obraId), payload)
            } catch (error) {
              console.error('Erro ao salvar responsável técnico adicional:', error)
              toast({
                title: "Aviso",
                description: `Obra atualizada, mas houve erro ao salvar um responsável técnico adicional. Você pode tentar novamente depois.`,
                variant: "default"
              })
            }
          }
        }
        
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
  
  // Função para carregar todos os responsáveis técnicos
  const carregarTodosResponsaveisTecnicos = async () => {
    if (!obraId) return
    
    setLoadingResponsaveisTecnicos(true)
    try {
      const response = await responsavelTecnicoApi.listarPorObra(parseInt(obraId))
      
      if (response.success && response.data) {
        // Separar responsáveis adicionais dos outros
        const todosResponsaveis = response.data || []
        
        // Filtrar apenas responsáveis do tipo 'adicional' para edição
        const responsaveisAdicionaisData = todosResponsaveis
          .filter((rt: any) => rt.tipo === 'adicional')
          .map((rt: any) => {
            // Separar área do nome se estiver no formato "Nome - Área"
            let nome = rt.nome || ''
            let area = ''
            if (nome.includes(' - ')) {
              const partes = nome.split(' - ')
              nome = partes[0]
              area = partes.slice(1).join(' - ')
            }
            
            return {
              nome: nome,
              cpf_cnpj: rt.cpf_cnpj || '',
              crea: rt.crea || '',
              email: rt.email || '',
              telefone: rt.telefone || '',
              area: area,
              tipo: 'adicional'
            }
          })
        
        setResponsaveisAdicionais(responsaveisAdicionaisData)
        setResponsaveisTecnicosExistentes(todosResponsaveis)
      } else {
        setResponsaveisTecnicosExistentes([])
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis técnicos:', error)
      setResponsaveisTecnicosExistentes([])
    } finally {
      setLoadingResponsaveisTecnicos(false)
    }
  }

  // Função para carregar responsáveis técnicos adicionais (mantida para compatibilidade)
  const carregarResponsaveisAdicionais = carregarTodosResponsaveisTecnicos

  // Função para carregar sinaleiros da obra
  const carregarSinaleiros = async () => {
    if (!obraId) return
    
    setLoadingSinaleiros(true)
    setErrorSinaleiros(null)
    try {
      const response = await sinaleirosApi.listarPorObra(parseInt(obraId))
      
      if (response.success) {
        const sinaleirosData = response.data || []
        setSinaleiros(sinaleirosData)
        
        // Carregar documentos de cada sinaleiro
        const documentosMap: Record<string, DocumentoSinaleiroBackend[]> = {}
        for (const sinaleiro of sinaleirosData) {
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
        sinaleirosCarregadosRef.current = true // Marcar como carregado (mesmo que vazio)
      } else {
        sinaleirosCarregadosRef.current = true // Marcar como carregado mesmo em caso de erro
      }
    } catch (error: any) {
      console.error('Erro ao carregar sinaleiros:', error)
      setErrorSinaleiros(error.message || 'Erro ao carregar sinaleiros')
      sinaleirosCarregadosRef.current = true // Marcar como carregado mesmo em caso de erro
    } finally {
      setLoadingSinaleiros(false)
    }
  }

  // Função para atrelar funcionário como sinaleiro
  const handleAtrelarFuncionarioSinaleiro = async () => {
    if (!funcionarioSelecionado || !obraId) {
      toast({
        title: "Erro",
        description: "Selecione um funcionário para atrelar como sinaleiro",
        variant: "destructive"
      })
      return
    }

    setSalvandoSinaleiro(true)
    try {
      // Buscar dados completos do funcionário para obter CPF/RG
      let funcionario: any = null
      try {
        const funcionarioCompleto = await funcionariosApi.obterFuncionario(parseInt(funcionarioSelecionado.id))
        if (funcionarioCompleto.success && funcionarioCompleto.data) {
          funcionario = funcionarioCompleto.data
        }
      } catch (error) {
        console.warn('Erro ao buscar dados completos do funcionário, usando dados da seleção:', error)
      }

      // Usar dados do funcionário completo ou da seleção
      const nome = funcionario?.nome || funcionarioSelecionado.name || ''
      const rgCpf = funcionario?.cpf || funcionario?.rg || funcionarioSelecionado.cpf || funcionarioSelecionado.rg || ''

      if (!rgCpf) {
        toast({
          title: "Erro",
          description: "O funcionário selecionado não possui CPF/RG cadastrado. Por favor, cadastre o CPF/RG do funcionário antes de atrelá-lo como sinaleiro.",
          variant: "destructive"
        })
        setSalvandoSinaleiro(false)
        return
      }

      // Criar sinaleiro a partir do funcionário
      const sinaleiroData = {
        nome: nome,
        rg_cpf: rgCpf,
        telefone: funcionario?.telefone || funcionarioSelecionado.phone || '',
        email: funcionario?.email || funcionarioSelecionado.email || '',
        tipo: tipoSinaleiroFuncionario
      }

      const response = await sinaleirosApi.criarOuAtualizar(parseInt(obraId), [sinaleiroData])

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário atrelado como sinaleiro com sucesso!"
        })
        setIsModalFuncionarioOpen(false)
        setFuncionarioSelecionado(null)
        await carregarSinaleiros()
      } else {
        throw new Error("Erro ao criar sinaleiro")
      }
    } catch (error: any) {
      console.error('Erro ao atrelar funcionário como sinaleiro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atrelar funcionário como sinaleiro",
        variant: "destructive"
      })
    } finally {
      setSalvandoSinaleiro(false)
    }
  }

  // Função para atrelar terceirizado como sinaleiro
  const handleAtrelarTerceirizadoSinaleiro = async () => {
    if (!obraId) return

    if (!dadosTerceirizado.nome || !dadosTerceirizado.rg_cpf) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o nome e RG/CPF do terceirizado",
        variant: "destructive"
      })
      return
    }

    setSalvandoSinaleiro(true)
    try {
      const sinaleiroData = {
        nome: dadosTerceirizado.nome,
        rg_cpf: dadosTerceirizado.rg_cpf,
        telefone: dadosTerceirizado.telefone || '',
        email: dadosTerceirizado.email || '',
        tipo: tipoSinaleiroTerceirizado
      }

      const response = await sinaleirosApi.criarOuAtualizar(parseInt(obraId), [sinaleiroData])

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Terceirizado atrelado como sinaleiro com sucesso!"
        })
        setIsModalTerceirizadoOpen(false)
        setDadosTerceirizado({
          nome: '',
          rg_cpf: '',
          telefone: '',
          email: ''
        })
        await carregarSinaleiros()
      } else {
        throw new Error("Erro ao criar sinaleiro")
      }
    } catch (error: any) {
      console.error('Erro ao atrelar terceirizado como sinaleiro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atrelar terceirizado como sinaleiro",
        variant: "destructive"
      })
    } finally {
      setSalvandoSinaleiro(false)
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
        medicoesCarregadasRef.current = true // Marcar como carregado (mesmo que vazio)
      } else {
        setErrorMedicoes('Erro ao carregar medições')
        medicoesCarregadasRef.current = true // Marcar como carregado mesmo em caso de erro
      }
    } catch (error: any) {
      console.error('Erro ao carregar medições mensais:', error)
      setErrorMedicoes(error.message || 'Erro ao carregar medições mensais')
      medicoesCarregadasRef.current = true // Marcar como carregado mesmo em caso de erro
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
      errorMessage = errorMessage.replace(/(\d{4}-\d{2})/g, (match: string) => {
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

  const carregarDocumentosAdicionaisEquipamento = async () => {
    if (!obraId) {
      console.log('⚠️ [Documentos Adicionais] obraId não encontrado')
      setLoadingDocumentosAdicionais(false)
      return
    }
    
    // Evitar carregamento duplicado apenas se já foi carregado para este obraId
    if (documentosAdicionaisCarregadosRef.current && obraCarregadaRef.current === obraId) {
      console.log('⚠️ [Documentos Adicionais] Já carregado para esta obra, pulando...')
      setLoadingDocumentosAdicionais(false)
      return
    }
    
    console.log('🔍 [Documentos Adicionais] Iniciando carregamento para obra:', obraId)
    documentosAdicionaisCarregadosRef.current = true
    setLoadingDocumentosAdicionais(true)
    
    try {
      const categorias = ['manual_tecnico', 'termo_entrega_tecnica', 'plano_carga', 'aterramento']
      const documentos: any = {}
      
      // Função auxiliar para fazer requisição com timeout
      const fetchWithTimeout = async (endpoint: string, timeoutMs = 10000): Promise<Response> => {
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
        })
        
        // Usar buildApiUrl para construir a URL corretamente
        const url = buildApiUrl(endpoint)
        console.log(`📡 [Documentos Adicionais] URL construída:`, url)
        
        return Promise.race([
          fetchWithAuth(url, {
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          timeoutPromise
        ])
      }
      
      // Usar Promise.allSettled para garantir que todas as requisições sejam processadas
      const resultados = await Promise.allSettled(
        categorias.map(async (categoria) => {
          try {
            const endpoint = `arquivos/obra/${obraId}?categoria=${categoria}`
            console.log(`📡 [Documentos Adicionais] Buscando ${categoria} no endpoint:`, endpoint)
            
            const response = await fetchWithTimeout(endpoint, 10000) // Timeout de 10 segundos
            
            if (response.ok) {
              const data = await response.json()
              console.log(`✅ [Documentos Adicionais] Resposta para ${categoria}:`, data)
              if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
                return { categoria, documento: data.data[0] }
              } else {
                console.log(`⚠️ [Documentos Adicionais] ${categoria} não encontrado ou vazio`)
                return { categoria, documento: null }
              }
            } else {
              console.error(`❌ [Documentos Adicionais] Erro na resposta para ${categoria}:`, response.status, response.statusText)
              return { categoria, documento: null }
            }
          } catch (error: any) {
            console.error(`❌ [Documentos Adicionais] Erro ao carregar ${categoria}:`, error)
            return { categoria, documento: null }
          }
        })
      )
      
      // Processar resultados
      resultados.forEach((resultado, index) => {
        if (resultado.status === 'fulfilled' && resultado.value.documento) {
          documentos[resultado.value.categoria] = resultado.value.documento
        } else if (resultado.status === 'rejected') {
          console.error(`❌ [Documentos Adicionais] Requisição rejeitada para ${categorias[index]}:`, resultado.reason)
        }
      })
      
      console.log('📦 [Documentos Adicionais] Documentos carregados:', documentos)
      setDocumentosAdicionaisEquipamento(documentos)
    } catch (error) {
      console.error('❌ [Documentos Adicionais] Erro ao carregar documentos adicionais:', error)
      setDocumentosAdicionaisEquipamento({}) // Definir objeto vazio em caso de erro
      documentosAdicionaisCarregadosRef.current = false // Resetar em caso de erro
    } finally {
      setLoadingDocumentosAdicionais(false)
    }
  }
  
  // Estados locais que não estão no store
  const [gruasReais, setGruasReais] = useState<any[]>([])
  const [loadingGruas, setLoadingGruas] = useState(false)
  
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
  
  // Estados para valores - agora no store
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

  // Funções para valores
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


  // Funções para gerenciar funcionários
  const carregarFuncionariosVinculados = async () => {
    if (!obra) {
      console.log('⚠️ [Funcionários] Obra não encontrada')
      return
    }
    
    try {
      setLoadingFuncionarios(true)
      
      console.log('🔍 [Funcionários] Carregando funcionários para obra:', obra.id)
      const response = await obrasApi.buscarFuncionariosVinculados(parseInt(obra.id))
      
      console.log('📋 [Funcionários] Resposta da API:', response)
      
      if (response.success && response.data) {
        console.log('✅ [Funcionários] Funcionários carregados:', response.data.length)
        setFuncionariosVinculados(response.data)
      } else {
        console.log('⚠️ [Funcionários] Nenhum funcionário encontrado ou erro na resposta')
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
          is_supervisor: false, // Funcionários não são supervisores
          observacoes: novoFuncionarioData.observacoes || `Funcionário ${funcionario.name} adicionado à obra ${obra?.name || 'obra'}`
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
          role: f.cargo_info?.nome || f.cargo || 'Cargo não informado',
          email: f.email,
          telefone: f.telefone,
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
  // Função para carregar componentes das gruas vinculadas
  const carregarComponentesDevolucao = async () => {
    if (!obraId) return
    
    setLoadingComponentesDevolucao(true)
    try {
      // Buscar todas as gruas vinculadas à obra
      const gruasResponse = await obraGruasApi.listarGruasObra(parseInt(obraId))
      const gruas = gruasResponse.data || []
      
      // Buscar componentes de cada grua
      const todosComponentes: Array<ComponenteGrua & { grua_nome?: string }> = []
      
      for (const grua of gruas) {
        const gruaId = grua.grua?.id || grua.grua_id || String(grua.id)
        if (!gruaId) continue
        
        try {
          const componentesResponse = await apiComponentes.buscarPorGrua(gruaId.toString(), {
            page: 1,
            limit: 100
          })
          
          const componentes = componentesResponse.data || []
          componentes.forEach((comp: ComponenteGrua) => {
            todosComponentes.push({
              ...comp,
              grua_id: gruaId.toString(),
              grua_nome: grua.grua?.name || grua.grua?.modelo || `Grua ${gruaId}`
            })
          })
        } catch (error) {
          console.error(`Erro ao buscar componentes da grua ${gruaId}:`, error)
        }
      }
      
      // Filtrar apenas componentes que estão em uso (quantidade_em_uso > 0)
      const componentesEmUso = todosComponentes.filter(comp => comp.quantidade_em_uso > 0)
      
      setComponentesDevolucao(componentesEmUso)
    } catch (error: any) {
      console.error('Erro ao carregar componentes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar componentes das gruas",
        variant: "destructive"
      })
    } finally {
      setLoadingComponentesDevolucao(false)
    }
  }

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
    // Evitar carregamento duplicado para o mesmo obraId
    if (obraCarregadaRef.current === obraId) {
      return
    }
    
    // Resetar flag de carregamento quando obraId mudar
    documentosAdicionaisCarregadosRef.current = false
    obraCarregadaRef.current = obraId
    
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      if (isAuth) {
        await carregarObra(obraId)
        
        // Carregar documentos e arquivos em paralelo
        await Promise.all([
          carregarDocumentos(),
          carregarArquivos(),
          carregarDocumentosAdicionaisEquipamento(),
          carregarTodosResponsaveisTecnicos(),
          carregarSinaleiros()
        ])
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId])


  // Carregar gruas quando a obra for carregada
  useEffect(() => {
    if (obra?.id && gruasCarregadasRef.current !== obra.id) {
      gruasCarregadasRef.current = obra.id
      carregarGruasVinculadas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obra?.id])

  // Carregar funcionários quando a obra for carregada
  useEffect(() => {
    if (obra?.id && funcionariosCarregadosRef.current !== obra.id) {
      funcionariosCarregadosRef.current = obra.id
      carregarFuncionariosVinculados()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obra?.id])


  // Definir mês padrão após carregar custos
  useEffect(() => {
    if (custosMensais && custosMensais.length > 0 && !mesSelecionado) {
      // Obter todos os meses disponíveis e ordenar
      const mesesDisponiveis = [...new Set(custosMensais.map(custo => custo.mes))].sort()
      // Definir o último mês como padrão apenas se não houver mês selecionado
      const ultimoMes = mesesDisponiveis[mesesDisponiveis.length - 1]
      if (ultimoMes) {
        setMesSelecionado(ultimoMes)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custosMensais])

  // Resetar flags quando a obra mudar
  useEffect(() => {
    medicoesCarregadasRef.current = false
    sinaleirosCarregadosRef.current = false
    gruasCarregadasRef.current = null
    funcionariosCarregadosRef.current = null
  }, [obraId])

  // Carregar medições mensais quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'medicoes-mensais' && obra?.id && !loadingMedicoes && !medicoesCarregadasRef.current) {
      medicoesCarregadasRef.current = true // Marcar antes para evitar chamadas múltiplas
      carregarMedicoesMensais()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, obra?.id, loadingMedicoes])

  // Carregar sinaleiros quando a aba de funcionários for ativada (onde os sinaleiros são exibidos)
  useEffect(() => {
    if (activeTab === 'funcionarios' && obra?.id && !loadingSinaleiros && !sinaleirosCarregadosRef.current) {
      sinaleirosCarregadosRef.current = true // Marcar antes para evitar chamadas múltiplas
      carregarSinaleiros()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, obra?.id, loadingSinaleiros])
  
  // Carregar componentes para devolução quando a aba for ativada

// Carregar componentes para devolução quando a aba de gruas for ativada
useEffect(() => {
  // Resetar flag quando mudar de aba ou obra
  if (activeTab !== 'gruas' || !obraId) {
    componentesDevolucaoCarregadosRef.current = false
    return
  }
  
  // Carregar apenas uma vez quando a aba for ativada
  if (activeTab === 'gruas' && obraId && !loadingComponentesDevolucao && !componentesDevolucaoCarregadosRef.current) {
    componentesDevolucaoCarregadosRef.current = true
    carregarComponentesDevolucao();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, obraId, loadingComponentesDevolucao]);
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
      <TabsList className="flex w-full gap-1 p-1 h-auto justify-start overflow-x-auto">
        <TabsTrigger value="geral" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">Geral</TabsTrigger>
        <TabsTrigger value="gruas" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">Gruas</TabsTrigger>
        <TabsTrigger value="funcionarios" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">Funcionários</TabsTrigger>
        <TabsTrigger value="medicoes-mensais" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">
          Medições Mensais
        </TabsTrigger>
        <TabsTrigger value="documentos" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">Arquivos</TabsTrigger>
        <TabsTrigger value="livro-grua" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">
          Livro da Grua
        </TabsTrigger>
        <TabsTrigger value="checklists" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Checklists e Manutenções
        </TabsTrigger>
        <TabsTrigger value="complementos" className="px-4 flex-1 min-w-[120px] whitespace-nowrap">Complementos</TabsTrigger>
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
                      <span className="text-sm block mt-1">{formatarDataSemTimezone(obra?.startDate)}</span>
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
                      <span className="text-sm block mt-1">{obra?.endDate ? formatarDataSemTimezone(obra.endDate) : 'Em andamento'}</span>
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
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">CNO:</Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingData.cno || ''}
                        onChange={(e) => setEditingData({ ...editingData, cno: e.target.value })}
                        placeholder="Número do CNO"
                        className="mt-1"
                      />
                      <DocumentoUpload
                        label="Upload do Documento CNO (PDF)"
                        accept="application/pdf"
                        maxSize={10 * 1024 * 1024} // 10MB
                        onUpload={(file) => setCnoArquivo(file)}
                        onRemove={() => setCnoArquivo(null)}
                        currentFile={cnoArquivo}
                        fileUrl={obra?.cno_arquivo || null}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mt-1">
                        {obra?.cno ? (
                          <span className="text-sm">{obra.cno}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Não informado</span>
                        )}
                      </div>
                      {obra?.cno_arquivo && (
                        <div className="flex justify-end mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                // Gerar URL assinada usando o endpoint do backend
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.cno_arquivo || '')}`, {
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
                                console.error('Erro ao baixar CNO:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo do CNO",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar CNO
                          </Button>
                        </div>
                      )}
                    </>
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

            {/* Documentos Adicionais do Equipamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos Adicionais do Equipamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingDocumentosAdicionais ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Carregando documentos...</span>
                  </div>
                ) : (
                  <>
                    {/* Debug: Mostrar estado atual */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-400 mb-2">
                        Debug: {JSON.stringify(Object.keys(documentosAdicionaisEquipamento))}
                      </div>
                    )}
                    {/* Manual Técnico */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Manual Técnico do Equipamento</Label>
                      {documentosAdicionaisEquipamento.manual_tecnico ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{documentosAdicionaisEquipamento.manual_tecnico.nome_original}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.manual_tecnico.caminho)}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  }
                                }
                              } catch (error) {
                                console.error('Erro ao baixar Manual Técnico:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar Manual Técnico
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Não informado</span>
                      )}
                    </div>

                    {/* Termo de Entrega Técnica */}
                    <div className="space-y-3 border-t pt-3">
                      <Label className="text-sm font-medium text-gray-700">Termo de Entrega Técnica</Label>
                      {documentosAdicionaisEquipamento.termo_entrega_tecnica ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{documentosAdicionaisEquipamento.termo_entrega_tecnica.nome_original}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.termo_entrega_tecnica.caminho)}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  }
                                }
                              } catch (error) {
                                console.error('Erro ao baixar Termo de Entrega:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar Termo de Entrega
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Não informado</span>
                      )}
                    </div>

                    {/* Plano de Carga */}
                    <div className="space-y-3 border-t pt-3">
                      <Label className="text-sm font-medium text-gray-700">Plano de Carga</Label>
                      {documentosAdicionaisEquipamento.plano_carga ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{documentosAdicionaisEquipamento.plano_carga.nome_original}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.plano_carga.caminho)}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  }
                                }
                              } catch (error) {
                                console.error('Erro ao baixar Plano de Carga:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar Plano de Carga
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Não informado</span>
                      )}
                    </div>

                    {/* Documento de Aterramento */}
                    <div className="space-y-3 border-t pt-3">
                      <Label className="text-sm font-medium text-gray-700">Documento de Aterramento</Label>
                      {documentosAdicionaisEquipamento.aterramento ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{documentosAdicionaisEquipamento.aterramento.nome_original}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                
                                const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.aterramento.caminho)}`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                })
                                
                                if (urlResponse.ok) {
                                  const urlData = await urlResponse.json()
                                  if (urlData.success && urlData.data?.url) {
                                    window.open(urlData.data.url, '_blank')
                                  }
                                }
                              } catch (error) {
                                console.error('Erro ao baixar Documento de Aterramento:', error)
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível baixar o arquivo",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar Aterramento
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Não informado</span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Gruas */}
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
              ) : loadingComponentesDevolucao && componentesDevolucao.length === 0 ? (
                <CardLoader text="Carregando componentes..." />
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
                                <strong>Início da Locação:</strong> {formatarDataSemTimezone(grua.dataInicioLocacao || grua.data_inicio_locacao || grua.data_instalacao)}
                              </p>
                              {(grua.dataFimLocacao || grua.data_fim_locacao || grua.data_remocao) && (
                                <p className="text-xs text-gray-500">
                                  <strong>Fim da Locação:</strong> {formatarDataSemTimezone(grua.dataFimLocacao || grua.data_fim_locacao || grua.data_remocao)}
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

                        {/* Devolução de Componentes desta Grua */}
                        {(() => {
                          const gruaIdAtual = String(grua.grua?.id || grua.gruaId || grua.id)
                          const componentesDestaGrua = componentesDevolucao.filter(comp => {
                            const compGruaId = String(comp.grua_id || comp.grua?.id || '')
                            return compGruaId === gruaIdAtual
                          })

                          return (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <PackageIcon className="w-4 h-4" />
                                Devolução de Componentes
                              </h4>
                              {loadingComponentesDevolucao ? (
                                <div className="text-sm text-gray-500 py-4">Carregando componentes...</div>
                              ) : componentesDestaGrua.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4 text-center">
                                  Nenhum componente em uso para devolução
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Componente</TableHead>
                                          <TableHead>Quantidade Total</TableHead>
                                          <TableHead>Quantidade em Uso</TableHead>
                                          <TableHead>Valor Unitário</TableHead>
                                          <TableHead>Devolução Completa</TableHead>
                                          <TableHead>Devolução Parcial</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {componentesDestaGrua.map((componente) => {
                                        const devolucao = devolucoes[componente.id] || { tipo: null }
                                        const isCompleta = devolucao.tipo === 'completa'
                                        const isParcial = devolucao.tipo === 'parcial'
                                        
                                        return (
                                          <TableRow key={componente.id}>
                                            <TableCell>
                                              <div>
                                                <div className="font-medium">{componente.nome}</div>
                                                <div className="text-xs text-gray-500">{componente.tipo}</div>
                                                {componente.modelo && (
                                                  <div className="text-xs text-gray-500">Modelo: {componente.modelo}</div>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>{componente.quantidade_total}</TableCell>
                                            <TableCell>{componente.quantidade_em_uso}</TableCell>
                                            <TableCell>R$ {componente.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                              <Button
                                                size="sm"
                                                variant={isCompleta ? "default" : "outline"}
                                                onClick={() => {
                                                  setDevolucoes({
                                                    ...devolucoes,
                                                    [componente.id]: {
                                                      tipo: isCompleta ? null : 'completa',
                                                      quantidade_devolvida: componente.quantidade_em_uso,
                                                      valor: componente.valor_unitario * componente.quantidade_em_uso
                                                    }
                                                  })
                                                }}
                                                className={isCompleta ? "bg-green-600 hover:bg-green-700" : ""}
                                              >
                                                <Check className="w-4 h-4" />
                                              </Button>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  size="sm"
                                                  variant={isParcial ? "destructive" : "outline"}
                                                  onClick={() => {
                                                    if (!isParcial) {
                                                      setDevolucoes({
                                                        ...devolucoes,
                                                        [componente.id]: {
                                                          tipo: 'parcial',
                                                          quantidade_devolvida: componente.quantidade_em_uso,
                                                          valor: 0
                                                        }
                                                      })
                                                    }
                                                  }}
                                                >
                                                  <X className="w-4 h-4" />
                                                </Button>
                                                {isParcial && (
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <Button size="sm" variant="outline">
                                                        Editar
                                                      </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                      <DialogHeader>
                                                        <DialogTitle>Devolução Parcial - {componente.nome}</DialogTitle>
                                                        <DialogDescription>
                                                          Informe a quantidade que retornou e o valor do que não retornou
                                                        </DialogDescription>
                                                      </DialogHeader>
                                                      <div className="space-y-4">
                                                        <div>
                                                          <Label>Quantidade Total Enviada</Label>
                                                          <Input value={componente.quantidade_em_uso} disabled />
                                                        </div>
                                                        <div>
                                                          <Label>Quantidade que Retornou *</Label>
                                                          <Input
                                                            type="number"
                                                            min="0"
                                                            max={componente.quantidade_em_uso}
                                                            value={devolucao.quantidade_devolvida || 0}
                                                            onChange={(e) => {
                                                              const qtd = parseInt(e.target.value) || 0
                                                              setDevolucoes({
                                                                ...devolucoes,
                                                                [componente.id]: {
                                                                  ...devolucao,
                                                                  quantidade_devolvida: qtd,
                                                                  valor: (componente.quantidade_em_uso - qtd) * componente.valor_unitario
                                                                }
                                                              })
                                                            }}
                                                          />
                                                        </div>
                                                        <div>
                                                          <Label>Valor do que Não Retornou (R$) *</Label>
                                                          <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={devolucao.valor || 0}
                                                            onChange={(e) => {
                                                              setDevolucoes({
                                                                ...devolucoes,
                                                                [componente.id]: {
                                                                  ...devolucao,
                                                                  valor: parseFloat(e.target.value) || 0
                                                                }
                                                              })
                                                            }}
                                                          />
                                                          <p className="text-xs text-gray-500 mt-1">
                                                            Valor calculado: R$ {((componente.quantidade_em_uso - (devolucao.quantidade_devolvida || 0)) * componente.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                          </p>
                                                        </div>
                                                        <div>
                                                          <Label>Observações</Label>
                                                          <Textarea
                                                            value={devolucao.observacoes || ''}
                                                            onChange={(e) => {
                                                              setDevolucoes({
                                                                ...devolucoes,
                                                                [componente.id]: {
                                                                  ...devolucao,
                                                                  observacoes: e.target.value
                                                                }
                                                              })
                                                            }}
                                                            placeholder="Descreva o que aconteceu com os componentes que não retornaram..."
                                                            rows={3}
                                                          />
                                                        </div>
                                                      </div>
                                                    </DialogContent>
                                                  </Dialog>
                                                )}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                  
                  {/* Botões de ação para devoluções (uma vez, no final) */}
                  {componentesDevolucao.length > 0 && (
                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDevolucoes({})
                        }}
                      >
                        Limpar Todas as Seleções
                      </Button>
                      <Button
                        onClick={async () => {
                          const devolucoesSelecionadas = Object.entries(devolucoes).filter(([_, dev]) => dev.tipo !== null)
                          if (devolucoesSelecionadas.length === 0) {
                            toast({
                              title: "Atenção",
                              description: "Selecione pelo menos uma devolução",
                              variant: "destructive"
                            })
                            return
                          }
                          
                          setProcessandoDevolucao(true)
                          try {
                            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                            
                            const response = await fetch(`${API_URL}/api/grua-componentes/devolver`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                obra_id: parseInt(obraId),
                                devolucoes: devolucoesSelecionadas.map(([componente_id, dev]) => ({
                                  componente_id: parseInt(componente_id),
                                  tipo: dev.tipo,
                                  quantidade_devolvida: dev.quantidade_devolvida,
                                  valor: dev.valor,
                                  observacoes: dev.observacoes
                                }))
                              })
                            })
                            
                            if (!response.ok) {
                              const error = await response.json()
                              throw new Error(error.message || 'Erro ao processar devoluções')
                            }
                            
                            toast({
                              title: "Sucesso",
                              description: "Devoluções processadas com sucesso"
                            })
                            
                            setDevolucoes({})
                            // Recarregar componentes
                            await carregarComponentesDevolucao()
                          } catch (error: any) {
                            console.error('Erro ao processar devoluções:', error)
                            toast({
                              title: "Erro",
                              description: error.message || "Erro ao processar devoluções",
                              variant: "destructive"
                            })
                          } finally {
                            setProcessandoDevolucao(false)
                          }
                        }}
                        disabled={processandoDevolucao}
                      >
                        {processandoDevolucao ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Processar Todas as Devoluções
                          </>
                        )}
                      </Button>
                    </div>
                  )}
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
                  Funcionários
                  {loadingFuncionarios && <InlineLoader size="sm" />}
                </CardTitle>
                <div className="flex gap-2">
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
                  {/* Seção de Contato Técnico da Obra */}
                  {(obra?.contato_obra || obra?.telefone_obra || obra?.email_obra) && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-base">Contato Técnico da Obra</h3>
                        <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                          Atrelado ao Cliente
                        </Badge>
                      </div>
                      <div className="border rounded-lg p-4 bg-purple-50/30">
                        <div className="space-y-2">
                          {obra?.contato_obra && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Nome:</p>
                              <p className="text-base font-semibold">{obra.contato_obra}</p>
                            </div>
                          )}
                          {obra?.telefone_obra && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Telefone:</p>
                              <p className="text-sm">{obra.telefone_obra}</p>
                            </div>
                          )}
                          {obra?.email_obra && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Email:</p>
                              <p className="text-sm">{obra.email_obra}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Contato técnico atrelado ao cliente. Não é um funcionário da empresa.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção de Funcionários */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-base">Funcionários</h3>
                      <Badge variant="outline" className="ml-2">
                        {funcionariosVinculados.length}
                      </Badge>
                    </div>
                    {funcionariosVinculados.length > 0 ? (
                      <div className="space-y-4">
                        {funcionariosVinculados.map((funcionario) => (
                          <div key={funcionario.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{funcionario.name}</h3>
                                <p className="text-sm text-gray-600">{funcionario.role}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    <strong>Data de Início:</strong> {formatarDataSemTimezone(funcionario.dataInicio)}
                                  </p>
                                  {funcionario.dataFim && (
                                    <p className="text-xs text-gray-500">
                                      <strong>Data de Fim:</strong> {formatarDataSemTimezone(funcionario.dataFim)}
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

          {/* Seção: Sinaleiros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Sinaleiros da Obra
                  </CardTitle>
                  <CardDescription>
                    Sinaleiros cadastrados para esta obra
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isModalFuncionarioOpen} onOpenChange={setIsModalFuncionarioOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Atrelar Funcionário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Atrelar Funcionário como Sinaleiro</DialogTitle>
                        <DialogDescription>
                          Selecione um funcionário para atrelar como sinaleiro nesta obra
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Buscar Funcionário</Label>
                          <FuncionarioSearch
                            onFuncionarioSelect={(funcionario) => {
                              setFuncionarioSelecionado(funcionario)
                            }}
                            selectedFuncionario={funcionarioSelecionado}
                            placeholder="Digite o nome ou cargo do funcionário..."
                            onlyActive={true}
                            allowedRoles={['Sinaleiro', 'Operador']}
                          />
                        </div>
                        {funcionarioSelecionado && (
                          <div>
                            <Label>Tipo de Sinaleiro</Label>
                            <Select
                              value={tipoSinaleiroFuncionario}
                              onValueChange={(value: 'principal' | 'reserva') => setTipoSinaleiroFuncionario(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="principal">Principal</SelectItem>
                                <SelectItem value="reserva">Reserva</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsModalFuncionarioOpen(false)
                            setFuncionarioSelecionado(null)
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAtrelarFuncionarioSinaleiro}
                          disabled={!funcionarioSelecionado || salvandoSinaleiro}
                        >
                          {salvandoSinaleiro ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Atrelar'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isModalTerceirizadoOpen} onOpenChange={setIsModalTerceirizadoOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Atrelar Terceirizado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Atrelar Terceirizado como Sinaleiro</DialogTitle>
                        <DialogDescription>
                          Cadastre um terceirizado como sinaleiro nesta obra
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="nome-terceirizado">Nome *</Label>
                          <Input
                            id="nome-terceirizado"
                            value={dadosTerceirizado.nome}
                            onChange={(e) => setDadosTerceirizado({ ...dadosTerceirizado, nome: e.target.value })}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rg-cpf-terceirizado">RG/CPF *</Label>
                          <Input
                            id="rg-cpf-terceirizado"
                            value={dadosTerceirizado.rg_cpf}
                            onChange={(e) => setDadosTerceirizado({ ...dadosTerceirizado, rg_cpf: e.target.value })}
                            placeholder="RG ou CPF"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone-terceirizado">Telefone</Label>
                          <Input
                            id="telefone-terceirizado"
                            value={dadosTerceirizado.telefone}
                            onChange={(e) => setDadosTerceirizado({ ...dadosTerceirizado, telefone: e.target.value })}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email-terceirizado">Email</Label>
                          <Input
                            id="email-terceirizado"
                            type="email"
                            value={dadosTerceirizado.email}
                            onChange={(e) => setDadosTerceirizado({ ...dadosTerceirizado, email: e.target.value })}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div>
                          <Label>Tipo de Sinaleiro</Label>
                          <Select
                            value={tipoSinaleiroTerceirizado}
                            onValueChange={(value: 'principal' | 'reserva') => setTipoSinaleiroTerceirizado(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="principal">Principal</SelectItem>
                              <SelectItem value="reserva">Reserva</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsModalTerceirizadoOpen(false)
                            setDadosTerceirizado({
                              nome: '',
                              rg_cpf: '',
                              telefone: '',
                              email: ''
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAtrelarTerceirizadoSinaleiro}
                          disabled={!dadosTerceirizado.nome || !dadosTerceirizado.rg_cpf || salvandoSinaleiro}
                        >
                          {salvandoSinaleiro ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Atrelar'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
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
                    variant="default"
                    onClick={() => setIsCriarMedicaoOpen(true)}
                    disabled={loadingMedicoes || !obra?.id}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Medição
                  </Button>
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
                  <p className="text-lg font-medium mb-2">Nenhuma medição mensal encontrada</p>
                  <p className="text-sm mb-4">
                    {orcamentosObra.length > 0 
                      ? "As medições dos orçamentos vinculados aparecerão aqui"
                      : "Você pode criar medições mensais mesmo sem orçamentos vinculados"}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => setIsCriarMedicaoOpen(true)}
                    disabled={!obra?.id}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Medição
                  </Button>
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
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Vincular Funcionários à Obra
            </DialogTitle>
            <DialogDescription>
              Selecione funcionários para vincular à obra.
            </DialogDescription>
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
    </div>
  )
}

export default function ObraDetailsPage() {
  return <ObraDetailsPageContent />
}
