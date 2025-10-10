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
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  dados: any[]
  tipo: 'gruas' | 'obras' | 'funcionarios' | 'clientes' | 'financeiro' | 'estoque' | 'ponto' | 'relatorios'
  nomeArquivo?: string
  filtros?: Record<string, any>
  colunas?: Array<{ key: string; label: string }>
  titulo?: string
  className?: string
}

export function ExportButton({
  dados,
  tipo,
  nomeArquivo,
  filtros,
  colunas,
  titulo,
  className
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Definir colunas padrão por tipo se não forem fornecidas
  const getColunasDefault = () => {
    if (colunas) return colunas

    switch (tipo) {
      case 'gruas':
        return [
          { key: 'name', label: 'Nome' },
          { key: 'model', label: 'Modelo' },
          { key: 'fabricante', label: 'Fabricante' },
          { key: 'capacity', label: 'Capacidade' },
          { key: 'status', label: 'Status' }
        ]
      case 'obras':
        return [
          { key: 'name', label: 'Nome' },
          { key: 'clienteName', label: 'Cliente' },
          { key: 'status', label: 'Status' },
          { key: 'startDate', label: 'Data Início' },
          { key: 'budget', label: 'Orçamento' }
        ]
      case 'funcionarios':
        return [
          { key: 'nome', label: 'Nome' },
          { key: 'cargo', label: 'Cargo' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' }
        ]
      case 'clientes':
        return [
          { key: 'nome', label: 'Nome' },
          { key: 'cnpj', label: 'CNPJ' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'email', label: 'Email' },
          { key: 'cidade', label: 'Cidade' }
        ]
      default:
        return Object.keys(dados[0] || {}).map(key => ({ key, label: key }))
    }
  }

  const colunasExport = getColunasDefault()

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(18)
      doc.text(titulo || `Relatório de ${tipo}`, 14, 22)
      
      // Data de geração
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
      
      // Filtros aplicados
      if (filtros && Object.keys(filtros).length > 0) {
        doc.setFontSize(9)
        let y = 36
        Object.entries(filtros).forEach(([key, value]) => {
          if (value) {
            doc.text(`${key}: ${value}`, 14, y)
            y += 5
          }
        })
      }

      // Preparar dados para a tabela
      const headers = colunasExport.map(col => col.label)
      const rows = dados.map(item => 
        colunasExport.map(col => {
          const valor = item[col.key]
          if (valor === null || valor === undefined) return '-'
          if (typeof valor === 'number') {
            // Formatar números
            if (col.key.includes('valor') || col.key.includes('preco') || col.key.includes('budget')) {
              return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
            return valor.toString()
          }
          if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
          if (col.key.includes('data') || col.key.includes('Date')) {
            try {
              return new Date(valor).toLocaleDateString('pt-BR')
            } catch {
              return valor
            }
          }
          return valor.toString()
        })
      )

      // Adicionar tabela
      ;(doc as any).autoTable({
        startY: filtros ? 50 : 40,
        head: [headers],
        body: rows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      })

      // Salvar
      const nomeCompleto = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nomeCompleto)

      toast({
        title: "PDF exportado com sucesso!",
        description: `Arquivo ${nomeCompleto} foi baixado.`,
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o arquivo.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      // Preparar dados
      const dadosFormatados = dados.map(item => {
        const linha: any = {}
        colunasExport.forEach(col => {
          const valor = item[col.key]
          if (valor === null || valor === undefined) {
            linha[col.label] = '-'
          } else if (typeof valor === 'number') {
            if (col.key.includes('valor') || col.key.includes('preco') || col.key.includes('budget')) {
              linha[col.label] = valor
            } else {
              linha[col.label] = valor
            }
          } else if (typeof valor === 'boolean') {
            linha[col.label] = valor ? 'Sim' : 'Não'
          } else if (col.key.includes('data') || col.key.includes('Date')) {
            try {
              linha[col.label] = new Date(valor).toLocaleDateString('pt-BR')
            } catch {
              linha[col.label] = valor
            }
          } else {
            linha[col.label] = valor
          }
        })
        return linha
      })

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dadosFormatados)

      // Ajustar largura das colunas
      const colWidths = colunasExport.map(col => ({ wch: Math.max(col.label.length, 15) }))
      ws['!cols'] = colWidths

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, tipo)

      // Salvar arquivo
      const nomeCompleto = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, nomeCompleto)

      toast({
        title: "Excel exportado com sucesso!",
        description: `Arquivo ${nomeCompleto} foi baixado.`,
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast({
        title: "Erro ao exportar Excel",
        description: "Ocorreu um erro ao gerar o arquivo.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      // Preparar cabeçalhos
      const headers = colunasExport.map(col => col.label).join(';')
      
      // Preparar linhas
      const rows = dados.map(item => 
        colunasExport.map(col => {
          const valor = item[col.key]
          if (valor === null || valor === undefined) return '-'
          if (typeof valor === 'number') {
            if (col.key.includes('valor') || col.key.includes('preco') || col.key.includes('budget')) {
              return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
            return valor.toString()
          }
          if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
          if (col.key.includes('data') || col.key.includes('Date')) {
            try {
              return new Date(valor).toLocaleDateString('pt-BR')
            } catch {
              return valor
            }
          }
          // Escapar ponto e vírgula
          const valorStr = valor.toString().replace(/;/g, ',')
          return valorStr
        }).join(';')
      ).join('\n')

      // Criar arquivo CSV
      const csv = `${headers}\n${rows}`
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const nomeCompleto = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.csv`
      link.download = nomeCompleto
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "CSV exportado com sucesso!",
        description: `Arquivo ${nomeCompleto} foi baixado.`,
      })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast({
        title: "Erro ao exportar CSV",
        description: "Ocorreu um erro ao gerar o arquivo.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (dados.length === 0) {
    return (
      <Button variant="outline" className={className} disabled>
        <Download className="w-4 h-4 mr-2" />
        Sem dados para exportar
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
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
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
