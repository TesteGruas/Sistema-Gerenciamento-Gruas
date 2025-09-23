"use client"

import { useState, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import LivroGruaForm from "@/components/livro-grua-form"
import LivroGruaList from "@/components/livro-grua-list"
import { livroGruaApi, EntradaLivroGruaCompleta } from "@/lib/api-livro-grua"
import { mockGruas } from "@/lib/mock-data"

export default function LivroGruaPage() {
  const params = useParams()
  const router = useRouter()
  const gruaId = params.id as string

  // Estados
  const [grua, setGrua] = useState<any>(null)
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

      // Verificar se há token de autenticação
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Usuário não autenticado. Faça login para acessar esta página.')
      }

      // Buscar grua pela relação grua_obra
      const { relacao, grua, obra } = await livroGruaApi.buscarGruaPorRelacao(parseInt(gruaId))
      
      if (grua) {
        // Adicionar informações da obra à grua
        const gruaCompleta = {
          ...grua,
          obraAtual: obra,
          relacaoAtual: relacao
        }
        setGrua(gruaCompleta)
      } else {
        throw new Error('Grua não encontrada')
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
    try {
      // Usar o grua_id da relação em vez do ID da relação
      if (grua?.id) {
        const response = await livroGruaApi.obterEstatisticas(grua.id)
        setEstatisticas(response.data.estatisticas)
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    carregarGrua()
  }, [gruaId])

  // Carregar estatísticas quando a grua for carregada
  useEffect(() => {
    if (grua?.id) {
      carregarEstatisticas()
    }
  }, [grua])

  // Handlers
  const handleNovaEntrada = () => {
    setEntradaSelecionada(null)
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

  const handleExcluirEntrada = async (entrada: EntradaLivroGruaCompleta) => {
    if (!entrada.id) return

    if (confirm(`Tem certeza que deseja excluir esta entrada?`)) {
      try {
        await livroGruaApi.excluirEntrada(entrada.id)
        // Recarregar lista
        window.location.reload()
      } catch (err) {
        console.error('Erro ao excluir entrada:', err)
        alert('Erro ao excluir entrada')
      }
    }
  }

  const handleSucessoEntrada = () => {
    setIsNovaEntradaOpen(false)
    setIsEditarEntradaOpen(false)
    // Recarregar estatísticas
    carregarEstatisticas()
  }

  const handleExportar = async () => {
    try {
      if (grua?.id) {
        await livroGruaApi.baixarCSV(grua.id)
      }
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao exportar dados')
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Carregando livro da grua...</span>
          </div>
        </div>
      </div>
    )
  }

  // Erro
  if (error || !grua) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar grua</h2>
            <p className="text-red-600 mb-4">{error || 'Grua não encontrada'}</p>
            <Button onClick={() => router.back()} variant="outline">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Livro da Grua
          </h1>
          <p className="text-gray-600">
            {grua.name} - {grua.model} ({grua.capacity})
          </p>
        </div>
      </div>

      {/* Informações da Grua */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Informações da Grua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Modelo</p>
              <p className="font-medium">{grua.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fabricante</p>
              <p className="font-medium">{grua.manufacturer || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacidade</p>
              <p className="font-medium">{grua.capacity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={
                grua.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                grua.status === 'em_obra' ? 'bg-blue-100 text-blue-800' :
                grua.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }>
                {grua.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="font-medium">{grua.type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Criada em</p>
              <p className="font-medium">{new Date(grua.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Estatísticas do Livro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{estatisticas.total_entradas}</p>
                <p className="text-sm text-gray-600">Total de Entradas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{estatisticas.entradas_ultimos_30_dias}</p>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {estatisticas.por_status?.falha || 0}
                </p>
                <p className="text-sm text-gray-600">Falhas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {estatisticas.por_tipo?.checklist || 0}
                </p>
                <p className="text-sm text-gray-600">Checklists</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Entradas */}
        <LivroGruaList
          gruaId={grua?.id || gruaId}
          onNovaEntrada={handleNovaEntrada}
          onEditarEntrada={handleEditarEntrada}
          onVisualizarEntrada={handleVisualizarEntrada}
          onExcluirEntrada={handleExcluirEntrada}
        />

      {/* Modal Nova Entrada */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada no Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={grua?.id || gruaId}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsNovaEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Entrada */}
      <Dialog open={isEditarEntradaOpen} onOpenChange={setIsEditarEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrada do Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={grua?.id || gruaId}
            modoEdicao={true}
            entrada={entradaSelecionada}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsEditarEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Entrada */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrada</DialogTitle>
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
                      <p className="text-sm font-medium text-gray-600">Data e Hora</p>
                      <p className="text-sm">
                        {livroGruaApi.formatarDataHora(entradaSelecionada.data_entrada, entradaSelecionada.hora_entrada)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Grua</p>
                      <p className="text-sm font-medium">
                        {entradaSelecionada.grua_modelo || entradaSelecionada.grua_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Funcionário</p>
                      <p className="text-sm">{entradaSelecionada.funcionario_nome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tipo</p>
                      <Badge className={livroGruaApi.obterCorTipo(entradaSelecionada.tipo_entrada)}>
                        {entradaSelecionada.tipo_entrada_display || entradaSelecionada.tipo_entrada}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge className={livroGruaApi.obterCorStatus(entradaSelecionada.status_entrada)}>
                        {entradaSelecionada.status_entrada}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavel_resolucao && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Responsável pela Resolução</p>
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
                    setIsVisualizarEntradaOpen(false)
                    handleEditarEntrada(entradaSelecionada)
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}