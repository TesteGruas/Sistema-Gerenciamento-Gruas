"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  apiRegistrosPonto, 
  apiHorasExtras,
  apiJustificativas,
  apiFuncionarios,
  type RegistroPonto
} from "@/lib/api-ponto-eletronico"
import { apiAprovacoesHorasExtras } from "@/lib/api-aprovacoes-horas-extras"
import { AuthService } from "@/app/lib/auth"
import { 
  Play, 
  Square, 
  Coffee, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Loader2,
  TestTube
} from "lucide-react"

export function PontoTestButtons() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [funcionarioId, setFuncionarioId] = useState<string>("")
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [registroId, setRegistroId] = useState<string>("")
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0])
  const [dataError, setDataError] = useState<string>("")
  const [observacoes, setObservacoes] = useState<string>("")
  const [motivo, setMotivo] = useState<string>("")

  // Carregar funcionários ao montar
  useEffect(() => {
    carregarFuncionarios()
  }, [])

  const carregarFuncionarios = async () => {
    try {
      const user = await AuthService.getCurrentUser()
      const response = await apiFuncionarios.listarParaPonto(user.id)
      setFuncionarios(response.funcionarios || [])
      if (response.funcionarios && response.funcionarios.length > 0) {
        setFuncionarioId(response.funcionarios[0].id.toString())
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  const validarDataFutura = (dataSelecionada: string): boolean => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataRegistro = new Date(dataSelecionada)
    dataRegistro.setHours(0, 0, 0, 0)
    
    if (dataRegistro > hoje) {
      setDataError("Não é possível registrar ponto para uma data futura")
      return false
    }
    setDataError("")
    return true
  }

  const executarTeste = async (nome: string, funcao: () => Promise<any>) => {
    // Validar data antes de executar
    if (data && !validarDataFutura(data)) {
      toast({
        title: "⚠️ Atenção",
        description: dataError,
        variant: "destructive"
      })
      return
    }

    setLoading(nome)
    try {
      const resultado = await funcao()
      toast({
        title: "✅ Sucesso",
        description: `${nome} executado com sucesso!`,
        variant: "default"
      })
      console.log(`✅ ${nome}:`, resultado)
      return resultado
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: `Erro ao executar ${nome}: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      })
      console.error(`❌ ${nome}:`, error)
      throw error
    } finally {
      setLoading(null)
    }
  }

  // ========================================
  // TESTES DE REGISTRO DE PONTO
  // ========================================

  const testarRegistroPontoNormal = async () => {
    return executarTeste("Registro Ponto Normal (8h)", async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const entrada = "08:00"
      const saida_almoco = "12:00"
      const volta_almoco = "13:00"
      const saida = "17:00"

      return await apiRegistrosPonto.criar({
        funcionario_id: parseInt(funcionarioId),
        data: data || hoje,
        entrada,
        saida_almoco,
        volta_almoco,
        saida,
        justificativa_alteracao: "Teste automático - Registro normal"
      })
    })
  }

  const testarRegistroPontoComHorasExtras = async () => {
    return executarTeste("Registro Ponto com Horas Extras (+2h)", async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const entrada = "08:00"
      const saida_almoco = "12:00"
      const volta_almoco = "13:00"
      const saida = "19:00" // 10h trabalhadas = 2h extras

      return await apiRegistrosPonto.criar({
        funcionario_id: parseInt(funcionarioId),
        data: data || hoje,
        entrada,
        saida_almoco,
        volta_almoco,
        saida,
        justificativa_alteracao: "Teste automático - Horas extras"
      })
    })
  }

  const testarRegistroPontoIncompleto = async () => {
    return executarTeste("Registro Ponto Incompleto (só entrada)", async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const entrada = "08:00"

      return await apiRegistrosPonto.criar({
        funcionario_id: parseInt(funcionarioId),
        data: data || hoje,
        entrada,
        justificativa_alteracao: "Teste automático - Registro incompleto"
      })
    })
  }

  const testarRegistroPontoComAtraso = async () => {
    return executarTeste("Registro Ponto com Atraso", async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const entrada = "09:00" // 1h de atraso
      const saida_almoco = "12:00"
      const volta_almoco = "13:00"
      const saida = "17:00"

      return await apiRegistrosPonto.criar({
        funcionario_id: parseInt(funcionarioId),
        data: data || hoje,
        entrada,
        saida_almoco,
        volta_almoco,
        saida,
        justificativa_alteracao: "Teste automático - Atraso"
      })
    })
  }

  // ========================================
  // TESTES DE APROVAÇÃO
  // ========================================

  const testarAprovarHorasExtras = async () => {
    if (!registroId) {
      toast({
        title: "Atenção",
        description: "Informe o ID do registro para aprovar",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Aprovar Horas Extras", async () => {
      return await apiRegistrosPonto.aprovar(registroId, observacoes || "Aprovado via teste")
    })
  }

  const testarRejeitarHorasExtras = async () => {
    if (!registroId) {
      toast({
        title: "Atenção",
        description: "Informe o ID do registro para rejeitar",
        variant: "destructive"
      })
      return
    }

    if (!motivo) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Rejeitar Horas Extras", async () => {
      return await apiRegistrosPonto.rejeitar(registroId, motivo)
    })
  }

  const testarAprovarLote = async () => {
    return executarTeste("Aprovar Horas Extras em Lote", async () => {
      // Buscar registros pendentes
      const { data: registros } = await apiHorasExtras.listar({
        status: 'Pendente Aprovação',
        limit: 5
      })

      if (registros.length === 0) {
        throw new Error("Nenhum registro pendente encontrado")
      }

      const ids = registros.map(r => r.id!).slice(0, 3) // Aprovar até 3
      return await apiHorasExtras.aprovarLote({
        registro_ids: ids,
        observacoes: observacoes || "Aprovado em lote via teste"
      })
    })
  }

  const testarRejeitarLote = async () => {
    if (!motivo) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Rejeitar Horas Extras em Lote", async () => {
      // Buscar registros pendentes
      const { data: registros } = await apiHorasExtras.listar({
        status: 'Pendente Aprovação',
        limit: 5
      })

      if (registros.length === 0) {
        throw new Error("Nenhum registro pendente encontrado")
      }

      const ids = registros.map(r => r.id!).slice(0, 3) // Rejeitar até 3
      return await apiHorasExtras.rejeitarLote({
        registro_ids: ids,
        motivo: motivo
      })
    })
  }

  // ========================================
  // TESTES DE JUSTIFICATIVAS
  // ========================================

  const testarCriarJustificativa = async () => {
    return executarTeste("Criar Justificativa", async () => {
      const hoje = new Date().toISOString().split('T')[0]
      return await apiJustificativas.criar({
        funcionario_id: parseInt(funcionarioId),
        data: data || hoje,
        tipo: "Atraso",
        motivo: motivo || "Teste automático de justificativa"
      })
    })
  }

  const testarAprovarJustificativa = async () => {
    if (!registroId) {
      toast({
        title: "Atenção",
        description: "Informe o ID da justificativa para aprovar",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Aprovar Justificativa", async () => {
      return await apiJustificativas.aprovar(registroId)
    })
  }

  const testarRejeitarJustificativa = async () => {
    if (!registroId) {
      toast({
        title: "Atenção",
        description: "Informe o ID da justificativa para rejeitar",
        variant: "destructive"
      })
      return
    }

    if (!motivo) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Rejeitar Justificativa", async () => {
      return await apiJustificativas.rejeitar(registroId, motivo)
    })
  }

  // ========================================
  // TESTES DE LISTAGEM
  // ========================================

  const testarListarRegistros = async () => {
    return executarTeste("Listar Registros", async () => {
      const resultado = await apiRegistrosPonto.listar({
        funcionario_id: funcionarioId ? parseInt(funcionarioId) : undefined,
        page: 1,
        limit: 10
      })
      console.log("📊 Registros encontrados:", resultado.data.length)
      return resultado
    })
  }

  const testarListarHorasExtras = async () => {
    return executarTeste("Listar Horas Extras", async () => {
      const resultado = await apiHorasExtras.listar({
        funcionario_id: funcionarioId ? parseInt(funcionarioId) : undefined,
        status: 'Pendente Aprovação',
        limit: 10
      })
      console.log("⏰ Horas extras pendentes:", resultado.data.length)
      if (resultado.data.length > 0) {
        setRegistroId(resultado.data[0].id?.toString() || "")
      }
      return resultado
    })
  }

  const testarEstatisticasHorasExtras = async () => {
    return executarTeste("Estatísticas Horas Extras", async () => {
      const resultado = await apiHorasExtras.estatisticas({
        periodo: 'mes',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear()
      })
      console.log("📊 Estatísticas:", resultado)
      return resultado
    })
  }

  // ========================================
  // TESTES DE NOTIFICAÇÃO
  // ========================================

  const testarNotificarSupervisor = async () => {
    if (!registroId) {
      toast({
        title: "Atenção",
        description: "Informe o ID do registro para notificar",
        variant: "destructive"
      })
      return
    }

    return executarTeste("Notificar Supervisor", async () => {
      return await apiHorasExtras.notificarSupervisor(registroId)
    })
  }

  // ========================================
  // TESTES DE RECÁLCULO
  // ========================================

  const testarRecalcularRegistros = async () => {
    return executarTeste("Recalcular Registros", async () => {
      return await apiRegistrosPonto.recalcular({
        funcionario_id: funcionarioId ? parseInt(funcionarioId) : undefined,
        data_inicio: data || new Date().toISOString().split('T')[0],
        data_fim: data || new Date().toISOString().split('T')[0]
      })
    })
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-orange-600" />
          Botões de Teste - Ponto Eletrônico
        </CardTitle>
        <CardDescription>
          Use estes botões para testar as APIs do sistema de ponto eletrônico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={funcionarioId} onValueChange={setFuncionarioId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((func) => (
                  <SelectItem key={func.id} value={func.id.toString()}>
                    {func.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => {
                setData(e.target.value)
                if (e.target.value) {
                  validarDataFutura(e.target.value)
                }
              }}
              max={new Date().toISOString().split('T')[0]}
              className={dataError ? "border-red-500" : ""}
            />
            {dataError && (
              <p className="text-xs text-red-500">{dataError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>ID Registro/Justificativa</Label>
            <Input
              placeholder="ID para aprovar/rejeitar"
              value={registroId}
              onChange={(e) => setRegistroId(e.target.value)}
            />
          </div>
        </div>

        {/* Campos opcionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações para aprovação"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Motivo (para rejeição)</Label>
            <Textarea
              placeholder="Motivo da rejeição"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Testes de Registro de Ponto */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Testes de Registro de Ponto
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={testarRegistroPontoNormal}
              disabled={loading !== null || !funcionarioId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Registro Ponto Normal (8h)" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Ponto Normal (8h)
            </Button>
            <Button
              onClick={testarRegistroPontoComHorasExtras}
              disabled={loading !== null || !funcionarioId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Registro Ponto com Horas Extras (+2h)" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Ponto +2h Extras
            </Button>
            <Button
              onClick={testarRegistroPontoIncompleto}
              disabled={loading !== null || !funcionarioId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Registro Ponto Incompleto (só entrada)" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Square className="w-3 h-3 mr-1" />
              )}
              Incompleto
            </Button>
            <Button
              onClick={testarRegistroPontoComAtraso}
              disabled={loading !== null || !funcionarioId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Registro Ponto com Atraso" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Com Atraso
            </Button>
          </div>
        </div>

        {/* Testes de Aprovação */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Testes de Aprovação de Horas Extras
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={testarAprovarHorasExtras}
              disabled={loading !== null || !registroId}
              variant="outline"
              size="sm"
              className="text-xs text-green-600 border-green-200 hover:bg-green-50"
            >
              {loading === "Aprovar Horas Extras" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Aprovar
            </Button>
            <Button
              onClick={testarRejeitarHorasExtras}
              disabled={loading !== null || !registroId || !motivo}
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading === "Rejeitar Horas Extras" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Rejeitar
            </Button>
            <Button
              onClick={testarAprovarLote}
              disabled={loading !== null}
              variant="outline"
              size="sm"
              className="text-xs text-green-600 border-green-200 hover:bg-green-50"
            >
              {loading === "Aprovar Horas Extras em Lote" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Aprovar Lote
            </Button>
            <Button
              onClick={testarRejeitarLote}
              disabled={loading !== null || !motivo}
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading === "Rejeitar Horas Extras em Lote" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Rejeitar Lote
            </Button>
          </div>
        </div>

        {/* Testes de Justificativas */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Testes de Justificativas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              onClick={testarCriarJustificativa}
              disabled={loading !== null || !funcionarioId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Criar Justificativa" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <FileText className="w-3 h-3 mr-1" />
              )}
              Criar Justificativa
            </Button>
            <Button
              onClick={testarAprovarJustificativa}
              disabled={loading !== null || !registroId}
              variant="outline"
              size="sm"
              className="text-xs text-green-600 border-green-200 hover:bg-green-50"
            >
              {loading === "Aprovar Justificativa" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Aprovar Justificativa
            </Button>
            <Button
              onClick={testarRejeitarJustificativa}
              disabled={loading !== null || !registroId || !motivo}
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              {loading === "Rejeitar Justificativa" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Rejeitar Justificativa
            </Button>
          </div>
        </div>

        {/* Testes de Listagem e Consultas */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Testes de Consulta
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={testarListarRegistros}
              disabled={loading !== null}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Listar Registros" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Listar Registros
            </Button>
            <Button
              onClick={testarListarHorasExtras}
              disabled={loading !== null}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Listar Horas Extras" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Listar Horas Extras
            </Button>
            <Button
              onClick={testarEstatisticasHorasExtras}
              disabled={loading !== null}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Estatísticas Horas Extras" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Estatísticas
            </Button>
            <Button
              onClick={testarRecalcularRegistros}
              disabled={loading !== null}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Recalcular Registros" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              Recalcular
            </Button>
          </div>
        </div>

        {/* Testes de Notificação */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Coffee className="w-4 h-4" />
            Testes de Notificação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              onClick={testarNotificarSupervisor}
              disabled={loading !== null || !registroId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading === "Notificar Supervisor" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Coffee className="w-3 h-3 mr-1" />
              )}
              Notificar Supervisor (WhatsApp)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

