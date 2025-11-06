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
  CheckCircle2
} from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { LivroGruaChecklistDiario } from "@/components/livro-grua-checklist-diario"
import { LivroGruaManutencao } from "@/components/livro-grua-manutencao"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LivroGruaPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const gruaId = params.id as string

  // Estados
  const [grua, setGrua] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  
  // Estados dos modais
  const [isNovoChecklistOpen, setIsNovoChecklistOpen] = useState(false)
  const [isEditarChecklistOpen, setIsEditarChecklistOpen] = useState(false)
  const [isVisualizarChecklistOpen, setIsVisualizarChecklistOpen] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<any>(null)
  
  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState(false)
  const [isEditarManutencaoOpen, setIsEditarManutencaoOpen] = useState(false)
  const [isVisualizarManutencaoOpen, setIsVisualizarManutencaoOpen] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<any>(null)

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

      // Buscar grua diretamente pelo ID (gruaId é o ID da grua, ex: "G0062")
      const gruaData = await livroGruaApi.buscarGruaPorId(gruaId)
      
      if (gruaData) {
        setGrua(gruaData)
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

  // Handlers Checklist
  const handleNovoChecklist = () => {
    setChecklistSelecionado(null)
    setIsNovoChecklistOpen(true)
  }

  const handleEditarChecklist = (checklist: any) => {
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
    carregarEstatisticas()
  }

  // Handlers Manutenção
  const handleNovaManutencao = () => {
    setManutencaoSelecionada(null)
    setIsNovaManutencaoOpen(true)
  }

  const handleEditarManutencao = (manutencao: any) => {
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
    carregarEstatisticas()
  }

  const handleExportar = async () => {
    try {
      if (grua?.id) {
        await livroGruaApi.baixarCSV(grua.id)
      }
    } catch (err) {
      console.error('Erro ao exportar:', err)
      toast({
        title: "Informação",
        description: "Erro ao exportar dados",
        variant: "default"
      })
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando livro da grua..." />
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
            {grua.name || grua.id} - {grua.model || grua.modelo} ({grua.capacity || grua.capacidade})
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
              <p className="font-medium">{grua.model || grua.modelo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fabricante</p>
              <p className="font-medium">{grua.fabricante || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacidade</p>
              <p className="font-medium">{grua.capacity || grua.capacidade || 'N/A'}</p>
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
              <p className="font-medium">{grua.tipo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Criada em</p>
              <p className="font-medium">
                {grua.createdAt || grua.created_at ? new Date(grua.createdAt || grua.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
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

      {/* Abas: Checklist e Manutenções */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checklist">Checklists Diários</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
        </TabsList>

        {/* Aba: Checklists Diários */}
        <TabsContent value="checklist" className="space-y-4">
          <LivroGruaChecklistList
            gruaId={grua?.id || gruaId}
            onNovoChecklist={handleNovoChecklist}
            onEditarChecklist={handleEditarChecklist}
            onVisualizarChecklist={handleVisualizarChecklist}
            onExcluirChecklist={handleExcluirChecklist}
          />
        </TabsContent>

        {/* Aba: Manutenções */}
        <TabsContent value="manutencoes" className="space-y-4">
          <LivroGruaManutencaoList
            gruaId={grua?.id || gruaId}
            onNovaManutencao={handleNovaManutencao}
            onEditarManutencao={handleEditarManutencao}
            onVisualizarManutencao={handleVisualizarManutencao}
            onExcluirManutencao={handleExcluirManutencao}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Novo Checklist */}
      <Dialog open={isNovoChecklistOpen} onOpenChange={setIsNovoChecklistOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist Diário</DialogTitle>
          </DialogHeader>
          <LivroGruaChecklistDiario
            gruaId={grua?.id || gruaId}
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
            gruaId={grua?.id || gruaId}
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
                    handleEditarChecklist(checklistSelecionado)
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
            gruaId={grua?.id || gruaId}
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
            gruaId={grua?.id || gruaId}
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
                    handleEditarManutencao(manutencaoSelecionada)
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