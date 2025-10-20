const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Interfaces baseadas na resposta do endpoint /api/relatorios/dashboard
export interface DashboardData {
  resumo_geral: {
    total_gruas: number;
    gruas_ocupadas: number;
    gruas_disponiveis: number;
    taxa_utilizacao: number;
    valor_total_parque: number;
    receita_mes_atual: number;
  };
  distribuicao: {
    por_status: Record<string, number>;
    por_tipo: Record<string, number>;
  };
  manutencao: {
    manutencoes_proximas: number;
    proxima_semana: string;
  };
  top_gruas: Array<{
    grua: {
      id: number;
      modelo: string;
      fabricante: string;
    };
    total_locacoes: number;
    dias_total_locacao: number;
    receita_total: number;
    obras_visitadas: number;
    taxa_utilizacao: number;
    receita_media_dia: number;
  }>;
  alertas: Array<{
    tipo: string;
    prioridade: string;
    mensagem: string;
    acao: string;
  }>;
  ultimas_atividades: Array<{
    tipo: string;
    acao: string;
    detalhes: string;
    timestamp: string;
    usuario: string;
  }>;
  ultima_atualizacao: string;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export const apiDashboard = {
  async carregar(): Promise<DashboardData> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Token de acesso não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}/relatorios/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    const result: DashboardResponse = await response.json();
    
    if (!result.success) {
      throw new Error('Falha ao carregar dados do dashboard');
    }

    return result.data;
  }
};
