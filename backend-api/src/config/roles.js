/**
 * Configuração de Roles e Permissões do Sistema
 * 
 * Sistema simplificado com 5 roles principais e permissões hardcoded.
 * As permissões seguem o formato: "modulo:acao"
 * 
 * Níveis hierárquicos:
 * - Admin (10): Acesso total
 * - Gestores (9): Acesso gerencial completo
 * - Supervisores (6): Operações e supervisão
 * - Operários (4): Operação diária via APP
 * - Clientes (1): Acesso limitado
 */

// ========================================
// DEFINIÇÃO DOS 5 ROLES PRINCIPAIS
// ========================================

export const ROLES = {
  ADMIN: {
    id: 1,
    nome: 'Admin',
    nivel: 10,
    descricao: 'Acesso completo ao sistema',
    permissoes: ['*'] // Wildcard = todas as permissões
  },
  
  GESTORES: {
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
  
  SUPERVISORES: {
    id: 3,
    nome: 'Supervisores',
    nivel: 6,
    descricao: 'Supervisão operacional - Gruas, Obras, Clientes, Contratos, Funcionários, Documentos, Livro Grua, Estoque',
    permissoes: [
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
      
      // Funcionários
      'funcionarios:visualizar',
      'funcionarios:criar',
      'funcionarios:editar',
      'funcionarios:excluir',
      'funcionarios:gerenciar',
      
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
      
      // Justificativas (Ponto)
      'justificativas:visualizar',
      'justificativas:aprovar',
      'justificativas:gerenciar',
      
      // Notificações
      'notificacoes:visualizar',
      'notificacoes:gerenciar',
      
      // Dashboard (acesso básico)
      'dashboard:visualizar'
    ]
  },
  
  OPERARIOS: {
    id: 4,
    nome: 'Operários',
    nivel: 4,
    descricao: 'Operação diária via APP - Ponto, Documentos e Livro de Grua. Acesso contextual a obras onde está alocado.',
    permissoes: [
      // Obras (apenas obras onde está alocado - validação contextual nas rotas)
      'obras:visualizar',
      
      // Ponto (apenas próprio ponto)
      'ponto:visualizar',
      'ponto:registrar',
      'ponto_eletronico:visualizar',
      'ponto_eletronico:registrar',
      
      // Livro de Gruas (registrar atividades)
      'livros_gruas:visualizar',
      'livros_gruas:criar',
      
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
  
  CLIENTES: {
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
  },
  
  FINANCEIRO: {
    id: 6,
    nome: 'Financeiro',
    nivel: 8,
    descricao: 'Gestão financeira, orçamentos, contratos e relatórios financeiros',
    permissoes: [
      // Dashboard
      'dashboard:visualizar',
      
      // Financeiro
      'financeiro:visualizar',
      'financeiro:criar',
      'financeiro:editar',
      'financeiro:excluir',
      'financeiro:gerenciar',
      'financeiro:relatorios',
      
      // Orçamentos
      'orcamentos:visualizar',
      'orcamentos:criar',
      'orcamentos:editar',
      'orcamentos:excluir',
      'orcamentos:gerenciar',
      
      // Contratos
      'contratos:visualizar',
      'contratos:criar',
      'contratos:editar',
      'contratos:excluir',
      'contratos:gerenciar',
      
      // Clientes (visualização e gerenciamento)
      'clientes:visualizar',
      'clientes:gerenciar',
      
      // Documentos (gerenciamento)
      'documentos:visualizar',
      'documentos:gerenciar',
      'assinatura_digital:visualizar',
      'assinatura_digital:gerenciar',
      
      // Notificações
      'notificacoes:visualizar',
      'notificacoes:gerenciar',
      
      // Relatórios financeiros
      'relatorios:visualizar',
      'relatorios:gerenciar',
      'relatorios:exportar'
    ]
  }
}

// ========================================
// MAPEAMENTO DE PERMISSÕES POR ROLE
// ========================================

export const ROLES_PERMISSIONS = {
  'Admin': ROLES.ADMIN.permissoes,
  'Gestores': ROLES.GESTORES.permissoes,
  'Supervisores': ROLES.SUPERVISORES.permissoes,
  'Operários': ROLES.OPERARIOS.permissoes,
  'Clientes': ROLES.CLIENTES.permissoes,
  'Financeiro': ROLES.FINANCEIRO.permissoes
}

// ========================================
// MAPEAMENTO DE NÍVEIS POR ROLE
// ========================================

export const ROLES_LEVELS = {
  'Admin': 10,
  'Gestores': 9,
  'Financeiro': 8,
  'Supervisores': 6,
  'Operários': 4,
  'Clientes': 1
}

// ========================================
// LISTA DE ROLES ORDENADA POR NÍVEL
// ========================================

export const ROLES_LIST = [
  ROLES.ADMIN,
  ROLES.GESTORES,
  ROLES.FINANCEIRO,
  ROLES.SUPERVISORES,
  ROLES.OPERARIOS,
  ROLES.CLIENTES
]

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
}

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
}

// ========================================
// PERMISSÕES ESPECIAIS
// ========================================

/**
 * Permissões que requerem acesso a dados de outros usuários
 */
export const CROSS_USER_PERMISSIONS = [
  'usuarios:visualizar',
  'usuarios:gerenciar',
  'ponto:gerenciar',
  'ponto_eletronico:gerenciar',
  'justificativas:aprovar',
  'documentos:gerenciar',
  'rh:gerenciar'
]

/**
 * Permissões que são exclusivas para Admin
 */
export const ADMIN_ONLY_PERMISSIONS = [
  'usuarios:excluir',
  'perfis:gerenciar',
  'configuracoes:editar',
  'email:configurar'
]

/**
 * Permissões relacionadas ao PWA (aplicativo móvel)
 */
export const PWA_PERMISSIONS = {
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
// MAPEAMENTO DE RETROCOMPATIBILIDADE
// ========================================

/**
 * Mapeamento de nomes antigos para novos (retrocompatibilidade)
 */
export const ROLE_NAME_MAPPING = {
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
  'gestores': 'Gestores',
  'supervisores': 'Supervisores',
  'operarios': 'Operários',
  'operários': 'Operários',
  'clientes': 'Clientes'
}

/**
 * Normaliza nome do role para o formato correto
 * @param {string} roleName - Nome do role (pode ser antigo ou novo)
 * @returns {string|null} - Nome normalizado ou null
 */
export function normalizeRoleName(roleName) {
  if (!roleName) return null
  return ROLE_NAME_MAPPING[roleName] || null
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Obtém as permissões de um role
 * @param {string} roleName - Nome do role
 * @returns {string[]} - Lista de permissões
 */
export function getRolePermissions(roleName) {
  const normalized = normalizeRoleName(roleName)
  return normalized ? (ROLES_PERMISSIONS[normalized] || []) : []
}

/**
 * Obtém o nível de acesso de um role
 * @param {string} roleName - Nome do role
 * @returns {number} - Nível de acesso (1-10)
 */
export function getRoleLevel(roleName) {
  const normalized = normalizeRoleName(roleName)
  return normalized ? (ROLES_LEVELS[normalized] || 0) : 0
}

/**
 * Verifica se um role existe
 * @param {string} roleName - Nome do role
 * @returns {boolean}
 */
export function isValidRole(roleName) {
  return roleName in ROLES_PERMISSIONS || roleName in ROLE_NAME_MAPPING
}

/**
 * Obtém informações completas de um role
 * @param {string} roleName - Nome do role
 * @returns {object|null} - Objeto com informações do role
 */
export function getRoleInfo(roleName) {
  const normalized = normalizeRoleName(roleName)
  if (!normalized) return null
  return ROLES_LIST.find(role => role.nome === normalized) || null
}

/**
 * Verifica se um role tem nível mínimo
 * @param {string} roleName - Nome do role
 * @param {number} minLevel - Nível mínimo requerido
 * @returns {boolean}
 */
export function hasMinLevel(roleName, minLevel) {
  const roleLevel = getRoleLevel(roleName)
  return roleLevel >= minLevel
}

/**
 * Lista todos os roles disponíveis
 * @returns {string[]} - Array com nomes dos roles
 */
export function getAllRoles() {
  return Object.keys(ROLES_PERMISSIONS)
}

/**
 * Obtém permissões PWA de um role
 * @param {string} roleName - Nome do role
 * @returns {string[]} - Lista de permissões PWA
 */
export function getPWAPermissions(roleName) {
  return PWA_PERMISSIONS[roleName] || []
}

// ========================================
// EXPORTS DEFAULT
// ========================================

export default {
  ROLES,
  ROLES_PERMISSIONS,
  ROLES_LEVELS,
  ROLES_LIST,
  MODULES,
  ACTIONS,
  CROSS_USER_PERMISSIONS,
  ADMIN_ONLY_PERMISSIONS,
  PWA_PERMISSIONS,
  ROLE_NAME_MAPPING,
  normalizeRoleName,
  getRolePermissions,
  getRoleLevel,
  isValidRole,
  getRoleInfo,
  hasMinLevel,
  getAllRoles,
  getPWAPermissions
}


