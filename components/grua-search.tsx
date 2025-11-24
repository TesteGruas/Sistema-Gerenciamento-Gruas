"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Wrench, X, CheckCircle, AlertCircle } from "lucide-react"
import { gruasApi, converterGruaBackendParaFrontend, GruaBackend } from "@/lib/api-gruas"
import { InlineLoader } from "@/components/ui/loader"

interface GruaSearchProps {
  onGruaSelect: (grua: any) => void
  selectedGrua?: any
  placeholder?: string
  className?: string
  onlyAvailable?: boolean
}

export default function GruaSearch({ 
  onGruaSelect, 
  selectedGrua, 
  placeholder = "Digite para buscar ou clique para ver todas as gruas...",
  className = "",
  onlyAvailable = true
}: GruaSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar gruas quando o termo de busca mudar
  useEffect(() => {
    const buscarGruas = async () => {
      // Se o campo estiver vazio, não buscar automaticamente
      if (searchTerm.length === 0) {
        // Só mostrar resultados se o usuário já clicou no campo (showResults está true)
        if (!showResults) {
          setGruas([])
          return
        }
        
        // Se showResults está true, buscar todas as gruas disponíveis
        try {
          setLoading(true)
          setError(null)
          
          // Buscar gruas disponíveis
          const response = await gruasApi.listarGruas({ status: 'disponivel' })
          
          if (response.success) {
            let gruasConvertidas = response.data
            
            // Filtrar apenas disponíveis se solicitado
            if (onlyAvailable) {
              gruasConvertidas = gruasConvertidas.filter(grua => 
                grua.status === 'disponivel'
              )
            }
            
            setGruas(gruasConvertidas)
          } else {
            setGruas([])
            setShowResults(false)
          }
        } catch (err) {
          console.error('Erro ao buscar gruas:', err)
          setError('Erro ao buscar gruas')
          setGruas([])
          setShowResults(false)
        } finally {
          setLoading(false)
        }
        return
      }

      // Se o termo de busca for muito curto, não fazer nada
      if (searchTerm.length < 2) {
        setGruas([])
        setShowResults(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Buscar gruas disponíveis
        const response = await gruasApi.listarGruas({ status: 'disponivel' })
        
        if (response.success) {
          let gruasConvertidas = response.data
          
          // Filtrar por termo de busca
          gruasConvertidas = gruasConvertidas.filter(grua => 
            (grua.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (grua.modelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (grua.fabricante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (grua.capacidade || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
          
          // Filtrar apenas disponíveis se solicitado
          if (onlyAvailable) {
            gruasConvertidas = gruasConvertidas.filter(grua => 
              grua.status === 'disponivel'
            )
          }
          
          setGruas(gruasConvertidas)
          setShowResults(true)
        } else {
          setGruas([])
          setShowResults(false)
        }
      } catch (err) {
        console.error('Erro ao buscar gruas:', err)
        setError('Erro ao buscar gruas')
        setGruas([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(buscarGruas, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [searchTerm, onlyAvailable, showResults])

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

  const handleGruaSelect = (grua: any) => {
    onGruaSelect(grua)
    setSearchTerm("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    onGruaSelect(null)
    setSearchTerm("")
    setShowResults(false)
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status.toLowerCase()) {
      case 'disponível':
      case 'disponivel':
        return 'bg-green-100 text-green-800'
      case 'operacional':
        return 'bg-blue-100 text-blue-800'
      case 'manutenção':
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800'
      case 'vendida':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    if (!status) return <AlertCircle className="w-3 h-3" />
    
    switch (status.toLowerCase()) {
      case 'disponível':
      case 'disponivel':
        return <CheckCircle className="w-3 h-3" />
      case 'operacional':
        return <Wrench className="w-3 h-3" />
      case 'manutenção':
      case 'manutencao':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
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
          onClick={async () => {
            if (searchTerm.length === 0 && gruas.length === 0 && !showResults) {
              // Carregar gruas quando clicar no campo vazio
              setShowResults(true)
              try {
                setLoading(true)
                setError(null)
                
                // Buscar gruas disponíveis
                const response = await gruasApi.listarGruas({ status: 'disponivel' })
                
                if (response.success) {
                  let gruasConvertidas = response.data
                  
                  // Filtrar apenas disponíveis se solicitado
                  if (onlyAvailable) {
                    gruasConvertidas = gruasConvertidas.filter(grua => 
                      grua.status === 'disponivel'
                    )
                  }
                  
                  setGruas(gruasConvertidas)
                } else {
                  setGruas([])
                  setShowResults(false)
                }
              } catch (err) {
                console.error('Erro ao buscar gruas:', err)
                setError('Erro ao buscar gruas')
                setGruas([])
                setShowResults(false)
              } finally {
                setLoading(false)
              }
            }
          }}
          className="pl-10 pr-10"
          disabled={!!selectedGrua}
        />
        {loading && (
          <InlineLoader size="sm" />
        )}
        {selectedGrua && (
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

      {/* Grua selecionada */}
      {selectedGrua && (
        <div className="mt-2">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{selectedGrua.name}</p>
                    <p className="text-sm text-blue-700">
                      {selectedGrua.fabricante} {selectedGrua.modelo} - {selectedGrua.capacidade}
                    </p>
                    <p className="text-xs text-blue-600">
                      Tipo: {selectedGrua.tipo}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={getStatusColor(selectedGrua.status)}>
                    {getStatusIcon(selectedGrua.status)}
                    <span className="ml-1">{selectedGrua.status}</span>
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Selecionada
                  </Badge>
                </div>
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
            ) : gruas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma grua encontrada</p>
                <p className="text-xs">Tente buscar por nome, modelo ou fabricante</p>
              </div>
            ) : (
              <div className="divide-y">
                {gruas.map((grua) => (
                  <button
                    key={grua.id}
                    onClick={() => handleGruaSelect(grua)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{grua.name}</p>
                        <p className="text-sm text-gray-600">
                          {grua.fabricante} {grua.modelo} - {grua.capacidade}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(grua.status)}`}>
                            {getStatusIcon(grua.status)}
                            <span className="ml-1">{grua.status}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">{grua.tipo}</span>
                        </div>
                        {grua.localizacao && (
                          <p className="text-xs text-gray-500 mt-1">📍 {grua.localizacao}</p>
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
