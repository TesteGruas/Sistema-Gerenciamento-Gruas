/**
 * Função auxiliar para adicionar rodapé com informações da empresa em PDFs gerados no frontend (jsPDF)
 * @param doc - Documento jsPDF
 */
export function adicionarRodapeEmpresaFrontend(doc: any) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = 210 // largura da página A4 em mm
  const margin = 14 // margem lateral
  const rodapeY = 285 // posição Y do rodapé (próximo ao final da página)

  // Informações da empresa
  const empresaInfo = {
    nome: 'IRBANA COPAS SERV. DE MANT E MONTG LTDA',
    website: 'www.gruascopa.com.br',
    email: 'info@gruascopa.com.br',
    endereco: 'Rua Benevenuto Vieira, 48 Jardim Rancho Grande 13306-141 ITU - SP',
    telefones: '(11) 3656-1847 (11) 3656-1722 Whats (11) 98818-5951'
  }

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Linha separadora acima do rodapé
    doc.setLineWidth(0.3)
    doc.line(margin, rodapeY - 5, pageWidth - margin, rodapeY - 5)

    // Texto do rodapé
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    // Primeira linha: Nome da empresa, website e email
    const linha1 = `${empresaInfo.nome} ${empresaInfo.website} e-mail: ${empresaInfo.email}`
    doc.text(linha1, pageWidth / 2, rodapeY, {
      align: 'center',
      maxWidth: pageWidth - margin * 2
    })

    // Segunda linha: Endereço e telefones
    const linha2 = `${empresaInfo.endereco} ${empresaInfo.telefones}`
    doc.text(linha2, pageWidth / 2, rodapeY + 5, {
      align: 'center',
      maxWidth: pageWidth - margin * 2
    })
  }
}

