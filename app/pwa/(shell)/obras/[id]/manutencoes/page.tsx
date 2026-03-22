"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wrench, Wifi, WifiOff } from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { obrasApi } from "@/lib/api-obras"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { LivroGruaManutencao } from "@/components/livro-grua-manutencao"

export default function PWAObraManutencoesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const obraId = Number(params.id)

  const [obraNome, setObraNome] = useState("Obra")
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState(false)
  const [isEditarManutencaoOpen, setIsEditarManutencaoOpen] = useState(false)
  const [isVisualizarManutencaoOpen, setIsVisualizarManutencaoOpen] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<any>(null)
  const [gruaSelecionadaManutencao, setGruaSelecionadaManutencao] = useState<string>("")

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)

      const [obraResp, gruasResp] = await Promise.all([
        obrasApi.obterObraComRelacionamentos(obraId),
        gruaObraApi.buscarGruasPorObra(obraId),
      ])

      if (obraResp.success && obraResp.data) {
        setObraNome(obraResp.data.nome || "Obra")
      }

      if (gruasResp.success && Array.isArray(gruasResp.data)) {
        const gruasMapeadas = gruasResp.data.map((relacao: any) => ({
          id: String(relacao.grua_id),
          name: relacao.grua?.modelo || `Grua ${relacao.grua_id}`,
          modelo: relacao.grua?.modelo,
          fabricante: relacao.grua?.fabricante,
          status: relacao.status,
        }))
        setGruas(gruasMapeadas)
      } else {
        setGruas([])
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar manutenções da obra")
      setGruas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!obraId) return
    carregarDados()
  }, [obraId])

  const handleNovaManutencao = (gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(null)
    setIsNovaManutencaoOpen(true)
  }

  const handleEditarManutencao = (manutencao: any, gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(manutencao)
    setIsEditarManutencaoOpen(true)
  }

  const handleVisualizarManutencao = (manutencao: any) => {
    setManutencaoSelecionada(manutencao)
    setIsVisualizarManutencaoOpen(true)
  }

  const handleExcluirManutencao = async (manutencao: any) => {
    if (!manutencao.id) return
    if (!confirm("Tem certeza que deseja excluir esta manutenção?")) return

    try {
      await livroGruaApi.excluirEntrada(manutencao.id)
      toast({
        title: "Manutenção excluída",
        description: "A manutenção foi excluída com sucesso.",
      })
      carregarDados()
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a manutenção.",
        variant: "destructive",
      })
    }
  }

  const handleSucessoManutencao = () => {
    setIsNovaManutencaoOpen(false)
    setIsEditarManutencaoOpen(false)
    setIsVisualizarManutencaoOpen(false)
    setManutencaoSelecionada(null)
    setGruaSelecionadaManutencao("")
    carregarDados()
  }

  if (loading) return <PageLoader text="Carregando manutenções..." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/pwa/obras/${obraId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Manutenções - {obraNome}</h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {gruas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
            <p className="text-gray-600">Adicione gruas à obra para visualizar manutenções.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gruas.map((grua) => (
            <Card key={grua.id}>
              <CardHeader>
                <CardTitle className="text-base">{grua.name || `Grua ${grua.id}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <LivroGruaManutencaoList
                  gruaId={String(grua.id)}
                  onNovaManutencao={() => handleNovaManutencao(String(grua.id))}
                  onEditarManutencao={(manutencao) => handleEditarManutencao(manutencao, String(grua.id))}
                  onVisualizarManutencao={handleVisualizarManutencao}
                  onExcluirManutencao={handleExcluirManutencao}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isNovaManutencaoOpen} onOpenChange={setIsNovaManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaManutencao && (
            <LivroGruaManutencao
              gruaId={gruaSelecionadaManutencao}
              onSave={handleSucessoManutencao}
              onCancel={() => setIsNovaManutencaoOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditarManutencaoOpen} onOpenChange={setIsEditarManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaManutencao && manutencaoSelecionada && (
            <LivroGruaManutencao
              gruaId={gruaSelecionadaManutencao}
              manutencao={manutencaoSelecionada}
              onSave={handleSucessoManutencao}
              onCancel={() => setIsEditarManutencaoOpen(false)}
              modoEdicao={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isVisualizarManutencaoOpen} onOpenChange={setIsVisualizarManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Manutenção</DialogTitle>
          </DialogHeader>
          {manutencaoSelecionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data</label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(manutencaoSelecionada.data || manutencaoSelecionada.data_entrada).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Realizado Por</label>
                  <p className="text-sm mt-1">
                    {manutencaoSelecionada.realizado_por_nome || manutencaoSelecionada.funcionario_nome || "Não informado"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

