"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Wrench, 
  BookOpen, 
  Plus, 
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Users,
  MapPin
} from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { fetchWithAuth } from "@/lib/api"
import { LivroGruaChecklistDiario } from "@/components/livro-grua-checklist-diario"
import { LivroGruaManutencao } from "@/components/livro-grua-manutencao"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { LivroGruaFuncionariosList } from "@/components/livro-grua-funcionarios-list"

export default function PWAGruaDetalhesPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const gruaId = params.id as string

  // Estados
  const [grua, setGrua] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [obraCoordenadas, setObraCoordenadas] = useState<{lat: number, lng: number} | null>(null)
  const [obraEndereco, setObraEndereco] = useState<string | null>(null)
  const [isCarregandoCoordenadas, setIsCarregandoCoordenadas] = useState(false)
  
  // Estados dos modais
  const [isNovoChecklistOpen, setIsNovoChecklistOpen] = useState(false)
  const [isEditarChecklistOpen, setIsEditarChecklistOpen] = useState(false)
  const [isVisualizarChecklistOpen, setIsVisualizarChecklistOpen] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<any>(null)
  
  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState(false)
  const [isEditarManutencaoOpen, setIsEditarManutencaoOpen] = useState(false)
  const [isVisualizarManutencaoOpen, setIsVisualizarManutencaoOpen] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<any>(null)

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar dados da grua
  const carregarGrua = async () => {
    try {
      setLoading(true)
      setError(null)

      // Se offline, tentar carregar do cache
      if (!isOnline) {
        const cachedGrua = localStorage.getItem(`cached_grua_${gruaId}`)
        if (cachedGrua) {
          setGrua(JSON.parse(cachedGrua))
          setLoading(false)
          toast({
            title: "Modo Offline",
            description: "Exibindo dados em cache. Conecte-se para atualizar.",
            variant: "default"
          })
          return
        }
      }

      // Verificar se há token de autenticação
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Usuário não autenticado. Faça login para acessar esta página.')
      }

      // Buscar grua diretamente pelo ID
      const gruaData = await livroGruaApi.buscarGruaPorId(gruaId)
      
      if (gruaData) {
        setGrua(gruaData)
        // Salvar no cache
        localStorage.setItem(`cached_grua_${gruaId}`, JSON.stringify(gruaData))
      } else {
        throw new Error('Grua não encontrada')
      }

    } catch (err) {
      console.error('Erro ao carregar grua:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar grua'
      setError(errorMessage)
      
      // Tentar carregar do cache em caso de erro
      const cachedGrua = localStorage.getItem(`cached_grua_${gruaId}`)
      if (cachedGrua) {
        setGrua(JSON.parse(cachedGrua))
        toast({
          title: "Aviso",
          description: "Exibindo dados em cache. Verifique sua conexão.",
          variant: "default"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Carregar coordenadas da obra ou localização da grua
  useEffect(() => {
    const carregarCoordenadas = async () => {
      console.log('[Grua] useEffect carregarCoordenadas - grua:', grua)
      if (!grua) {
        setObraCoordenadas(null)
        setObraEndereco(null)
        return
      }

      // Prioridade 1: Se tem obra ativa com coordenadas
      if (grua.obra_ativa) {
        const obra = grua.obra_ativa
        
        // Se a obra já tem coordenadas, usar diretamente
        if (obra.latitude && obra.longitude) {
          setObraCoordenadas({
            lat: parseFloat(obra.latitude),
            lng: parseFloat(obra.longitude)
          })
          setObraEndereco(obra.endereco || obra.nome || null)
          return
        }

        // Se não tem coordenadas mas tem endereço, fazer geocodificação
        if (obra.endereco) {
          setIsCarregandoCoordenadas(true)
          try {
            const enderecoCompleto = `${obra.endereco}, ${obra.cidade || ''}, ${obra.estado || ''}, Brasil`
            
            const response = await fetchWithAuth(
              `http://localhost:3001/api/geocoding/endereco?q=${encodeURIComponent(enderecoCompleto)}`
            )
            
            if (response.ok) {
              const data = await response.json()
              // A API retorna { success: true, data: { coordenadas: { lat, lng } } }
              const coordenadas = data.data?.coordenadas || (data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null)
              
              if (coordenadas && coordenadas.lat && coordenadas.lng) {
                setObraCoordenadas({
                  lat: parseFloat(coordenadas.lat),
                  lng: parseFloat(coordenadas.lng)
                })
                setObraEndereco(enderecoCompleto)
              }
            }
          } catch (error) {
            console.error('Erro ao obter coordenadas da obra:', error)
          } finally {
            setIsCarregandoCoordenadas(false)
          }
          return
        }
      }

      // Prioridade 2: Se não tem obra ativa, usar o campo localizacao da grua
      if (grua.localizacao) {
        console.log('[Grua] Tentando geocodificar localização:', grua.localizacao)
        setIsCarregandoCoordenadas(true)
        try {
          // Tentar geocodificar a localização da grua
          const localizacaoCompleta = `${grua.localizacao}, Brasil`
          console.log('[Grua] Endereço completo:', localizacaoCompleta)
          
          const response = await fetchWithAuth(
            `http://localhost:3001/api/geocoding/endereco?q=${encodeURIComponent(localizacaoCompleta)}`
          )
          
          console.log('[Grua] Resposta status:', response.status, response.ok)
          
          if (response.ok) {
            const data = await response.json()
            console.log('[Grua] Dados da API:', data)
            
            // A API retorna { success: true, data: { coordenadas: { lat, lng } } }
            const coordenadas = data.data?.coordenadas || (data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null)
            console.log('[Grua] Coordenadas extraídas:', coordenadas)
            
            if (coordenadas && coordenadas.lat && coordenadas.lng) {
              const coords = {
                lat: parseFloat(coordenadas.lat),
                lng: parseFloat(coordenadas.lng)
              }
              console.log('[Grua] Definindo coordenadas:', coords)
              setObraCoordenadas(coords)
              setObraEndereco(grua.localizacao)
            } else {
              console.warn('[Grua] Coordenadas não encontradas na resposta')
            }
          } else {
            const errorText = await response.text()
            console.error('[Grua] Erro na resposta:', response.status, errorText)
          }
        } catch (error) {
          console.error('Erro ao obter coordenadas da localização:', error)
        } finally {
          setIsCarregandoCoordenadas(false)
        }
        return
      }
      
      console.log('[Grua] Nenhuma localização disponível')

      // Se não tem nenhuma localização disponível
      setObraCoordenadas(null)
      setObraEndereco(null)
    }

    carregarCoordenadas()
  }, [grua])

  // Carregar dados na inicialização
  useEffect(() => {
    carregarGrua()
  }, [gruaId, isOnline])

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
        // Recarregar dados
        carregarGrua()
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
    carregarGrua()
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
        // Recarregar dados
        carregarGrua()
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
    carregarGrua()
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando grua..." />
      </div>
    )
  }

  // Erro
  if (error && !grua) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar grua</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/pwa/gruas')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Gruas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/pwa/gruas')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Livro da Grua
            </h1>
            {grua && (
              <p className="text-sm text-gray-600">
                {grua.name || grua.id} - {grua.model || grua.modelo} ({grua.capacity || grua.capacidade})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Informações da Grua */}
        {grua && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Informações da Grua
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Modelo</p>
                  <p className="font-medium">{grua.model || grua.modelo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Fabricante</p>
                  <p className="font-medium">{grua.fabricante || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacidade</p>
                  <p className="font-medium">{grua.capacity || grua.capacidade || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <Badge className={
                    grua.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                    grua.status === 'em_obra' ? 'bg-blue-100 text-blue-800' :
                    grua.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {grua.status}
                  </Badge>
                </div>
                {grua.obra_ativa && (
                  <>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Obra Atual</p>
                      <p className="font-medium">{grua.obra_ativa.nome || 'N/A'}</p>
                    </div>
                    {grua.obra_ativa.endereco && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Endereço da Obra</p>
                        <p className="font-medium text-xs">
                          {grua.obra_ativa.endereco}
                          {grua.obra_ativa.cidade && `, ${grua.obra_ativa.cidade}`}
                          {grua.obra_ativa.estado && ` - ${grua.obra_ativa.estado}`}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {!grua.obra_ativa && grua.localizacao && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Localização</p>
                    <p className="font-medium">{grua.localizacao}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status de conexão */}
        {!isOnline && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs para Checklist, Manutenções e Funcionários */}
        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="manutencoes" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Manutenções
            </TabsTrigger>
            <TabsTrigger value="funcionarios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Funcionários
            </TabsTrigger>
          </TabsList>

          {/* Aba: Checklist Diários */}
          <TabsContent value="checklist" className="space-y-4">
            {grua && (
              <LivroGruaChecklistList
                gruaId={grua.id || gruaId}
                onNovoChecklist={handleNovoChecklist}
                onEditarChecklist={handleEditarChecklist}
                onVisualizarChecklist={handleVisualizarChecklist}
                onExcluirChecklist={handleExcluirChecklist}
              />
            )}
          </TabsContent>

          {/* Aba: Manutenções */}
          <TabsContent value="manutencoes" className="space-y-4">
            {grua && (
              <LivroGruaManutencaoList
                gruaId={grua.id || gruaId}
                onNovaManutencao={handleNovaManutencao}
                onEditarManutencao={handleEditarManutencao}
                onVisualizarManutencao={handleVisualizarManutencao}
                onExcluirManutencao={handleExcluirManutencao}
              />
            )}
          </TabsContent>

          {/* Aba: Funcionários */}
          <TabsContent value="funcionarios" className="space-y-4">
            {grua && (
              <LivroGruaFuncionariosList
                gruaId={grua.id || gruaId}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Mapa com Localização da Grua/Obra - No final da página */}
        {grua && obraCoordenadas && (
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="relative w-full h-64 md:h-80">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${obraCoordenadas.lat},${obraCoordenadas.lng}&z=15&output=embed`}
                  className="w-full h-full"
                  title="Mapa da localização da grua"
                />
                {/* Overlay com informações */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 mb-1">
                        {grua.obra_ativa?.nome || 'Localização da Grua'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {obraEndereco || grua.obra_ativa?.endereco || grua.localizacao || `${obraCoordenadas.lat}, ${obraCoordenadas.lng}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem se estiver carregando coordenadas */}
        {grua && (grua.obra_ativa || grua.localizacao) && isCarregandoCoordenadas && !obraCoordenadas && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Carregando localização...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal: Novo Checklist */}
        <Dialog open={isNovoChecklistOpen} onOpenChange={setIsNovoChecklistOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Checklist Diário</DialogTitle>
            </DialogHeader>
            {grua && (
              <LivroGruaChecklistDiario
                gruaId={grua.id || gruaId}
                onSave={handleSucessoChecklist}
                onCancel={() => setIsNovoChecklistOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Editar Checklist */}
        <Dialog open={isEditarChecklistOpen} onOpenChange={setIsEditarChecklistOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Checklist Diário</DialogTitle>
            </DialogHeader>
            {grua && checklistSelecionado && (
              <LivroGruaChecklistDiario
                gruaId={grua.id || gruaId}
                checklist={checklistSelecionado}
                onSave={handleSucessoChecklist}
                onCancel={() => setIsEditarChecklistOpen(false)}
                modoEdicao={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Visualizar Checklist */}
        <Dialog open={isVisualizarChecklistOpen} onOpenChange={setIsVisualizarChecklistOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Checklist Diário</DialogTitle>
            </DialogHeader>
            {grua && checklistSelecionado && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{new Date(checklistSelecionado.data).toLocaleDateString('pt-BR')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Itens Verificados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
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
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {checklistSelecionado.observacoes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{checklistSelecionado.observacoes}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setIsVisualizarChecklistOpen(false)} variant="outline">
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Nova Manutenção */}
        <Dialog open={isNovaManutencaoOpen} onOpenChange={setIsNovaManutencaoOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Manutenção</DialogTitle>
            </DialogHeader>
            {grua && (
              <LivroGruaManutencao
                gruaId={grua.id || gruaId}
                onSave={handleSucessoManutencao}
                onCancel={() => setIsNovaManutencaoOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Editar Manutenção */}
        <Dialog open={isEditarManutencaoOpen} onOpenChange={setIsEditarManutencaoOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Manutenção</DialogTitle>
            </DialogHeader>
            {grua && manutencaoSelecionada && (
              <LivroGruaManutencao
                gruaId={grua.id || gruaId}
                manutencao={manutencaoSelecionada}
                onSave={handleSucessoManutencao}
                onCancel={() => setIsEditarManutencaoOpen(false)}
                modoEdicao={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Visualizar Manutenção */}
        <Dialog open={isVisualizarManutencaoOpen} onOpenChange={setIsVisualizarManutencaoOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Manutenção</DialogTitle>
            </DialogHeader>
            {grua && manutencaoSelecionada && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{new Date(manutencaoSelecionada.data).toLocaleDateString('pt-BR')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Realizado Por</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{manutencaoSelecionada.realizado_por_nome || 'N/A'}</p>
                    {manutencaoSelecionada.cargo && (
                      <p className="text-xs text-gray-500 mt-1">{manutencaoSelecionada.cargo}</p>
                    )}
                  </CardContent>
                </Card>
                {manutencaoSelecionada.descricao && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{manutencaoSelecionada.descricao}</p>
                    </CardContent>
                  </Card>
                )}
                {manutencaoSelecionada.observacoes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{manutencaoSelecionada.observacoes}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setIsVisualizarManutencaoOpen(false)} variant="outline">
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}

