/**
 * Perfis operacionais do PWA (camada acima dos roles globais)
 */

import type { Permission, RoleName } from '@/types/permissions'
import { normalizeRoleName } from '@/types/permissions'

export type PWAProfile = 'cliente' | 'supervisor' | 'tecnico'

export interface PWAProfileUserData {
  pwa_profile?: PWAProfile | string | null
  role?: string | null
  perfil?: { nome?: string | null } | null
  funcionario_id?: number | string | null
  eh_funcionario?: boolean
  is_responsavel_obra?: boolean
  obras_responsavel?: unknown[] | null
  user_metadata?: {
    tipo?: string | null
    funcionario_id?: number | string | null
  } | null
  user?: {
    user_metadata?: {
      tipo?: string | null
      funcionario_id?: number | string | null
    } | null
  } | null
  profile?: {
    funcionario_id?: number | string | null
    perfil?: { nome?: string | null } | null
  } | null
}

export const PWA_PROFILE_PERMISSIONS: Record<PWAProfile, Permission[]> = {
  cliente: [
    'documentos:visualizar',
    'documentos:gerenciar',
    'documentos:assinatura',
    'gruas:visualizar',
    'obras:visualizar',
    'funcionarios:visualizar',
    'notificacoes:visualizar',
    'notificacoes:gerenciar',
  ],
  supervisor: [
    'ponto:visualizar',
    'ponto:aprovacoes',
    'ponto_eletronico:visualizar',
    'ponto_eletronico:aprovacoes',
    'obras:visualizar',
    'notificacoes:visualizar',
  ],
  tecnico: [
    'ponto:visualizar',
    'ponto:registrar',
    'ponto_eletronico:visualizar',
    'ponto_eletronico:registrar',
    'documentos:visualizar',
    'documentos:assinatura',
    'holerites:visualizar',
    'holerites:baixar',
    'holerites:assinatura',
    'obras:visualizar',
    'notificacoes:visualizar',
  ],
}

export const PWA_PROFILE_ROUTE_ACCESS: Record<string, PWAProfile[]> = {
  '/pwa/aprovacoes': ['supervisor'],
  '/pwa/aprovacao-detalhes': ['supervisor'],
  '/pwa/aprovacao-assinatura': ['supervisor'],
  '/pwa/aprovacao-massa': ['supervisor'],
  '/pwa/cliente/medicoes': ['cliente'],
  '/pwa/cliente/gruas': ['cliente'],
  '/pwa/ponto': ['tecnico'],
  '/pwa/espelho-ponto': ['tecnico'],
  '/pwa/holerites': ['tecnico'],
  '/pwa/validar-obra': ['tecnico'],
  '/pwa/encarregador': ['tecnico'],
}

export const PWA_PROFILE_ROUTE_PATTERNS: Array<{ pattern: RegExp; profiles: PWAProfile[] }> = [
  { pattern: /^\/pwa\/obras\/\d+\/checklist/, profiles: ['tecnico'] },
  { pattern: /^\/pwa\/obras\/\d+\/manutencoes/, profiles: ['tecnico'] },
  { pattern: /^\/pwa\/cliente\/medicoes\//, profiles: ['cliente'] },
  { pattern: /^\/pwa\/cliente\/gruas\//, profiles: ['cliente'] },
]

function perfilNomeIndicaSupervisor(perfilNome: string | null | undefined): boolean {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return raw === 'supervisores' || raw === 'supervisor'
}

function perfilNomeIndicaCliente(perfilNome: string | null | undefined): boolean {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return raw === 'clientes' || raw === 'cliente' || raw === 'visualizador'
}

function perfilNomeIndicaOperario(perfilNome: string | null | undefined): boolean {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return (
    raw === 'operários' ||
    raw === 'operarios' ||
    raw === 'operário' ||
    raw === 'operario' ||
    raw === 'operador'
  )
}

function getPerfilNome(userData: PWAProfileUserData | null | undefined): string | null {
  if (!userData) return null
  try {
    if (typeof window !== 'undefined') {
      const perfilStr = localStorage.getItem('user_perfil')
      if (perfilStr) {
        const p = JSON.parse(perfilStr)
        if (p?.nome) return p.nome
      }
    }
  } catch {
    /* ignore */
  }
  return userData.perfil?.nome ?? userData.profile?.perfil?.nome ?? null
}

function getRole(userData: PWAProfileUserData | null | undefined): string | null {
  if (!userData) return null
  if (userData.role) return userData.role
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_role')
    }
  } catch {
    /* ignore */
  }
  return null
}

function isFuncionarioAtivoForProfile(userData: PWAProfileUserData | null | undefined): boolean {
  if (!userData) return false
  if (userData.eh_funcionario === false) return false
  const normalized = normalizeRoleName(getRole(userData) || undefined)
  if (normalized === 'Clientes') return false
  const perfilNome = getPerfilNome(userData)
  if (perfilNomeIndicaCliente(perfilNome)) return false
  return Boolean(
    userData.eh_funcionario ||
      userData.funcionario_id ||
      userData.profile?.funcionario_id ||
      userData.user_metadata?.funcionario_id
  )
}

/**
 * Resolve o perfil PWA. Prioridade: pwa_profile do backend > perfil ativo > fallback legado.
 */
export function resolvePWAProfile(userData: PWAProfileUserData | null | undefined): PWAProfile | null {
  if (!userData) return null

  if (
    userData.pwa_profile === 'cliente' ||
    userData.pwa_profile === 'supervisor' ||
    userData.pwa_profile === 'tecnico'
  ) {
    return userData.pwa_profile
  }

  const perfilNome = getPerfilNome(userData)
  const role = getRole(userData)
  const normalizedRole = normalizeRoleName(role || undefined)

  if (perfilNomeIndicaCliente(perfilNome) || normalizedRole === 'Clientes') {
    return 'cliente'
  }

  if (perfilNomeIndicaSupervisor(perfilNome)) {
    return 'supervisor'
  }

  if (
    (perfilNomeIndicaOperario(perfilNome) || normalizedRole === 'Operários') &&
    isFuncionarioAtivoForProfile(userData)
  ) {
    return 'tecnico'
  }

  const tipo =
    userData.user_metadata?.tipo ?? userData.user?.user_metadata?.tipo ?? null

  if (tipo === 'cliente') return 'cliente'

  if (tipo === 'responsavel_obra' || userData.is_responsavel_obra) {
    return 'supervisor'
  }

  if (Array.isArray(userData.obras_responsavel) && userData.obras_responsavel.length > 0) {
    if (!perfilNomeIndicaCliente(perfilNome) && normalizedRole !== 'Clientes') {
      return 'supervisor'
    }
  }

  if (tipo === 'funcionario' && isFuncionarioAtivoForProfile(userData)) {
    return 'tecnico'
  }

  return null
}

export function getPWAProfilePermissions(profile: PWAProfile | null): Permission[] {
  if (!profile) return []
  return PWA_PROFILE_PERMISSIONS[profile] || []
}

export function hasPWAProfilePermission(profile: PWAProfile | null, permission: Permission): boolean {
  const permissions = getPWAProfilePermissions(profile)
  if (permissions.includes('*' as Permission)) return true
  if (permissions.includes(permission)) return true
  const [module] = permission.split(':')
  return permissions.includes(`${module}:*` as Permission)
}

export function getPWAProfileHomePage(profile: PWAProfile | null): string {
  switch (profile) {
    case 'cliente':
      return '/pwa/cliente/medicoes'
    case 'supervisor':
      return '/pwa/aprovacoes'
    case 'tecnico':
      return '/pwa/ponto'
    default:
      return '/pwa'
  }
}

export function getPWAProfileDescription(profile: PWAProfile): string {
  switch (profile) {
    case 'cliente':
      return 'Visualize obras, medições, gruas e documentos das suas obras'
    case 'supervisor':
      return 'Aprove horas extras e acompanhe as obras sob sua responsabilidade'
    case 'tecnico':
      return 'Registre ponto, preencha checklists, acesse holerites e documentos'
  }
}

export function canAccessRoute(profile: PWAProfile | null, pathname: string): boolean {
  if (!profile) return false

  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/pwa'

  for (const { pattern, profiles } of PWA_PROFILE_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) {
      return profiles.includes(profile)
    }
  }

  const exactProfiles = PWA_PROFILE_ROUTE_ACCESS[normalized]
  if (exactProfiles) {
    return exactProfiles.includes(profile)
  }

  for (const [routePrefix, profiles] of Object.entries(PWA_PROFILE_ROUTE_ACCESS)) {
    if (normalized.startsWith(routePrefix + '/') || normalized === routePrefix) {
      return profiles.includes(profile)
    }
  }

  return true
}

export function getPWAProfileRedirect(profile: PWAProfile | null): string {
  return getPWAProfileHomePage(profile)
}

export function readPWAProfileFromStorage(): PWAProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user_data')
    if (!raw) return null
    return resolvePWAProfile(JSON.parse(raw))
  } catch {
    return null
  }
}
