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

  useEffect(() => {
    loadEmpresa()
  }, [])

  const loadEmpresa = async () => {
    try {
      // Por enquanto, usar dados mockados
      // No futuro, buscar do backend
      const stored = localStorage.getItem('empresa_data')
      if (stored) {
        setEmpresa(JSON.parse(stored))
      } else {
        setEmpresa(EMPRESA_DEFAULT)
        localStorage.setItem('empresa_data', JSON.stringify(EMPRESA_DEFAULT))
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
      setEmpresa(EMPRESA_DEFAULT)
    } finally {
      setLoading(false)
    }
  }

  const updateEmpresa = async (data: Partial<EmpresaData>) => {
    try {
      const updated = { ...empresa, ...data }
      setEmpresa(updated)
      localStorage.setItem('empresa_data', JSON.stringify(updated))
      
      // No futuro, salvar no backend
      // await empresaApi.atualizar(updated)
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

