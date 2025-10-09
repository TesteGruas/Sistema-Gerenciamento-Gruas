'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2, Table } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonProps {
  dados: any[]
  tipo: 'gruas' | 'obras' | 'funcionarios' | 'financeiro' | 'estoque' | 'ponto' | 'relatorios' | 'rh' | 'custos' | 'receitas' | 'orcamentos' | 'locacoes' | 'vendas' | 'compras'
  nomeArquivo?: string
  filtros?: Record<string, any>
  colunas?: string[]
  titulo?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
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
  size = 'default'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
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
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      const response = await fetch(
        `${apiUrl}/api/exportar/${tipo}`,
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
            titulo: titulo || `Relatório de ${tipo}`
          })
        }
      )

      if (!response.ok) {
        // Se a API não existir, fazer exportação local
        await exportarLocal(formato)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const extensao = formato === 'excel' ? 'xlsx' : formato
      const dataAtual = new Date().toISOString().split('T')[0]
      a.download = `${nomeArquivo || tipo}-${dataAtual}.${extensao}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${formato.toUpperCase()} baixado com sucesso.`,
      })
    } catch (error) {
      console.error('Erro ao exportar:', error)
      
      // Fallback para exportação local
      try {
        await exportarLocal(formato)
      } catch (localError) {
        console.error('Erro na exportação local:', localError)
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar os dados.",
          variant: "destructive"
        })
      }
    } finally {
      setIsExporting(false)
    }
  }

  const exportarLocal = async (formato: 'pdf' | 'excel' | 'csv') => {
    if (formato === 'csv') {
      exportarCSV()
    } else if (formato === 'excel') {
      await exportarExcel()
    } else if (formato === 'pdf') {
      await exportarPDF()
    }
  }

  const exportarCSV = () => {
    if (!dados || dados.length === 0) return

    // Obter cabeçalhos
    const headers = colunas || Object.keys(dados[0])
    
    // Criar CSV
    let csv = headers.join(',') + '\n'
    
    dados.forEach(item => {
      const row = headers.map(header => {
        const value = item[header]
        // Escapar valores com vírgula ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csv += row.join(',') + '\n'
    })

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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

  const exportarExcel = async () => {
    try {
      // Importar biblioteca dinamicamente
      const XLSX = await import('xlsx')
      
      if (!dados || dados.length === 0) return

      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(dados)
      
      // Criar workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, titulo || 'Dados')
      
      // Download
      XLSX.writeFile(wb, `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.xlsx`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo Excel baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast({
        title: "Biblioteca não instalada",
        description: "Instale a biblioteca xlsx: npm install xlsx",
        variant: "destructive"
      })
    }
  }

  const exportarPDF = async () => {
    try {
      // Importar biblioteca dinamicamente
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      
      if (!dados || dados.length === 0) return

      // Criar documento
      const doc = new jsPDF('l', 'mm', 'a4')
      
      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(titulo || `Relatório de ${tipo}`, 14, 20)
      
      // Data
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)
      doc.text(`Total de registros: ${dados.length}`, 14, 33)
      
      // Preparar dados para tabela
      const headers = colunas || Object.keys(dados[0])
      const rows = dados.map(item => 
        headers.map(header => String(item[header] || '-'))
      )
      
      // Adicionar tabela
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      
      // Download
      doc.save(`${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo PDF baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Biblioteca não instalada",
        description: "Instale as bibliotecas: npm install jspdf jspdf-autotable",
        variant: "destructive"
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className} 
          disabled={isExporting || !dados || dados.length === 0}
        >
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
        <DropdownMenuLabel>Escolha o formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <Table className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

