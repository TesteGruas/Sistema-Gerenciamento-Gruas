"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  Calendar,
  MapPin,
  LogOut,
  Edit,
  Save,
  X,
  Camera,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Users,
  Monitor,
  Smartphone,
  Eye,
  ExternalLink,
  CheckSquare,
  Building2,
  Download,
  Upload,
  DollarSign,
  Gift,
  Award,
  FileCheck,
  Receipt,
  Loader2,
  Lock,
  EyeOff
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePWAUser } from "@/hooks/use-pwa-user"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { getFuncionarioId, getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { useEmpresa } from "@/hooks/use-empresa"
import { colaboradoresDocumentosApi, CertificadoBackend, DocumentoAdmissionalBackend } from "@/lib/api-colaboradores-documentos"
import { getFolhasPagamento, getFolhaPagamento, getFuncionarioBeneficios, FolhaPagamento, FuncionarioBeneficio } from "@/lib/api-remuneracao"

// Função helper para calcular dias até vencimento
function calcularDiasParaVencimento(dataValidade: string): number {
  if (!dataValidade) return Infinity
  
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const dataVencimento = new Date(dataValidade)
  dataVencimento.setHours(0, 0, 0, 0)
  
  const diffTime = dataVencimento.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Função para obter badge de aviso de vencimento
function getAvisoVencimento(dias: number) {
  if (dias < 0) {
    return {
      texto: 'Vencido',
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertCircle
    }
  } else if (dias <= 7) {
    return {
      texto: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: AlertCircle
    }
  } else if (dias <= 30) {
    return {
      texto: `Vence em ${dias} dias`,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Clock
    }
  }
  return null
}

function PWAPerfilPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, pontoHoje, documentosPendentes, horasTrabalhadas, loading } = usePWAUser()
  const { userRole, isSupervisor: isSupervisorHook, isClient: isClientRole } = usePWAPermissions()
  const { empresa, getEnderecoCompleto, getContatoCompleto, getHorarioFuncionamento } = useEmpresa()
  
  // Verificar se é admin - verificar também no localStorage como fallback
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSupervisor, setIsSupervisor] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Buscar cargo de todas as fontes possíveis
      let cargoFromMetadata: string | null = null
      let cargoFromProfile: string | null = null
      
      const userDataFromStorage = localStorage.getItem('user_data')
      const parsedUserData = userDataFromStorage ? JSON.parse(userDataFromStorage) : null
      const userRoleFromStorage = parsedUserData?.role || parsedUserData?.cargo
      cargoFromMetadata = parsedUserData?.user_metadata?.cargo || parsedUserData?.cargo || null
      
      const userProfileStr = localStorage.getItem('user_profile')
      if (userProfileStr) {
        try {
          const profile = JSON.parse(userProfileStr)
          cargoFromProfile = profile?.cargo || null
        } catch (e) {
          // Ignorar erro de parsing
        }
      }
      
      const adminCheck = userRole === 'Admin' || 
                        userRoleFromStorage === 'Admin' || 
                        userRoleFromStorage === 'admin' || 
                        userRoleFromStorage === 'Administrador' ||
                        (typeof userRoleFromStorage === 'string' && userRoleFromStorage.toLowerCase().includes('admin'))
      
      setIsAdmin(adminCheck)
      
      // Verificar se é supervisor - verificação robusta de múltiplas fontes
      const hookRole = userRole?.toLowerCase() || ''
      const cargoFromMetadataLower = cargoFromMetadata?.toLowerCase() || ''
      const cargoFromProfileLower = cargoFromProfile?.toLowerCase() || ''
      const userCargoLower = (user as any)?.cargo?.toLowerCase() || ''
      const userRoleFromStorageLower = userRoleFromStorage?.toLowerCase() || ''
      
      const allRolesArray = [
        cargoFromMetadataLower,
        cargoFromProfileLower,
        userCargoLower,
        hookRole,
        userRoleFromStorageLower
      ].filter(Boolean).filter((role, index, self) => self.indexOf(role) === index)
      
      const supervisorCheck = 
        isSupervisorHook() || // Usar hook primeiro
        allRolesArray.some(role => {
          if (!role) return false
          const roleLower = String(role).toLowerCase()
          return (
            roleLower.includes('supervisor') ||
            roleLower === 'supervisores'
          )
        })
      
      setIsSupervisor(supervisorCheck)
      
      // Debug: log para verificar se está detectando corretamente
      if (supervisorCheck) {
        console.log('[PERFIL] Supervisor detectado:', {
          userRole,
          cargoFromMetadata,
          cargoFromProfile,
          userCargo: (user as any)?.cargo,
          isSupervisorHook: isSupervisorHook()
        })
      }
    } catch (error) {
      console.warn('Erro ao verificar role:', error)
      setIsAdmin(false)
      setIsSupervisor(false)
    }
  }, [userRole, user, isSupervisorHook])
  
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    telefone: '',
    email: ''
  })
  const [isSimulatingManager, setIsSimulatingManager] = useState(false)
  const [funcionarioCompleto, setFuncionarioCompleto] = useState<any>(null)
  const [loadingFuncionario, setLoadingFuncionario] = useState(true)
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null)
  const [isResponsavelObra, setIsResponsavelObra] = useState(false)
  
  // Estados para as tabs - verificar se há parâmetro na URL
  const [activeTab, setActiveTab] = useState('informacoes')
  
  // Atualizar tab quando o parâmetro da URL mudar
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab('informacoes')
    }
  }, [searchParams])
  const [salarios, setSalarios] = useState<FolhaPagamento[]>([])
  const [beneficios, setBeneficios] = useState<FuncionarioBeneficio[]>([])
  const [certificados, setCertificados] = useState<CertificadoBackend[]>([])
  const [documentosAdmissionais, setDocumentosAdmissionais] = useState<DocumentoAdmissionalBackend[]>([])
  const [loadingSalarios, setLoadingSalarios] = useState(false)
  const [loadingBeneficios, setLoadingBeneficios] = useState(false)
  const [loadingCertificados, setLoadingCertificados] = useState(false)
  const [loadingDocumentosAdmissionais, setLoadingDocumentosAdmissionais] = useState(false)
  
  // Estados para modais e visualização
  const [documentoSelecionado, setDocumentoSelecionado] = useState<{ tipo: 'certificado' | 'admissional', data: any } | null>(null)
  const [isModalDocumentoOpen, setIsModalDocumentoOpen] = useState(false)
  const [urlArquivo, setUrlArquivo] = useState<string | null>(null)
  const [carregandoUrl, setCarregandoUrl] = useState(false)
  const [salarioSelecionado, setSalarioSelecionado] = useState<FolhaPagamento | null>(null)
  const [isModalSalarioOpen, setIsModalSalarioOpen] = useState(false)
  const [salarioDetalhado, setSalarioDetalhado] = useState<any>(null)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  
  // Estados para modal de upload de documento
  const [isModalUploadOpen, setIsModalUploadOpen] = useState(false)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [dataValidade, setDataValidade] = useState('')
  const [enviandoDocumento, setEnviandoDocumento] = useState(false)
  
  // Estados para modal de upload de certificado
  const [isModalCertificadoOpen, setIsModalCertificadoOpen] = useState(false)
  const [arquivoCertificadoSelecionado, setArquivoCertificadoSelecionado] = useState<File | null>(null)
  const [nomeCertificado, setNomeCertificado] = useState('')
  const [tipoCertificado, setTipoCertificado] = useState('')
  const [dataValidadeCertificado, setDataValidadeCertificado] = useState('')
  const [enviandoCertificado, setEnviandoCertificado] = useState(false)
  
  // Estados para modal de alterar senha
  const [isModalAlterarSenhaOpen, setIsModalAlterarSenhaOpen] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  // Carregar dados completos do funcionário da API
  useEffect(() => {
    const carregarFuncionarioCompleto = async () => {
      if (!user || typeof window === 'undefined') {
        setLoadingFuncionario(false)
        return
      }

      // Aguardar até que user.id esteja disponível
      if (!user.id) {
        console.log('[PERFIL] Aguardando user.id estar disponível...')
        setLoadingFuncionario(false)
        return
      }

      // Verificar se é responsável de obra
      try {
        const udStr = localStorage.getItem('user_data')
        if (udStr) {
          const ud = JSON.parse(udStr)
          const tipo = ud?.user_metadata?.tipo || ud?.user?.user_metadata?.tipo
          if (tipo === 'responsavel_obra') {
            const telefone = ud?.profile?.telefone || ud?.telefone || ud?.user_metadata?.telefone || ''
            const nome = ud?.profile?.nome || ud?.user_metadata?.nome || ud?.user?.user_metadata?.nome || user?.nome || 'Responsável'
            const email = ud?.profile?.email || user?.email || ud?.email || ''
            setIsResponsavelObra(true)
            setFuncionarioCompleto({
              nome,
              email,
              telefone,
              cargo: 'Responsável de Obra'
            })
            setUserData({
              telefone,
              email
            })
            setLoadingFuncionario(false)
            return
          }
        }
      } catch { /* ignore */ }

      try {
        setLoadingFuncionario(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          setLoadingFuncionario(false)
          return
        }

        // PRIORIDADE MÁXIMA: Usar funcionario_id da tabela usuarios (profile.funcionario_id ou user.funcionario_id)
        // Este é o vínculo correto entre usuarios e funcionarios (129)
        let funcionarioId: number | null = null
        
        // Tentar obter funcionario_id da tabela usuarios primeiro
        const funcionarioIdFromTable = user?.profile?.funcionario_id || user?.funcionario_id
        
        if (funcionarioIdFromTable && !isNaN(Number(funcionarioIdFromTable)) && Number(funcionarioIdFromTable) > 0) {
          // Verificar se o funcionário existe na API antes de usar
          try {
            const response = await funcionariosApi.obterFuncionario(Number(funcionarioIdFromTable))
            if (response.success && response.data) {
              funcionarioId = Number(funcionarioIdFromTable)
              console.log(`[PERFIL] ✅ PRIORIDADE MÁXIMA: Funcionário ${funcionarioId} encontrado na API (da tabela usuarios), usando este ID`)
            } else {
              console.log(`[PERFIL] ⚠️ Funcionário ${funcionarioIdFromTable} não encontrado na API, tentando funcionario_id do metadata`)
              // Continuar para tentar funcionario_id do metadata
            }
          } catch (apiError: any) {
            if (apiError?.response?.status === 404 || apiError?.status === 404) {
              console.log(`[PERFIL] ⚠️ Funcionário ${funcionarioIdFromTable} não encontrado na API (404), tentando funcionario_id do metadata`)
              // Continuar para tentar funcionario_id do metadata
            } else {
              console.warn('[PERFIL] Erro ao verificar funcionário da tabela:', apiError)
              // Continuar para tentar funcionario_id do metadata
            }
          }
        }
        
        // PRIORIDADE 2: Se funcionario_id da tabela não foi encontrado, tentar funcionario_id do metadata
        if (!funcionarioId) {
          const funcionarioIdFromMetadata = user?.user_metadata?.funcionario_id
          
          if (funcionarioIdFromMetadata && !isNaN(Number(funcionarioIdFromMetadata)) && Number(funcionarioIdFromMetadata) > 0) {
            try {
              const response = await funcionariosApi.obterFuncionario(Number(funcionarioIdFromMetadata))
              if (response.success && response.data) {
                funcionarioId = Number(funcionarioIdFromMetadata)
                console.log(`[PERFIL] ✅ PRIORIDADE 2: Funcionário ${funcionarioId} encontrado na API (do metadata), usando este ID`)
              } else {
                console.log(`[PERFIL] ⚠️ Funcionário ${funcionarioIdFromMetadata} não encontrado na API, usando user.id como fallback`)
                // Continuar para usar user.id como fallback
              }
            } catch (apiError: any) {
              if (apiError?.response?.status === 404 || apiError?.status === 404) {
                console.log(`[PERFIL] ⚠️ Funcionário ${funcionarioIdFromMetadata} não encontrado na API (404), usando user.id como fallback`)
                // Continuar para usar user.id como fallback
              } else {
                console.warn('[PERFIL] Erro ao verificar funcionário do metadata:', apiError)
                // Continuar para usar user.id como fallback
              }
            }
          }
        }
        
        // PRIORIDADE 3: Se funcionario_id não foi encontrado, usar user.id como fallback
        if (!funcionarioId && user.id && !isNaN(Number(user.id)) && Number(user.id) > 0) {
          funcionarioId = Number(user.id)
          console.log(`[PERFIL] ✅ PRIORIDADE 3: Usando user.id (${funcionarioId}) como fallback`)
        }
        
        // Se ainda não encontrou, tentar buscar via getFuncionarioId
        if (!funcionarioId) {
          try {
            console.log('[PERFIL] Tentando buscar via getFuncionarioId...')
            funcionarioId = await getFuncionarioId(user, token)
            
            if (!funcionarioId) {
              console.warn('[PERFIL] ID do funcionário não encontrado, usando dados do localStorage')
              setLoadingFuncionario(false)
              return
            }
          } catch (idError) {
            console.warn('[PERFIL] Erro ao buscar funcionario_id:', idError)
            setLoadingFuncionario(false)
            return
          }
        }

        if (funcionarioId) {
          console.log(`[PERFIL] Definindo funcionarioId: ${funcionarioId} (user.id: ${user?.id}, user_metadata.funcionario_id: ${user?.user_metadata?.funcionario_id})`)
          setFuncionarioId(funcionarioId)
          
          // Verificar se o funcionarioId é diferente do user.id e logar aviso
          if (funcionarioId !== Number(user.id)) {
            console.warn(`[PERFIL] ⚠️ ATENÇÃO: funcionarioId (${funcionarioId}) é diferente de user.id (${user.id})`)
          }
          
          try {
            console.log(`[PERFIL] Chamando API: /api/funcionarios/${funcionarioId}`)
            const response = await funcionariosApi.obterFuncionario(funcionarioId)
            if (response.success && response.data) {
              setFuncionarioCompleto(response.data)
              // Atualizar userData com dados da API
              setUserData({
                telefone: response.data.telefone || '',
                email: response.data.email || user?.email || ''
              })
            }
          } catch (apiError: any) {
            // Se for 404, o funcionário não existe - não é erro crítico
            // Silenciar o erro 404 para não poluir o console
            if (apiError?.response?.status === 404 || apiError?.status === 404 || apiError?.message?.includes('404') || apiError?.message?.includes('não existe')) {
              // Funcionário não encontrado - usar apenas dados do localStorage
              // Não logar erro para não poluir o console
              console.log(`[PERFIL] Funcionário ${funcionarioId} não encontrado na API (404), usando dados do localStorage`)
            } else {
              console.warn('Erro ao buscar dados do funcionário da API, usando dados do localStorage:', apiError)
            }
            // Não é um erro crítico - continuar com dados do localStorage
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do funcionário, usando dados do localStorage:', error)
      } finally {
        setLoadingFuncionario(false)
      }
    }

    carregarFuncionarioCompleto()
    
    // Carregar estado de simulação do localStorage
    const simulatingManager = localStorage.getItem('simulating_manager') === 'true'
    setIsSimulatingManager(simulatingManager)
  }, [user])

  const handleToggleSimulateManager = (checked: boolean) => {
    setIsSimulatingManager(checked)
    localStorage.setItem('simulating_manager', checked.toString())
    
    // Atualizar dados do usuário no localStorage para incluir cargo de gestor
    if (checked) {
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
      const updatedUser = {
        ...currentUser,
        cargo_original: currentUser.cargo,
        cargo: 'Encarregador Simulado'
      }
      localStorage.setItem('user_data', JSON.stringify(updatedUser))

      // Recarregar página para aplicar mudanças
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
      const updatedUser = {
        ...currentUser,
        cargo: currentUser.cargo_original || currentUser.cargo
      }
      delete updatedUser.cargo_original
      localStorage.setItem('user_data', JSON.stringify(updatedUser))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')

    // Como estamos na página PWA, sempre redirecionar para /pwa/login
    router.push('/pwa/login')
  }

  const handleAlterarSenha = async () => {
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      
      return
    }

    if (novaSenha.length < 6) {
      
      return
    }

    if (novaSenha !== confirmarNovaSenha) {
      
      return
    }

    setAlterandoSenha(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')

      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: senhaAtual,
          newPassword: novaSenha,
          confirmPassword: confirmarNovaSenha
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Notificação de sucesso
        toast({
          title: "Senha alterada com sucesso!",
          description: "Sua senha foi alterada com sucesso. Use a nova senha no próximo login.",
          variant: "default"
        })

        // Limpar formulário
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarNovaSenha('')
        setIsModalAlterarSenhaOpen(false)
      } else {
        throw new Error(data.error || 'Erro ao alterar senha')
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar sua senha. Verifique se a senha atual está correta.",
        variant: "destructive"
      })
    } finally {
      setAlterandoSenha(false)
    }
  }

  const handleSave = async () => {
    try {
      // Aqui você faria a chamada para a API para atualizar os dados
      
      setIsEditing(false)
    } catch (error) {
      // Erro ao salvar
    }
  }

  // Funções para carregar dados das tabs
  const carregarSalarios = async () => {
    if (!funcionarioId) return
    setLoadingSalarios(true)
    try {
      const response = await getFolhasPagamento({ funcionario_id: funcionarioId })
      if (response.success && response.data) {
        setSalarios(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar salários:', error)
    } finally {
      setLoadingSalarios(false)
    }
  }

  const carregarBeneficios = async () => {
    if (!funcionarioId) {
      console.log('[PERFIL] carregarBeneficios: funcionarioId não definido, não carregando')
      setLoadingBeneficios(false)
      setBeneficios([])
      return
    }
    console.log(`[PERFIL] carregarBeneficios: Carregando benefícios para funcionarioId ${funcionarioId}`)
    setLoadingBeneficios(true)
    try {
      const response = await getFuncionarioBeneficios({ funcionario_id: funcionarioId })
      console.log(`[PERFIL] carregarBeneficios: Resposta recebida:`, response)
      if (response.success && response.data) {
        setBeneficios(response.data)
        console.log(`[PERFIL] carregarBeneficios: ${response.data.length} benefícios carregados`)
      } else {
        console.log('[PERFIL] carregarBeneficios: Nenhum benefício retornado')
        setBeneficios([])
      }
    } catch (error: any) {
      // Se for 404, não logar erro (funcionário não existe)
      if (error?.status !== 404 && error?.response?.status !== 404) {
        console.error('[PERFIL] carregarBeneficios: Erro ao carregar benefícios:', error)
      } else {
        console.log('[PERFIL] carregarBeneficios: Funcionário não encontrado (404)')
      }
      setBeneficios([])
    } finally {
      setLoadingBeneficios(false)
    }
  }

  const carregarCertificados = async () => {
    if (!funcionarioId) return
    setLoadingCertificados(true)
    try {
      const response = await colaboradoresDocumentosApi.certificados.listar(funcionarioId)
      if (response.success && response.data) {
        setCertificados(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar certificados:', error)
    } finally {
      setLoadingCertificados(false)
    }
  }

  const carregarDocumentosAdmissionais = async () => {
    if (!funcionarioId) return
    setLoadingDocumentosAdmissionais(true)
    try {
      const response = await colaboradoresDocumentosApi.documentosAdmissionais.listar(funcionarioId)
      if (response.success && response.data) {
        setDocumentosAdmissionais(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar documentos admissionais:', error)
    } finally {
      setLoadingDocumentosAdmissionais(false)
    }
  }

  // Função para fazer upload do arquivo e criar documento admissional
  const handleUploadDocumento = async () => {
    if (!funcionarioId || !arquivoSelecionado || !tipoDocumento) {
      
      return
    }

    setEnviandoDocumento(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')

      // Primeiro, fazer upload do arquivo
      const formData = new FormData()
      formData.append('arquivo', arquivoSelecionado)
      
      const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.message || 'Erro ao fazer upload do arquivo')
      }

      const uploadData = await uploadResponse.json()
      // O endpoint retorna data.caminho (caminho no storage) e data.arquivo (URL pública)
      // Para documentos admissionais, precisamos do caminho no storage (data.caminho)
      const arquivoCaminho = uploadData.data?.caminho || uploadData.caminho

      if (!arquivoCaminho) {
        throw new Error('Caminho do arquivo não retornado pelo servidor')
      }

      // Depois, criar o documento admissional com o caminho do arquivo
      const documentoData = {
        tipo: tipoDocumento,
        data_validade: dataValidade || undefined,
        arquivo: arquivoCaminho
      }

      const response = await colaboradoresDocumentosApi.documentosAdmissionais.criar(funcionarioId, documentoData)

      if (response.success) {

        // Limpar formulário
        setArquivoSelecionado(null)
        setTipoDocumento('')
        setDataValidade('')
        setIsModalUploadOpen(false)
        
        // Recarregar lista de documentos
        await carregarDocumentosAdmissionais()
      } else {
        throw new Error('Erro ao criar documento admissional')
      }
    } catch (error) {
      console.error('Erro ao enviar documento:', error)
    } finally {
      setEnviandoDocumento(false)
    }
  }

  // Função para fazer upload do arquivo e criar certificado
  const handleUploadCertificado = async () => {
    if (!funcionarioId || !arquivoCertificadoSelecionado || !nomeCertificado || !tipoCertificado) {
      
      return
    }

    setEnviandoCertificado(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')

      // Primeiro, fazer upload do arquivo
      const formData = new FormData()
      formData.append('arquivo', arquivoCertificadoSelecionado)
      
      const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.message || 'Erro ao fazer upload do arquivo')
      }

      const uploadData = await uploadResponse.json()
      const arquivoCaminho = uploadData.data?.caminho || uploadData.caminho

      if (!arquivoCaminho) {
        throw new Error('Caminho do arquivo não retornado pelo servidor')
      }

      // Depois, criar o certificado com o caminho do arquivo
      const certificadoData = {
        tipo: tipoCertificado,
        nome: nomeCertificado,
        data_validade: dataValidadeCertificado || undefined,
        arquivo: arquivoCaminho
      }

      const response = await colaboradoresDocumentosApi.certificados.criar(funcionarioId, certificadoData)

      if (response.success) {

        // Limpar formulário
        setArquivoCertificadoSelecionado(null)
        setNomeCertificado('')
        setTipoCertificado('')
        setDataValidadeCertificado('')
        setIsModalCertificadoOpen(false)
        
        // Recarregar lista de certificados
        await carregarCertificados()
      } else {
        throw new Error('Erro ao criar certificado')
      }
    } catch (error) {
      console.error('Erro ao enviar certificado:', error)
    } finally {
      setEnviandoCertificado(false)
    }
  }

  // Garantir que funcionarioId use o funcionario_id da tabela usuarios quando disponível
  // NÃO sobrescrever se já estiver definido corretamente
  useEffect(() => {
    // Priorizar funcionario_id da tabela usuarios (profile.funcionario_id ou user.funcionario_id)
    const funcionarioIdFromTable = user?.profile?.funcionario_id || user?.funcionario_id
    
    if (funcionarioIdFromTable && !isNaN(Number(funcionarioIdFromTable)) && Number(funcionarioIdFromTable) > 0) {
      const tableFuncionarioId = Number(funcionarioIdFromTable)
      // Se funcionarioId não está definido ou é diferente do da tabela, atualizar
      if (!funcionarioId || funcionarioId !== tableFuncionarioId) {
        console.log(`[PERFIL] Definindo funcionarioId como funcionario_id da tabela usuarios (${tableFuncionarioId})`)
        setFuncionarioId(tableFuncionarioId)
      }
    } else if (!funcionarioId && user?.id && !isNaN(Number(user.id)) && Number(user.id) > 0) {
      // Apenas usar user.id como fallback se não houver funcionario_id na tabela
      const userId = Number(user.id)
      console.log(`[PERFIL] Definindo funcionarioId como user.id (${userId}) - fallback`)
      setFuncionarioId(userId)
    }
  }, [user?.profile?.funcionario_id, user?.funcionario_id, user?.id, funcionarioId])

  // Carregar dados quando a tab for ativada
  useEffect(() => {
    // Se não tiver funcionarioId, apenas limpar estados e não carregar nada
    if (!funcionarioId) {
      if (activeTab === 'salarios') {
        setSalarios([])
        setLoadingSalarios(false)
      } else if (activeTab === 'beneficios') {
        setBeneficios([])
        setLoadingBeneficios(false)
      } else if (activeTab === 'certificados') {
        setCertificados([])
        setLoadingCertificados(false)
      } else if (activeTab === 'documentos-admissionais') {
        setDocumentosAdmissionais([])
        setLoadingDocumentosAdmissionais(false)
      }
      return
    }
    
    if (activeTab === 'salarios') {
      carregarSalarios()
    } else if (activeTab === 'beneficios') {
      carregarBeneficios()
    } else if (activeTab === 'certificados') {
      carregarCertificados()
    } else if (activeTab === 'documentos-admissionais') {
      carregarDocumentosAdmissionais()
    }
  }, [activeTab, funcionarioId])

  // Função para visualizar documento
  const handleVisualizarDocumento = async (tipo: 'certificado' | 'admissional', documento: any) => {
    setDocumentoSelecionado({ tipo, data: documento })
    setIsModalDocumentoOpen(true)
    setUrlArquivo(null)
    setCarregandoUrl(true)

    if (documento.arquivo) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        if (documento.arquivo.startsWith('http')) {
          setUrlArquivo(documento.arquivo)
        } else {
          try {
            const urlResponse = await fetch(
              `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documento.arquivo)}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (urlResponse.ok) {
              const urlData = await urlResponse.json()
              const urlAssinada = urlData.url || urlData.data?.url
              if (urlAssinada && urlAssinada.startsWith('http')) {
                setUrlArquivo(urlAssinada)
              } else {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
                if (supabaseUrl) {
                  setUrlArquivo(`${supabaseUrl}/storage/v1/object/public/arquivos-obras/${documento.arquivo}`)
                } else {
                  setUrlArquivo(`${apiUrl}/uploads/${documento.arquivo}`)
                }
              }
            } else {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
              if (supabaseUrl) {
                setUrlArquivo(`${supabaseUrl}/storage/v1/object/public/arquivos-obras/${documento.arquivo}`)
              } else {
                setUrlArquivo(`${apiUrl}/uploads/${documento.arquivo}`)
              }
            }
          } catch (error) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            if (supabaseUrl) {
              setUrlArquivo(`${supabaseUrl}/storage/v1/object/public/arquivos-obras/${documento.arquivo}`)
            } else {
              setUrlArquivo(`${apiUrl}/uploads/${documento.arquivo}`)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar URL do arquivo:', error)
      } finally {
        setCarregandoUrl(false)
      }
    } else {
      setCarregandoUrl(false)
    }
  }

  const handleDownload = async (arquivo: string, nome: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      let url = arquivo
      if (!arquivo.startsWith('http')) {
        try {
          const urlResponse = await fetch(
            `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(arquivo)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (urlResponse.ok) {
            const urlData = await urlResponse.json()
            url = urlData.url || urlData.data?.url || url
          }
        } catch (error) {
          console.error('Erro ao obter URL assinada:', error)
        }
      }
      
      const link = document.createElement('a')
      link.href = url
      link.download = nome
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
    }
  }

  // Função para visualizar detalhes do salário
  const handleVisualizarSalario = async (salario: FolhaPagamento) => {
    setSalarioSelecionado(salario)
    setIsModalSalarioOpen(true)
    setSalarioDetalhado(null)
    setCarregandoDetalhes(true)

    try {
      const response = await getFolhaPagamento(salario.id)
      if (response.success && response.data) {
        setSalarioDetalhado(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do salário:', error)
    } finally {
      setCarregandoDetalhes(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Não foi possível carregar os dados do perfil</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-[#75180a] rounded-xl p-4 -mx-4 -mt-4 mb-4">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-gray-200">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto e Informações Principais */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {funcionarioCompleto?.nome || user?.nome || 'Usuário'}
              </h2>
              <p className="text-gray-600 mb-2">
                {funcionarioCompleto?.cargo || user?.cargo || 'Sem cargo'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
                <Badge variant="outline">
                  ID: {user?.id || 'N/A'}
                </Badge>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Dados do Usuário */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  E-mail
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {funcionarioCompleto?.email || userData.email || user?.email || 'Não informado'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="telefone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefone
                </Label>
                {isEditing ? (
                  <Input
                    id="telefone"
                    type="tel"
                    value={userData.telefone}
                    onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {funcionarioCompleto?.telefone || userData.telefone || 'Não informado'}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Cargo
                </Label>
                <p className="mt-1 text-gray-900">
                  {funcionarioCompleto?.cargo || user?.cargo || 'Não informado'}
                </p>
              </div>

              <div>
                <Label>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data de Admissão
                </Label>
                <p className="mt-1 text-gray-900">
                  {funcionarioCompleto?.data_admissao 
                    ? new Date(funcionarioCompleto.data_admissao).toLocaleDateString('pt-BR')
                    : (user as any).dataAdmissao 
                      ? new Date((user as any).dataAdmissao).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Alterar Senha */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#871b0b]" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsModalAlterarSenhaOpen(true)}
            className="w-full bg-[#871b0b] hover:bg-[#6b1509]"
          >
            <Lock className="w-4 h-4 mr-2" />
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Links de Teste - Apenas para Admin */}
      {isAdmin && (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Eye className="w-5 h-5" />
            Links de Teste
            <Badge variant="outline" className="text-xs">Desenvolvimento</Badge>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Acesso rápido às páginas de teste do sistema de aprovação de horas extras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Assinatura Digital */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacao-assinatura')}
            >
              <Monitor className="w-4 h-4 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-800">Assinatura Digital</p>
                <p className="text-xs text-blue-600">Aprovar horas extras com assinatura</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-blue-500" />
            </Button>

            {/* PWA de Aprovações */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacoes')}
            >
              <Smartphone className="w-4 h-4 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-800">Minhas Aprovações</p>
                <p className="text-xs text-green-600">Interface mobile para funcionários</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-green-500" />
            </Button>

            {/* Aprovação em Massa */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/aprovacao-massa')}
            >
              <CheckSquare className="w-4 h-4 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-800">Aprovação em Massa</p>
                <p className="text-xs text-purple-600">Selecionar múltiplas aprovações</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-purple-500" />
            </Button>

            {/* Página de Demonstração */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => window.open('/teste-aprovacoes', '_blank')}
            >
              <Eye className="w-4 h-4 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-800">Demonstração Completa</p>
                <p className="text-xs text-purple-600">Todas as funcionalidades em uma página</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-purple-500" />
            </Button>

            {/* Fluxo de Demonstração */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => router.push('/pwa/fluxo-aprovacao-demo')}
            >
              <Calendar className="w-4 h-4 mr-3 text-indigo-600" />
              <div className="text-left">
                <p className="font-medium text-indigo-800">Fluxo de Aprovação</p>
                <p className="text-xs text-indigo-600">Demonstração completa do processo</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-indigo-500" />
            </Button>

            {/* Navegação de Teste */}
            <Button
              variant="outline"
              className="w-full justify-start bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => window.open('/navegacao-teste', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-3 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">Navegação de Teste</p>
                <p className="text-xs text-gray-600">Acesso rápido a todas as páginas</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-500" />
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Informações</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>Assinatura:</strong> Para gestores aprovarem com assinatura digital</li>
              <li>• <strong>PWA:</strong> Para funcionários acompanharem aprovações</li>
              <li>• <strong>Massa:</strong> Selecionar múltiplas aprovações para assinar</li>
              <li>• <strong>Demonstração:</strong> Visualização completa do sistema</li>
              <li>• <strong>Fluxo:</strong> Processo completo passo a passo</li>
              <li>• <strong>Navegação:</strong> Links organizados para testes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Modo de Teste - Simular Gestor - Apenas para Admin */}
      {isAdmin && (
      <Card className={isSimulatingManager ? "border-2 border-orange-500 bg-orange-50" : "border border-gray-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Modo de Teste - Simular Gestor
            {isSimulatingManager && (
              <Badge className="bg-orange-600 text-white">
                Ativo
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Ative esta opção para testar funcionalidades de encarregador/supervisor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSimulatingManager ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Users className={`w-5 h-5 ${isSimulatingManager ? 'text-orange-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">Simular cargo de Encarregador</p>
                  <p className="text-sm text-gray-600">
                    {isSimulatingManager 
                      ? 'Você tem acesso às funções de aprovação' 
                      : 'Ative para testar aprovações de ponto e horas extras'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSimulatingManager}
                onCheckedChange={handleToggleSimulateManager}
              />
            </div>

            {isSimulatingManager && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Modo Gestor Ativo</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Você agora tem acesso a:
                    </p>
                    <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Página do Encarregador no menu</li>
                      <li>Aprovação de horas extras</li>
                      <li>Gestão de funcionários</li>
                      <li>Relatórios de equipe</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Menu de Seções - Mobile First (esconder para responsável de obra) */}
      {!isResponsavelObra && (
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Minhas Informações</h2>
          <p className="text-sm text-gray-600">Acesse todas as suas informações</p>
        </div>

        {/* Cards de Navegação */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab('informacoes')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeTab === 'informacoes'
                ? 'border-[#871b0b] bg-red-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                activeTab === 'informacoes' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <User className={`w-5 h-5 ${
                  activeTab === 'informacoes' ? 'text-[#871b0b]' : 'text-gray-600'
                }`} />
              </div>
              <span className={`font-semibold text-sm ${
                activeTab === 'informacoes' ? 'text-[#871b0b]' : 'text-gray-900'
              }`}>
                Informações
              </span>
            </div>
            <p className="text-xs text-gray-500">Dados pessoais</p>
          </button>

          <button
            onClick={() => setActiveTab('salarios')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeTab === 'salarios'
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                activeTab === 'salarios' ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${
                  activeTab === 'salarios' ? 'text-emerald-600' : 'text-gray-600'
                }`} />
              </div>
              <span className={`font-semibold text-sm ${
                activeTab === 'salarios' ? 'text-emerald-600' : 'text-gray-900'
              }`}>
                Salários
              </span>
            </div>
            <p className="text-xs text-gray-500">Folhas de pagamento</p>
          </button>

          {!isClientRole() && (
            <button
              onClick={() => setActiveTab('beneficios')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeTab === 'beneficios'
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'beneficios' ? 'bg-pink-100' : 'bg-gray-100'
                }`}>
                  <Gift className={`w-5 h-5 ${
                    activeTab === 'beneficios' ? 'text-pink-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`font-semibold text-sm ${
                  activeTab === 'beneficios' ? 'text-pink-600' : 'text-gray-900'
                }`}>
                  Benefícios
                </span>
              </div>
              <p className="text-xs text-gray-500">Meus benefícios</p>
            </button>
          )}

          {!isClientRole() && (
            <button
              onClick={() => setActiveTab('certificados')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeTab === 'certificados'
                  ? 'border-amber-600 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'certificados' ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <Award className={`w-5 h-5 ${
                    activeTab === 'certificados' ? 'text-amber-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`font-semibold text-sm ${
                  activeTab === 'certificados' ? 'text-amber-600' : 'text-gray-900'
                }`}>
                  Certificados
                </span>
              </div>
              <p className="text-xs text-gray-500">Gerenciar certificados</p>
            </button>
          )}

          <button
            onClick={() => setActiveTab('documentos-admissionais')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeTab === 'documentos-admissionais'
                ? 'border-cyan-600 bg-cyan-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                activeTab === 'documentos-admissionais' ? 'bg-cyan-100' : 'bg-gray-100'
              }`}>
                <FileCheck className={`w-5 h-5 ${
                  activeTab === 'documentos-admissionais' ? 'text-cyan-600' : 'text-gray-600'
                }`} />
              </div>
              <span className={`font-semibold text-sm ${
                activeTab === 'documentos-admissionais' ? 'text-cyan-600' : 'text-gray-900'
              }`}>
                Admissionais
              </span>
            </div>
            <p className="text-xs text-gray-500">Documentos admissionais</p>
          </button>

          {!isClientRole() && (
            <button
              onClick={() => setActiveTab('holerites')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeTab === 'holerites'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'holerites' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Receipt className={`w-5 h-5 ${
                    activeTab === 'holerites' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`font-semibold text-sm ${
                  activeTab === 'holerites' ? 'text-green-600' : 'text-gray-900'
                }`}>
                  Holerites
                </span>
              </div>
              <p className="text-xs text-gray-500">Visualizar holerites</p>
            </button>
          )}
        </div>
      </div>
      )}

      {/* Conteúdo da Seção Selecionada */}
      {!isResponsavelObra && (
      <div className="w-full">

            {/* Seção Informações */}
            {activeTab === 'informacoes' && (
            <div className="space-y-4">
              {/* Ponto Hoje */}
              {pontoHoje && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Registro de Ponto Hoje</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Entrada</Label>
                      <p className="font-medium text-gray-900">
                        {pontoHoje.entrada 
                          ? new Date(pontoHoje.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Saída Almoço</Label>
                      <p className="font-medium text-gray-900">
                        {pontoHoje.saida_almoco 
                          ? new Date(pontoHoje.saida_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Volta Almoço</Label>
                      <p className="font-medium text-gray-900">
                        {pontoHoje.volta_almoco 
                          ? new Date(pontoHoje.volta_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Saída</Label>
                      <p className="font-medium text-gray-900">
                        {pontoHoje.saida 
                          ? new Date(pontoHoje.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
            )}

            {/* Seção Salários */}
            {activeTab === 'salarios' && (
            <div className="mt-0">
              {loadingSalarios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando salários...</span>
                </div>
              ) : salarios.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nenhum registro de salário encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salarios.map((salario) => (
                    <div 
                      key={salario.id} 
                      className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-3">
                            {new Date(salario.mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Salário Líquido</p>
                              <p className="font-bold text-lg text-emerald-600">
                                R$ {salario.salario_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Salário Base</p>
                              <p className="font-medium">
                                R$ {salario.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisualizarSalario(salario)}
                          className="ml-4"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Seção Benefícios */}
            {activeTab === 'beneficios' && !isClientRole() && (
            <div className="mt-0">
              {loadingBeneficios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando benefícios...</span>
                </div>
              ) : beneficios.length === 0 ? (
                <Card className="w-full">
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-xl font-semibold mb-2 text-gray-700">Nenhum benefício cadastrado</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Você ainda não possui benefícios cadastrados. Seus benefícios aparecerão aqui quando estiverem disponíveis.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {beneficios.map((beneficio) => (
                    <div 
                      key={beneficio.id} 
                      className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-3">
                            {beneficio.beneficios_tipo?.tipo || 'Benefício'}
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Valor</p>
                              <p className="font-bold text-lg text-pink-600">
                                {beneficio.beneficios_tipo?.valor 
                                  ? `R$ ${beneficio.beneficios_tipo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Período</p>
                              <p className="font-medium text-xs">
                                {new Date(beneficio.data_inicio).toLocaleDateString('pt-BR')}
                                {beneficio.data_fim && ` - ${new Date(beneficio.data_fim).toLocaleDateString('pt-BR')}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Seção Certificados */}
            {activeTab === 'certificados' && !isClientRole() && (
            <div className="mt-0">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsModalCertificadoOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Certificado
                </Button>
              </div>
              {loadingCertificados ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando certificados...</span>
                </div>
              ) : certificados.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nenhum certificado encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificados.map((certificado) => {
                    const diasParaVencimento = certificado.data_validade 
                      ? calcularDiasParaVencimento(certificado.data_validade)
                      : Infinity
                    const avisoVencimento = diasParaVencimento !== Infinity 
                      ? getAvisoVencimento(diasParaVencimento)
                      : null
                    
                    const IconComponent = avisoVencimento ? avisoVencimento.icon : null
                    
                    return (
                    <div 
                      key={certificado.id} 
                      className={`bg-white rounded-xl p-4 hover:shadow-md transition-shadow border ${
                        diasParaVencimento < 0 
                          ? 'border-red-200 bg-red-50' 
                          : diasParaVencimento <= 7 
                          ? 'border-orange-200 bg-orange-50'
                          : diasParaVencimento <= 30
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg">
                              {certificado.nome}
                            </h4>
                            {avisoVencimento && IconComponent && (
                              <Badge className={`text-xs flex items-center gap-1 ${avisoVencimento.className}`}>
                                <IconComponent className="w-3 h-3" />
                                {avisoVencimento.texto}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Tipo</p>
                              <p className="font-medium">{certificado.tipo}</p>
                            </div>
                            {certificado.data_validade && (
                              <div>
                                <p className="text-gray-500 text-xs mb-1">Validade</p>
                                <p className="font-medium text-xs">
                                  {new Date(certificado.data_validade).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {certificado.arquivo && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVisualizarDocumento('certificado', certificado)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(certificado.arquivo!, certificado.nome)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
            )}

            {/* Seção Documentos Admissionais */}
            {activeTab === 'documentos-admissionais' && (
            <div className="mt-0">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsModalUploadOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Documento
                </Button>
              </div>
              {loadingDocumentosAdmissionais ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando documentos...</span>
                </div>
              ) : documentosAdmissionais.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nenhum documento admissional encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentosAdmissionais.map((doc) => {
                    const diasParaVencimento = doc.data_validade 
                      ? calcularDiasParaVencimento(doc.data_validade)
                      : Infinity
                    const avisoVencimento = diasParaVencimento !== Infinity 
                      ? getAvisoVencimento(diasParaVencimento)
                      : null
                    
                    const IconComponent = avisoVencimento ? avisoVencimento.icon : null
                    
                    return (
                    <div 
                      key={doc.id} 
                      className={`bg-white rounded-xl p-4 hover:shadow-md transition-shadow border ${
                        diasParaVencimento < 0 
                          ? 'border-red-200 bg-red-50' 
                          : diasParaVencimento <= 7 
                          ? 'border-orange-200 bg-orange-50'
                          : diasParaVencimento <= 30
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg">
                              {doc.tipo}
                            </h4>
                            {avisoVencimento && IconComponent && (
                              <Badge className={`text-xs flex items-center gap-1 ${avisoVencimento.className}`}>
                                <IconComponent className="w-3 h-3" />
                                {avisoVencimento.texto}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {doc.data_validade && (
                              <div>
                                <p className="text-gray-500 text-xs mb-1">Validade</p>
                                <p className="font-medium text-xs">
                                  {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Criado em</p>
                              <p className="font-medium text-xs">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                        {doc.arquivo && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVisualizarDocumento('admissional', doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc.arquivo, doc.tipo)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })}
                </div>
              )}
            </div>
            )}

            {/* Seção Holerites */}
            {activeTab === 'holerites' && !isClientRole() && (
            <div className="mt-0">
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">Acesse a página de holerites para visualizar e assinar</p>
                <Button onClick={() => router.push('/pwa/holerites')}>
                  Ver Holerites
                </Button>
              </div>
            </div>
            )}

            {/* Seção Documentos */}
            {activeTab === 'documentos' && (
            <div className="mt-0">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Documentos gerais em breve</p>
              </div>
            </div>
            )}
          </div>
      )}

      {/* Modal de Visualização de Documento */}
      <Dialog open={isModalDocumentoOpen} onOpenChange={setIsModalDocumentoOpen}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>
              {documentoSelecionado?.tipo === 'certificado' ? 'Certificado' : 'Documento Admissional'}
            </DialogTitle>
            <DialogDescription>
              {documentoSelecionado?.data.nome || documentoSelecionado?.data.tipo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6 pt-0">
            {carregandoUrl ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando arquivo...</span>
              </div>
            ) : urlArquivo ? (
              <div className="border rounded-lg p-4">
                <iframe
                  src={urlArquivo}
                  className="w-full h-[600px] border-0"
                  title="Visualização do Documento"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 bg-gray-50">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2 text-gray-700">Não foi possível exibir o documento.</p>
                <p className="text-sm text-gray-500 mb-4">
                  Ocorreu um erro ao carregar o arquivo ou o formato não é suportado para visualização direta.
                </p>
                {documentoSelecionado?.data.arquivo && (
                  <Button onClick={() => handleDownload(documentoSelecionado.data.arquivo, documentoSelecionado.data.nome || documentoSelecionado.data.tipo)}>
                    <Download className="w-4 h-4 mr-2" /> Baixar Documento
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Salário */}
      <Dialog open={isModalSalarioOpen} onOpenChange={setIsModalSalarioOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Detalhes da Folha de Pagamento
            </DialogTitle>
            <DialogDescription>
              {salarioSelecionado && new Date(salarioSelecionado.mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          
          {carregandoDetalhes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando detalhes...</span>
            </div>
          ) : salarioSelecionado && (
            <div className="space-y-4 mt-4">
              {/* Resumo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">
                    {new Date(salarioSelecionado.mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              {/* Proventos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proventos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Salário Base</span>
                    <span className="font-semibold">
                      R$ {salarioSelecionado.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {salarioSelecionado.horas_trabalhadas > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Horas Trabalhadas</span>
                      <span className="font-medium">{salarioSelecionado.horas_trabalhadas}h</span>
                    </div>
                  )}
                  {salarioSelecionado.horas_extras > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Horas Extras</span>
                      <span className="font-medium">{salarioSelecionado.horas_extras}h</span>
                    </div>
                  )}
                  {salarioSelecionado.valor_hora_extra > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor Hora Extra</span>
                      <span className="font-medium">
                        R$ {salarioSelecionado.valor_hora_extra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Proventos</span>
                      <span className="font-bold text-lg">
                        R$ {salarioSelecionado.total_proventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descontos */}
              {salarioDetalhado?.descontos && salarioDetalhado.descontos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descontos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {salarioDetalhado.descontos.map((desconto: any) => (
                      <div key={desconto.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{desconto.descontos_tipo?.tipo || 'Desconto'}</p>
                          {desconto.observacoes && (
                            <p className="text-xs text-gray-500">{desconto.observacoes}</p>
                          )}
                        </div>
                        <span className="font-semibold text-red-600">
                          R$ {desconto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Descontos</span>
                        <span className="font-bold text-lg text-red-600">
                          R$ {salarioSelecionado.total_descontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Salário Líquido */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-emerald-900">Salário Líquido</span>
                    <span className="font-bold text-2xl text-emerald-600">
                      R$ {salarioSelecionado.salario_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {salarioSelecionado.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{salarioSelecionado.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Upload de Documento Admissional */}
      <Dialog open={isModalUploadOpen} onOpenChange={setIsModalUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Enviar Documento Admissional
            </DialogTitle>
            <DialogDescription>
              Faça upload de um documento admissional para seu perfil
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="tipo-documento">
                Tipo de Documento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tipo-documento"
                placeholder="Ex: RG, CPF, CTPS, etc."
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="arquivo">
                Arquivo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="arquivo"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (máximo 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: 'Arquivo muito grande',
                        description: 'O arquivo deve ter no máximo 10MB',
                        variant: 'destructive'
                      })
                      return
                    }
                    setArquivoSelecionado(file)
                  }
                }}
                className="mt-1"
              />
              {arquivoSelecionado && (
                <p className="text-sm text-gray-600 mt-1">
                  Arquivo selecionado: {arquivoSelecionado.name} ({(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="data-validade">
                Data de Validade (opcional)
              </Label>
              <Input
                id="data-validade"
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalUploadOpen(false)
                  setArquivoSelecionado(null)
                  setTipoDocumento('')
                  setDataValidade('')
                }}
                disabled={enviandoDocumento}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadDocumento}
                disabled={enviandoDocumento || !arquivoSelecionado || !tipoDocumento}
              >
                {enviandoDocumento ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Alterar Senha */}
      <Dialog open={isModalAlterarSenhaOpen} onOpenChange={setIsModalAlterarSenhaOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#871b0b]" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Digite sua senha atual e a nova senha desejada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="senha-atual">
                Senha Atual <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="senha-atual"
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  placeholder="Digite sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="mt-1 pr-10"
                  disabled={alterandoSenha}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  disabled={alterandoSenha}
                >
                  {mostrarSenhaAtual ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="nova-senha">
                Nova Senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="nova-senha"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="mt-1 pr-10"
                  minLength={6}
                  disabled={alterandoSenha}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  disabled={alterandoSenha}
                >
                  {mostrarNovaSenha ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="confirmar-nova-senha">
                Confirmar Nova Senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmar-nova-senha"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  placeholder="Digite novamente sua nova senha"
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                  className="mt-1 pr-10"
                  minLength={6}
                  disabled={alterandoSenha}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  disabled={alterandoSenha}
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Indicador de força da senha */}
            {novaSenha && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${novaSenha.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${novaSenha.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(novaSenha) && /[0-9]/.test(novaSenha) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[!@#$%^&*]/.test(novaSenha) ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Força da senha: {
                    novaSenha.length < 6 ? 'Muito fraca' :
                    novaSenha.length < 8 ? 'Fraca' :
                    /[A-Z]/.test(novaSenha) && /[0-9]/.test(novaSenha) ? 'Forte' :
                    'Média'
                  }
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalAlterarSenhaOpen(false)
                  setSenhaAtual('')
                  setNovaSenha('')
                  setConfirmarNovaSenha('')
                }}
                disabled={alterandoSenha}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAlterarSenha}
                disabled={alterandoSenha || !senhaAtual || !novaSenha || !confirmarNovaSenha}
                className="bg-[#871b0b] hover:bg-[#6b1509]"
              >
                {alterandoSenha ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Upload de Certificado */}
      <Dialog open={isModalCertificadoOpen} onOpenChange={setIsModalCertificadoOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Enviar Certificado
            </DialogTitle>
            <DialogDescription>
              Faça upload de um certificado para seu perfil
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome-certificado">
                Nome do Certificado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome-certificado"
                placeholder="Ex: NR-10, NR-35, CIPA, etc."
                value={nomeCertificado}
                onChange={(e) => setNomeCertificado(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tipo-certificado">
                Tipo de Certificado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tipo-certificado"
                placeholder="Ex: Segurança, Operação, Técnico, etc."
                value={tipoCertificado}
                onChange={(e) => setTipoCertificado(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="arquivo-certificado">
                Arquivo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="arquivo-certificado"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (máximo 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: 'Arquivo muito grande',
                        description: 'O arquivo deve ter no máximo 10MB',
                        variant: 'destructive'
                      })
                      return
                    }
                    setArquivoCertificadoSelecionado(file)
                  }
                }}
                className="mt-1"
              />
              {arquivoCertificadoSelecionado && (
                <p className="text-sm text-gray-600 mt-1">
                  Arquivo selecionado: {arquivoCertificadoSelecionado.name} ({(arquivoCertificadoSelecionado.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="data-validade-certificado">
                Data de Validade (opcional)
              </Label>
              <Input
                id="data-validade-certificado"
                type="date"
                value={dataValidadeCertificado}
                onChange={(e) => setDataValidadeCertificado(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalCertificadoOpen(false)
                  setArquivoCertificadoSelecionado(null)
                  setNomeCertificado('')
                  setTipoCertificado('')
                  setDataValidadeCertificado('')
                }}
                disabled={enviandoCertificado}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadCertificado}
                disabled={enviandoCertificado || !arquivoCertificadoSelecionado || !nomeCertificado || !tipoCertificado}
              >
                {enviandoCertificado ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PWAPerfilPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <PWAPerfilPageContent />
    </Suspense>
  )
}

