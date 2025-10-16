"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Wrench, 
  BookOpen, 
  Plus, 
  Download, 
  BarChart3,
  AlertCircle,
  Building2,
  MapPin,
  Calendar
} from "lucide-react"
import LivroGruaForm from "@/components/livro-grua-form"
import LivroGruaList from "@/components/livro-grua-list"
import { PageLoader } from "@/components/ui/loader"
import { livroGruaApi, EntradaLivroGruaCompleta } from "@/lib/api-livro-grua"
import { useCurrentUser } from "@/hooks/use-current-user"

interface GruaCompleta {
  id: string
  tipo: string
  modelo: string
  fabricante: string
  obraAtual: {
    id: number
    nome: string
    endereco: string
    cidade: string
    estado: string
    status: string
  }
  relacaoAtual: {
    id: number
    data_inicio_locacao: string
    data_fim_locacao?: string
    status: string
    valor_locacao_mensal?: number
    observacoes?: string
  }
}

export default function LivroGruaRelacaoPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const relacaoId = params.relacaoId as string
  const { user, loading: userLoading } = useCurrentUser()

  // Estados
  const [grua, setGrua] = useState<GruaCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  
  // Estados dos modais
  const [isNovaEntradaOpen, setIsNovaEntradaOpen] = useState(false)
  const [isEditarEntradaOpen, setIsEditarEntradaOpen] = useState(false)
  const [isVisualizarEntradaOpen, setIsVisualizarEntradaOpen] = useState(false)
  const [entradaSelecionada, setEntradaSelecionada] = useState<EntradaLivroGruaCompleta | null>(null)

  // Carregar dados da grua
  const carregarGrua = async () => {
    try {
      setLoading(true)
      setError(null)

      // Aguardar carregamento do usuário
      if (userLoading) {
        return
      }

      if (!user) {
        setError('Usuário não autenticado. Faça login para acessar esta página.')
        return
      }

      // Buscar dados do backend
      const { relacao, grua: gruaData, obra } = await livroGruaApi.buscarGruaPorRelacao(parseInt(relacaoId))
      
      if (gruaData) {
        // Adicionar informações da obra à grua
        const gruaCompleta: GruaCompleta = {
          ...gruaData,
          obraAtual: obra,
          relacaoAtual: relacao
        }
        setGrua(gruaCompleta)
      } else {
        setError('Grua não encontrada ou você não tem acesso a esta grua.')
      }

    } catch (err) {
      console.error('Erro ao carregar grua:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar grua'
      setError(errorMessage)
      
      // Se for erro de autenticação, redirecionar para login
      if (errorMessage.includes('autenticado') || errorMessage.includes('Token')) {
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  // Carregar estatísticas
  const carregarEstatisticas = async () => {
    if (!grua) return

    try {
      const response = await livroGruaApi.obterEstatisticas(grua.id)
      if (response.success) {
        setEstatisticas(response.data)
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    carregarGrua()
  }, [relacaoId, user, userLoading])

  // Carregar estatísticas quando a grua for carregada
  useEffect(() => {
    if (grua) {
      carregarEstatisticas()
    }
  }, [grua])

  // Handlers dos modais
  const handleNovaEntrada = () => {
    setIsNovaEntradaOpen(true)
  }

  const handleEditarEntrada = (entrada: EntradaLivroGruaCompleta) => {
    setEntradaSelecionada(entrada)
    setIsEditarEntradaOpen(true)
  }

  const handleVisualizarEntrada = (entrada: EntradaLivroGruaCompleta) => {
    setEntradaSelecionada(entrada)
    setIsVisualizarEntradaOpen(true)
  }

  const handleFecharModais = () => {
    setIsNovaEntradaOpen(false)
    setIsEditarEntradaOpen(false)
    setIsVisualizarEntradaOpen(false)
    setEntradaSelecionada(null)
  }

  const handleEntradaSalva = () => {
    handleFecharModais()
    carregarEstatisticas()
    toast({
      title: "Sucesso",
      description: "Entrada salva com sucesso!",
      variant: "default"
    })
  }

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando livro da grua..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar grua</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={carregarGrua} variant="outline">
                Tentar novamente
              </Button>
              <Button onClick={() => router.push('/dashboard/livros-gruas')} variant="outline">
                Voltar para Livros
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!grua) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Grua não encontrada</h2>
            <p className="text-gray-600 mb-4">A grua solicitada não foi encontrada.</p>
            <Button onClick={() => router.push('/dashboard/livros-gruas')} variant="outline">
              Voltar para Livros
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/livros-gruas')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600" />
              {grua.id} - {grua.fabricante} {grua.modelo}
            </h1>
            <p className="text-gray-600 mt-2">
              Livro de Ocorrências da Grua
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleNovaEntrada}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Informações da Grua e Obra */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Grua */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Informações da Grua
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium">{grua.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium">{grua.tipo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modelo:</span>
              <span className="font-medium">{grua.modelo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fabricante:</span>
              <span className="font-medium">{grua.fabricante}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={grua.relacaoAtual.status === 'Ativa' ? 'default' : 'secondary'}>
                {grua.relacaoAtual.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Obra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Informações da Obra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Obra:</span>
              <span className="font-medium">{grua.obraAtual.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Endereço:</span>
              <span className="font-medium text-right max-w-[200px] truncate">
                {grua.obraAtual.endereco}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Local:</span>
              <span className="font-medium">
                {grua.obraAtual.cidade}/{grua.obraAtual.estado}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={grua.obraAtual.status === 'Em Andamento' ? 'default' : 'secondary'}>
                {grua.obraAtual.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Período:</span>
              <span className="font-medium text-sm">
                {new Date(grua.relacaoAtual.data_inicio_locacao).toLocaleDateString('pt-BR')}
                {grua.relacaoAtual.data_fim_locacao && 
                  ` - ${new Date(grua.relacaoAtual.data_fim_locacao).toLocaleDateString('pt-BR')}`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalEntradas || 0}
                </div>
                <div className="text-sm text-blue-600">Total de Entradas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {estatisticas.entradasEsteMes || 0}
                </div>
                <div className="text-sm text-green-600">Este Mês</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {estatisticas.manutencoesPendentes || 0}
                </div>
                <div className="text-sm text-orange-600">Manutenções Pendentes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {estatisticas.alertas || 0}
                </div>
                <div className="text-sm text-red-600">Alertas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Entradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Entradas do Livro
          </CardTitle>
          <CardDescription>
            Registro de todas as ocorrências e manutenções da grua
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LivroGruaList
            gruaId={grua.id}
            onEditar={handleEditarEntrada}
            onVisualizar={handleVisualizarEntrada}
          />
        </CardContent>
      </Card>

      {/* Modais */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada no Livro</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={grua.id}
            onSave={handleEntradaSalva}
            onCancel={handleFecharModais}
            funcionarioLogado={user}
          />
          {/* Debug */}
          {console.log('LivroGruaPage - user sendo passado:', user)}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditarEntradaOpen} onOpenChange={setIsEditarEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrada</DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <LivroGruaForm
              gruaId={grua.id}
              entrada={entradaSelecionada}
              onSave={handleEntradaSalva}
              onCancel={handleFecharModais}
              modoEdicao={true}
              funcionarioLogado={user}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Entrada</DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-4">
              {/* Conteúdo da visualização */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Data</label>
                  <p className="text-lg">{new Date(entradaSelecionada.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <p className="text-lg">{entradaSelecionada.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Responsável</label>
                  <p className="text-lg">{entradaSelecionada.responsavel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-lg">{entradaSelecionada.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Descrição</label>
                <p className="text-lg">{entradaSelecionada.descricao}</p>
              </div>
              {entradaSelecionada.observacoes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <p className="text-lg">{entradaSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
