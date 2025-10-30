# 🏢 Implementação de Cargos - Backend

## 📋 Visão Geral

Este documento lista o que está faltando implementar no backend para a funcionalidade de **Cargos**.

## ✅ O que já está implementado

### 1. Rotas da API (`src/routes/cargos.js`)
- ✅ GET `/api/cargos` - Listar cargos (com paginação e filtros)
- ✅ GET `/api/cargos/:id` - Obter cargo por ID
- ✅ POST `/api/cargos` - Criar cargo (com validação Joi)
- ✅ PUT `/api/cargos/:id` - Atualizar cargo
- ✅ DELETE `/api/cargos/:id` - Deletar cargo (soft delete)
- ✅ POST `/api/cargos/:id/reativar` - Reativar cargo

### 2. Funcionalidades Implementadas
- ✅ Rota registrada no `server.js`
- ✅ Middleware de autenticação aplicado
- ✅ Validação com Joi (mais completa que o documento original)
- ✅ Campos adicionais: `nivel`, `salario_minimo`, `salario_maximo`, `requisitos[]`, `competencias[]`
- ✅ Soft delete implementado
- ✅ Funcionários.js atualizado para validar cargos antes de criar/atualizar

## ❌ O que FALTA implementar

### 1. Criar Arquivo de Migração SQL

**Arquivo necessário:** `backend-api/database/migrations/[timestamp]_create_cargos.sql`

```sql
-- Criar tabela cargos
CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  nivel VARCHAR(50) NOT NULL, -- Operacional, Técnico, Supervisor, Gerencial, Diretoria
  salario_minimo DECIMAL(10,2),
  salario_maximo DECIMAL(10,2),
  requisitos JSONB DEFAULT '[]',
  competencias JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON cargos(ativo);
CREATE INDEX IF NOT EXISTS idx_cargos_nome ON cargos(nome);
CREATE INDEX IF NOT EXISTS idx_cargos_nivel ON cargos(nivel);

-- Trigger para updated_at
CREATE TRIGGER update_cargos_updated_at 
BEFORE UPDATE ON cargos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais (seed)
INSERT INTO cargos (nome, descricao, nivel, ativo, requisitos, competencias) VALUES
('Operador', 'Operador de equipamentos pesados', 'Operacional', true, 
 '["CNH Categoria adequada", "Experiência com equipamentos"]'::jsonb,
 '["Operação de gruas", "Sinalização"]'::jsonb),
('Sinaleiro', 'Responsável por sinalização em obras', 'Operacional', true,
 '["Curso de sinalização"]'::jsonb,
 '["Comunicação", "Sinalização"]'::jsonb),
('Técnico Manutenção', 'Técnico responsável pela manutenção de equipamentos', 'Técnico', true,
 '["Formação técnica"]'::jsonb,
 '["Manutenção", "Diagnóstico"]'::jsonb),
('Supervisor', 'Supervisor de equipe e operações', 'Supervisor', true,
 '["Experiência em gestão"]'::jsonb,
 '["Liderança", "Planejamento"]'::jsonb),
('Mecânico', 'Mecânico especializado em equipamentos pesados', 'Técnico', true,
 '["Curso técnico"]'::jsonb,
 '["Manutenção mecânica", "Diagnóstico"]'::jsonb),
('Engenheiro', 'Engenheiro responsável por projetos e obras', 'Gerencial', true,
 '["Ensino superior"]'::jsonb,
 '["Projetos", "Gestão de obras"]'::jsonb),
('Chefe de Obras', 'Responsável pela coordenação geral das obras', 'Gerencial', true,
 '["Experiência comprovada"]'::jsonb,
 '["Coordenação", "Supervisão"]'::jsonb);
```

### 2. Atualizar DELETE para verificar uso de cargo

**Arquivo:** `backend-api/src/routes/cargos.js`

**Problema atual:** O código atual faz apenas soft delete (marca como inativo), mas não verifica se há funcionários usando o cargo.

**Ajuste necessário:**

Na rota DELETE (linha ~323), adicionar verificação antes de desativar:

```javascript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se cargo existe
    const { data: cargo } = await supabaseAdmin
      .from('cargos')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: 'Cargo não encontrado'
      })
    }

    // ⚠️ ADICIONAR: Verificar se há funcionários usando este cargo
    const { data: funcionarios, error: checkError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('cargo_id', id) // ou .eq('cargo', cargo.nome) dependendo da estrutura
      .limit(1)

    if (checkError) {
      throw checkError
    }

    if (funcionarios && funcionarios.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir cargo que está sendo usado por funcionários',
        detalhes: {
          funcionarios_count: funcionarios.length,
          exemplo: funcionarios[0]?.nome
        }
      })
    }

    // Resto do código permanece igual
    const { error } = await supabaseAdmin
      .from('cargos')
      .update({ ativo: false })
      .eq('id', id)
    // ...
  }
})
```

**Nota:** Verificar se a tabela `funcionarios` possui a coluna `cargo_id` (referência para `cargos.id`) ou se usa `cargo` como VARCHAR. Ajustar a query de verificação conforme a estrutura real.

### 3. Atualizar Schema Principal (Opcional)

Se preferir, adicionar a definição da tabela `cargos` no arquivo principal:

**Arquivo:** `backend-api/database/schema.sql`

Adicionar após a tabela de funcionários:

```sql
-- Tabela de cargos
CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    nivel VARCHAR(50) NOT NULL,
    salario_minimo DECIMAL(10,2),
    salario_maximo DECIMAL(10,2),
    requisitos JSONB DEFAULT '[]',
    competencias JSONB DEFAULT '[]',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_cargos_ativo ON cargos(ativo);
CREATE INDEX idx_cargos_nome ON cargos(nome);
CREATE INDEX idx_cargos_nivel ON cargos(nivel);

-- Trigger
CREATE TRIGGER update_cargos_updated_at 
BEFORE UPDATE ON cargos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🚀 Como Implementar

### 1. Criar arquivo de migração

```bash
cd backend-api/database/migrations
```

Criar arquivo com timestamp atual (ex: `20250130_create_cargos.sql`)

### 2. Copiar e executar o SQL

Copiar o SQL da seção "Criar Arquivo de Migração SQL" para o arquivo criado.

### 3. Executar migração no Supabase

- Acessar Supabase Dashboard
- Abrir SQL Editor
- Copiar e executar o conteúdo do arquivo de migração
- Verificar se a tabela foi criada

### 4. Atualizar código de DELETE

Aplicar a alteração sugerida na seção "Atualizar DELETE".

### 5. Testar

```bash
# Testar listagem
curl -X GET http://localhost:3001/api/cargos \
  -H "Authorization: Bearer YOUR_TOKEN"

# Testar criação
curl -X POST http://localhost:3001/api/cargos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nome": "Teste",
    "descricao": "Teste de cargo",
    "nivel": "Operacional"
  }'
```

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | Chave primária |
| nome | VARCHAR(255) | Nome do cargo (único) |
| descricao | TEXT | Descrição do cargo |
| nivel | VARCHAR(50) | Nível hierárquico |
| salario_minimo | DECIMAL(10,2) | Salário mínimo |
| salario_maximo | DECIMAL(10,2) | Salário máximo |
| requisitos | JSONB | Array de requisitos |
| competencias | JSONB | Array de competências |
| ativo | BOOLEAN | Se o cargo está ativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

## 🔍 Verificação Final

Após implementar, verificar:

- [ ] Tabela `cargos` existe no banco
- [ ] Dados iniciais (seed) foram inseridos
- [ ] Rota DELETE verifica uso de cargo antes de excluir
- [ ] Índices foram criados para performance
- [ ] Trigger de updated_at funciona
- [ ] API retorna cargos corretamente

---

**Última Atualização:** Janeiro 2025  
**Status:** ⚠️ Parcialmente implementado - Falta migração SQL e validação de uso
