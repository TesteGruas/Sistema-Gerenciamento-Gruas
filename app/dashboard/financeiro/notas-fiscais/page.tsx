"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Building2,
  Truck,
  Receipt,
  Download,
  Upload,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap
} from "lucide-react"
import { notasFiscaisApi, NotaFiscal, NotaFiscalCreate } from "@/lib/api-notas-fiscais"
import { clientesApi } from "@/lib/api-clientes"
import { fornecedoresApi } from "@/lib/api-fornecedores"
import { medicoesMensaisApi } from "@/lib/api-medicoes-mensais"
import { locacoesApi, Locacao as LocacaoFull } from "@/lib/api-locacoes"
import { gruasApi } from "@/lib/api-gruas"
import { apiCompras } from "@/lib/api-compras"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cliente {
  id: number
  nome: string
  cnpj?: string
}

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
}

interface Medicao {
  id: number
  numero: string
  periodo: string
}

interface Locacao {
  id: number
  numero: string
  equipamento_id?: string
  tipo_equipamento?: 'grua' | 'plataforma'
  status?: string
}

interface Compra {
  id: number
  numero_pedido: string
}

export default function NotasFiscaisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'saida' | 'entrada'>('saida')
  
  // Estados
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null)
  const [viewingNota, setViewingNota] = useState<NotaFiscal | null>(null)
  const [uploadingNota, setUploadingNota] = useState<NotaFiscal | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoNotaFilter, setTipoNotaFilter] = useState("all")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  
  // Dados para formulários
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [locacoes, setLocacoes] = useState<Locacao[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  
  // Formulário
  const [formData, setFormData] = useState<NotaFiscalCreate>({
    numero_nf: '',
    serie: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    valor_total: 0,
    tipo: 'saida',
    status: 'pendente',
    tipo_nota: 'nf_servico',
    observacoes: ''
  })

  // Itens da nota fiscal
  interface ImpostoDinamico {
    id: string
    nome: string
    tipo?: string
    tipo_calculo: 'porcentagem' | 'valor_fixo'
    base_calculo: number
    aliquota: number
    valor_fixo?: number
    valor_calculado: number
  }

  interface NotaFiscalItem {
    id?: number
    codigo_produto?: string
    descricao: string
    ncm_sh?: string
    cfop?: string
    unidade: string
    quantidade: number
    preco_unitario: number
    preco_total: number
    csosn?: string
    base_calculo_icms?: number
    percentual_icms?: number
    valor_icms?: number
    percentual_ipi?: number
    valor_ipi?: number
    // Impostos de serviços
    base_calculo_issqn?: number
    aliquota_issqn?: number
    valor_issqn?: number
    valor_inss?: number
    valor_cbs?: number
    valor_liquido?: number
    // Impostos dinâmicos
    impostos_dinamicos?: ImpostoDinamico[]
  }

  const [itens, setItens] = useState<NotaFiscalItem[]>([])
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isCreateFornecedorDialogOpen, setIsCreateFornecedorDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NotaFiscalItem | null>(null)
  const [itemFormData, setItemFormData] = useState<NotaFiscalItem>({
    descricao: '',
    unidade: 'UN',
    quantidade: 1,
    preco_unitario: 0,
    preco_total: 0,
    base_calculo_icms: 0,
    percentual_icms: 0,
    valor_icms: 0,
    percentual_ipi: 0,
    valor_ipi: 0,
    base_calculo_issqn: 0,
    aliquota_issqn: 0,
    valor_issqn: 0,
    valor_inss: 0,
    valor_cbs: 0,
    valor_liquido: 0,
    impostos_dinamicos: []
  })

  // Função para calcular impostos automaticamente
  const calcularImpostos = (item: NotaFiscalItem): NotaFiscalItem => {
    const novoItem = { ...item }
    
    // Calcular valor total
    novoItem.preco_total = novoItem.quantidade * novoItem.preco_unitario
    
    // Calcular ICMS se base e percentual estiverem preenchidos
    if (novoItem.base_calculo_icms && novoItem.percentual_icms) {
      novoItem.valor_icms = (novoItem.base_calculo_icms * novoItem.percentual_icms) / 100
    } else if (novoItem.percentual_icms && novoItem.preco_total) {
      // Se não tiver base, usar o valor total como base
      novoItem.base_calculo_icms = novoItem.preco_total
      novoItem.valor_icms = (novoItem.preco_total * novoItem.percentual_icms) / 100
    }
    
    // Calcular IPI se percentual estiver preenchido
    if (novoItem.percentual_ipi && novoItem.preco_total) {
      novoItem.valor_ipi = (novoItem.preco_total * novoItem.percentual_ipi) / 100
    }
    
    // Calcular ISSQN se base e alíquota estiverem preenchidos
    if (novoItem.base_calculo_issqn && novoItem.aliquota_issqn) {
      novoItem.valor_issqn = (novoItem.base_calculo_issqn * novoItem.aliquota_issqn) / 100
    } else if (novoItem.aliquota_issqn && novoItem.preco_total) {
      // Se não tiver base, usar o valor total como base
      novoItem.base_calculo_issqn = novoItem.preco_total
      novoItem.valor_issqn = (novoItem.preco_total * novoItem.aliquota_issqn) / 100
    }
    
    // Calcular impostos dinâmicos
    if (novoItem.impostos_dinamicos && novoItem.impostos_dinamicos.length > 0) {
      novoItem.impostos_dinamicos = novoItem.impostos_dinamicos.map(imposto => {
        let valorCalculado = 0
        if (imposto.tipo_calculo === 'valor_fixo') {
          // Se for valor fixo, usar o valor_fixo diretamente
          valorCalculado = imposto.valor_fixo || 0
        } else {
          // Se for porcentagem, calcular normalmente
          const baseCalculo = imposto.base_calculo > 0 ? imposto.base_calculo : novoItem.preco_total
          valorCalculado = (baseCalculo * imposto.aliquota) / 100
        }
        return {
          ...imposto,
          base_calculo: imposto.base_calculo > 0 ? imposto.base_calculo : novoItem.preco_total,
          valor_calculado: valorCalculado
        }
      })
    }
    
    // Calcular valor líquido (valor total - todos os impostos)
    const totalImpostosFixos = (novoItem.valor_icms || 0) + 
                               (novoItem.valor_ipi || 0) + 
                               (novoItem.valor_issqn || 0) + 
                               (novoItem.valor_inss || 0) + 
                               (novoItem.valor_cbs || 0)
    
    const totalImpostosDinamicos = novoItem.impostos_dinamicos?.reduce((sum, imp) => sum + (imp.valor_calculado || 0), 0) || 0
    
    novoItem.valor_liquido = novoItem.preco_total - totalImpostosFixos - totalImpostosDinamicos
    
    return novoItem
  }

  // Funções para gerenciar impostos dinâmicos
  const adicionarImpostoDinamico = () => {
    const novoImposto: ImpostoDinamico = {
      id: Date.now().toString(),
      nome: '',
      tipo: '',
      tipo_calculo: 'porcentagem',
      base_calculo: itemFormData.preco_total || 0,
      aliquota: 0,
      valor_fixo: 0,
      valor_calculado: 0
    }
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: [...impostosAtuais, novoImposto]
    })
    setItemFormData(itemAtualizado)
  }

  const removerImpostoDinamico = (id: string) => {
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: impostosAtuais.filter(imp => imp.id !== id)
    })
    setItemFormData(itemAtualizado)
  }

  const atualizarImpostoDinamico = (id: string, campo: keyof ImpostoDinamico, valor: any) => {
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const impostosAtualizados = impostosAtuais.map(imp => {
      if (imp.id === id) {
        return { ...imp, [campo]: valor }
      }
      return imp
    })
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: impostosAtualizados
    })
    setItemFormData(itemAtualizado)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarNotasFiscais()
  }, [activeTab, currentPage, statusFilter, searchTerm])

  // Estado para armazenar informações da grua carregada
  const [gruaInfo, setGruaInfo] = useState<{id: string, modelo?: string, fabricante?: string} | null>(null)

  // Buscar grua automaticamente quando tipo for locação e cliente for selecionado
  useEffect(() => {
    const buscarGruaAutomatica = async () => {
      if (
        formData.tipo_nota === 'nf_locacao' && 
        formData.cliente_id && 
        activeTab === 'saida'
      ) {
        try {
          // Buscar locações ativas do cliente
          const response = await locacoesApi.list({
            cliente_id: formData.cliente_id,
            status: 'ativa',
            limit: 10
          })

          // A resposta pode vir em response.data ou response.data.data
          const locacoesData = response.data?.data || response.data || []
          
          if (locacoesData.length > 0) {
            // Pegar a primeira locação ativa
            const locacaoAtiva = locacoesData[0]
            
            // Atualizar o campo locacao_id (para relacionamento no backend)
            setFormData(prev => ({
              ...prev,
              locacao_id: locacaoAtiva.id
            }))

            // Se a locação tiver equipamento_id (grua), buscar informações da grua
            if (locacaoAtiva.equipamento_id && locacaoAtiva.tipo_equipamento === 'grua') {
              try {
                const gruaResponse = await gruasApi.obterGrua(locacaoAtiva.equipamento_id)
                
                if (gruaResponse.success && gruaResponse.data) {
                  setGruaInfo({
                    id: locacaoAtiva.equipamento_id,
                    modelo: gruaResponse.data.modelo || gruaResponse.data.model,
                    fabricante: gruaResponse.data.fabricante
                  })

                  toast({
                    title: "Grua encontrada",
                    description: `Grua ${gruaResponse.data.modelo || gruaResponse.data.model || locacaoAtiva.equipamento_id} carregada automaticamente da locação ${locacaoAtiva.numero}`,
                  })
                }
              } catch (gruaError) {
                console.error('Erro ao buscar informações da grua:', gruaError)
                // Mesmo sem buscar detalhes, armazenar o ID
                setGruaInfo({
                  id: locacaoAtiva.equipamento_id
                })
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar grua automática:', error)
        }
      } else {
        // Limpar informações da grua quando não for mais locação
        setGruaInfo(null)
      }
    }

    buscarGruaAutomatica()
  }, [formData.tipo_nota, formData.cliente_id, activeTab, toast])

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesResponse = await clientesApi.listarClientes({ limit: 1000 })
      if (clientesResponse.success) {
        setClientes(clientesResponse.data || [])
      }
      
      // Carregar fornecedores
      const fornecedoresResponse = await fornecedoresApi.list({ limit: 1000 })
      const fornecedoresData = fornecedoresResponse.fornecedores || []
      setFornecedores(fornecedoresData.map((f: any) => ({
        id: typeof f.id === 'string' ? parseInt(f.id) : f.id,
        nome: f.nome,
        cnpj: f.cnpj
      })))
      
      // Carregar medições
      try {
        const medicoesResponse = await medicoesMensaisApi.listar({ limit: 1000 })
        console.log('Resposta completa da API de medições:', medicoesResponse)
        
        if (medicoesResponse && medicoesResponse.success) {
          // A resposta pode ter data diretamente ou dentro de data.data
          const medicoesData = Array.isArray(medicoesResponse.data) 
            ? medicoesResponse.data 
            : (medicoesResponse.data?.data || [])
          
          console.log('Medições processadas:', medicoesData.length, 'medições encontradas')
          setMedicoes(medicoesData)
        } else {
          console.warn('Resposta da API não indica sucesso:', medicoesResponse)
          setMedicoes([])
        }
      } catch (error: any) {
        console.error('Erro ao carregar medições:', error)
        toast({
          title: "Aviso",
          description: "Não foi possível carregar as medições. Verifique se há medições cadastradas.",
          variant: "default"
        })
        setMedicoes([])
      }
      
      // Carregar locações
      const locacoesResponse = await locacoesApi.list({ limit: 1000 })
      if (locacoesResponse.success) {
        setLocacoes(locacoesResponse.data || [])
      } else if (locacoesResponse.data) {
        setLocacoes(locacoesResponse.data || [])
      }
      
      // Carregar compras
      const comprasResponse = await apiCompras.listar({ limit: 1000 })
      if (comprasResponse.success) {
        setCompras(comprasResponse.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const carregarNotasFiscais = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notasFiscaisApi.list({
        tipo: activeTab,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      })
      
      if (response.success) {
        setNotasFiscais(response.data || [])
        
        // Atualizar informações de paginação se a API retornar
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1)
          setTotalItems(response.pagination.total || 0)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar notas fiscais",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, statusFilter, searchTerm, toast])

  // Função helper para limpar dados antes de enviar (converter strings vazias para null)
  const limparDadosNotaFiscal = (data: any) => {
    const dadosLimpos: any = {}
    
    // Processar cada campo
    Object.keys(data).forEach(key => {
      const value = data[key]
      
      // Se for string vazia, tratar conforme o tipo de campo
      if (value === '') {
        // Campos de data vazios devem ser null
        if (key.includes('data') || key.includes('vencimento') || key.includes('emissao')) {
          dadosLimpos[key] = null
        }
        // Campos opcionais de texto vazios podem ser omitidos ou null
        else if (key.includes('observacoes') || key.includes('descricao') || key.includes('serie')) {
          dadosLimpos[key] = null
        }
        // Outros campos opcionais são omitidos
        // (não adicionar ao objeto)
      }
      // Se for null ou undefined, manter como está
      else if (value === null || value === undefined) {
        dadosLimpos[key] = value
      }
      // Caso contrário, incluir o valor
      else {
        dadosLimpos[key] = value
      }
    })
    
    return dadosLimpos
  }

  const handleCreate = async () => {
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.numero_nf || !formData.numero_nf.trim()) {
      camposFaltando.push('Número da Nota Fiscal')
    }

    if (!formData.data_emissao || !formData.data_emissao.trim()) {
      camposFaltando.push('Data de Emissão')
    }

    if (!formData.valor_total || formData.valor_total <= 0) {
      camposFaltando.push('Valor Total (R$)')
    }

    if (activeTab === 'saida' && !formData.cliente_id) {
      camposFaltando.push('Cliente')
    }

    if (activeTab === 'entrada' && !formData.fornecedor_id) {
      camposFaltando.push('Fornecedor')
    }

    if (!formData.tipo_nota || !formData.tipo_nota.trim()) {
      camposFaltando.push('Tipo de Nota')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      return
    }

    try {

      // Limpar dados antes de enviar
      const dadosLimpos = limparDadosNotaFiscal({
        ...formData,
        tipo: activeTab
      })

      const response = await notasFiscaisApi.create(dadosLimpos)
      
      if (response.success && response.data?.id) {
        const notaId = response.data.id

        // Salvar itens se houver
        if (itens.length > 0) {
          try {
            for (const item of itens) {
              // Limpar dados do item antes de enviar
              const itemLimpo = limparDadosNotaFiscal({
                ...item,
                nota_fiscal_id: notaId
              })
              await notasFiscaisApi.adicionarItem(notaId, itemLimpo)
            }
          } catch (itensError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao salvar os itens: " + (itensError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        }

        // Se houver arquivo, fazer upload após criar
        if (formFile) {
          try {
            await notasFiscaisApi.uploadFile(notaId, formFile)
            toast({
              title: "Sucesso",
              description: "Nota fiscal criada, itens salvos e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: itens.length > 0 ? "Nota fiscal criada e itens salvos com sucesso" : "Nota fiscal criada com sucesso"
          })
        }
        setIsCreateDialogOpen(false)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingNota) return
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.numero_nf || !formData.numero_nf.trim()) {
      camposFaltando.push('Número da Nota Fiscal')
    }

    if (!formData.data_emissao || !formData.data_emissao.trim()) {
      camposFaltando.push('Data de Emissão')
    }

    if (!formData.valor_total || formData.valor_total <= 0) {
      camposFaltando.push('Valor Total (R$)')
    }

    if (formData.tipo === 'saida' && !formData.cliente_id) {
      camposFaltando.push('Cliente')
    }

    if (formData.tipo === 'entrada' && !formData.fornecedor_id) {
      camposFaltando.push('Fornecedor')
    }

    if (!formData.tipo_nota || !formData.tipo_nota.trim()) {
      camposFaltando.push('Tipo de Nota')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      return
    }

    try {

      // Limpar dados antes de enviar
      const dadosLimpos = limparDadosNotaFiscal(formData)

      const response = await notasFiscaisApi.update(editingNota.id, dadosLimpos)
      
      if (response.success) {
        // Atualizar itens
        try {
          // Buscar itens existentes
          const itensExistentesResponse = await notasFiscaisApi.listarItens(editingNota.id)
          const itensExistentes = itensExistentesResponse.success ? itensExistentesResponse.data || [] : []
          const itensExistentesIds = itensExistentes.map((item: any) => item.id)
          const itensNovosIds = itens.filter(item => item.id).map(item => item.id!)

          // Deletar itens removidos
          for (const itemExistente of itensExistentes) {
            if (!itensNovosIds.includes(itemExistente.id)) {
              await notasFiscaisApi.deletarItem(itemExistente.id)
            }
          }

          // Adicionar ou atualizar itens
          for (const item of itens) {
            // Limpar dados do item antes de enviar
            const itemLimpo = limparDadosNotaFiscal({
              ...item,
              nota_fiscal_id: editingNota.id
            })
            
            if (item.id) {
              // Atualizar item existente
              await notasFiscaisApi.atualizarItem(item.id, itemLimpo)
            } else {
              // Adicionar novo item
              await notasFiscaisApi.adicionarItem(editingNota.id, itemLimpo)
            }
          }
        } catch (itensError: any) {
          console.error('Erro ao atualizar itens:', itensError)
          toast({
            title: "Aviso",
            description: "Nota fiscal atualizada, mas houve erro ao atualizar os itens: " + (itensError.message || "Erro desconhecido"),
            variant: "destructive"
          })
        }

        // Se houver arquivo, fazer upload após atualizar
        if (formFile) {
          try {
            await notasFiscaisApi.uploadFile(editingNota.id, formFile)
            toast({
              title: "Sucesso",
              description: "Nota fiscal atualizada e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal atualizada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: itens.length > 0 ? "Nota fiscal e itens atualizados com sucesso" : "Nota fiscal atualizada com sucesso"
          })
        }
        setIsEditDialogOpen(false)
        setEditingNota(null)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await notasFiscaisApi.delete(id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Nota fiscal excluída com sucesso"
        })
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (nota: NotaFiscal) => {
    setEditingNota(nota)
    setFormData({
      numero_nf: nota.numero_nf,
      serie: nota.serie || '',
      data_emissao: nota.data_emissao,
      data_vencimento: nota.data_vencimento || '',
      valor_total: nota.valor_total,
      tipo: nota.tipo,
      status: nota.status,
      cliente_id: nota.cliente_id,
      fornecedor_id: nota.fornecedor_id,
      medicao_id: nota.medicao_id,
      locacao_id: nota.locacao_id,
      compra_id: nota.compra_id,
      tipo_nota: nota.tipo_nota,
      observacoes: nota.observacoes || ''
    })
    
    // Carregar itens da nota fiscal
    try {
      const itensResponse = await notasFiscaisApi.listarItens(nota.id)
      if (itensResponse.success && itensResponse.data) {
        setItens(itensResponse.data.map((item: any) => {
          // Parse impostos dinâmicos se existirem
          let impostosDinamicos: ImpostoDinamico[] = []
          if (item.impostos_dinamicos) {
            try {
              if (typeof item.impostos_dinamicos === 'string') {
                impostosDinamicos = JSON.parse(item.impostos_dinamicos)
              } else if (Array.isArray(item.impostos_dinamicos)) {
                impostosDinamicos = item.impostos_dinamicos
              }
            } catch (e) {
              console.error('Erro ao fazer parse de impostos_dinamicos:', e)
              impostosDinamicos = []
            }
          }
          
          return {
            id: item.id,
            codigo_produto: item.codigo_produto,
            descricao: item.descricao,
            ncm_sh: item.ncm_sh,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: parseFloat(item.quantidade),
            preco_unitario: parseFloat(item.preco_unitario),
            preco_total: parseFloat(item.preco_total),
            csosn: item.csosn,
            base_calculo_icms: item.base_calculo_icms ? parseFloat(item.base_calculo_icms) : undefined,
            percentual_icms: item.percentual_icms ? parseFloat(item.percentual_icms) : undefined,
            valor_icms: item.valor_icms ? parseFloat(item.valor_icms) : undefined,
            percentual_ipi: item.percentual_ipi ? parseFloat(item.percentual_ipi) : undefined,
            valor_ipi: item.valor_ipi ? parseFloat(item.valor_ipi) : undefined,
            base_calculo_issqn: item.base_calculo_issqn ? parseFloat(item.base_calculo_issqn) : undefined,
            aliquota_issqn: item.aliquota_issqn ? parseFloat(item.aliquota_issqn) : undefined,
            valor_issqn: item.valor_issqn ? parseFloat(item.valor_issqn) : undefined,
            valor_inss: item.valor_inss ? parseFloat(item.valor_inss) : undefined,
            valor_cbs: item.valor_cbs ? parseFloat(item.valor_cbs) : undefined,
            valor_liquido: item.valor_liquido ? parseFloat(item.valor_liquido) : undefined,
            impostos_dinamicos: impostosDinamicos
          }
        }))
        
        // Recalcular valor total da nota fiscal baseado nos itens
        const totalItens = itensResponse.data.reduce((sum: number, item: any) => {
          return sum + parseFloat(item.preco_total || 0)
        }, 0)
        setFormData(prev => ({ ...prev, valor_total: totalItens }))
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      setItens([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleView = (nota: NotaFiscal) => {
    setViewingNota(nota)
    setIsViewDialogOpen(true)
  }

  const handleUpload = (nota: NotaFiscal) => {
    setUploadingNota(nota)
    setUploadFile(null)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async () => {
    if (!uploadingNota || !uploadFile) return

    try {
      setUploading(true)
      const response = await notasFiscaisApi.uploadFile(uploadingNota.id, uploadFile)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso"
        })
        setIsUploadDialogOpen(false)
        setUploadingNota(null)
        setUploadFile(null)
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (nota: NotaFiscal) => {
    if (!nota.arquivo_nf) {
      toast({
        title: "Aviso",
        description: "Arquivo não disponível",
        variant: "destructive"
      })
      return
    }

    try {
      // Abrir arquivo em nova aba
      window.open(nota.arquivo_nf, '_blank')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer download do arquivo",
        variant: "destructive"
      })
    }
  }

  const handleImportXML = async () => {
    if (!importFile) return

    try {
      setImporting(true)
      const response = await notasFiscaisApi.importarXML(importFile)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: response.message || "Nota fiscal importada com sucesso",
        })
        
        // Mostrar avisos se houver
        if (response.avisos && response.avisos.length > 0) {
          response.avisos.forEach((aviso: string) => {
            toast({
              title: "Aviso",
              description: aviso,
              variant: "default"
            })
          })
        }
        
        setIsImportDialogOpen(false)
        setImportFile(null)
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao importar XML",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      numero_nf: '',
      serie: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: '',
      valor_total: 0,
      tipo: activeTab,
      status: 'pendente',
      tipo_nota: activeTab === 'saida' ? 'nf_locacao' : 'nf_servico',
      observacoes: ''
    })
    setFormFile(null)
    setItens([])
    setGruaInfo(null)
  }

  // Função para preencher dados de teste do item
  const preencherDadosItemTeste = () => {
    const precoUnitario = 1000
    const quantidade = 1
    const precoTotal = precoUnitario * quantidade
    
    const itemTeste: NotaFiscalItem = {
      descricao: 'Serviço de Locação de Guindaste',
      unidade: 'MES',
      quantidade: quantidade,
      preco_unitario: precoUnitario,
      preco_total: precoTotal,
      codigo_produto: 'SRV001',
      ncm_sh: '8425.20.00',
      cfop: '5102',
      csosn: '101',
      base_calculo_icms: precoTotal,
      percentual_icms: 12,
      valor_icms: 0, // Será calculado
      percentual_ipi: 0,
      valor_ipi: 0,
      base_calculo_issqn: precoTotal,
      aliquota_issqn: 5,
      valor_issqn: 0, // Será calculado
      valor_inss: 0,
      valor_cbs: 0,
      valor_liquido: 0, // Será calculado
      impostos_dinamicos: []
    }
    
    // Calcular impostos usando a função calcularImpostos
    const itemCalculado = calcularImpostos(itemTeste)
    setItemFormData(itemCalculado)
    
    toast({
      title: "Dados de teste preenchidos",
      description: "Os campos do item foram preenchidos com dados de exemplo",
    })
  }

  // Função para preencher dados de teste
  const preencherDadosTeste = () => {
    const hoje = new Date()
    const vencimento = new Date(hoje)
    vencimento.setDate(vencimento.getDate() + 30) // 30 dias a partir de hoje
    
    // Calcular valores do item de teste
    const precoTotal = 10000
    const valorICMS = 1200
    const valorIPI = 0
    const valorISSQN = 500
    const valorINSS = 0
    const valorCBS = 0
    const totalImpostosFixos = valorICMS + valorIPI + valorISSQN + valorINSS + valorCBS
    const valorLiquido = precoTotal - totalImpostosFixos
    
    const dadosTeste: NotaFiscalCreate = {
      numero_nf: `NF${Date.now().toString().slice(-8)}`,
      serie: '001',
      data_emissao: hoje.toISOString().split('T')[0],
      data_vencimento: vencimento.toISOString().split('T')[0],
      valor_total: precoTotal,
      tipo: activeTab,
      status: 'pendente',
      tipo_nota: activeTab === 'saida' ? 'nf_locacao' : 'nf_servico',
      observacoes: 'Nota fiscal de teste - dados preenchidos automaticamente',
      cliente_id: activeTab === 'saida' && clientes.length > 0 ? clientes[0].id : undefined,
      fornecedor_id: activeTab === 'entrada' && fornecedores.length > 0 ? fornecedores[0].id : undefined
    }
    
    setFormData(dadosTeste)
    
    // Adicionar um item de teste com cálculo correto
    const itemTeste: NotaFiscalItem = {
      descricao: 'Serviço de Locação de Guindaste',
      unidade: 'MES',
      quantidade: 1,
      preco_unitario: precoTotal,
      preco_total: precoTotal,
      codigo_produto: 'SRV001',
      ncm_sh: '8425.20.00',
      cfop: '5102',
      csosn: '101',
      base_calculo_icms: precoTotal,
      percentual_icms: 12,
      valor_icms: valorICMS,
      percentual_ipi: 0,
      valor_ipi: valorIPI,
      base_calculo_issqn: precoTotal,
      aliquota_issqn: 5,
      valor_issqn: valorISSQN,
      valor_inss: valorINSS,
      valor_cbs: valorCBS,
      valor_liquido: valorLiquido,
      impostos_dinamicos: []
    }
    
    // Calcular impostos do item usando a função calcularImpostos
    const itemCalculado = calcularImpostos(itemTeste)
    setItens([itemCalculado])
    
    // Atualizar valor total do formulário
    setFormData({ ...dadosTeste, valor_total: precoTotal })
    
    toast({
      title: "Dados de teste preenchidos",
      description: "Os campos foram preenchidos com dados de exemplo",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-'
      
      // Se já está no formato YYYY-MM-DD, parsear manualmente para evitar problemas de timezone
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        const [, ano, mes, dia] = match
        // Criar Date usando ano, mês e dia diretamente (mês é 0-indexed no JavaScript)
        const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        return format(date, "dd/MM/yyyy", { locale: ptBR })
      }
      
      // Se tem T (ISO format), parsear manualmente também
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0]
        const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
          const [, ano, mes, dia] = match
          const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
          return format(date, "dd/MM/yyyy", { locale: ptBR })
        }
      }
      
      // Fallback para formato padrão
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      paga: { label: "Paga", variant: "default" },
      vencida: { label: "Vencida", variant: "destructive" },
      cancelada: { label: "Cancelada", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getTipoNotaLabel = (tipo?: string) => {
    const tipos: Record<string, string> = {
      nf_servico: 'NFs (Serviço)',
      nf_locacao: 'NF Locação',
      fatura: 'Fatura',
      nfe_eletronica: 'NFe (Eletrônica)',
      // Compatibilidade com valores antigos
      locacao: 'NF Locação',
      circulacao_equipamentos: 'NFs (Serviço)',
      outros_equipamentos: 'NFs (Serviço)',
      medicao: 'NFs (Serviço)',
      fornecedor: 'NFs (Serviço)'
    }
    return tipos[tipo || ''] || tipo || '-'
  }

  // Filtrar notas fiscais
  const filteredNotas = useMemo(() => {
    let filtered = notasFiscais
    
    if (tipoNotaFilter !== 'all') {
      filtered = filtered.filter(nf => nf.tipo_nota === tipoNotaFilter)
    }
    
    return filtered
  }, [notasFiscais, tipoNotaFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas Fiscais</h1>
          <p className="text-gray-600">Gerenciamento de notas fiscais de entrada e saída</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar XML
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, tipo: 'saida' }))
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Saída
          </Button>
          <Button 
            onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, tipo: 'entrada' }))
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Entrada
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saida' | 'entrada')}>
        <TabsList>
          <TabsTrigger value="saida">Notas Fiscais de Saída</TabsTrigger>
          <TabsTrigger value="entrada">Notas Fiscais de Entrada</TabsTrigger>
        </TabsList>

        {/* Tab: Notas Fiscais de Saída */}
        <TabsContent value="saida" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Saída</CardTitle>
              <CardDescription>
                Notas de locações, circulação de equipamentos, outros equipamentos e medições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, série, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoNotaFilter} onValueChange={setTipoNotaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Nota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="nf_servico">NFs (Serviço)</SelectItem>
                      <SelectItem value="nf_locacao">NF Locação</SelectItem>
                      <SelectItem value="fatura">Fatura</SelectItem>
                      <SelectItem value="nfe_eletronica">NFe (Eletrônica)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregarNotasFiscais}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Série</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                          <TableCell>{nota.serie || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTipoNotaLabel(nota.tipo_nota)}</Badge>
                          </TableCell>
                          <TableCell>
                            {nota.clientes ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{nota.clientes.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nota.medicoes && (
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">Medição: {nota.medicoes.numero}</span>
                              </div>
                            )}
                            {nota.locacoes && (
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">Locação: {nota.locacoes.numero}</span>
                              </div>
                            )}
                            {!nota.medicoes && !nota.locacoes && (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell>
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(nota.valor_liquido ?? nota.valor_total)}
                          </TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {nota.arquivo_nf ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(nota)}
                                  title="Download do arquivo"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpload(nota)}
                                  title="Upload do arquivo"
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4 text-sm text-muted-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas Fiscais de Entrada */}
        <TabsContent value="entrada" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Entrada</CardTitle>
              <CardDescription>
                Notas fiscais de fornecedores de cada compra que a empresa faz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, série, fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregarNotasFiscais}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Série</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Compra</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                          <TableCell>{nota.serie || '-'}</TableCell>
                          <TableCell>
                            {nota.fornecedores ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{nota.fornecedores.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nota.compras ? (
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{nota.compras.numero_pedido}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(nota.valor_liquido ?? nota.valor_total)}
                          </TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {nota.arquivo_nf ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(nota)}
                                  title="Download do arquivo"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpload(nota)}
                                  title="Upload do arquivo"
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4 text-sm text-muted-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setEditingNota(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle>
                  {isEditDialogOpen ? 'Editar Nota Fiscal' : activeTab === 'saida' ? 'Nova Nota Fiscal de Saída' : 'Nova Nota Fiscal de Entrada'}
                </DialogTitle>
                <DialogDescription>
                  {activeTab === 'saida' 
                    ? 'Preencha os dados da nota fiscal de saída (locação, circulação de equipamentos, outros equipamentos ou medição)'
                    : 'Preencha os dados da nota fiscal de entrada (fornecedor)'}
                </DialogDescription>
              </div>
              {!isEditDialogOpen && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={preencherDadosTeste}
                  className="ml-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
                  title="Preencher com dados de teste"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Preencher Dados
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_nf">Número da Nota Fiscal *</Label>
                <Input
                  id="numero_nf"
                  value={formData.numero_nf}
                  onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="serie">Série</Label>
                <Input
                  id="serie"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                />
              </div>
            </div>

            {activeTab === 'saida' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_nota">Tipo de Nota *</Label>
                    <Select 
                      value={formData.tipo_nota || 'nf_servico'} 
                      onValueChange={(value) => setFormData({ ...formData, tipo_nota: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nf_servico">NFs (Serviço)</SelectItem>
                        <SelectItem value="nf_locacao">NF Locação</SelectItem>
                        <SelectItem value="fatura">Fatura</SelectItem>
                        <SelectItem value="nfe_eletronica">NFe (Eletrônica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente_id">Cliente *</Label>
                    <Select 
                      value={formData.cliente_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, cliente_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.tipo_nota === 'nf_servico' || formData.tipo_nota === 'nf_locacao' || formData.tipo_nota === 'medicao' || formData.tipo_nota === 'locacao') && (
                  <div className="grid grid-cols-2 gap-4">
                    {(formData.tipo_nota === 'nf_servico' || formData.tipo_nota === 'medicao') && (
                      <div>
                        <Label htmlFor="medicao_id">Medição</Label>
                        <Select 
                          value={formData.medicao_id?.toString() || ''} 
                          onValueChange={(value) => setFormData({ ...formData, medicao_id: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={medicoes.length === 0 ? "Nenhuma medição disponível" : "Selecione a medição"} />
                          </SelectTrigger>
                          <SelectContent>
                            {medicoes.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Nenhuma medição disponível
                              </div>
                            ) : (
                              medicoes.map(medicao => (
                                <SelectItem key={medicao.id} value={medicao.id.toString()}>
                                  {medicao.numero} - {medicao.periodo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {medicoes.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Nenhuma medição encontrada. Crie uma medição primeiro.
                          </p>
                        )}
                      </div>
                    )}
                    {formData.tipo_nota === 'nf_locacao' && gruaInfo && (
                      <div>
                        <Label>Grua (Carregada Automaticamente)</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          <span className="font-medium">
                            {gruaInfo.modelo && gruaInfo.fabricante 
                              ? `${gruaInfo.fabricante} - ${gruaInfo.modelo}`
                              : gruaInfo.modelo 
                              ? gruaInfo.modelo
                              : `Grua ID: ${gruaInfo.id}`
                            }
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Grua carregada automaticamente da locação ativa do cliente
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'entrada' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateFornecedorDialogOpen(true)}
                      className="h-7 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Novo
                    </Button>
                  </div>
                  <Select 
                    value={formData.fornecedor_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, fornecedor_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(fornecedor => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compra_id">Compra</Label>
                  <Select 
                    value={formData.compra_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, compra_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {compras.map(compra => (
                        <SelectItem key={compra.id} value={compra.id.toString()}>
                          {compra.numero_pedido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_emissao">Data de Emissão *</Label>
                <Input
                  id="data_emissao"
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || 'pendente'} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Itens/Produtos/Serviços */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Itens da Nota Fiscal</Label>
                  <p className="text-sm text-muted-foreground">Adicione produtos ou serviços desta nota fiscal</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemFormData({
                      descricao: '',
                      unidade: 'UN',
                      quantidade: 1,
                      preco_unitario: 0,
                      preco_total: 0,
                      base_calculo_icms: 0,
                      percentual_icms: 0,
                      valor_icms: 0,
                      percentual_ipi: 0,
                      valor_ipi: 0,
                      base_calculo_issqn: 0,
                      aliquota_issqn: 0,
                      valor_issqn: 0,
                      valor_inss: 0,
                      valor_cbs: 0,
                      valor_liquido: 0
                    })
                    setEditingItem(null)
                    setIsItemDialogOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {itens.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[80px]">Unidade</TableHead>
                        <TableHead className="w-[100px]">Quantidade</TableHead>
                        <TableHead className="w-[120px]">Valor Unit.</TableHead>
                        <TableHead className="w-[120px]">Valor Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.descricao}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>{item.quantidade.toFixed(3)}</TableCell>
                          <TableCell>R$ {item.preco_unitario.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">R$ {item.preco_total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Parse impostos dinâmicos se vierem como string JSON
                                  const itemParaEditar = { ...item }
                                  if (itemParaEditar.impostos_dinamicos && typeof itemParaEditar.impostos_dinamicos === 'string') {
                                    try {
                                      itemParaEditar.impostos_dinamicos = JSON.parse(itemParaEditar.impostos_dinamicos as any)
                                    } catch (e) {
                                      itemParaEditar.impostos_dinamicos = []
                                    }
                                  } else if (!itemParaEditar.impostos_dinamicos) {
                                    itemParaEditar.impostos_dinamicos = []
                                  }
                                  const itemCalculado = calcularImpostos(itemParaEditar)
                                  setItemFormData(itemCalculado)
                                  setEditingItem(item)
                                  setIsItemDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const novosItens = itens.filter((_, i) => i !== index)
                                  setItens(novosItens)
                                  // Recalcular valor total automaticamente
                                  const novoTotal = novosItens.reduce((sum, item) => sum + item.preco_total, 0)
                                  setFormData({ ...formData, valor_total: novoTotal })
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-muted/50 space-y-2">
                    <div className="flex justify-end">
                      <div className="text-right space-y-1">
                        <div className="flex justify-between gap-8">
                          <span className="text-sm text-muted-foreground">Total dos Itens:</span>
                          <span className="text-sm font-medium">R$ {itens.reduce((sum, item) => sum + item.preco_total, 0).toFixed(2)}</span>
                        </div>
                        {(() => {
                          const totalImpostosFixos = itens.reduce((sum, item) => 
                            sum + (item.valor_icms || 0) + (item.valor_ipi || 0) + (item.valor_issqn || 0) + (item.valor_inss || 0) + (item.valor_cbs || 0), 0
                          )
                          const totalImpostosDinamicos = itens.reduce((sum, item) => {
                            if (item.impostos_dinamicos) {
                              const impostos = typeof item.impostos_dinamicos === 'string' 
                                ? JSON.parse(item.impostos_dinamicos) 
                                : item.impostos_dinamicos
                              return sum + (impostos.reduce((impSum: number, imp: any) => impSum + (imp.valor_calculado || 0), 0))
                            }
                            return sum
                          }, 0)
                          const totalImpostos = totalImpostosFixos + totalImpostosDinamicos
                          const totalLiquido = itens.reduce((sum, item) => sum + (item.valor_liquido || item.preco_total), 0)
                          
                          return (
                            <>
                              <div className="flex justify-between gap-8">
                                <span className="text-sm text-muted-foreground">Total de Impostos:</span>
                                <span className="text-sm font-medium text-red-600">R$ {totalImpostos.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between gap-8 border-t pt-1">
                                <span className="text-sm font-semibold">Valor Líquido:</span>
                                <span className="text-lg font-bold text-green-600">R$ {totalLiquido.toFixed(2)}</span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="arquivo_nf">Arquivo da Nota Fiscal (PDF ou XML)</Label>
              <Input
                id="arquivo_nf"
                type="file"
                accept=".pdf,.xml,.PDF,.XML"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Erro",
                        description: "Arquivo muito grande. Tamanho máximo: 10MB",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    // Validar tipo
                    const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                    const validExtensions = ['.pdf', '.xml']
                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                      toast({
                        title: "Erro",
                        description: "Tipo de arquivo inválido. Use PDF ou XML",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    setFormFile(file)
                  } else {
                    setFormFile(null)
                  }
                }}
              />
              {formFile && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo selecionado: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {isEditDialogOpen && editingNota?.arquivo_nf && !formFile && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo atual: {editingNota.nome_arquivo || 'Arquivo anexado'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setEditingNota(null)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdate : handleCreate}>
              {isEditDialogOpen ? 'Atualizar' : 'Criar'} Nota Fiscal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          {viewingNota && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número</Label>
                  <p className="text-lg font-semibold">{viewingNota.numero_nf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Série</Label>
                  <p className="text-lg">{viewingNota.serie || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-lg">{viewingNota.tipo === 'saida' ? 'Saída' : 'Entrada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo de Nota</Label>
                  <p className="text-lg">{getTipoNotaLabel(viewingNota.tipo_nota)}</p>
                </div>
              </div>

              {viewingNota.tipo === 'saida' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.clientes?.nome || '-'}
                  </p>
                  {viewingNota.clientes?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.clientes.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.tipo === 'entrada' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fornecedor</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.fornecedores?.nome || '-'}
                  </p>
                  {viewingNota.fornecedores?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.fornecedores.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.medicoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medição Vinculada</Label>
                  <p className="text-lg">
                    {viewingNota.medicoes.numero} - {viewingNota.medicoes.periodo}
                  </p>
                </div>
              )}

              {viewingNota.locacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Locação Vinculada</Label>
                  <p className="text-lg">{viewingNota.locacoes.numero}</p>
                </div>
              )}

              {viewingNota.compras && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Compra Vinculada</Label>
                  <p className="text-lg">{viewingNota.compras.numero_pedido}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                  <p className="text-lg">{formatDate(viewingNota.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="text-lg">{viewingNota.data_vencimento ? formatDate(viewingNota.data_vencimento) : '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(viewingNota.valor_total)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-2">{getStatusBadge(viewingNota.status)}</div>
              </div>

              {viewingNota.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{viewingNota.observacoes}</p>
                </div>
              )}

              {viewingNota.arquivo_nf && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Arquivo da Nota Fiscal</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{viewingNota.nome_arquivo || 'Arquivo anexado'}</span>
                    {viewingNota.tamanho_arquivo && (
                      <span className="text-xs text-gray-500">
                        ({(viewingNota.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(viewingNota)}
                      className="ml-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Envie o arquivo da nota fiscal (PDF ou XML)
            </DialogDescription>
          </DialogHeader>
          
          {uploadingNota && (
            <div className="space-y-4">
              <div>
                <Label>Nota Fiscal</Label>
                <p className="text-sm text-gray-600">
                  {uploadingNota.numero_nf} {uploadingNota.serie && `- Série ${uploadingNota.serie}`}
                </p>
              </div>
              
              <div>
                <Label htmlFor="arquivo">Arquivo (PDF ou XML) *</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.xml,.PDF,.XML"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Validar tamanho (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Erro",
                          description: "Arquivo muito grande. Tamanho máximo: 10MB",
                          variant: "destructive"
                        })
                        return
                      }
                      // Validar tipo
                      const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.xml')) {
                        toast({
                          title: "Erro",
                          description: "Tipo de arquivo inválido. Use PDF ou XML",
                          variant: "destructive"
                        })
                        return
                      }
                      setUploadFile(file)
                    }
                  }}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadingNota(null)
                setUploadFile(null)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importação XML */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Nota Fiscal (XML)</DialogTitle>
            <DialogDescription>
              Envie o arquivo XML da NFe para importar automaticamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="xml-file">Arquivo XML da NFe *</Label>
              <Input
                id="xml-file"
                type="file"
                accept=".xml,.XML"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Erro",
                        description: "Arquivo muito grande. Tamanho máximo: 10MB",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    // Validar tipo
                    if (!file.name.toLowerCase().endsWith('.xml')) {
                      toast({
                        title: "Erro",
                        description: "Arquivo deve ser um XML válido",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    setImportFile(file)
                  } else {
                    setImportFile(null)
                  }
                }}
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo selecionado: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Informações:</strong> O sistema irá extrair automaticamente os dados do XML e criar a nota fiscal. 
                Clientes e fornecedores serão vinculados automaticamente se encontrados pelo CNPJ.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportDialogOpen(false)
                setImportFile(null)
              }}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportXML}
              disabled={!importFile || importing}
            >
              {importing ? 'Importando...' : 'Importar XML'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Item da Nota Fiscal */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar Item'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto ou serviço
                </DialogDescription>
              </div>
              {!editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={preencherDadosItemTeste}
                  className="ml-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
                  title="Preencher com dados de teste"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Preencher Dados
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_codigo_produto">Código do Produto</Label>
                <Input
                  id="item_codigo_produto"
                  value={itemFormData.codigo_produto || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, codigo_produto: e.target.value })}
                  placeholder="Código interno ou CFOP"
                />
              </div>
              <div>
                <Label htmlFor="item_ncm_sh">NCM/SH</Label>
                <Input
                  id="item_ncm_sh"
                  value={itemFormData.ncm_sh || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, ncm_sh: e.target.value })}
                  placeholder="Ex: 8425.20.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="item_descricao">Descrição *</Label>
              <Textarea
                id="item_descricao"
                value={itemFormData.descricao}
                onChange={(e) => setItemFormData({ ...itemFormData, descricao: e.target.value })}
                rows={2}
                placeholder="Descrição completa do produto ou serviço"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="item_unidade">Unidade *</Label>
                <Select
                  value={itemFormData.unidade}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="M2">M²</SelectItem>
                    <SelectItem value="M3">M³</SelectItem>
                    <SelectItem value="LT">LT</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="CX">CX</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="DIA">DIA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item_quantidade">Quantidade *</Label>
                <Input
                  id="item_quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  value={itemFormData.quantidade}
                  onChange={(e) => {
                    const qtd = parseFloat(e.target.value) || 0
                    const itemAtualizado = calcularImpostos({ ...itemFormData, quantidade: qtd })
                    setItemFormData(itemAtualizado)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="item_preco_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="item_preco_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.preco_unitario}
                  onChange={(e) => {
                    const unit = parseFloat(e.target.value) || 0
                    const itemAtualizado = calcularImpostos({ ...itemFormData, preco_unitario: unit })
                    setItemFormData(itemAtualizado)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="item_preco_total">Valor Total (R$)</Label>
                <Input
                  id="item_preco_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.preco_total.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_cfop">CFOP</Label>
                <Input
                  id="item_cfop"
                  value={itemFormData.cfop || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, cfop: e.target.value })}
                  placeholder="Ex: 5102"
                />
              </div>
              <div>
                <Label htmlFor="item_csosn">CSOSN</Label>
                <Input
                  id="item_csosn"
                  value={itemFormData.csosn || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, csosn: e.target.value })}
                  placeholder="Ex: 101"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">Impostos de Produtos (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_base_calculo_icms">Base Cálculo ICMS (R$)</Label>
                  <Input
                    id="item_base_calculo_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.base_calculo_icms || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, base_calculo_icms: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_percentual_icms">% ICMS</Label>
                  <Input
                    id="item_percentual_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.percentual_icms || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, percentual_icms: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_icms">Valor ICMS (R$)</Label>
                  <Input
                    id="item_valor_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_icms?.toFixed(2) || '0.00'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="item_percentual_ipi">% IPI</Label>
                  <Input
                    id="item_percentual_ipi"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.percentual_ipi || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, percentual_ipi: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_ipi">Valor IPI (R$)</Label>
                  <Input
                    id="item_valor_ipi"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_ipi?.toFixed(2) || '0.00'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">Impostos de Serviços (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_base_calculo_issqn">Base Cálculo ISSQN (R$)</Label>
                  <Input
                    id="item_base_calculo_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.base_calculo_issqn || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, base_calculo_issqn: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                    placeholder="Geralmente igual ao valor do serviço"
                  />
                </div>
                <div>
                  <Label htmlFor="item_aliquota_issqn">Alíquota ISSQN (%)</Label>
                  <Input
                    id="item_aliquota_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.aliquota_issqn || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, aliquota_issqn: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                    placeholder="Ex: 5.00 para 5%"
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_issqn">Valor ISSQN (R$)</Label>
                  <Input
                    id="item_valor_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_issqn?.toFixed(2) || '0.00'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_inss">Valor INSS - Retenção (R$)</Label>
                  <Input
                    id="item_valor_inss"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_inss || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, valor_inss: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_cbs">Valor CBS (R$)</Label>
                  <Input
                    id="item_valor_cbs"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_cbs || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, valor_cbs: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_liquido">Valor Líquido (R$)</Label>
                  <Input
                    id="item_valor_liquido"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_liquido?.toFixed(2) || '0.00'}
                    readOnly
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Impostos Personalizados (Opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarImpostoDinamico}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Imposto
                </Button>
              </div>
              
              {itemFormData.impostos_dinamicos && itemFormData.impostos_dinamicos.length > 0 ? (
                <div className="space-y-3">
                  {itemFormData.impostos_dinamicos.map((imposto) => (
                    <div key={imposto.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Imposto: {imposto.nome || 'Sem nome'}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerImpostoDinamico(imposto.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`imposto_nome_${imposto.id}`} className="text-xs">Nome do Imposto *</Label>
                          <Input
                            id={`imposto_nome_${imposto.id}`}
                            value={imposto.nome}
                            onChange={(e) => atualizarImpostoDinamico(imposto.id, 'nome', e.target.value)}
                            placeholder="Ex: PIS, COFINS, IRPJ"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`imposto_tipo_${imposto.id}`} className="text-xs">Tipo (Opcional)</Label>
                          <Input
                            id={`imposto_tipo_${imposto.id}`}
                            value={imposto.tipo || ''}
                            onChange={(e) => atualizarImpostoDinamico(imposto.id, 'tipo', e.target.value)}
                            placeholder="Ex: Federal, Estadual"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`imposto_tipo_calculo_${imposto.id}`} className="text-xs">Tipo de Cálculo *</Label>
                          <Select
                            value={imposto.tipo_calculo || 'porcentagem'}
                            onValueChange={(value: 'porcentagem' | 'valor_fixo') => {
                              atualizarImpostoDinamico(imposto.id, 'tipo_calculo', value)
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                              <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {imposto.tipo_calculo === 'porcentagem' ? (
                          <>
                            <div>
                              <Label htmlFor={`imposto_base_${imposto.id}`} className="text-xs">Base de Cálculo (R$)</Label>
                              <Input
                                id={`imposto_base_${imposto.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={imposto.base_calculo || ''}
                                onChange={(e) => {
                                  const base = parseFloat(e.target.value) || 0
                                  atualizarImpostoDinamico(imposto.id, 'base_calculo', base)
                                }}
                                placeholder="0.00"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`imposto_aliquota_${imposto.id}`} className="text-xs">Alíquota (%)</Label>
                              <Input
                                id={`imposto_aliquota_${imposto.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={imposto.aliquota || ''}
                                onChange={(e) => {
                                  const aliquota = parseFloat(e.target.value) || 0
                                  atualizarImpostoDinamico(imposto.id, 'aliquota', aliquota)
                                }}
                                placeholder="0.00"
                                className="h-8 text-sm"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <Label htmlFor={`imposto_valor_fixo_${imposto.id}`} className="text-xs">Valor Fixo (R$)</Label>
                            <Input
                              id={`imposto_valor_fixo_${imposto.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={imposto.valor_fixo || ''}
                              onChange={(e) => {
                                const valorFixo = parseFloat(e.target.value) || 0
                                atualizarImpostoDinamico(imposto.id, 'valor_fixo', valorFixo)
                              }}
                              placeholder="0.00"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          <Label htmlFor={`imposto_valor_${imposto.id}`} className="text-xs">Valor Calculado (R$)</Label>
                          <Input
                            id={`imposto_valor_${imposto.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={imposto.valor_calculado?.toFixed(2) || '0.00'}
                            readOnly
                            className="h-8 text-sm bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum imposto personalizado adicionado. Clique em "Adicionar Imposto" para criar um novo.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsItemDialogOpen(false)
              setEditingItem(null)
              setItemFormData({
                descricao: '',
                unidade: 'UN',
                quantidade: 1,
                preco_unitario: 0,
                preco_total: 0,
                base_calculo_icms: 0,
                percentual_icms: 0,
                valor_icms: 0,
                percentual_ipi: 0,
                valor_ipi: 0,
                base_calculo_issqn: 0,
                aliquota_issqn: 0,
                valor_issqn: 0,
                valor_inss: 0,
                valor_cbs: 0,
                valor_liquido: 0,
                impostos_dinamicos: []
              })
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Validação de campos obrigatórios
              const camposFaltando: string[] = []

              if (!itemFormData.descricao || !itemFormData.descricao.trim()) {
                camposFaltando.push('Descrição')
              }

              if (!itemFormData.unidade || !itemFormData.unidade.trim()) {
                camposFaltando.push('Unidade')
              }

              if (!itemFormData.quantidade || itemFormData.quantidade <= 0) {
                camposFaltando.push('Quantidade')
              }

              if (!itemFormData.preco_unitario || itemFormData.preco_unitario <= 0) {
                camposFaltando.push('Valor Unitário (R$)')
              }

              if (camposFaltando.length > 0) {
                const mensagemErro = camposFaltando.length === 1 
                  ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
                  : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
                toast({
                  title: "Campos obrigatórios não preenchidos",
                  description: mensagemErro,
                  variant: "destructive",
                  duration: 10000,
                })
                return
              }

              // Garantir que os impostos estão calculados
              const itemCalculado = calcularImpostos(itemFormData)

              if (editingItem) {
                // Editar item existente
                const index = itens.findIndex(item => item.id === editingItem.id || item === editingItem)
                const novosItens = [...itens]
                novosItens[index] = itemCalculado
                setItens(novosItens)
              } else {
                // Adicionar novo item
                setItens([...itens, itemCalculado])
              }

              // Recalcular valor total da nota fiscal automaticamente
              const novosItens = editingItem 
                ? itens.map((item, i) => (item.id === editingItem.id || item === editingItem) ? itemCalculado : item)
                : [...itens, itemCalculado]
              const novoTotal = novosItens.reduce((sum, item) => sum + item.preco_total, 0)
              setFormData({ ...formData, valor_total: novoTotal })

              setIsItemDialogOpen(false)
              setEditingItem(null)
              setItemFormData({
                descricao: '',
                unidade: 'UN',
                quantidade: 1,
                preco_unitario: 0,
                preco_total: 0,
                base_calculo_icms: 0,
                percentual_icms: 0,
                valor_icms: 0,
                percentual_ipi: 0,
                valor_ipi: 0,
                base_calculo_issqn: 0,
                aliquota_issqn: 0,
                valor_issqn: 0,
                valor_inss: 0,
                valor_cbs: 0,
                valor_liquido: 0,
                impostos_dinamicos: []
              })
            }}>
              {editingItem ? 'Atualizar' : 'Adicionar'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo fornecedor */}
      <CreateFornecedorDialog
        isOpen={isCreateFornecedorDialogOpen}
        onClose={() => setIsCreateFornecedorDialogOpen(false)}
        onSuccess={(novoFornecedor) => {
          // Adicionar o novo fornecedor à lista
          setFornecedores([...fornecedores, novoFornecedor])
          // Selecionar automaticamente o novo fornecedor
          setFormData({ ...formData, fornecedor_id: novoFornecedor.id })
          setIsCreateFornecedorDialogOpen(false)
          toast({
            title: "Sucesso",
            description: "Fornecedor cadastrado e selecionado!",
          })
        }}
      />
    </div>
  )
}

// Componente para criar novo fornecedor
function CreateFornecedorDialog({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: (fornecedor: Fornecedor) => void
}) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    categoria: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3')
      } else {
        return numbers.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3')
      }
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.nome || !formData.nome.trim()) {
      camposFaltando.push('Nome/Razão Social')
    }

    if (!formData.cnpj || !formData.cnpj.trim()) {
      camposFaltando.push('CNPJ')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      setIsSubmitting(false)
      return
    }

    try {

      // Criar fornecedor
      const novoFornecedor = await fornecedoresApi.create({
        nome: formData.nome,
        cnpj: formData.cnpj,
        contato: formData.contato || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        endereco: formData.endereco || undefined,
        cidade: formData.cidade || undefined,
        estado: formData.estado || undefined,
        cep: formData.cep || undefined,
        categoria: formData.categoria || undefined,
        observacoes: formData.observacoes || undefined,
        status: formData.status
      })

      // Limpar formulário
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        categoria: '',
        observacoes: '',
        status: 'ativo'
      })

      onSuccess(novoFornecedor)
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao criar fornecedor. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Cadastre um novo fornecedor no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome/Razão Social *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatarCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contato">Nome do Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="Nome da pessoa de contato"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: formatarCEP(e.target.value) })}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Material de construção, Equipamentos, etc."
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais sobre o fornecedor"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

