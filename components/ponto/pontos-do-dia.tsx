"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { funcionariosApi, type FuncionarioBackend } from "@/lib/api-funcionarios"
import { apiRegistrosPonto, type RegistroPonto } from "@/lib/api-ponto-eletronico"
import { getApiBasePath } from "@/lib/runtime-config"
import { formatDateYYYYMMDDLocal, parseYYYYMMDDLocal } from "@/lib/date-local"
import { cn } from "@/lib/utils"

type Consulta =
  | "dia"
  | "historico"
  | "pendencias"
  | "extras"
  | "justificativas"
  | "corrido"
  | "relatorio"
  | "espelho"

type Situacao = "andamento" | "intervalo" | "finalizado" | "ausente" | "ferias"

type Ordenacao = "nome" | "entrada" | "saida" | "horas" | "status"

type FuncionarioDia = FuncionarioBackend & {
  funcionarios_obras?: Array<{
    status?: string | null
    data_fim?: string | null
    obras?: { nome?: string | null; status?: string | null } | null
  }>
}

type LinhaDia = {
  funcionario: FuncionarioDia
  registro?: RegistroPonto
  situacao: Situacao
  setor: string
  cargo: string
  turno: string
  minutos: number | null
}

const CORES_AVATAR = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-slate-200 text-slate-700",
]

const STATUS_FILTRO: { valor: string; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos os status" },
  { valor: "presentes", rotulo: "Presentes" },
  { valor: "andamento", rotulo: "Em andamento" },
  { valor: "intervalo", rotulo: "Intervalo" },
  { valor: "finalizado", rotulo: "Finalizado" },
  { valor: "ausente", rotulo: "Ausente" },
  { valor: "ferias", rotulo: "Férias" },
  { valor: "pendente", rotulo: "Pendências" },
]

function deslocarDia(iso: string, dias: number) {
  const data = parseYYYYMMDDLocal(iso)
  if (!data) return iso
  data.setDate(data.getDate() + dias)
  return formatDateYYYYMMDDLocal(data)
}

function rotuloData(iso: string, hoje: string) {
  const partes = iso.split("-")
  if (partes.length !== 3) return iso
  const texto = `${partes[2]}/${partes[1]}/${partes[0]}`
  return iso === hoje ? `${texto} (Hoje)` : texto
}

function hhmm(valor?: string | null) {
  if (!valor) return "—"
  const match = String(valor).match(/(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : "—"
}

function minutosDoHorario(valor?: string | null) {
  if (!valor) return null
  const match = String(valor).match(/(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function formatarDuracao(minutos: number) {
  const seguros = Math.max(0, Math.round(minutos))
  const horas = Math.floor(seguros / 60)
  const resto = seguros % 60
  return `${horas}h ${String(resto).padStart(2, "0")}min`
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function corAvatar(nome: string) {
  let soma = 0
  for (const letra of nome) soma += letra.charCodeAt(0)
  return CORES_AVATAR[soma % CORES_AVATAR.length]
}

function cargoDe(funcionario: FuncionarioDia) {
  return funcionario.cargo_info?.nome || funcionario.cargo || funcionario.usuario?.cargo || ""
}

function obraAtiva(funcionario: FuncionarioDia, dia: string) {
  const vinculos = funcionario.funcionarios_obras || []
  const ativo = vinculos.find((vinculo) => {
    if (String(vinculo.status || "").toLowerCase() !== "ativo") return false
    if (vinculo.data_fim && vinculo.data_fim < dia) return false
    if (vinculo.obras?.status === "Rascunho") return false
    return Boolean(vinculo.obras?.nome)
  })
  return ativo?.obras?.nome || ""
}

function situacaoDe(funcionario: FuncionarioDia, registro?: RegistroPonto): Situacao {
  if (funcionario.status === "Férias") return "ferias"
  if (!registro?.entrada) return "ausente"
  if (registro.saida) return "finalizado"
  if (registro.saida_almoco && !registro.volta_almoco) return "intervalo"
  return "andamento"
}

function minutosTrabalhados(registro: RegistroPonto | undefined, situacao: Situacao, agora: Date) {
  if (!registro?.entrada || situacao === "ausente" || situacao === "ferias") return null
  const entrada = minutosDoHorario(registro.entrada)
  if (entrada == null) return null

  if (situacao === "finalizado") {
    if (registro.horas_trabalhadas != null && Number(registro.horas_trabalhadas) > 0) {
      return Math.round(Number(registro.horas_trabalhadas) * 60)
    }
    const saida = minutosDoHorario(registro.saida)
    if (saida == null) return null
    return Math.max(0, saida - entrada - intervaloMinutos(registro))
  }

  const agoraMin = agora.getHours() * 60 + agora.getMinutes()
  let fim = agoraMin
  if (situacao === "intervalo") {
    const pausa = minutosDoHorario(registro.saida_almoco)
    if (pausa != null) fim = pausa
  }
  return Math.max(0, fim - entrada - intervaloMinutos(registro))
}

function intervaloMinutos(registro: RegistroPonto) {
  const saida = minutosDoHorario(registro.saida_almoco)
  const volta = minutosDoHorario(registro.volta_almoco)
  if (saida == null || volta == null || volta < saida) return 0
  return volta - saida
}

function ultimaAcao(linha: LinhaDia) {
  if (linha.situacao === "ausente" || linha.situacao === "ferias") return "Não registrou"
  if (linha.registro?.saida) return `Saída às ${hhmm(linha.registro.saida)}`
  if (linha.registro?.entrada) return `Entrada às ${hhmm(linha.registro.entrada)}`
  return "Não registrou"
}

function rotuloStatus(situacao: Situacao) {
  if (situacao === "andamento") return "Em andamento"
  if (situacao === "intervalo") return "Intervalo"
  if (situacao === "finalizado") return "Finalizado"
  if (situacao === "ferias") return "Férias"
  return "Ausente"
}

function classeStatus(situacao: Situacao) {
  if (situacao === "andamento") return "bg-emerald-50 text-emerald-700"
  if (situacao === "intervalo") return "bg-sky-50 text-sky-700"
  if (situacao === "finalizado") return "bg-slate-800 text-white"
  if (situacao === "ferias") return "bg-amber-50 text-amber-800"
  return "bg-red-50 text-red-600"
}

function pontoStatus(situacao: Situacao) {
  if (situacao === "andamento") return "bg-emerald-500"
  if (situacao === "intervalo") return "bg-sky-500"
  if (situacao === "finalizado") return "bg-slate-200"
  if (situacao === "ferias") return "bg-amber-500"
  return "bg-red-500"
}

function classeLinha(situacao: Situacao) {
  if (situacao === "andamento") return "bg-emerald-50/60 hover:bg-emerald-50"
  if (situacao === "intervalo") return "bg-sky-50/70 hover:bg-sky-50"
  if (situacao === "finalizado") return "bg-slate-50 hover:bg-slate-100"
  if (situacao === "ausente") return "bg-red-50/40 hover:bg-red-50"
  return ""
}

function limparBloqueioDaTela() {
  document.body.style.pointerEvents = ""
  document.querySelectorAll('[data-slot="sheet-overlay"]').forEach((elemento) => elemento.remove())
}

async function listarFuncionariosAtivos() {
  const acumulado: FuncionarioDia[] = []
  let pagina = 1
  let paginas = 1
  while (pagina <= paginas && pagina <= 20) {
    const resposta = await funcionariosApi.listarFuncionarios({
      page: pagina,
      limit: 100,
      apenasFuncionarios: true,
      sort_by: "nome",
      sort_order: "asc",
    })
    acumulado.push(...((resposta.data || []) as FuncionarioDia[]))
    paginas = resposta.pagination?.pages || 1
    pagina += 1
  }
  return acumulado.filter((funcionario) => funcionario.status === "Ativo" || funcionario.status === "Férias")
}

export function PontosDoDia({
  modo = "dia",
  podeRegistrar,
  onEditar,
  onExcluir,
  onAbrirConsulta,
  consulta = "dia",
  onDiaChange,
  onSlotConteudo,
  recarregar = 0,
}: {
  modo?: "dia" | "pendencias"
  podeRegistrar: boolean
  onEditar: (registro: RegistroPonto) => void
  onExcluir?: (registro: RegistroPonto) => void
  onAbrirConsulta: (consulta: Consulta) => void
  consulta?: Consulta
  onDiaChange?: (dia: string) => void
  onSlotConteudo?: (elemento: HTMLDivElement | null) => void
  recarregar?: number
}) {
  const hoje = formatDateYYYYMMDDLocal()
  const [dia, setDia] = useState(hoje)
  const [funcionarios, setFuncionarios] = useState<FuncionarioDia[]>([])
  const [registros, setRegistros] = useState<RegistroPonto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState(modo === "pendencias" ? "pendente" : "todos")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome")
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc")
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [agora, setAgora] = useState(() => new Date())
  const [detalhe, setDetalhe] = useState<LinhaDia | null>(null)
  const [registrarAberto, setRegistrarAberto] = useState(false)
  const [funcionarioNovo, setFuncionarioNovo] = useState("")
  const [entradaNova, setEntradaNova] = useState("")
  const [saidaNova, setSaidaNova] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erroRegistro, setErroRegistro] = useState("")

  useEffect(() => {
    limparBloqueioDaTela()
    const timer = window.setInterval(() => setAgora(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    onDiaChange?.(dia)
  }, [dia, onDiaChange])

  useEffect(() => {
    let cancelado = false
    const carregar = async () => {
      setCarregando(true)
      setErro("")
      try {
        const [listaFuncionarios, listaRegistros] = await Promise.all([
          listarFuncionariosAtivos(),
          apiRegistrosPonto.listar({
            data_inicio: dia,
            data_fim: dia,
            limit: 5000,
            page: 1,
            recalcular: false,
          }),
        ])
        if (cancelado) return
        setFuncionarios(listaFuncionarios)
        setRegistros(listaRegistros.data || [])
        setSelecionados([])
      } catch (falha) {
        if (!cancelado) {
          setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o ponto do dia.")
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [dia, recarregar])

  const linhas = useMemo<LinhaDia[]>(() => {
    const porFuncionario = new Map<string, RegistroPonto>()
    for (const registro of registros) {
      const chave = String(registro.funcionario_id)
      if (!porFuncionario.has(chave)) porFuncionario.set(chave, registro)
    }
    return funcionarios.map((funcionario) => {
      const registro = porFuncionario.get(String(funcionario.id))
      const situacao = situacaoDe(funcionario, registro)
      return {
        funcionario,
        registro,
        situacao,
        setor: obraAtiva(funcionario, dia) || "—",
        cargo: cargoDe(funcionario),
        turno: funcionario.turno || "—",
        minutos: minutosTrabalhados(registro, situacao, agora),
      }
    })
  }, [funcionarios, registros, dia, agora])

  const indicadores = useMemo(() => {
    const total = linhas.filter((linha) => linha.situacao !== "ferias").length
    const presentes = linhas.filter((linha) =>
      linha.situacao === "andamento" || linha.situacao === "intervalo" || linha.situacao === "finalizado"
    ).length
    const andamento = linhas.filter((linha) => linha.situacao === "andamento").length
    const ausentes = linhas.filter((linha) => linha.situacao === "ausente").length
    const minutos = linhas.reduce((soma, linha) => soma + (linha.minutos || 0), 0)
    const percentual = (quantidade: number) => (total > 0 ? Math.round((quantidade / total) * 100) : 0)
    return { total, presentes, andamento, ausentes, minutos, percentual }
  }, [linhas])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const lista = linhas.filter((linha) => {
      if (modo === "pendencias") {
        const diaPassado = dia < hoje
        const incompleto = Boolean(linha.registro?.entrada) && !linha.registro?.saida && diaPassado
        const statusPendente = String(linha.registro?.status || "").toLowerCase().includes("pendente")
        if (!incompleto && !statusPendente) return false
      }
      if (statusFiltro === "presentes") {
        if (linha.situacao !== "andamento" && linha.situacao !== "intervalo" && linha.situacao !== "finalizado") return false
      } else if (statusFiltro === "pendente") {
        const diaPassado = dia < hoje
        const incompleto = Boolean(linha.registro?.entrada) && !linha.registro?.saida && diaPassado
        if (!incompleto) return false
      } else if (statusFiltro !== "todos" && linha.situacao !== statusFiltro) {
        return false
      }
      if (!termo) return true
      const texto = `${linha.funcionario.nome} ${linha.cargo} ${linha.setor}`.toLowerCase()
      return texto.includes(termo)
    })

    const fator = direcao === "asc" ? 1 : -1
    lista.sort((a, b) => {
      if (ordenacao === "nome") return a.funcionario.nome.localeCompare(b.funcionario.nome, "pt-BR") * fator
      if (ordenacao === "entrada") return ((minutosDoHorario(a.registro?.entrada) ?? 9999) - (minutosDoHorario(b.registro?.entrada) ?? 9999)) * fator
      if (ordenacao === "saida") return ((minutosDoHorario(a.registro?.saida) ?? 9999) - (minutosDoHorario(b.registro?.saida) ?? 9999)) * fator
      if (ordenacao === "horas") return ((a.minutos ?? -1) - (b.minutos ?? -1)) * fator
      return rotuloStatus(a.situacao).localeCompare(rotuloStatus(b.situacao), "pt-BR") * fator
    })
    return lista
  }, [linhas, busca, statusFiltro, ordenacao, direcao, modo, dia, hoje])

  const abrirDetalhe = (linha: LinhaDia) => {
    limparBloqueioDaTela()
    setDetalhe(linha)
  }

  const fecharDetalhe = () => {
    setDetalhe(null)
    limparBloqueioDaTela()
  }

  useEffect(() => {
    if (!detalhe) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fecharDetalhe()
    }
    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [detalhe])

  const alternarOrdem = (coluna: Ordenacao) => {
    if (ordenacao === coluna) {
      setDirecao((atual) => (atual === "asc" ? "desc" : "asc"))
      return
    }
    setOrdenacao(coluna)
    setDirecao("asc")
  }

  const todosMarcados = filtradas.length > 0 && filtradas.every((linha) => selecionados.includes(linha.funcionario.id))

  const exportar = () => {
    const base = selecionados.length
      ? filtradas.filter((linha) => selecionados.includes(linha.funcionario.id))
      : filtradas
    const cabecalho = ["Funcionário", "Cargo", "Entrada", "Saída", "Horas", "Status", "Última ação"]
    const corpo = base.map((linha) => [
      linha.funcionario.nome,
      linha.cargo,
      linha.registro?.entrada ? hhmm(linha.registro.entrada) : "",
      linha.registro?.saida ? hhmm(linha.registro.saida) : "",
      linha.minutos == null ? "" : formatarDuracao(linha.minutos),
      rotuloStatus(linha.situacao),
      ultimaAcao(linha),
    ])
    const csv = [cabecalho, ...corpo]
      .map((colunas) => colunas.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ponto-${dia}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const registrar = async () => {
    if (!funcionarioNovo || !entradaNova) {
      setErroRegistro("Escolha o funcionário e informe a entrada.")
      return
    }
    setSalvando(true)
    setErroRegistro("")
    try {
      await apiRegistrosPonto.criar({
        funcionario_id: Number(funcionarioNovo),
        data: dia,
        entrada: entradaNova,
        saida: saidaNova || undefined,
      })
      setRegistrarAberto(false)
      setEntradaNova("")
      setSaidaNova("")
      const listaRegistros = await apiRegistrosPonto.listar({
        data_inicio: dia,
        data_fim: dia,
        limit: 5000,
        page: 1,
        recalcular: false,
      })
      setRegistros(listaRegistros.data || [])
    } catch (falha) {
      const resposta = falha as { response?: { data?: { message?: string } }; message?: string }
      setErroRegistro(resposta.response?.data?.message || resposta.message || "Não foi possível registrar o ponto.")
    } finally {
      setSalvando(false)
    }
  }

  const aplicarCard = (valor: string) => {
    setStatusFiltro((atual) => (atual === valor ? "todos" : valor))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ponto Eletrônico</h1>
            <p className="text-sm text-slate-500">
              {modo === "pendencias"
                ? "Registros incompletos e ocorrências que precisam de análise."
                : "Acompanhe o registro de ponto dos funcionários em tempo real"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center rounded-lg border bg-white shadow-sm">
            <div className="relative flex h-10 items-center px-2">
              <Calendar className="ml-1 h-4 w-4 text-slate-500" />
              <span className="px-2 text-sm font-medium text-slate-800">{rotuloData(dia, hoje)}</span>
              <input
                type="date"
                aria-label="Data do ponto"
                value={dia}
                onChange={(evento) => setDia(evento.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
            <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => setDia(deslocarDia(dia, -1))} aria-label="Dia anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="mr-1 rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => setDia(deslocarDia(dia, 1))} aria-label="Próximo dia">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button type="button" variant="outline" className="h-10 bg-white" onClick={() => setDia(hoje)}>
            Hoje
          </Button>
          {podeRegistrar ? (
            <Button type="button" className="h-10 bg-slate-900 hover:bg-slate-800" onClick={() => setRegistrarAberto(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Registrar Ponto
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CardIndicador
          onClick={() => setStatusFiltro("todos")}
          icone={<Users className="h-5 w-5 text-blue-600" />}
          fundo="bg-blue-50"
          titulo="Funcionários"
          valor={carregando ? "—" : String(indicadores.total)}
          detalhe="Total de ativos"
          extra={
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${indicadores.percentual(indicadores.presentes)}%` }} />
              </div>
              <p className="mt-1 text-xs text-emerald-600">{indicadores.percentual(indicadores.presentes)}% do total</p>
            </div>
          }
        />
        <CardIndicador
          ativo={statusFiltro === "presentes"}
          onClick={() => aplicarCard("presentes")}
          icone={<Check className="h-5 w-5 text-emerald-600" />}
          fundo="bg-emerald-50"
          titulo="Presentes"
          valor={carregando ? "—" : String(indicadores.presentes)}
          detalhe={`${indicadores.percentual(indicadores.presentes)}% do total`}
          detalheClasse="text-emerald-600"
          barra={indicadores.percentual(indicadores.presentes)}
          barraClasse="bg-emerald-500"
        />
        <CardIndicador
          ativo={statusFiltro === "andamento"}
          onClick={() => aplicarCard("andamento")}
          icone={<Clock className="h-5 w-5 text-amber-500" />}
          fundo="bg-amber-50"
          titulo="Em andamento"
          valor={carregando ? "—" : String(indicadores.andamento)}
          detalhe={`${indicadores.percentual(indicadores.andamento)}% do total`}
          detalheClasse="text-amber-600"
          barra={indicadores.percentual(indicadores.andamento)}
          barraClasse="bg-amber-400"
        />
        <CardIndicador
          ativo={statusFiltro === "ausente"}
          onClick={() => aplicarCard("ausente")}
          icone={<X className="h-5 w-5 text-red-500" />}
          fundo="bg-red-50"
          titulo="Ausentes"
          valor={carregando ? "—" : String(indicadores.ausentes)}
          detalhe={`${indicadores.percentual(indicadores.ausentes)}% do total`}
          detalheClasse="text-red-500"
          barra={indicadores.percentual(indicadores.ausentes)}
          barraClasse="bg-red-400"
        />
        <CardIndicador
          icone={<Clock className="h-5 w-5 text-slate-500" />}
          fundo="bg-slate-100"
          titulo="Horas trabalhadas"
          valor={carregando ? "—" : formatarDuracao(indicadores.minutos)}
          detalhe={dia === hoje ? "Hoje" : rotuloData(dia, hoje)}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por funcionário ou cargo..."
            className="h-10 bg-white pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="h-10 w-full bg-white lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTRO.map((item) => (
              <SelectItem key={item.valor} value={item.valor}>{item.rotulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          className="h-10 text-slate-600"
          onClick={() => {
            setBusca("")
            setStatusFiltro("todos")
          }}
        >
          Limpar
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {consulta === "pendencias" ? "Pendências" :
                consulta === "historico" ? "Histórico de pontos" :
                consulta === "extras" ? "Horas extras" :
                consulta === "justificativas" ? "Justificativas" :
                consulta === "corrido" ? "Trabalho corrido" :
                consulta === "relatorio" ? "Relatório mensal" :
                consulta === "espelho" ? "Espelho de ponto" :
                "Funcionários do dia"}
            </h2>
            {consulta === "dia" || consulta === "pendencias" ? (
              <p className="text-xs text-slate-500">{filtradas.length} resultado(s)</p>
            ) : (
              <p className="text-xs text-slate-500">{rotuloData(dia, hoje)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-9">
                  Consultas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAbrirConsulta("dia")}>Pontos do dia</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("historico")}>Histórico de pontos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("pendencias")}>Pendências</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("extras")}>Horas extras</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("justificativas")}>Justificativas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("corrido")}>Trabalho corrido</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("relatorio")}>Relatório mensal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAbrirConsulta("espelho")}>Espelho de ponto</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {consulta === "dia" || consulta === "pendencias" ? (
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={exportar}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            ) : null}
          </div>
        </div>

        {erro ? (
          <p className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        ) : null}

        {consulta !== "dia" && consulta !== "pendencias" ? (
          <div
            ref={onSlotConteudo}
            className="[&_[data-slot=card]]:!rounded-none [&_[data-slot=card]]:!border-0 [&_[data-slot=card]]:!bg-transparent [&_[data-slot=card]]:!py-0 [&_[data-slot=card]]:!gap-0 [&_[data-slot=card]]:!shadow-none [&_[data-slot=tabs-content]]:!mt-0 [&_[data-slot=card-content]]:!px-4 [&_[data-slot=card-content]]:!pb-4"
          />
        ) : null}

        {consulta === "dia" || consulta === "pendencias" ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={todosMarcados}
                    onCheckedChange={(marcado) => {
                      setSelecionados(marcado ? filtradas.map((linha) => linha.funcionario.id) : [])
                    }}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <CabecalhoOrdenavel label="Funcionário" ativo={ordenacao === "nome"} onClick={() => alternarOrdem("nome")} />
                <CabecalhoOrdenavel label="Entrada" ativo={ordenacao === "entrada"} onClick={() => alternarOrdem("entrada")} />
                <CabecalhoOrdenavel label="Saída" ativo={ordenacao === "saida"} onClick={() => alternarOrdem("saida")} />
                <CabecalhoOrdenavel label="Horas" ativo={ordenacao === "horas"} onClick={() => alternarOrdem("horas")} />
                <CabecalhoOrdenavel label="Status" ativo={ordenacao === "status"} onClick={() => alternarOrdem("status")} />
                <TableHead>Última ação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Carregando o ponto do dia…
                  </TableCell>
                </TableRow>
              ) : filtradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    Nenhum funcionário encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filtradas.map((linha) => (
                  <TableRow key={linha.funcionario.id} className={classeLinha(linha.situacao)}>
                    <TableCell>
                      <Checkbox
                        checked={selecionados.includes(linha.funcionario.id)}
                        onCheckedChange={(marcado) => {
                          setSelecionados((atual) =>
                            marcado
                              ? [...atual, linha.funcionario.id]
                              : atual.filter((id) => id !== linha.funcionario.id)
                          )
                        }}
                        aria-label={`Selecionar ${linha.funcionario.nome}`}
                      />
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", corAvatar(linha.funcionario.nome))}>
                          {iniciais(linha.funcionario.nome)}
                        </div>
                        <div>
                          <p className="whitespace-nowrap font-medium text-slate-900">{linha.funcionario.nome}</p>
                          <p className="whitespace-nowrap text-xs text-slate-500">{linha.cargo || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-700">{linha.registro?.entrada ? hhmm(linha.registro.entrada) : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-700">{linha.registro?.saida ? hhmm(linha.registro.saida) : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-700">
                      {linha.minutos == null ? "—" : formatarDuracao(linha.minutos)}
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", classeStatus(linha.situacao))}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", pontoStatus(linha.situacao))} />
                        {rotuloStatus(linha.situacao)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">{ultimaAcao(linha)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => abrirDetalhe(linha)}>
                          Ver
                        </Button>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0" aria-label="Mais ações">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => abrirDetalhe(linha)}>Ver detalhes</DropdownMenuItem>
                            {linha.registro ? (
                              <DropdownMenuItem onClick={() => onEditar(linha.registro as RegistroPonto)}>Editar registro</DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => onAbrirConsulta("historico")}>Histórico de pontos</DropdownMenuItem>
                            {linha.registro && onExcluir ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onExcluir(linha.registro as RegistroPonto)}
                              >
                                Excluir registro
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        ) : null}
      </section>

      {detalhe ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 bg-black/50" onClick={fecharDetalhe} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalhe-ponto-titulo"
            className="absolute inset-y-0 right-0 flex h-full w-full flex-col overflow-y-auto border-l bg-background shadow-lg sm:max-w-md"
          >
            <button
              type="button"
              className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100"
              onClick={fecharDetalhe}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <DetalhePonto
              linha={detalhe}
              dia={dia}
              onEditar={(registro) => {
                fecharDetalhe()
                onEditar(registro)
              }}
            />
          </div>
        </div>
      ) : null}

      <Dialog open={registrarAberto} onOpenChange={setRegistrarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar ponto</DialogTitle>
            <DialogDescription>Lançamento do dia {rotuloData(dia, hoje)}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Funcionário</Label>
              <Select value={funcionarioNovo} onValueChange={setFuncionarioNovo}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((funcionario) => (
                    <SelectItem key={funcionario.id} value={String(funcionario.id)}>{funcionario.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="entrada-nova">Entrada</Label>
                <Input id="entrada-nova" type="time" value={entradaNova} onChange={(evento) => setEntradaNova(evento.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="saida-nova">Saída</Label>
                <Input id="saida-nova" type="time" value={saidaNova} onChange={(evento) => setSaidaNova(evento.target.value)} />
              </div>
            </div>
            {erroRegistro ? <p className="text-sm text-red-600">{erroRegistro}</p> : null}
            <div className="flex justify-end">
              <Button type="button" onClick={() => void registrar()} disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CardIndicador({
  titulo,
  valor,
  detalhe,
  detalheClasse,
  icone,
  fundo,
  extra,
  barra,
  barraClasse,
  ativo,
  onClick,
}: {
  titulo: string
  valor: string
  detalhe: string
  detalheClasse?: string
  icone: ReactNode
  fundo: string
  extra?: ReactNode
  barra?: number
  barraClasse?: string
  ativo?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white p-4 text-left shadow-sm",
        onClick && "transition hover:border-slate-300",
        ativo && onClick && "ring-2 ring-blue-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{titulo}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{valor}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", fundo)}>{icone}</div>
      </div>
      {extra ? (
        <div className="mt-3">
          <p className="text-xs text-slate-500">{detalhe}</p>
          {extra}
        </div>
      ) : (
        <div className="mt-3">
          <p className={cn("text-xs text-slate-500", detalheClasse)}>{detalhe}</p>
          {barra != null ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={cn("h-full rounded-full", barraClasse)} style={{ width: `${Math.min(100, barra)}%` }} />
            </div>
          ) : null}
        </div>
      )}
    </Tag>
  )
}

function CabecalhoOrdenavel({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <TableHead>
      <button type="button" className={cn("inline-flex items-center gap-1", ativo && "text-slate-900")} onClick={onClick}>
        {label}
      </button>
    </TableHead>
  )
}

function useUrlAssinatura(caminho?: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (!caminho) {
      setUrl(null)
      setFalhou(false)
      return
    }

    let cancelado = false
    const token = localStorage.getItem("access_token")
    fetch(
      `${getApiBasePath()}/arquivos/url-assinada?caminho=${encodeURIComponent(caminho)}&bucket=assinaturas-digitais`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then(async (resposta) => {
        if (!resposta.ok) return null
        const corpo = await resposta.json().catch(() => ({}))
        return corpo?.data?.url || corpo?.url || null
      })
      .then((endereco: string | null) => {
        if (cancelado) return
        setUrl(endereco)
        setFalhou(!endereco)
      })
      .catch(() => {
        if (!cancelado) {
          setUrl(null)
          setFalhou(true)
        }
      })

    return () => {
      cancelado = true
    }
  }, [caminho])

  return { url, falhou }
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return data.toLocaleString("pt-BR")
}

function AssinaturaBloco({
  titulo,
  nome,
  quando,
  caminho,
}: {
  titulo: string
  nome?: string | null
  quando?: string | null
  caminho?: string | null
}) {
  const { url, falhou } = useUrlAssinatura(caminho)
  const momento = formatarDataHora(quando)

  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium text-slate-900">{titulo}</p>
      {caminho ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Assinou{nome ? `: ${nome}` : ""}
            {momento ? ` · ${momento}` : ""}
          </p>
          {url ? (
            <img
              src={url}
              alt={`Assinatura — ${titulo}`}
              className="mt-2 max-h-28 w-full rounded border bg-white object-contain"
            />
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              {falhou ? "Não foi possível carregar a imagem da assinatura." : "Carregando assinatura…"}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500">Ainda não assinou</p>
      )}
    </div>
  )
}

function DetalhePonto({
  linha,
  dia,
  onEditar,
}: {
  linha: LinhaDia
  dia: string
  onEditar: (registro: RegistroPonto) => void
}) {
  const [registro, setRegistro] = useState<RegistroPonto | null | undefined>(linha.registro)

  useEffect(() => {
    setRegistro(linha.registro)
    const id = linha.registro?.id
    if (!id) return
    let cancelado = false
    apiRegistrosPonto.obter(id)
      .then((completo) => {
        if (!cancelado && completo) setRegistro((atual) => ({ ...(atual || linha.registro), ...completo }))
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [linha.registro])

  const eventos = [
    linha.registro?.entrada ? { hora: hhmm(linha.registro.entrada), tipo: "Entrada" } : null,
    linha.registro?.saida_almoco ? { hora: hhmm(linha.registro.saida_almoco), tipo: "Saída para intervalo" } : null,
    linha.registro?.volta_almoco ? { hora: hhmm(linha.registro.volta_almoco), tipo: "Retorno do intervalo" } : null,
    linha.registro?.saida ? { hora: hhmm(linha.registro.saida), tipo: "Saída final" } : null,
  ].filter(Boolean) as Array<{ hora: string; tipo: string }>

  return (
    <>
      <div className="flex flex-col gap-1.5 p-4 pr-10">
        <h2 id="detalhe-ponto-titulo" className="font-semibold text-foreground">{linha.funcionario.nome}</h2>
        <p className="text-sm text-muted-foreground">
          {linha.cargo || "Sem cargo"} · {linha.setor} · {rotuloData(dia, formatDateYYYYMMDDLocal())}
        </p>
      </div>
      <div className="space-y-5 px-4 pb-6">
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", classeStatus(linha.situacao))}>
          {rotuloStatus(linha.situacao)}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Marcações</h3>
          {eventos.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nenhuma marcação neste dia.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {eventos.map((evento) => (
                <li key={`${evento.tipo}-${evento.hora}`} className="flex items-center gap-3 text-sm">
                  <span className="w-14 font-medium tabular-nums text-slate-900">{evento.hora}</span>
                  <span className="text-slate-600">{evento.tipo}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Trabalhado</p>
            <p className="font-medium">{linha.minutos == null ? "—" : formatarDuracao(linha.minutos)}</p>
          </div>
          <div>
            <p className="text-slate-500">Intervalo</p>
            <p className="font-medium">{linha.registro ? formatarDuracao(intervaloMinutos(linha.registro)) : "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Turno</p>
            <p className="font-medium">{linha.turno}</p>
          </div>
          <div>
            <p className="text-slate-500">Saldo</p>
            <p className="font-medium">
              {linha.situacao === "finalizado" && linha.registro?.horas_extras != null && Number(linha.registro.horas_extras) !== 0
                ? `${Number(linha.registro.horas_extras) > 0 ? "+" : ""}${Number(linha.registro.horas_extras).toFixed(2)}h`
                : linha.situacao === "andamento" || linha.situacao === "intervalo"
                  ? "Em apuração"
                  : "—"}
            </p>
          </div>
        </div>
        {registro ? (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Assinaturas</h3>
            <div className="mt-3 space-y-3">
              <AssinaturaBloco
                titulo="Responsável da obra"
                nome={registro.responsavel_assinatura?.nome}
                quando={
                  registro.assinatura_responsavel_path
                    ? registro.data_assinatura_responsavel
                    : registro.data_aprovacao
                }
                caminho={registro.assinatura_responsavel_path || registro.assinatura_digital_path}
              />
              <AssinaturaBloco
                titulo="Colaborador"
                nome={linha.funcionario.nome}
                quando={registro.data_assinatura_funcionario}
                caminho={registro.assinatura_funcionario_path}
              />
            </div>
          </div>
        ) : null}
        {linha.registro?.observacoes ? (
          <div>
            <p className="text-sm text-slate-500">Observações</p>
            <p className="text-sm text-slate-800">{linha.registro.observacoes}</p>
          </div>
        ) : null}
        {linha.registro ? (
          <Button type="button" variant="outline" onClick={() => onEditar(linha.registro as RegistroPonto)}>
            Editar registro
          </Button>
        ) : null}
      </div>
    </>
  )
}
