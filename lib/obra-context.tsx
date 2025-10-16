"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { obrasApi, ObraBackend, converterObraBackendParaFrontend } from './api-obras'
import { custosMensaisApi } from './api-custos-mensais'
import { obrasDocumentosApi, DocumentoObra } from './api-obras-documentos'
import { obrasArquivosApi, ArquivoObra } from './api-obras-arquivos'

interface Obra {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  orcamento?: number
  status: string
  cliente?: {
    id: string
    nome: string
    email: string
    telefone: string
  }
  gruasVinculadas?: any[]
  custosMensais?: any[]
  documentos?: DocumentoObra[]
  arquivos?: ArquivoObra[]
}

interface ObraContextType {
  // Estado atual
  obra: Obra | null
  loading: boolean
  error: string | null
  
  // Estados específicos
  custosMensais: any[]
  todosCustosMensais: any[]
  documentos: DocumentoObra[]
  arquivos: ArquivoObra[]
  
  // Estados de loading
  loadingCustos: boolean
  loadingDocumentos: boolean
  loadingArquivos: boolean
  
  // Estados de erro
  errorCustos: string | null
  errorDocumentos: string | null
  errorArquivos: string | null
  
  // Ações
  carregarObra: (obraId: string) => Promise<void>
  carregarCustosMensais: () => Promise<void>
  carregarDocumentos: () => Promise<void>
  carregarArquivos: () => Promise<void>
  atualizarObra: (dados: Partial<Obra>) => void
  limparObra: () => void
}

const ObraContext = createContext<ObraContextType | undefined>(undefined)

export function ObraProvider({ children }: { children: ReactNode }) {
  // Estado principal
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados específicos
  const [custosMensais, setCustosMensais] = useState<any[]>([])
  const [todosCustosMensais, setTodosCustosMensais] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([])
  const [arquivos, setArquivos] = useState<ArquivoObra[]>([])
  
  // Estados de loading
  const [loadingCustos, setLoadingCustos] = useState(false)
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  
  // Estados de erro
  const [errorCustos, setErrorCustos] = useState<string | null>(null)
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null)
  const [errorArquivos, setErrorArquivos] = useState<string | null>(null)

  // Carregar obra principal
  const carregarObra = async (obraId: string) => {
    setLoading(true)
    setError(null)
    
    console.log('🔍 DEBUG - Carregando obra ID:', obraId)
    
    const response = await obrasApi.obterObra(parseInt(obraId))
    
    if (response.success && response.data) {
      const obraConvertida = converterObraBackendParaFrontend(response.data)
      setObra(obraConvertida)
      
      console.log('🔍 DEBUG - Obra carregada:', obraConvertida)
      
      // Carregar dados relacionados automaticamente
      await Promise.all([
        carregarCustosMensais(obraId),
        carregarDocumentos(obraId),
        carregarArquivos(obraId)
      ])
    } else {
      setError('Erro ao carregar obra')
    }
    
    setLoading(false)
  }

  // Carregar custos mensais
  const carregarCustosMensais = async (obraId?: string) => {
    const id = obraId || obra?.id
    if (!id) return
    
    setLoadingCustos(true)
    setErrorCustos(null)
    
    console.log('🔍 DEBUG - Carregando custos para obra ID:', id)
    
    const response = await custosMensaisApi.listarPorObra(parseInt(id))
    
    if (response.success && response.data) {
      setTodosCustosMensais(response.data)
      setCustosMensais(response.data)
      
      console.log('🔍 DEBUG - Custos carregados:', response.data.length)
    } else {
      setErrorCustos('Erro ao carregar custos')
    }
    
    setLoadingCustos(false)
  }

  // Carregar documentos
  const carregarDocumentos = async (obraId?: string) => {
    const id = obraId || obra?.id
    if (!id) return
    
    setLoadingDocumentos(true)
    setErrorDocumentos(null)
    
    console.log('🔍 DEBUG - Carregando documentos para obra ID:', id)
    
    const response = await obrasDocumentosApi.listarPorObra(parseInt(id))
    
    if (response.success && response.data) {
      setDocumentos(response.data)
      
      console.log('🔍 DEBUG - Documentos carregados:', response.data.length)
    } else {
      setErrorDocumentos('Erro ao carregar documentos')
    }
    
    setLoadingDocumentos(false)
  }

  // Carregar arquivos
  const carregarArquivos = async (obraId?: string) => {
    const id = obraId || obra?.id
    if (!id) return
    
    setLoadingArquivos(true)
    setErrorArquivos(null)
    
    console.log('🔍 DEBUG - Carregando arquivos para obra ID:', id)
    
    const response = await obrasArquivosApi.listarPorObra(parseInt(id))
    
    if (response.success && response.data) {
      setArquivos(response.data)
      
      console.log('🔍 DEBUG - Arquivos carregados:', response.data.length)
    } else {
      setErrorArquivos('Erro ao carregar arquivos')
    }
    
    setLoadingArquivos(false)
  }

  // Atualizar obra
  const atualizarObra = (dados: Partial<Obra>) => {
    if (obra) {
      setObra({ ...obra, ...dados })
    }
  }

  // Limpar obra
  const limparObra = () => {
    setObra(null)
    setCustosMensais([])
    setTodosCustosMensais([])
    setDocumentos([])
    setArquivos([])
    setError(null)
    setErrorCustos(null)
    setErrorDocumentos(null)
    setErrorArquivos(null)
  }

  const value: ObraContextType = {
    // Estado atual
    obra,
    loading,
    error,
    
    // Estados específicos
    custosMensais,
    todosCustosMensais,
    documentos,
    arquivos,
    
    // Estados de loading
    loadingCustos,
    loadingDocumentos,
    loadingArquivos,
    
    // Estados de erro
    errorCustos,
    errorDocumentos,
    errorArquivos,
    
    // Ações
    carregarObra,
    carregarCustosMensais,
    carregarDocumentos,
    carregarArquivos,
    atualizarObra,
    limparObra
  }

  return (
    <ObraContext.Provider value={value}>
      {children}
    </ObraContext.Provider>
  )
}

export function useObra() {
  const context = useContext(ObraContext)
  if (context === undefined) {
    throw new Error('useObra deve ser usado dentro de um ObraProvider')
  }
  return context
}

export default ObraContext
