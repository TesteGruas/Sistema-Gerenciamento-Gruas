"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiRegistrosPonto } from "@/lib/api-ponto-eletronico"
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/**
 * Componente de exemplo mostrando como usar as novas funcionalidades
 * de recálculo e validação de registros de ponto
 */
export function PontoRecalcularValidar() {
  const [loading, setLoading] = useState(false)
  const [validacaoResultado, setValidacaoResultado] = useState<any>(null)
  const [recalculoResultado, setRecalculoResultado] = useState<any>(null)
  const [filtros, setFiltros] = useState({
    funcionario_id: '',
    data_inicio: '',
    data_fim: ''
  })
  const { toast } = useToast()

  /**
   * Valida a consistência dos registros
   */
  const validarRegistros = async () => {
    setLoading(true)
    try {
      const params: any = {}
      
      if (filtros.funcionario_id) {
        params.funcionario_id = parseInt(filtros.funcionario_id)
      }
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim
      }

      const resultado = await apiRegistrosPonto.validar(params)
      setValidacaoResultado(resultado)

      toast({
        title: "Validação Concluída",
        description: `${resultado.estatisticas.com_problemas} registro(s) com problemas de ${resultado.estatisticas.total} analisados`,
        variant: resultado.estatisticas.com_problemas > 0 ? "default" : "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro na Validação",
        description: error.message || "Erro ao validar registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Recalcula horas trabalhadas e status dos registros
   */
  const recalcularRegistros = async (recalcularTodos: boolean = false) => {
    setLoading(true)
    try {
      const payload: any = {
        recalcular_todos: recalcularTodos
      }
      
      if (filtros.funcionario_id) {
        payload.funcionario_id = parseInt(filtros.funcionario_id)
      }
      if (filtros.data_inicio) {
        payload.data_inicio = filtros.data_inicio
      }
      if (filtros.data_fim) {
        payload.data_fim = filtros.data_fim
      }

      const resultado = await apiRegistrosPonto.recalcular(payload)
      setRecalculoResultado(resultado)

      toast({
        title: "Recálculo Concluído",
        description: resultado.message,
        variant: resultado.success ? "default" : "destructive"
      })

      // Após recalcular, validar novamente para ver se resolveu os problemas
      if (resultado.success && resultado.atualizados > 0) {
        setTimeout(() => validarRegistros(), 1000)
      }
    } catch (error: any) {
      toast({
        title: "Erro no Recálculo",
        description: error.message || "Erro ao recalcular registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Lista registros com recalculação automática
   */
  const listarComRecalculo = async () => {
    setLoading(true)
    try {
      const params: any = {
        recalcular: true
      }
      
      if (filtros.funcionario_id) {
        params.funcionario_id = parseInt(filtros.funcionario_id)
      }
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim
      }

      const resultado = await apiRegistrosPonto.listar(params)

      toast({
        title: "Listagem Concluída",
        description: resultado.recalculated 
          ? "Registros recalculados automaticamente durante a listagem"
          : "Registros listados sem necessidade de recálculo",
      })

      console.log('Registros listados:', resultado.data)
    } catch (error: any) {
      toast({
        title: "Erro na Listagem",
        description: error.message || "Erro ao listar registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Configure os filtros para validar ou recalcular registros específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="funcionario_id">ID do Funcionário</Label>
              <Input
                id="funcionario_id"
                type="number"
                placeholder="100"
                value={filtros.funcionario_id}
                onChange={(e) => setFiltros({ ...filtros, funcionario_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Execute validação ou recálculo de registros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={validarRegistros} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Validar Registros
            </Button>

            <Button 
              onClick={() => recalcularRegistros(false)} 
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Recalcular Problemas
            </Button>

            <Button 
              onClick={() => recalcularRegistros(true)} 
              disabled={loading}
              variant="secondary"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Recalcular Todos
            </Button>

            <Button 
              onClick={listarComRecalculo} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Listar com Recálculo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Resultados de Validação */}
      {validacaoResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Validação</CardTitle>
            <CardDescription>
              Estatísticas e problemas encontrados nos registros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Analisados</p>
                <p className="text-2xl font-bold">{validacaoResultado.estatisticas.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Com Problemas</p>
                <p className="text-2xl font-bold text-red-600">
                  {validacaoResultado.estatisticas.com_problemas}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Horas Zeradas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {validacaoResultado.estatisticas.horas_zeradas}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Status Inconsistente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {validacaoResultado.estatisticas.status_inconsistente}
                </p>
              </div>
            </div>

            {/* Lista de Problemas */}
            {validacaoResultado.problemas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Problemas Encontrados</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Problemas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validacaoResultado.problemas.slice(0, 10).map((problema: any) => (
                      <TableRow key={problema.id}>
                        <TableCell className="font-mono text-xs">{problema.id}</TableCell>
                        <TableCell>{problema.funcionario}</TableCell>
                        <TableCell>{problema.data}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {problema.problemas.map((p: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {validacaoResultado.total_problemas > 10 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Mostrando 10 de {validacaoResultado.total_problemas} problemas
                  </p>
                )}
              </div>
            )}

            {validacaoResultado.problemas.length === 0 && (
              <div className="text-center py-8 text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Todos os registros estão consistentes!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card de Resultados de Recálculo */}
      {recalculoResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Recálculo</CardTitle>
            <CardDescription>
              Registros atualizados com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registros Processados:</span>
                <span className="font-bold">{recalculoResultado.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registros Atualizados:</span>
                <span className="font-bold text-green-600">{recalculoResultado.atualizados}</span>
              </div>
              {recalculoResultado.erros && recalculoResultado.erros.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Erros:</span>
                  <span className="font-bold text-red-600">{recalculoResultado.erros.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

