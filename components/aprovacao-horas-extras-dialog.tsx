"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, User, Building2, Search, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { funcionariosApi } from "@/lib/api-funcionarios"

interface Funcionario {
  id: number
  nome: string
  cargo?: string
  status?: string
  telefone?: string
  email?: string
}

interface Gestor {
  id: number
  nome: string
  cargo: string
  obra_id: number
  obra_nome: string
}

interface AprovacaoHorasExtrasDialogProps {
  isOpen: boolean
  onClose: () => void
  registro: any
}

export function AprovacaoHorasExtrasDialog({
  isOpen,
  onClose,
  registro
}: AprovacaoHorasExtrasDialogProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [gestorSelecionado, setGestorSelecionado] = useState<number | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)
  const [pesquisa, setPesquisa] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Reset do estado quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      setPesquisa("")
      setFuncionarioSelecionado(null)
      setGestorSelecionado(null)
      setObservacoes("")
      setShowResults(false)
      setError(null)
      // Carregar gestores da obra se disponível
      if (registro?.funcionario?.obra_atual_id) {
        carregarGestores(registro.funcionario.obra_atual_id)
      }
    }
  }, [isOpen, registro])

  const carregarGestores = async (obraId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ponto-eletronico/obras/${obraId}/gestores`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar gestores')
      }

      const result = await response.json()
      
      if (result.success) {
        setGestores(result.data)
      } else {
        throw new Error(result.message || 'Erro ao carregar gestores')
      }
    } catch (error) {
      console.error("Erro ao carregar gestores:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gestores da obra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Buscar gestores quando o termo de busca mudar
  useEffect(() => {
    const buscarGestores = async () => {
      if (pesquisa.length < 2) {
        setFuncionarios([])
        setShowResults(false)
        return
      }

      try {
        setLoadingFuncionarios(true)
        setError(null)
        
        console.log("🔍 Buscando gestores para:", pesquisa)
        const response = await funcionariosApi.buscarFuncionarios(pesquisa, {
          status: 'Ativo'
        })
        
        if (response.success) {
          console.log("📊 Gestores encontrados:", response.data)
          setFuncionarios(response.data || [])
          setShowResults(true)
        } else {
          console.log("❌ Erro na resposta da API:", response)
          setFuncionarios([])
          setShowResults(false)
        }
      } catch (err: any) {
        console.error("❌ Erro ao buscar gestores:", err)
        setError("Erro ao buscar gestores")
        setFuncionarios([])
        setShowResults(false)
      } finally {
        setLoadingFuncionarios(false)
      }
    }

    const timeoutId = setTimeout(buscarGestores, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [pesquisa])

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

  const handleGestorSelect = (funcionario: Funcionario) => {
    setGestorSelecionado(funcionario.id)
    setPesquisa("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    setGestorSelecionado(null)
    setPesquisa("")
    setShowResults(false)
  }

  const handleAprovar = async () => {
    if (!gestorSelecionado) {
      toast({
        title: "Atenção",
        description: "Selecione um gestor para aprovação",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/ponto-eletronico/registros/${registro.id}/enviar-aprovacao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gestor_id: gestorSelecionado,
          observacoes: observacoes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar para aprovação')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Horas extras enviadas para aprovação do gestor",
          variant: "default"
        })
        onClose()
      } else {
        throw new Error(result.message || 'Erro ao enviar para aprovação')
      }
    } catch (error: any) {
      console.error("Erro ao enviar para aprovação:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar para aprovação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!registro) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Aprovação de Horas Extras
          </DialogTitle>
          <DialogDescription>
            Envie as horas extras para aprovação do gestor responsável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{registro.funcionario?.nome}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data</Label>
                  <div className="mt-1">
                    <span className="text-sm">{new Date(registro.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Horas Trabalhadas</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{registro.horas_trabalhadas}h</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Horas Extras</Label>
                  <div className="mt-1">
                    <Badge className="bg-orange-100 text-orange-800">
                      +{registro.horas_extras}h
                    </Badge>
                  </div>
                </div>
              </div>
              
              {registro.funcionario?.obra_nome && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Obra</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{registro.funcionario.obra_nome}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção do Gestor */}
          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor Responsável *</Label>
            <div ref={searchRef} className="relative">
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar gestor por nome ou cargo..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={!!gestorSelecionado}
                />
                {loadingFuncionarios && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {gestorSelecionado && (
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

              {/* Gestor selecionado */}
              {gestorSelecionado && (
                <div className="mt-2">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              {funcionarios.find(f => f.id === gestorSelecionado)?.nome || 'Gestor selecionado'}
                            </p>
                            <p className="text-sm text-green-700">
                              {funcionarios.find(f => f.id === gestorSelecionado)?.cargo || 'Sem cargo definido'}
                            </p>
                            {funcionarios.find(f => f.id === gestorSelecionado)?.telefone && (
                              <p className="text-xs text-green-600">
                                Tel: {funcionarios.find(f => f.id === gestorSelecionado)?.telefone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
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
                        <p className="text-sm">Nenhum gestor encontrado</p>
                        <p className="text-xs">Tente buscar por nome ou cargo</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {funcionarios.map((funcionario) => (
                          <button
                            key={funcionario.id}
                            onClick={() => handleGestorSelect(funcionario)}
                            className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-gray-500" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{funcionario.nome}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                    {funcionario.cargo || 'Sem cargo definido'}
                                  </Badge>
                                  {funcionario.status && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                      {funcionario.status}
                                    </Badge>
                                  )}
                                </div>
                                {funcionario.telefone && (
                                  <p className="text-xs text-gray-500 mt-1">📞 {funcionario.telefone}</p>
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
            <p className="text-xs text-gray-500">
              Digite pelo menos 2 caracteres para buscar gestores
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre as horas extras..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAprovar} 
              disabled={loading || !gestorSelecionado}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Enviando..." : "Enviar para Aprovação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
