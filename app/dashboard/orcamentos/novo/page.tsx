"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Save,
  Send,
  Building2,
  Wrench,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"

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

  const calcularTotalMensal = () => {
    const locacao = parseFloat(formData.valor_locacao_mensal) || 0
    const operador = parseFloat(formData.valor_operador) || 0
    const sinaleiro = parseFloat(formData.valor_sinaleiro) || 0
    const manutencao = parseFloat(formData.valor_manutencao) || 0
    return locacao + operador + sinaleiro + manutencao
  }

  const handleSave = (status: 'rascunho' | 'enviado' = 'rascunho') => {
    // Validações básicas
    if (!formData.obra_nome || !formData.equipamento) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    // TODO: Salvar no backend
    toast({
      title: "Sucesso",
      description: status === 'rascunho' ? "Orçamento salvo como rascunho" : "Orçamento enviado com sucesso",
    })
    
    router.push('/dashboard/orcamentos')
  }

  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    setFormData({ ...formData, cliente_id: cliente.id.toString(), cliente_nome: cliente.nome })
  }

  const handleGruaSelect = (grua: any) => {
    setGruaSelecionada(grua)
    const equipamento = `${grua.tipo || 'Grua Torre'} / ${grua.fabricante} ${grua.modelo}`
    setFormData({ ...formData, equipamento })
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
              Preencha os dados essenciais para aprovação da locação
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('rascunho')}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave('enviado')}>
            <Send className="w-4 h-4 mr-2" />
            Enviar para Aprovação
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
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
                <ClienteSearch
                  onSelect={handleClienteSelect}
                  selectedCliente={clienteSelecionado}
                />
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

              <div>
                <Label>Equipamento Ofertado *</Label>
                <GruaSearch
                  onSelect={handleGruaSelect}
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
                    type="number"
                    step="0.01"
                    value={formData.valor_locacao_mensal}
                    onChange={(e) => setFormData({ ...formData, valor_locacao_mensal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Operador (R$/mês) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_operador}
                    onChange={(e) => setFormData({ ...formData, valor_operador: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Sinaleiro (R$/mês) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_sinaleiro}
                    onChange={(e) => setFormData({ ...formData, valor_sinaleiro: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Manutenção preventiva (R$/mês) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_manutencao}
                    onChange={(e) => setFormData({ ...formData, valor_manutencao: e.target.value })}
                    placeholder="0.00"
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
      </Tabs>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t -mx-6 px-6">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={() => handleSave('rascunho')}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSave('enviado')}>
          <Send className="w-4 h-4 mr-2" />
          Enviar para Aprovação
        </Button>
      </div>
    </div>
  )
}

