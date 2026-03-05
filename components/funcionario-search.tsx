"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, User, X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { funcionariosApi, converterFuncionarioBackendParaFrontend, FuncionarioBackend } from "@/lib/api-funcionarios"
import { InlineLoader } from "@/components/ui/loader"
import { formatarCargo } from "@/lib/utils/cargos-predefinidos"

// Array padrão de cargos permitidos (fora do componente para evitar recriação)
const DEFAULT_ALLOWED_ROLES = ['Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras', 'Auxiliar Operacional']

type FuncionarioSearchApiItem = FuncionarioBackend & {
  funcionario_id?: number | null
  perfil_usuario?: {
    id?: number
    nome?: string
    nivel_acesso?: number
  } | null
}

interface FuncionarioSearchProps {
  onFuncionarioSelect: (funcionario: any) => void
  selectedFuncionario?: any
  placeholder?: string
  className?: string
  onlyActive?: boolean
  allowedRoles?: string[]
  onlyRealEmployees?: boolean
}

export function FuncionarioSearch({ 
  onFuncionarioSelect, 
  selectedFuncionario, 
  placeholder = "Buscar funcionário por nome ou cargo...",
  className = "",
  onlyActive = true,
  allowedRoles,
  onlyRealEmployees = false
}: FuncionarioSearchProps) {
  // Se allowedRoles não for fornecido ou for undefined, não filtrar por cargo (mostrar todos)
  // Se for um array vazio [], também não filtrar
  // Se for fornecido com valores, usar esses valores para filtrar
  const rolesFilter = allowedRoles !== undefined ? allowedRoles : null

  const normalizarTexto = (valor: string) =>
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()

  const [searchTerm, setSearchTerm] = useState("")
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar funcionários quando o termo de busca mudar
  useEffect(() => {
    const buscarFuncionarios = async () => {
      if (searchTerm.length < 2) {
        setFuncionarios([])
        setShowResults(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Buscar funcionários
        const cargoApi =
          rolesFilter !== null && rolesFilter.length === 1 ? rolesFilter[0] : undefined

        const response = await funcionariosApi.buscarFuncionarios(searchTerm, {
          status: onlyActive ? 'Ativo' : undefined,
          cargo: cargoApi,
          apenasFuncionarios: onlyRealEmployees
        })
        
        if (response.success) {
          console.log('🔍 Funcionários recebidos da API:', response.data)
          const funcionariosValidos = onlyRealEmployees
            ? (response.data as FuncionarioSearchApiItem[]).filter((funcionario) => {
                const perfilNome = normalizarTexto(funcionario.perfil_usuario?.nome || '')
                const cargoNormalizado = normalizarTexto(funcionario.cargo_info?.nome || funcionario.cargo || '')
                const temCargoValido = cargoNormalizado.length > 0

                // Evita retornar registros de Cliente/Responsável de obra no seletor de funcionários.
                if (perfilNome === 'cliente') return false

                return temCargoValido || funcionario.funcionario_id != null
              })
            : response.data

          let funcionariosConvertidos = funcionariosValidos.map(converterFuncionarioBackendParaFrontend)
          console.log('🔄 Funcionários convertidos:', funcionariosConvertidos)
          
          // Filtrar por cargos permitidos apenas se rolesFilter for fornecido e não vazio
          // Se rolesFilter for null ou array vazio, mostrar todos os funcionários
          if (rolesFilter !== null && rolesFilter.length > 0) {
            console.log('🎯 Cargos permitidos:', rolesFilter)
            console.log('🔍 Funcionários antes do filtro:', funcionariosConvertidos.map(f => ({ name: f.name, role: f.role })))
            funcionariosConvertidos = funcionariosConvertidos.filter(funcionario => {
              const funcionarioRole = normalizarTexto(funcionario.role || '')
              if (!funcionarioRole) return false
              const roleMatch = rolesFilter.some(allowedRole => {
                const allowedRoleLower = normalizarTexto(allowedRole)
                // Correspondência exata ou parcial: verifica se o cargo do funcionário contém o cargo permitido
                // Também verifica correspondência exata após normalização
                return funcionarioRole === allowedRoleLower || 
                       funcionarioRole.includes(allowedRoleLower)
              })
              console.log(`🔍 Funcionário ${funcionario.name} (${funcionario.role}) - Match: ${roleMatch}`)
              return roleMatch
            })
            console.log('✅ Funcionários após filtro:', funcionariosConvertidos)
          } else {
            console.log('✅ Mostrando todos os funcionários (sem filtro de cargo)')
          }
          
          setFuncionarios(funcionariosConvertidos)
          setShowResults(true)
        } else {
          console.log('❌ Erro na resposta da API:', response)
          setFuncionarios([])
          setShowResults(false)
        }
      } catch (err) {
        console.error('Erro ao buscar funcionários:', err)
        setError('Erro ao buscar funcionários')
        setFuncionarios([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(buscarFuncionarios, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [searchTerm, onlyActive, rolesFilter, onlyRealEmployees])

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

  const handleFuncionarioSelect = (funcionario: any) => {
    console.log('🎯 FuncionarioSearch: Funcionário selecionado:', funcionario)
    console.log('🎯 FuncionarioSearch: Chamando onFuncionarioSelect')
    onFuncionarioSelect(funcionario)
    setSearchTerm("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    onFuncionarioSelect(null)
    setSearchTerm("")
    setShowResults(false)
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'inativo':
        return 'bg-red-100 text-red-800'
      case 'férias':
      case 'ferias':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    if (!status) return <AlertCircle className="w-3 h-3" />
    
    switch (status.toLowerCase()) {
      case 'ativo':
        return <CheckCircle className="w-3 h-3" />
      case 'inativo':
        return <AlertCircle className="w-3 h-3" />
      case 'férias':
      case 'ferias':
        return <Clock className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getRoleColor = (role: string) => {
    if (!role) return 'bg-gray-100 text-gray-800'
    
    switch (role.toLowerCase()) {
      case 'operador':
        return 'bg-blue-100 text-blue-800'
      case 'sinaleiro':
        return 'bg-purple-100 text-purple-800'
      case 'técnico manutenção':
      case 'tecnico manutencao':
        return 'bg-orange-100 text-orange-800'
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-800'
      case 'mecânico':
      case 'mecanico':
        return 'bg-red-100 text-red-800'
      case 'engenheiro':
        return 'bg-green-100 text-green-800'
      case 'chefe de obras':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          className="pl-10 pr-10"
          disabled={!!selectedFuncionario}
        />
        {loading && (
          <InlineLoader size="sm" />
        )}
        {selectedFuncionario && (
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

      {/* Funcionário selecionado */}
      {selectedFuncionario && (
        <div className="mt-2">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedFuncionario.name}</p>
                    <p className="text-sm text-green-700">
                      {formatarCargo(selectedFuncionario.role || '')}
                    </p>
                    {selectedFuncionario.phone && (
                      <p className="text-xs text-green-600">Tel: {selectedFuncionario.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={getStatusColor(selectedFuncionario.status)}>
                    {getStatusIcon(selectedFuncionario.status)}
                    <span className="ml-1">{selectedFuncionario.status}</span>
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Selecionado
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
            ) : funcionarios.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhum funcionário encontrado</p>
                <p className="text-xs">Tente buscar por nome ou cargo</p>
              </div>
            ) : (
              <div className="divide-y">
                {funcionarios.map((funcionario) => (
                  <button
                    key={funcionario.id}
                    onClick={() => handleFuncionarioSelect(funcionario)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{funcionario.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(funcionario.role)}`}>
                            {formatarCargo(funcionario.role || '')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(funcionario.status)}`}>
                            {getStatusIcon(funcionario.status)}
                            <span className="ml-1">{funcionario.status}</span>
                          </Badge>
                        </div>
                        {funcionario.phone && (
                          <p className="text-xs text-gray-500 mt-1">📞 {funcionario.phone}</p>
                        )}
                        {funcionario.email && (
                          <p className="text-xs text-gray-500">✉️ {funcionario.email}</p>
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

export default FuncionarioSearch
