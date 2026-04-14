"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { 
  Save, 
  X,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Shuffle,
  Plus,
  Trash2
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { getFuncionarioId } from "@/lib/get-funcionario-id"
import FuncionarioSearch from "@/components/funcionario-search"
import {
  criarChecklistItemCustomObra,
  listarChecklistItensCustomObra
} from "@/lib/api-obra-checklist-itens-custom"

interface Manutencao {
  id?: number
  grua_id: string
  data: string
  realizado_por_id: number
  realizado_por_nome?: string
  cargo?: string
  descricao?: string
  observacoes?: string
  created_at?: string
  checklist?: Record<string, boolean>
}

interface ChecklistItem {
  key: string
  label: string
  section: string
}

type ManutencaoExtraRow = {
  key: string
  label: string
  obra_item_id?: number
}

function keyObraCat(obraItemId: number) {
  return `obra_cat_${obraItemId}`
}

interface LivroGruaManutencaoProps {
  gruaId: string
  /** Itens extras do catálogo da obra (tipo manutenção; separado do checklist diário) */
  obraId?: number
  manutencao?: Manutencao
  onSave?: (manutencao: Manutencao) => void
  onCancel?: () => void
  modoEdicao?: boolean
  modoVisualizacao?: boolean
}

export function LivroGruaManutencao({
  gruaId,
  obraId,
  manutencao,
  onSave,
  onCancel,
  modoEdicao = false,
  modoVisualizacao = false
}: LivroGruaManutencaoProps) {
  const CHECKLIST_META_PREFIX = "__CHECKLIST_MANUTENCAO_JSON__:"

  const extrairChecklistDasObservacoes = (observacoes?: string) => {
    if (!observacoes) return null
    const idx = observacoes.indexOf(CHECKLIST_META_PREFIX)
    if (idx === -1) return null

    const jsonRaw = observacoes.slice(idx + CHECKLIST_META_PREFIX.length).trim()
    if (!jsonRaw) return null

    try {
      const parsed = JSON.parse(jsonRaw)
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, 'ok' | 'manutencao' | null>
      }
    } catch {
      // ignorar metadata inválida
    }
    return null
  }

  const limparChecklistDasObservacoes = (observacoes?: string) => {
    if (!observacoes) return ""
    const idx = observacoes.indexOf(CHECKLIST_META_PREFIX)
    if (idx === -1) return observacoes
    return observacoes.slice(0, idx).trim()
  }

  const montarObservacoesComChecklist = (
    observacoesTexto: string,
    checklistDetalhado: Record<string, 'ok' | 'manutencao' | null>
  ) => {
    const textoLimpo = limparChecklistDasObservacoes(observacoesTexto)
    const checklistJson = JSON.stringify(checklistDetalhado)
    return `${textoLimpo}\n\n${CHECKLIST_META_PREFIX}${checklistJson}`.trim()
  }

  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<any>(null)
  
  // Definir itens do checklist organizados por seções
  const checklistItems: ChecklistItem[] = [
    // Seção Eletricidade
    { key: 'tensao_maxima_alimentacao', label: 'Tensão máxima de alimentação', section: 'Eletricidade' },
    { key: 'conexoes_terras_restantes', label: 'Conexões terras restantes', section: 'Eletricidade' },
    { key: 'isolamento_cabos', label: 'Isolamento dos cabos', section: 'Eletricidade' },
    { key: 'isolamento_equipamentos_eletricos', label: 'Isolamento equipamentos elétricos', section: 'Eletricidade' },
    { key: 'reles_circuito', label: 'Relés em circuito', section: 'Eletricidade' },
    { key: 'isolamento_motores', label: 'Isolamento motores', section: 'Eletricidade' },
    { key: 'contatos_circuito', label: 'Contatos de circuito', section: 'Eletricidade' },
    { key: 'terminal_conexao_painel_parafuso', label: 'Terminal conexão onde painel e parafuso interno', section: 'Eletricidade' },
    { key: 'fixacao_geral', label: 'Fixação em geral', section: 'Eletricidade' },
    { key: 'limitador_elevacao', label: 'Limitador elevação', section: 'Eletricidade' },
    { key: 'limitador_carro', label: 'Limitador carro', section: 'Eletricidade' },
    { key: 'limitador_giro', label: 'Limitador giro', section: 'Eletricidade' },
    { key: 'limitador_carga', label: 'Limitador de carga', section: 'Eletricidade' },
    { key: 'limitador_momento', label: 'Limitador de momento', section: 'Eletricidade' },
    
    // Seção Maquinaria
    { key: 'nivel_saia_torre', label: 'Nível/saia da torre', section: 'Maquinaria' },
    { key: 'pinos_parafusos', label: 'Pinos e parafusos', section: 'Maquinaria' },
    { key: 'cuplites', label: 'Cuplites', section: 'Maquinaria' },
    { key: 'fissuras_estruturas', label: 'Fissuras em estruturas', section: 'Maquinaria' },
    { key: 'freio_elevacao', label: 'Freio elevação', section: 'Maquinaria' },
    { key: 'freio_giro', label: 'Freio giro', section: 'Maquinaria' },
    { key: 'freio_carro', label: 'Freio carro', section: 'Maquinaria' },
    { key: 'maquinaria', label: 'Maquinaria', section: 'Maquinaria' },
    { key: 'niveis_oleo_redutores', label: 'Níveis óleo redutores', section: 'Maquinaria' },
    { key: 'terminal_trava_gancho', label: 'Terminal trava gancho', section: 'Maquinaria' },
    { key: 'verificar_tensao_cabos', label: 'Verificar tensão cabos', section: 'Maquinaria' },
    { key: 'travoes_cabos', label: 'Travões de cabos', section: 'Maquinaria' },
    { key: 'ponto_rotativo_final_cabo_painel', label: 'Ponto rotativo final de cabo painel', section: 'Maquinaria' },
    { key: 'ventilador_bloqueio_dispositivo_24_cabos', label: 'Ventilador bloqueio dispositivo 24 cabos', section: 'Maquinaria' },
    
    // Seção Estrutura
    { key: 'porticos', label: 'Pórticos', section: 'Estrutura' },
    { key: 'contrapeso', label: 'Contrapeso', section: 'Estrutura' },
    
    // Seção Outros / Cabos / Componentes
    { key: 'cabos', label: 'Cabos', section: 'Outros / Cabos / Componentes' },
    { key: 'carro_giro', label: 'Carro de giro', section: 'Outros / Cabos / Componentes' },
    { key: 'engrenagem_giro', label: 'Engrenagem de giro', section: 'Outros / Cabos / Componentes' },
    { key: 'rodas_carro', label: 'Rodas do carro', section: 'Outros / Cabos / Componentes' },
    { key: 'sapatas_pivotantes', label: 'Sapatas pivotantes', section: 'Outros / Cabos / Componentes' },
  ]

  // Agrupar itens por seção
  const checklistPorSecao = checklistItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const checklistKeysFixos = useMemo(
    () => new Set(checklistItems.map((i) => i.key)),
    // checklistItems é estável em conteúdo; evita recalcular a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [checklist, setChecklist] = useState<Record<string, 'ok' | 'manutencao' | null>>({})
  const [extrasItens, setExtrasItens] = useState<ManutencaoExtraRow[]>([])
  const [novoItemLabel, setNovoItemLabel] = useState("")
  const [carregandoCatalogoObra, setCarregandoCatalogoObra] = useState(false)
  const [dialogNovoItemAberto, setDialogNovoItemAberto] = useState(false)
  const [labelPendenteAdicionar, setLabelPendenteAdicionar] = useState<string | null>(null)
  const [salvandoItemObra, setSalvandoItemObra] = useState(false)
  
  const [formData, setFormData] = useState<Manutencao>({
    grua_id: gruaId,
    data: new Date().toISOString().split('T')[0],
    realizado_por_id: 0,
    cargo: '',
    descricao: '',
    observacoes: '',
    checklist: {}
  })

  // Carregar dados da manutenção se estiver editando (+ lista sync de itens extras)
  useEffect(() => {
    if (manutencao) {
      const checklistObservacoes = extrairChecklistDasObservacoes(manutencao.observacoes)
      const checklistConvertido = manutencao.checklist
        ? (Object.entries(manutencao.checklist).reduce((acc, [key, value]) => {
            acc[key] = value ? 'ok' : null
            return acc
          }, {} as Record<string, 'ok' | 'manutencao' | null>))
        : {}
      const checklistInicial = checklistObservacoes || checklistConvertido

      setFormData({
        id: manutencao.id,
        grua_id: manutencao.grua_id,
        data: manutencao.data,
        realizado_por_id: manutencao.realizado_por_id,
        realizado_por_nome: manutencao.realizado_por_nome,
        cargo: manutencao.cargo || '',
        descricao: manutencao.descricao || '',
        observacoes: limparChecklistDasObservacoes(manutencao.observacoes || ''),
        created_at: manutencao.created_at,
        checklist: checklistInicial
      })

      setChecklist(checklistInicial)

      const extraKeys = Object.keys(checklistInicial).filter((k) => !checklistKeysFixos.has(k))
      setExtrasItens(
        extraKeys.map((k) => {
          const m = /^obra_cat_(\d+)$/.exec(k)
          return {
            key: k,
            label: m ? `Item #${m[1]}` : k,
            obra_item_id: m ? Number(m[1]) : undefined
          }
        })
      )

      if (manutencao.realizado_por_id) {
        setFuncionarioSelecionado({
          id: manutencao.realizado_por_id,
          name: manutencao.realizado_por_nome || '',
          role: manutencao.cargo || ''
        })
      }
    } else {
      setExtrasItens([])
      setChecklist({})
    }
  }, [manutencao, checklistKeysFixos])

  // Catálogo da obra: novos checklists recebem todos os itens salvos; em edição, inclui itens novos do catálogo
  useEffect(() => {
    let cancelled = false
    if (!obraId) return

    ;(async () => {
      try {
        setCarregandoCatalogoObra(true)
        const res = await listarChecklistItensCustomObra(obraId, "manutencao")
        if (cancelled) return
        const catalog = res.data || []
        const labelById = new Map(catalog.map((r) => [r.id, r.label]))

        if (modoVisualizacao) {
          setExtrasItens((prev) =>
            prev.map((e) => {
              if (e.obra_item_id != null && labelById.has(e.obra_item_id)) {
                return { ...e, label: labelById.get(e.obra_item_id)! }
              }
              return e
            })
          )
          return
        }

        if (manutencao) {
          setExtrasItens((prev) => {
            const mergedLabels = prev.map((e) => {
              if (e.obra_item_id != null && labelById.has(e.obra_item_id)) {
                return { ...e, label: labelById.get(e.obra_item_id)! }
              }
              return e
            })
            const keysHave = new Set(mergedLabels.map((e) => e.key))
            const novos = catalog
              .filter((r) => !keysHave.has(keyObraCat(r.id)))
              .map((r) => ({
                key: keyObraCat(r.id),
                label: r.label,
                obra_item_id: r.id
              }))
            return [...mergedLabels, ...novos]
          })
          setChecklist((prev) => {
            const n = { ...prev }
            for (const r of catalog) {
              const k = keyObraCat(r.id)
              if (n[k] === undefined) n[k] = null
            }
            return n
          })
        } else {
          setExtrasItens(
            catalog.map((r) => ({
              key: keyObraCat(r.id),
              label: r.label,
              obra_item_id: r.id
            }))
          )
          setChecklist((prev) => {
            const n = { ...prev }
            for (const r of catalog) {
              const k = keyObraCat(r.id)
              if (n[k] === undefined) n[k] = null
            }
            return n
          })
        }
      } catch (e) {
        console.error("Catálogo de checklist da obra (manutenção):", e)
        if (!cancelled) {
          toast({
            title: "Itens da obra",
            description: "Não foi possível carregar os itens adicionais salvos desta obra.",
            variant: "destructive"
          })
        }
      } finally {
        if (!cancelled) setCarregandoCatalogoObra(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [obraId, modoVisualizacao, manutencao?.id])

  // Nova manutenção: preencher automaticamente com funcionário logado no app
  useEffect(() => {
    const preencherFuncionarioLogado = async () => {
      if (manutencao || funcionarioSelecionado || formData.realizado_por_id) return
      if (typeof window === "undefined") return

      const userDataStr = localStorage.getItem("user_data")
      if (!userDataStr) return

      let parsedUser: any
      try {
        parsedUser = JSON.parse(userDataStr)
      } catch {
        return
      }

      const token = localStorage.getItem("access_token") || ""
      let funcionarioId: number | null =
        Number(parsedUser?.profile?.funcionario_id) ||
        Number(parsedUser?.funcionario_id) ||
        Number(parsedUser?.user_metadata?.funcionario_id) ||
        null

      if (token) {
        try {
          const resolved = await getFuncionarioId(parsedUser, token)
          if (resolved && resolved > 0) funcionarioId = resolved
        } catch {
          // fallback para IDs já presentes no user_data
        }
      }

      if (!funcionarioId || Number.isNaN(Number(funcionarioId)) || Number(funcionarioId) <= 0) return

      const nome =
        parsedUser?.nome ||
        parsedUser?.name ||
        parsedUser?.user_metadata?.nome ||
        parsedUser?.user?.nome ||
        ""
      const cargo =
        parsedUser?.cargo ||
        parsedUser?.role ||
        parsedUser?.user_metadata?.cargo ||
        parsedUser?.user_metadata?.role ||
        ""

      const funcionarioLogado = {
        id: Number(funcionarioId),
        name: nome || `Funcionário #${funcionarioId}`,
        role: cargo || ""
      }

      setFuncionarioSelecionado(funcionarioLogado)
      setFormData((prev) => ({
        ...prev,
        realizado_por_id: Number(funcionarioId),
        realizado_por_nome: funcionarioLogado.name,
        cargo: prev.cargo || funcionarioLogado.role || ""
      }))
      setError(null)
    }

    preencherFuncionarioLogado()
  }, [manutencao, funcionarioSelecionado, formData.realizado_por_id])

  const handleFuncionarioSelect = (funcionario: any) => {
    setFuncionarioSelecionado(funcionario)
    setFormData({
      ...formData,
      realizado_por_id: funcionario?.id || funcionario?.userId || 0,
      realizado_por_nome: funcionario?.name || '',
      cargo: funcionario?.role || ''
    })
  }

  const toggleChecklistItem = (key: string, status: 'ok' | 'manutencao' | null) => {
    const newChecklist = {
      ...checklist,
      [key]: checklist[key] === status ? null : status
    }
    setChecklist(newChecklist)
    setFormData({
      ...formData,
      checklist: newChecklist
    })
  }

  const fecharDialogNovoItem = () => {
    setDialogNovoItemAberto(false)
    setLabelPendenteAdicionar(null)
  }

  const solicitarAdicionarItemExtra = () => {
    const label = novoItemLabel.trim()
    if (!label) {
      toast({
        title: "Nome do item",
        description: "Digite o nome do item antes de adicionar.",
        variant: "destructive"
      })
      return
    }
    if (extrasItens.length >= 40) {
      toast({
        title: "Limite",
        description: "Máximo de 40 itens adicionais por checklist.",
        variant: "destructive"
      })
      return
    }
    const duplicado = extrasItens.some((e) => e.label.trim().toLowerCase() === label.toLowerCase())
    if (duplicado) {
      toast({
        title: "Item repetido",
        description: "Já existe um item com esse nome neste checklist.",
        variant: "destructive"
      })
      return
    }
    if (!obraId) {
      toast({
        title: "Obra não vinculada",
        description: "Abra a manutenção pelo detalhe da obra para salvar itens no catálogo reutilizável.",
        variant: "destructive"
      })
      return
    }
    setLabelPendenteAdicionar(label)
    setDialogNovoItemAberto(true)
  }

  const confirmarAdicionarItemExtra = async (status: 'ok' | 'manutencao' | null) => {
    const label = labelPendenteAdicionar
    if (!label || !obraId) {
      fecharDialogNovoItem()
      return
    }

    fecharDialogNovoItem()
    setNovoItemLabel("")

    try {
      setSalvandoItemObra(true)
      const res = await criarChecklistItemCustomObra(obraId, label, "manutencao")
      if (!res.success || !res.data) {
        throw new Error("Resposta inválida ao salvar item na obra")
      }
      const row = res.data
      const k = keyObraCat(row.id)
      setExtrasItens((prev) => [...prev, { key: k, label: row.label, obra_item_id: row.id }])
      setChecklist((prev) => ({ ...prev, [k]: status }))
      toast({
        title:
          status === "ok"
            ? "Item adicionado (OK)"
            : status === "manutencao"
              ? "Item adicionado (manutenção)"
              : "Item adicionado",
        description: "O item foi salvo no catálogo de manutenção desta obra."
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Erro ao salvar item",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSalvandoItemObra(false)
    }
  }

  const removerItemExtra = (key: string) => {
    setExtrasItens((prev) => prev.filter((e) => e.key !== key))
    setChecklist((prev) => {
      const n = { ...prev }
      delete n[key]
      return n
    })
  }

  const preencherDadosAleatorios = () => {
    if (modoVisualizacao) return

    const checklistAleatorio = checklistItems.reduce((acc, item) => {
      acc[item.key] = Math.random() < 0.5 ? 'ok' : 'manutencao'
      return acc
    }, {} as Record<string, 'ok' | 'manutencao' | null>)

    for (const ex of extrasItens) {
      checklistAleatorio[ex.key] = Math.random() < 0.5 ? 'ok' : 'manutencao'
    }

    const timestamp = new Date().toLocaleString('pt-BR')
    const descricaoAuto = `Manutenção preenchida automaticamente em ${timestamp}.`
    const observacoesAuto = 'Preenchimento automático para teste do fluxo.'

    setChecklist(checklistAleatorio)
    setFormData((prev) => ({
      ...prev,
      descricao: prev.descricao?.trim() ? prev.descricao : descricaoAuto,
      observacoes: prev.observacoes?.trim() ? prev.observacoes : observacoesAuto,
      checklist: checklistAleatorio
    }))
    setError(null)

    toast({
      title: "Preenchimento automático concluído",
      description: "Checklist marcado aleatoriamente e campos de texto preenchidos."
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modoVisualizacao) return
    
    if (!formData.data) {
      setError('Data é obrigatória')
      toast({
        title: "Erro",
        description: "Data é obrigatória",
        variant: "destructive"
      })
      return
    }

    if (!formData.realizado_por_id || formData.realizado_por_id === 0) {
      setError('Selecione o funcionário que realizou a manutenção')
      toast({
        title: "Erro",
        description: "Selecione o funcionário que realizou a manutenção",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para a API (schema backend exige data_entrada)
      const observacoesComChecklist = montarObservacoesComChecklist(formData.observacoes || '', checklist)
      const manutencaoData = {
        grua_id: formData.grua_id,
        funcionario_id: formData.realizado_por_id,
        data_entrada: formData.data,
        tipo_entrada: 'manutencao' as const,
        status_entrada: 'ok' as const,
        descricao: formData.descricao || `Manutenção realizada em ${formData.data}`,
        observacoes: observacoesComChecklist,
        // Campos aceitos pelo backend para checklist diário, usados aqui como resumo
        cabos: checklist.cabos === 'ok',
        polias: checklist.polias === 'ok',
        estrutura: checklist.estrutura === 'ok',
        movimentos: checklist.movimentos === 'ok',
        freios: checklist.freios === 'ok',
        limitadores: checklist.limitadores === 'ok',
        indicadores: checklist.indicadores === 'ok',
        aterramento: checklist.aterramento === 'ok'
      }

      if (modoEdicao && formData.id) {
        // Atualizar manutenção existente
        await livroGruaApi.atualizarEntrada(formData.id, manutencaoData as any)
        toast({
          title: "Sucesso",
          description: "Manutenção atualizada com sucesso"
        })
      } else {
        // Criar nova manutenção
        await livroGruaApi.criarEntrada(manutencaoData as any)
        toast({
          title: "Sucesso",
          description: "Manutenção registrada com sucesso"
        })
      }

      onSave?.(formData)
    } catch (err) {
      console.error('Erro ao salvar manutenção:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar manutenção'
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Data e Funcionário - Card Unificado - Oculto em nova manutenção */}
      {manutencao && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data */}
            <div>
              <Label htmlFor="data" className="text-xs text-gray-500">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
                disabled={modoVisualizacao}
                className={`mt-1 ${modoVisualizacao ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                A data pode ser qualquer dia
              </p>
            </div>

            {/* Funcionário */}
            <div>
              <Label htmlFor="funcionario" className="text-xs text-gray-500">
                Funcionário <span className="text-red-500">*</span>
              </Label>
              {modoVisualizacao ? (
                <Input
                  id="funcionario"
                  value={formData.realizado_por_nome || funcionarioSelecionado?.name || 'N/A'}
                  className="mt-1 bg-gray-50 cursor-not-allowed"
                  disabled
                />
              ) : (
                <FuncionarioSearch
                  onFuncionarioSelect={handleFuncionarioSelect}
                  selectedFuncionario={funcionarioSelecionado}
                  placeholder="Buscar funcionário..."
                  className="mt-1"
                  disabled={modoVisualizacao}
                />
              )}
            </div>

            {/* Cargo */}
            <div>
              <Label htmlFor="cargo" className="text-xs text-gray-500">
                Cargo
              </Label>
              <Input
                id="cargo"
                value={formData.cargo || funcionarioSelecionado?.role || ''}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Cargo do funcionário"
                className="mt-1"
                disabled={modoVisualizacao || !funcionarioSelecionado}
              />
            </div>
          </div>

          {/* Preview do Funcionário Selecionado */}
          {funcionarioSelecionado && !modoVisualizacao && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{funcionarioSelecionado.name}</p>
                  <p className="text-xs text-blue-700">{funcionarioSelecionado.role}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Checklist de Manutenção */}
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Checklist de Manutenção
            </span>
            {!modoVisualizacao && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={preencherDadosAleatorios}
                className="h-8 text-xs w-full sm:w-auto"
              >
                <Shuffle className="w-3.5 h-3.5 mr-1" />
                Preencher teste
              </Button>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Marque os itens que foram verificados durante a manutenção
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(checklistPorSecao).map(([secao, itens]) => (
              <div key={secao} className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
                  {secao}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {itens.map((item) => {
                    const statusAtual = checklist[item.key] || null
                    return (
                      <div
                        key={item.key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 rounded-md border hover:bg-gray-50 transition-colors"
                      >
                        <Label
                          htmlFor={item.key}
                          className="text-sm font-medium leading-snug cursor-pointer flex-1"
                        >
                          {item.label}
                        </Label>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:justify-end">
                          <Button
                            type="button"
                            variant={statusAtual === 'ok' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleChecklistItem(item.key, 'ok')}
                            disabled={modoVisualizacao}
                            className={`h-7 w-[92px] px-2 text-[11px] sm:h-8 sm:w-[116px] sm:px-3 sm:text-xs ${statusAtual === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          >
                            OK
                          </Button>
                          <Button
                            type="button"
                            variant={statusAtual === 'manutencao' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleChecklistItem(item.key, 'manutencao')}
                            disabled={modoVisualizacao}
                            className={`h-7 w-[92px] px-2 text-[11px] sm:h-8 sm:w-[116px] sm:px-3 sm:text-xs ${statusAtual === 'manutencao' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                          >
                            MANUTENÇÃO
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {(obraId != null || carregandoCatalogoObra || extrasItens.length > 0) && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
                  Itens adicionais da obra
                </h4>
                {carregandoCatalogoObra && (
                  <p className="text-xs text-muted-foreground">Carregando itens da obra…</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {extrasItens.map((ex) => {
                    const statusAtual = checklist[ex.key] || null
                    return (
                      <div
                        key={ex.key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 rounded-md border hover:bg-gray-50 transition-colors"
                      >
                        <Label
                          htmlFor={ex.key}
                          className="text-sm font-medium leading-snug cursor-pointer flex-1"
                        >
                          {ex.label}
                        </Label>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:justify-end">
                          <Button
                            type="button"
                            variant={statusAtual === "ok" ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleChecklistItem(ex.key, "ok")}
                            disabled={modoVisualizacao}
                            className={`h-7 w-[92px] px-2 text-[11px] sm:h-8 sm:w-[116px] sm:px-3 sm:text-xs ${statusAtual === "ok" ? "bg-green-600 hover:bg-green-700" : ""}`}
                          >
                            OK
                          </Button>
                          <Button
                            type="button"
                            variant={statusAtual === "manutencao" ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleChecklistItem(ex.key, "manutencao")}
                            disabled={modoVisualizacao}
                            className={`h-7 w-[92px] px-2 text-[11px] sm:h-8 sm:w-[116px] sm:px-3 sm:text-xs ${statusAtual === "manutencao" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                          >
                            MANUTENÇÃO
                          </Button>
                          {!modoVisualizacao && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removerItemExtra(ex.key)}
                              aria-label={`Remover ${ex.label}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!modoVisualizacao && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Adicionar item</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {obraId
                          ? "Novos itens ficam no catálogo só de manutenção desta obra (independente do checklist diário)."
                          : "Abra pelo detalhe da obra para vincular itens ao catálogo reutilizável."}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={novoItemLabel}
                        onChange={(e) => setNovoItemLabel(e.target.value)}
                        placeholder="Ex.: Cabine, iluminação, anemômetro..."
                        maxLength={200}
                        disabled={salvandoItemObra || !obraId}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            solicitarAdicionarItemExtra()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={solicitarAdicionarItemExtra}
                        className="shrink-0"
                        disabled={salvandoItemObra || !obraId}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Descrição da Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div>
            <Label htmlFor="descricao" className="text-xs text-gray-500">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ''}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              disabled={modoVisualizacao}
              rows={3}
              placeholder="Descreva o que foi feito na manutenção..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div>
            <Label htmlFor="observacoes" className="text-xs text-gray-500">
              Observações Adicionais
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              disabled={modoVisualizacao}
              rows={2}
              placeholder="Adicione observações sobre a manutenção (opcional)..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Ações */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            {modoVisualizacao ? 'Fechar' : 'Cancelar'}
          </Button>
        )}
        {!modoVisualizacao && (
          <Button
            type="submit"
            disabled={loading || salvandoItemObra}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <ButtonLoader text="Salvando..." />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {modoEdicao ? 'Atualizar' : 'Salvar'} Manutenção
              </>
            )}
          </Button>
        )}
      </div>
    </form>

    <AlertDialog
      open={dialogNovoItemAberto}
      onOpenChange={(open) => {
        if (!open) fecharDialogNovoItem()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar item no checklist</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                O item{" "}
                <span className="font-medium text-foreground">&quot;{labelPendenteAdicionar}&quot;</span> será
                salvo no catálogo desta obra.
              </p>
              <p>Como deseja marcá-lo nesta manutenção?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end sm:flex-wrap">
          <Button type="button" variant="ghost" onClick={fecharDialogNovoItem} disabled={salvandoItemObra}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void confirmarAdicionarItemExtra(null)}
            disabled={salvandoItemObra}
          >
            Deixar pendente
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
            onClick={() => void confirmarAdicionarItemExtra("ok")}
            disabled={salvandoItemObra}
          >
            {salvandoItemObra ? "Salvando…" : "Marcar OK"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-amber-600 text-amber-800 hover:bg-amber-50"
            onClick={() => void confirmarAdicionarItemExtra("manutencao")}
            disabled={salvandoItemObra}
          >
            Marcar manutenção
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

