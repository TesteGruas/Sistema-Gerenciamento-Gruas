/**
 * Permissões do PWA (Aplicativo Móvel)
 * 
 * Sistema simplificado específico para o aplicativo PWA.
 * Baseado nos 5 roles principais.
 */

import { 
  type RoleName, 
  type Permission,
  type AccessLevel,
  ROLES_LEVELS,
  PWA_PERMISSIONS as BASE_PWA_PERMISSIONS
} from '@/types/permissions'
import { LucideIcon, Clock, FileText, CheckCircle, Building2, User, Settings, Bell, Receipt } from 'lucide-react'

// ========================================
// TIPOS ESPECÍFICOS DO PWA
// ========================================

export interface PWAMenuItem {
  label: string
  path: string
  icon: LucideIcon
  permission: Permission | Permission[]
  requireAll?: boolean
  description?: string
  badge?: string | number
}

// ========================================
// MENU DO PWA POR ROLE
// ========================================

export const PWA_MENU_ITEMS: PWAMenuItem[] = [
  {
    label: 'Ponto Eletrônico',
    path: '/pwa/ponto',
    icon: Clock,
    permission: ['ponto:visualizar', 'ponto_eletronico:visualizar'],
    requireAll: false,
    description: 'Registre e visualize seu ponto'
  },
  {
    label: 'Documentos',
    path: '/pwa/documentos',
    icon: FileText,
    permission: 'documentos:visualizar',
    description: 'Visualize e assine documentos'
  },
  {
    label: 'Aprovações',
    path: '/pwa/aprovacoes',
    icon: CheckCircle,
    permission: ['ponto:aprovacoes', 'ponto_eletronico:aprovacoes'],
    requireAll: false,
    description: 'Aprove horas extras e justificativas'
  },
  {
    label: 'Obras',
    path: '/pwa/obras',
    icon: Building2,
    permission: 'obras:visualizar',
    description: 'Visualize informações das obras'
  },
  {
    label: 'Espelho de Ponto',
    path: '/pwa/espelho-ponto',
    icon: Clock,
    permission: ['ponto:visualizar', 'ponto_eletronico:visualizar'],
    requireAll: false,
    description: 'Visualize seu espelho de ponto mensal'
  },
  {
    label: 'Perfil',
    path: '/pwa/perfil',
    icon: User,
    permission: '*', // Todos têm acesso ao próprio perfil
    description: 'Gerencie seu perfil'
  },
  {
    label: 'Configurações',
    path: '/pwa/configuracoes',
    icon: Settings,
    permission: '*', // Todos têm acesso às configurações
    description: 'Ajuste suas preferências'
  },
  {
    label: 'Notificações',
    path: '/pwa/notificacoes',
    icon: Bell,
    permission: 'notificacoes:visualizar',
    description: 'Visualize suas notificações'
  },
  {
    label: 'Holerites',
    path: '/pwa/holerites',
    icon: Receipt,
    permission: 'documentos:visualizar',
    description: 'Visualize, baixe e assine seus holerites'
  }
]

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Obtém as permissões PWA de um role
 */
export function getPWAPermissions(roleName: RoleName): Permission[] {
  return BASE_PWA_PERMISSIONS[roleName] || []
}

/**
 * Verifica se um role tem permissão específica no PWA
 */
export function hasPWAPermission(roleName: RoleName, permission: Permission): boolean {
  const permissions = getPWAPermissions(roleName)
  
  // Wildcard - Admin e Gestores têm acesso total
  if (permissions.includes('*')) return true
  
  // Permissão exata
  if (permissions.includes(permission)) return true
  
  // Wildcard de módulo
  const [module] = permission.split(':')
  if (permissions.includes(`${module}:*`)) return true
  
  return false
}

/**
 * Verifica se tem qualquer uma das permissões no PWA
 */
export function hasPWAAnyPermission(roleName: RoleName, permissionList: Permission[]): boolean {
  return permissionList.some(perm => hasPWAPermission(roleName, perm))
}

/**
 * Verifica se tem todas as permissões no PWA
 */
export function hasPWAAllPermissions(roleName: RoleName, permissionList: Permission[]): boolean {
  return permissionList.every(perm => hasPWAPermission(roleName, perm))
}

/**
 * Filtra itens do menu PWA baseado no role
 */
export function getAccessiblePWAMenuItems(roleName: RoleName | null): PWAMenuItem[] {
  if (!roleName) return []
  
  return PWA_MENU_ITEMS.filter(item => {
    // Permissão universal (*)
    if (item.permission === '*') return true
    
    // Array de permissões
    if (Array.isArray(item.permission)) {
      if (item.requireAll) {
        return hasPWAAllPermissions(roleName, item.permission)
      } else {
        return hasPWAAnyPermission(roleName, item.permission)
      }
    }
    
    // Permissão única
    return hasPWAPermission(roleName, item.permission)
  })
}

/**
 * Verifica se um role pode acessar o PWA
 */
export function canAccessPWA(roleName: RoleName | null): boolean {
  if (!roleName) return false
  
  // Todos os roles têm pelo menos acesso básico ao PWA
  // Operários e Clientes usam principalmente o PWA
  return true
}

/**
 * Obtém nível de acesso do role
 */
export function getPWAAccessLevel(roleName: RoleName): AccessLevel {
  return ROLES_LEVELS[roleName] || 1
}

/**
 * Verifica se tem nível mínimo no PWA
 */
export function hasPWAMinLevel(roleName: RoleName, minLevel: AccessLevel): boolean {
  const level = getPWAAccessLevel(roleName)
  return level >= minLevel
}

/**
 * Redireciona para página inicial apropriada do PWA baseado no role
 */
export function getPWAHomePage(roleName: RoleName): string {
  switch (roleName) {
    case 'Admin':
    case 'Gestores':
      return '/pwa' // Dashboard principal do PWA
    
    case 'Supervisores':
      return '/pwa/aprovacoes' // Supervisores vão direto para aprovações
    
    case 'Operários':
      return '/pwa/ponto' // Operários vão direto para ponto
    
    case 'Clientes':
      return '/pwa/documentos' // Clientes vão direto para documentos
    
    default:
      return '/pwa'
  }
}

/**
 * Obtém descrição do que o role pode fazer no PWA
 */
export function getPWARoleDescription(roleName: RoleName): string {
  switch (roleName) {
    case 'Admin':
      return 'Acesso completo a todos os módulos do aplicativo'
    
    case 'Gestores':
      return 'Acesso completo com gerenciamento de equipes e aprovações'
    
    case 'Supervisores':
      return 'Visualização de ponto, aprovação de horas extras e gestão de documentos'
    
    case 'Operários':
      return 'Registro de ponto e visualização de documentos'
    
    case 'Clientes':
      return 'Visualização e assinatura de documentos'
    
    default:
      return 'Acesso limitado'
  }
}

// ========================================
// CONFIGURAÇÕES DE FUNCIONALIDADES DO PWA
// ========================================

/**
 * Funcionalidades disponíveis no PWA por role
 */
export const PWA_FEATURES: Record<RoleName, string[]> = {
  'Admin': [
    'Registro de ponto',
    'Visualização de espelho de ponto',
    'Aprovação de horas extras',
    'Visualização de gruas',
    'Gestão de documentos',
    'Assinatura de documentos',
    'Notificações',
    'Configurações avançadas'
  ],
  'Gestores': [
    'Registro de ponto',
    'Visualização de espelho de ponto',
    'Aprovação de horas extras',
    'Visualização de gruas',
    'Gestão de documentos',
    'Assinatura de documentos',
    'Notificações',
    'Configurações avançadas'
  ],
  'Supervisores': [
    'Registro de ponto',
    'Visualização de espelho de ponto',
    'Aprovação de horas extras',
    'Visualização de gruas',
    'Visualização de documentos',
    'Assinatura de documentos',
    'Notificações'
  ],
  'Operários': [
    'Registro de ponto',
    'Visualização de espelho de ponto',
    'Visualização de documentos',
    'Assinatura de documentos',
    'Notificações'
  ],
  'Clientes': [
    'Visualização de documentos',
    'Assinatura de documentos',
    'Notificações'
  ]
}

/**
 * Obtém funcionalidades disponíveis para um role
 */
export function getPWAFeatures(roleName: RoleName): string[] {
  return PWA_FEATURES[roleName] || []
}

// ========================================
// EXPORTS
// ========================================

export default {
  PWA_MENU_ITEMS,
  getPWAPermissions,
  hasPWAPermission,
  hasPWAAnyPermission,
  hasPWAAllPermissions,
  getAccessiblePWAMenuItems,
  canAccessPWA,
  getPWAAccessLevel,
  hasPWAMinLevel,
  getPWAHomePage,
  getPWARoleDescription,
  getPWAFeatures
}


