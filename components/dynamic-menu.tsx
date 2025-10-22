"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/types/permissions'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Crane,
  Building2,
  Clock,
  FileText,
  Package,
  DollarSign,
  UserCog,
  BarChart3,
  Bell,
  Settings,
  BookOpen,
  LucideIcon
} from 'lucide-react'

// ========================================
// TIPOS
// ========================================

interface MenuItem {
  label: string
  path: string
  icon: LucideIcon
  permission: Permission | Permission[]
  requireAll?: boolean // Se true, requer todas as permissões. Se false, requer pelo menos uma
  badge?: string | number
  subItems?: MenuItem[]
}

// ========================================
// ITENS DO MENU
// ========================================

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:visualizar'
  },
  {
    label: 'Usuários',
    path: '/dashboard/usuarios',
    icon: Users,
    permission: 'usuarios:visualizar'
  },
  {
    label: 'Gruas',
    path: '/dashboard/gruas',
    icon: Crane,
    permission: 'gruas:visualizar',
    subItems: [
      {
        label: 'Listagem',
        path: '/dashboard/gruas',
        icon: Crane,
        permission: 'gruas:visualizar'
      },
      {
        label: 'Livro de Gruas',
        path: '/dashboard/livros-gruas',
        icon: BookOpen,
        permission: 'livros_gruas:visualizar'
      }
    ]
  },
  {
    label: 'Obras',
    path: '/dashboard/obras',
    icon: Building2,
    permission: 'obras:visualizar'
  },
  {
    label: 'Ponto Eletrônico',
    path: '/dashboard/ponto-eletronico',
    icon: Clock,
    permission: ['ponto:visualizar', 'ponto_eletronico:visualizar'],
    requireAll: false // Requer pelo menos uma
  },
  {
    label: 'Documentos',
    path: '/dashboard/documentos',
    icon: FileText,
    permission: 'documentos:visualizar'
  },
  {
    label: 'Estoque',
    path: '/dashboard/estoque',
    icon: Package,
    permission: 'estoque:visualizar'
  },
  {
    label: 'Financeiro',
    path: '/dashboard/financeiro',
    icon: DollarSign,
    permission: 'financeiro:visualizar'
  },
  {
    label: 'RH',
    path: '/dashboard/rh',
    icon: UserCog,
    permission: 'rh:visualizar'
  },
  {
    label: 'Relatórios',
    path: '/dashboard/relatorios',
    icon: BarChart3,
    permission: 'relatorios:visualizar'
  },
  {
    label: 'Notificações',
    path: '/dashboard/notificacoes',
    icon: Bell,
    permission: 'notificacoes:visualizar'
  },
  {
    label: 'Configurações',
    path: '/dashboard/configuracoes',
    icon: Settings,
    permission: 'configuracoes:visualizar'
  }
]

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

interface DynamicMenuProps {
  className?: string
  orientation?: 'vertical' | 'horizontal'
  showIcons?: boolean
  showSubItems?: boolean
}

export const DynamicMenu: React.FC<DynamicMenuProps> = ({
  className = '',
  orientation = 'vertical',
  showIcons = true,
  showSubItems = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole, level } = usePermissions()
  const pathname = usePathname()

  /**
   * Verifica se o usuário tem acesso a um item do menu
   */
  const canAccessItem = (item: MenuItem): boolean => {
    if (!userRole) return false

    // Se for array de permissões
    if (Array.isArray(item.permission)) {
      if (item.requireAll) {
        return hasAllPermissions(item.permission)
      } else {
        return hasAnyPermission(item.permission)
      }
    }

    // Se for permissão única
    return hasPermission(item.permission)
  }

  /**
   * Filtra itens do menu baseado nas permissões
   */
  const accessibleItems = React.useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const hasAccess = canAccessItem(item)
      
      // Se tem subitens, filtrar também
      if (hasAccess && item.subItems && showSubItems) {
        item.subItems = item.subItems.filter(subItem => canAccessItem(subItem))
      }
      
      return hasAccess
    })
  }, [userRole, level, showSubItems])

  /**
   * Verifica se o caminho está ativo
   */
  const isActive = (path: string): boolean => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(path) || false
  }

  if (accessibleItems.length === 0) {
    return null
  }

  return (
    <nav className={cn('dynamic-menu', className)}>
      <ul 
        className={cn(
          'flex gap-1',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {accessibleItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <li key={item.path} className="relative">
              <Link
                href={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  active && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium',
                  !active && 'text-gray-700 dark:text-gray-300'
                )}
              >
                {showIcons && <Icon className="h-5 w-5 flex-shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Subitens (se habilitado) */}
              {showSubItems && item.subItems && item.subItems.length > 0 && (
                <ul className="mt-1 ml-8 space-y-1">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon
                    const subActive = isActive(subItem.path)

                    return (
                      <li key={subItem.path}>
                        <Link
                          href={subItem.path}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm',
                            'hover:bg-gray-100 dark:hover:bg-gray-800',
                            subActive && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                            !subActive && 'text-gray-600 dark:text-gray-400'
                          )}
                        >
                          {showIcons && <SubIcon className="h-4 w-4 flex-shrink-0" />}
                          <span>{subItem.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ========================================
// COMPONENTE DE MENU COMPACTO
// ========================================

interface CompactMenuProps {
  className?: string
}

export const CompactMenu: React.FC<CompactMenuProps> = ({ className = '' }) => {
  const { hasPermission, userRole } = usePermissions()
  const pathname = usePathname()

  const accessibleItems = MENU_ITEMS.filter(item => {
    if (Array.isArray(item.permission)) {
      return item.permission.some(perm => hasPermission(perm))
    }
    return hasPermission(item.permission)
  })

  return (
    <nav className={cn('compact-menu', className)}>
      <div className="flex gap-2">
        {accessibleItems.map((item) => {
          const Icon = item.icon
          const active = pathname?.startsWith(item.path) || false

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                active && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                !active && 'text-gray-600 dark:text-gray-400'
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ========================================
// HOOK AUXILIAR
// ========================================

/**
 * Hook para obter itens do menu acessíveis
 */
export const useAccessibleMenuItems = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole } = usePermissions()

  const getAccessibleItems = React.useCallback(() => {
    return MENU_ITEMS.filter(item => {
      if (!userRole) return false

      if (Array.isArray(item.permission)) {
        if (item.requireAll) {
          return hasAllPermissions(item.permission)
        } else {
          return hasAnyPermission(item.permission)
        }
      }

      return hasPermission(item.permission)
    })
  }, [userRole, hasPermission, hasAnyPermission, hasAllPermissions])

  return {
    items: getAccessibleItems(),
    totalItems: getAccessibleItems().length
  }
}

// ========================================
// EXPORTS
// ========================================

export default DynamicMenu


