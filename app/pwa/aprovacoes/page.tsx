"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "@/components/signature-pad"
import { useToast } from "@/hooks/use-toast"
import { 
  Clock, 
  User, 
  Building2, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  AlertCircle
} from "lucide-react"
import { PwaAuthGuard } from "@/components/pwa-auth-guard"

interface RegistroPendente {
  id: string
  funcionario_id: number
  data: string
  entrada: string
  saida: string
  horas_trabalhadas: number
  horas_extras: number
  observacoes?: string
  funcionario: {
    nome: string
    cargo: string
    turno: string
  }
}

interface Gestor {
  id: number
  nome: string
  cargo: string
}

export default function AprovacoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [registro, setRegistro] = useState<RegistroPendente | null>(null)
  const [gestor, setGestor] = useState<Gestor | null>(null)
  const [loading, setLoading] = useState(true)
  const [aprovando, setAprovando] = useState(false)
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false)
  const [observacoesAprovacao, setObservacoesAprovacao] = useState("")
  const [assinatura, setAssinatura] = useState<string | null>(null)

  const registroId = searchParams.get('id')

  useEffect(() => {
    if (registroId) {
      carregarRegistro(registroId)
    } else {
      carregarRegistrosPendentes()
    }
  }, [registroId])

  const carregarRegistro = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ponto-eletronico/registros/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar registro')
      }

      const result = await response.json()
      
      if (result.success) {
        setRegistro(result.data)
        carregarDadosGestor()
      } else {
        throw new Error(result.message || 'Erro ao carregar registro')
      }
    } catch (error) {
      console.error("Erro ao carregar registro:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do registro",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarRegistrosPendentes = async () => {
    try {
      setLoading(true)
      // Buscar o ID do gestor logado
      const gestorId = localStorage.getItem('gestor_id') || '1' // Fallback para teste
      
      const response = await fetch(`/api/ponto-eletronico/registros/pendentes-aprovacao?gestor_id=${gestorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar registros pendentes')
      }

      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        // Se há registros pendentes, mostrar o primeiro
        setRegistro(result.data[0])
        carregarDadosGestor()
      } else {
        // Nenhum registro pendente
        setRegistro(null)
      }
    } catch (error) {
      console.error("Erro ao carregar registros pendentes:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar registros pendentes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarDadosGestor = async () => {
    try {
      // Buscar dados do gestor logado
      const gestorId = localStorage.getItem('gestor_id') || '1'
      const response = await fetch(`/api/funcionarios/${gestorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGestor(result.data)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do gestor:", error)
    }
  }

  const handleAprovar = () => {
    if (!registro || !gestor) return
    
    setMostrarAssinatura(true)
  }

  const handleRejeitar = async () => {
    if (!registro || !gestor) return

    const motivo = prompt("Digite o motivo da rejeição:")
    if (!motivo) return

    setAprovando(true)
    try {
      const response = await fetch(`/api/ponto-eletronico/registros/${registro.id}/rejeitar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motivo_rejeicao: motivo
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao rejeitar')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Horas extras rejeitadas com sucesso",
          variant: "default"
        })
        router.push('/pwa/notificacoes')
      } else {
        throw new Error(result.message || 'Erro ao rejeitar')
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar horas extras",
        variant: "destructive"
      })
    } finally {
      setAprovando(false)
    }
  }

  const handleAssinaturaSalva = async (assinaturaDataUrl: string) => {
    if (!registro || !gestor) return

    setAssinatura(assinaturaDataUrl)
    setAprovando(true)

    try {
      const response = await fetch(`/api/ponto-eletronico/registros/${registro.id}/aprovar-assinatura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gestor_id: gestor.id,
          assinatura_digital: assinaturaDataUrl,
          observacoes_aprovacao: observacoesAprovacao
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao aprovar')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Horas extras aprovadas com sucesso",
          variant: "default"
        })
        router.push('/pwa/notificacoes')
      } else {
        throw new Error(result.message || 'Erro ao aprovar')
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar horas extras",
        variant: "destructive"
      })
    } finally {
      setAprovando(false)
      setMostrarAssinatura(false)
    }
  }

  const handleCancelarAssinatura = () => {
    setMostrarAssinatura(false)
    setAssinatura(null)
  }

  if (loading) {
    return (
      <PwaAuthGuard>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      </PwaAuthGuard>
    )
  }

  if (!registro) {
    return (
      <PwaAuthGuard>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/pwa/notificacoes')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold">Aprovações</h1>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Nenhuma aprovação pendente</h2>
                <p className="text-gray-600 mb-4">
                  Não há registros de horas extras aguardando sua aprovação no momento.
                </p>
                <Button onClick={() => router.push('/pwa/notificacoes')}>
                  Voltar às Notificações
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PwaAuthGuard>
    )
  }

  if (mostrarAssinatura) {
    return (
      <PwaAuthGuard>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelarAssinatura}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold">Assinatura Digital</h1>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Confirmar Aprovação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Aprovação de Horas Extras</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Você está aprovando {registro.horas_extras}h extras de {registro.funcionario.nome} 
                      do dia {new Date(registro.data).toLocaleDateString('pt-BR')}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações da Aprovação (Opcional)</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoesAprovacao}
                      onChange={(e) => setObservacoesAprovacao(e.target.value)}
                      placeholder="Adicione observações sobre a aprovação..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <SignaturePad
                title="Assinatura Digital"
                description="Assine abaixo para confirmar a aprovação das horas extras"
                onSave={handleAssinaturaSalva}
                onCancel={handleCancelarAssinatura}
              />
            </div>
          </div>
        </div>
      </PwaAuthGuard>
    )
  }

  return (
    <PwaAuthGuard>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/pwa/notificacoes')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Aprovação de Horas Extras</h1>
          </div>

          <div className="space-y-6">
            {/* Informações do Registro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Detalhes do Registro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{registro.funcionario.nome}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Data</Label>
                    <div className="mt-1">
                      <span className="text-sm">{new Date(registro.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cargo</Label>
                    <div className="mt-1">
                      <span className="text-sm">{registro.funcionario.cargo}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Turno</Label>
                    <div className="mt-1">
                      <span className="text-sm">{registro.funcionario.turno}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Horas Trabalhadas</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{registro.horas_trabalhadas}h</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Horas Extras</Label>
                    <div className="mt-1">
                      <Badge className="bg-orange-100 text-orange-800">
                        +{registro.horas_extras}h
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Entrada</Label>
                    <div className="mt-1">
                      <span className="text-sm">{registro.entrada}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Saída</Label>
                    <div className="mt-1">
                      <span className="text-sm">{registro.saida}</span>
                    </div>
                  </div>
                </div>

                {registro.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Observações</Label>
                    <div className="mt-1">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {registro.observacoes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aviso Importante */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Aprovação com Assinatura Digital</h4>
                    <p className="text-sm text-yellow-800">
                      Para aprovar estas horas extras, você precisará assinar digitalmente. 
                      A assinatura será salva e vinculada ao registro para fins de auditoria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRejeitar}
                disabled={aprovando}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={handleAprovar}
                disabled={aprovando}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PwaAuthGuard>
  )
}
