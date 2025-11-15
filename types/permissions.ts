/**
 * Tipos e Interfaces do Sistema de Permissões Simplificado
 * 
 * Sistema baseado em 5 roles principais com hierarquia de acesso.
 */

// ========================================
// TIPOS DE ROLES
// ========================================

/**
 * Nomes dos 5 roles principais do sistema
 */
export type RoleName = 'Admin' | 'Gestores' | 'Supervisores' | 'Operários' | 'Clientes'

/**
 * Formato de uma permissão: "modulo:acao"
 * Exemplo: "gruas:visualizar", "ponto:aprovar"
 */
export type Permission = string

/**
 * Níveis de acesso hierárquicos
 */
export type AccessLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// ========================================
// INTERFACES
// ========================================

/**
 * Interface completa de um Role/Perfil
 */
export interface Role {
  id: number
  nome: RoleName
  nivel: AccessLevel
  descricao: string
  permissoes: Permission[]
}

/**
 * Interface de informações do perfil do usuário
 */
export interface UserProfile {
  id: number
  nome: RoleName
  nivel_acesso: AccessLevel
  descricao: string
  status: 'Ativo' | 'Inativo'
}

/**
 * Interface de dados do usuário autenticado
 */
export interface AuthUser {
  id: string
  email: string
  nome: string
  role: RoleName | null
  perfil: UserProfile | null
  permissions: Permission[]
  level: AccessLevel
  status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'
  funcionario_id?: number
}

/**
 * Interface para contexto de autenticação
 */
export interface AuthContextType {
  user: AuthUser | null
  perfil: UserProfile | null
  permissoes: Permission[]
  loading: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ========================================
// CONSTANTES DOS 5 ROLES
// ========================================

export const ROLES: Role[] = [
  {
    id: 1,
    nome: 'Admin',
    nivel: 10,
    descricao: 'Acesso completo ao sistema',
    permissoes: ['*'] // Wildcard = todas as permissões
  },
  {
    id: 2,
    nome: 'Gestores',
    nivel: 9,
    descricao: 'Acesso gerencial completo (exceto RH e Financeiro)',
    permissoes: [
      // Dashboard
      'dashboard:visualizar',
      
      // Gruas
      'gruas:visualizar',
      'gruas:criar',
      'gruas:editar',
      'gruas:excluir',
      'gruas:gerenciar',
      'gruas:relatorios',
      
      // Obras
      'obras:visualizar',
      'obras:criar',
      'obras:editar',
      'obras:excluir',
      'obras:gerenciar',
      'obras:relatorios',
      
      // Clientes
      'clientes:visualizar',
      'clientes:criar',
      'clientes:editar',
      'clientes:excluir',
      'clientes:gerenciar',
      
      // Contratos
      'contratos:visualizar',
      'contratos:criar',
      'contratos:editar',
      'contratos:excluir',
      'contratos:gerenciar',
      
      // Funcionários (apenas visualizar, sem gerenciar)
      'funcionarios:visualizar',
      
      // NÃO TEM ACESSO A PONTO ELETRÔNICO
      // - ponto:*
      // - ponto_eletronico:*
      
      // Documentos
      'documentos:visualizar',
      'documentos:criar',
      'documentos:editar',
      'documentos:excluir',
      'documentos:gerenciar',
      'documentos:assinatura',
      'assinatura_digital:visualizar',
      'assinatura_digital:gerenciar',
      
      // Livro de Gruas
      'livros_gruas:visualizar',
      'livros_gruas:criar',
      'livros_gruas:editar',
      'livros_gruas:gerenciar',
      
      // Estoque
      'estoque:visualizar',
      'estoque:criar',
      'estoque:editar',
      'estoque:excluir',
      'estoque:gerenciar',
      'estoque:movimentacoes',
      'estoque:relatorios',
      
      // Justificativas (apenas visualizar)
      'justificativas:visualizar',
      
      // Notificações
      'notificacoes:visualizar',
      'notificacoes:gerenciar',
      
      // Relatórios gerais
      'relatorios:visualizar',
      'relatorios:gerenciar',
      'relatorios:exportar',
      
      // Histórico
      'historico:visualizar',
      
      // NÃO TEM ACESSO A:
      // - rh:*
      // - financeiro:*
      // - usuarios:gerenciar (apenas visualizar funcionários)
      // - ponto:gerenciar, ponto:aprovacoes
    ]
  },
  {
    id: 3,
    nome: 'Supervisores',
    nivel: 6,
    descricao: 'Supervisão operacional - Gruas, Obras, Documentos, Livro Grua, Estoque',
    permissoes: [
      // Dashboard
      'dashboard:visualizar',
      
      // Gruas
      'gruas:visualizar',
      'gruas:criar',
      'gruas:editar',
      'gruas:excluir',
      'gruas:gerenciar',
      'gruas:relatorios',
      
      // Obras
      'obras:visualizar',
      'obras:criar',
      'obras:editar',
      'obras:excluir',
      'obras:gerenciar',
      'obras:relatorios',
      
      // NÃO TEM ACESSO A PONTO ELETRÔNICO
      // - ponto:*
      // - ponto_eletronico:*
      
      // Documentos
      'documentos:visualizar',
      'documentos:criar',
      'documentos:editar',
      'documentos:excluir',
      'documentos:gerenciar',
      'documentos:assinatura',
      'assinatura_digital:visualizar',
      'assinatura_digital:gerenciar',
      
      // Livro de Gruas
      'livros_gruas:visualizar',
      'livros_gruas:criar',
      'livros_gruas:editar',
      'livros_gruas:gerenciar',
      
      // Estoque
      'estoque:visualizar',
      'estoque:criar',
      'estoque:editar',
      'estoque:excluir',
      'estoque:gerenciar',
      'estoque:movimentacoes',
      'estoque:relatorios',
      
      // Justificativas
      'justificativas:visualizar',
      'justificativas:aprovar',
      'justificativas:gerenciar',
      
      // Notificações
      'notificacoes:visualizar',
      'notificacoes:gerenciar'
    ]
  },
  {
    id: 4,
    nome: 'Operários',
    nivel: 4,
    descricao: 'Operação diária via APP - Ponto e Documentos',
    permissoes: [
      // Ponto (apenas próprio ponto)
      'ponto:visualizar',
      'ponto:registrar',
      'ponto_eletronico:visualizar',
      'ponto_eletronico:registrar',
      
      // Documentos (visualização e assinatura)
      'documentos:visualizar',
      'documentos:assinatura',
      'assinatura_digital:visualizar',
      
      // Justificativas (próprias)
      'justificativas:criar',
      'justificativas:visualizar',
      
      // Notificações (próprias)
      'notificacoes:visualizar'
    ]
  },
  {
    id: 5,
    nome: 'Clientes',
    nivel: 1,
    descricao: 'Acesso limitado - Visualização e assinatura de documentos',
    permissoes: [
      // Documentos (apenas visualização e assinatura)
      'documentos:visualizar',
      'documentos:assinatura',
      'assinatura_digital:visualizar',
      
      // Obras (apenas visualizar próprias obras)
      'obras:visualizar',
      
      // Notificações (próprias)
      'notificacoes:visualizar'
    ]
  }
]

// ========================================
// MAPEAMENTOS
// ========================================

/**
 * Mapeamento de permissões por role
 */
export const ROLES_PERMISSIONS: Record<RoleName, Permission[]> = {
  'Admin': ROLES[0].permissoes,
  'Gestores': ROLES[1].permissoes,
  'Supervisores': ROLES[2].permissoes,
  'Operários': ROLES[3].permissoes,
  'Clientes': ROLES[4].permissoes
}

/**
 * Mapeamento de níveis por role
 */
export const ROLES_LEVELS: Record<RoleName, AccessLevel> = {
  'Admin': 10,
  'Gestores': 9,
  'Supervisores': 6,
  'Operários': 4,
  'Clientes': 1
}

// ========================================
// MÓDULOS DO SISTEMA
// ========================================

export const MODULES = {
  DASHBOARD: 'dashboard',
  USUARIOS: 'usuarios',
  PERFIS: 'perfis',
  GRUAS: 'gruas',
  OBRAS: 'obras',
  PONTO: 'ponto',
  PONTO_ELETRONICO: 'ponto_eletronico',
  DOCUMENTOS: 'documentos',
  ASSINATURA_DIGITAL: 'assinatura_digital',
  LIVROS_GRUAS: 'livros_gruas',
  ESTOQUE: 'estoque',
  FINANCEIRO: 'financeiro',
  RH: 'rh',
  CLIENTES: 'clientes',
  RELATORIOS: 'relatorios',
  JUSTIFICATIVAS: 'justificativas',
  NOTIFICACOES: 'notificacoes',
  CONFIGURACOES: 'configuracoes',
  EMAIL: 'email',
  HISTORICO: 'historico',
  LOCACOES: 'locacoes'
} as const

export type ModuleName = typeof MODULES[keyof typeof MODULES]

// ========================================
// AÇÕES DO SISTEMA
// ========================================

export const ACTIONS = {
  VISUALIZAR: 'visualizar',
  CRIAR: 'criar',
  EDITAR: 'editar',
  EXCLUIR: 'excluir',
  GERENCIAR: 'gerenciar',
  RELATORIOS: 'relatorios',
  APROVACOES: 'aprovacoes',
  APROVAR: 'aprovar',
  REGISTRAR: 'registrar',
  ASSINATURA: 'assinatura',
  MOVIMENTACOES: 'movimentacoes'
} as const

export type ActionName = typeof ACTIONS[keyof typeof ACTIONS]

// ========================================
// PERMISSÕES PWA
// ========================================

export const PWA_PERMISSIONS: Record<RoleName, Permission[]> = {
  'Admin': ['*'],
  'Gestores': ['*'],
  'Supervisores': [
    'ponto:visualizar',
    'ponto:registrar',
    'ponto:aprovacoes',
    'documentos:visualizar',
    'documentos:gerenciar',
    'documentos:assinatura',
    'gruas:visualizar',
    'notificacoes:visualizar'
  ],
  'Operários': [
    'ponto:visualizar',
    'ponto:registrar',
    'documentos:visualizar',
    'documentos:assinatura',
    'notificacoes:visualizar'
  ],
  'Clientes': [
    'documentos:visualizar',
    'documentos:assinatura',
    'notificacoes:visualizar'
  ]
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Obtém as permissões de um role
 */
export function getRolePermissions(roleName: RoleName): Permission[] {
  return ROLES_PERMISSIONS[roleName] || []
}

/**
 * Obtém o nível de acesso de um role
 */
export function getRoleLevel(roleName: RoleName): AccessLevel {
  return ROLES_LEVELS[roleName] || 1
}

/**
 * Mapeamento de nomes antigos para novos (retrocompatibilidade)
 */
export const ROLE_NAME_MAPPING: Record<string, RoleName> = {
  // Nomes novos (passam direto)
  'Admin': 'Admin',
  'Gestores': 'Gestores',
  'Supervisores': 'Supervisores',
  'Operários': 'Operários',
  'Clientes': 'Clientes',
  // Nomes antigos → novos
  'Administrador': 'Admin',
  'Gerente': 'Gestores',
  'Supervisor': 'Supervisores',
  'Operador': 'Operários',
  'Operario': 'Operários',
  'Cliente': 'Clientes',
  'Visualizador': 'Operários', // Visualizador foi removido, vira Operário
  // Lowercase variants
  'admin': 'Admin',
  'administrador': 'Admin',
  'gestores': 'Gestores',
  'gerente': 'Gestores',
  'supervisores': 'Supervisores',
  'supervisor': 'Supervisores',
  'operarios': 'Operários',
  'operários': 'Operários',
  'operador': 'Operários',
  'operario': 'Operários',
  'clientes': 'Clientes',
  'cliente': 'Clientes',
  'visualizador': 'Operários'
}

/**
 * Normaliza nome do role para o formato correto
 */
export function normalizeRoleName(roleName: string | null | undefined): RoleName | null {
  if (!roleName) return null
  return ROLE_NAME_MAPPING[roleName] || null
}

/**
 * Verifica se um role é válido
 */
export function isValidRole(roleName: string): roleName is RoleName {
  return roleName in ROLES_PERMISSIONS || roleName in ROLE_NAME_MAPPING
}

/**
 * Obtém informações completas de um role
 */
export function getRoleInfo(roleName: RoleName): Role | null {
  return ROLES.find(role => role.nome === roleName) || null
}

/**
 * Verifica se um role tem nível mínimo
 */
export function hasMinLevel(roleName: RoleName, minLevel: AccessLevel): boolean {
  const roleLevel = getRoleLevel(roleName)
  return roleLevel >= minLevel
}

/**
 * Lista todos os roles disponíveis
 */
export function getAllRoles(): RoleName[] {
  return Object.keys(ROLES_PERMISSIONS) as RoleName[]
}

/**
 * Obtém permissões PWA de um role
 */
export function getPWAPermissions(roleName: RoleName): Permission[] {
  return PWA_PERMISSIONS[roleName] || []
}

/**
 * Verifica se uma permissão corresponde a um pattern (suporta wildcard)
 * @param permission - Permissão a verificar (ex: "gruas:visualizar")
 * @param pattern - Pattern a comparar (ex: "gruas:*" ou "*")
 */
export function matchesPermissionPattern(permission: Permission, pattern: Permission): boolean {
  if (pattern === '*') return true
  if (permission === pattern) return true
  
  const [patternModule, patternAction] = pattern.split(':')
  const [permModule, permAction] = permission.split(':')
  
  if (patternModule === permModule && patternAction === '*') return true
  
  return false
}

// ========================================
// EXPORTS DEFAULT
// ========================================

export default {
  ROLES,
  ROLES_PERMISSIONS,
  ROLES_LEVELS,
  MODULES,
  ACTIONS,
  PWA_PERMISSIONS,
  getRolePermissions,
  getRoleLevel,
  isValidRole,
  getRoleInfo,
  hasMinLevel,
  getAllRoles,
  getPWAPermissions,
  matchesPermissionPattern
}


