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
  Loader2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePWAUser } from "@/hooks/use-pwa-user"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { useEmpresa } from "@/hooks/use-empresa"
import { colaboradoresDocumentosApi, CertificadoBackend, DocumentoAdmissionalBackend } from "@/lib/api-colaboradores-documentos"
import { getFolhasPagamento, getFolhaPagamento, getFuncionarioBeneficios, FolhaPagamento, FuncionarioBeneficio } from "@/lib/api-remuneracao"

function PWAPerfilPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, pontoHoje, documentosPendentes, horasTrabalhadas, loading } = usePWAUser()
  const { userRole } = usePWAPermissions()
  const { empresa, getEnderecoCompleto, getContatoCompleto, getHorarioFuncionamento } = useEmpresa()
  
  // Verificar se é admin - verificar também no localStorage como fallback
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const userDataFromStorage = localStorage.getItem('user_data')
      const parsedUserData = userDataFromStorage ? JSON.parse(userDataFromStorage) : null
      const userRoleFromStorage = parsedUserData?.role || parsedUserData?.cargo
      
      const adminCheck = userRole === 'Admin' || 
                        userRoleFromStorage === 'Admin' || 
                        userRoleFromStorage === 'admin' || 
                        userRoleFromStorage === 'Administrador' ||
                        (typeof userRoleFromStorage === 'string' && userRoleFromStorage.toLowerCase().includes('admin'))
      
      setIsAdmin(adminCheck)
    } catch (error) {
      console.warn('Erro ao verificar se é admin:', error)
      setIsAdmin(false)
    }
  }, [userRole])
  
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    telefone: '',
    email: ''
  })
  const [isSimulatingManager, setIsSimulatingManager] = useState(false)
  const [funcionarioCompleto, setFuncionarioCompleto] = useState<any>(null)
  const [loadingFuncionario, setLoadingFuncionario] = useState(true)
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null)
  
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

  // Carregar dados completos do funcionário da API
  useEffect(() => {
    const carregarFuncionarioCompleto = async () => {
      if (!user || typeof window === 'undefined') {
        setLoadingFuncionario(false)
        return
      }

      try {
        setLoadingFuncionario(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          setLoadingFuncionario(false)
          return
        }

        let funcionarioId: number | null = null
        
        try {
          funcionarioId = await getFuncionarioIdWithFallback(
            user,
            token,
            'ID do funcionário não encontrado'
          )
        } catch (idError) {
          // Se não encontrar o ID, não é um erro crítico - apenas logar e continuar
          console.warn('ID do funcionário não encontrado, usando dados do localStorage:', idError)
          setLoadingFuncionario(false)
          return
        }

        if (funcionarioId) {
          setFuncionarioId(funcionarioId)
          try {
            const response = await funcionariosApi.obterFuncionario(funcionarioId)
            if (response.success && response.data) {
              setFuncionarioCompleto(response.data)
              // Atualizar userData com dados da API
              setUserData({
                telefone: response.data.telefone || '',
                email: response.data.email || user.email || ''
              })
            }
          } catch (apiError) {
            console.warn('Erro ao buscar dados do funcionário da API, usando dados do localStorage:', apiError)
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
      
      toast({
        title: "✅ Modo Gestor Ativado",
        description: "Você agora tem acesso a funcionalidades de encarregador",
        variant: "default"
      })
      
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
      
      toast({
        title: "Modo Gestor Desativado",
        description: "Você voltou ao seu cargo original",
        variant: "default"
      })
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    })
    
    // Como estamos na página PWA, sempre redirecionar para /pwa/login
    router.push('/pwa/login')
  }

  const handleSave = async () => {
    try {
      // Aqui você faria a chamada para a API para atualizar os dados
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados",
        variant: "destructive"
      })
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os salários",
        variant: "destructive"
      })
    } finally {
      setLoadingSalarios(false)
    }
  }

  const carregarBeneficios = async () => {
    if (!funcionarioId) return
    setLoadingBeneficios(true)
    try {
      const response = await getFuncionarioBeneficios({ funcionario_id: funcionarioId })
      if (response.success && response.data) {
        setBeneficios(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os benefícios",
        variant: "destructive"
      })
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os certificados",
        variant: "destructive"
      })
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos admissionais",
        variant: "destructive"
      })
    } finally {
      setLoadingDocumentosAdmissionais(false)
    }
  }

  // Função para fazer upload do arquivo e criar documento admissional
  const handleUploadDocumento = async () => {
    if (!funcionarioId || !arquivoSelecionado || !tipoDocumento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
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
        toast({
          title: "Sucesso",
          description: "Documento enviado com sucesso"
        })
        
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
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível enviar o documento",
        variant: "destructive"
      })
    } finally {
      setEnviandoDocumento(false)
    }
  }

  // Carregar dados quando a tab for ativada
  useEffect(() => {
    if (!funcionarioId) return
    
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
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive"
      })
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do salário",
        variant: "destructive"
      })
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto e Informações Principais */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
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
                {funcionarioCompleto?.nome || user.nome || 'Usuário'}
              </h2>
              <p className="text-gray-600 mb-2">
                {funcionarioCompleto?.cargo || user.cargo || 'Sem cargo'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
                <Badge variant="outline">
                  ID: {user.id}
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
                    {funcionarioCompleto?.email || userData.email || user.email || 'Não informado'}
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
                  {funcionarioCompleto?.cargo || user.cargo || 'Não informado'}
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

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Hoje</p>
                <p className="text-lg font-bold text-gray-900">{horasTrabalhadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Ponto</p>
                <p className="text-lg font-bold text-green-600">
                  {pontoHoje?.entrada ? 'Registrado' : 'Pendente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-lg font-bold text-orange-600">{documentosPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Menu de Seções - Mobile First */}
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
        </div>
      </div>

      {/* Conteúdo da Seção Selecionada */}
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
            {activeTab === 'beneficios' && (
            <div className="mt-0">
              {loadingBeneficios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando benefícios...</span>
                </div>
              ) : beneficios.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nenhum benefício encontrado</p>
                </div>
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
            {activeTab === 'certificados' && (
            <div className="mt-0">
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm">
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
                  {certificados.map((certificado) => (
                    <div 
                      key={certificado.id} 
                      className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-3">
                            {certificado.nome}
                          </h4>
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
                  ))}
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
                  {documentosAdmissionais.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-3">
                            {doc.tipo}
                          </h4>
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
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Seção Holerites */}
            {activeTab === 'holerites' && (
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
                        title: "Erro",
                        description: "Arquivo muito grande. Máximo permitido: 10MB",
                        variant: "destructive"
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

