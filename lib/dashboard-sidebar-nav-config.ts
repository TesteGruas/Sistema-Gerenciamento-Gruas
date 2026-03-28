export type SidebarSectionId =
  | "principal"
  | "notificacoes"
  | "operacional"
  | "rh"
  | "financeiro"
  | "relatorios"
  | "documentos"
  | "admin"

export const SIDEBAR_SECTION_LABELS: Record<SidebarSectionId, string> = {
  principal: "Principal",
  notificacoes: "Notificações",
  operacional: "Operacional",
  rh: "RH e Pessoas",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  documentos: "Documentos",
  admin: "Administração",
}

export const ALL_SIDEBAR_SECTION_IDS: SidebarSectionId[] = [
  "principal",
  "notificacoes",
  "operacional",
  "rh",
  "financeiro",
  "relatorios",
  "documentos",
  "admin",
]

/** Ordem padrão das seções e dos itens (href) por categoria — alinhado a `app/dashboard/layout.tsx` */
export const DEFAULT_SECTION_ORDER: SidebarSectionId[] = [...ALL_SIDEBAR_SECTION_IDS]

export const DEFAULT_ITEM_ORDER_BY_CATEGORY: Record<SidebarSectionId, string[]> = {
  principal: ["/dashboard"],
  notificacoes: [
    "/dashboard/notificacoes",
    "/dashboard/aprovacoes-horas-extras/whatsapp",
    "/dashboard/configuracoes/notificacoes-app",
  ],
  operacional: [
    "/dashboard/clientes",
    "/dashboard/orcamentos",
    "/dashboard/obras",
    "/dashboard/gruas",
    "/dashboard/medicoes",
    "/dashboard/livros-gruas",
    "/dashboard/estoque",
    "/dashboard/complementos",
  ],
  rh: ["/dashboard/ponto", "/dashboard/rh"],
  financeiro: ["/dashboard/financeiro", "/dashboard/financeiro/alugueis"],
  relatorios: ["/dashboard/relatorios", "/dashboard/historico"],
  documentos: ["/dashboard/assinatura"],
  admin: [
    "/dashboard/usuarios",
    "/dashboard/perfis-permissoes",
    "/dashboard/configuracoes/email",
    "/dashboard/configuracoes/templates-email",
    "/dashboard/configuracoes/templates-whatsapp",
    "/dashboard/configuracoes/empresa",
    "/dashboard/configuracoes/sistema",
  ],
}

/** Por padrão, todas as seções vêm abertas (comportamento anterior do layout). */
export const DEFAULT_EXPANDED: Record<SidebarSectionId, boolean> = {
  principal: true,
  notificacoes: true,
  operacional: true,
  rh: true,
  financeiro: true,
  relatorios: true,
  documentos: true,
  admin: true,
}

export interface SidebarNavConfig {
  sectionOrder: SidebarSectionId[]
  itemOrderByCategory: Partial<Record<SidebarSectionId, string[]>>
  /** true = seção expandida (aberta) ao carregar */
  defaultExpanded: Partial<Record<SidebarSectionId, boolean>>
}

const STORAGE_KEY = "dashboard-sidebar-nav-v1"

export function getDefaultSidebarNavConfig(): SidebarNavConfig {
  return {
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    itemOrderByCategory: {},
    defaultExpanded: { ...DEFAULT_EXPANDED },
  }
}

function parseStored(raw: string | null): SidebarNavConfig | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as SidebarNavConfig
    if (!data || typeof data !== "object" || !Array.isArray(data.sectionOrder)) return null
    return data
  } catch {
    return null
  }
}

export function loadSidebarNavConfig(): SidebarNavConfig {
  if (typeof window === "undefined") return getDefaultSidebarNavConfig()
  const parsed = parseStored(localStorage.getItem(STORAGE_KEY))
  if (!parsed) return getDefaultSidebarNavConfig()
  return normalizeSidebarNavConfig(parsed)
}

export function saveSidebarNavConfig(config: SidebarNavConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSidebarNavConfig(config)))
}

/** Garante IDs válidos, mescla ordem com padrões e novos hrefs. */
export function normalizeSidebarNavConfig(input: SidebarNavConfig): SidebarNavConfig {
  const sectionOrder = mergeSectionOrder(input.sectionOrder, new Set(ALL_SIDEBAR_SECTION_IDS))
  const itemOrderByCategory: Partial<Record<SidebarSectionId, string[]>> = {}
  for (const id of ALL_SIDEBAR_SECTION_IDS) {
    const def = DEFAULT_ITEM_ORDER_BY_CATEGORY[id]
    const custom = input.itemOrderByCategory[id]
    itemOrderByCategory[id] = mergeHrefOrder(custom, def)
  }
  const defaultExpanded: Partial<Record<SidebarSectionId, boolean>> = {}
  for (const id of ALL_SIDEBAR_SECTION_IDS) {
    const v = input.defaultExpanded[id]
    defaultExpanded[id] = typeof v === "boolean" ? v : DEFAULT_EXPANDED[id]
  }
  return { sectionOrder, itemOrderByCategory, defaultExpanded }
}

export function mergeSectionOrder(
  preferred: SidebarSectionId[],
  allowed: Set<SidebarSectionId>
): SidebarSectionId[] {
  const seen = new Set<SidebarSectionId>()
  const out: SidebarSectionId[] = []
  for (const id of preferred) {
    if (allowed.has(id) && !seen.has(id)) {
      out.push(id)
      seen.add(id)
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (allowed.has(id) && !seen.has(id)) {
      out.push(id)
      seen.add(id)
    }
  }
  return out
}

function mergeHrefOrder(custom: string[] | undefined, defaults: string[]): string[] {
  const base = custom?.length ? [...custom] : [...defaults]
  const seen = new Set<string>()
  const out: string[] = []
  for (const href of base) {
    if (!seen.has(href)) {
      seen.add(href)
      out.push(href)
    }
  }
  for (const href of defaults) {
    if (!seen.has(href)) {
      seen.add(href)
      out.push(href)
    }
  }
  return out
}

export interface NavItemLike {
  href: string
}

/** Ordena itens visíveis conforme ordem salva; hrefs novos ficam ao final. */
export function sortNavItemsByHrefOrderWithConfig<T extends NavItemLike>(
  items: T[],
  category: SidebarSectionId,
  config: SidebarNavConfig
): T[] {
  const order = mergeHrefOrder(
    config.itemOrderByCategory[category],
    DEFAULT_ITEM_ORDER_BY_CATEGORY[category]
  )
  const byHref = new Map(items.map((i) => [i.href, i]))
  const seen = new Set<string>()
  const result: T[] = []
  for (const href of order) {
    const item = byHref.get(href)
    if (item) {
      result.push(item)
      seen.add(href)
    }
  }
  for (const item of items) {
    if (!seen.has(item.href)) result.push(item)
  }
  return result
}

/** `collapsedSections[id] === true` significa fechado (ícone recolhido). */
export function collapsedMapFromDefaultExpanded(
  defaultExpanded: Partial<Record<SidebarSectionId, boolean>>
): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const id of ALL_SIDEBAR_SECTION_IDS) {
    const expanded = defaultExpanded[id] ?? DEFAULT_EXPANDED[id]
    out[id] = !expanded
  }
  return out
}
