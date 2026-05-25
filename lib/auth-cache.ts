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

      // PRIORIDADE: Usar profile.id (ID numérico) ao invés de user.id (UUID)
      // O profile.id é o ID correto da tabela usuarios (119)
      // O user.id é o UUID do Supabase Auth e não deve ser usado como funcionario_id
      const profileId = data.data?.profile?.id || null
      const userData = data.data?.user || data.data?.profile
      
      // Atualizar user.id com profile.id se profile.id existir
      if (profileId && userData) {
        userData.id = profileId
        console.log(`🔐 Atualizando user.id de UUID para profile.id (${profileId})`)
      }

      // Atualizar userData com role e level do endpoint
      if (userData && data.data?.role) {
        userData.role = data.data.role
      }
      if (userData && data.data?.level !== undefined) {
        userData.level = data.data.level
      }

      // Atualizar userData com funcionario_id do profile se existir
      const funcionarioId = data.data?.profile?.funcionario_id || null
      if (funcionarioId && userData) {
        userData.funcionario_id = funcionarioId
        // Garantir que user_metadata também tenha o funcionario_id se existir
        if (userData.user_metadata) {
          userData.user_metadata.funcionario_id = funcionarioId
        } else if (data.data?.user?.user_metadata) {
          userData.user_metadata = {
            ...data.data.user.user_metadata,
            funcionario_id: funcionarioId
          }
        } else {
          userData.user_metadata = {
            funcionario_id: funcionarioId
          }
        }
        console.log(`🔐 Atualizando funcionario_id: ${funcionarioId}`)
      }
      
      // Garantir que profile esteja no userData
      if (data.data?.profile && userData) {
        userData.profile = data.data.profile
      }

      const authData: AuthCacheData = {
        user: userData,
        perfil: data.data?.perfil || null,
        permissoes: data.data?.permissoes || [],
        timestamp: Date.now(),
        loading: false
      };

      // Salvar no localStorage como backup
      localStorage.setItem('user_profile', JSON.stringify(authData.user));
      localStorage.setItem('user_perfil', JSON.stringify(authData.perfil));
      localStorage.setItem('user_permissoes', JSON.stringify(authData.permissoes));
      
      // Salvar role e level separadamente
      if (data.data?.role) {
        localStorage.setItem('user_role', data.data.role);
      }
      if (data.data?.level !== undefined && data.data?.level !== null) {
        localStorage.setItem('user_level', String(data.data.level));
      }
      
      // Atualizar user_data principal com o ID, role, level e funcionario_id corretos
      if (userData) {
        const currentUserData = localStorage.getItem('user_data')
        if (currentUserData) {
          try {
            const parsedUserData = JSON.parse(currentUserData)
            // Atualizar o ID com profile.id se disponível
            if (profileId) {
              parsedUserData.id = profileId
            }
            // Atualizar role se disponível
            if (data.data?.role) {
              parsedUserData.role = data.data.role
              // Garantir que user_metadata também tenha o role se existir
              if (parsedUserData.user_metadata) {
                parsedUserData.user_metadata.role = data.data.role
              } else {
                parsedUserData.user_metadata = { role: data.data.role }
              }
            }
            // Atualizar level se disponível
            if (data.data?.level !== undefined && data.data?.level !== null) {
              parsedUserData.level = data.data.level
            }
            // Atualizar funcionario_id se disponível
            if (funcionarioId) {
              parsedUserData.funcionario_id = funcionarioId
              if (parsedUserData.user_metadata) {
                parsedUserData.user_metadata.funcionario_id = funcionarioId
              } else {
                parsedUserData.user_metadata = { funcionario_id: funcionarioId }
              }
            }
            // Atualizar profile se disponível
            if (data.data?.profile) {
              parsedUserData.profile = data.data.profile
            }
            // Atualizar obras_responsavel se disponível (responsável de obra)
            if (data.data?.obras_responsavel) {
              parsedUserData.obras_responsavel = data.data.obras_responsavel
              parsedUserData.is_responsavel_obra = data.data.obras_responsavel.length > 0
            }
            if (data.data?.pwa_profile) {
              parsedUserData.pwa_profile = data.data.pwa_profile
            }
            if (data.data?.user?.pwa_profile) {
              parsedUserData.pwa_profile = data.data.user.pwa_profile
            }
            localStorage.setItem('user_data', JSON.stringify(parsedUserData))
            console.log(`🔐 user_data atualizado: id=${profileId}, role=${data.data?.role}, level=${data.data?.level}, funcionario_id=${funcionarioId}`)
          } catch (e) {
            console.warn('Erro ao atualizar user_data:', e)
          }
        } else {
          // Se não existe user_data, criar um básico
          const newUserData = {
            id: profileId || userData.id,
            email: userData.email || '',
            role: data.data?.role || null,
            level: data.data?.level || null,
            funcionario_id: funcionarioId || null,
            user_metadata: {
              ...(funcionarioId && { funcionario_id: funcionarioId }),
              ...(data.data?.role && { role: data.data.role }),
              ...(data.data?.user?.user_metadata || {})
            },
            profile: data.data?.profile || null,
            obras_responsavel: data.data?.obras_responsavel || null,
            is_responsavel_obra: (data.data?.obras_responsavel?.length || 0) > 0,
            pwa_profile: data.data?.pwa_profile || data.data?.user?.pwa_profile || null,
            ...userData
          }
          localStorage.setItem('user_data', JSON.stringify(newUserData))
          console.log(`🔐 user_data criado: id=${newUserData.id}, role=${newUserData.role}, funcionario_id=${newUserData.funcionario_id}`)
        }
      }
      
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
