"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  ALL_SIDEBAR_SECTION_IDS,
  DEFAULT_ITEM_ORDER_BY_CATEGORY,
  getDefaultSidebarNavConfig,
  mergeSectionOrder,
  normalizeSidebarNavConfig,
  type SidebarNavConfig,
  type SidebarSectionId,
  SIDEBAR_SECTION_LABELS,
} from "@/lib/dashboard-sidebar-nav-config"
import { GripVertical, RotateCcw } from "lucide-react"

export interface NavEditorItem {
  name: string
  href: string
}

interface DashboardSidebarNavEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: SidebarNavConfig
  onSave: (config: SidebarNavConfig) => void
  allowedSectionIds: SidebarSectionId[]
  itemsByCategory: Record<SidebarSectionId, NavEditorItem[]>
}

const SEC_PREFIX = "sec:"
const ITEM_PREFIX = "item:"

function secDnDId(id: SidebarSectionId): string {
  return `${SEC_PREFIX}${id}`
}

function itemDnDId(href: string): string {
  return `${ITEM_PREFIX}${encodeURIComponent(href)}`
}

function parseItemDnDId(dndId: string): string | null {
  if (!dndId.startsWith(ITEM_PREFIX)) return null
  return decodeURIComponent(dndId.slice(ITEM_PREFIX.length))
}

function findCategoryForHref(
  href: string,
  itemsByCategory: Record<SidebarSectionId, NavEditorItem[]>
): SidebarSectionId | null {
  for (const sid of ALL_SIDEBAR_SECTION_IDS) {
    if (itemsByCategory[sid]?.some((i) => i.href === href)) return sid
  }
  return null
}

function SortableSectionRow({ sectionId, label }: { sectionId: SidebarSectionId; label: string }) {
  const id = secDnDId(sectionId)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 px-3 py-3 text-sm shadow-sm",
        isDragging && "z-10 border-primary/40 bg-muted/80 shadow-md ring-2 ring-primary/15"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0 rounded-md p-1.5 hover:bg-background/80"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar seção: ${label}`}
      >
        <GripVertical className="size-4" strokeWidth={2} />
      </button>
      <span className="flex-1 font-medium text-foreground">{label}</span>
    </div>
  )
}

function SortableItemRow({ href, name }: { href: string; name: string }) {
  const id = itemDnDId(href)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 border-b border-border/60 bg-background px-3 py-2.5 text-sm last:border-b-0",
        isDragging && "z-10 rounded-lg border border-primary/40 bg-muted/50 shadow-md ring-2 ring-primary/15"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0 rounded-md p-1 hover:bg-muted/80"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar: ${name}`}
      >
        <GripVertical className="size-4" strokeWidth={2} />
      </button>
      <span className="flex-1 truncate text-foreground" title={name}>
        {name}
      </span>
    </div>
  )
}

export function DashboardSidebarNavEditor({
  open,
  onOpenChange,
  config,
  onSave,
  allowedSectionIds,
  itemsByCategory,
}: DashboardSidebarNavEditorProps) {
  const [draft, setDraft] = useState<SidebarNavConfig>(() => normalizeSidebarNavConfig(config))

  useEffect(() => {
    if (open) {
      setDraft(normalizeSidebarNavConfig(config))
    }
  }, [open, config])

  const allowedSet = useMemo(() => new Set(allowedSectionIds), [allowedSectionIds])

  const sectionOrderVisible = useMemo(() => {
    return mergeSectionOrder(draft.sectionOrder, allowedSet)
  }, [draft.sectionOrder, allowedSet])

  const sectionSortIds = useMemo(() => sectionOrderVisible.map(secDnDId), [sectionOrderVisible])

  const setSectionOrder = (order: SidebarSectionId[]) => {
    setDraft((d) => ({ ...d, sectionOrder: mergeSectionOrder(order, allowedSet) }))
  }

  const setDefaultExpanded = (id: SidebarSectionId, value: boolean) => {
    setDraft((d) => ({
      ...d,
      defaultExpanded: { ...d.defaultExpanded, [id]: value },
    }))
  }

  const setItemOrderForCategory = (category: SidebarSectionId, hrefs: string[]) => {
    setDraft((d) => ({
      ...d,
      itemOrderByCategory: {
        ...d.itemOrderByCategory,
        [category]: hrefs,
      },
    }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeStr = String(active.id)
    const overStr = String(over.id)

    if (activeStr.startsWith(SEC_PREFIX) && overStr.startsWith(SEC_PREFIX)) {
      const oldIndex = sectionSortIds.indexOf(activeStr)
      const newIndex = sectionSortIds.indexOf(overStr)
      if (oldIndex === -1 || newIndex === -1) return
      setSectionOrder(arrayMove(sectionOrderVisible, oldIndex, newIndex))
      return
    }

    if (activeStr.startsWith(ITEM_PREFIX) && overStr.startsWith(ITEM_PREFIX)) {
      const hrefA = parseItemDnDId(activeStr)
      const hrefO = parseItemDnDId(overStr)
      if (!hrefA || !hrefO) return
      const category = findCategoryForHref(hrefA, itemsByCategory)
      if (!category || findCategoryForHref(hrefO, itemsByCategory) !== category) return

      const items = itemsByCategory[category] ?? []
      const ordered = mergeHrefList(
        items.map((i) => i.href),
        DEFAULT_ITEM_ORDER_BY_CATEGORY[category],
        draft.itemOrderByCategory[category]
      )
      const oldIndex = ordered.indexOf(hrefA)
      const newIndex = ordered.indexOf(hrefO)
      if (oldIndex === -1 || newIndex === -1) return
      setItemOrderForCategory(category, arrayMove(ordered, oldIndex, newIndex))
    }
  }

  const handleSave = () => {
    const normalized = normalizeSidebarNavConfig(draft)
    onSave(normalized)
    onOpenChange(false)
  }

  const handleReset = () => {
    const fresh = getDefaultSidebarNavConfig()
    setDraft(normalizeSidebarNavConfig(fresh))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-lg flex flex-col">
        <SheetHeader className="shrink-0 space-y-2 border-b border-border/60 px-6 pb-5 pt-6 text-left">
          <SheetTitle className="text-lg font-semibold tracking-tight">Personalizar menu lateral</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
            Arraste pelas alças para reordenar seções e itens. Defina se cada grupo inicia aberto ou fechado. As
            preferências ficam salvas neste navegador.
          </SheetDescription>
        </SheetHeader>

        <div className="shrink-0 border-b border-border/40 bg-muted/25 px-6 py-3">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleReset}>
            <RotateCcw className="size-4" />
            Restaurar padrão
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 py-6 pr-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-8">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ordem das seções
                  </h3>
                  <SortableContext items={sectionSortIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {sectionOrderVisible.map((id) => (
                        <SortableSectionRow key={id} sectionId={id} label={SIDEBAR_SECTION_LABELS[id]} />
                      ))}
                    </div>
                  </SortableContext>
                </section>

                <Separator className="bg-border/60" />

                {sectionOrderVisible.map((sectionId) => {
                  const items = itemsByCategory[sectionId] ?? []
                  if (items.length === 0) return null

                  const hrefsOrdered = mergeHrefList(
                    items.map((i) => i.href),
                    DEFAULT_ITEM_ORDER_BY_CATEGORY[sectionId],
                    draft.itemOrderByCategory[sectionId]
                  )
                  const itemsSorted = hrefsOrdered
                    .map((href) => items.find((i) => i.href === href))
                    .filter((x): x is NavEditorItem => Boolean(x))

                  const itemIds = hrefsOrdered.map(itemDnDId)

                  return (
                    <section key={sectionId} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
                        <h3 className="text-sm font-semibold text-foreground">{SIDEBAR_SECTION_LABELS[sectionId]}</h3>
                        <div className="flex items-center gap-2.5">
                          <Label
                            htmlFor={`open-${sectionId}`}
                            className="cursor-pointer text-xs font-normal text-muted-foreground"
                          >
                            Aberto por padrão
                          </Label>
                          <Switch
                            id={`open-${sectionId}`}
                            checked={draft.defaultExpanded[sectionId] ?? true}
                            onCheckedChange={(v) => setDefaultExpanded(sectionId, v)}
                          />
                        </div>
                      </div>
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-sm">
                          {itemsSorted.map((item) => (
                            <SortableItemRow key={item.href} href={item.href} name={item.name} />
                          ))}
                        </div>
                      </SortableContext>
                    </section>
                  )
                })}
              </div>
            </DndContext>
          </div>
        </ScrollArea>

        <div className="mt-auto flex shrink-0 gap-3 border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" className="min-h-10 flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" className="min-h-10 flex-1" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function mergeHrefList(visibleHrefs: string[], defaults: string[], custom: string[] | undefined): string[] {
  const preferred = custom?.length ? custom : defaults
  const seen = new Set<string>()
  const out: string[] = []
  for (const href of preferred) {
    if (visibleHrefs.includes(href) && !seen.has(href)) {
      out.push(href)
      seen.add(href)
    }
  }
  for (const href of visibleHrefs) {
    if (!seen.has(href)) {
      out.push(href)
      seen.add(href)
    }
  }
  return out
}
