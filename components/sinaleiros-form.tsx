"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react"
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
  funcionario_id?: number
  cliente_informou?: boolean
  documentos?: any[]
  certificados?: any[]
}

const inferirCpfRg = (documento?: string) => {
  const valor = (documento || '').trim()
  const digitos = valor.replace(/\D/g, '')

  if (!valor) return { cpf: '', rg: '' }
  // CPF padrão: 11 dígitos. Qualquer outro tamanho tratamos como RG.
  if (digitos.length === 11) return { cpf: valor, rg: '' }
  return { cpf: '', rg: valor }
}

const validarCpf = (cpf?: string) => {
  const digitos = (cpf || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.length === 11 ? '' : 'CPF deve conter 11 dígitos'
}

const validarRg = (rg?: string) => {
  const digitos = (rg || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.length >= 7 && digitos.length <= 11
    ? ''
    : 'RG deve conter entre 7 e 11 dígitos'
}

interface SinaleirosFormProps {
  obraId?: number
  sinaleiros?: Sinaleiro[]
  onSave: (sinaleiros: Sinaleiro[]) => void
  readOnly?: boolean
  clientePodeEditar?: boolean
}

export interface SinaleirosFormRef {
  getSinaleiros: () => Sinaleiro[]
}

export const SinaleirosForm = forwardRef<SinaleirosFormRef, SinaleirosFormProps>(({
  obraId,
  sinaleiros: initialSinaleiros,
  onSave,
  readOnly = false,
  clientePodeEditar = false
}, ref) => {
  const { toast } = useToast()
  const [sinaleiros, setSinaleiros] = useState<Sinaleiro[]>(initialSinaleiros || [])
  const [loading, setLoading] = useState(false)
  
  // Criar uma ref para o callback onSave para evitar problemas de closure
  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])
  
  // Expor método para obter sinaleiros atuais via ref
  useImperativeHandle(ref, () => ({
    getSinaleiros: () => {
      console.log('📤 getSinaleiros chamado - retornando:', sinaleiros.length)
      return sinaleiros
    }
  }))
  
  // Log inicial para debug
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎨 SINALEIROSFORM RENDERIZADO')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('   - Obra ID:', obraId || 'N/A (nova obra)')
  console.log('   - Initial Sinaleiros:', initialSinaleiros?.length || 0)
  console.log('   - Estado interno:', sinaleiros.length)
  console.log('   - ReadOnly:', readOnly)
  console.log('   - Cliente pode editar:', clientePodeEditar)
  console.log('   - onSave existe?', typeof onSave === 'function')

  useEffect(() => {
    if (obraId && !initialSinaleiros) {
      loadSinaleiros()
    }
  }, [obraId])

  // Atualizar estado quando initialSinaleiros mudar (dados salvos)
  useEffect(() => {
    console.log('🔄 useEffect - initialSinaleiros mudou:', {
      initialSinaleiros,
      length: initialSinaleiros?.length || 0,
      obraId: obraId || 'N/A',
      estadoAtual: sinaleiros.length
    })
    
    // IMPORTANTE: Se estamos criando uma nova obra (!obraId), não resetar o estado
    // apenas porque initialSinaleiros mudou. O estado interno é a fonte da verdade.
    if (obraId && initialSinaleiros && initialSinaleiros.length > 0) {
      console.log('📥 Atualizando estado a partir de initialSinaleiros (obra existente)')
      // Converter para o formato esperado pelo componente
      const sinaleirosConvertidos = initialSinaleiros.map(s => ({
        ...(() => {
          const inferido = inferirCpfRg(s.rg_cpf)
          return {
            cpf: s.cpf || inferido.cpf,
            rg: s.rg || inferido.rg
          }
        })(),
        id: s.id,
        obra_id: s.obra_id || 0,
        nome: s.nome || '',
        rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
        telefone: s.telefone || '',
        email: s.email || '',
        tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva'),
        tipo_vinculo: s.tipo_vinculo || (s.tipo === 'principal' ? 'interno' : 'cliente'),
        cliente_informou: s.cliente_informou || (s.tipo === 'reserva'),
        documentos: s.documentos || [],
        certificados: s.certificados || []
      }))
      console.log('✅ Estado atualizado:', sinaleirosConvertidos)
      setSinaleiros(sinaleirosConvertidos)
    } else if (!obraId) {
      console.log('ℹ️ Nova obra - mantendo estado interno (não resetar)')
      // Para nova obra, manter o estado interno e sincronizar com o pai quando necessário
      if (sinaleiros.length > 0) {
        console.log('💾 Sincronizando estado interno com estado pai:', sinaleiros.length)
        console.log('   - Dados:', JSON.stringify(sinaleiros, null, 2))
        try {
          const callback = onSaveRef.current || onSave
          callback(sinaleiros)
          console.log('✅ onSave chamado no useEffect')
        } catch (error) {
          console.error('❌ Erro ao chamar onSave no useEffect:', error)
        }
      }
    }
    // Se initialSinaleiros for undefined, null ou array vazio, não fazer nada (manter estado atual)
    // Isso evita limpar quando o componente é re-renderizado
  }, [initialSinaleiros, obraId])

  // Removido auto-save - os sinaleiros serão salvos apenas ao criar a obra
  // O estado local do componente é mantido, mas não é sincronizado com o estado pai até criar a obra

  const loadSinaleiros = async () => {
    if (!obraId) return
    setLoading(true)
    try {
      const response = await sinaleirosApi.listarPorObra(obraId)
      if (response.success && response.data) {
        // Converter SinaleiroBackend para Sinaleiro
        const sinaleirosConvertidos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          ...inferirCpfRg(s.rg_cpf),
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

  // Não forçar criação de sinaleiros - permitir que o usuário adicione quando necessário
  // Os sinaleiros são opcionais: pode ter apenas interno, apenas cliente, ambos ou nenhum

  const sincronizarComPaiAsync = (dados: Sinaleiro[]) => {
    if (obraId) return
    setTimeout(() => {
      try {
        const callback = onSaveRef.current || onSave
        callback([...dados])
      } catch (error) {
        console.error('❌ Erro ao sincronizar sinaleiros com estado pai:', error)
      }
    }, 0)
  }

  const handleAddSinaleiro = (tipo: 'interno' | 'cliente') => {
    console.log(`➕ Adicionando sinaleiro do tipo: ${tipo}`)
    console.log(`   - Obra ID: ${obraId || 'N/A (nova obra)'}`)
    let novosSinaleirosParaSincronizar: Sinaleiro[] | null = null

    setSinaleiros(prevSinaleiros => {
      console.log(`   - Sinaleiros atuais: ${prevSinaleiros.length}`)

      // Verificar se já existe um sinaleiro deste tipo (usando estado mais atual)
      const jaExiste = prevSinaleiros.some(s => s.tipo_vinculo === tipo)
      if (jaExiste) {
        console.log(`⚠️ Sinaleiro ${tipo} já existe`)
        toast({
          title: "Sinaleiro já existe",
          description: `Já existe um sinaleiro ${tipo === 'interno' ? 'interno' : 'indicado pelo cliente'}`,
          variant: "destructive"
        })
        return prevSinaleiros
      }

      // Verificar limite máximo de 2 sinaleiros
      if (prevSinaleiros.length >= 2) {
        console.log(`⚠️ Limite de sinaleiros atingido`)
        toast({
          title: "Limite atingido",
          description: "Apenas 2 sinaleiros permitidos (máximo: 1 Interno + 1 Indicado pelo Cliente)",
          variant: "destructive"
        })
        return prevSinaleiros
      }

      const novoSinaleiro: Sinaleiro = {
        id: `${tipo}_${Date.now()}`,
        obra_id: obraId || 0,
        nome: '',
        rg_cpf: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        tipo: tipo === 'interno' ? 'principal' : 'reserva',
        tipo_vinculo: tipo,
        cliente_informou: tipo === 'cliente',
        documentos: [],
        certificados: []
      }

      console.log('═══════════════════════════════════════════════════════════')
      console.log(`➕ ADICIONANDO NOVO SINALEIRO`)
      console.log('═══════════════════════════════════════════════════════════')
      console.log(`✅ Novo sinaleiro criado:`, novoSinaleiro)
      console.log(`   - Tipo: ${tipo}`)
      console.log(`   - Obra ID: ${obraId || 'N/A (nova obra)'}`)

      const novosSinaleiros = [...prevSinaleiros, novoSinaleiro]
      console.log(`📋 Total de sinaleiros após adicionar: ${novosSinaleiros.length}`)
      console.log(`💾 Estado atualizado com novo sinaleiro`)

      if (!obraId) {
        novosSinaleirosParaSincronizar = novosSinaleiros
      }

      return novosSinaleiros
    })

    if (novosSinaleirosParaSincronizar) {
      console.log('💾 Agendando sincronização do novo sinaleiro com estado pai')
      sincronizarComPaiAsync(novosSinaleirosParaSincronizar)
    } else {
      console.log('ℹ️ Obra ID existe, não sincronizando (será salvo via API)')
    }
  }

  const handleRemoveSinaleiro = (id: string) => {
    // Permitir remover sinaleiros (não são mais obrigatórios)
    let sinaleirosParaSincronizar: Sinaleiro[] | null = null
    setSinaleiros(prevSinaleiros => {
      const updated = prevSinaleiros.filter(s => s.id !== id)
      
      // Se não há obraId, sincronizar com estado pai (sem salvar na API)
      if (!obraId) {
        const sinaleirosComNome = updated.filter(s => s.nome && s.nome.trim() !== '')
        sinaleirosParaSincronizar = sinaleirosComNome
      }
      
      return updated
    })

    if (sinaleirosParaSincronizar) {
      console.log('💾 Agendando sincronização dos sinaleiros após remoção:', sinaleirosParaSincronizar.length)
      sincronizarComPaiAsync(sinaleirosParaSincronizar)
    }
  }

  const handleUpdateSinaleiro = (id: string, field: keyof Sinaleiro, value: any) => {
    console.log(`🔄 Atualizando sinaleiro ${id}, campo ${field} com valor:`, value)
    console.log(`   - Obra ID: ${obraId || 'N/A (nova obra)'}`)
    console.log(`   - Tipo de obraId: ${typeof obraId}`)
    console.log(`   - obraId é undefined? ${obraId === undefined}`)
    console.log(`   - obraId é null? ${obraId === null}`)
    console.log(`   - obraId é falsy? ${!obraId}`)
    console.log(`   - Vai sincronizar? ${!obraId}`)
    
    setSinaleiros(prevSinaleiros => {
      const updated = prevSinaleiros.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
      console.log('📋 Sinaleiros atualizados:', updated.length)
      
      // IMPORTANTE: Sempre sincronizar quando não há obraId (nova obra)
      // Chamar onSave DENTRO do setState para ter acesso ao estado atualizado
      const deveSincronizar = !obraId
      console.log(`🔍 Verificação de sincronização: obraId=${obraId}, deveSincronizar=${deveSincronizar}`)
      
      if (deveSincronizar) {
        console.log('═══════════════════════════════════════════════════════════')
        console.log('💾 SINCRONIZANDO SINALEIROS COM ESTADO PAI')
        console.log('═══════════════════════════════════════════════════════════')
        console.log('   - Quantidade:', updated.length)
        console.log('   - Dados:', JSON.stringify(updated, null, 2))
        console.log('   - onSaveRef.current existe?', !!onSaveRef.current)
        console.log('   - onSave existe?', typeof onSave === 'function')
        console.log('   - Chamando onSave callback...')
        
        // Chamar onSave após um pequeno delay para garantir que o estado foi atualizado
        // Usar onSaveRef para evitar problemas de closure
        setTimeout(() => {
          try {
            console.log('📞 Executando onSave callback com', updated.length, 'sinaleiros')
            const callback = onSaveRef.current || onSave
            console.log('   - Callback tipo:', typeof callback)
            if (typeof callback === 'function') {
              callback([...updated]) // Criar nova cópia do array
              console.log('✅ onSave executado com sucesso')
            } else {
              console.error('❌ Callback não é uma função!', callback)
            }
          } catch (error) {
            console.error('❌ Erro ao executar onSave:', error)
          }
        }, 10)
      } else {
        console.log('ℹ️ Obra ID existe (' + obraId + '), não sincronizando (será salvo via API)')
      }
      
      return updated
    })
  }

  const preencherSinaleiroClienteTeste = (id: string) => {
    const sufixo = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    const cpfTeste = '123.456.789-01'
    const rgTeste = '12.345.678-9'
    let sinaleirosAtualizadosParaSincronizar: Sinaleiro[] | null = null

    setSinaleiros(prevSinaleiros => {
      const atualizado = prevSinaleiros.map(s => {
        if (s.id !== id) return s
        return {
          ...s,
          nome: `Sinaleiro Indicado pelo Cliente - ${sufixo}`,
          cpf: cpfTeste,
          rg: rgTeste,
          rg_cpf: cpfTeste,
          telefone: '(11) 98765-4321',
          email: `sinaleiro.cliente.${Date.now().toString().slice(-6)}@email.com`
        }
      })

      if (!obraId) sinaleirosAtualizadosParaSincronizar = [...atualizado]

      return atualizado
    })

    if (sinaleirosAtualizadosParaSincronizar) {
      sincronizarComPaiAsync(sinaleirosAtualizadosParaSincronizar)
    }
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
      // Se for sinaleiro cliente, validar CPF/RG apenas se já existe obraId (edição)
      // Na criação de nova obra, permitir salvar sem CPF/RG (será validado depois)
      if (obraId && sinaleiro.tipo_vinculo === 'cliente' && !sinaleiro.cpf && !sinaleiro.rg && !sinaleiro.rg_cpf) {
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
    // IMPORTANTE: Apenas validar se já existe obraId (edição de obra existente)
    // Na criação de nova obra, não validar documentos ainda (serão validados depois)
    if (obraId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const sinaleirosCliente = sinaleirosPreenchidos.filter(s => 
        s.tipo_vinculo === 'cliente' && s.id && uuidRegex.test(s.id)
      )
      
      for (const sinaleiroCliente of sinaleirosCliente) {
        try {
          const validacao = await sinaleirosApi.validarDocumentosCompletos(sinaleiroCliente.id)
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
              description: `O sinaleiro "${sinaleiroCliente.nome}" não pode ser vinculado à obra. Documentos faltando: ${nomesFaltando}. Complete o cadastro pelo RH antes de vincular à obra.`,
              variant: "destructive"
            })
            return
          }
        } catch (error: any) {
          // Se a validação falhar, permitir continuar mas avisar
          console.warn('Erro ao validar documentos do sinaleiro:', error)
          toast({
            title: "Aviso",
            description: `Não foi possível validar os documentos do sinaleiro "${sinaleiroCliente.nome}". Verifique se todos os documentos obrigatórios estão completos.`,
            variant: "default"
          })
        }
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
            tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva'),
            funcionario_id: s.funcionario_id || undefined
          }
        })
      
      console.log('📤 Enviando sinaleiros para o backend:', sinaleirosParaEnviar)
      console.log('📤 Obra ID:', obraId)

      // Se não tiver obraId, apenas atualizar estado local (página de nova obra)
      // Os sinaleiros serão salvos apenas ao criar a obra
      if (!obraId) {
        // Converter para formato do componente antes de atualizar estado local
        const sinaleirosAtualizados: Sinaleiro[] = sinaleirosParaEnviar.map(s => ({
          ...inferirCpfRg(s.rg_cpf),
          id: s.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          obra_id: 0,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
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
          description: "Sinaleiros atualizados. Serão salvos ao criar a obra."
        })

        setSinaleiros(sinaleirosAtualizados)
        // Não chamar onSave aqui - será chamado apenas ao criar a obra
        setLoading(false)
        return
      }

      // Salvar via API (apenas quando já existe obraId - edição de obra existente)
      const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
      
      if (response.success && response.data) {
        // Converter resposta para formato do componente
        const sinaleirosSalvos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          ...inferirCpfRg(s.rg_cpf),
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

  const temInterno = sinaleiros.some(s => s.tipo_vinculo === 'interno')
  const temCliente = sinaleiros.some(s => s.tipo_vinculo === 'cliente')

  return (
    <div className="space-y-4">
      {/* Botões para adicionar sinaleiros */}
      {!readOnly && (
        <div className="flex gap-2 pb-4 border-b">
          {!temInterno && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddSinaleiro('interno')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Sinaleiro Interno
            </Button>
          )}
          {!temCliente && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddSinaleiro('cliente')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Sinaleiro do Cliente
            </Button>
          )}
        </div>
      )}

      {sinaleiros.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhum sinaleiro adicionado.</p>
          {!readOnly && (
            <p className="text-xs mt-1">Use os botões acima para adicionar sinaleiros.</p>
          )}
        </div>
      ) : (
        <div>
          {sinaleiros.map((sinaleiro, index) => (
            <div key={sinaleiro.id || `sinaleiro-${index}`} className="space-y-4">
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
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSinaleiro(sinaleiro.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
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
                      handleUpdateSinaleiro(sinaleiro.id, 'funcionario_id', Number(funcionario.id) || undefined)
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
                  onlyActive={true}
                  allowedRoles={['Sinaleiro']}
                  placeholder="Buscar funcionário..."
                  className="w-full"
                />
              </div>
            )}

            {/* Mensagem para sinaleiro cliente */}
            {sinaleiro.tipo_vinculo === 'cliente' && (
              <div className="p-2 bg-blue-50 rounded-md flex items-center justify-between gap-2">
                <p className="text-xs text-blue-700">Este sinaleiro pode ser editado pelo cliente</p>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => preencherSinaleiroClienteTeste(sinaleiro.id)}
                  >
                    Preencher teste
                  </Button>
                )}
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
                    onChange={(e) => {
                      console.log('📝 Input Nome alterado:', e.target.value)
                      handleUpdateSinaleiro(sinaleiro.id, 'nome', e.target.value)
                    }}
                    placeholder="Nome completo"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>
                    CPF <span className="text-xs text-gray-500">(ou RG)</span>
                  </Label>
                  {(() => {
                    const erroCpf = validarCpf(sinaleiro.cpf)
                    return (
                      <>
                  <Input
                    value={sinaleiro.cpf || ''}
                    onChange={(e) => {
                      console.log('📝 Input CPF alterado:', e.target.value)
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                      let formatted = value
                      if (value.length <= 11) {
                        formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'cpf', formatted)
                      // Documento canônico prioriza CPF quando informado; senão usa RG.
                      handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', formatted || (sinaleiro.rg || ''))
                    }}
                    placeholder="000.000.000-00"
                    disabled={!canEdit}
                    className={erroCpf ? 'border-red-500 focus-visible:ring-red-300' : undefined}
                  />
                      {erroCpf && (
                        <p className="text-xs text-red-600 mt-1">{erroCpf}</p>
                      )}
                    </>
                    )
                  })()}
                </div>

                <div>
                  <Label>
                    RG <span className="text-xs text-gray-500">(ou CPF)</span>
                  </Label>
                  {(() => {
                    const erroRg = validarRg(sinaleiro.rg)
                    return (
                      <>
                  <Input
                    value={sinaleiro.rg || ''}
                    onChange={(e) => {
                      console.log('📝 Input RG alterado:', e.target.value)
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                      let formatted = value
                      if (value.length <= 9) {
                        formatted = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'rg', formatted)
                      // Se não houver CPF, usa RG como documento canônico.
                      handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', (sinaleiro.cpf || '').trim() || formatted)
                    }}
                    placeholder="00.000.000-0"
                    disabled={!canEdit}
                    className={erroRg ? 'border-red-500 focus-visible:ring-red-300' : undefined}
                  />
                      {erroRg && (
                        <p className="text-xs text-red-600 mt-1">{erroRg}</p>
                      )}
                    </>
                    )
                  })()}
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={sinaleiro.telefone || ''}
                    onChange={(e) => {
                      console.log('📝 Input Telefone alterado:', e.target.value)
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
                    onChange={(e) => {
                      console.log('📝 Input Email alterado:', e.target.value)
                      handleUpdateSinaleiro(sinaleiro.id, 'email', e.target.value)
                    }}
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
      )}
    </div>
  )
})

SinaleirosForm.displayName = 'SinaleirosForm'

