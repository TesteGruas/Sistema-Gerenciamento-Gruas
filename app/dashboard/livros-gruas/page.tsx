"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Search, 
  Wrench, 
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { mockRelacoesGruaObra, GruaObraRelacao } from "@/lib/mock-data"

interface GruaObraRelacao {
  id: number
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  status: string
  valor_locacao_mensal?: number
  observacoes?: string
  grua: {
    id: string
    tipo: string
    modelo: string
    fabricante: string
  }
  obra: {
    id: number
    nome: string
    endereco: string
    cidade: string
    estado: string
    status: string
  }
}

export default function LivrosGruasPage() {
  const { toast } = useToast()
  
  // Estados
  const [relacoes, setRelacoes] = useState<GruaObraRelacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterObra, setFilterObra] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Carregar relações grua-obra
  const carregarRelacoes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Tentar buscar do backend primeiro
      try {
        const response = await livroGruaApi.listarRelacoesGruaObra()
        
        if (response.success && response.data) {
          setRelacoes(response.data)
          return
        }
      } catch (apiError) {
        console.warn('API não disponível, usando dados mock:', apiError)
      }

      // Fallback para dados mock
      console.log('Usando dados mock para relações grua-obra')
      setRelacoes(mockRelacoesGruaObra)

    } catch (err) {
      console.error('Erro ao carregar relações:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar relações
  const relacoesFiltradas = relacoes.filter(relacao => {
    const matchSearch = 
      relacao.grua.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relacao.grua.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relacao.obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relacao.obra.endereco.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchObra = filterObra === "all" || filterObra === "" || relacao.obra.id.toString() === filterObra
    const matchStatus = filterStatus === "all" || filterStatus === "" || relacao.status === filterStatus
    
    return matchSearch && matchObra && matchStatus
  })

  // Obter obras únicas para filtro
  const obrasUnicas = [...new Set(relacoes.map(r => r.obra.id))].map(id => 
    relacoes.find(r => r.obra.id === id)?.obra
  ).filter(Boolean)

  // Obter status únicos para filtro
  const statusUnicos = [...new Set(relacoes.map(r => r.status))]

  // Carregar dados na inicialização
  useEffect(() => {
    carregarRelacoes()
  }, [])

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando livros de gruas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar dados</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={carregarRelacoes} variant="outline">
              Tentar novamente
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Livros de Gruas
          </h1>
          <p className="text-gray-600 mt-2">
            Acesse os livros de gruas por obra para funcionários
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Grua, modelo, obra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obrasUnicas.map((obra) => (
                    <SelectItem key={obra?.id} value={obra?.id.toString()}>
                      {obra?.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusUnicos.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setFilterObra("all")
                  setFilterStatus("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relacoesFiltradas.map((relacao) => (
          <Card key={relacao.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-lg">{relacao.grua.id}</span>
                </div>
                <Badge 
                  variant={relacao.status === 'Ativa' ? 'default' : 'secondary'}
                >
                  {relacao.status}
                </Badge>
              </div>
              <CardDescription>
                {relacao.grua.fabricante} {relacao.grua.modelo}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informações da Obra */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{relacao.obra.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {relacao.obra.endereco}, {relacao.obra.cidade}/{relacao.obra.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Início: {new Date(relacao.data_inicio_locacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {relacao.data_fim_locacao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Fim: {new Date(relacao.data_fim_locacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de Acesso */}
              <Button 
                className="w-full"
                onClick={() => {
                  window.location.href = `/dashboard/livros-gruas/${relacao.id}/livro`
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Acessar Livro
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {relacoesFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Nenhuma relação encontrada
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterObra || filterStatus 
                ? "Tente ajustar os filtros para encontrar o que procura."
                : "Não há relações grua-obra cadastradas no momento."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
