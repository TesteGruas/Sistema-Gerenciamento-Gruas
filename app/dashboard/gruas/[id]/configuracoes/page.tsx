"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Eye,
  Settings,
  ArrowLeft,
  RefreshCw,
  Calculator,
  Package,
  Ruler
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiConfiguracoes, ConfiguracaoGrua } from "@/lib/api-configuracoes"
import { gruasApi } from "@/lib/api-gruas"

export default function ConfiguracoesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [gruaId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar informações da grua
      const gruaResponse = await gruasApi.obterGrua(gruaId)
      setGruaInfo(gruaResponse.data)
      
      // Carregar configurações da grua
      const configuracoesResponse = await apiConfiguracoes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 100
      })
      setConfiguracoes(configuracoesResponse.data)
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar configurações da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar configurações
  const filteredConfiguracoes = configuracoes.filter(config => 
    config.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (config.descricao && config.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handlers - Removidos pois a página é somente leitura

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando especificações técnicas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Especificações Técnicas
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Visualização somente leitura das especificações técnicas da grua
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou descrição das especificações técnicas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={carregarDados}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConfiguracoes.map((config) => (
          <Card key={config.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{config.nome}</CardTitle>
                  <CardDescription>{config.descricao}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingConfig(config)
                      setIsViewDialogOpen(true)
                    }}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Altura:</span>
                    <span>{config.altura_maxima || 0}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Capacidade:</span>
                    <span>{config.capacidade_maxima || 0}t</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Valor:</span>
                  <span className="font-bold text-lg">R$ {config.valor_configuracao.toLocaleString('pt-BR')}</span>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Componentes:</h4>
                  <div className="space-y-1">
                    {config.componentes?.map((comp, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600">
                        <span>{comp.componente.nome}</span>
                        <span>{comp.quantidade_necessaria} {comp.componente.unidade_medida || 'un'}</span>
                      </div>
                    )) || <span className="text-xs text-gray-500">Nenhum componente</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConfiguracoes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma especificação técnica encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Visualização de Especificações Técnicas */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Especificações Técnicas</DialogTitle>
            <DialogDescription>
              Informações completas das especificações técnicas: {editingConfig?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div><strong>Nome:</strong> {editingConfig.nome}</div>
                    <div><strong>Descrição:</strong> {editingConfig.descricao || 'Não informado'}</div>
                    <div><strong>Status:</strong> <Badge variant="outline">{editingConfig.status}</Badge></div>
                    <div><strong>Altura Máxima:</strong> {editingConfig.altura_maxima || 0}m</div>
                    <div><strong>Capacidade Máxima:</strong> {editingConfig.capacidade_maxima || 0}t</div>
                    <div><strong>Valor:</strong> R$ {editingConfig.valor_configuracao.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Técnicas</h3>
                  <div className="space-y-2">
                    {editingConfig.alcance_maximo && <div><strong>Alcance Máximo:</strong> {editingConfig.alcance_maximo}m</div>}
                    {editingConfig.capacidade_ponta && <div><strong>Capacidade na Ponta:</strong> {editingConfig.capacidade_ponta}t</div>}
                    {editingConfig.velocidade_operacao && <div><strong>Velocidade de Operação:</strong> {editingConfig.velocidade_operacao}m/min</div>}
                    {editingConfig.velocidade_rotacao && <div><strong>Velocidade de Rotação:</strong> {editingConfig.velocidade_rotacao}rpm</div>}
                    {editingConfig.potencia_motor && <div><strong>Potência do Motor:</strong> {editingConfig.potencia_motor}kW</div>}
                    {editingConfig.peso_total && <div><strong>Peso Total:</strong> {editingConfig.peso_total}t</div>}
                  </div>
                </div>
              </div>

              {/* Componentes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Componentes das Especificações Técnicas</h3>
                {editingConfig.componentes && editingConfig.componentes.length > 0 ? (
                  <div className="space-y-2">
                    {editingConfig.componentes.map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{comp.componente.nome}</div>
                          <div className="text-sm text-gray-500">
                            {comp.componente.tipo} • {comp.componente.modelo || 'Sem modelo'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{comp.quantidade_necessaria} {comp.componente.unidade_medida || 'un'}</div>
                          <div className="text-sm text-gray-500">
                            R$ {(comp.componente.valor_unitario * comp.quantidade_necessaria).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum componente associado a estas especificações técnicas
                  </div>
                )}
              </div>

              {/* Informações do Sistema */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Criado em:</strong> {new Date(editingConfig.created_at).toLocaleString('pt-BR')}</div>
                  <div><strong>Atualizado em:</strong> {new Date(editingConfig.updated_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
