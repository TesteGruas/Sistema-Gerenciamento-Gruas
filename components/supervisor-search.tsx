"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Shield, X, CheckCircle, AlertCircle } from "lucide-react"
import { obrasApi } from "@/lib/api-obras"
import { InlineLoader } from "@/components/ui/loader"

interface SupervisorSearchProps {
  onSupervisorSelect: (supervisor: any) => void
  selectedSupervisor?: any
  placeholder?: string
  className?: string
  obraId?: number // Para filtrar supervisores já vinculados a esta obra
}

export function SupervisorSearch({ 
  onSupervisorSelect, 
  selectedSupervisor, 
  placeholder = "Buscar supervisor por nome ou email...",
  className = "",
  obraId
}: SupervisorSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [supervisores, setSupervisores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar supervisores quando o termo de busca mudar
  useEffect(() => {
    const buscarSupervisores = async () => {
      if (searchTerm.length < 2) {
        setSupervisores([])
        setShowResults(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Buscar supervisores
        const response = await obrasApi.listarSupervisores(searchTerm)
        
        if (response.success) {
          // Filtrar supervisores já vinculados a esta obra (se obraId fornecido)
          let supervisoresFiltrados = response.data || []
          
          if (obraId) {
            // Buscar supervisores já vinculados a esta obra
            const funcionariosResponse = await obrasApi.buscarFuncionariosVinculados(obraId)
            if (funcionariosResponse.success) {
              const idsVinculados = funcionariosResponse.data
                .filter((f: any) => f.isSupervisor)
                .map((f: any) => f.funcionarioId)
              
              supervisoresFiltrados = supervisoresFiltrados.filter(
                (s: any) => !idsVinculados.includes(s.id)
              )
            }
          }
          
          setSupervisores(supervisoresFiltrados)
          setShowResults(true)
        } else {
          console.log('❌ Erro na resposta da API:', response)
          setSupervisores([])
          setShowResults(false)
        }
      } catch (err) {
        console.error('Erro ao buscar supervisores:', err)
        setError("Erro ao buscar supervisores")
        setSupervisores([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(buscarSupervisores, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [searchTerm, obraId])

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

  const handleSupervisorSelect = (supervisor: any) => {
    onSupervisorSelect(supervisor)
    setSearchTerm("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    onSupervisorSelect(null)
    setSearchTerm("")
    setShowResults(false)
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={selectedSupervisor ? selectedSupervisor.nome : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (selectedSupervisor) {
              handleClearSelection()
            }
          }}
          onFocus={() => {
            if (supervisores.length > 0 && searchTerm.length >= 2) {
              setShowResults(true)
            }
          }}
          className="pl-10 pr-10"
          disabled={!!selectedSupervisor}
        />
        {selectedSupervisor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-2">
          <div className="flex items-center justify-center py-2">
            <InlineLoader size="sm" />
            <span className="ml-2 text-sm text-gray-600">Buscando supervisores...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-red-200 rounded-md shadow-lg p-2">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {showResults && !loading && !error && (
        <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {supervisores.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhum supervisor encontrado
              </div>
            ) : (
              <div className="divide-y">
                {supervisores.map((supervisor) => (
                  <button
                    key={supervisor.id}
                    type="button"
                    onClick={() => handleSupervisorSelect(supervisor)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{supervisor.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            Supervisor
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{supervisor.email}</div>
                          {supervisor.telefone && (
                            <div>{supervisor.telefone}</div>
                          )}
                          {supervisor.obras && supervisor.obras.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Vinculado a {supervisor.obras.length} obra(s)
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedSupervisor?.id === supervisor.id && (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSupervisor && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{selectedSupervisor.nome}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedSupervisor.email}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
