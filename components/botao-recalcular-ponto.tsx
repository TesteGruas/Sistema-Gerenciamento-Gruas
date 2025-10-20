"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiRegistrosPonto } from "@/lib/api-ponto-eletronico"
import { RefreshCw, Loader2 } from "lucide-react"

interface BotaoRecalcularPontoProps {
  onRecalculoCompleto?: () => void
  dataInicio?: string
  dataFim?: string
}

/**
 * Botão para recalcular registros de ponto com problemas
 * Pode ser adicionado em qualquer página
 */
export function BotaoRecalcularPonto({ 
  onRecalculoCompleto,
  dataInicio,
  dataFim 
}: BotaoRecalcularPontoProps) {
  const [recalculando, setRecalculando] = useState(false)
  const { toast } = useToast()

  const recalcular = async () => {
    setRecalculando(true)
    try {
      const payload: any = {
        recalcular_todos: false // Apenas registros com problemas
      }

      if (dataInicio) payload.data_inicio = dataInicio
      if (dataFim) payload.data_fim = dataFim

      const resultado = await apiRegistrosPonto.recalcular(payload)

      toast({
        title: "✅ Recálculo Concluído",
        description: `${resultado.atualizados} registro(s) atualizado(s) de ${resultado.total}`,
      })

      // Chamar callback para recarregar dados
      if (onRecalculoCompleto) {
        onRecalculoCompleto()
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Recalcular",
        description: error.message || "Erro ao recalcular registros",
        variant: "destructive"
      })
    } finally {
      setRecalculando(false)
    }
  }

  return (
    <Button 
      onClick={recalcular} 
      disabled={recalculando}
      variant="outline"
      size="sm"
    >
      {recalculando ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Recalculando...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Recalcular Registros
        </>
      )}
    </Button>
  )
}

