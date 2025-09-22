"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, User, Building2, X } from "lucide-react"
import { clientesApi, converterClienteBackendParaFrontend, ClienteBackend } from "@/lib/api-clientes"

interface ClienteSearchProps {
  onClienteSelect: (cliente: any) => void
  selectedCliente?: any
  placeholder?: string
  className?: string
}

export default function ClienteSearch({ 
  onClienteSelect, 
  selectedCliente, 
  placeholder = "Buscar cliente por nome ou CNPJ...",
  className = ""
}: ClienteSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar clientes quando o termo de busca mudar
  useEffect(() => {
    const buscarClientes = async () => {
      if (searchTerm.length < 2) {
        setClientes([])
        setShowResults(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await clientesApi.buscarClientes(searchTerm)
        
        if (response.success) {
          const clientesConvertidos = response.data.map(converterClienteBackendParaFrontend)
          setClientes(clientesConvertidos)
          setShowResults(true)
        } else {
          setClientes([])
          setShowResults(false)
        }
      } catch (err) {
        console.error('Erro ao buscar clientes:', err)
        setError('Erro ao buscar clientes')
        setClientes([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(buscarClientes, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Fechar resultados quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClienteSelect = (cliente: any) => {
    onClienteSelect(cliente)
    setSearchTerm("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    onClienteSelect(null)
    setSearchTerm("")
    setShowResults(false)
  }

  const formatCNPJ = (cnpj: string) => {
    // Formatar CNPJ: 00.000.000/0000-00
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          disabled={!!selectedCliente}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
        {selectedCliente && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Cliente selecionado */}
      {selectedCliente && (
        <div className="mt-2">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedCliente.name}</p>
                    <p className="text-sm text-green-700">
                      CNPJ: {formatCNPJ(selectedCliente.cnpj)}
                    </p>
                    {selectedCliente.email && (
                      <p className="text-xs text-green-600">{selectedCliente.email}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Selecionado
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados da busca */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {error ? (
              <div className="p-4 text-center text-red-600">
                <p className="text-sm">{error}</p>
              </div>
            ) : clientes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhum cliente encontrado</p>
                <p className="text-xs">Tente buscar por nome ou CNPJ</p>
              </div>
            ) : (
              <div className="divide-y">
                {clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => handleClienteSelect(cliente)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cliente.name}</p>
                        <p className="text-sm text-gray-600">
                          CNPJ: {formatCNPJ(cliente.cnpj)}
                        </p>
                        {cliente.email && (
                          <p className="text-xs text-gray-500">{cliente.email}</p>
                        )}
                        {cliente.phone && (
                          <p className="text-xs text-gray-500">Tel: {cliente.phone}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
