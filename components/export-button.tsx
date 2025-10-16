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

      const doc = new jsPDF()
      
      // Título
      if (titulo) {
        doc.setFontSize(16)
        doc.text(titulo, 14, 22)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
      }

      // Dados da tabela
      const headers = colunas || Object.keys(dados[0])
      const tableData = dados.map(row => 
        headers.map(header => row[header] || '')
      )

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: titulo ? 40 : 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })

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