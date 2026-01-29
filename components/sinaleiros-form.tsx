"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, User, FileText, Shield, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sinaleirosApi, type SinaleiroBackend } from "@/lib/api-sinaleiros"
import { DocumentosSinaleiroList } from "./documentos-sinaleiro-list"
import { FuncionarioSearch } from "./funcionario-search"
import { funcionariosApi } from "@/lib/api-funcionarios"

// Interface local compatível com backend
export interface Sinaleiro {
  id: string
  obra_id: number
  nome: string
  rg_cpf: string
  cpf?: string
  rg?: string
  telefone?: string
  email?: string
  tipo: 'principal' | 'reserva'
  tipo_vinculo?: 'interno' | 'cliente'
  cliente_informou?: boolean
  documentos?: any[]
  certificados?: any[]
}

interface SinaleirosFormProps {
  obraId?: number
  sinaleiros?: Sinaleiro[]
  onSave: (sinaleiros: Sinaleiro[]) => void
  readOnly?: boolean
  clientePodeEditar?: boolean
}

export function SinaleirosForm({
  obraId,
  sinaleiros: initialSinaleiros,
  onSave,
  readOnly = false,
  clientePodeEditar = false
}: SinaleirosFormProps) {
  const { toast } = useToast()
  const [sinaleiros, setSinaleiros] = useState<Sinaleiro[]>(initialSinaleiros || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (obraId && !initialSinaleiros) {
      loadSinaleiros()
    }
  }, [obraId])

  // Atualizar estado quando initialSinaleiros mudar (dados salvos)
  useEffect(() => {
    // Só atualizar se initialSinaleiros for fornecido e tiver dados
    if (initialSinaleiros && initialSinaleiros.length > 0) {
      // Converter para o formato esperado pelo componente
      const sinaleirosConvertidos = initialSinaleiros.map(s => ({
        id: s.id,
        obra_id: s.obra_id || 0,
        nome: s.nome || '',
        rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
        cpf: s.cpf || s.rg_cpf || '',
        rg: s.rg || s.rg_cpf || '',
        telefone: s.telefone || '',
        email: s.email || '',
        tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva'),
        tipo_vinculo: s.tipo_vinculo || (s.tipo === 'principal' ? 'interno' : 'cliente'),
        cliente_informou: s.cliente_informou || (s.tipo === 'reserva'),
        documentos: s.documentos || [],
        certificados: s.certificados || []
      }))
      setSinaleiros(sinaleirosConvertidos)
    }
    // Se initialSinaleiros for undefined, null ou array vazio, não fazer nada (manter estado atual)
    // Isso evita limpar quando o componente é re-renderizado
  }, [initialSinaleiros])

  const loadSinaleiros = async () => {
    if (!obraId) return
    setLoading(true)
    try {
      const response = await sinaleirosApi.listarPorObra(obraId)
      if (response.success && response.data) {
        // Converter SinaleiroBackend para Sinaleiro
        const sinaleirosConvertidos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          id: s.id,
          obra_id: s.obra_id,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          telefone: s.telefone || '',
          email: s.email,
          tipo: s.tipo,
          cliente_informou: false, // Campo não existe no backend, manter compatibilidade
          documentos: []
        }))
        setSinaleiros(sinaleirosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar sinaleiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Garantir que sempre existam 2 sinaleiros: interno e cliente
  // IMPORTANTE: Só executar se não houver initialSinaleiros (para não sobrescrever dados salvos)
  useEffect(() => {
    // Se houver initialSinaleiros, não criar sinaleiros vazios (eles já vêm do estado salvo)
    if (initialSinaleiros && initialSinaleiros.length > 0) {
      return
    }
    
    const temInterno = sinaleiros.some(s => s.tipo_vinculo === 'interno')
    const temCliente = sinaleiros.some(s => s.tipo_vinculo === 'cliente')
    
    if (temInterno && temCliente) {
      return // Já tem ambos, não precisa fazer nada
    }
    
    const novos: Sinaleiro[] = [...sinaleiros]
    
    if (!temInterno) {
      novos.push({
        id: `interno_${Date.now()}`,
        obra_id: obraId || 0,
        nome: '',
        rg_cpf: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        tipo: 'principal',
        tipo_vinculo: 'interno',
        cliente_informou: false,
        documentos: [],
        certificados: []
      })
    }
    
    if (!temCliente) {
      novos.push({
        id: `cliente_${Date.now()}`,
        obra_id: obraId || 0,
        nome: '',
        rg_cpf: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        tipo: 'reserva',
        tipo_vinculo: 'cliente',
        cliente_informou: true,
        documentos: [],
        certificados: []
      })
    }
    
    setSinaleiros(novos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, initialSinaleiros])

  const handleAddSinaleiro = () => {
    if (sinaleiros.length >= 2) {
      toast({
        title: "Limite atingido",
        description: "Apenas 2 sinaleiros permitidos (Interno + Indicado pelo Cliente)",
        variant: "destructive"
      })
      return
    }
  }

  const handleRemoveSinaleiro = (id: string) => {
    // Permitir remover sinaleiros (não são mais obrigatórios)
    setSinaleiros(prevSinaleiros => prevSinaleiros.filter(s => s.id !== id))
  }

  const handleUpdateSinaleiro = (id: string, field: keyof Sinaleiro, value: any) => {
    console.log(`🔄 Atualizando sinaleiro ${id}, campo ${field} com valor:`, value)
    setSinaleiros(prevSinaleiros => {
      const updated = prevSinaleiros.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
      console.log('📋 Sinaleiros atualizados:', updated)
      return updated
    })
  }

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir submit do formulário pai
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Validar sinaleiros que foram preenchidos parcialmente
    const sinaleirosPreenchidos = sinaleiros.filter(s => s.nome && s.nome.trim() !== '')
    const camposFaltando: string[] = []
    
    for (let i = 0; i < sinaleirosPreenchidos.length; i++) {
      const sinaleiro = sinaleirosPreenchidos[i]
      if (!sinaleiro.nome || !sinaleiro.nome.trim()) {
        camposFaltando.push(`Nome do sinaleiro ${i + 1}`)
      }
      // Se for sinaleiro cliente, validar CPF/RG
      if (sinaleiro.tipo_vinculo === 'cliente' && !sinaleiro.cpf && !sinaleiro.rg && !sinaleiro.rg_cpf) {
        camposFaltando.push(`CPF/RG do sinaleiro ${i + 1}`)
      }
    }
    
    if (camposFaltando.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${camposFaltando.join(', ')}`,
        variant: "destructive"
      })
      return
    }
    
    // Validar documentos completos para sinaleiros externos (cliente)
    // Apenas validar se o sinaleiro já foi salvo (tem UUID válido)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (cliente && cliente.id && uuidRegex.test(cliente.id)) {
      try {
        const validacao = await sinaleirosApi.validarDocumentosCompletos(cliente.id)
        if (!validacao.completo) {
          const documentosFaltando = validacao.documentosFaltando || []
          const nomesDocumentos: Record<string, string> = {
            'rg_frente': 'RG (Frente)',
            'rg_verso': 'RG (Verso)',
            'comprovante_vinculo': 'Comprovante de Vínculo'
          }
          const nomesFaltando = documentosFaltando.map(tipo => nomesDocumentos[tipo] || tipo).join(', ')
          
          toast({
            title: "Documentos Incompletos",
            description: `O sinaleiro "${cliente.nome}" não pode ser vinculado à obra. Documentos faltando: ${nomesFaltando}. Complete o cadastro pelo RH antes de vincular à obra.`,
            variant: "destructive"
          })
          return
        }
      } catch (error: any) {
        // Se a validação falhar, permitir continuar mas avisar
        console.warn('Erro ao validar documentos do sinaleiro:', error)
        toast({
          title: "Aviso",
          description: "Não foi possível validar os documentos do sinaleiro. Verifique se todos os documentos obrigatórios estão completos.",
          variant: "default"
        })
      }
    }

    setLoading(true)
    try {
      // Converter Sinaleiro para formato do backend
      // Remover IDs temporários (interno_*, cliente_*, new_*) - apenas UUIDs válidos ou undefined
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      // Filtrar apenas sinaleiros com nome preenchido (sinaleiros não são mais obrigatórios, mas se preenchidos devem ter nome)
      const sinaleirosParaEnviar = sinaleiros
        .filter(s => s.nome && s.nome.trim() !== '') // Apenas sinaleiros com nome
        .map(s => {
          // Se o ID não é um UUID válido, enviar como undefined (criar novo)
          const idValido = s.id && uuidRegex.test(s.id) ? s.id : undefined
          
          return {
            id: idValido,
            nome: s.nome,
            rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
            telefone: s.telefone,
            email: s.email,
            tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva')
          }
        })
      
      console.log('📤 Enviando sinaleiros para o backend:', sinaleirosParaEnviar)
      console.log('📤 Obra ID:', obraId)

      // Se não tiver obraId, apenas salvar no estado local (página de nova obra)
      if (!obraId) {
        // Converter para formato do componente antes de salvar
        const sinaleirosSalvos: Sinaleiro[] = sinaleirosParaEnviar.map(s => ({
          id: s.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          obra_id: 0,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          cpf: s.rg_cpf, // Assumir que rg_cpf pode ser CPF
          rg: s.rg_cpf, // Assumir que rg_cpf pode ser RG
          telefone: s.telefone || '',
          email: s.email || '',
          tipo: s.tipo,
          tipo_vinculo: s.tipo === 'principal' ? 'interno' : 'cliente',
          cliente_informou: s.tipo === 'reserva',
          documentos: [],
          certificados: []
        }))

        toast({
          title: "Sucesso",
          description: "Sinaleiros salvos localmente. Serão enviados ao criar a obra."
        })

        setSinaleiros(sinaleirosSalvos)
        onSave(sinaleirosSalvos)
        setLoading(false)
        return
      }

      // Salvar via API (apenas quando já existe obraId - edição de obra existente)
      const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
      
      if (response.success && response.data) {
        // Converter resposta para formato do componente
        const sinaleirosSalvos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          id: s.id,
          obra_id: s.obra_id,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          telefone: s.telefone || '',
          email: s.email,
          tipo: s.tipo,
          cliente_informou: false,
          documentos: []
        }))

        toast({
          title: "Sucesso",
          description: "Sinaleiros salvos com sucesso"
        })

        setSinaleiros(sinaleirosSalvos)
        onSave(sinaleirosSalvos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar sinaleiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const canEdit = !readOnly && (clientePodeEditar || true)

  if (!sinaleiros || sinaleiros.length === 0) {
    return <div className="space-y-4">Carregando sinaleiros...</div>
  }

  return (
    <div className="space-y-4">
      {sinaleiros.map((sinaleiro, index) => (
        <div key={sinaleiro.id} className="space-y-4">
          {/* Cabeçalho do sinaleiro */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <h3 className="font-semibold text-base">
                {sinaleiro.tipo_vinculo === 'interno' ? 'Sinaleiro Interno' : 'Sinaleiro Indicado pelo Cliente'}
              </h3>
              <Badge variant={sinaleiro.tipo_vinculo === 'interno' ? 'default' : 'outline'}>
                {sinaleiro.tipo_vinculo === 'interno' ? 'Interno' : 'Cliente'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {/* Busca de funcionário para sinaleiro interno */}
            {sinaleiro.tipo_vinculo === 'interno' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Buscar Funcionário (Sinaleiro)
                </Label>
                <FuncionarioSearch
                  onFuncionarioSelect={(funcionario) => {
                    if (funcionario) {
                      // Preencher campos automaticamente com dados do funcionário
                      handleUpdateSinaleiro(sinaleiro.id, 'nome', funcionario.name || '')
                      handleUpdateSinaleiro(sinaleiro.id, 'telefone', funcionario.phone || '')
                      handleUpdateSinaleiro(sinaleiro.id, 'email', funcionario.email || '')
                      
                      // Preencher CPF se disponível
                      if (funcionario.cpf) {
                        const cpfLimpo = funcionario.cpf.replace(/\D/g, '')
                        if (cpfLimpo.length === 11) {
                          const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                          handleUpdateSinaleiro(sinaleiro.id, 'cpf', cpfFormatado)
                          handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', cpfFormatado)
                        } else {
                          handleUpdateSinaleiro(sinaleiro.id, 'cpf', funcionario.cpf)
                          handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', funcionario.cpf)
                        }
                      }
                      
                      // Buscar RG dos documentos do funcionário
                      if (funcionario.id) {
                        funcionariosApi.listarDocumentosFuncionario(parseInt(funcionario.id))
                          .then((response) => {
                            if (response.success && response.data) {
                              const docRG = response.data.find((doc: any) => doc.tipo === 'rg')
                              if (docRG && docRG.numero) {
                                const rgLimpo = docRG.numero.replace(/\D/g, '')
                                if (rgLimpo.length <= 9) {
                                  const rgFormatado = rgLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                                  handleUpdateSinaleiro(sinaleiro.id, 'rg', rgFormatado)
                                } else {
                                  handleUpdateSinaleiro(sinaleiro.id, 'rg', docRG.numero)
                                }
                              }
                            }
                          })
                          .catch((error) => {
                            console.error('Erro ao buscar documentos do funcionário:', error)
                          })
                      }
                      
                      toast({
                        title: "Funcionário selecionado",
                        description: `Dados de ${funcionario.name} preenchidos automaticamente`,
                      })
                    }
                  }}
                  allowedRoles={['Sinaleiro']}
                  onlyActive={true}
                  placeholder="Buscar funcionário com cargo Sinaleiro..."
                  className="w-full"
                />
              </div>
            )}

            {/* Mensagem para sinaleiro cliente */}
            {sinaleiro.tipo_vinculo === 'cliente' && (
              <div className="p-2 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">Este sinaleiro pode ser editado pelo cliente</p>
              </div>
            )}

            {/* Campos do formulário - apenas para sinaleiro cliente */}
            {sinaleiro.tipo_vinculo === 'cliente' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Nome
                  </Label>
                  <Input
                    value={sinaleiro.nome}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'nome', e.target.value)}
                    placeholder="Nome completo"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>
                    CPF <span className="text-xs text-gray-500">(ou RG)</span>
                  </Label>
                  <Input
                    value={sinaleiro.cpf || sinaleiro.rg_cpf || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 11) {
                        formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'cpf', formatted)
                      if (!sinaleiro.cpf) {
                        handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', formatted)
                      }
                    }}
                    placeholder="000.000.000-00"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>
                    RG <span className="text-xs text-gray-500">(ou CPF)</span>
                  </Label>
                  <Input
                    value={sinaleiro.rg || sinaleiro.rg_cpf || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 9) {
                        formatted = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'rg', formatted)
                      if (!sinaleiro.rg) {
                        handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', formatted)
                      }
                    }}
                    placeholder="00.000.000-0"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={sinaleiro.telefone || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 10) {
                        formatted = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                      } else {
                        formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'telefone', formatted)
                    }}
                    placeholder="(11) 98765-4321"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={sinaleiro.email || ''}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'email', e.target.value)}
                    placeholder="email@example.com"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            )}

            {/* Mensagem informativa para sinaleiro interno após seleção */}
            {sinaleiro.tipo_vinculo === 'interno' && sinaleiro.nome && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Funcionário selecionado:</strong> {sinaleiro.nome}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Os dados do sinaleiro interno são preenchidos automaticamente a partir do cadastro de funcionários.
                </p>
              </div>
            )}

            {/* Documentos do Sinaleiro - Apenas para sinaleiros externos (cliente) com UUID válido */}
            {(() => {
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
              const idValido = sinaleiro.id && typeof sinaleiro.id === 'string'
              const naoTemporario = idValido && !sinaleiro.id.startsWith('cliente_') && !sinaleiro.id.startsWith('interno_') && !sinaleiro.id.startsWith('temp_') && !sinaleiro.id.startsWith('new_')
              const temUuidValido = naoTemporario && uuidRegex.test(sinaleiro.id)
              const ehExterno = sinaleiro.tipo_vinculo !== 'interno' && sinaleiro.tipo !== 'principal'
              
              if (!temUuidValido || !ehExterno) {
                return null
              }
              
              return (
                <div className="pt-3 border-t">
                  <DocumentosSinaleiroList
                    sinaleiroId={sinaleiro.id}
                    readOnly={!canEdit || clientePodeEditar}
                  />
                </div>
              )
            })()}
          </div>
        </div>
      ))}
    </div>
  )
}

