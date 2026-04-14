/**
 * Página de separação entre seções do livro da grua — mesmo padrão visual do laudo NR12/NR18
 * (cabeçalho com logos, título central dinâmico, rodapé institucional).
 */
import { adicionarLogosNoCabecalhoFrontend } from "@/lib/utils/pdf-logos-frontend"

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14

/** Converte linha do índice "1. TÍTULO" em texto da capa só com o título (sem enumeração). */
export function tituloCapaNr12DeLinhaIndice(linha: string): string {
  const m = linha.trim().match(/^\d+\.\s*(.+)$/)
  if (!m) return linha.trim().toUpperCase()
  return m[1].trim().toUpperCase()
}

/**
 * Adiciona uma nova página ao documento e desenha a capa de seção.
 * @returns índice da página criada (1-based), para excluir do rodapé padrão se necessário
 */
export async function adicionarPaginaCapaSecaoNr12(doc: any, tituloCentral: string): Promise<number> {
  doc.addPage()
  const pageIndex = doc.getNumberOfPages()
  doc.setPage(pageIndex)

  await adicionarLogosNoCabecalhoFrontend(doc, 10)

  const yHeader = 26
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("LAUDO DE ENTREGA TÉCNICA DE", PAGE_W / 2, yHeader, { align: "center" })
  doc.text("MÁQUINAS E EQUIPAMENTOS", PAGE_W / 2, yHeader + 5, { align: "center" })
  doc.text("CONFORME NR12 - NR18", PAGE_W / 2, yHeader + 10, { align: "center" })

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  const linhasTitulo = doc.splitTextToSize(tituloCentral, PAGE_W - MARGIN * 2)
  const alturaBloco = linhasTitulo.length * 8
  let yMid = PAGE_H / 2 - alturaBloco / 2
  for (const linha of linhasTitulo) {
    doc.text(linha, PAGE_W / 2, yMid, { align: "center" })
    yMid += 8
  }

  const rodapeY = PAGE_H - 16
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, rodapeY - 2, PAGE_W - MARGIN, rodapeY - 2)

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  const linha1 =
    "IRBANA COPAS SERV. DE MANT E MONTG LTDA www.gruascopa.com.br"
  doc.text(linha1, PAGE_W / 2, rodapeY, {
    align: "center",
    maxWidth: PAGE_W - MARGIN * 2
  })
  const linha2 =
    "e-mail: info@gruascopa.com.br Rua Benevenuto Vieira, 48 Jardim Rancho Grande 13306-141 ITU - SP (11) 3656-1847 (11) 3656-1722 Whats (11) 98818-5951"
  doc.text(linha2, PAGE_W / 2, rodapeY + 4, {
    align: "center",
    maxWidth: PAGE_W - MARGIN * 2
  })

  doc.setTextColor(0, 0, 0)
  return pageIndex
}

export type CapaInicialLivroGruaOpcoes = {
  obraNome: string
  nomeGrua: string
  idGrua: string
}

/**
 * Primeira página do PDF: capa do documento (antes do índice).
 * Usa a página 1 já criada pelo jsPDF.
 */
export async function desenharCapaInicialLivroGrua(
  doc: any,
  opcoes: CapaInicialLivroGruaOpcoes
): Promise<void> {
  doc.setPage(1)

  await adicionarLogosNoCabecalhoFrontend(doc, 10)

  const yHeader = 26
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("LAUDO DE ENTREGA TÉCNICA DE", PAGE_W / 2, yHeader, { align: "center" })
  doc.text("MÁQUINAS E EQUIPAMENTOS", PAGE_W / 2, yHeader + 5, { align: "center" })
  doc.text("CONFORME NR12 - NR18", PAGE_W / 2, yHeader + 10, { align: "center" })

  const yMid = PAGE_H / 2 - 28
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("LIVRO DA GRUA", PAGE_W / 2, yMid, { align: "center" })

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Manual de Operação da Obra", PAGE_W / 2, yMid + 10, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const obraLinhas = doc.splitTextToSize(opcoes.obraNome || "N/A", PAGE_W - MARGIN * 2)
  let yObra = yMid + 18
  for (const lin of obraLinhas) {
    doc.text(lin, PAGE_W / 2, yObra, { align: "center" })
    yObra += 5
  }

  doc.setFontSize(9)
  doc.text(`Equipamento: ${opcoes.nomeGrua}`, PAGE_W / 2, yObra + 2, { align: "center" })
  doc.text(`Identificação: ${opcoes.idGrua}`, PAGE_W / 2, yObra + 8, { align: "center" })
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    PAGE_W / 2,
    yObra + 14,
    { align: "center" }
  )

  const rodapeY = PAGE_H - 16
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, rodapeY - 2, PAGE_W - MARGIN, rodapeY - 2)

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  doc.text(
    "IRBANA COPAS SERV. DE MANT E MONTG LTDA www.gruascopa.com.br",
    PAGE_W / 2,
    rodapeY,
    { align: "center", maxWidth: PAGE_W - MARGIN * 2 }
  )
  doc.text(
    "e-mail: info@gruascopa.com.br Rua Benevenuto Vieira, 48 Jardim Rancho Grande 13306-141 ITU - SP (11) 3656-1847 (11) 3656-1722 Whats (11) 98818-5951",
    PAGE_W / 2,
    rodapeY + 4,
    { align: "center", maxWidth: PAGE_W - MARGIN * 2 }
  )
  doc.setTextColor(0, 0, 0)
}
