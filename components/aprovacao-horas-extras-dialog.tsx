"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, User, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Funcionario {
  id: number
  nome: string
  cargo: string
  obra_id?: number
  obra_nome?: string
}

interface Gestor {
  id: number
  nome: string
  cargo: string
  obra_id: number
  obra_nome: string
}

interface AprovacaoHorasExtrasDialogProps {
  isOpen: boolean
  onClose: () => void
  registro: any
  onAprovar: (gestorId: number, observacoes: string) => Promise<void>
}

export function AprovacaoHorasExtrasDialog({
  isOpen,
  onClose,
  registro,
  onAprovar
}: AprovacaoHorasExtrasDialogProps) {
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [gestorSelecionado, setGestorSelecionado] = useState<number | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Carregar gestores da obra do funcionário
  useEffect(() => {
    if (isOpen && registro?.funcionario?.obra_id) {
      carregarGestores(registro.funcionario.obra_id)
    }
  }, [isOpen, registro])

  const carregarGestores = async (obraId: number) => {
    try {
      // Simular busca de gestores da obra
      // Em produção, isso viria de uma API real
      const gestoresMock = [
        {
          id: 1,
          nome: "João Silva",
          cargo: "Gestor de Obra",
          obra_id: obraId,
          obra_nome: "Obra ABC"
        },
        {
          id: 2,
          nome: "Maria Santos",
          cargo: "Supervisora",
          obra_id: obraId,
          obra_nome: "Obra ABC"
        }
      ]
      setGestores(gestoresMock)
    } catch (error) {
      console.error("Erro ao carregar gestores:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gestores da obra",
        variant: "destructive"
      })
    }
  }

  const handleAprovar = async () => {
    if (!gestorSelecionado) {
      toast({
        title: "Atenção",
        description: "Selecione um gestor para aprovação",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await onAprovar(gestorSelecionado, observacoes)
      toast({
        title: "Sucesso",
        description: "Horas extras enviadas para aprovação do gestor",
        variant: "default"
      })
      onClose()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar para aprovação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!registro) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Aprovação de Horas Extras
          </DialogTitle>
          <DialogDescription>
            Envie as horas extras para aprovação do gestor da obra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{registro.funcionario?.nome}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data</Label>
                  <div className="mt-1">
                    <span className="text-sm">{new Date(registro.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
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
              
              {registro.funcionario?.obra_nome && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Obra</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{registro.funcionario.obra_nome}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção do Gestor */}
          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor Responsável *</Label>
            <Select value={gestorSelecionado?.toString()} onValueChange={(value) => setGestorSelecionado(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gestor da obra" />
              </SelectTrigger>
              <SelectContent>
                {gestores.map((gestor) => (
                  <SelectItem key={gestor.id} value={gestor.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{gestor.nome}</span>
                      <span className="text-sm text-gray-500">{gestor.cargo}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              O gestor receberá uma notificação para aprovar as horas extras via assinatura digital
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre as horas extras..."
              rows={3}
            />
          </div>

          {/* Informações Importantes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">Processo de Aprovação</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• O gestor receberá uma notificação no celular</li>
                    <li>• A aprovação será feita via assinatura digital</li>
                    <li>• O funcionário será notificado do resultado</li>
                    <li>• Aprovações pendentes são verificadas diariamente</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAprovar} 
              disabled={loading || !gestorSelecionado}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Enviando..." : "Enviar para Aprovação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
