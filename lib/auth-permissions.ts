/**
 * Utilitário para carregar permissões do usuário após login
 */

import { authCache } from './auth-cache'

export interface UserPermissions {
  permissoes: Array<{
    id: number;
    nome: string;
    descricao: string;
    modulo: string;
    acao: string;
  }>;
  perfil: {
    id: number;
    nome: string;
    nivel_acesso: string;
    descricao: string;
  } | null;
}

/**
 * Carrega as permissões do usuário do backend usando cache centralizado
 */
export async function loadUserPermissions(): Promise<UserPermissions> {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('Token não encontrado');
  }

  try {
    console.log('🔐 Carregando permissões do usuário usando cache...');
    
    const authData = await authCache.getAuthData();
    
    const permissions = {
      permissoes: authData.permissoes || [],
      perfil: authData.perfil || null
    };
    
    console.log('🔐 Permissões carregadas:', {
      totalPermissoes: permissions.permissoes.length,
      perfil: permissions.perfil?.nome || 'Nenhum'
    });

    return permissions;
  } catch (error) {
    console.error('🔐 Erro ao carregar permissões:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(permission: string): boolean {
  try {
    const permissoes = JSON.parse(localStorage.getItem('user_permissoes') || '[]');
    return permissoes.some((p: any) => p.nome === permission);
  } catch {
    return false;
  }
}

/**
 * Verifica se o usuário tem qualquer uma das permissões fornecidas
 */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(permission));
}

/**
 * Obtém o perfil do usuário do localStorage
 */
export function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem('user_perfil') || 'null');
  } catch {
    return null;
  }
}

/**
 * Obtém todas as permissões do usuário do localStorage
 */
export function getUserPermissions() {
  try {
    return JSON.parse(localStorage.getItem('user_permissoes') || '[]');
  } catch {
    return [];
  }
}