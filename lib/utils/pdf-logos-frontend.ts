/**
 * Função auxiliar para adicionar logos no cabeçalho de PDFs gerados no frontend (jsPDF)
 * @param doc - Documento jsPDF
 * @param yPos - Posição Y inicial (padrão: 10mm)
 * @returns Nova posição Y após os logos
 */
export async function adicionarLogosNoCabecalhoFrontend(
  doc: any,
  yPos: number = 10
): Promise<number> {
  try {
    // Carregar logos como imagens
    const logo1 = await fetch('/logo.png')
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
      )
      .catch(() => null)

    const logo2 = await fetch('/logo2.png')
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
      )
      .catch(() => null)

    const logoHeight = 12 // altura em mm (aumentado de 8 para 12)
    const logoWidth1 = 24 // largura em mm (aumentado de 16 para 24)
    const logoWidth2 = 24 // largura em mm (aumentado de 16 para 24)
    const margin = 14 // margem lateral (mesma margem do documento)
    const pageWidth = 210 // largura da página A4 em mm

    // Posição X: logos nas extremidades
    const logo1X = margin // Logo1 na extremidade esquerda
    const logo2X = pageWidth - margin - logoWidth2 // Logo2 na extremidade direita

    if (logo1) {
      doc.addImage(logo1, 'PNG', logo1X, yPos, logoWidth1, logoHeight)
    }
    if (logo2) {
      doc.addImage(logo2, 'PNG', logo2X, yPos, logoWidth2, logoHeight)
    }

    // Retornar nova posição Y (abaixo dos logos + espaçamento)
    return yPos + logoHeight + 5
  } catch (error) {
    console.warn('Erro ao adicionar logos no cabeçalho:', error)
    // Se houver erro, retornar a posição Y original + um pequeno espaço
    return yPos + 20
  }
}

