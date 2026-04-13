"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Wifi, WifiOff } from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { obrasApi } from "@/lib/api-obras"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaChecklistDiario } from "@/components/livro-grua-checklist-diario"

export default function PWAObraChecklistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const obraId = Number(params.id)

  const [obraNome, setObraNome] = useState("Obra")
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  const [isNovoChecklistOpen, setIsNovoChecklistOpen] = useState(false)
  const [isEditarChecklistOpen, setIsEditarChecklistOpen] = useState(false)
  const [isVisualizarChecklistOpen, setIsVisualizarChecklistOpen] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<any>(null)
  const [gruaSelecionadaChecklist, setGruaSelecionadaChecklist] = useState<string>("")

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
      setError(err?.message || "Erro ao carregar checklists da obra")
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

  const handleNovoChecklist = (gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(null)
    setIsNovoChecklistOpen(true)
  }

  const handleEditarChecklist = (checklist: any, gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(checklist)
    setIsEditarChecklistOpen(true)
  }

  const handleVisualizarChecklist = (checklist: any) => {
    setChecklistSelecionado(checklist)
    setIsVisualizarChecklistOpen(true)
  }

  const handleExcluirChecklist = async (checklist: any) => {
    if (!checklist.id) return
    if (!confirm("Tem certeza que deseja excluir este checklist?")) return

    try {
      await livroGruaApi.excluirEntrada(checklist.id)
      toast({
        title: "Checklist excluído",
        description: "O checklist foi excluído com sucesso.",
      })
      carregarDados()
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o checklist.",
        variant: "destructive",
      })
    }
  }

  const handleSucessoChecklist = () => {
    setIsNovoChecklistOpen(false)
    setIsEditarChecklistOpen(false)
    setIsVisualizarChecklistOpen(false)
    setChecklistSelecionado(null)
    setGruaSelecionadaChecklist("")
    carregarDados()
  }

  if (loading) return <PageLoader text="Carregando checklists..." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/pwa/obras/${obraId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Checklist - {obraNome}</h1>
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
            <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
            <p className="text-gray-600">Adicione gruas à obra para visualizar checklists.</p>
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
                <LivroGruaChecklistList
                  gruaId={String(grua.id)}
                  onNovoChecklist={() => handleNovoChecklist(String(grua.id))}
                  onEditarChecklist={(checklist) => handleEditarChecklist(checklist, String(grua.id))}
                  onVisualizarChecklist={handleVisualizarChecklist}
                  onExcluirChecklist={handleExcluirChecklist}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isNovoChecklistOpen} onOpenChange={setIsNovoChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist Diário</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaChecklist && (
            <LivroGruaChecklistDiario
              gruaId={gruaSelecionadaChecklist}
              obraId={Number.isFinite(obraId) ? obraId : undefined}
              onSave={handleSucessoChecklist}
              onCancel={() => setIsNovoChecklistOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditarChecklistOpen} onOpenChange={setIsEditarChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Checklist Diário</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaChecklist && checklistSelecionado && (
            <LivroGruaChecklistDiario
              gruaId={gruaSelecionadaChecklist}
              obraId={Number.isFinite(obraId) ? obraId : undefined}
              checklist={checklistSelecionado}
              onSave={handleSucessoChecklist}
              onCancel={() => setIsEditarChecklistOpen(false)}
              modoEdicao={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isVisualizarChecklistOpen} onOpenChange={setIsVisualizarChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Checklist Diário</DialogTitle>
          </DialogHeader>
          {checklistSelecionado && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data</label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(checklistSelecionado.data || checklistSelecionado.data_entrada).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Funcionário</label>
                  <p className="text-sm mt-1">{checklistSelecionado.funcionario_nome || "Não informado"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

