import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { obrasApi, ObraBackend, converterObraBackendParaFrontend } from './api-obras'
import { custosMensaisApi } from './api-custos-mensais'

// Tipos para o store
interface ObraStore {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string // Tornando opcional para compatibilidade
  orcamento?: number // Orçamento original da obra
  valorTotalObra?: number // Valor total acumulado dos custos (deve ser usado para exibição)
  status: string
  responsavelName?: string // Propriedade adicional
  cliente?: {
    id: string
    nome: string
    email?: string
    telefone?: string
    cnpj?: string // Propriedade adicional
  } | null
  gruasVinculadas?: any[]
  custosMensais?: any[]
  totalCustosMensais?: number
  totalCustosGerais?: number
  custosIniciais?: number
  custosAdicionais?: number
  totalCustos?: number
}

interface CustoMensalStore {
  id: number
  obra_id: number
  item: string
  descricao: string
  unidade: string
  quantidade_orcamento: number
  valor_unitario: number
  total_orcamento: number
  mes: string
  quantidade_realizada: number
  valor_realizado: number
  quantidade_acumulada: number
  valor_acumulado: number
  quantidade_saldo: number
  valor_saldo: number
  valor?: number // Propriedade adicional para compatibilidade
  tipo: string
  created_at: string
  updated_at: string
  obras?: {
    id: number
    nome: string
    status: string
  }
}

interface ObraState {
  // Estado principal
  obra: ObraStore | null
  custosMensais: CustoMensalStore[]
  
  // Estados de loading
  loading: boolean
  loadingCustos: boolean
  
  // Estados de erro
  error: string | null
  errorCustos: string | null
  
  // Timestamps para debug
  lastUpdated: string | null
  lastCustosUpdated: string | null
  
  // Ações
  carregarObra: (obraId: string) => Promise<void>
  carregarCustosMensais: (obraId: string) => Promise<void>
  limparObra: () => void
  atualizarObra: (dados: Partial<ObraStore>) => void
}

export const useObraStore = create<ObraState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      obra: null,
      custosMensais: [],
      loading: false,
      loadingCustos: false,
      error: null,
      errorCustos: null,
      lastUpdated: null,
      lastCustosUpdated: null,

      // Carregar obra principal
      carregarObra: async (obraId: string) => {
        set({ 
          loading: true, 
          error: null,
          lastUpdated: new Date().toISOString()
        })
        
        try {
          const response = await obrasApi.obterObra(parseInt(obraId))
          
          if (response.success && response.data) {
            const obraConvertida = converterObraBackendParaFrontend(response.data)
            
            set({ 
              obra: obraConvertida,
              loading: false,
              lastUpdated: new Date().toISOString()
            })
            
            // Carregar custos mensais automaticamente
            await get().carregarCustosMensais(obraId)
            
          } else {
            set({ 
              error: 'Erro ao carregar obra',
              loading: false 
            })
          }
        } catch (error) {
          set({ 
            error: 'Erro na requisição',
            loading: false 
          })
        }
      },

      // Carregar custos mensais
      carregarCustosMensais: async (obraId: string) => {
        set({ 
          loadingCustos: true, 
          errorCustos: null,
          lastCustosUpdated: new Date().toISOString()
        })
        
        try {
          const response = await custosMensaisApi.listarPorObra(parseInt(obraId))
          
          if (response.success && response.data) {
            set({ 
              custosMensais: response.data,
              loadingCustos: false,
              lastCustosUpdated: new Date().toISOString()
            })
            
          } else {
            set({ 
              errorCustos: 'Erro ao carregar custos',
              loadingCustos: false 
            })
          }
        } catch (error) {
          set({ 
            errorCustos: 'Erro na requisição',
            loadingCustos: false 
          })
        }
      },

      // Atualizar obra
      atualizarObra: (dados: Partial<ObraStore>) => {
        const currentObra = get().obra
        if (currentObra) {
          const obraAtualizada = { ...currentObra, ...dados }
          set({ 
            obra: obraAtualizada,
            lastUpdated: new Date().toISOString()
          })
        }
      },

      // Limpar obra
      limparObra: () => {
        set({
          obra: null,
          custosMensais: [],
          loading: false,
          loadingCustos: false,
          error: null,
          errorCustos: null,
          lastUpdated: null,
          lastCustosUpdated: null
        })
      }
    }),
    {
      name: 'obra-store',
      // Configuração do devtools para debug
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// Hook para debug do store
export const useObraStoreDebug = () => {
  const store = useObraStore()
  return store
}

// Função utilitária para debug dos custos
export const debugCustosMensais = (custos: CustoMensalStore[]) => {
  const resumo = custos.reduce((acc: any, custo: any) => {
    acc.totalOrcamento += custo.total_orcamento
    acc.totalRealizado += custo.valor_realizado
    acc.totalSaldo += custo.valor_saldo
    acc.porMes[custo.mes] = (acc.porMes[custo.mes] || 0) + custo.total_orcamento
    acc.porTipo[custo.tipo] = (acc.porTipo[custo.tipo] || 0) + custo.total_orcamento
    return acc
  }, {
    totalOrcamento: 0,
    totalRealizado: 0,
    totalSaldo: 0,
    porMes: {} as Record<string, number>,
    porTipo: {} as Record<string, number>
  })
  
  return resumo
}
