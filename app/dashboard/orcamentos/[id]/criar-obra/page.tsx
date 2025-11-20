"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { obrasApi } from "@/lib/api-obras"
import { getOrcamento } from "@/lib/api-orcamentos"

export default function CriarObraFromOrcamentoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const orcamentoId = params.id as string

  const [orcamento, setOrcamento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadOrcamento()
  }, [orcamentoId])

  const loadOrcamento = async () => {
    setLoading(true)
    try {
      const response = await getOrcamento(parseInt(orcamentoId))
      const orcamentoData = response.data
      
      // Mapear dados da API para o formato esperado
      const mappedOrcamento = {
        id: orcamentoId,
        numero: orcamentoData.numero || `ORC-${orcamentoData.id}`,
        cliente_id: orcamentoData.cliente_id,
        cliente_nome: orcamentoData.clientes?.nome || '',
        obra_nome: orcamentoData.obras?.nome || orcamentoData.obra_nome || '',
        obra_endereco: orcamentoData.obras?.endereco || orcamentoData.obra_endereco || '',
        obra_cidade: orcamentoData.obra_cidade || '',
        obra_estado: orcamentoData.obra_estado || '',
        tipo_obra: orcamentoData.obra_tipo || '',
        equipamento: orcamentoData.gruas ? `${orcamentoData.gruas.name || ''} / ${orcamentoData.gruas.modelo || ''}` : orcamentoData.grua_modelo || '',
        valor_locacao_mensal: 0,
        valor_operador: 0,
        valor_sinaleiro: 0,
        valor_manutencao: 0,
        total_mensal: orcamentoData.valor_total || 0,
        prazo_locacao_meses: orcamentoData.prazo_locacao_meses || 0,
        data_inicio_estimada: orcamentoData.data_inicio_estimada || '',
        altura_inicial: undefined,
        altura_final: orcamentoData.grua_altura_final,
        comprimento_lanca: orcamentoData.grua_lanca,
        carga_maxima: orcamentoData.grua_capacidade_1_cabo,
        carga_ponta: orcamentoData.grua_capacidade_2_cabos,
        potencia_eletrica: orcamentoData.grua_potencia ? `${orcamentoData.grua_potencia} KVA` : '',
        energia_necessaria: orcamentoData.grua_voltagem || ''
      }
      setOrcamento(mappedOrcamento)
    } catch (error: any) {
      console.error('Erro ao carregar orçamento:', error)
      toast({
        title: "Erro",
        description: error?.message || "Erro ao carregar orçamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateObra = async () => {
    if (!orcamento) return

    setCreating(true)
    try {
      // Preparar dados da obra a partir do orçamento
      const obraData = {
        nome: orcamento.obra_nome,
        cliente_id: orcamento.cliente_id,
        endereco: orcamento.obra_endereco || '',
        cidade: orcamento.obra_cidade || '',
        estado: orcamento.obra_estado || '',
        tipo: orcamento.tipo_obra || 'Residencial',
        status: 'Planejamento' as const,
        data_inicio: orcamento.data_inicio_estimada,
        descricao: `Obra criada a partir do orçamento ${orcamento.numero}`,
        orcamento: orcamento.total_mensal * orcamento.prazo_locacao_meses,
        observacoes: `Orçamento de origem: ${orcamento.numero}\nEquipamento: ${orcamento.equipamento}\nPrazo: ${orcamento.prazo_locacao_meses} meses`
      }

      const response = await obrasApi.criarObra(obraData)
      
      toast({
        title: "Sucesso",
        description: "Obra criada com sucesso a partir do orçamento",
      })

      // Redirecionar para a obra criada
      router.push(`/dashboard/obras/${response.data.id}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar obra",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Orçamento não encontrado</p>
            <Button onClick={() => router.back()} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Criar Obra a partir do Orçamento</h1>
          <p className="text-gray-600 mt-1">
            Revise os dados do orçamento antes de criar a obra
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orçamento {orcamento.numero}</CardTitle>
          <CardDescription>{orcamento.obra_nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="font-medium">{orcamento.cliente_nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Obra</label>
              <p className="font-medium">{orcamento.tipo_obra}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Endereço</label>
              <p className="font-medium">
                {orcamento.obra_endereco}, {orcamento.obra_cidade} - {orcamento.obra_estado}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Equipamento</label>
              <p className="font-medium">{orcamento.equipamento}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Especificações Técnicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Altura Inicial → Final</label>
                <p className="font-medium">
                  {orcamento.altura_inicial} m → {orcamento.altura_final} m
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Comprimento da Lança</label>
                <p className="font-medium">{orcamento.comprimento_lanca} m</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Carga Máxima</label>
                <p className="font-medium">{orcamento.carga_maxima} kg</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Carga na Ponta</label>
                <p className="font-medium">{orcamento.carga_ponta} kg</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Custos Mensais</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Locacao da grua</span>
                <span className="font-medium">R$ {orcamento.valor_locacao_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Operador</span>
                <span className="font-medium">R$ {orcamento.valor_operador.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Sinaleiro</span>
                <span className="font-medium">R$ {orcamento.valor_sinaleiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Manutenção preventiva</span>
                <span className="font-medium">R$ {orcamento.valor_manutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Mensal</span>
                <span>R$ {orcamento.total_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Prazo: {orcamento.prazo_locacao_meses} meses</span>
                <span>
                  Total do Contrato: R$ {(orcamento.total_mensal * orcamento.prazo_locacao_meses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Informações Importantes
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• A obra será criada com status "Planejamento"</li>
                <li>• Os dados do orçamento serão copiados para a obra</li>
                <li>• Você poderá adicionar complementos, acessórios e serviços após a criação</li>
                <li>• Gruas e funcionários podem ser vinculados posteriormente</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleCreateObra} disabled={creating}>
              <Building2 className="w-4 h-4 mr-2" />
              {creating ? 'Criando Obra...' : 'Criar Obra'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

