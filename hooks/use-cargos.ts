import { useState, useEffect, useCallback } from 'react'

export interface Cargo {
  id: number
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CargoCreateData {
  nome: string
  descricao?: string
}

export function useCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargos padrão do sistema (fallback)
  const cargosPadrao: Cargo[] = [
    {
      id: 1,
      nome: 'Operador',
      descricao: 'Operador de equipamentos pesados',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nome: 'Sinaleiro',
      descricao: 'Responsável por sinalização em obras',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nome: 'Técnico Manutenção',
      descricao: 'Técnico responsável pela manutenção de equipamentos',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nome: 'Supervisor',
      descricao: 'Supervisor de equipe e operações',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      nome: 'Mecânico',
      descricao: 'Mecânico especializado em equipamentos pesados',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      nome: 'Engenheiro',
      descricao: 'Engenheiro responsável por projetos e obras',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      nome: 'Chefe de Obras',
      descricao: 'Responsável pela coordenação geral das obras',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Carregar cargos
  const carregarCargos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Implementar chamada para API de cargos
      // const response = await cargosApi.listarCargos()
      // setCargos(response.data)
      
      // Por enquanto, usar cargos padrão
      setCargos(cargosPadrao)
      
    } catch (err: any) {
      console.error('Erro ao carregar cargos:', err)
      setError(err.message || 'Erro ao carregar cargos')
      
      // Fallback para cargos padrão
      setCargos(cargosPadrao)
    } finally {
      setLoading(false)
    }
  }, [])

  // Criar novo cargo
  const criarCargo = useCallback(async (data: CargoCreateData): Promise<Cargo> => {
    try {
      setLoading(true)
      
      // TODO: Implementar chamada para API de cargos
      // const response = await cargosApi.criarCargo(data)
      // const novoCargo = response.data
      
      // Simulação temporária
      const novoCargo: Cargo = {
        id: Date.now(), // ID temporário
        nome: data.nome,
        descricao: data.descricao,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Adicionar à lista local
      setCargos(prev => [...prev, novoCargo])
      
      return novoCargo
      
    } catch (err: any) {
      console.error('Erro ao criar cargo:', err)
      throw new Error(err.message || 'Erro ao criar cargo')
    } finally {
      setLoading(false)
    }
  }, [])

  // Obter cargos ativos
  const cargosAtivos = cargos.filter(cargo => cargo.ativo)

  // Buscar cargo por nome
  const buscarCargoPorNome = (nome: string) =>
    cargosAtivos.find(cargo => cargo.nome === nome)

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
    buscarCargoPorNome
  }
}
