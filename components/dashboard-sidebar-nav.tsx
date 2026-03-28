"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ListTree } from "lucide-react"
import { DashboardSidebarNavEditor } from "@/components/dashboard-sidebar-nav-editor"
import {
  ALL_SIDEBAR_SECTION_IDS,
  collapsedMapFromDefaultExpanded,
  loadSidebarNavConfig,
  mergeSectionOrder,
  normalizeSidebarNavConfig,
  saveSidebarNavConfig,
  sortNavItemsByHrefOrderWithConfig,
  type SidebarNavConfig,
  type SidebarSectionId,
  SIDEBAR_SECTION_LABELS,
  getDefaultSidebarNavConfig,
} from "@/lib/dashboard-sidebar-nav-config"

export interface DashboardNavItem {
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  category?: string
}

interface DashboardSidebarNavProps {
  navigation: DashboardNavItem[]
  isAdminFromPermissions: () => boolean
  onNavLinkClick: (href: string, itemName: string) => void
  isNavItemActive: (href: string) => boolean
}

function buildVisibleSectionIds(navigation: DashboardNavItem[], isAdmin: boolean): Set<SidebarSectionId> {
  const byCat = new Map<string, DashboardNavItem[]>()
  for (const item of navigation) {
    const c = item.category
    if (!c) continue
    if (!byCat.has(c)) byCat.set(c, [])
    byCat.get(c)!.push(item)
  }
  const set = new Set<SidebarSectionId>()
  set.add("principal")
  if ((byCat.get("notificacoes") ?? []).length > 0) set.add("notificacoes")
  set.add("operacional")
  if ((byCat.get("rh") ?? []).length > 0) set.add("rh")
  if ((byCat.get("financeiro") ?? []).length > 0) set.add("financeiro")
  set.add("relatorios")
  set.add("documentos")
  if (isAdmin && (byCat.get("admin") ?? []).length > 0) set.add("admin")
  return set
}

export function DashboardSidebarNav({
  navigation,
  isAdminFromPermissions,
  onNavLinkClick,
  isNavItemActive,
}: DashboardSidebarNavProps) {
  const isAdmin = isAdminFromPermissions()

  const [editorOpen, setEditorOpen] = useState(false)
  const [navConfig, setNavConfig] = useState<SidebarNavConfig>(() => getDefaultSidebarNavConfig())
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    collapsedMapFromDefaultExpanded(getDefaultSidebarNavConfig().defaultExpanded)
  )

  useEffect(() => {
    const cfg = loadSidebarNavConfig()
    setNavConfig(cfg)
    setCollapsedSections(collapsedMapFromDefaultExpanded(cfg.defaultExpanded))
  }, [])

  const visibleSectionIds = useMemo(() => buildVisibleSectionIds(navigation, isAdmin), [navigation, isAdmin])

  const orderedSections = useMemo(() => {
    return mergeSectionOrder(navConfig.sectionOrder, visibleSectionIds)
  }, [navConfig.sectionOrder, visibleSectionIds])

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  const itemsByCategory = useMemo(() => {
    const m = {} as Record<SidebarSectionId, { name: string; href: string }[]>
    for (const id of ALL_SIDEBAR_SECTION_IDS) {
      m[id] = []
    }
    for (const item of navigation) {
      const c = item.category as SidebarSectionId | undefined
      if (!c || !ALL_SIDEBAR_SECTION_IDS.includes(c)) continue
      m[c].push({ name: item.name, href: item.href })
    }
    return m
  }, [navigation])

  const allowedSectionIdsForEditor = useMemo(
    () => (isAdmin ? [...ALL_SIDEBAR_SECTION_IDS] : ALL_SIDEBAR_SECTION_IDS.filter((id) => id !== "admin")),
    [isAdmin]
  )

  const handleSaveConfig = useCallback((cfg: SidebarNavConfig) => {
    const n = normalizeSidebarNavConfig(cfg)
    saveSidebarNavConfig(n)
    setNavConfig(n)
    setCollapsedSections(collapsedMapFromDefaultExpanded(n.defaultExpanded))
  }, [])

  const renderSection = (sectionId: SidebarSectionId) => {
    const rawItems = navigation.filter((item) => item.category === sectionId)
    const items = sortNavItemsByHrefOrderWithConfig(rawItems, sectionId, navConfig)
    const collapsed = collapsedSections[sectionId] ?? false

    return (
      <div key={sectionId}>
        <button
          type="button"
          onClick={() => toggleSection(sectionId)}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
        >
          <span>{SIDEBAR_SECTION_LABELS[sectionId]}</span>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = isNavItemActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onNavLinkClick(item.href, item.name)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <nav className="flex-1 px-4 py-6 space-y-6">
        {orderedSections.map((sectionId) => {
          if (!visibleSectionIds.has(sectionId)) return null
          return renderSection(sectionId)
        })}

        <div className="pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 hover:text-gray-900 gap-2"
            onClick={() => setEditorOpen(true)}
          >
            <ListTree className="w-4 h-4" />
            Personalizar menu
          </Button>
        </div>
      </nav>

      <DashboardSidebarNavEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        config={navConfig}
        onSave={handleSaveConfig}
        allowedSectionIds={allowedSectionIdsForEditor}
        itemsByCategory={itemsByCategory}
      />
    </>
  )
}
