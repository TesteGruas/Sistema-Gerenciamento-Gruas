"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Save, 
  X,
  DollarSign,
  User,
  AlertCircle
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { ordemComprasApi, type OrdemCompraBackend, type OrdemCompraCreateData, type OrdemCompraUpdateData } from "@/lib/api-ordem-compras"
import { useCurrentUser } from "@/hooks/use-current-user"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { apiUsuarios } from "@/lib/api-usuarios"

interface OrdemCompraFormProps {
  ordem?: OrdemCompraBackend
  onSave: () => void
  onCancel: () => void
}

export function OrdemCompraForm({
  ordem,
  onSave,
  onCancel
}: OrdemCompraFormProps) {
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funcionarios, setFuncionarios] = useState<Array<{ id: number; nome: string }>>([])
  const [usuarios, setUsuarios] = useState<Array<{ id: number; nome: string; email: string }>>([])
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)

  const [descricao, setDescricao] = useState("")
  const [valorTotal, setValorTotal] = useState("")
  const [solicitanteId, setSolicitanteId] = useState<number | undefined>(user?.id)
  const [aprovadorOrcamentoId, setAprovadorOrcamentoId] = useState<number | undefined>()
  const [responsavelPagamentoId, setResponsavelPagamentoId] = useState<number | undefined>()
  const [aprovadorFinalId, setAprovadorFinalId] = useState<number | undefined>()

  useEffect(() => {
    if (ordem) {
      setDescricao(ordem.descricao)
      setValorTotal(ordem.valor_total.toString())
      setSolicitanteId(ordem.solicitante_id)
      setAprovadorOrcamentoId(ordem.aprovador_orcamento_id)
      setResponsavelPagamentoId(ordem.responsavel_pagamento_id)
      setAprovadorFinalId(ordem.aprovador_final_id)
    }
    loadFuncionarios()
    loadUsuarios()
  }, [ordem])

  const loadFuncionarios = async () => {
    setLoadingFuncionarios(true)
    try {
      const response = await funcionariosApi.listarFuncionarios({ limit: 100, page: 1 })
      if (response.success && response.data) {
        setFuncionarios(response.data.map((f: any) => ({ id: f.id, nome: f.nome || f.name })))
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  const loadUsuarios = async () => {
    try {
      const response = await apiUsuarios.listar({ limit: 100, page: 1 })
      if (response.success && response.data) {
        setUsuarios(response.data.map((u: any) => ({ id: u.id, nome: u.nome || u.name, email: u.email })))
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (!numericValue) return ''
    const number = parseFloat(numericValue) / 100
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const parseCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  const handleValorTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setValorTotal(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!descricao.trim()) {
      setError("Descrição é obrigatória")
      return
    }

    if (!solicitanteId) {
      setError("Solicitante é obrigatório")
      return
    }

    setLoading(true)
    try {
      const data = {
        solicitante_id: solicitanteId,
        descricao: descricao.trim(),
        valor_total: parseCurrency(valorTotal),
        aprovador_orcamento_id: aprovadorOrcamentoId || undefined,
        responsavel_pagamento_id: responsavelPagamentoId || undefined,
        aprovador_final_id: aprovadorFinalId || undefined
      }

      if (ordem) {
        await ordemComprasApi.atualizar(ordem.id, data)
        toast({
          title: "Sucesso",
          description: "Ordem de compra atualizada com sucesso"
        })
      } else {
        await ordemComprasApi.criar(data)
        toast({
          title: "Sucesso",
          description: "Ordem de compra criada com sucesso"
        })
      }
      onSave()
    } catch (error: any) {
      setError(error.message || "Erro ao salvar ordem de compra")
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar ordem de compra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {ordem ? "Editar Ordem de Compra" : "Nova Ordem de Compra"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que será comprado..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="solicitante">Solicitante *</Label>
              <Select
                value={solicitanteId?.toString() || ""}
                onValueChange={(value) => setSolicitanteId(Number(value))}
                disabled={loadingFuncionarios}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o solicitante" />
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

            <div>
              <Label htmlFor="valor_total" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Valor Total
              </Label>
              <Input
                id="valor_total"
                type="text"
                value={valorTotal}
                onChange={handleValorTotalChange}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="aprovador_orcamento">Aprovador de Orçamento</Label>
              <Select
                value={aprovadorOrcamentoId?.toString() || ""}
                onValueChange={(value) => setAprovadorOrcamentoId(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {usuarios.map((usr) => (
                    <SelectItem key={usr.id} value={usr.id.toString()}>
                      {usr.nome} ({usr.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavel_pagamento">Responsável pelo Pagamento</Label>
              <Select
                value={responsavelPagamentoId?.toString() || ""}
                onValueChange={(value) => setResponsavelPagamentoId(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {usuarios.map((usr) => (
                    <SelectItem key={usr.id} value={usr.id.toString()}>
                      {usr.nome} ({usr.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="aprovador_final">Aprovador Final</Label>
              <Select
                value={aprovadorFinalId?.toString() || ""}
                onValueChange={(value) => setAprovadorFinalId(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {usuarios.map((usr) => (
                    <SelectItem key={usr.id} value={usr.id.toString()}>
                      {usr.nome} ({usr.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader text="Salvando..." />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {ordem ? "Atualizar" : "Criar"} Ordem
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

