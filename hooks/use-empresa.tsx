"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"

export interface EmpresaData {
  id?: string
  nome: string
  razao_social: string
  cnpj: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  telefone: string
  email: string
  site: string
  horario_funcionamento?: string
  logo?: string
  created_at?: string
  updated_at?: string
}

// Dados mockados da empresa
const EMPRESA_DEFAULT: EmpresaData = {
  nome: "IRBANA COPAS",
  razao_social: "IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA",
  cnpj: "00.000.000/0001-00",
  endereco: "Rua Benevenuto Vieira",
  numero: "48",
  complemento: "",
  bairro: "Jardim Aeroporto",
  cidade: "ITU",
  estado: "SP",
  cep: "13306-141",
  telefone: "(11) 98818-5951",
  email: "info@gruascopa.com.br",
  site: "www.gruascopa.com.br",
  horario_funcionamento: "Segundas às Sextas-Feiras 8:00 - 12:00 ; 13:00 - 17:00",
  logo: "/logo.png"
}

interface EmpresaContextType {
  empresa: EmpresaData
  loading: boolean
  updateEmpresa: (data: Partial<EmpresaData>) => Promise<void>
  getEnderecoCompleto: () => string
  getContatoCompleto: () => string
  getHorarioFuncionamento: () => string
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaData>(EMPRESA_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadEmpresa()
  }, [])

  const loadEmpresa = async () => {
    try {
      if (typeof window === 'undefined') {
        setEmpresa(EMPRESA_DEFAULT)
        setLoading(false)
        return
      }

      // TODO: Quando API de empresa estiver disponível, buscar do backend
      // Tentar carregar do localStorage primeiro
      const stored = localStorage.getItem('empresa_data')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setEmpresa(parsed)
        } catch (parseError) {
          console.error('Erro ao parsear dados da empresa do localStorage:', parseError)
          setEmpresa(EMPRESA_DEFAULT)
        }
      } else {
        // Usar dados padrão se não houver no localStorage
        setEmpresa(EMPRESA_DEFAULT)
        localStorage.setItem('empresa_data', JSON.stringify(EMPRESA_DEFAULT))
      }

      // Futuro: Buscar da API quando disponível
      // try {
      //   const response = await fetch('/api/empresa')
      //   if (response.ok) {
      //     const data = await response.json()
      //     setEmpresa(data)
      //     localStorage.setItem('empresa_data', JSON.stringify(data))
      //   }
      // } catch (apiError) {
      //   console.warn('API de empresa não disponível, usando dados do localStorage', apiError)
      // }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
      setEmpresa(EMPRESA_DEFAULT)
    } finally {
      setLoading(false)
    }
  }

  const updateEmpresa = async (data: Partial<EmpresaData>) => {
    try {
      const updated = { ...empresa, ...data, updated_at: new Date().toISOString() }
      setEmpresa(updated)
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('empresa_data', JSON.stringify(updated))
      }
      
      // TODO: Quando API de empresa estiver disponível, salvar no backend
      // try {
      //   await fetch('/api/empresa', {
      //     method: 'PUT',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(updated)
      //   })
      // } catch (apiError) {
      //   console.warn('Erro ao salvar empresa na API, dados salvos apenas localmente', apiError)
      // }
    } catch (error) {
      console.error('Erro ao atualizar dados da empresa:', error)
      throw error
    }
  }

  const getEnderecoCompleto = () => {
    const parts = [
      empresa.endereco,
      empresa.numero,
      empresa.complemento,
      empresa.bairro,
      `${empresa.cidade}/${empresa.estado}`,
      `CEP: ${empresa.cep}`
    ].filter(Boolean)
    return parts.join(' – ')
  }

  const getContatoCompleto = () => {
    const parts = [
      empresa.telefone && `Tel: ${empresa.telefone}`,
      empresa.email && `Email: ${empresa.email}`,
      empresa.site && `Site: ${empresa.site}`
    ].filter(Boolean)
    return parts.join(' | ')
  }

  const getHorarioFuncionamento = () => {
    return empresa.horario_funcionamento || 'Segundas às Sextas-Feiras 8:00 - 12:00 ; 13:00 - 17:00'
  }

  return (
    <EmpresaContext.Provider
      value={{
        empresa,
        loading,
        updateEmpresa,
        getEnderecoCompleto,
        getContatoCompleto,
        getHorarioFuncionamento
      }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (context === undefined) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider')
  }
  return context
}

