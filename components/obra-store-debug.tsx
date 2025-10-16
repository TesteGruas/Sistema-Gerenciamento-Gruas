"use client"

import { useObraStore, debugCustosMensais } from '@/lib/obra-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, DollarSign, Calendar } from 'lucide-react'

export function ObraStoreDebug() {
  const {
    obra,
    custosMensais,
    loading,
    loadingCustos,
    error,
    errorCustos,
    lastUpdated,
    lastCustosUpdated,
    carregarObra,
    carregarCustosMensais,
    limparObra
  } = useObraStore()

  const handleDebugCustos = () => {
    if (custosMensais.length > 0) {
      debugCustosMensais(custosMensais)
    } else {
      console.log('💰 [DEBUG] Nenhum custo carregado')
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Debug do Store da Obra
        </h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => carregarObra('54')}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Carregar Obra 54
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => carregarCustosMensais('54')}
            disabled={loadingCustos}
          >
            <DollarSign className={`w-4 h-4 ${loadingCustos ? 'animate-spin' : ''}`} />
            Carregar Custos
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDebugCustos}
          >
            Debug Custos
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={limparObra}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status da Obra */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Status da Obra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Carregando:</span>
              <Badge variant={loading ? "default" : "secondary"}>
                {loading ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Erro:</span>
              <Badge variant={error ? "destructive" : "secondary"}>
                {error || "Nenhum"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Última atualização:</span>
              <span className="text-xs text-gray-600">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Nunca"}
              </span>
            </div>
            {obra && (
              <div className="mt-2 p-2 bg-green-50 rounded">
                <div className="text-sm font-medium text-green-800">Obra Carregada:</div>
                <div className="text-xs text-green-600">
                  ID: {obra.id} | Nome: {obra.name} | Status: {obra.status}
                </div>
                {obra.cliente && (
                  <div className="text-xs text-green-600">
                    Cliente: {obra.cliente.nome}
                  </div>
                )}
                {obra.orcamento && (
                  <div className="text-xs text-green-600">
                    💰 Orçamento: R$ {obra.orcamento.toLocaleString()}
                  </div>
                )}
                {obra.valorTotalObra && (
                  <div className="text-xs text-blue-600 font-medium">
                    🏗️ Valor Total da Obra: R$ {obra.valorTotalObra.toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status dos Custos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Status dos Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Carregando:</span>
              <Badge variant={loadingCustos ? "default" : "secondary"}>
                {loadingCustos ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Erro:</span>
              <Badge variant={errorCustos ? "destructive" : "secondary"}>
                {errorCustos || "Nenhum"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Última atualização:</span>
              <span className="text-xs text-gray-600">
                {lastCustosUpdated ? new Date(lastCustosUpdated).toLocaleTimeString() : "Nunca"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Quantidade:</span>
              <Badge variant="outline">
                {custosMensais.length} custos
              </Badge>
            </div>
            {custosMensais.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-800">Resumo dos Custos:</div>
                <div className="text-xs text-blue-600">
                  Total Orçamento: R$ {custosMensais.reduce((sum, c) => sum + c.total_orcamento, 0).toLocaleString()}
                </div>
                <div className="text-xs text-blue-600">
                  Total Realizado: R$ {custosMensais.reduce((sum, c) => sum + c.valor_realizado, 0).toLocaleString()}
                </div>
                <div className="text-xs text-blue-600">
                  Total Saldo: R$ {custosMensais.reduce((sum, c) => sum + c.valor_saldo, 0).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs do Console */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Instruções de Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Abra o console do navegador (F12) para ver os logs detalhados</p>
            <p>• Os logs incluem: 🏗️ [OBRA STORE], 💰 [CUSTOS STORE], 📄 [DOCUMENTOS], 📁 [ARQUIVOS]</p>
            <p>• Use o botão "Debug Custos" para análise detalhada dos custos carregados</p>
            <p>• Os dados são armazenados automaticamente quando a obra é carregada</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
