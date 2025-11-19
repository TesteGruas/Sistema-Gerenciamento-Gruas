"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Edit, 
  User,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Shield,
  DollarSign,
  FileText,
  Briefcase,
  Award,
  AlertCircle,
  Loader2,
  Calculator,
  Gift,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  KeyRound,
  Bell
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { rhApi } from "@/lib/api-rh-completo"
import { apiRegistrosPonto } from "@/lib/api-ponto-eletronico"
import { ColaboradorCertificados } from "@/components/colaborador-certificados"
import { ColaboradorDocumentosAdmissionais } from "@/components/colaborador-documentos-admissionais"
import { ColaboradorHolerites } from "@/components/colaborador-holerites"
import { DocumentoUpload } from "@/components/documento-upload"
import { Upload as UploadIcon } from "lucide-react"
import { CARGOS_PREDEFINIDOS } from "@/lib/utils/cargos-predefinidos"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface SalarioDetalhado {
  id: number
  funcionario_id: number
  mes: string
  ano: number
  salario_base: number
  horas_trabalhadas?: number
  horas_extras?: number
  valor_hora_extra?: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
  status: string
  data_pagamento?: string
  arquivo_holerite?: string
  holerite_url?: string
  created_at: string
  updated_at: string
  funcionario?: {
    nome: string
    cargo: string
  }
}

interface BeneficioFuncionario {
  id: number
  funcionario_id: number
  beneficio_tipo_id: number
  data_inicio: string
  data_fim?: string
  status: string
  valor?: number
  observacoes?: string
  funcionario?: {
    nome: string
    cargo?: string
  }
  beneficios_tipo?: {
    tipo: string
    descricao: string
    valor: number
  }
}

interface DocumentoFuncionario {
  id: string
  tipo: 'rg' | 'cpf' | 'ctps' | 'pis' | 'titulo-eleitor' | 'certificado-reservista' | 'comprovante-residencia' | 'outros'
  nome: string
  numero: string
  dataEmissao: string
  dataVencimento?: string
  arquivo?: string
  arquivoUrl?: string
  observacoes?: string
}

export default function FuncionarioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [funcionario, setFuncionario] = useState<FuncionarioRH | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const [isEditBeneficioDialogOpen, setIsEditBeneficioDialogOpen] = useState(false)
  const [beneficioSelecionado, setBeneficioSelecionado] = useState<BeneficioFuncionario | null>(null)
  const [isDocumentoDialogOpen, setIsDocumentoDialogOpen] = useState(false)
  const [isEditDocumentoDialogOpen, setIsEditDocumentoDialogOpen] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoFuncionario | null>(null)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Formulário de edição
  const [editFormData, setEditFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cargo: '',
    departamento: '',
    turno: 'Diurno' as 'Diurno' | 'Noturno' | 'Sob Demanda' | 'Integral',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido',
    data_admissao: '',
    salario: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  })
  
  // Estados para formulários
  const [beneficioForm, setBeneficioForm] = useState({
    tipo: '',
    dataInicio: '',
    valor: '',
    observacoes: ''
  })
  
  const [documentoForm, setDocumentoForm] = useState({
    tipo: '',
    nome: '',
    numero: '',
    orgaoEmissor: '',
    dataEmissao: '',
    dataVencimento: '',
    observacoes: '',
    arquivo: null as File | null
  })

  // Estados para dados das tabs
  const [salarios, setSalarios] = useState<SalarioDetalhado[]>([])
  const [beneficios, setBeneficios] = useState<BeneficioFuncionario[]>([])
  const [tiposBeneficios, setTiposBeneficios] = useState<any[]>([])
  const [obrasFuncionario, setObrasFuncionario] = useState<any[]>([])
  const [holerites, setHolerites] = useState<any[]>([])
  const [certificadosVencendo, setCertificadosVencendo] = useState<any[]>([])
  
  // Estados para cálculo de salário
  const [mesCalculo, setMesCalculo] = useState(() => {
    const agora = new Date()
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  })
  const [calculandoSalario, setCalculandoSalario] = useState(false)
  
  // Estados para visualização de folha
  const [folhaSelecionada, setFolhaSelecionada] = useState<SalarioDetalhado | null>(null)
  const [isFolhaDialogOpen, setIsFolhaDialogOpen] = useState(false)
  
  // Estados para upload de holerite
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [folhaParaUpload, setFolhaParaUpload] = useState<SalarioDetalhado | null>(null)
  const [arquivoHolerite, setArquivoHolerite] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoFuncionario[]>([])

  // Função para carregar dados das tabs
  const carregarDadosTabs = async (funcionarioId: number) => {
    try {
      // Carregar salários/folhas de pagamento
      const salariosResponse = await rhApi.listarFolhasPagamento({ 
        funcionario_id: funcionarioId
      })
      let salariosData = salariosResponse.data || []

      // Carregar holerites
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      try {
        const holeritesResponse = await fetch(
          `${apiUrl}/api/colaboradores/${funcionarioId}/holerites`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (holeritesResponse.ok) {
          const holeritesData = await holeritesResponse.json()
          setHolerites(holeritesData.data || [])
          
          // Associar holerites às folhas de pagamento
          salariosData = salariosData.map((salario: SalarioDetalhado) => {
            // Formatar mes_referencia para comparar (formato YYYY-MM)
            let mesReferencia = ''
            
            // Se mes já está no formato YYYY-MM (string com hífen)
            if (typeof salario.mes === 'string' && salario.mes.includes('-')) {
              mesReferencia = salario.mes
            } 
            // Se mes é apenas o número do mês (1-12) ou string sem hífen
            else {
              let mesNum: number
              if (typeof salario.mes === 'number') {
                mesNum = salario.mes
              } else {
                // Se for string, tentar extrair o número do mês
                const mesStr = String(salario.mes)
                // Se for algo como "11" ou "2025-11", extrair o mês
                if (mesStr.includes('-')) {
                  mesNum = parseInt(mesStr.split('-')[1])
                } else {
                  mesNum = parseInt(mesStr) || 1
                }
              }
              mesReferencia = `${salario.ano}-${String(mesNum).padStart(2, '0')}`
            }
            
            // Buscar holerite correspondente
            const holerite = (holeritesData.data || []).find((h: any) => h.mes_referencia === mesReferencia)
            
            if (holerite) {
              return {
                ...salario,
                arquivo_holerite: holerite.arquivo,
                holerite_url: holerite.arquivo
              }
            }
            
            return salario
          })
        }
      } catch (holeritesError) {
        console.warn('Erro ao carregar holerites:', holeritesError)
        // Continuar sem holerites
      }
      
      setSalarios(salariosData)

      // Carregar benefícios
      const beneficiosResponse = await rhApi.listarBeneficiosFuncionarios({ 
        funcionario_id: funcionarioId
      })
      setBeneficios(beneficiosResponse.data || [])

      // Carregar documentos
      const documentosResponse = await funcionariosApi.listarDocumentosFuncionario(funcionarioId)
      if (documentosResponse.data) {
        // Função para converter tipo do backend (underscore) para frontend (hífen)
        const converterTipoParaFrontend = (tipo: string): string => {
          const mapeamento: Record<string, string> = {
            'titulo_eleitor': 'titulo-eleitor',
            'certificado_reservista': 'certificado-reservista',
            'comprovante_residencia': 'comprovante-residencia'
          }
          return mapeamento[tipo] || tipo
        }

        // Converter formato do backend para o frontend
        const docsFormatados = documentosResponse.data.map((doc: any) => ({
          id: doc.id.toString(),
          tipo: converterTipoParaFrontend(doc.tipo),
          nome: doc.nome,
          numero: doc.numero,
          orgaoEmissor: doc.orgao_emissor,
          dataEmissao: doc.data_emissao,
          dataVencimento: doc.data_vencimento,
          arquivoUrl: doc.arquivo_url,
          observacoes: doc.observacoes
        }))
        setDocumentos(docsFormatados)
      }

      // Carregar histórico de obras
      if (token) {
        try {
          const obrasResponse = await fetch(
            `${apiUrl}/api/funcionarios/${funcionarioId}/historico-obras`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          if (obrasResponse.ok) {
            const obrasData = await obrasResponse.json()
            setObrasFuncionario(obrasData.data || [])
          }
        } catch (obrasError) {
          // Silenciar erro, apenas não carregar obras
        }
      }

      // Carregar certificados para verificar vencimentos
      try {
        const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
        const certificadosResponse = await colaboradoresDocumentosApi.certificados.listar(funcionarioId)
        if (certificadosResponse.success && certificadosResponse.data) {
          // Filtrar certificados vencendo (até 30 dias)
          const hoje = new Date()
          const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
          
          const vencendo = certificadosResponse.data.filter((cert: any) => {
            if (!cert.data_validade) return false
            const dataValidade = new Date(cert.data_validade)
            return dataValidade >= hoje && dataValidade <= trintaDias
          })
          
          setCertificadosVencendo(vencendo)
        }
      } catch (certificadosError) {
        // Silenciar erro, apenas não carregar certificados
        console.warn('Erro ao carregar certificados:', certificadosError)
      }

    } catch (error) {
      // Não mostrar erro para não atrapalhar se alguma tab falhar
    }
  }

  // Carregar tipos de benefícios disponíveis
  useEffect(() => {
    const carregarTiposBeneficios = async () => {
      try {
        const response = await rhApi.listarTiposBeneficios()
        if (response.success && response.data) {
          setTiposBeneficios(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de benefícios:', error)
      }
    }
    carregarTiposBeneficios()
  }, [])

  // Função para carregar dados do funcionário (exportada para ser usada em outros lugares)
  const carregarFuncionario = async () => {
    try {
      setLoading(true)
      const funcionarioId = parseInt(params.id as string)
      const response = await funcionariosApi.obterFuncionario(funcionarioId)
      
      if (response.success && response.data) {
        const func = response.data
        
        // Mapear dados do backend para o formato esperado
        const funcAny = func as any
        const funcionarioMapeado: FuncionarioRH = {
          id: func.id,
          nome: func.nome,
          cpf: func.cpf || '',
          cargo: func.cargo,
          departamento: funcAny.departamento || '',
          salario: func.salario || 0,
          data_admissao: func.data_admissao || '',
          telefone: func.telefone,
          email: func.email,
          endereco: funcAny.endereco || '',
          cidade: funcAny.cidade || '',
          estado: funcAny.estado || '',
          cep: funcAny.cep || '',
          status: func.status as any,
          turno: funcAny.turno as any,
          observacoes: func.observacoes,
          created_at: func.created_at,
          updated_at: func.updated_at,
          usuario: funcAny.usuario && Array.isArray(funcAny.usuario) && funcAny.usuario.length > 0 ? funcAny.usuario[0] : undefined,
          obra_atual: funcAny.obra_atual || undefined
        }
        
        setFuncionario(funcionarioMapeado)
        
        // Carregar dados das tabs
        await carregarDadosTabs(funcionarioId)
      } else {
        throw new Error('Funcionário não encontrado')
      }
      
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do funcionário",
        variant: "destructive"
      })
      router.push('/dashboard/rh')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados reais do funcionário
  useEffect(() => {
    if (params.id) {
      carregarFuncionario()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Afastado': return 'bg-yellow-100 text-yellow-800'
      case 'Demitido': return 'bg-red-100 text-red-800'
      case 'calculado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'normal': return 'bg-green-100 text-green-800'
      case 'atraso': return 'bg-yellow-100 text-yellow-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'hora-extra': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <UserCheck className="w-4 h-4" />
      case 'Inativo': return <UserX className="w-4 h-4" />
      case 'Afastado': return <AlertCircle className="w-4 h-4" />
      case 'Demitido': return <UserX className="w-4 h-4" />
      case 'calculado': return <Calculator className="w-4 h-4" />
      case 'pago': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'atraso': return <AlertCircle className="w-4 h-4" />
      case 'falta': return <AlertCircle className="w-4 h-4" />
      case 'hora-extra': return <TrendingUp className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Função para converter tipo do backend (underscore) para frontend (hífen)
  const converterTipoDocumentoParaFrontend = (tipo: string): string => {
    const mapeamento: Record<string, string> = {
      'titulo_eleitor': 'titulo-eleitor',
      'certificado_reservista': 'certificado-reservista',
      'comprovante_residencia': 'comprovante-residencia'
    }
    return mapeamento[tipo] || tipo
  }

  const getTipoDocumentoColor = (tipo: string) => {
    // Normalizar tipo para comparação (aceitar tanto hífen quanto underscore)
    const tipoNormalizado = tipo.replace('_', '-')
    switch (tipoNormalizado) {
      case 'rg': return 'bg-blue-100 text-blue-800'
      case 'cpf': return 'bg-green-100 text-green-800'
      case 'ctps': return 'bg-purple-100 text-purple-800'
      case 'pis': return 'bg-orange-100 text-orange-800'
      case 'titulo-eleitor': return 'bg-red-100 text-red-800'
      case 'certificado-reservista': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoBeneficioColor = (tipo: string) => {
    switch (tipo) {
      case 'plano-saude': return 'bg-green-100 text-green-800'
      case 'plano-odonto': return 'bg-blue-100 text-blue-800'
      case 'seguro-vida': return 'bg-purple-100 text-purple-800'
      case 'vale-transporte': return 'bg-orange-100 text-orange-800'
      case 'vale-refeicao': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = () => {
    if (!isEditMode && funcionario) {
      // Preencher formulário com dados atuais
      setEditFormData({
        nome: funcionario.nome || '',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        cpf: funcionario.cpf || '',
        cargo: funcionario.cargo || '',
        departamento: funcionario.departamento || '',
        turno: funcionario.turno || 'Diurno',
        status: funcionario.status || 'Ativo',
        data_admissao: funcionario.data_admissao || '',
        salario: funcionario.salario ? funcionario.salario.toString() : '',
        endereco: funcionario.endereco || '',
        cidade: funcionario.cidade || '',
        estado: funcionario.estado || '',
        cep: funcionario.cep || '',
        observacoes: funcionario.observacoes || ''
      })
    }
    setIsEditMode(!isEditMode)
    toast({
      title: isEditMode ? "Modo Visualização" : "Modo Edição",
      description: isEditMode ? "Alterações canceladas" : "Agora você pode editar as informações",
    })
  }

  const handleSave = async () => {
    if (!funcionario) return

    try {
      setSubmitting(true)

      // Preparar dados para atualização
      const updateData = {
        nome: editFormData.nome,
        email: editFormData.email,
        telefone: editFormData.telefone,
        cpf: editFormData.cpf,
        cargo: editFormData.cargo,
        turno: editFormData.turno,
        status: editFormData.status,
        data_admissao: editFormData.data_admissao,
        salario: editFormData.salario ? parseFloat(editFormData.salario) : undefined,
        observacoes: editFormData.observacoes
      }

      // Atualizar funcionário via API
      const response = await funcionariosApi.atualizarFuncionario(funcionario.id, updateData)

      if (response.success) {
        // Recarregar dados do funcionário
        await carregarFuncionario()
        setIsEditMode(false)
        toast({
          title: "Sucesso",
          description: "Informações atualizadas com sucesso!",
        })
      } else {
        throw new Error('Erro ao atualizar funcionário')
      }
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar informações do funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetBeneficioForm = () => {
    setBeneficioForm({
      tipo: '',
      dataInicio: '',
      valor: '',
      observacoes: ''
    })
  }
  
  const resetDocumentoForm = () => {
    setDocumentoForm({
      tipo: '',
      nome: '',
      numero: '',
      orgaoEmissor: '',
      dataEmissao: '',
      dataVencimento: '',
      observacoes: '',
      arquivo: null
    })
    setDocumentoSelecionado(null)
  }

  const handleVisualizarDocumento = async (documento: DocumentoFuncionario) => {
    if (!documento.arquivoUrl) {
      toast({
        title: "Aviso",
        description: "Arquivo do documento não disponível",
        variant: "default"
      })
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      // Tentar obter URL assinada do arquivo
      try {
        const urlResponse = await fetch(
          `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documento.arquivoUrl)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (urlResponse.ok) {
          const urlData = await urlResponse.json()
          window.open(urlData.url || urlData.data?.url || documento.arquivoUrl, '_blank')
        } else {
          window.open(documento.arquivoUrl, '_blank')
        }
      } catch {
        window.open(documento.arquivoUrl, '_blank')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao visualizar documento",
        variant: "destructive"
      })
    }
  }

  const handleDownloadDocumento = async (documento: DocumentoFuncionario) => {
    if (!documento.arquivoUrl) {
      toast({
        title: "Aviso",
        description: "Arquivo do documento não disponível",
        variant: "default"
      })
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      // Tentar obter URL assinada do arquivo
      let downloadUrl = documento.arquivoUrl
      try {
        const urlResponse = await fetch(
          `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documento.arquivoUrl)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (urlResponse.ok) {
          const urlData = await urlResponse.json()
          downloadUrl = urlData.url || urlData.data?.url || documento.arquivoUrl
        }
      } catch {
        // Usar URL original se falhar
      }

      // Criar link temporário para download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${documento.nome}_${documento.numero}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar documento",
        variant: "destructive"
      })
    }
  }

  const handleEditarDocumento = (documento: DocumentoFuncionario) => {
    setDocumentoSelecionado(documento)
    setDocumentoForm({
      tipo: documento.tipo,
      nome: documento.nome,
      numero: documento.numero,
      orgaoEmissor: documento.orgaoEmissor || '',
      dataEmissao: documento.dataEmissao || '',
      dataVencimento: documento.dataVencimento || '',
      observacoes: documento.observacoes || '',
      arquivo: null
    })
    setIsEditDocumentoDialogOpen(true)
  }

  const handleSalvarEdicaoDocumento = async () => {
    if (!documentoSelecionado) return

    try {
      // Validação básica
      if (!documentoForm.tipo || !documentoForm.nome || !documentoForm.numero) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo, Nome e Número)",
          variant: "destructive"
        })
        return
      }

      const funcionarioId = parseInt(params.id as string)
      let arquivoUrl: string | undefined = documentoSelecionado.arquivoUrl

      // Se tiver arquivo novo, fazer upload primeiro
      if (documentoForm.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', documentoForm.arquivo)
          
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            arquivoUrl = uploadResult.data?.arquivo || uploadResult.arquivo
            
            if (!arquivoUrl) {
              throw new Error('URL do arquivo não retornada após upload')
            }
            
            if (!arquivoUrl.startsWith('http') && !arquivoUrl.startsWith('https')) {
              const caminho = arquivoUrl
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
              if (supabaseUrl) {
                arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${caminho}`
              } else {
                throw new Error('URL do arquivo inválida: não é uma URL completa e SUPABASE_URL não está configurada')
              }
            }
          } else {
            throw new Error('Erro ao fazer upload do arquivo')
          }
        } catch (uploadError: any) {
          toast({
            title: "Erro",
            description: uploadError.message || "Erro ao fazer upload do arquivo",
            variant: "destructive"
          })
          return
        }
      }

      // Função para converter tipo do frontend (hífen) para backend (underscore)
      const converterTipoDocumento = (tipo: string): string => {
        const mapeamento: Record<string, string> = {
          'titulo-eleitor': 'titulo_eleitor',
          'certificado-reservista': 'certificado_reservista',
          'comprovante-residencia': 'comprovante_residencia'
        }
        return mapeamento[tipo] || tipo
      }

      // Chamar API para atualizar documento
      const response = await funcionariosApi.atualizarDocumento(parseInt(documentoSelecionado.id), {
        tipo: converterTipoDocumento(documentoForm.tipo),
        nome: documentoForm.nome,
        numero: documentoForm.numero,
        orgao_emissor: documentoForm.orgaoEmissor || undefined,
        data_emissao: documentoForm.dataEmissao || undefined,
        data_vencimento: documentoForm.dataVencimento || undefined,
        observacoes: documentoForm.observacoes || undefined,
        arquivo_url: arquivoUrl
      })
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Documento atualizado com sucesso!",
        })
        
        // Recarregar documentos
        await carregarDadosTabs(funcionarioId)
        
        setIsEditDocumentoDialogOpen(false)
        resetDocumentoForm()
      } else {
        throw new Error(response.message || 'Erro ao atualizar documento')
      }
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar documento",
        variant: "destructive"
      })
    }
  }
  
  const handleCriarBeneficio = async () => {
    try {
      // Validação básica
      if (!beneficioForm.tipo || !beneficioForm.dataInicio) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo de Benefício e Data Início)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      
      // Converter valor para número se fornecido
      let valorNumerico: number | undefined = undefined
      if (beneficioForm.valor && beneficioForm.valor.trim() !== '') {
        const valorLimpo = beneficioForm.valor.replace(/\./g, '').replace(',', '.')
        valorNumerico = parseFloat(valorLimpo)
        if (isNaN(valorNumerico)) {
          toast({
            title: "Erro",
            description: "Valor inválido. Use números e vírgula (ex: 1.234,56)",
            variant: "destructive"
          })
          return
        }
      }

      // Chamar API para adicionar benefício
      const response = await rhApi.adicionarBeneficioFuncionario({
        funcionario_id: funcionarioId,
        beneficio_tipo_id: parseInt(beneficioForm.tipo),
        data_inicio: beneficioForm.dataInicio,
        valor: valorNumerico,
        observacoes: beneficioForm.observacoes || undefined
      } as any)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício adicionado com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
        
        setIsBeneficioDialogOpen(false)
        resetBeneficioForm()
      } else {
        throw new Error(response.message || 'Erro ao adicionar benefício')
      }
    } catch (error) {
      console.error('Erro ao criar benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar benefício",
        variant: "destructive"
      })
    }
  }

  const handleEditarBeneficio = (beneficio: BeneficioFuncionario) => {
    setBeneficioSelecionado(beneficio)
    setBeneficioForm({
      tipo: beneficio.beneficio_tipo_id.toString(),
      dataInicio: beneficio.data_inicio.split('T')[0],
      valor: beneficio.valor 
        ? beneficio.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      observacoes: beneficio.observacoes || ''
    })
    setIsEditBeneficioDialogOpen(true)
  }

  const handleSalvarEdicaoBeneficio = async () => {
    if (!beneficioSelecionado) return
    
    try {
      // Validação básica
      if (!beneficioForm.tipo || !beneficioForm.dataInicio) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo de Benefício e Data Início)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para atualizar benefício
      const response = await rhApi.atualizarBeneficioFuncionario(beneficioSelecionado.id, {
        funcionario_id: funcionarioId,
        beneficio_tipo_id: parseInt(beneficioForm.tipo),
        data_inicio: beneficioForm.dataInicio,
        valor: beneficioForm.valor && beneficioForm.valor.trim() !== '' 
          ? parseFloat(beneficioForm.valor.replace(/\./g, '').replace(',', '.')) 
          : undefined,
        observacoes: beneficioForm.observacoes || undefined
      } as any)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício atualizado com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
        
        setIsEditBeneficioDialogOpen(false)
        setBeneficioSelecionado(null)
        resetBeneficioForm()
      } else {
        throw new Error(response.message || 'Erro ao atualizar benefício')
      }
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar benefício",
        variant: "destructive"
      })
    }
  }

  const handleResetPasswordClick = () => {
    if (!funcionario) return

    if (!funcionario.usuario) {
      toast({
        title: "Aviso",
        description: "Este funcionário não possui usuário vinculado. Crie um usuário primeiro.",
        variant: "default"
      })
      return
    }

    setIsResetPasswordDialogOpen(true)
  }

  const handleConfirmResetPassword = async () => {
    if (!funcionario) return

    setSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')

      const response = await fetch(`${apiUrl}/api/funcionarios/${funcionario.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: `Senha resetada com sucesso! ${data.data?.email_enviado ? 'Email enviado.' : ''} ${data.data?.whatsapp_enviado ? 'WhatsApp enviado.' : ''} O funcionário receberá uma senha temporária para acessar o sistema.`,
        })
        setIsResetPasswordDialogOpen(false)
      } else {
        throw new Error(data.message || 'Erro ao resetar senha')
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao resetar senha. Verifique se o funcionário possui email e telefone cadastrados.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoverBeneficio = async (beneficioId: number) => {
    if (!confirm('Tem certeza que deseja remover este benefício?')) {
      return
    }
    
    try {
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para excluir benefício
      const response = await rhApi.excluirBeneficioFuncionario(beneficioId)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício removido com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
      } else {
        throw new Error(response.message || 'Erro ao remover benefício')
      }
    } catch (error) {
      console.error('Erro ao remover benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover benefício",
        variant: "destructive"
      })
    }
  }
  
  const handleCriarDocumento = async () => {
    try {
      // Validação básica
      if (!documentoForm.tipo || !documentoForm.nome || !documentoForm.numero) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo, Nome e Número)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      let arquivoUrl: string | undefined = undefined
      
      // Se tiver arquivo, fazer upload primeiro
      if (documentoForm.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', documentoForm.arquivo)
          
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            // O backend agora retorna a URL completa no campo 'arquivo'
            arquivoUrl = uploadResult.data?.arquivo || uploadResult.arquivo
            
            // Validar se temos uma URL válida
            if (!arquivoUrl) {
              throw new Error('URL do arquivo não retornada após upload')
            }
            
            // Se não for uma URL completa (começa com http/https), tentar construir
            if (!arquivoUrl.startsWith('http') && !arquivoUrl.startsWith('https')) {
              const caminho = arquivoUrl
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
              if (supabaseUrl) {
                arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${caminho}`
              } else {
                throw new Error('URL do arquivo inválida: não é uma URL completa e SUPABASE_URL não está configurada')
              }
            }
          } else {
            // Se falhar, usar URL temporária
            arquivoUrl = URL.createObjectURL(documentoForm.arquivo)
            toast({
              title: "Aviso",
              description: "Upload do arquivo falhou, mas o documento será salvo",
              variant: "default"
            })
          }
        } catch (uploadError) {
          // Se falhar completamente, usar URL temporária
          arquivoUrl = URL.createObjectURL(documentoForm.arquivo)
          toast({
            title: "Aviso",
            description: "Upload do arquivo falhou, mas o documento será salvo",
            variant: "default"
          })
        }
      }
      
      // Função para converter tipo do frontend (hífen) para backend (underscore)
      const converterTipoDocumento = (tipo: string): string => {
        const mapeamento: Record<string, string> = {
          'titulo-eleitor': 'titulo_eleitor',
          'certificado-reservista': 'certificado_reservista',
          'comprovante-residencia': 'comprovante_residencia'
        }
        return mapeamento[tipo] || tipo
      }

      // Chamar API para adicionar documento
      const response = await funcionariosApi.criarDocumento({
        funcionario_id: funcionarioId,
        tipo: converterTipoDocumento(documentoForm.tipo),
        nome: documentoForm.nome,
        numero: documentoForm.numero,
        orgao_emissor: documentoForm.orgaoEmissor || undefined,
        data_emissao: documentoForm.dataEmissao || undefined,
        data_vencimento: documentoForm.dataVencimento || undefined,
        observacoes: documentoForm.observacoes || undefined,
        arquivo_url: arquivoUrl
      })
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Documento adicionado com sucesso!",
        })
        
        // Recarregar documentos
        await carregarDadosTabs(funcionarioId)
        
        setIsDocumentoDialogOpen(false)
        resetDocumentoForm()
      } else {
        throw new Error(response.message || 'Erro ao adicionar documento')
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar documento",
        variant: "destructive"
      })
    }
  }

  const handleVisualizarFolha = async (salario: SalarioDetalhado) => {
    try {
      // Buscar detalhes completos da folha
      const folhaDetalhes = await rhApi.obterFolhaPagamento(salario.id)
      
      if (folhaDetalhes.success && folhaDetalhes.data) {
        setFolhaSelecionada(folhaDetalhes.data as any)
        setIsFolhaDialogOpen(true)
      } else {
        // Se não conseguir buscar detalhes, usar os dados básicos
        setFolhaSelecionada(salario)
        setIsFolhaDialogOpen(true)
      }
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da folha:', error)
      // Mesmo com erro, mostrar os dados básicos
      setFolhaSelecionada(salario)
      setIsFolhaDialogOpen(true)
    }
  }

  const handleUploadHolerite = async () => {
    if (!folhaParaUpload || !arquivoHolerite || !funcionario) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para upload",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      // Fazer upload do arquivo primeiro
      const formData = new FormData()
      formData.append('arquivo', arquivoHolerite)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do arquivo')
      }
      
      const uploadResult = await uploadResponse.json()
      const arquivoUrl = uploadResult.data?.caminho || uploadResult.data?.arquivo || uploadResult.caminho || uploadResult.arquivo
      
      // Formatar mes_referencia no formato YYYY-MM
      let mesReferencia = folhaParaUpload.mes
      if (typeof folhaParaUpload.mes === 'string' && !folhaParaUpload.mes.includes('-')) {
        // Se for apenas o número do mês, construir YYYY-MM
        mesReferencia = `${folhaParaUpload.ano}-${String(folhaParaUpload.mes).padStart(2, '0')}`
      } else if (typeof folhaParaUpload.mes === 'number') {
        mesReferencia = `${folhaParaUpload.ano}-${String(folhaParaUpload.mes).padStart(2, '0')}`
      }
      
      // Salvar holerite usando a API de colaboradores-documentos
      const holeriteResponse = await fetch(
        `${apiUrl}/api/colaboradores/${funcionario.id}/holerites`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mes_referencia: mesReferencia,
            arquivo: arquivoUrl
          })
        }
      )
      
      if (!holeriteResponse.ok) {
        const errorData = await holeriteResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao salvar holerite')
      }
      
      toast({
        title: "Sucesso",
        description: "Holerite enviado com sucesso!",
      })
      
      // Recarregar dados
      await carregarDadosTabs(funcionario.id)
      
      // Fechar dialog e limpar
      setIsUploadDialogOpen(false)
      setFolhaParaUpload(null)
      setArquivoHolerite(null)
    } catch (error: any) {
      console.error('Erro ao fazer upload de holerite:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do holerite",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadFolha = async (salario: SalarioDetalhado) => {
    try {
      // Se tiver arquivo de holerite, baixar o arquivo enviado
      if (salario.arquivo_holerite || salario.holerite_url) {
        const arquivoUrl = salario.arquivo_holerite || salario.holerite_url
        
        // Se for URL completa, abrir diretamente
        if (arquivoUrl.startsWith('http')) {
          window.open(arquivoUrl, '_blank')
        } else {
          // Se for caminho relativo, construir URL completa
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          // Tentar obter URL assinada
          try {
            const urlResponse = await fetch(
              `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(arquivoUrl)}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )
            
            if (urlResponse.ok) {
              const urlData = await urlResponse.json()
              window.open(urlData.url || urlData.data?.url || arquivoUrl, '_blank')
            } else {
              window.open(`${apiUrl}/uploads/${arquivoUrl}`, '_blank')
            }
          } catch {
            window.open(`${apiUrl}/uploads/${arquivoUrl}`, '_blank')
          }
        }
        
        toast({
          title: "Download Iniciado",
          description: "O holerite está sendo baixado.",
        })
        return
      }
      
      // Se não tiver arquivo, gerar HTML (fallback)
      // Buscar detalhes completos da folha
      const folhaDetalhes = await rhApi.obterFolhaPagamento(salario.id)
      
      if (!folhaDetalhes.success || !folhaDetalhes.data) {
        throw new Error('Folha de pagamento não encontrada')
      }
      
      const folha = folhaDetalhes.data as any
      const horasExtras = folha.horas_extras || salario.horas_extras || 0
      const valorHoraExtra = folha.valor_hora_extra || salario.valor_hora_extra || 0
      
      // Formatar datas antes de inserir no template string
      const dataPagamentoFormatada = salario.data_pagamento 
        ? format(new Date(salario.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })
        : ''
      const dataGeracaoFormatada = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      
      // Extrair mês e ano para exibição
      let mesExib = salario.mes
      let anoExib = salario.ano
      if (typeof salario.mes === 'string' && salario.mes.includes('-')) {
        const [ano, mes] = salario.mes.split('-')
        mesExib = mes
        anoExib = parseInt(ano)
      }
      
      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Holerite - ${funcionario?.nome || 'Funcionário'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .table th, .table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .valor {
              text-align: right;
            }
            .provento {
              color: #28a745;
            }
            .desconto {
              color: #dc3545;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HOLERITE DE PAGAMENTO</h1>
            <p>Mês/Ano: ${String(mesExib).padStart(2, '0')}/${anoExib}</p>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Funcionário:</span>
              <span class="info-value">${funcionario?.nome || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CPF:</span>
              <span class="info-value">${funcionario?.cpf || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cargo:</span>
              <span class="info-value">${funcionario?.cargo || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${salario.status || 'N/A'}</span>
            </div>
            ${dataPagamentoFormatada ? `
            <div class="info-row">
              <span class="info-label">Data de Pagamento:</span>
              <span class="info-value">${dataPagamentoFormatada}</span>
            </div>
            ` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="valor">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salário Base</td>
                <td class="valor">R$ ${(salario.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${horasExtras > 0 ? `
              <tr>
                <td>Horas Extras (${horasExtras}h × R$ ${valorHoraExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</td>
                <td class="valor provento">R$ ${(horasExtras * valorHoraExtra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total de Proventos</td>
                <td class="valor provento">R$ ${(salario.total_proventos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Descontos</td>
                <td class="valor desconto">R$ ${(salario.total_descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Salário Líquido</strong></td>
                <td class="valor"><strong>R$ ${(salario.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Documento gerado em ${dataGeracaoFormatada}</p>
            <p>Sistema de Gerenciamento de Gruas - IRBANA</p>
          </div>
        </body>
        </html>
      `
      
      // Criar blob e fazer download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Formatar nome do arquivo
      const nomeArquivo = `holerite-${(funcionario?.nome || 'funcionario').replace(/\s+/g, '-')}-${String(mesExib).padStart(2, '0')}-${anoExib}.html`
      link.download = nomeArquivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Download Iniciado",
        description: "O holerite foi gerado e o download foi iniciado.",
      })
    } catch (error: any) {
      console.error('Erro ao gerar holerite:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar holerite para download",
        variant: "destructive"
      })
    }
  }

  const calcularSalario = async () => {
    if (!funcionario) return
    
    setCalculandoSalario(true)
    try {
      // Extrair ano e mês do formato YYYY-MM
      const [ano, mesNum] = mesCalculo.split('-')
      const mes = parseInt(mesNum)
      
      // Calcular data de início e fim do mês
      const dataInicio = `${ano}-${mesNum}-01`
      const ultimoDia = new Date(parseInt(ano), mes, 0).getDate()
      const dataFim = `${ano}-${mesNum}-${String(ultimoDia).padStart(2, '0')}`
      
      // Buscar registros de ponto do funcionário para o mês
      let totalHorasTrabalhadas = 0
      let totalHorasExtras = 0
      
      try {
        const registrosPonto = await apiRegistrosPonto.listar({
          funcionario_id: funcionario.id,
          data_inicio: dataInicio,
          data_fim: dataFim
        })
        
        // Calcular totais de horas trabalhadas e horas extras
        if (registrosPonto.data && registrosPonto.data.length > 0) {
          totalHorasTrabalhadas = registrosPonto.data.reduce((sum, registro) => {
            return sum + (parseFloat(String(registro.horas_trabalhadas || 0)))
          }, 0)
          
          totalHorasExtras = registrosPonto.data.reduce((sum, registro) => {
            return sum + (parseFloat(String(registro.horas_extras || 0)))
          }, 0)
        }
      } catch (pontoError) {
        console.warn('Erro ao buscar registros de ponto, continuando sem horas extras:', pontoError)
        // Continuar sem horas extras se não conseguir buscar
      }
      
      // Calcular valor da hora extra (50% adicional sobre o valor da hora normal)
      // Valor da hora = salário base / 220 horas (jornada mensal padrão)
      const valorHora = (funcionario.salario || 0) / 220
      const valorHoraExtra = valorHora * 1.5 // 50% adicional
      const valorTotalHorasExtras = Math.round((totalHorasExtras * valorHoraExtra) * 100) / 100 // Arredondar para 2 casas decimais
      
      // Tentar usar o endpoint específico de calcular salário
      try {
        const response = await rhApi.calcularSalario(
          funcionario.id, 
          String(mes), 
          ano
        )
        
        if (response.success) {
          toast({
            title: "Salário Calculado",
            description: `Cálculo realizado com ${totalHorasExtras.toFixed(2)}h extras do ponto eletrônico!`,
          })
          
          // Recarregar dados das tabs para mostrar o novo salário calculado
          await carregarDadosTabs(funcionario.id)
          return
        }
      } catch (apiError) {
        // Se o endpoint não existir, usar a API de folha de pagamento como alternativa
        console.log('Endpoint calcular-salario não disponível, usando folha de pagamento')
      }
      
      // Verificar se já existe folha para este mês
      const folhaResponse = await rhApi.listarFolhasPagamento({
        funcionario_id: funcionario.id,
        mes: mesCalculo
      })
      
      let folhaId: number | null = null
      
      // Se já existe folha, atualizar
      if (folhaResponse.data && folhaResponse.data.length > 0) {
        folhaId = folhaResponse.data[0].id
        
        // Atualizar folha existente com os dados calculados
        const atualizarFolhaResponse = await rhApi.atualizarFolhaPagamento(folhaId, {
          horas_trabalhadas: Math.round(totalHorasTrabalhadas * 100) / 100,
          horas_extras: Math.round(totalHorasExtras * 100) / 100,
          valor_hora_extra: Math.round(valorHoraExtra * 100) / 100
        })
        
        if (atualizarFolhaResponse.success) {
          toast({
            title: "Folha de Pagamento Atualizada",
            description: `Folha atualizada com ${totalHorasExtras.toFixed(2)}h extras calculadas do ponto eletrônico!`,
          })
          
          await carregarDadosTabs(funcionario.id)
          return
        }
      }
      
      // Criar nova folha de pagamento com os dados calculados
      const criarFolhaResponse = await rhApi.criarFolhaPagamento({
        funcionario_id: funcionario.id,
        mes: mesCalculo,
        salario_base: funcionario.salario || 0,
        horas_trabalhadas: Math.round(totalHorasTrabalhadas * 100) / 100,
        horas_extras: Math.round(totalHorasExtras * 100) / 100,
        valor_hora_extra: Math.round(valorHoraExtra * 100) / 100
      })
      
      if (criarFolhaResponse.success) {
        toast({
          title: "Folha de Pagamento Criada",
          description: `Folha criada com ${totalHorasExtras.toFixed(2)}h extras calculadas do ponto eletrônico!`,
        })
        
        // Recarregar dados das tabs
        await carregarDadosTabs(funcionario.id)
      } else {
        throw new Error(criarFolhaResponse.message || 'Erro ao criar folha de pagamento')
      }
    } catch (error: any) {
      console.error('Erro ao calcular salário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao calcular salário. Verifique se o funcionário tem salário base cadastrado.",
        variant: "destructive"
      })
    } finally {
      setCalculandoSalario(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando informações do funcionário...</p>
        </div>
      </div>
    )
  }

  if (!funcionario) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Funcionário não encontrado</h2>
        <p className="text-gray-600 mb-4">O funcionário solicitado não foi encontrado.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{funcionario.nome}</h1>
                {certificadosVencendo.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative cursor-pointer">
                        <Bell className="w-5 h-5 text-red-600 animate-pulse" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Documento próximo a vencer</p>
                      <p className="text-xs mt-1">
                        {certificadosVencendo.length} certificado{certificadosVencendo.length > 1 ? 's' : ''} vencendo em até 30 dias
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-gray-600">{funcionario.cargo}{funcionario.departamento ? ` • ${funcionario.departamento}` : ''}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {funcionario.usuario && !isEditMode && (
            <Button 
              variant="outline" 
              onClick={handleResetPasswordClick}
              disabled={submitting}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Resetar Senha
            </Button>
          )}
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditMode ? 'Cancelar' : 'Editar'}
          </Button>
          {isEditMode && (
            <Button onClick={handleSave} disabled={submitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={`/api/avatar/${funcionario.id}`} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                {getInitials(funcionario.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-lg font-semibold">{funcionario.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CPF</Label>
                    <p className="text-sm">{funcionario.cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                    <p className="text-sm">{funcionario.cargo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                    <p className="text-sm">{funcionario.departamento || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Admissão</Label>
                    <p className="text-sm">{funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Salário</Label>
                    <p className="text-sm font-semibold">R$ {(funcionario.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Obra Atual</Label>
                    <p className="text-sm">{funcionario.obra_atual?.nome || 'Sem obra'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Usuário do Sistema</Label>
                    <div className="flex items-center gap-2">
                      {funcionario.usuario ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">{funcionario.usuario.email}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Sem usuário</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="documentos-admissionais">Admissionais</TabsTrigger>
          <TabsTrigger value="holerites">Holerites</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* Tab Informações */}
        <TabsContent value="informacoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.email || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.telefone}
                      onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.telefone || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.endereco}
                      onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                      placeholder="Rua, número, complemento"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.endereco || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cidade</Label>
                    {isEditMode ? (
                      <Input
                        value={editFormData.cidade}
                        onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                        placeholder="Cidade"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm">{funcionario.cidade || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estado</Label>
                    {isEditMode ? (
                      <Input
                        value={editFormData.estado}
                        onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm">{funcionario.estado || '-'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CEP</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.cep}
                      onChange={(e) => setEditFormData({ ...editFormData, cep: e.target.value })}
                      placeholder="00000-000"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.cep || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Turno</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.turno}
                      onValueChange={(value) => setEditFormData({ ...editFormData, turno: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diurno">Diurno</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                        <SelectItem value="Integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{funcionario.turno || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Afastado">Afastado</SelectItem>
                        <SelectItem value="Demitido">Demitido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  {isEditMode ? (
                    <Textarea
                      value={editFormData.observacoes}
                      onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                      placeholder="Observações sobre o funcionário"
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm">{funcionario.observacoes || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card de Dados Básicos (Nome, CPF, Cargo, Salário) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Básicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.nome}
                      onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-semibold mt-1">{funcionario.nome}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CPF</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.cpf}
                      onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{funcionario.cpf}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.cargo}
                      onValueChange={(value) => setEditFormData({ ...editFormData, cargo: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGOS_PREDEFINIDOS.map((cargo) => (
                          <SelectItem key={cargo} value={cargo}>
                            {cargo}
                          </SelectItem>
                        ))}
                        {/* Se o cargo atual não estiver na lista, mostrar também */}
                        {editFormData.cargo && !CARGOS_PREDEFINIDOS.some(c => c.toLowerCase() === editFormData.cargo.toLowerCase()) && (
                          <SelectItem value={editFormData.cargo}>
                            {editFormData.cargo}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1">{funcionario.cargo}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.departamento}
                      onChange={(e) => setEditFormData({ ...editFormData, departamento: e.target.value })}
                      placeholder="Departamento"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{funcionario.departamento || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Admissão</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editFormData.data_admissao}
                      onChange={(e) => setEditFormData({ ...editFormData, data_admissao: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Salário</Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editFormData.salario}
                      onChange={(e) => setEditFormData({ ...editFormData, salario: e.target.value })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-semibold mt-1">
                      R$ {(funcionario.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Salários */}
        <TabsContent value="salarios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Histórico de Salários</CardTitle>
                  <CardDescription>Controle de salários e pagamentos</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="mes-calculo" className="text-xs text-muted-foreground">
                      Mês/Ano para Cálculo
                    </Label>
                    <Input
                      id="mes-calculo"
                      type="month"
                      value={mesCalculo}
                      onChange={(e) => setMesCalculo(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button onClick={calcularSalario} disabled={calculandoSalario || loading}>
                    {calculandoSalario ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular Salário
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {salarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead>Salário Base</TableHead>
                      <TableHead>Proventos</TableHead>
                      <TableHead>Descontos</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salarios.map((salario) => {
                      // Extrair mês e ano do formato YYYY-MM ou usar mes/ano separados
                      let mesExibicao = salario.mes
                      let anoExibicao = salario.ano
                      
                      // Se mes está no formato YYYY-MM, extrair
                      if (typeof salario.mes === 'string' && salario.mes.includes('-')) {
                        const [ano, mes] = salario.mes.split('-')
                        mesExibicao = mes
                        anoExibicao = parseInt(ano)
                      }
                      
                      return (
                        <TableRow key={salario.id}>
                          <TableCell>
                            <span className="font-medium">
                              {String(mesExibicao).padStart(2, '0')}/{anoExibicao}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">R$ {(salario.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              R$ {(salario.total_proventos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-red-600">
                              R$ {(salario.total_descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-blue-600">
                              R$ {(salario.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(salario.status)} border`}>
                              {getStatusIcon(salario.status)}
                              <span className="ml-1">{salario.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {salario.data_pagamento ? format(new Date(salario.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVisualizarFolha(salario)}
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!salario.arquivo_holerite && !salario.holerite_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setFolhaParaUpload(salario)
                                  setIsUploadDialogOpen(true)
                                }}
                                title="Enviar holerite"
                              >
                                <UploadIcon className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadFolha(salario)}
                              title="Baixar holerite"
                              disabled={!salario.arquivo_holerite && !salario.holerite_url}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum registro de salário encontrado</p>
                  <p className="text-sm">Os dados de salários serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Benefícios */}
        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios do Funcionário</CardTitle>
                  <CardDescription>Benefícios oferecidos ao funcionário</CardDescription>
                </div>
                <Dialog open={isBeneficioDialogOpen} onOpenChange={setIsBeneficioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Benefício
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-beneficio">Tipo de Benefício *</Label>
                        <Select
                          value={beneficioForm.tipo}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposBeneficios.length === 0 ? (
                              <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                            ) : (
                              tiposBeneficios.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.tipo}
                                  {tipo.descricao && ` (${tipo.descricao})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data-inicio-beneficio">Data de Início *</Label>
                        <Input
                          id="data-inicio-beneficio"
                          type="date"
                          value={beneficioForm.dataInicio}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, dataInicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor-beneficio">Valor (R$)</Label>
                        <Input
                          id="valor-beneficio"
                          type="text"
                          placeholder="0,00"
                          value={beneficioForm.valor}
                          onChange={(e) => {
                            // Permitir apenas números, vírgula e ponto
                            const value = e.target.value.replace(/[^\d,.-]/g, '')
                            setBeneficioForm({ ...beneficioForm, valor: value })
                          }}
                          onBlur={(e) => {
                            // Formatar como moeda brasileira
                            const value = e.target.value.replace(',', '.')
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue)) {
                              setBeneficioForm({ 
                                ...beneficioForm, 
                                valor: numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              })
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Valor do benefício em reais (opcional)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="observacoes-beneficio">Observações</Label>
                        <Textarea
                          id="observacoes-beneficio"
                          placeholder="Informações adicionais sobre o benefício"
                          value={beneficioForm.observacoes}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsBeneficioDialogOpen(false)
                            resetBeneficioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCriarBeneficio}>
                          Adicionar Benefício
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Dialog de Editar Benefício */}
                <Dialog open={isEditBeneficioDialogOpen} onOpenChange={setIsEditBeneficioDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-beneficio-edit">Tipo de Benefício *</Label>
                        <Select
                          value={beneficioForm.tipo}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposBeneficios.length === 0 ? (
                              <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                            ) : (
                              tiposBeneficios.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.tipo}
                                  {tipo.descricao && ` (${tipo.descricao})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data-inicio-beneficio-edit">Data de Início *</Label>
                        <Input
                          id="data-inicio-beneficio-edit"
                          type="date"
                          value={beneficioForm.dataInicio}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, dataInicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor-beneficio-edit">Valor (R$)</Label>
                        <Input
                          id="valor-beneficio-edit"
                          type="text"
                          placeholder="0,00"
                          value={beneficioForm.valor}
                          onChange={(e) => {
                            // Permitir apenas números, vírgula e ponto
                            const value = e.target.value.replace(/[^\d,.-]/g, '')
                            setBeneficioForm({ ...beneficioForm, valor: value })
                          }}
                          onBlur={(e) => {
                            // Formatar como moeda brasileira
                            const value = e.target.value.replace(',', '.')
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue)) {
                              setBeneficioForm({ 
                                ...beneficioForm, 
                                valor: numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              })
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Valor do benefício em reais (opcional)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="observacoes-beneficio-edit">Observações</Label>
                        <Textarea
                          id="observacoes-beneficio-edit"
                          placeholder="Informações adicionais sobre o benefício"
                          value={beneficioForm.observacoes}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditBeneficioDialogOpen(false)
                            setBeneficioSelecionado(null)
                            resetBeneficioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSalvarEdicaoBeneficio}>
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {beneficios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beneficios.map((beneficio) => (
                    <Card key={beneficio.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            {beneficio.beneficios_tipo?.descricao || 'Benefício'}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarBeneficio(beneficio)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverBeneficio(beneficio.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo:</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {beneficio.beneficios_tipo?.tipo || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="font-semibold">
                              R$ {(beneficio.valor ?? beneficio.beneficios_tipo?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Data Início:</span>
                            <span className="text-sm">{format(new Date(beneficio.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          {beneficio.data_fim && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Data Fim:</span>
                              <span className="text-sm">{format(new Date(beneficio.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={beneficio.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {beneficio.status}
                            </Badge>
                          </div>
                          {beneficio.observacoes && (
                            <div>
                              <span className="text-sm text-gray-600">Observações:</span>
                              <p className="text-sm">{beneficio.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum benefício cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Certificados */}
        <TabsContent value="certificados" className="space-y-6">
          {funcionario && (
            <ColaboradorCertificados
              colaboradorId={funcionario.id}
              readOnly={false}
            />
          )}
        </TabsContent>

        {/* Tab Documentos Admissionais */}
        <TabsContent value="documentos-admissionais" className="space-y-6">
          {funcionario && funcionario.id ? (
            <ColaboradorDocumentosAdmissionais
              colaboradorId={funcionario.id}
              readOnly={false}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Carregando dados do funcionário...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Holerites */}
        <TabsContent value="holerites" className="space-y-6">
          {funcionario && (
            <ColaboradorHolerites
              colaboradorId={funcionario.id}
              readOnly={false}
              isCliente={false}
              isFuncionario={false}
            />
          )}
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Documentos do Funcionário</CardTitle>
                  <CardDescription>Documentos pessoais e profissionais</CardDescription>
                </div>
                <Dialog open={isDocumentoDialogOpen} onOpenChange={setIsDocumentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Novo Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-documento">Tipo de Documento *</Label>
                        <Select
                          value={documentoForm.tipo}
                          onValueChange={(value) => setDocumentoForm({ ...documentoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rg">RG</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="ctps">Carteira de Trabalho</SelectItem>
                            <SelectItem value="pis">PIS/PASEP</SelectItem>
                            <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                            <SelectItem value="certificado-reservista">Certificado de Reservista</SelectItem>
                            <SelectItem value="comprovante-residencia">Comprovante de Residência</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nome-documento">Nome do Documento *</Label>
                        <Input
                          id="nome-documento"
                          placeholder="Ex: RG, CPF, etc"
                          value={documentoForm.nome}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero-documento">Número do Documento *</Label>
                        <Input
                          id="numero-documento"
                          placeholder="Ex: 12.345.678-9"
                          value={documentoForm.numero}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, numero: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="orgao-emissor">Órgão Emissor</Label>
                        <Input
                          id="orgao-emissor"
                          placeholder="Ex: SSP/PE, Receita Federal, etc"
                          value={documentoForm.orgaoEmissor}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, orgaoEmissor: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="data-emissao">Data de Emissão *</Label>
                          <Input
                            id="data-emissao"
                            type="date"
                            value={documentoForm.dataEmissao}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataEmissao: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                          <Input
                            id="data-vencimento"
                            type="date"
                            value={documentoForm.dataVencimento}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataVencimento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <DocumentoUpload
                          accept="application/pdf,image/*"
                          maxSize={5 * 1024 * 1024}
                          onUpload={(file) => setDocumentoForm({ ...documentoForm, arquivo: file })}
                          onRemove={() => setDocumentoForm({ ...documentoForm, arquivo: null })}
                          label="Upload do Documento"
                          required={false}
                          currentFile={documentoForm.arquivo}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observacoes-documento">Observações</Label>
                        <Textarea
                          id="observacoes-documento"
                          placeholder="Informações adicionais sobre o documento"
                          value={documentoForm.observacoes}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDocumentoDialogOpen(false)
                            resetDocumentoForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCriarDocumento}>
                          Adicionar Documento
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Dialog de Editar Documento */}
                <Dialog open={isEditDocumentoDialogOpen} onOpenChange={setIsEditDocumentoDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-documento-edit">Tipo de Documento *</Label>
                        <Select
                          value={documentoForm.tipo}
                          onValueChange={(value) => setDocumentoForm({ ...documentoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rg">RG</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="ctps">CTPS</SelectItem>
                            <SelectItem value="pis">PIS</SelectItem>
                            <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                            <SelectItem value="certificado-reservista">Certificado de Reservista</SelectItem>
                            <SelectItem value="comprovante-residencia">Comprovante de Residência</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nome-documento-edit">Nome do Documento *</Label>
                        <Input
                          id="nome-documento-edit"
                          value={documentoForm.nome}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, nome: e.target.value })}
                          placeholder="Ex: RG - Carteira de Identidade"
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero-documento-edit">Número *</Label>
                        <Input
                          id="numero-documento-edit"
                          value={documentoForm.numero}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, numero: e.target.value })}
                          placeholder="Número do documento"
                        />
                      </div>
                      <div>
                        <Label htmlFor="orgao-emissor-documento-edit">Órgão Emissor</Label>
                        <Input
                          id="orgao-emissor-documento-edit"
                          value={documentoForm.orgaoEmissor}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, orgaoEmissor: e.target.value })}
                          placeholder="Ex: SSP, IFP, etc."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="data-emissao-documento-edit">Data de Emissão</Label>
                          <Input
                            id="data-emissao-documento-edit"
                            type="date"
                            value={documentoForm.dataEmissao}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataEmissao: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="data-vencimento-documento-edit">Data de Vencimento</Label>
                          <Input
                            id="data-vencimento-documento-edit"
                            type="date"
                            value={documentoForm.dataVencimento}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataVencimento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <DocumentoUpload
                          accept="application/pdf,image/*"
                          maxSize={10 * 1024 * 1024}
                          onUpload={(file) => setDocumentoForm({ ...documentoForm, arquivo: file })}
                          onRemove={() => setDocumentoForm({ ...documentoForm, arquivo: null })}
                          label="Upload do Documento (opcional - substituir arquivo atual)"
                          required={false}
                          currentFile={documentoForm.arquivo}
                          fileUrl={documentoSelecionado?.arquivoUrl}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observacoes-documento-edit">Observações</Label>
                        <Textarea
                          id="observacoes-documento-edit"
                          placeholder="Informações adicionais sobre o documento"
                          value={documentoForm.observacoes}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditDocumentoDialogOpen(false)
                            resetDocumentoForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSalvarEdicaoDocumento}>
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Data Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map((documento) => (
                      <TableRow key={documento.id}>
                        <TableCell>
                          <Badge className={`${getTipoDocumentoColor(documento.tipo)} border`}>
                            {documento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{documento.nome}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{documento.numero}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(documento.dataEmissao), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {documento.dataVencimento ? format(new Date(documento.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVisualizarDocumento(documento)}
                              title="Visualizar documento"
                              disabled={!documento.arquivoUrl}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadDocumento(documento)}
                              title="Baixar documento"
                              disabled={!documento.arquivoUrl}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditarDocumento(documento)}
                              title="Editar documento"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum documento cadastrado</p>
                  <p className="text-sm">Adicione documentos usando o botão acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização de Folha de Pagamento */}
      <Dialog open={isFolhaDialogOpen} onOpenChange={setIsFolhaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Folha de Pagamento</DialogTitle>
          </DialogHeader>
          {folhaSelecionada && (
            <div className="space-y-6">
              {/* Informações do Funcionário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Funcionário</Label>
                  <p className="text-sm font-semibold">{funcionario?.nome || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CPF</Label>
                  <p className="text-sm">{funcionario?.cpf || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                  <p className="text-sm">{funcionario?.cargo || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Mês/Ano</Label>
                  <p className="text-sm font-semibold">
                    {(() => {
                      let mesExib = folhaSelecionada.mes
                      let anoExib = folhaSelecionada.ano
                      if (typeof folhaSelecionada.mes === 'string' && folhaSelecionada.mes.includes('-')) {
                        const [ano, mes] = folhaSelecionada.mes.split('-')
                        mesExib = mes
                        anoExib = parseInt(ano)
                      }
                      return `${String(mesExib).padStart(2, '0')}/${anoExib}`
                    })()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`${getStatusColor(folhaSelecionada.status)} border`}>
                    {getStatusIcon(folhaSelecionada.status)}
                    <span className="ml-1">{folhaSelecionada.status}</span>
                  </Badge>
                </div>
                {folhaSelecionada.data_pagamento && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Pagamento</Label>
                    <p className="text-sm">{format(new Date(folhaSelecionada.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                )}
              </div>

              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Salário Base</span>
                      <span className="font-semibold">R$ {(folhaSelecionada.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {(folhaSelecionada as any).horas_extras > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Horas Extras ({(folhaSelecionada as any).horas_extras}h × R$ {((folhaSelecionada as any).valor_hora_extra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </span>
                        <span className="font-semibold text-green-600">
                          R$ {(((folhaSelecionada as any).horas_extras || 0) * ((folhaSelecionada as any).valor_hora_extra || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-semibold text-gray-700">Total de Proventos</span>
                      <span className="font-bold text-green-600">R$ {(folhaSelecionada.total_proventos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Descontos</span>
                      <span className="font-semibold text-red-600">R$ {(folhaSelecionada.total_descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-bold text-gray-900">Salário Líquido</span>
                      <span className="text-xl font-bold text-blue-600">R$ {(folhaSelecionada.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFolhaDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setIsFolhaDialogOpen(false)
                  handleDownloadFolha(folhaSelecionada)
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Holerite
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload de Holerite */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Holerite</DialogTitle>
          </DialogHeader>
          {folhaParaUpload && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Funcionário:</p>
                <p className="font-semibold">{funcionario?.nome || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-2 mb-1">Mês/Ano:</p>
                <p className="font-semibold">
                  {(() => {
                    let mesExib = folhaParaUpload.mes
                    let anoExib = folhaParaUpload.ano
                    if (typeof folhaParaUpload.mes === 'string' && folhaParaUpload.mes.includes('-')) {
                      const [ano, mes] = folhaParaUpload.mes.split('-')
                      mesExib = mes
                      anoExib = parseInt(ano)
                    }
                    return `${String(mesExib).padStart(2, '0')}/${anoExib}`
                  })()}
                </p>
              </div>
              
              <div>
                <DocumentoUpload
                  accept="application/pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(file) => setArquivoHolerite(file)}
                  onRemove={() => setArquivoHolerite(null)}
                  label="Arquivo do Holerite (PDF)"
                  required={true}
                  currentFile={arquivoHolerite}
                  disabled={uploading}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadDialogOpen(false)
                    setFolhaParaUpload(null)
                    setArquivoHolerite(null)
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUploadHolerite}
                  disabled={!arquivoHolerite || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Enviar Holerite
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Reset de Senha */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
              Confirmar Reset de Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja resetar a senha de <strong>{funcionario?.nome}</strong>?
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-orange-900">O que acontecerá:</p>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                <li>Uma senha temporária será gerada automaticamente</li>
                <li>A senha será enviada por <strong>email</strong> para {funcionario?.email || 'o email cadastrado'}</li>
                <li>A senha será enviada por <strong>WhatsApp</strong> para {funcionario?.telefone || 'o telefone cadastrado'}</li>
                <li>O funcionário precisará alterar a senha no primeiro acesso</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Confirmar Reset
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}