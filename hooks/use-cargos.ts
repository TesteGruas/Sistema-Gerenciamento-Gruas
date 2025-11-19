import { useState, useEffect, useCallback } from 'react'
import { cargosApi, type Cargo, type CargoCreateData } from '@/lib/api/cargos-api'

// Re-exportar tipos para compatibilidade
export type { Cargo, CargoCreateData }

export function useCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar cargos da API
  const carregarCargos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await cargosApi.listarCargos({ ativo: true })
      
      if (response.success && response.data) {
        // Ordenar cargos por nome para melhor UX
        const cargosOrdenados = [...response.data].sort((a, b) => 
          a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        )
        setCargos(cargosOrdenados)
      } else {
        throw new Error('Falha ao carregar cargos')
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar cargos:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar cargos'
      setError(errorMessage)
      
      // Em caso de erro, manter lista vazia ou cache anterior
      // Não usar fallback hardcoded para forçar correção de problemas
    } finally {
      setLoading(false)
    }
  }, [])

  // Criar novo cargo
  const criarCargo = useCallback(async (data: CargoCreateData): Promise<Cargo> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await cargosApi.criarCargo(data)
      
      if (response.success && response.data) {
        const novoCargo = response.data
        
        // Adicionar à lista local
        setCargos(prev => [...prev, novoCargo])
        
        return novoCargo
      } else {
        throw new Error(response.message || 'Falha ao criar cargo')
      }
      
    } catch (err: any) {
      console.error('Erro ao criar cargo:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar cargo'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar cargo
  const atualizarCargo = useCallback(async (id: number, data: Partial<CargoCreateData>): Promise<Cargo> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await cargosApi.atualizarCargo(id, data)
      
      if (response.success && response.data) {
        const cargoAtualizado = response.data
        
        // Atualizar na lista local
        setCargos(prev => prev.map(c => c.id === id ? cargoAtualizado : c))
        
        return cargoAtualizado
      } else {
        throw new Error(response.message || 'Falha ao atualizar cargo')
      }
      
    } catch (err: any) {
      console.error('Erro ao atualizar cargo:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar cargo'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Obter cargos ativos
  const cargosAtivos = cargos.filter(cargo => cargo.ativo)

  // Buscar cargo por nome
  const buscarCargoPorNome = useCallback((nome: string) => {
    return cargosAtivos.find(cargo => cargo.nome === nome)
  }, [cargosAtivos])

  // Buscar cargo por ID
  const buscarCargoPorId = useCallback((id: number) => {
    return cargos.find(cargo => cargo.id === id)
  }, [cargos])

  // Carregar cargos na inicialização
  useEffect(() => {
    carregarCargos()
  }, [carregarCargos])

  return {
    cargos,
    cargosAtivos,
    loading,
    error,
    carregarCargos,
    criarCargo,
    atualizarCargo,
    buscarCargoPorNome,
    buscarCargoPorId
  }
}
