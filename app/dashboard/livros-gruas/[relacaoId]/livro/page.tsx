"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Wrench, 
  BookOpen, 
  AlertCircle,
  Building2,
  MapPin,
  Calendar
} from "lucide-react"
import { LivroGruaObra } from "@/components/livro-grua-obra"
import { PageLoader } from "@/components/ui/loader"
import { livroGruaApi } from "@/lib/api-livro-grua"
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
  const [obra, setObra] = useState<any>(null)
  const [relacao, setRelacao] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  

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
      const { relacao: relacaoData, grua: gruaData, obra: obraData } = await livroGruaApi.buscarGruaPorRelacao(parseInt(relacaoId))
      
      if (gruaData) {
        // Adicionar informações da obra à grua
        const gruaCompleta: GruaCompleta = {
          ...gruaData,
          obraAtual: obraData,
          relacaoAtual: relacaoData
        }
        setGrua(gruaCompleta)
        setObra(obraData)
        setRelacao(relacaoData)
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


  // Carregar dados na inicialização
  useEffect(() => {
    carregarGrua()
  }, [relacaoId, user, userLoading])



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

      {/* Livro da Grua */}
      {(() => {
        // Tentar obter o ID da obra de diferentes formas
        const obraId = obra?.id || obra?.obra_id || grua?.obraAtual?.id || relacao?.obra_id
        return obraId ? (
          <LivroGruaObra obraId={obraId.toString()} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Obra não encontrada para exibir o Livro da Grua</p>
                <p className="text-xs mt-2 text-gray-400">Relacao ID: {relacaoId}</p>
              </div>
            </CardContent>
          </Card>
        )
      })()}

    </div>
  )
}
