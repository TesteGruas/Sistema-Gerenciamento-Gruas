/**
 * Layout vertical de checklists diários no PDF do livro/export:
 * cada checklist vira um bloco com itens em coluna (Item | Verificado).
 */

import type { jsPDF } from "jspdf"
import {
  contagemChecklistLivroGrua,
  listarItensChecklistLivroGrua
} from "@/lib/checklist-livro-grua-shared"

export type ChecklistPdfBloco = {
  dataLabel: string
  funcionario: string
  observacoes?: string
  statusLabel?: string
  /** Registro bruto com cabos/polias/... e checklist_itens_extras */
  entrada: Record<string, unknown>
}

type DesenharChecklistsOpts = {
  doc: jsPDF
  checklists: ChecklistPdfBloco[]
  startY: number
  corBase?: [number, number, number]
  /** Y máximo antes de pedir nova página (conteúdo útil) */
  maxY?: number
  onNovaPagina?: () => Promise<number> | number
  marginLeft?: number
  contentWidth?: number
  autoTable: (doc: jsPDF, opts: Record<string, unknown>) => void
}

const COR_PADRAO: [number, number, number] = [135, 27, 11]

function estimarAlturaBloco(qtdItens: number, temObs: boolean): number {
  // barra título + tabela + linhas + gap + obs opcional
  return 10 + 8 + qtdItens * 6.2 + 6 + (temObs ? 10 : 0)
}

/**
 * Desenha checklists em blocos verticais. Retorna o Y final após o último bloco.
 */
export async function desenharChecklistsLivroGruaNoPdf(
  opts: DesenharChecklistsOpts
): Promise<number> {
  const {
    doc,
    checklists,
    corBase = COR_PADRAO,
    maxY = doc.internal.pageSize.getHeight() - 28,
    onNovaPagina,
    marginLeft = 14,
    contentWidth = doc.internal.pageSize.getWidth() - 28,
    autoTable
  } = opts

  let yPos = opts.startY

  for (const checklist of checklists) {
    const itens = listarItensChecklistLivroGrua(checklist.entrada)
    const { marcados, total } = contagemChecklistLivroGrua(checklist.entrada)
    const completo = total > 0 && marcados === total
    const statusTexto =
      checklist.statusLabel ||
      `${marcados}/${total} ${completo ? "Completo" : "Incompleto"}`
    const obs = (checklist.observacoes || "").trim()
    const altura = estimarAlturaBloco(itens.length, Boolean(obs))

    if (yPos + Math.min(altura, 40) > maxY) {
      if (onNovaPagina) {
        yPos = await onNovaPagina()
      } else {
        doc.addPage()
        yPos = 18
      }
    }

    // Cabeçalho do bloco
    doc.setFillColor(...corBase)
    doc.roundedRect(marginLeft, yPos, contentWidth, 8, 1.5, 1.5, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.setFont("helvetica", "bold")
    const tituloBloco = `${checklist.dataLabel}  ·  ${checklist.funcionario}  ·  ${statusTexto}`
    doc.text(tituloBloco, marginLeft + 3, yPos + 5.5, {
      maxWidth: contentWidth - 6
    })
    yPos += 10

    const body = itens.map((item) => [item.label, item.ok ? "Sim" : "Não"])

    autoTable(doc, {
      head: [["Item", "Verificado"]],
      body,
      startY: yPos,
      margin: { left: marginLeft, right: marginLeft },
      tableWidth: contentWidth,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [210, 210, 210],
        lineWidth: 0.1,
        overflow: "linebreak",
        valign: "middle"
      },
      headStyles: {
        fillColor: corBase,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.72 },
        1: { cellWidth: contentWidth * 0.28, halign: "center", fontStyle: "bold" }
      },
      didParseCell: (data: {
        section: string
        column: { index: number }
        cell: { raw?: unknown; styles: { textColor?: number[] } }
      }) => {
        if (data.section !== "body" || data.column.index !== 1) return
        const raw = String(data.cell.raw ?? "")
        if (raw === "Sim") data.cell.styles.textColor = [22, 101, 52]
        if (raw === "Não") data.cell.styles.textColor = [153, 27, 27]
      }
    })

    const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY?: number } })
      .lastAutoTable
    yPos = (lastAutoTable?.finalY || yPos) + 3

    if (obs) {
      if (yPos + 10 > maxY) {
        if (onNovaPagina) {
          yPos = await onNovaPagina()
        } else {
          doc.addPage()
          yPos = 18
        }
      }
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      const obsLinhas = doc.splitTextToSize(`Observações: ${obs}`, contentWidth - 2)
      doc.text(obsLinhas, marginLeft + 1, yPos)
      yPos += obsLinhas.length * 4 + 4
    }

    yPos += 6
  }

  doc.setTextColor(0, 0, 0)
  return yPos
}

/** Linhas longas para Excel/CSV: um item por linha. */
export function formatarChecklistsParaExportacaoLonga(
  checklists: Array<{
    dataLabel: string
    funcionario: string
    observacoes?: string
    entrada: Record<string, unknown>
  }>
): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = []
  for (const c of checklists) {
    const { marcados, total } = contagemChecklistLivroGrua(c.entrada)
    const completo = total > 0 && marcados === total
    const status = `${marcados}/${total} ${completo ? "Completo" : "Incompleto"}`
    const itens = listarItensChecklistLivroGrua(c.entrada)
    for (const item of itens) {
      rows.push({
        Data: c.dataLabel,
        Funcionário: c.funcionario,
        Item: item.label,
        Verificado: item.ok ? "Sim" : "Não",
        Status: status,
        Observações: c.observacoes || ""
      })
    }
  }
  return rows
}
