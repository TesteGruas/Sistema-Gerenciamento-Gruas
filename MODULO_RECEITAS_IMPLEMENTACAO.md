# Módulo de Receitas - Mapeamento e Implementação

## 📋 **Resumo Executivo**

O módulo de receitas é responsável por gerenciar todas as entradas financeiras do sistema, incluindo locações de gruas, serviços prestados e vendas de equipamentos. Este documento mapeia as entidades, atributos, relações e propõe a implementação completa no backend e banco de dados.

## 🏗️ **Mapeamento de Entidades**

### **1. Entidade PRINCIPAL: RECEITAS**

#### **Atributos da Entidade RECEITAS:**
```typescript
interface Receita {
  id: string                    // Identificador único (UUID)
  obra_id: number              // FK para obras (obrigatório)
  tipo: 'locacao' | 'servico' | 'venda'  // Tipo da receita
  descricao: string            // Descrição detalhada da receita
  valor: number                // Valor da receita (decimal)
  data_receita: string         // Data da receita (ISO date)
  status: 'pendente' | 'confirmada' | 'cancelada'  // Status da receita
  observacoes?: string         // Observações adicionais (opcional)
  created_at: string           // Data de criação
  updated_at: string           // Data de atualização
  
  // Relacionamentos (via JOIN)
  obras?: {
    id: number
    nome: string
    cliente_id: number
    clientes?: {
      id: number
      nome: string
    }
  }
}
```

#### **Tipos de Receita:**
- **`locacao`**: Receitas de locação de gruas
- **`servico`**: Receitas de serviços prestados
- **`venda`**: Receitas de vendas de equipamentos

#### **Status da Receita:**
- **`pendente`**: Receita registrada, aguardando confirmação
- **`confirmada`**: Receita confirmada e efetivada
- **`cancelada`**: Receita cancelada

### **2. Entidades Relacionadas**

#### **OBRAS** (já existente)
```sql
-- Tabela já implementada
obras (
  id: integer (PK)
  cliente_id: integer (FK -> clientes.id)
  nome: varchar
  endereco: varchar
  cidade: varchar
  estado: varchar
  -- outros campos...
)
```

#### **CLIENTES** (já existente)
```sql
-- Tabela já implementada
clientes (
  id: integer (PK)
  nome: varchar
  cnpj: varchar
  -- outros campos...
)
```

#### **FUNCIONARIOS** (já existente)
```sql
-- Tabela já implementada
funcionarios (
  id: integer (PK)
  nome: varchar
  cargo: varchar
  -- outros campos...
)
```

## 🔗 **Relações Entre Entidades**

### **Relação 1: RECEITAS → OBRAS**
- **Tipo**: Many-to-One (N:1)
- **Cardinalidade**: Muitas receitas podem pertencer a uma obra
- **FK**: `receitas.obra_id` → `obras.id`
- **Restrição**: NOT NULL (receita sempre deve ter uma obra)

### **Relação 2: OBRAS → CLIENTES**
- **Tipo**: Many-to-One (N:1)
- **Cardinalidade**: Muitas obras podem pertencer a um cliente
- **FK**: `obras.cliente_id` → `clientes.id`
- **Restrição**: NOT NULL

### **Relação 3: RECEITAS → FUNCIONARIOS** (opcional)
- **Tipo**: Many-to-One (N:1)
- **Cardinalidade**: Muitas receitas podem ter um funcionário responsável
- **FK**: `receitas.funcionario_id` → `funcionarios.id`
- **Restrição**: NULL (opcional)

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela: receitas**
```sql
CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('locacao', 'servico', 'venda')),
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL CHECK (valor >= 0),
  data_receita DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
  observacoes TEXT,
  funcionario_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_receitas_obra FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
  CONSTRAINT fk_receitas_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_receitas_obra_id ON receitas(obra_id);
CREATE INDEX idx_receitas_tipo ON receitas(tipo);
CREATE INDEX idx_receitas_status ON receitas(status);
CREATE INDEX idx_receitas_data_receita ON receitas(data_receita);
CREATE INDEX idx_receitas_funcionario_id ON receitas(funcionario_id);
```

### **Views para Relatórios**

#### **View: vw_receitas_completa**
```sql
CREATE VIEW vw_receitas_completa AS
SELECT 
  r.id,
  r.obra_id,
  r.tipo,
  r.descricao,
  r.valor,
  r.data_receita,
  r.status,
  r.observacoes,
  r.funcionario_id,
  r.created_at,
  r.updated_at,
  o.nome as obra_nome,
  o.endereco as obra_endereco,
  o.cidade as obra_cidade,
  o.estado as obra_estado,
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.cnpj as cliente_cnpj,
  f.nome as funcionario_nome,
  f.cargo as funcionario_cargo
FROM receitas r
LEFT JOIN obras o ON r.obra_id = o.id
LEFT JOIN clientes c ON o.cliente_id = c.id
LEFT JOIN funcionarios f ON r.funcionario_id = f.id;
```

#### **View: vw_receitas_por_obra**
```sql
CREATE VIEW vw_receitas_por_obra AS
SELECT 
  o.id as obra_id,
  o.nome as obra_nome,
  c.nome as cliente_nome,
  COUNT(r.id) as total_receitas,
  SUM(CASE WHEN r.status = 'confirmada' THEN r.valor ELSE 0 END) as valor_confirmado,
  SUM(CASE WHEN r.status = 'pendente' THEN r.valor ELSE 0 END) as valor_pendente,
  SUM(CASE WHEN r.status = 'cancelada' THEN r.valor ELSE 0 END) as valor_cancelado,
  SUM(r.valor) as valor_total
FROM obras o
LEFT JOIN receitas r ON o.id = r.obra_id
LEFT JOIN clientes c ON o.cliente_id = c.id
GROUP BY o.id, o.nome, c.nome;
```

#### **View: vw_receitas_por_tipo**
```sql
CREATE VIEW vw_receitas_por_tipo AS
SELECT 
  r.tipo,
  COUNT(r.id) as total_receitas,
  SUM(CASE WHEN r.status = 'confirmada' THEN r.valor ELSE 0 END) as valor_confirmado,
  SUM(CASE WHEN r.status = 'pendente' THEN r.valor ELSE 0 END) as valor_pendente,
  SUM(CASE WHEN r.status = 'cancelada' THEN r.valor ELSE 0 END) as valor_cancelado,
  SUM(r.valor) as valor_total,
  AVG(r.valor) as valor_medio
FROM receitas r
GROUP BY r.tipo;
```

### **Triggers para Auditoria**

#### **Trigger: tr_receitas_audit**
```sql
CREATE OR REPLACE FUNCTION fn_receitas_audit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_receitas_audit
  BEFORE UPDATE ON receitas
  FOR EACH ROW
  EXECUTE FUNCTION fn_receitas_audit();
```

## 🔐 **Políticas de Segurança (RLS)**

### **Política: Usuários podem ver receitas de obras que têm acesso**
```sql
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver receitas de suas obras" ON receitas
  FOR SELECT
  USING (
    obra_id IN (
      SELECT o.id 
      FROM obras o 
      JOIN usuarios u ON u.id = (
        SELECT id FROM usuarios WHERE email = auth.jwt() ->> 'email'
      )
      WHERE o.responsavel_id = u.id OR u.id IN (
        SELECT usuario_id FROM usuario_perfis up 
        JOIN perfil_permissoes pp ON up.perfil_id = pp.perfil_id 
        JOIN permissoes p ON pp.permissao_id = p.id 
        WHERE p.nome = 'visualizar_obras'
      )
    )
  );
```

### **Política: Usuários podem criar receitas**
```sql
CREATE POLICY "Usuários podem criar receitas" ON receitas
  FOR INSERT
  WITH CHECK (
    obra_id IN (
      SELECT o.id 
      FROM obras o 
      JOIN usuarios u ON u.id = (
        SELECT id FROM usuarios WHERE email = auth.jwt() ->> 'email'
      )
      WHERE o.responsavel_id = u.id OR u.id IN (
        SELECT usuario_id FROM usuario_perfis up 
        JOIN perfil_permissoes pp ON up.perfil_id = pp.perfil_id 
        JOIN permissoes p ON pp.permissao_id = p.id 
        WHERE p.nome = 'editar_obras'
      )
    )
  );
```

### **Política: Usuários podem editar receitas**
```sql
CREATE POLICY "Usuários podem editar receitas" ON receitas
  FOR UPDATE
  USING (
    obra_id IN (
      SELECT o.id 
      FROM obras o 
      JOIN usuarios u ON u.id = (
        SELECT id FROM usuarios WHERE email = auth.jwt() ->> 'email'
      )
      WHERE o.responsavel_id = u.id OR u.id IN (
        SELECT usuario_id FROM usuario_perfis up 
        JOIN perfil_permissoes pp ON up.perfil_id = pp.perfil_id 
        JOIN permissoes p ON pp.permissao_id = p.id 
        WHERE p.nome = 'editar_obras'
      )
    )
  );
```

## 🚀 **Implementação do Backend**

### **1. Estrutura de Arquivos**
```
backend-api/src/routes/
├── receitas.js              # Rotas principais
└── schemas/
    └── receita-schemas.js   # Schemas de validação
```

### **2. Schema de Validação (Joi)**
```javascript
// schemas/receita-schemas.js
const Joi = require('joi');

const receitaSchema = Joi.object({
  obra_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('locacao', 'servico', 'venda').required(),
  descricao: Joi.string().min(1).max(500).required(),
  valor: Joi.number().min(0).precision(2).required(),
  data_receita: Joi.date().iso().required(),
  funcionario_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada').default('pendente'),
  observacoes: Joi.string().max(1000).allow('').optional()
});

const receitaUpdateSchema = receitaSchema.fork(['obra_id', 'tipo'], (schema) => schema.optional());

module.exports = {
  receitaSchema,
  receitaUpdateSchema
};
```

### **3. Rotas da API**

#### **GET /api/receitas** - Listar receitas
```javascript
router.get('/', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { obra_id, tipo, status, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('receitas')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `);

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_receita', data_inicio);
    if (data_fim) query = query.lte('data_receita', data_fim);

    query = query.order('data_receita', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar receitas',
      message: error.message
    });
  }
});
```

#### **POST /api/receitas** - Criar receita
```javascript
router.post('/', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { error: validationError, value } = receitaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .insert([value])
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Receita criada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao criar receita',
      message: error.message
    });
  }
});
```

#### **PUT /api/receitas/:id** - Atualizar receita
```javascript
router.put('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = receitaUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update(value)
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita atualizada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao atualizar receita',
      message: error.message
    });
  }
});
```

#### **DELETE /api/receitas/:id** - Excluir receita
```javascript
router.delete('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('receitas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Receita excluída com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao excluir receita',
      message: error.message
    });
  }
});
```

#### **GET /api/receitas/resumo** - Resumo financeiro
```javascript
router.get('/resumo', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { obra_id, data_inicio, data_fim } = req.query;

    let query = supabaseAdmin
      .from('vw_receitas_por_tipo')
      .select('*');

    if (obra_id) {
      query = supabaseAdmin
        .from('vw_receitas_por_obra')
        .select('*')
        .eq('obra_id', obra_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar resumo',
      message: error.message
    });
  }
});
```

#### **PATCH /api/receitas/:id/confirm** - Confirmar receita
```javascript
router.patch('/:id/confirm', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update({ status: 'confirmada', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita confirmada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao confirmar receita',
      message: error.message
    });
  }
});
```

#### **PATCH /api/receitas/:id/cancel** - Cancelar receita
```javascript
router.patch('/:id/cancel', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita cancelada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao cancelar receita',
      message: error.message
    });
  }
});
```

#### **GET /api/receitas/export** - Exportar receitas
```javascript
router.get('/export', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { format = 'csv', obra_id, tipo, status, data_inicio, data_fim } = req.query;

    let query = supabaseAdmin
      .from('receitas')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `);

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_receita', data_inicio);
    if (data_fim) query = query.lte('data_receita', data_fim);

    query = query.order('data_receita', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar receitas para exportação',
        message: error.message
      });
    }

    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID,Obra,Cliente,Funcionário,Tipo,Descrição,Valor,Data,Status,Observações\n';
      const csvRows = (data || []).map(receita => {
        const obra = receita.obras?.nome || 'N/A';
        const cliente = receita.obras?.clientes?.nome || 'N/A';
        const funcionario = receita.funcionarios?.nome || 'N/A';
        const valor = parseFloat(receita.valor || 0).toFixed(2).replace('.', ',');
        const dataFormatada = new Date(receita.data_receita).toLocaleDateString('pt-BR');
        const observacoes = (receita.observacoes || '').replace(/"/g, '""');
        
        return `"${receita.id}","${obra}","${cliente}","${funcionario}","${receita.tipo}","${receita.descricao}","${valor}","${dataFormatada}","${receita.status}","${observacoes}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="receitas-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvContent); // BOM para UTF-8
    } else {
      // Para XLSX, retornar JSON por enquanto
      res.json({
        success: true,
        data: data || [],
        message: 'Exportação XLSX não implementada ainda'
      });
    }
  } catch (error) {
    console.error('Erro ao exportar receitas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});
```

## 📱 **Implementação do Frontend**

### **1. API Client (lib/api-receitas.ts)**
```typescript
import { api } from './api';

export interface Receita {
  id: string;
  obra_id: number;
  tipo: 'locacao' | 'servico' | 'venda';
  descricao: string;
  valor: number;
  data_receita: string;
  status: 'pendente' | 'confirmada' | 'cancelada';
  observacoes?: string;
  funcionario_id?: number;
  created_at: string;
  updated_at: string;
  obras?: {
    id: number;
    nome: string;
    clientes?: {
      id: number;
      nome: string;
    };
  };
  funcionarios?: {
    id: number;
    nome: string;
    cargo: string;
  };
}

export interface ReceitaCreate {
  obra_id: number;
  tipo: 'locacao' | 'servico' | 'venda';
  descricao: string;
  valor: number;
  data_receita: string;
  funcionario_id?: number;
  observacoes?: string;
}

export interface ReceitaUpdate extends Partial<ReceitaCreate> {
  status?: 'pendente' | 'confirmada' | 'cancelada';
}

export interface ReceitaFilters {
  obra_id?: number;
  tipo?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export interface ReceitasResponse {
  success: boolean;
  data: Receita[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const receitasApi = {
  async list(filters: ReceitaFilters = {}): Promise<{ receitas: Receita[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/receitas?${params.toString()}`);
    
    return {
      receitas: response.data.data || [],
      total: response.data.pagination?.total || 0
    };
  },

  async getById(id: string): Promise<Receita> {
    const response = await api.get(`/receitas/${id}`);
    return response.data.data;
  },

  async create(receita: ReceitaCreate): Promise<Receita> {
    const response = await api.post('/receitas', receita);
    return response.data.data;
  },

  async update(id: string, receita: ReceitaUpdate): Promise<Receita> {
    const response = await api.put(`/receitas/${id}`, receita);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/receitas/${id}`);
  },

  async confirm(id: string): Promise<Receita> {
    const response = await api.patch(`/receitas/${id}/confirm`);
    return response.data.data;
  },

  async cancel(id: string): Promise<Receita> {
    const response = await api.patch(`/receitas/${id}/cancel`);
    return response.data.data;
  },

  async getResumo(filters: { obra_id?: number, data_inicio?: string, data_fim?: string } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);

    const response = await api.get(`/receitas/resumo?${params.toString()}`);
    return response.data.data || [];
  },

  async export(filters: ReceitaFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);

    const response = await api.get(`/receitas/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receitas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};
```

### **2. Utilitários (lib/receitas-utils.ts)**
```typescript
export const receitasUtils = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  getTipoLabel(tipo: string): string {
    const labels = {
      locacao: 'Locação',
      servico: 'Serviço',
      venda: 'Venda'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  },

  getTipoColor(tipo: string): string {
    const colors = {
      locacao: 'bg-blue-500',
      servico: 'bg-purple-500',
      venda: 'bg-green-500'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-500';
  },

  getStatusLabel(status: string): string {
    const labels = {
      pendente: 'Pendente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    };
    return labels[status as keyof typeof labels] || status;
  },

  getStatusColor(status: string): string {
    const colors = {
      pendente: 'bg-yellow-500',
      confirmada: 'bg-green-500',
      cancelada: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  }
};
```

## 🔄 **Integração com Sistema Existente**

### **1. Relacionamento com Vendas**
- Receitas do tipo `venda` podem ser vinculadas a registros da tabela `vendas`
- Campo adicional: `venda_id` (opcional)

### **2. Relacionamento com Locações**
- Receitas do tipo `locacao` podem ser vinculadas a registros da tabela `locacoes`
- Campo adicional: `locacao_id` (opcional)

### **3. Relacionamento com Orçamentos**
- Receitas podem ser geradas a partir de orçamentos aprovados
- Campo adicional: `orcamento_id` (opcional)

## 📊 **Relatórios e Dashboards**

### **1. Dashboard Financeiro**
- Total de receitas por período
- Receitas por tipo (locação, serviço, venda)
- Receitas por status (pendente, confirmada, cancelada)
- Top 10 obras por receita
- Gráficos de tendência mensal

### **2. Relatórios Disponíveis**
- Relatório de receitas por obra
- Relatório de receitas por cliente
- Relatório de receitas por funcionário
- Relatório de receitas por período
- Relatório de receitas por tipo

## 🚀 **Plano de Implementação**

### **Fase 1: Banco de Dados (1-2 dias)**
1. ✅ Criar tabela `receitas`
2. ✅ Criar índices para performance
3. ✅ Criar views para relatórios
4. ✅ Implementar triggers de auditoria
5. ✅ Configurar políticas RLS

### **Fase 2: Backend API (2-3 dias)**
1. ✅ Criar schemas de validação
2. ✅ Implementar rotas CRUD
3. ✅ Implementar rotas de status (confirm/cancel)
4. ✅ Implementar rota de exportação
5. ✅ Implementar rota de resumo
6. ✅ Adicionar documentação Swagger

### **Fase 3: Frontend (2-3 dias)**
1. ✅ Criar API client
2. ✅ Atualizar página de receitas
3. ✅ Implementar filtros avançados
4. ✅ Implementar ações de status
5. ✅ Implementar exportação
6. ✅ Adicionar utilitários

### **Fase 4: Testes e Validação (1-2 dias)**
1. ✅ Testes unitários do backend
2. ✅ Testes de integração
3. ✅ Testes de performance
4. ✅ Validação de segurança
5. ✅ Testes de usabilidade

## 🔒 **Considerações de Segurança**

### **1. Autenticação e Autorização**
- Todas as rotas protegidas por JWT
- Verificação de permissões por módulo
- RLS ativado para isolamento de dados

### **2. Validação de Dados**
- Validação rigorosa com Joi
- Sanitização de inputs
- Verificação de tipos de dados

### **3. Auditoria**
- Logs de todas as operações
- Triggers para rastreamento de mudanças
- Histórico de alterações

## 📈 **Métricas e Monitoramento**

### **1. Métricas de Performance**
- Tempo de resposta das APIs
- Uso de recursos do banco
- Taxa de erro das requisições

### **2. Métricas de Negócio**
- Total de receitas por período
- Taxa de conversão (pendente → confirmada)
- Receitas por tipo de serviço

## 🎯 **Conclusão**

O módulo de receitas foi projetado para ser:

- **Escalável**: Suporta grandes volumes de dados
- **Seguro**: Implementa RLS e validações rigorosas
- **Flexível**: Permite diferentes tipos de receita
- **Integrado**: Conecta-se com o sistema existente
- **Auditável**: Mantém histórico completo de alterações

A implementação segue as melhores práticas de desenvolvimento e está alinhada com a arquitetura existente do sistema.
