"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator,
  Download,
  Package,
  DollarSign,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type TipoPrecificacao = 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
type Unidade = 'm' | 'h' | 'unidade' | 'dia' | 'mes'
type StatusItem = 'rascunho' | 'solicitado' | 'aprovado' | 'pedido' | 'entregue' | 'faturado'

interface ComplementoItem {
  id: string
  nome: string
  sku?: string
  tipo_precificacao: TipoPrecificacao
  unidade: Unidade
  preco_unitario_centavos: number
  quantidade: number
  fator?: number
  descricao?: string
  inicio_cobranca?: string
  fim_cobranca?: string
  meses_cobranca?: number
  taxavel: boolean
  aliquota: number
  desconto_percentual: number
  depends_on_item_id?: string
  rule_key?: string
  status: StatusItem
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
  incluido: boolean
  condicoes_locacao?: string
}

interface TotaisComplementos {
  mensal: number
  unico: number
  variavel_estimado: number
  total_contrato: number
  meses_locacao: number
}

interface GruaComplementosManagerProps {
  gruaObraId?: string
  obraId?: number
  gruaId?: string
  dataInicioLocacao?: string
  dataFimLocacao?: string
  mesesLocacao?: number
  onComplementosChange?: (complementos: ComplementoItem[], totais: TotaisComplementos) => void
  readOnly?: boolean
}

const CATALOGO_COMPLEMENTOS = [
  // Acessórios/Produtos
  { sku: 'ACESS-001', nome: 'Garfo Paleteiro', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 50000, descricao: 'Garfo para movimentação de paletes' },
  { sku: 'ACESS-002', nome: 'Balde de Concreto', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 30000, descricao: 'Balde para transporte de concreto' },
  { sku: 'ACESS-003', nome: 'Caçamba de Entulho', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 40000, descricao: 'Caçamba para descarte de entulho' },
  { sku: 'ACESS-004', nome: 'Plataforma de Descarga', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 60000, descricao: 'Plataforma para descarga de materiais nos pavimentos' },
  { sku: 'ACESS-005', nome: 'Estaiamentos', tipo_precificacao: 'por_metro' as TipoPrecificacao, unidade: 'm' as Unidade, preco_unitario_centavos: 65000, fator: 650, descricao: 'Estaiamentos para fixação lateral da grua', rule_key: 'estaiamento_por_altura' },
  { sku: 'ACESS-006', nome: 'Chumbadores/Base de Fundação', tipo_precificacao: 'unico' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 150000, descricao: 'Peças de ancoragem concretadas no bloco da grua' },
  { sku: 'ACESS-007', nome: 'Auto-transformador (Energia)', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 80000, descricao: 'Adequação elétrica 220/380V', rule_key: 'autotrafo_se_sem_380v' },
  { sku: 'ACESS-008', nome: 'Plano de Rigging / ART de Engenheiro', tipo_precificacao: 'unico' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 500000, descricao: 'Projeto técnico e responsabilidade civil' },
  { sku: 'ACESS-012', nome: 'Seguro RC / Roubo', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 120000, descricao: 'Seguro de responsabilidade civil e riscos' },
  
  // Serviços
  { sku: 'SERV-001', nome: 'Serviço de Montagem', tipo_precificacao: 'por_hora' as TipoPrecificacao, unidade: 'h' as Unidade, preco_unitario_centavos: 15000, descricao: 'Mão de obra para montagem e fixação da grua' },
  { sku: 'SERV-002', nome: 'Serviço de Desmontagem', tipo_precificacao: 'por_hora' as TipoPrecificacao, unidade: 'h' as Unidade, preco_unitario_centavos: 15000, descricao: 'Mão de obra para desmontagem da grua' },
  { sku: 'SERV-003', nome: 'Ascensão da Torre', tipo_precificacao: 'por_metro' as TipoPrecificacao, unidade: 'm' as Unidade, preco_unitario_centavos: 65000, fator: 650, descricao: 'Serviço de elevação da torre conforme a obra cresce' },
  { sku: 'SERV-004', nome: 'Transporte de Ida e Retorno', tipo_precificacao: 'unico' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 300000, descricao: 'Transporte da grua até a obra e retorno ao depósito' },
  { sku: 'SERV-005', nome: 'Serviço de Operador', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 800000, descricao: 'Locação mensal de operador de grua' },
  { sku: 'SERV-006', nome: 'Serviço de Sinaleiro', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 600000, descricao: 'Locação mensal de sinaleiro' },
  { sku: 'SERV-007', nome: 'Serviço de Manutenção Preventiva', tipo_precificacao: 'mensal' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 200000, descricao: 'Manutenção preventiva mensal da grua' },
  { sku: 'SERV-008', nome: 'Serviço de Manutenção Corretiva', tipo_precificacao: 'por_hora' as TipoPrecificacao, unidade: 'h' as Unidade, preco_unitario_centavos: 20000, descricao: 'Serviço de manutenção corretiva (cobrado por hora)' },
  { sku: 'SERV-009', nome: 'Serviço de Técnico de Segurança', tipo_precificacao: 'por_dia' as TipoPrecificacao, unidade: 'dia' as Unidade, preco_unitario_centavos: 50000, descricao: 'Serviço de técnico de segurança (NR-18)' },
  { sku: 'SERV-010', nome: 'Consultoria Técnica', tipo_precificacao: 'por_hora' as TipoPrecificacao, unidade: 'h' as Unidade, preco_unitario_centavos: 25000, descricao: 'Consultoria técnica especializada' },
  { sku: 'SERV-011', nome: 'Treinamento de Operadores', tipo_precificacao: 'unico' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 150000, descricao: 'Treinamento e capacitação de operadores' },
  { sku: 'SERV-012', nome: 'Inspeção Técnica', tipo_precificacao: 'unico' as TipoPrecificacao, unidade: 'unidade' as Unidade, preco_unitario_centavos: 80000, descricao: 'Inspeção técnica periódica da grua' }
]

export default function GruaComplementosManager({
  gruaObraId,
  obraId,
  gruaId,
  dataInicioLocacao,
  dataFimLocacao,
  mesesLocacao = 12,
  onComplementosChange,
  readOnly = false
}: GruaComplementosManagerProps) {
  const { toast } = useToast()
  
  const [complementos, setComplementos] = useState<ComplementoItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ComplementoItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState<Partial<ComplementoItem>>({
    nome: '',
    sku: '',
    tipo_precificacao: 'mensal',
    unidade: 'unidade',
    preco_unitario_centavos: 0,
    quantidade: 1,
    fator: undefined,
    descricao: '',
    inicio_cobranca: dataInicioLocacao,
    fim_cobranca: dataFimLocacao,
    meses_cobranca: mesesLocacao,
    taxavel: true,
    aliquota: 0,
    desconto_percentual: 0,
    depends_on_item_id: undefined,
    rule_key: undefined,
    status: 'rascunho',
    incluido: true,
    condicoes_locacao: ''
  })

  useEffect(() => {
    const mockComplementos: ComplementoItem[] = [
      {
        id: '1',
        nome: 'Garfo Paleteiro',
        sku: 'ACESS-001',
        tipo_precificacao: 'mensal',
        unidade: 'unidade',
        preco_unitario_centavos: 50000,
        quantidade: 1,
        descricao: 'Garfo para movimentação de paletes',
        inicio_cobranca: dataInicioLocacao,
        meses_cobranca: mesesLocacao,
        taxavel: true,
        aliquota: 18,
        desconto_percentual: 0,
        status: 'rascunho',
        incluido: true
      },
      {
        id: '2',
        nome: 'Estaiamentos',
        sku: 'ACESS-005',
        tipo_precificacao: 'por_metro',
        unidade: 'm',
        preco_unitario_centavos: 65000,
        quantidade: 30,
        fator: 650,
        descricao: 'Estaiamentos para fixação lateral',
        inicio_cobranca: dataInicioLocacao,
        taxavel: true,
        aliquota: 18,
        desconto_percentual: 0,
        status: 'rascunho',
        rule_key: 'estaiamento_por_altura',
        incluido: true
      },
      {
        id: '3',
        nome: 'Chumbadores/Base de Fundação',
        sku: 'ACESS-006',
        tipo_precificacao: 'unico',
        unidade: 'unidade',
        preco_unitario_centavos: 150000,
        quantidade: 1,
        descricao: 'Peças de ancoragem concretadas',
        inicio_cobranca: dataInicioLocacao,
        taxavel: true,
        aliquota: 18,
        desconto_percentual: 0,
        status: 'aprovado',
        incluido: true
      }
    ]
    setComplementos(mockComplementos)
  }, [dataInicioLocacao, mesesLocacao])

  const totais = useMemo((): TotaisComplementos => {
    const incluidos = complementos.filter(c => c.incluido)
    
    let mensal = 0
    let unico = 0
    let variavel_estimado = 0
    
    incluidos.forEach(item => {
      const precoUnitario = item.preco_unitario_centavos / 100
      const quantidade = item.quantidade
      let valorBase = precoUnitario * quantidade
      
      if (item.fator && item.tipo_precificacao === 'por_metro') {
        valorBase = item.fator * quantidade
      }
      
      const valorComDesconto = valorBase * (1 - item.desconto_percentual / 100)
      
      const valorFinal = item.taxavel 
        ? valorComDesconto * (1 + item.aliquota / 100)
        : valorComDesconto
      
      switch (item.tipo_precificacao) {
        case 'mensal':
          mensal += valorFinal
          break
        case 'unico':
          unico += valorFinal
          break
        case 'por_metro':
        case 'por_hora':
        case 'por_dia':
          variavel_estimado += valorFinal
          break
      }
    })
    
    const total_contrato = (mensal * mesesLocacao) + unico + variavel_estimado
    
    return {
      mensal,
      unico,
      variavel_estimado,
      total_contrato,
      meses_locacao: mesesLocacao
    }
  }, [complementos, mesesLocacao])

  useEffect(() => {
    if (onComplementosChange) {
      onComplementosChange(complementos, totais)
    }
  }, [complementos, totais, onComplementosChange])

  useEffect(() => {
    if (!isAddDialogOpen) {
      setSearchTerm('')
    }
  }, [isAddDialogOpen])

  const handleAddFromCatalogo = (itemCatalogo: typeof CATALOGO_COMPLEMENTOS[0]) => {
    const novoItem: ComplementoItem = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nome: itemCatalogo.nome,
      sku: itemCatalogo.sku,
      tipo_precificacao: itemCatalogo.tipo_precificacao,
      unidade: itemCatalogo.unidade,
      preco_unitario_centavos: itemCatalogo.preco_unitario_centavos,
      quantidade: 1,
      fator: itemCatalogo.fator,
      descricao: itemCatalogo.descricao,
      inicio_cobranca: dataInicioLocacao || new Date().toISOString().split('T')[0],
      meses_cobranca: mesesLocacao,
      taxavel: true,
      aliquota: 18,
      desconto_percentual: 0,
      depends_on_item_id: undefined,
      rule_key: itemCatalogo.rule_key,
      status: 'rascunho',
      incluido: true,
      created_at: new Date().toISOString()
    }
    
    setComplementos([...complementos, novoItem])
    setIsAddDialogOpen(false)
    toast({
      title: "Sucesso",
      description: `${novoItem.nome} adicionado aos complementos`,
    })
  }

  const handleAddCustom = () => {
    if (!formData.nome || !formData.tipo_precificacao || !formData.unidade) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    const novoItem: ComplementoItem = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nome: formData.nome!,
      sku: formData.sku,
      tipo_precificacao: formData.tipo_precificacao!,
      unidade: formData.unidade!,
      preco_unitario_centavos: Math.round((formData.preco_unitario_centavos || 0) * 100),
      quantidade: formData.quantidade || 1,
      fator: formData.fator,
      descricao: formData.descricao,
      inicio_cobranca: formData.inicio_cobranca || dataInicioLocacao,
      fim_cobranca: formData.fim_cobranca,
      meses_cobranca: formData.meses_cobranca || mesesLocacao,
      taxavel: formData.taxavel ?? true,
      aliquota: formData.aliquota || 0,
      desconto_percentual: formData.desconto_percentual || 0,
      depends_on_item_id: formData.depends_on_item_id,
      rule_key: formData.rule_key,
      status: formData.status || 'rascunho',
      incluido: formData.incluido ?? true,
      condicoes_locacao: formData.condicoes_locacao,
      created_at: new Date().toISOString()
    }

    setComplementos([...complementos, novoItem])
    resetForm()
    setIsAddDialogOpen(false)
    toast({
      title: "Sucesso",
      description: "Complemento adicionado",
    })
  }

  const handleEdit = (item: ComplementoItem) => {
    if (item.status === 'faturado') {
      toast({
        title: "Atenção",
        description: "Não é possível editar itens já faturados",
        variant: "destructive"
      })
      return
    }

    setEditingItem(item)
    setFormData({
      nome: item.nome,
      sku: item.sku,
      tipo_precificacao: item.tipo_precificacao,
      unidade: item.unidade,
      preco_unitario_centavos: item.preco_unitario_centavos / 100,
      quantidade: item.quantidade,
      fator: item.fator,
      descricao: item.descricao,
      inicio_cobranca: item.inicio_cobranca,
      fim_cobranca: item.fim_cobranca,
      meses_cobranca: item.meses_cobranca,
      taxavel: item.taxavel,
      aliquota: item.aliquota,
      desconto_percentual: item.desconto_percentual,
      depends_on_item_id: item.depends_on_item_id,
      rule_key: item.rule_key,
      status: item.status,
      incluido: item.incluido,
      condicoes_locacao: item.condicoes_locacao
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingItem || !formData.nome) return

    const updated: ComplementoItem = {
      ...editingItem,
      nome: formData.nome,
      sku: formData.sku,
      tipo_precificacao: formData.tipo_precificacao!,
      unidade: formData.unidade!,
      preco_unitario_centavos: Math.round((formData.preco_unitario_centavos || 0) * 100),
      quantidade: formData.quantidade || 1,
      fator: formData.fator,
      descricao: formData.descricao,
      inicio_cobranca: formData.inicio_cobranca,
      fim_cobranca: formData.fim_cobranca,
      meses_cobranca: formData.meses_cobranca,
      taxavel: formData.taxavel ?? true,
      aliquota: formData.aliquota || 0,
      desconto_percentual: formData.desconto_percentual || 0,
      depends_on_item_id: formData.depends_on_item_id,
      rule_key: formData.rule_key,
      status: formData.status || 'rascunho',
      incluido: formData.incluido ?? true,
      condicoes_locacao: formData.condicoes_locacao,
      updated_at: new Date().toISOString()
    }

    setComplementos(complementos.map(c => c.id === editingItem.id ? updated : c))
    resetForm()
    setIsEditDialogOpen(false)
    setEditingItem(null)
    toast({
      title: "Sucesso",
      description: "Complemento atualizado",
    })
  }

  const handleDelete = (id: string) => {
    const item = complementos.find(c => c.id === id)
    if (item?.status === 'faturado') {
      toast({
        title: "Atenção",
        description: "Não é possível excluir itens já faturados",
        variant: "destructive"
      })
      return
    }

    setComplementos(complementos.filter(c => c.id !== id))
    toast({
      title: "Sucesso",
      description: "Complemento removido",
    })
  }

  const handleToggleIncluido = (id: string) => {
    setComplementos(complementos.map(c => 
      c.id === id ? { ...c, incluido: !c.incluido } : c
    ))
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      sku: '',
      tipo_precificacao: 'mensal',
      unidade: 'unidade',
      preco_unitario_centavos: 0,
      quantidade: 1,
      fator: undefined,
      descricao: '',
      inicio_cobranca: dataInicioLocacao,
      fim_cobranca: dataFimLocacao,
      meses_cobranca: mesesLocacao,
      taxavel: true,
      aliquota: 0,
      desconto_percentual: 0,
      depends_on_item_id: undefined,
      rule_key: undefined,
      status: 'rascunho',
      incluido: true,
      condicoes_locacao: ''
    })
  }

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()
      
      // Adicionar logos no cabeçalho
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
      
      // Cabeçalho
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(
        gruaId ? 'Complementos da Grua' : 'Complementos de Obra',
        14,
        yPos
      )
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Informações da obra/grua
      yPos += 2
      if (obraId) {
        doc.text(`Obra ID: ${obraId}`, 14, yPos)
        yPos += 5
      }
      if (gruaId) {
        doc.text(`Grua ID: ${gruaId}`, 14, yPos)
        yPos += 5
      }
      if (dataInicioLocacao) {
        doc.text(
          `Período: ${new Date(dataInicioLocacao).toLocaleDateString('pt-BR')}`,
          14,
          yPos
        )
        yPos += 5
        if (dataFimLocacao) {
          doc.text(
            `até ${new Date(dataFimLocacao).toLocaleDateString('pt-BR')}`,
            14,
            yPos
          )
          yPos += 5
        }
      }
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        14,
        yPos
      )
      
      yPos += 10

      // Tabela de complementos
      const complementosIncluidos = complementos.filter(c => c.incluido)
      
      if (complementosIncluidos.length > 0) {
        const tableData = complementosIncluidos.map((item) => {
          const valorItem = calcularValorItem(item)
          return [
            item.nome || '-',
            item.sku || '-',
            getTipoPrecificacaoTexto(item.tipo_precificacao),
            `${item.quantidade} ${item.unidade}`,
            `R$ ${(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            item.taxavel ? `${item.aliquota}%` : 'Não',
            item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-',
            `R$ ${valorItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            getStatusTexto(item.status)
          ]
        })

        autoTable(doc, {
          head: [['Item', 'SKU', 'Tipo', 'Qtd', 'Preço Unit.', 'Imposto', 'Desconto', 'Valor Total', 'Status']],
          body: tableData,
          startY: yPos + 5,
          styles: { 
            fontSize: 7,
            cellPadding: 2
          },
          headStyles: { 
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245]
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 25 },
            8: { cellWidth: 20 }
          }
        })

        // Totais
        const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50
        let totalY = finalY + 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('RESUMO DE TOTAIS', 14, totalY)
        
        totalY += 8
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        doc.text(
          `Total Mensal (recorrente): R$ ${totais.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          14,
          totalY
        )
        totalY += 5
        
        doc.text(
          `Total Único: R$ ${totais.unico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          14,
          totalY
        )
        totalY += 5
        
        doc.text(
          `Total Variável (m/h): R$ ${totais.variavel_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          14,
          totalY
        )
        totalY += 5
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(
          `TOTAL DO CONTRATO: R$ ${totais.total_contrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          14,
          totalY
        )
        totalY += 5
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(
          `(Mensal × ${totais.meses_locacao} meses + Único + Variável)`,
          14,
          totalY
        )

        // Condições de locação (se houver)
        const itensComCondicoes = complementosIncluidos.filter(c => c.condicoes_locacao)
        if (itensComCondicoes.length > 0) {
          totalY += 10
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('CONDIÇÕES DE LOCAÇÃO', 14, totalY)
          totalY += 5
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          
          itensComCondicoes.forEach(item => {
            const lines = doc.splitTextToSize(
              `${item.nome}: ${item.condicoes_locacao}`,
              doc.internal.pageSize.width - 28
            )
            lines.forEach((line: string) => {
              if (totalY > doc.internal.pageSize.height - 30) {
                doc.addPage()
                totalY = 20
              }
              doc.text(line, 14, totalY)
              totalY += 4
            })
            totalY += 2
          })
        }
      } else {
        doc.setFontSize(10)
        doc.text('Nenhum complemento incluído', 14, yPos + 10)
      }

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      // Adicionar numeração de páginas
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 5,
          { align: 'center' }
        )
      }

      // Salvar PDF
      const nomeArquivo = `complementos-${gruaId ? `grua-${gruaId}` : `obra-${obraId || 'geral'}`}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nomeArquivo)

      toast({
        title: "PDF gerado com sucesso!",
        description: `Arquivo ${nomeArquivo} baixado`,
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  // Funções auxiliares para o PDF
  const getTipoPrecificacaoTexto = (tipo: TipoPrecificacao): string => {
    const labels = {
      mensal: 'Mensal',
      unico: 'Único',
      por_metro: 'Por Metro',
      por_hora: 'Por Hora',
      por_dia: 'Por Dia'
    }
    return labels[tipo] || tipo
  }

  const getStatusTexto = (status: StatusItem): string => {
    const labels = {
      rascunho: 'Rascunho',
      solicitado: 'Solicitado',
      aprovado: 'Aprovado',
      pedido: 'Pedido',
      entregue: 'Entregue',
      faturado: 'Faturado'
    }
    return labels[status] || status
  }

  const calcularValorItem = (item: ComplementoItem): number => {
    const precoUnitario = item.preco_unitario_centavos / 100
    const quantidade = item.quantidade
    let valorBase = precoUnitario * quantidade
    
    if (item.fator && item.tipo_precificacao === 'por_metro') {
      valorBase = item.fator * quantidade
    }
    
    const valorComDesconto = valorBase * (1 - item.desconto_percentual / 100)
    
    const valorFinal = item.taxavel 
      ? valorComDesconto * (1 + item.aliquota / 100)
      : valorComDesconto
    
    return valorFinal
  }

  const getStatusBadge = (status: StatusItem) => {
    const configs = {
      rascunho: { label: 'Rascunho', variant: 'secondary' as const, icon: Edit },
      solicitado: { label: 'Solicitado', variant: 'default' as const, icon: Clock },
      aprovado: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle2 },
      pedido: { label: 'Pedido', variant: 'default' as const, icon: Package },
      entregue: { label: 'Entregue', variant: 'default' as const, icon: CheckCircle2 },
      faturado: { label: 'Faturado', variant: 'outline' as const, icon: DollarSign }
    }
    
    const config = configs[status] || configs.rascunho
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getTipoPrecificacaoChip = (tipo: TipoPrecificacao) => {
    const labels = {
      mensal: 'Mensal',
      unico: 'Único',
      por_metro: 'Por Metro',
      por_hora: 'Por Hora',
      por_dia: 'Por Dia'
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        {labels[tipo]}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {gruaId ? 'Complementos da Grua' : 'Complementos de Obra'}
          </h3>
          <p className="text-sm text-gray-600">
            {gruaId 
              ? 'Acessórios e serviços locados ou comprados para esta grua'
              : 'Acessórios e serviços locados ou comprados para a obra (sem grua específica)'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <Calculator className="w-4 h-4 mr-2" />
                Ver Impacto no Total
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Impacto no Total do Contrato</DrawerTitle>
                <DrawerDescription>
                  Breakdown detalhado dos valores
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Totais por Natureza</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Mensal (recorrente):</span>
                      <span className="font-semibold">R$ {totais.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Único:</span>
                      <span className="font-semibold">R$ {totais.unico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Variável (m/h):</span>
                      <span className="font-semibold">R$ {totais.variavel_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total do Contrato:</span>
                        <span>R$ {totais.total_contrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        (Mensal × {totais.meses_locacao} meses + Único + Variável)
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Itens Incluídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {complementos.filter(c => c.incluido).map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.nome} ({item.quantidade} {item.unidade})</span>
                          <span>R$ {calcularValorItem(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          
          {!readOnly && (
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {complementos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nenhum complemento (acessório ou serviço) adicionado</p>
            {!readOnly && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Complemento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {complementos.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
              <div className="flex items-center gap-3 py-2 w-full">
                <Checkbox
                  checked={item.incluido}
                  onCheckedChange={() => !readOnly && handleToggleIncluido(item.id)}
                  disabled={readOnly}
                  className="flex-shrink-0"
                />
                <AccordionTrigger className="hover:no-underline flex-1 text-left">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.nome}</span>
                        {getTipoPrecificacaoChip(item.tipo_precificacao)}
                        {getStatusBadge(item.status)}
                      </div>
                      {item.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="text-right flex-shrink-0 ml-auto pr-4 min-w-[140px]">
                  <div className="font-semibold text-base">
                    R$ {calcularValorItem(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.quantidade} {item.unidade} × R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Tipo de Precificação</Label>
                      <p className="font-medium">{getTipoPrecificacaoChip(item.tipo_precificacao)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Unidade</Label>
                      <p className="font-medium">{item.unidade}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Quantidade</Label>
                      <p className="font-medium">{item.quantidade}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Preço Unitário</Label>
                      <p className="font-medium">R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    {item.fator && (
                      <div>
                        <Label className="text-xs text-gray-500">Fator</Label>
                        <p className="font-medium">{item.fator} por {item.unidade}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500">Valor Total</Label>
                      <p className="font-medium text-lg">R$ {calcularValorItem(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    {item.inicio_cobranca && (
                      <div>
                        <Label className="text-xs text-gray-500">Início Cobrança</Label>
                        <p className="font-medium">{new Date(item.inicio_cobranca).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {item.meses_cobranca && (
                      <div>
                        <Label className="text-xs text-gray-500">Meses</Label>
                        <p className="font-medium">{item.meses_cobranca} meses</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500">Taxável</Label>
                      <p className="font-medium">{item.taxavel ? 'Sim' : 'Não'}</p>
                    </div>
                    {item.taxavel && (
                      <div>
                        <Label className="text-xs text-gray-500">Alíquota</Label>
                        <p className="font-medium">{item.aliquota}%</p>
                      </div>
                    )}
                    {item.desconto_percentual > 0 && (
                      <div>
                        <Label className="text-xs text-gray-500">Desconto</Label>
                        <p className="font-medium text-green-600">{item.desconto_percentual}%</p>
                      </div>
                    )}
                  </div>

                  {item.descricao && (
                    <div>
                      <Label className="text-xs text-gray-500">Descrição</Label>
                      <p className="text-sm">{item.descricao}</p>
                    </div>
                  )}

                  {item.condicoes_locacao && (
                    <div>
                      <Label className="text-xs text-gray-500">Condições de Locação</Label>
                      <p className="text-sm bg-blue-50 p-2 rounded">{item.condicoes_locacao}</p>
                    </div>
                  )}

                  {!readOnly && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={item.status === 'faturado'}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={item.status === 'faturado'}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {complementos.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Total do Complemento</p>
                <p className="text-xs text-blue-700">
                  {complementos.filter(c => c.incluido).length} item(s) incluído(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">
                  R$ {totais.total_contrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-700">
                  Mensal: R$ {totais.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {totais.meses_locacao} meses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Complemento</DialogTitle>
            <DialogDescription>
              Adicione um acessório ou serviço do catálogo ou crie um personalizado
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="catalogo" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="catalogo">Todos</TabsTrigger>
              <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="catalogo" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar por nome, SKU ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {CATALOGO_COMPLEMENTOS
                  .filter(item => {
                    const search = searchTerm.toLowerCase()
                    return !search || 
                      item.nome.toLowerCase().includes(search) ||
                      item.sku?.toLowerCase().includes(search) ||
                      item.descricao?.toLowerCase().includes(search)
                  })
                  .map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleAddFromCatalogo(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.nome}</h4>
                          {item.sku?.startsWith('SERV-') && (
                            <Badge variant="secondary" className="text-xs">
                              Serviço
                            </Badge>
                          )}
                        </div>
                        {item.sku && (
                          <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
                        )}
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                        )}
                        <div className="flex gap-2">
                          {getTipoPrecificacaoChip(item.tipo_precificacao)}
                          <Badge variant="outline" className="text-xs">
                            {item.unidade}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-semibold text-lg">
                          R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                {CATALOGO_COMPLEMENTOS.filter(item => {
                  const search = searchTerm.toLowerCase()
                  return !search || 
                    item.nome.toLowerCase().includes(search) ||
                    item.sku?.toLowerCase().includes(search) ||
                    item.descricao?.toLowerCase().includes(search)
                }).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhum item encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="acessorios" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar acessórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {CATALOGO_COMPLEMENTOS
                  .filter(item => item.sku?.startsWith('ACESS-'))
                  .filter(item => {
                    const search = searchTerm.toLowerCase()
                    return !search || 
                      item.nome.toLowerCase().includes(search) ||
                      item.sku?.toLowerCase().includes(search) ||
                      item.descricao?.toLowerCase().includes(search)
                  })
                  .map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleAddFromCatalogo(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{item.nome}</h4>
                        {item.sku && (
                          <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
                        )}
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                        )}
                        <div className="flex gap-2">
                          {getTipoPrecificacaoChip(item.tipo_precificacao)}
                          <Badge variant="outline" className="text-xs">
                            {item.unidade}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-semibold text-lg">
                          R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                {CATALOGO_COMPLEMENTOS
                  .filter(item => item.sku?.startsWith('ACESS-'))
                  .filter(item => {
                    const search = searchTerm.toLowerCase()
                    return !search || 
                      item.nome.toLowerCase().includes(search) ||
                      item.sku?.toLowerCase().includes(search) ||
                      item.descricao?.toLowerCase().includes(search)
                  }).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhum acessório encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="servicos" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {CATALOGO_COMPLEMENTOS
                  .filter(item => item.sku?.startsWith('SERV-'))
                  .filter(item => {
                    const search = searchTerm.toLowerCase()
                    return !search || 
                      item.nome.toLowerCase().includes(search) ||
                      item.sku?.toLowerCase().includes(search) ||
                      item.descricao?.toLowerCase().includes(search)
                  })
                  .map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-green-50 cursor-pointer transition-colors"
                      onClick={() => handleAddFromCatalogo(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.nome}</h4>
                          <Badge variant="secondary" className="text-xs">
                            Serviço
                          </Badge>
                        </div>
                        {item.sku && (
                          <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
                        )}
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                        )}
                        <div className="flex gap-2">
                          {getTipoPrecificacaoChip(item.tipo_precificacao)}
                          <Badge variant="outline" className="text-xs">
                            {item.unidade}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-semibold text-lg">
                          R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                {CATALOGO_COMPLEMENTOS
                  .filter(item => item.sku?.startsWith('SERV-'))
                  .filter(item => {
                    const search = searchTerm.toLowerCase()
                    return !search || 
                      item.nome.toLowerCase().includes(search) ||
                      item.sku?.toLowerCase().includes(search) ||
                      item.descricao?.toLowerCase().includes(search)
                  }).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhum serviço encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="personalizado" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Produto/Serviço *</Label>
                  <Input
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Plataforma de descarga ou Serviço de montagem"
                  />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: ACESS-013"
                  />
                </div>
                <div>
                  <Label>Tipo de Precificação *</Label>
                  <Select
                    value={formData.tipo_precificacao}
                    onValueChange={(value) => setFormData({ ...formData, tipo_precificacao: value as TipoPrecificacao })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal (Recorrente)</SelectItem>
                      <SelectItem value="unico">Único (Uma vez)</SelectItem>
                      <SelectItem value="por_metro">Por Metro</SelectItem>
                      <SelectItem value="por_hora">Por Hora</SelectItem>
                      <SelectItem value="por_dia">Por Dia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidade *</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(value) => setFormData({ ...formData, unidade: value as Unidade })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                      <SelectItem value="h">Hora (h)</SelectItem>
                      <SelectItem value="dia">Dia</SelectItem>
                      <SelectItem value="mes">Mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preço Unitário (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_unitario_centavos || ''}
                    onChange={(e) => setFormData({ ...formData, preco_unitario_centavos: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantidade || 1}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                  />
                </div>
                {(formData.tipo_precificacao === 'por_metro' || formData.tipo_precificacao === 'por_hora') && (
                  <div>
                    <Label>
                      Fator
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 inline ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ex: 650 para "650/m de ascensão"</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.fator || ''}
                      onChange={(e) => setFormData({ ...formData, fator: parseFloat(e.target.value) || undefined })}
                      placeholder="Ex: 650"
                    />
                  </div>
                )}
                {formData.tipo_precificacao === 'mensal' && (
                  <div>
                    <Label>Meses de Cobrança</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.meses_cobranca || mesesLocacao}
                      onChange={(e) => setFormData({ ...formData, meses_cobranca: parseInt(e.target.value) || mesesLocacao })}
                    />
                  </div>
                )}
                <div>
                  <Label>Início de Cobrança</Label>
                  <Input
                    type="date"
                    value={formData.inicio_cobranca || dataInicioLocacao || ''}
                    onChange={(e) => setFormData({ ...formData, inicio_cobranca: e.target.value })}
                  />
                </div>
                {formData.tipo_precificacao !== 'mensal' && (
                  <div>
                    <Label>Fim de Cobrança</Label>
                    <Input
                      type="date"
                      value={formData.fim_cobranca || ''}
                      onChange={(e) => setFormData({ ...formData, fim_cobranca: e.target.value })}
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao || ''}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Impostos e Descontos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.taxavel ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, taxavel: checked as boolean })}
                    />
                    <Label>Item Taxável</Label>
                  </div>
                  {formData.taxavel && (
                    <div>
                      <Label>Alíquota (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.aliquota || 0}
                        onChange={(e) => setFormData({ ...formData, aliquota: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.desconto_percentual || 0}
                      onChange={(e) => setFormData({ ...formData, desconto_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Condições de Locação</Label>
                <Textarea
                  value={formData.condicoes_locacao || ''}
                  onChange={(e) => setFormData({ ...formData, condicoes_locacao: e.target.value })}
                  placeholder="Especificar condições específicas de locação deste item..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCustom}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Complemento</DialogTitle>
            <DialogDescription>
              {editingItem?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de Precificação *</Label>
                <Select
                  value={formData.tipo_precificacao}
                  onValueChange={(value) => setFormData({ ...formData, tipo_precificacao: value as TipoPrecificacao })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal (Recorrente)</SelectItem>
                    <SelectItem value="unico">Único (Uma vez)</SelectItem>
                    <SelectItem value="por_metro">Por Metro</SelectItem>
                    <SelectItem value="por_hora">Por Hora</SelectItem>
                    <SelectItem value="por_dia">Por Dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade *</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => setFormData({ ...formData, unidade: value as Unidade })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="h">Hora (h)</SelectItem>
                    <SelectItem value="dia">Dia</SelectItem>
                    <SelectItem value="mes">Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço Unitário (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_unitario_centavos || ''}
                  onChange={(e) => setFormData({ ...formData, preco_unitario_centavos: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade || 1}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                />
              </div>
              {(formData.tipo_precificacao === 'por_metro' || formData.tipo_precificacao === 'por_hora') && (
                <div>
                  <Label>Fator</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.fator || ''}
                    onChange={(e) => setFormData({ ...formData, fator: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              )}
              {formData.tipo_precificacao === 'mensal' && (
                <div>
                  <Label>Meses de Cobrança</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.meses_cobranca || mesesLocacao}
                    onChange={(e) => setFormData({ ...formData, meses_cobranca: parseInt(e.target.value) || mesesLocacao })}
                  />
                </div>
              )}
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status || 'rascunho'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as StatusItem })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="solicitado">Solicitado</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="pedido">Pedido</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="faturado">Faturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.incluido ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, incluido: checked as boolean })}
                />
                <Label>Incluído no cálculo</Label>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Impostos e Descontos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.taxavel ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, taxavel: checked as boolean })}
                  />
                  <Label>Item Taxável</Label>
                </div>
                {formData.taxavel && (
                  <div>
                    <Label>Alíquota (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.aliquota || 0}
                      onChange={(e) => setFormData({ ...formData, aliquota: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.desconto_percentual || 0}
                    onChange={(e) => setFormData({ ...formData, desconto_percentual: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Condições de Locação</Label>
              <Textarea
                value={formData.condicoes_locacao || ''}
                onChange={(e) => setFormData({ ...formData, condicoes_locacao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
                setEditingItem(null)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
