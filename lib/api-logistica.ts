import api, { apiWithRetry } from './api';

// Interfaces
export interface Manifesto {
  id: number;
  numero_manifesto: string;
  data_emissao: string;
  motorista_id: number;
  veiculo_id?: number;
  origem: string;
  destino: string;
  status: 'pendente' | 'em_transito' | 'entregue' | 'cancelado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
  motorista?: {
    id: number;
    nome: string;
    cpf: string;
    cnh: string;
    telefone?: string;
  };
  veiculo?: {
    id: number;
    placa: string;
    modelo: string;
    marca: string;
  };
}

export interface ManifestoItem {
  id: number;
  manifesto_id: number;
  grua_id: string;
  obra_origem_id?: number;
  obra_destino_id?: number;
  peso?: number;
  dimensoes?: string;
  observacoes?: string;
  created_at: string;
  grua?: {
    id: string;
    modelo: string;
    fabricante: string;
  };
  obra_origem?: {
    id: number;
    nome: string;
  };
  obra_destino?: {
    id: number;
    nome: string;
  };
}

export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  tipo: string;
  capacidade?: number;
  ano?: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  created_at: string;
  updated_at: string;
}

export interface ManifestoCreate {
  numero_manifesto: string;
  data_emissao: string;
  motorista_id: number;
  veiculo_id?: number;
  origem: string;
  destino: string;
  status?: 'pendente' | 'em_transito' | 'entregue' | 'cancelado';
  observacoes?: string;
}

export interface ManifestoItemCreate {
  grua_id: string;
  obra_origem_id?: number;
  obra_destino_id?: number;
  peso?: number;
  dimensoes?: string;
  observacoes?: string;
}

export interface VeiculoCreate {
  placa: string;
  modelo: string;
  marca: string;
  tipo: string;
  capacidade?: number;
  ano?: number;
  status?: 'ativo' | 'inativo' | 'manutencao';
}

// API de Manifestos (com retry logic)
export const logisticaApi = {
  // Manifestos
  async listManifestos(): Promise<Manifesto[]> {
    return apiWithRetry(async () => {
      const response = await api.get('/logistica/manifestos');
      return response.data.data;
    });
  },

  async getManifesto(id: number): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.get(`/logistica/manifestos/${id}`);
      return response.data.data;
    });
  },

  async createManifesto(data: ManifestoCreate): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.post('/logistica/manifestos', data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async updateManifesto(id: number, data: Partial<ManifestoCreate>): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.put(`/logistica/manifestos/${id}`, data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async deleteManifesto(id: number): Promise<void> {
    return apiWithRetry(async () => {
      await api.delete(`/logistica/manifestos/${id}`);
    }, { maxRetries: 1 });
  },

  async iniciarTransporte(id: number): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.post(`/logistica/manifestos/${id}/iniciar`);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async finalizarManifesto(id: number): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.post(`/logistica/manifestos/${id}/finalizar`);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async cancelarManifesto(id: number, motivo?: string): Promise<Manifesto> {
    return apiWithRetry(async () => {
      const response = await api.post(`/logistica/manifestos/${id}/cancelar`, { motivo });
      return response.data.data;
    }, { maxRetries: 2 });
  },

  // Itens do Manifesto
  async listManifestoItens(manifestoId: number): Promise<ManifestoItem[]> {
    return apiWithRetry(async () => {
      const response = await api.get(`/logistica/manifestos/${manifestoId}/itens`);
      return response.data.data;
    });
  },

  async addManifestoItem(manifestoId: number, data: ManifestoItemCreate): Promise<ManifestoItem> {
    return apiWithRetry(async () => {
      const response = await api.post(`/logistica/manifestos/${manifestoId}/itens`, data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async updateManifestoItem(manifestoId: number, itemId: number, data: Partial<ManifestoItemCreate>): Promise<ManifestoItem> {
    return apiWithRetry(async () => {
      const response = await api.put(`/logistica/manifestos/${manifestoId}/itens/${itemId}`, data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async deleteManifestoItem(manifestoId: number, itemId: number): Promise<void> {
    return apiWithRetry(async () => {
      await api.delete(`/logistica/manifestos/${manifestoId}/itens/${itemId}`);
    }, { maxRetries: 1 });
  },

  // Veículos
  async listVeiculos(): Promise<Veiculo[]> {
    return apiWithRetry(async () => {
      const response = await api.get('/logistica/veiculos');
      return response.data.data;
    });
  },

  async getVeiculo(id: number): Promise<Veiculo> {
    return apiWithRetry(async () => {
      const response = await api.get(`/logistica/veiculos/${id}`);
      return response.data.data;
    });
  },

  async createVeiculo(data: VeiculoCreate): Promise<Veiculo> {
    return apiWithRetry(async () => {
      const response = await api.post('/logistica/veiculos', data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async updateVeiculo(id: number, data: Partial<VeiculoCreate>): Promise<Veiculo> {
    return apiWithRetry(async () => {
      const response = await api.put(`/logistica/veiculos/${id}`, data);
      return response.data.data;
    }, { maxRetries: 2 });
  },

  async deleteVeiculo(id: number): Promise<void> {
    return apiWithRetry(async () => {
      await api.delete(`/logistica/veiculos/${id}`);
    }, { maxRetries: 1 });
  },

  // Motoristas (usa API de funcionários, mas filtrando por cargo)
  async listMotoristas(): Promise<any[]> {
    return apiWithRetry(async () => {
      const response = await api.get('/funcionarios', {
        params: {
          cargo: 'Motorista',
          status: 'Ativo'
        }
      });
      return response.data.data || [];
    });
  }
};

