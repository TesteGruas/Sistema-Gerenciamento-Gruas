"use client"

import React, { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, X, Loader2 } from "lucide-react"
import { apiJustificativas, type Funcionario } from "@/lib/api-ponto-eletronico"

interface JustificativaDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  funcionarios: Funcionario[]
  onSuccess?: () => void
}

export function JustificativaDialog({ 
  isOpen, 
  setIsOpen, 
  funcionarios,
  onSuccess 
}: JustificativaDialogProps) {
  const { toast } = useToast()
  
  // Estado do formulário isolado neste componente (não causa re-render do pai)
  const [justificativaData, setJustificativaData] = useState({
    funcionario_id: "",
    data: new Date().toISOString().split("T")[0], // Data padrão: hoje
    tipo: "",
    motivo: "",
  })
  
  const [arquivoJustificativa, setArquivoJustificativa] = useState<File | null>(null)
  const [uploadingArquivo, setUploadingArquivo] = useState(false)

  // Handlers simples - não precisam de useCallback pois são locais e leves
  const handleMotivoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJustificativaData(prev => ({ ...prev, motivo: e.target.value }))
  }

  const handleFuncionarioChange = (value: string) => {
    setJustificativaData(prev => ({ ...prev, funcionario_id: value }))
  }

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJustificativaData(prev => ({ ...prev, data: e.target.value }))
  }

  const handleTipoChange = (value: string) => {
    setJustificativaData(prev => ({ ...prev, tipo: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUploadingArquivo(true)
      await apiJustificativas.criar({
        funcionario_id: parseInt(justificativaData.funcionario_id),
        data: justificativaData.data,
        tipo: justificativaData.tipo,
        motivo: justificativaData.motivo
      }, arquivoJustificativa || undefined)

      toast({
        title: "Sucesso",
        description: "Justificativa enviada com sucesso!",
        variant: "default"
      })
      
      // Resetar formulário
      setJustificativaData({
        funcionario_id: "",
        data: new Date().toISOString().split("T")[0],
        tipo: "",
        motivo: "",
      })
      setArquivoJustificativa(null)
      setIsOpen(false)
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 100)
      }
    } catch (error: any) {
      console.error('Erro ao criar justificativa:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar justificativa. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setUploadingArquivo(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Resetar formulário ao fechar
    setJustificativaData({
      funcionario_id: "",
      data: new Date().toISOString().split("T")[0],
      tipo: "",
      motivo: "",
    })
    setArquivoJustificativa(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Justificativa</DialogTitle>
          <DialogDescription>Registre justificativas para atrasos, faltas ou saídas antecipadas</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funcionario">Funcionário</Label>
            <Select
              value={justificativaData.funcionario_id}
              onValueChange={handleFuncionarioChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((func) => (
                  <SelectItem key={func.id} value={func.id.toString()}>
                    {func.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={justificativaData.data}
                onChange={handleDataChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={justificativaData.tipo}
                onValueChange={handleTipoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atraso">Atraso</SelectItem>
                  <SelectItem value="Falta">Falta</SelectItem>
                  <SelectItem value="Saída Antecipada">Saída Antecipada</SelectItem>
                  <SelectItem value="Ausência Parcial">Ausência Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={justificativaData.motivo}
              onChange={handleMotivoChange}
              placeholder="Descreva o motivo da justificativa..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anexo">Anexar Arquivo ou Imagem (Opcional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="anexo"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Arquivo muito grande",
                        description: "O arquivo deve ter no máximo 10MB",
                        variant: "destructive"
                      })
                      return
                    }
                    setArquivoJustificativa(file)
                  }
                }}
                className="cursor-pointer"
              />
              {arquivoJustificativa && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{arquivoJustificativa.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setArquivoJustificativa(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formatos aceitos: PDF, Word, JPG, PNG, GIF, WEBP (máx. 10MB)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uploadingArquivo}
            >
              {uploadingArquivo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

