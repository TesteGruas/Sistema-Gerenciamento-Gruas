"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Building2,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Loader2,
  Save,
  FileText as FileTextIcon,
  Package,
  Trash2,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { clientesApi, converterClienteBackendParaFrontend } from "@/lib/api-clientes"
import { orcamentosLocacaoApi } from "@/lib/api-orcamentos-locacao"

// Funções de máscara de moeda
const formatCurrency = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100
  
  // Formata como moeda brasileira (sem símbolo R$)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Função para converter valor formatado para número
const parseCurrency = (value: string) => {
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleanValue) || 0
}

// Catálogo de complementos disponíveis
const CATALOGO_COMPLEMENTOS = [
  // Acessórios/Produtos
  { sku: 'ACESS-001', nome: 'Garfo Paleteiro', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 50000, descricao: 'Garfo para movimentação de paletes' },
  { sku: 'ACESS-002', nome: 'Balde de Concreto', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 30000, descricao: 'Balde para transporte de concreto' },
  { sku: 'ACESS-003', nome: 'Caçamba de Entulho', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 40000, descricao: 'Caçamba para descarte de entulho' },
  { sku: 'ACESS-004', nome: 'Plataforma de Descarga', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 60000, descricao: 'Plataforma para descarga de materiais nos pavimentos' },
  { sku: 'ACESS-005', nome: 'Estaiamentos', tipo_precificacao: 'por_metro' as const, unidade: 'm' as const, preco_unitario_centavos: 65000, fator: 650, descricao: 'Estaiamentos para fixação lateral da grua' },
  { sku: 'ACESS-006', nome: 'Chumbadores/Base de Fundação', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 150000, descricao: 'Peças de ancoragem concretadas no bloco da grua' },
  { sku: 'ACESS-007', nome: 'Auto-transformador (Energia)', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 80000, descricao: 'Adequação elétrica 220/380V' },
  { sku: 'ACESS-008', nome: 'Plano de Rigging / ART de Engenheiro', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 500000, descricao: 'Projeto técnico e responsabilidade civil' },
  { sku: 'ACESS-012', nome: 'Seguro RC / Roubo', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 120000, descricao: 'Seguro de responsabilidade civil e riscos' },
  
  // Serviços
  { sku: 'SERV-001', nome: 'Serviço de Montagem', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 15000, descricao: 'Mão de obra para montagem e fixação da grua' },
  { sku: 'SERV-002', nome: 'Serviço de Desmontagem', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 15000, descricao: 'Mão de obra para desmontagem da grua' },
  { sku: 'SERV-003', nome: 'Ascensão da Torre', tipo_precificacao: 'por_metro' as const, unidade: 'm' as const, preco_unitario_centavos: 65000, fator: 650, descricao: 'Serviço de elevação da torre conforme a obra cresce' },
  { sku: 'SERV-004', nome: 'Transporte de Ida e Retorno', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 300000, descricao: 'Transporte da grua até a obra e retorno ao depósito' },
  { sku: 'SERV-005', nome: 'Serviço de Operador', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 800000, descricao: 'Locação mensal de operador de grua' },
  { sku: 'SERV-006', nome: 'Serviço de Sinaleiro', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 600000, descricao: 'Locação mensal de sinaleiro' },
  { sku: 'SERV-007', nome: 'Serviço de Manutenção Preventiva', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 200000, descricao: 'Manutenção preventiva mensal da grua' },
  { sku: 'SERV-008', nome: 'Serviço de Manutenção Corretiva', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 20000, descricao: 'Serviço de manutenção corretiva (cobrado por hora)' },
  { sku: 'SERV-009', nome: 'Serviço de Técnico de Segurança', tipo_precificacao: 'por_dia' as const, unidade: 'dia' as const, preco_unitario_centavos: 50000, descricao: 'Serviço de técnico de segurança (NR-18)' },
  { sku: 'SERV-010', nome: 'Consultoria Técnica', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 25000, descricao: 'Consultoria técnica especializada' },
  { sku: 'SERV-011', nome: 'Treinamento de Operadores', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 150000, descricao: 'Treinamento e capacitação de operadores' },
  { sku: 'SERV-012', nome: 'Inspeção Técnica', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 80000, descricao: 'Inspeção técnica periódica da grua' }
]

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    // Identificação básica
    cliente_id: '',
    cliente_nome: '',
    obra_nome: '',
    obra_endereco: '',
    obra_cidade: '',
    obra_estado: '',
    tipo_obra: '',
    equipamento: '',
    
    // Especificações técnicas
    altura_inicial: '',
    altura_final: '',
    comprimento_lanca: '',
    carga_maxima: '',
    carga_ponta: '',
    potencia_eletrica: '',
    energia_necessaria: '',
    
    // Custos mensais
    valor_locacao_mensal: '',
    valor_operador: '',
    valor_sinaleiro: '',
    valor_manutencao: '',
    
    // Prazos e datas
    prazo_locacao_meses: '',
    data_inicio_estimada: '',
    tolerancia_dias: '15',
    
    // Escopo básico
    escopo_incluso: '',
    
    // Responsabilidades do cliente
    responsabilidades_cliente: '',
    
    // Condições comerciais
    condicoes_comerciais: '',
    
    // Observações
    observacoes: ''
  })

  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(null)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [isCreatingCliente, setIsCreatingCliente] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [complementosSelecionados, setComplementosSelecionados] = useState<any[]>([])
  const [searchComplemento, setSearchComplemento] = useState("")
  const [selectComplementoValue, setSelectComplementoValue] = useState("")
  const [clienteFormData, setClienteFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato: '',
    contato_email: '',
    contato_cpf: '',
    contato_telefone: '',
    status: 'ativo',
    criar_usuario: false,
    usuario_senha: ''
  })

  const calcularTotalMensal = () => {
    const locacao = parseCurrency(formData.valor_locacao_mensal) || 0
    const operador = parseCurrency(formData.valor_operador) || 0
    const sinaleiro = parseCurrency(formData.valor_sinaleiro) || 0
    const manutencao = parseCurrency(formData.valor_manutencao) || 0
    return locacao + operador + sinaleiro + manutencao
  }

  // Informações da empresa do hook (não precisa mais definir aqui)

  const handleSave = async (isDraft: boolean = false) => {
    try {
      setIsSaving(true)

      // Validações básicas
      if (!isDraft) {
        if (!formData.obra_nome || !formData.equipamento || !clienteSelecionado) {
          toast({
            title: "Erro",
            description: "Preencha os campos obrigatórios (Obra, Equipamento e Cliente)",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      } else {
        // Para rascunho, apenas cliente é obrigatório
        if (!clienteSelecionado && !formData.cliente_id) {
          toast({
            title: "Erro",
            description: "Selecione um cliente para salvar o rascunho",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      }

      // Converter valores monetários
      const valorLocacao = parseCurrency(formData.valor_locacao_mensal) || 0
      const valorOperador = parseCurrency(formData.valor_operador) || 0
      const valorSinaleiro = parseCurrency(formData.valor_sinaleiro) || 0
      const valorManutencao = parseCurrency(formData.valor_manutencao) || 0
      const totalMensal = valorLocacao + valorOperador + valorSinaleiro + valorManutencao

      // Gerar número do orçamento (formato: ORC-YYYYMMDD-XXX)
      const hoje = new Date()
      const numero = `ORC-${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

      // Preparar dados para a API
      const clienteId = clienteSelecionado?.id || formData.cliente_id
      if (!clienteId) {
        toast({
          title: "Erro",
          description: "Cliente é obrigatório",
          variant: "destructive"
        })
        setIsSaving(false)
        return
      }

      const prazoMeses = parseInt(formData.prazo_locacao_meses || '1')
      
      // Calcular valor total dos complementos
      let valorTotalComplementos = 0
      const itensComplementos = complementosSelecionados.map(complemento => {
        let valorItem = 0
        let quantidade = complemento.quantidade || 1
        
        // Calcular valor baseado no tipo de precificação
        if (complemento.tipo_precificacao === 'mensal') {
          valorItem = (complemento.preco_unitario_centavos / 100) * quantidade * prazoMeses
        } else if (complemento.tipo_precificacao === 'unico') {
          valorItem = (complemento.preco_unitario_centavos / 100) * quantidade
        } else {
          // Para por_metro, por_hora, por_dia - usar o valor_total já calculado
          valorItem = complemento.valor_total || (complemento.preco_unitario_centavos / 100) * quantidade
        }
        
        valorTotalComplementos += valorItem
        
        return {
          produto_servico: complemento.nome,
          descricao: complemento.descricao || `${complemento.nome} - ${complemento.sku || ''}`,
          quantidade: complemento.tipo_precificacao === 'mensal' ? quantidade * prazoMeses : quantidade,
          valor_unitario: complemento.preco_unitario_centavos / 100,
          valor_total: valorItem,
          tipo: complemento.sku?.startsWith('ACESS') ? 'equipamento' : 'servico',
          unidade: complemento.unidade || 'unidade',
          observacoes: complemento.descricao || ''
        }
      })
      
      const valorTotalOrcamento = (totalMensal * prazoMeses) + valorTotalComplementos
      
      const orcamentoData = {
        numero,
        cliente_id: parseInt(clienteId.toString()),
        data_orcamento: hoje.toISOString().split('T')[0],
        data_validade: formData.data_inicio_estimada 
          ? new Date(new Date(formData.data_inicio_estimada).getTime() + (prazoMeses * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          : new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        valor_total: valorTotalOrcamento,
        desconto: 0,
        status: isDraft ? 'rascunho' : 'enviado',
        tipo_orcamento: 'locacao_grua',
        condicoes_pagamento: formData.condicoes_comerciais || '',
        prazo_entrega: formData.prazo_locacao_meses ? `${formData.prazo_locacao_meses} meses` : '',
        observacoes: formData.observacoes || '',
        itens: [
          {
            produto_servico: 'Locação da Grua',
            descricao: formData.equipamento || 'Grua Torre',
            quantidade: prazoMeses,
            valor_unitario: valorLocacao,
            valor_total: valorLocacao * prazoMeses,
            tipo: 'equipamento',
            unidade: 'mês',
            observacoes: ''
          },
          {
            produto_servico: 'Operador',
            descricao: 'Serviço de operador de grua',
            quantidade: prazoMeses,
            valor_unitario: valorOperador,
            valor_total: valorOperador * prazoMeses,
            tipo: 'servico',
            unidade: 'mês',
            observacoes: ''
          },
          {
            produto_servico: 'Sinaleiro',
            descricao: 'Serviço de sinaleiro',
            quantidade: prazoMeses,
            valor_unitario: valorSinaleiro,
            valor_total: valorSinaleiro * prazoMeses,
            tipo: 'servico',
            unidade: 'mês',
            observacoes: ''
          },
          {
            produto_servico: 'Manutenção Preventiva',
            descricao: 'Manutenção preventiva do equipamento',
            quantidade: prazoMeses,
            valor_unitario: valorManutencao,
            valor_total: valorManutencao * prazoMeses,
            tipo: 'servico',
            unidade: 'mês',
            observacoes: ''
          },
          ...itensComplementos
        ]
      }

      const response = await orcamentosLocacaoApi.create(orcamentoData)

      if (response.success) {
        toast({
          title: "Sucesso",
          description: isDraft 
            ? "Orçamento salvo como rascunho com sucesso!" 
            : "Orçamento salvo e enviado com sucesso!",
        })
        
        // Redirecionar para a lista de orçamentos
        setTimeout(() => {
          router.push('/dashboard/orcamentos')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar orçamento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    setFormData({ ...formData, cliente_id: cliente.id.toString(), cliente_nome: cliente.name || cliente.nome })
  }

  const handleGruaSelect = (grua: any) => {
    setGruaSelecionada(grua)
    const equipamento = `${grua.tipo || 'Grua Torre'} / ${grua.fabricante} ${grua.modelo}`
    setFormData({ ...formData, equipamento })
  }

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsCreatingCliente(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...clienteFormData,
        cnpj: clienteFormData.cnpj.replace(/\D/g, ''),
        telefone: clienteFormData.telefone ? clienteFormData.telefone.replace(/\D/g, '') : '',
        cep: clienteFormData.cep ? clienteFormData.cep.replace(/\D/g, '') : '',
        contato_cpf: clienteFormData.contato_cpf ? clienteFormData.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: clienteFormData.contato_telefone ? clienteFormData.contato_telefone.replace(/\D/g, '') : '',
        criar_usuario: clienteFormData.criar_usuario || false,
        usuario_senha: clienteFormData.criar_usuario ? clienteFormData.usuario_senha : undefined
      }
      
      const response = await clientesApi.criarCliente(dadosFormatados)
      
      if (response.success && response.data) {
        // Converter o cliente criado para o formato esperado
        const novoCliente = converterClienteBackendParaFrontend(response.data)
        
        // Selecionar automaticamente o cliente criado
        handleClienteSelect(novoCliente)
        
        // Resetar formulário e fechar modal
        setClienteFormData({
          nome: '',
          email: '',
          telefone: '',
          cnpj: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          contato: '',
          contato_email: '',
          contato_cpf: '',
          contato_telefone: '',
          status: 'ativo',
          criar_usuario: false,
          usuario_senha: ''
        })
        setIsClienteModalOpen(false)
        
        toast({
          title: "Sucesso",
          description: "Cliente criado e selecionado com sucesso!",
        })
      }
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err)
      toast({
        title: "Erro",
        description: err.response?.data?.message || "Erro ao criar cliente. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingCliente(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Orçamento de Obra</h1>
            <p className="text-gray-600 mt-1">
              Preencha os dados essenciais do orçamento de locação
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileTextIcon className="w-4 h-4 mr-2" />
            )}
            Salvar como Rascunho
          </Button>
          <Button 
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="identificacao">
            <Building2 className="w-4 h-4 mr-2" />
            Identificação
          </TabsTrigger>
          <TabsTrigger value="tecnico">
            <Wrench className="w-4 h-4 mr-2" />
            Técnico
          </TabsTrigger>
          <TabsTrigger value="custos">
            <DollarSign className="w-4 h-4 mr-2" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="prazos">
            <Calendar className="w-4 h-4 mr-2" />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="condicoes">
            <FileText className="w-4 h-4 mr-2" />
            Condições
          </TabsTrigger>
          <TabsTrigger value="itens">
            <Package className="w-4 h-4 mr-2" />
            Itens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identificacao" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Identificação Básica</CardTitle>
              <CardDescription>
                Dados da empresa fornecedora, construtora e obra
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ClienteSearch
                        onClienteSelect={handleClienteSelect}
                        selectedCliente={clienteSelecionado}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsClienteModalOpen(true)}
                      className="flex-shrink-0"
                      title="Adicionar novo cliente"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Obra *</Label>
                  <Input
                    value={formData.obra_nome}
                    onChange={(e) => setFormData({ ...formData, obra_nome: e.target.value })}
                    placeholder="Ex: Residencial Jardim das Flores"
                  />
                </div>
                <div>
                  <Label>Tipo de Obra *</Label>
                  <Select
                    value={formData.tipo_obra}
                    onValueChange={(value) => setFormData({ ...formData, tipo_obra: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Endereço da Obra</Label>
                <Input
                  value={formData.obra_endereco}
                  onChange={(e) => setFormData({ ...formData, obra_endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.obra_cidade}
                    onChange={(e) => setFormData({ ...formData, obra_cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={formData.obra_estado}
                    onChange={(e) => setFormData({ ...formData, obra_estado: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnico" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Especificações Técnicas da Grua</CardTitle>
              <CardDescription>
                Dados técnicos essenciais do equipamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Altura Inicial (m)</Label>
                  <Input
                    type="number"
                    value={formData.altura_inicial}
                    onChange={(e) => setFormData({ ...formData, altura_inicial: e.target.value })}
                    placeholder="Ex: 21"
                  />
                </div>
                <div>
                  <Label>Altura Final Prevista (m)</Label>
                  <Input
                    type="number"
                    value={formData.altura_final}
                    onChange={(e) => setFormData({ ...formData, altura_final: e.target.value })}
                    placeholder="Ex: 95"
                  />
                </div>
                <div>
                  <Label>Comprimento da Lança (m)</Label>
                  <Input
                    type="number"
                    value={formData.comprimento_lanca}
                    onChange={(e) => setFormData({ ...formData, comprimento_lanca: e.target.value })}
                    placeholder="Ex: 30"
                  />
                </div>
                <div>
                  <Label>Carga Máxima (kg)</Label>
                  <Input
                    type="number"
                    value={formData.carga_maxima}
                    onChange={(e) => setFormData({ ...formData, carga_maxima: e.target.value })}
                    placeholder="Ex: 2000"
                  />
                </div>
                <div>
                  <Label>Carga na Ponta (kg)</Label>
                  <Input
                    type="number"
                    value={formData.carga_ponta}
                    onChange={(e) => setFormData({ ...formData, carga_ponta: e.target.value })}
                    placeholder="Ex: 1300"
                  />
                </div>
                <div>
                  <Label>Potência Elétrica</Label>
                  <Input
                    value={formData.potencia_eletrica}
                    onChange={(e) => setFormData({ ...formData, potencia_eletrica: e.target.value })}
                    placeholder="Ex: 42 KVA"
                  />
                </div>
                <div>
                  <Label>Energia Necessária</Label>
                  <Input
                    value={formData.energia_necessaria}
                    onChange={(e) => setFormData({ ...formData, energia_necessaria: e.target.value })}
                    placeholder="Ex: 380V"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos Mensais Principais</CardTitle>
              <CardDescription>
                Valores mensais básicos (locação, operador, sinaleiro e manutenção)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Locacao da grua (R$/mês) *</Label>
                  <Input
                    type="text"
                    value={formData.valor_locacao_mensal}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valor_locacao_mensal: formatted })
                    }}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Operador (R$/mês) *</Label>
                  <Input
                    type="text"
                    value={formData.valor_operador}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valor_operador: formatted })
                    }}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Sinaleiro (R$/mês) *</Label>
                  <Input
                    type="text"
                    value={formData.valor_sinaleiro}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valor_sinaleiro: formatted })
                    }}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Manutenção preventiva (R$/mês) *</Label>
                  <Input
                    type="text"
                    value={formData.valor_manutencao}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valor_manutencao: formatted })
                    }}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Mensal</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {calcularTotalMensal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Horas extras, ascensões, acessórios e transporte ficam no Complemento de Obra
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prazos e Datas</CardTitle>
              <CardDescription>
                Prazo de locação previsto e data de início estimada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prazo de Locação (meses) *</Label>
                  <Input
                    type="number"
                    value={formData.prazo_locacao_meses}
                    onChange={(e) => setFormData({ ...formData, prazo_locacao_meses: e.target.value })}
                    placeholder="Ex: 13"
                  />
                </div>
                <div>
                  <Label>Data de Início Estimada</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio_estimada}
                    onChange={(e) => setFormData({ ...formData, data_inicio_estimada: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tolerância (± dias)</Label>
                  <Input
                    type="number"
                    value={formData.tolerancia_dias}
                    onChange={(e) => setFormData({ ...formData, tolerancia_dias: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="condicoes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Escopo Básico Incluso</CardTitle>
              <CardDescription>
                O que está incluído no orçamento básico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.escopo_incluso}
                onChange={(e) => setFormData({ ...formData, escopo_incluso: e.target.value })}
                rows={5}
                placeholder="Ex: Operador e sinaleiro por turno (carga horária mensal definida). Manutenção em horário normal de trabalho. Treinamento, ART e documentação conforme NR-18."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsabilidades do Cliente</CardTitle>
              <CardDescription>
                O que o cliente deve fornecer/preparar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.responsabilidades_cliente}
                onChange={(e) => setFormData({ ...formData, responsabilidades_cliente: e.target.value })}
                rows={5}
                placeholder="Ex: Fornecer energia 380V no local. Disponibilizar sinaleiros para içamento. Acessos preparados para transporte e montagem. Cumprimento das normas NR-18 e infraestrutura para instalação."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições Comerciais</CardTitle>
              <CardDescription>
                Termos de pagamento e condições gerais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.condicoes_comerciais}
                onChange={(e) => setFormData({ ...formData, condicoes_comerciais: e.target.value })}
                rows={5}
                placeholder="Ex: Medição mensal e pagamento até dia 15. Valores isentos de impostos por serem locação. Multa em caso de cancelamento após mobilização (geralmente 2 meses de locação). Validade da proposta enquanto houver equipamento disponível."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações adicionais..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens" className="space-y-4 mt-4">
          {/* Seção de Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamento Ofertado</CardTitle>
              <CardDescription>
                Selecione o equipamento principal do orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Equipamento Ofertado *</Label>
                <GruaSearch
                  onGruaSelect={handleGruaSelect}
                  selectedGrua={gruaSelecionada}
                />
                {formData.equipamento && (
                  <Input
                    value={formData.equipamento}
                    onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                    className="mt-2"
                    placeholder="Ex: Grua Torre / XCMG QTZ40B"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Complementos */}
          <Card>
            <CardHeader>
              <CardTitle>Complementos do Orçamento</CardTitle>
              <CardDescription>
                Adicione complementos adicionais que podem ser atrelados a este orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca de complementos */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar complementos..."
                    value={searchComplemento}
                    onChange={(e) => setSearchComplemento(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectComplementoValue}
                  onValueChange={(value) => {
                    if (value && value !== '') {
                      const complemento = CATALOGO_COMPLEMENTOS.find(c => c.sku === value)
                      if (complemento && !complementosSelecionados.find(c => c.sku === complemento.sku)) {
                        setComplementosSelecionados([
                          ...complementosSelecionados,
                          {
                            ...complemento,
                            quantidade: 1,
                            valor_total: complemento.preco_unitario_centavos / 100
                          }
                        ])
                        setSearchComplemento("")
                        setSelectComplementoValue("")
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um complemento" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATALOGO_COMPLEMENTOS
                      .filter(c => 
                        !complementosSelecionados.find(sel => sel.sku === c.sku) &&
                        (searchComplemento === "" || 
                         c.nome.toLowerCase().includes(searchComplemento.toLowerCase()) ||
                         c.sku.toLowerCase().includes(searchComplemento.toLowerCase()))
                      )
                      .map((complemento) => (
                        <SelectItem key={complemento.sku} value={complemento.sku}>
                          {complemento.nome} - {complemento.sku}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de complementos selecionados */}
              {complementosSelecionados.length > 0 ? (
                <div className="space-y-2">
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 font-semibold text-sm border-b">
                      <div className="col-span-4">Nome</div>
                      <div className="col-span-2">Tipo</div>
                      <div className="col-span-2">Preço Unit.</div>
                      <div className="col-span-2">Quantidade</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                    {complementosSelecionados.map((complemento, index) => (
                      <div key={complemento.sku || index} className="grid grid-cols-12 gap-2 p-3 border-b last:border-b-0 items-center">
                        <div className="col-span-4">
                          <div className="font-medium">{complemento.nome}</div>
                          {complemento.sku && (
                            <div className="text-xs text-gray-500">{complemento.sku}</div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline">
                            {complemento.tipo_precificacao === 'mensal' ? 'Mensal' :
                             complemento.tipo_precificacao === 'unico' ? 'Único' :
                             complemento.tipo_precificacao === 'por_metro' ? 'Por Metro' :
                             complemento.tipo_precificacao === 'por_hora' ? 'Por Hora' :
                             complemento.tipo_precificacao === 'por_dia' ? 'Por Dia' : complemento.tipo_precificacao}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          R$ {(complemento.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={complemento.quantidade || 1}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1
                              const updated = complementosSelecionados.map(c =>
                                c.sku === complemento.sku
                                  ? { ...c, quantidade: newQty, valor_total: (complemento.preco_unitario_centavos / 100) * newQty }
                                  : c
                              )
                              setComplementosSelecionados(updated)
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setComplementosSelecionados(
                                complementosSelecionados.filter(c => c.sku !== complemento.sku)
                              )
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total dos Complementos:</div>
                      <div className="text-xl font-bold text-green-600">
                        R$ {complementosSelecionados.reduce((sum, c) => sum + (c.valor_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum complemento adicionado</p>
                  <p className="text-sm">Use o campo acima para adicionar complementos ao orçamento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t -mx-6 px-6">
        <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
          Voltar
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSave(true)}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileTextIcon className="w-4 h-4 mr-2" />
          )}
          Salvar como Rascunho
        </Button>
        <Button 
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      {/* Modal de Criação de Cliente */}
      <Dialog open={isClienteModalOpen} onOpenChange={setIsClienteModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCliente} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={clienteFormData.nome}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, nome: e.target.value })}
                    placeholder="Ex: Construtora ABC Ltda"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={clienteFormData.cnpj}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '.' + value.substring(2)
                      }
                      if (value.length >= 6) {
                        value = value.substring(0, 6) + '.' + value.substring(6)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '/' + value.substring(10)
                      }
                      if (value.length >= 15) {
                        value = value.substring(0, 15) + '-' + value.substring(15, 17)
                      }
                      setClienteFormData({ ...clienteFormData, cnpj: value })
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clienteFormData.email || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={clienteFormData.telefone || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '-' + value.substring(10, 14)
                      }
                      setClienteFormData({ ...clienteFormData, telefone: value })
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={clienteFormData.endereco || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={clienteFormData.cep || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 5) {
                        value = value.substring(0, 5) + '-' + value.substring(5, 8)
                      }
                      setClienteFormData({ ...clienteFormData, cep: value })
                    }}
                    placeholder="01234-567"
                    maxLength={9}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={clienteFormData.cidade || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, cidade: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={clienteFormData.estado || undefined}
                    onValueChange={(value) => setClienteFormData({ ...clienteFormData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre (AC)</SelectItem>
                      <SelectItem value="AL">Alagoas (AL)</SelectItem>
                      <SelectItem value="AP">Amapá (AP)</SelectItem>
                      <SelectItem value="AM">Amazonas (AM)</SelectItem>
                      <SelectItem value="BA">Bahia (BA)</SelectItem>
                      <SelectItem value="CE">Ceará (CE)</SelectItem>
                      <SelectItem value="DF">Distrito Federal (DF)</SelectItem>
                      <SelectItem value="ES">Espírito Santo (ES)</SelectItem>
                      <SelectItem value="GO">Goiás (GO)</SelectItem>
                      <SelectItem value="MA">Maranhão (MA)</SelectItem>
                      <SelectItem value="MT">Mato Grosso (MT)</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul (MS)</SelectItem>
                      <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                      <SelectItem value="PA">Pará (PA)</SelectItem>
                      <SelectItem value="PB">Paraíba (PB)</SelectItem>
                      <SelectItem value="PR">Paraná (PR)</SelectItem>
                      <SelectItem value="PE">Pernambuco (PE)</SelectItem>
                      <SelectItem value="PI">Piauí (PI)</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte (RN)</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul (RS)</SelectItem>
                      <SelectItem value="RO">Rondônia (RO)</SelectItem>
                      <SelectItem value="RR">Roraima (RR)</SelectItem>
                      <SelectItem value="SC">Santa Catarina (SC)</SelectItem>
                      <SelectItem value="SP">São Paulo (SP)</SelectItem>
                      <SelectItem value="SE">Sergipe (SE)</SelectItem>
                      <SelectItem value="TO">Tocantins (TO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pessoa de Contato (Representante)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contato">Nome do Representante</Label>
                  <Input
                    id="contato"
                    value={clienteFormData.contato || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, contato: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="contato_cpf">CPF do Representante</Label>
                  <Input
                    id="contato_cpf"
                    value={clienteFormData.contato_cpf || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 3) {
                        value = value.substring(0, 3) + '.' + value.substring(3)
                      }
                      if (value.length >= 7) {
                        value = value.substring(0, 7) + '.' + value.substring(7)
                      }
                      if (value.length >= 11) {
                        value = value.substring(0, 11) + '-' + value.substring(11, 13)
                      }
                      setClienteFormData({ ...clienteFormData, contato_cpf: value })
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contato_email">Email do Representante</Label>
                  <Input
                    id="contato_email"
                    type="email"
                    value={clienteFormData.contato_email || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, contato_email: e.target.value })}
                    placeholder="joao.silva@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contato_telefone">Telefone do Representante</Label>
                  <Input
                    id="contato_telefone"
                    value={clienteFormData.contato_telefone || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '-' + value.substring(10, 14)
                      }
                      setClienteFormData({ ...clienteFormData, contato_telefone: value })
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsClienteModalOpen(false)} 
                disabled={isCreatingCliente}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingCliente}>
                {isCreatingCliente && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

