"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/api"

interface FuncionarioObra {
  id: number
  nome: string
  cargo?: string
  telefone?: string
  email?: string
  cpf?: string
  turno?: string
  status?: string
  data_admissao?: string
  salario?: number
  observacoes?: string
  data_inicio?: string
  data_fim?: string
  horas_trabalhadas?: number
  funcionarios?: {
    id: number
    nome: string
    cargo?: string
    salario?: number
    telefone?: string
    email?: string
  }
}

interface AprovacaoHorasExtras {
  id: number
  funcionario_id: number
  registro_ponto_id: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  data_submissao: string
  data_limite?: string
  dias_restantes?: number
  funcionarios?: {
    id: number
    nome: string
    cpf?: string
  }
  registros_ponto?: {
    entrada?: string
    saida?: string
    obra_id?: number
    horas_extras?: number
    data?: string
  }
}

interface LivroGruaFuncionariosListProps {
  gruaId: string | number
}

export function LivroGruaFuncionariosList({ gruaId }: LivroGruaFuncionariosListProps) {
  const { toast } = useToast()
  const [funcionarios, setFuncionarios] = useState<FuncionarioObra[]>([])
  const [aprovacoes, setAprovacoes] = useState<AprovacaoHorasExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [obraId, setObraId] = useState<number | null>(null)

  // Carregar funcionários da obra relacionada à grua
  const carregarFuncionarios = async () => {
    try {
      setLoading(true)
      
      // Primeiro, buscar a grua para obter a obra relacionada
      const responseGrua = await fetchWithAuth(`/api/gruas/${gruaId}`)
      if (!responseGrua.ok) {
        throw new Error('Erro ao buscar grua')
      }
      
      const gruaData = await responseGrua.json()
      
      if (gruaData.success && gruaData.data) {
        // Buscar obra ativa da grua
        const obraAtiva = gruaData.data.obra_ativa || gruaData.data.current_obra_id
        
        // Se não tiver obra ativa, tentar pegar da primeira relação
        let obraIdParaBuscar = obraAtiva?.id || obraAtiva
        
        if (!obraIdParaBuscar && gruaData.data.grua_obras && gruaData.data.grua_obras.length > 0) {
          const obraAtivaRelacao = gruaData.data.grua_obras.find((go: any) => go.status === 'Ativa')
          obraIdParaBuscar = obraAtivaRelacao?.obra_id || gruaData.data.grua_obras[0]?.obra_id
        }
        
        if (obraIdParaBuscar) {
          setObraId(obraIdParaBuscar)
          
          // Buscar todos os funcionários da obra
          const responseFuncionarios = await fetchWithAuth(`/api/funcionarios-obras/obra/${obraIdParaBuscar}/funcionarios?status=ativo`)
          if (responseFuncionarios.ok) {
            const funcionariosData = await responseFuncionarios.json()
            
            if (funcionariosData.success && funcionariosData.data) {
              // Mapear os dados para o formato esperado
              const funcionariosMapeados = funcionariosData.data.map((fo: any) => ({
                id: fo.funcionarios?.id || fo.funcionario_id,
                nome: fo.funcionarios?.nome || 'Nome não disponível',
                cargo: fo.funcionarios?.cargo,
                telefone: fo.funcionarios?.telefone,
                email: fo.funcionarios?.email,
                status: 'Ativo',
                data_inicio: fo.data_inicio,
                data_fim: fo.data_fim,
                funcionarios: fo.funcionarios
              }))
              
              setFuncionarios(funcionariosMapeados)
              
              // Buscar aprovações de horas extras para os funcionários
              const funcionarioIds = funcionariosMapeados
                .map((f: FuncionarioObra) => f.id)
                .filter((id: number) => id != null)
              
              if (funcionarioIds.length > 0) {
                await carregarAprovacoes(funcionarioIds)
              }
            }
          } else {
            // Fallback: tentar buscar pela rota alternativa
            try {
              const responseAlt = await fetchWithAuth(`/api/funcionarios/obra/${obraIdParaBuscar}`)
              if (responseAlt.ok) {
                const dataAlt = await responseAlt.json()
                if (dataAlt.success && dataAlt.data) {
                  setFuncionarios(dataAlt.data)
                  
                  const funcionarioIds = dataAlt.data
                    .map((f: any) => f.id)
                    .filter((id: number) => id != null)
                  
                  if (funcionarioIds.length > 0) {
                    await carregarAprovacoes(funcionarioIds)
                  }
                }
              }
            } catch (errorAlt) {
              console.error('Erro ao buscar funcionários (rota alternativa):', errorAlt)
            }
          }
        } else {
          toast({
            title: "Aviso",
            description: "Esta grua não está associada a nenhuma obra ativa",
            variant: "default"
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários da obra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar aprovações de horas extras
  const carregarAprovacoes = async (funcionarioIds: number[]) => {
    try {
      const aprovacoesPromises = funcionarioIds.map(async (funcId) => {
        try {
          const response = await fetchWithAuth(`/api/aprovacoes-horas-extras/funcionario/${funcId}?status=pendente`)
          if (!response.ok) {
            return []
          }
          const data = await response.json()
          return data.success ? (data.data || []) : []
        } catch (error) {
          console.error(`Erro ao carregar aprovações do funcionário ${funcId}:`, error)
          return []
        }
      })
      
      const resultados = await Promise.all(aprovacoesPromises)
      const todasAprovacoes = resultados.flat()
      setAprovacoes(todasAprovacoes)
    } catch (error) {
      console.error('Erro ao carregar aprovações:', error)
    }
  }

  useEffect(() => {
    if (gruaId) {
      carregarFuncionarios()
    }
  }, [gruaId])

  const formatarData = (data?: string) => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'Ativo': { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      'Inativo': { label: 'Inativo', className: 'bg-gray-100 text-gray-800' },
      'pendente': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      'aprovado': { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      'rejeitado': { label: 'Rejeitado', className: 'bg-red-100 text-red-800' }
    }
    
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Carregando funcionários...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de Funcionários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Funcionários
              </CardTitle>
              <CardDescription>
                Funcionários atrelados à obra desta grua
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Lista de Funcionários */}
          {funcionarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum funcionário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {funcionarios.map((funcionario) => (
                <Card key={funcionario.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {funcionario.nome || funcionario.funcionarios?.nome || 'Funcionário não encontrado'}
                          </h3>
                          {funcionario.status && (
                            <Badge className={getStatusBadge(funcionario.status).className}>
                              {getStatusBadge(funcionario.status).label}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {(funcionario.cargo || funcionario.funcionarios?.cargo) && (
                            <div>
                              <span className="text-xs text-gray-500">Cargo: </span>
                              <span className="font-medium">{funcionario.cargo || funcionario.funcionarios?.cargo}</span>
                            </div>
                          )}
                          {funcionario.turno && (
                            <div>
                              <span className="text-xs text-gray-500">Turno: </span>
                              <span className="font-medium">{funcionario.turno}</span>
                            </div>
                          )}
                          {funcionario.telefone && (
                            <div>
                              <span className="text-xs text-gray-500">Telefone: </span>
                              <span className="font-medium">{funcionario.telefone}</span>
                            </div>
                          )}
                          {funcionario.data_inicio && (
                            <div>
                              <span className="text-xs text-gray-500">Início na Obra: </span>
                              <span className="font-medium">{formatarData(funcionario.data_inicio)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aprovações de Horas Extras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Aprovações de Horas Extras
              </CardTitle>
              <CardDescription>
                Aprovações pendentes dos funcionários desta grua
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {aprovacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma aprovação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aprovacoes.map((aprovacao) => (
                <Card key={aprovacao.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {aprovacao.funcionarios?.nome || 'Funcionário não encontrado'}
                          </h3>
                          <Badge className={getStatusBadge(aprovacao.status).className}>
                            {getStatusBadge(aprovacao.status).label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {aprovacao.registros_ponto?.data && (
                            <div>
                              <span className="text-xs text-gray-500">Data: </span>
                              <span className="font-medium">{formatarData(aprovacao.registros_ponto.data)}</span>
                            </div>
                          )}
                          {aprovacao.registros_ponto?.horas_extras && (
                            <div>
                              <span className="text-xs text-gray-500">Horas Extras: </span>
                              <span className="font-medium">{aprovacao.registros_ponto.horas_extras}h</span>
                            </div>
                          )}
                          {aprovacao.data_submissao && (
                            <div>
                              <span className="text-xs text-gray-500">Submissão: </span>
                              <span className="font-medium">{formatarData(aprovacao.data_submissao)}</span>
                            </div>
                          )}
                          {aprovacao.dias_restantes !== undefined && (
                            <div>
                              <span className="text-xs text-gray-500">Dias Restantes: </span>
                              <span className={`font-medium ${aprovacao.dias_restantes < 3 ? 'text-red-600' : ''}`}>
                                {aprovacao.dias_restantes} dias
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

