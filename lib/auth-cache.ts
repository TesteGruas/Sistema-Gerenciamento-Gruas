/**
 * Sistema de cache centralizado para dados de autenticação
 * Evita múltiplas chamadas para /api/auth/me
 */

import { fetchWithAuth } from './api'

interface AuthCacheData {
  user: any;
  perfil: any;
  permissoes: any[];
  timestamp: number;
  loading: boolean;
}

class AuthCache {
  private cache: AuthCacheData | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private loadingPromise: Promise<AuthCacheData> | null = null;

  /**
   * Verifica se o cache é válido
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    const isExpired = (now - this.cache.timestamp) > this.CACHE_DURATION;
    
    if (isExpired) {
      console.log('🔐 Cache expirado, será recarregado');
      this.cache = null;
      return false;
    }
    
    return true;
  }

  /**
   * Obtém dados do cache ou busca do backend
   */
  async getAuthData(): Promise<AuthCacheData> {
    // Se já está carregando, retorna a mesma promise
    if (this.loadingPromise) {
      console.log('🔐 Aguardando carregamento em andamento...');
      return this.loadingPromise;
    }

    // Se cache é válido, retorna os dados
    if (this.isCacheValid()) {
      console.log('🔐 Retornando dados do cache');
      return this.cache!;
    }

    // Inicia novo carregamento
    console.log('🔐 Iniciando carregamento de dados de autenticação...');
    this.loadingPromise = this.loadAuthData();
    
    try {
      const result = await this.loadingPromise;
      this.cache = result;
      return result;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Carrega dados do backend
   */
  private async loadAuthData(): Promise<AuthCacheData> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    try {
      // Usar fetchWithAuth para aplicar refresh token automaticamente
      const response = await fetchWithAuth('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔐 Dados carregados do backend:', data);

      const authData: AuthCacheData = {
        user: data.data?.user || data.data?.profile,
        perfil: data.data?.perfil || null,
        permissoes: data.data?.permissoes || [],
        timestamp: Date.now(),
        loading: false
      };

      // Salvar no localStorage como backup
      localStorage.setItem('user_profile', JSON.stringify(authData.user));
      localStorage.setItem('user_perfil', JSON.stringify(authData.perfil));
      localStorage.setItem('user_permissoes', JSON.stringify(authData.permissoes));
      
      // Converter permissões para formato string e salvar
      const permissionStrings = authData.permissoes.map((p: any) => p.nome);
      localStorage.setItem('user_permissions', JSON.stringify(permissionStrings));

      return authData;
    } catch (error) {
      console.error('🔐 Erro ao carregar dados de autenticação:', error);
      
      // Fallback para dados do localStorage
      const userProfile = localStorage.getItem('user_profile');
      const userPerfil = localStorage.getItem('user_perfil');
      const userPermissoes = localStorage.getItem('user_permissoes');
      
      if (userProfile && userPerfil && userPermissoes) {
        console.log('🔐 Usando dados do localStorage como fallback');
        return {
          user: JSON.parse(userProfile),
          perfil: JSON.parse(userPerfil),
          permissoes: JSON.parse(userPermissoes),
          timestamp: Date.now(),
          loading: false
        };
      }
      
      throw error;
    }
  }

  /**
   * Força recarregamento dos dados
   */
  async refreshAuthData(): Promise<AuthCacheData> {
    console.log('🔐 Forçando recarregamento de dados...');
    this.cache = null;
    this.loadingPromise = null;
    return this.getAuthData();
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    console.log('🔐 Limpando cache de autenticação...');
    this.cache = null;
    this.loadingPromise = null;
  }

  /**
   * Verifica se está carregando
   */
  isLoading(): boolean {
    return this.loadingPromise !== null;
  }
}

// Instância singleton
export const authCache = new AuthCache();

/**
 * Hook para usar o cache de autenticação
 */
export function useAuthCache() {
  return {
    getAuthData: () => authCache.getAuthData(),
    refreshAuthData: () => authCache.refreshAuthData(),
    clearCache: () => authCache.clearCache(),
    isLoading: () => authCache.isLoading()
  };
}
