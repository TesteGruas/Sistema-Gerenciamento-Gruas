"use client"

import { cn } from "@/lib/utils"

export const CONSULTAS_NAVEGACAO = [
  { id: "dia", rotulo: "Pontos do dia" },
  { id: "historico", rotulo: "Histórico de pontos" },
  { id: "pendencias", rotulo: "Pendências" },
  { id: "extras", rotulo: "Horas extras" },
  { id: "justificativas", rotulo: "Justificativas" },
  { id: "corrido", rotulo: "Trabalho corrido" },
  { id: "relatorio", rotulo: "Relatório mensal" },
  { id: "espelho", rotulo: "Espelho de ponto" },
] as const

export type ConsultaNavegacao = (typeof CONSULTAS_NAVEGACAO)[number]["id"]

export function NavegacaoPonto({
  atual,
  onAbrir,
}: {
  atual: ConsultaNavegacao
  onAbrir: (consulta: ConsultaNavegacao) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {CONSULTAS_NAVEGACAO.map((item) => {
        const ativo = item.id === atual
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAbrir(item.id)}
            className={cn(
              "h-10 shrink-0 rounded-lg border px-3 text-sm font-medium shadow-sm",
              ativo ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {item.rotulo}
          </button>
        )
      })}
    </div>
  )
}
