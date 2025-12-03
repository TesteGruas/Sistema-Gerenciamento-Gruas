'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonProps {
  dados: any[]
  tipo: 'gruas' | 'obras' | 'funcionarios' | 'financeiro' | 'estoque' | 'ponto' | 'relatorios'
  nomeArquivo?: string
  filtros?: Record<string, any>
  colunas?: string[]
  titulo?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onExport?: (formato: 'pdf' | 'excel' | 'csv') => Promise<void>
}

export function ExportButton({
  dados,
  tipo,
  nomeArquivo,
  filtros,
  colunas,
  titulo,
  className,
  variant = 'outline',
  size = 'default',
  onExport
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    if (onExport) {
      // Usar função customizada se fornecida
      setIsExporting(true)
      try {
        await onExport(formato)
      } catch (error) {
        console.error('Erro ao exportar:', error)
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar os dados.",
          variant: "destructive"
        })
      } finally {
        setIsExporting(false)
      }
      return
    }

    if (!dados || dados.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há dados disponíveis para exportação.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    try {
      // Tentar usar API do backend primeiro
      const token = localStorage.getItem('access_token')
      
      if (token && process.env.NEXT_PUBLIC_API_URL) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/exportar/${tipo}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              formato,
              dados,
              filtros,
              colunas,
              titulo
            })
          }
        )

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : formato}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          toast({
            title: "Exportação concluída!",
            description: `Arquivo ${formato.toUpperCase()} baixado com sucesso.`,
          })
          return
        }
      }

      // Fallback: exportação local
      await exportLocal(formato)
      
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportLocal = async (formato: 'pdf' | 'excel' | 'csv') => {
    if (formato === 'csv') {
      exportCSV()
    } else if (formato === 'excel') {
      await exportExcel()
    } else if (formato === 'pdf') {
      await exportPDF()
    }
  }

  const exportCSV = () => {
    if (!dados || dados.length === 0) return

    const headers = colunas || Object.keys(dados[0])
    const csvContent = [
      headers.join(','),
      ...dados.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV baixado com sucesso.",
    })
  }

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      
      const headers = colunas || Object.keys(dados[0])
      const worksheet = XLSX.utils.json_to_sheet(dados.map(row => {
        const newRow: any = {}
        headers.forEach(header => {
          newRow[header] = row[header] || ''
        })
        return newRow
      }))

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados')
      
      XLSX.writeFile(workbook, `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.xlsx`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo Excel baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      throw error
    }
  }

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      // Dados da tabela - verificar número de colunas antes de criar o PDF
      const headers = colunas || Object.keys(dados[0])
      const numCols = headers.length
      
      // Usar landscape se houver muitas colunas (mais de 8)
      const useLandscape = numCols > 8
      let doc = new jsPDF(useLandscape ? 'landscape' : 'portrait')
      
      // Adicionar logos no cabeçalho
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
      
      // Título
      if (titulo) {
        doc.setFontSize(16)
        doc.text(titulo, 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        const dataHora = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        doc.text(`Gerado em: ${dataHora}`, 14, yPos)
        yPos += 10
      }

      
      const tableData = dados.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Converter valores para string e limitar tamanho
          return String(value).substring(0, 100)
        })
      )

      // Calcular larguras de colunas baseado no número de colunas e orientação
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 28 // 14 de cada lado
      const availableWidth = pageWidth - margin

      // Configurar larguras específicas para colunas comuns
      const columnStyles: any = {}
      let totalWidth = 0
      
      headers.forEach((header, index) => {
        const headerLower = String(header).toLowerCase()
        let cellWidth: number
        let halign: 'left' | 'center' | 'right' | undefined = undefined
        
        if (headerLower.includes('data')) {
          cellWidth = useLandscape ? 30 : 25
          halign = 'center'
        } else if (headerLower.includes('funcionário') || headerLower.includes('realizado por')) {
          cellWidth = useLandscape ? 50 : 40
        } else if (headerLower.includes('observações') || headerLower.includes('descrição')) {
          cellWidth = useLandscape ? 80 : 60
        } else if (headerLower.includes('status') || headerLower.includes('itens verificados')) {
          cellWidth = useLandscape ? 35 : 30
          halign = 'center'
        } else if (headerLower === 'cabos' || headerLower === 'polias' || 
                   headerLower === 'estrutura' || headerLower === 'movimentos' ||
                   headerLower === 'freios' || headerLower === 'limitadores' ||
                   headerLower === 'indicadores' || headerLower === 'aterramento' ||
                   headerLower === 'aterramentos verificados') {
          cellWidth = useLandscape ? 25 : 20
          halign = 'center'
        } else if (headerLower.includes('cargo')) {
          cellWidth = useLandscape ? 40 : 30
        } else {
          // Largura padrão baseada no espaço disponível
          cellWidth = useLandscape ? 35 : 28
        }
        
        columnStyles[index] = halign ? { cellWidth, halign } : { cellWidth }
        totalWidth += cellWidth
      })
      
      // Ajustar larguras se excederem o espaço disponível
      if (totalWidth > availableWidth) {
        const ratio = availableWidth / totalWidth
        Object.keys(columnStyles).forEach(key => {
          const index = parseInt(key)
          columnStyles[index].cellWidth = Math.floor(columnStyles[index].cellWidth * ratio)
        })
      }

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap',
          textColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245]
        },
        columnStyles: columnStyles,
        margin: { top: yPos, left: 14, right: 14 },
        tableWidth: 'auto',
        didDrawPage: (data: any) => {
          // Adicionar número da página
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(128, 128, 128)
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          )
          doc.setTextColor(0, 0, 0)
        }
      })

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      doc.save(`${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo PDF baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}