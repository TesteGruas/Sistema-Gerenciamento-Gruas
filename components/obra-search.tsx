"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Building2, X, MapPin } from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend, ObraBackend } from "@/lib/api-obras"

interface ObraSearchProps {
  onObraSelect: (obra: any) => void
  selectedObra?: any
  placeholder?: string
  className?: string
}

export function ObraSearch({ 
  onObraSelect, 
  selectedObra, 
  placeholder = "Buscar obra por nome ou endereço...",
  className = ""
}: ObraSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar obras quando o termo de busca mudar
  useEffect(() => {
    const buscarObras = async () => {
      if (searchTerm.length < 2) {
        setObras([])
        setShowResults(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Buscar todas as obras e filtrar no frontend
        const response = await obrasApi.listar()
        
        if (response.success) {
          const obrasConvertidas = response.data.map(converterObraBackendParaFrontend)
          
          // Filtrar por nome, endereço ou cidade
          const obrasFiltradas = obrasConvertidas.filter(obra => 
            obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obra.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obra.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          
          setObras(obrasFiltradas.slice(0, 10)) // Limitar a 10 resultados
          setShowResults(true)
        } else {
          setError("Erro ao buscar obras")
          setObras([])
        }
      } catch (error) {
        console.error("Erro ao buscar obras:", error)
        setError("Erro ao buscar obras")
        setObras([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(buscarObras, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (obra: any) => {
    onObraSelect(obra)
    setSearchTerm("")
    setShowResults(false)
    setObras([])
  }

  const handleClear = () => {
    setSearchTerm("")
    setObras([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-green-100 text-green-700'
      case 'Planejamento':
        return 'bg-blue-100 text-blue-700'
      case 'Pausada':
        return 'bg-yellow-100 text-yellow-700'
      case 'Concluída':
        return 'bg-gray-100 text-gray-700'
      case 'Cancelada':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => {
            if (obras.length > 0) {
              setShowResults(true)
            }
          }}
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && (
        <Card className="absolute z-50 w-full mt-2 shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Buscando obras...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-red-600">
                {error}
              </div>
            ) : obras.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhuma obra encontrada
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {obras.map((obra) => (
                  <button
                    key={obra.id}
                    type="button"
                    onClick={() => handleSelect(obra)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                        <Building2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {obra.nome}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs flex-shrink-0 ${getStatusColor(obra.status)}`}
                          >
                            {obra.status}
                          </Badge>
                        </div>
                        
                        {obra.endereco && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {obra.endereco}, {obra.cidade} - {obra.estado}
                            </span>
                          </div>
                        )}
                        
                        {obra.clienteNome && (
                          <p className="text-xs text-gray-500 truncate">
                            Cliente: {obra.clienteNome}
                          </p>
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

export default ObraSearch

