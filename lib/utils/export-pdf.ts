import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportPDFOptions {
  titulo: string
  subtitulo?: string
  obraNome?: string
  obraId?: string
  tabName?: string
}

/**
 * Função utilitária para exportar conteúdo de tab para PDF
 */
export async function exportTabToPDF(
  tabContent: HTMLElement | null,
  options: ExportPDFOptions
): Promise<void> {
  if (!tabContent) {
    throw new Error('Conteúdo da tab não encontrado')
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Cabeçalho
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(options.titulo, 105, 20, { align: 'center' })

  if (options.subtitulo) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(options.subtitulo, 105, 28, { align: 'center' })
  }

  if (options.obraNome) {
    doc.setFontSize(10)
    doc.text(`Obra: ${options.obraNome}`, 14, 36)
  }

  if (options.tabName) {
    doc.setFontSize(10)
    doc.text(`Aba: ${options.tabName}`, 14, 42)
  }

  // Data de geração
  doc.setFontSize(9)
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    14,
    48
  )

  // Linha separadora
  doc.setLineWidth(0.5)
  doc.line(14, 52, 196, 52)

  let startY = 58

  // Extrair dados de tabelas
  const tables = tabContent.querySelectorAll('table')
  if (tables.length > 0) {
    tables.forEach((table, index) => {
      if (index > 0 || startY > 250) {
        doc.addPage()
        startY = 20
      }

      const headers: string[] = []
      const rows: string[][] = []

      // Extrair cabeçalhos
      const headerRow = table.querySelector('thead tr')
      if (headerRow) {
        headerRow.querySelectorAll('th').forEach((th) => {
          const text = th.textContent?.trim() || ''
          if (text) headers.push(text)
        })
      }

      // Se não encontrou no thead, tentar primeira linha do tbody
      if (headers.length === 0) {
        const firstRow = table.querySelector('tbody tr')
        if (firstRow) {
          firstRow.querySelectorAll('td, th').forEach((cell) => {
            const text = cell.textContent?.trim() || ''
            if (text) headers.push(text)
          })
        }
      }

      // Extrair linhas
      const tbodyRows = table.querySelectorAll('tbody tr')
      tbodyRows.forEach((row, rowIndex) => {
        // Pular primeira linha se já foi usada como cabeçalho
        if (headers.length === 0 || rowIndex > 0 || !table.querySelector('thead')) {
          const rowData: string[] = []
          row.querySelectorAll('td, th').forEach((cell) => {
            const text = cell.textContent?.trim() || ''
            // Limitar tamanho do texto para evitar problemas no PDF
            rowData.push(text.length > 50 ? text.substring(0, 47) + '...' : text)
          })
          if (rowData.length > 0) {
            rows.push(rowData)
          }
        }
      })

      if (headers.length > 0 && rows.length > 0) {
        try {
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: startY,
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', cellWidth: 'wrap' },
            headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: startY, left: 14, right: 14 },
            tableWidth: 'auto'
          })

          startY = (doc as any).lastAutoTable.finalY + 10
        } catch (error) {
          console.error('Erro ao gerar tabela no PDF:', error)
          // Se der erro, tentar texto simples
          doc.setFontSize(9)
          doc.text('Erro ao renderizar tabela', 14, startY)
          startY += 10
        }
      }
    })
  }

  // Extrair cards e informações
  const cards = tabContent.querySelectorAll('[class*="Card"]')
  if (cards.length > 0 && tables.length === 0) {
    cards.forEach((card, index) => {
      if (startY > 260) {
        doc.addPage()
        startY = 20
      }

      const cardTitle = card.querySelector('[class*="CardTitle"]')?.textContent?.trim()
      const cardContent = card.querySelector('[class*="CardContent"]')

      if (cardTitle) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(cardTitle, 14, startY)
        startY += 8
      }

      if (cardContent) {
        // Extrair informações do card
        const infoItems = cardContent.querySelectorAll('div')
        infoItems.forEach((item) => {
          const text = item.textContent?.trim()
          if (text && text.length > 0 && text.length < 100) {
            if (startY > 270) {
              doc.addPage()
              startY = 20
            }
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text(text, 16, startY, { maxWidth: 182 })
            startY += 6
          }
        })
      }

      startY += 5
    })
  }

  // Extrair texto geral se não houver tabelas ou cards estruturados
  if (tables.length === 0 && cards.length === 0) {
    const textContent = tabContent.textContent || ''
    const lines = textContent.split('\n').filter(line => line.trim().length > 0)
    
    lines.forEach((line) => {
      if (startY > 270) {
        doc.addPage()
        startY = 20
      }
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const truncatedLine = line.trim().substring(0, 100)
      doc.text(truncatedLine, 14, startY, { maxWidth: 182 })
      startY += 6
    })
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${pageCount} - Sistema de Gerenciamento de Gruas`,
      105,
      285,
      { align: 'center' }
    )
  }

  // Salvar PDF
  const fileName = `${options.titulo.replace(/\s+/g, '-')}-${options.obraNome?.replace(/\s+/g, '-') || 'obra'}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

/**
 * Função para exportar todas as tabs de uma obra para um único PDF
 */
export async function exportAllTabsToPDF(
  tabsData: Array<{ name: string; content: HTMLElement | null }>,
  options: ExportPDFOptions
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Cabeçalho geral
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(options.titulo || 'Relatório Completo da Obra', 105, 20, { align: 'center' })

  if (options.obraNome) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Obra: ${options.obraNome}`, 105, 28, { align: 'center' })
  }

  doc.setFontSize(9)
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    14,
    36
  )

  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  let startY = 46

  // Processar cada tab
  tabsData.forEach((tab, tabIndex) => {
    if (tab.content) {
      // Nova página para cada tab (exceto a primeira)
      if (tabIndex > 0) {
        doc.addPage()
        startY = 20
      }

      // Título da tab
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(tab.name, 14, startY)
      startY += 8

      // Extrair tabelas
      const tables = tab.content.querySelectorAll('table')
      tables.forEach((table) => {
        const headers: string[] = []
        const rows: string[][] = []

        const headerRow = table.querySelector('thead tr')
        if (headerRow) {
          headerRow.querySelectorAll('th').forEach((th) => {
            headers.push(th.textContent?.trim() || '')
          })
        }

        const tbodyRows = table.querySelectorAll('tbody tr')
        tbodyRows.forEach((row) => {
          const rowData: string[] = []
          row.querySelectorAll('td').forEach((td) => {
            rowData.push(td.textContent?.trim() || '')
          })
          if (rowData.length > 0) {
            rows.push(rowData)
          }
        })

        if (headers.length > 0 && rows.length > 0) {
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: startY, left: 14, right: 14 }
          })

          startY = (doc as any).lastAutoTable.finalY + 10
        }
      })

      // Extrair cards
      const cards = tab.content.querySelectorAll('[class*="Card"]')
      cards.forEach((card) => {
        if (startY > 260) {
          doc.addPage()
          startY = 20
        }

        const cardTitle = card.querySelector('[class*="CardTitle"]')?.textContent?.trim()
        if (cardTitle) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(cardTitle, 14, startY)
          startY += 6
        }

        const cardContent = card.querySelector('[class*="CardContent"]')
        if (cardContent) {
          const text = cardContent.textContent?.trim()
          if (text) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            const lines = doc.splitTextToSize(text, 182)
            doc.text(lines, 16, startY)
            startY += lines.length * 5 + 3
          }
        }
      })
    }
  })

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${pageCount} - Sistema de Gerenciamento de Gruas`,
      105,
      285,
      { align: 'center' }
    )
  }

  // Salvar PDF
  const fileName = `Relatorio-Completo-${options.obraNome?.replace(/\s+/g, '-') || 'obra'}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

