# 🏢 Implementação de Cargos - Backend

## 📋 Visão Geral

Este documento descreve os ajustes necessários no backend para implementar a funcionalidade de **Cargos** no sistema de Recursos Humanos.

## 🎯 Objetivo

Permitir que o sistema gerencie cargos de forma dinâmica, onde:
- Os cargos são criados e gerenciados através de uma interface
- Os formulários de funcionário carregam cargos dinamicamente
- Novos cargos podem ser adicionados sem alteração de código

## 🗄️ Estrutura do Banco de Dados

### Tabela: `cargos`

```sql
CREATE TABLE cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_cargos_ativo ON cargos(ativo);
CREATE INDEX idx_cargos_nome ON cargos(nome);
```

### Dados Iniciais (Seed)

```sql
INSERT INTO cargos (nome, descricao, ativo) VALUES
('Operador', 'Operador de equipamentos pesados', true),
('Sinaleiro', 'Responsável por sinalização em obras', true),
('Técnico Manutenção', 'Técnico responsável pela manutenção de equipamentos', true),
('Supervisor', 'Supervisor de equipe e operações', true),
('Mecânico', 'Mecânico especializado em equipamentos pesados', true),
('Engenheiro', 'Engenheiro responsável por projetos e obras', true),
('Chefe de Obras', 'Responsável pela coordenação geral das obras', true);
```

## 🚀 APIs Necessárias

### 1. Listar Cargos

```http
GET /api/cargos
```

**Parâmetros de Query:**
- `ativo` (boolean, opcional): Filtrar por cargos ativos/inativos
- `search` (string, opcional): Buscar por nome do cargo

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Operador",
      "descricao": "Operador de equipamentos pesados",
      "ativo": true,
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ]
}
```

### 2. Criar Cargo

```http
POST /api/cargos
Content-Type: application/json

{
  "nome": "Novo Cargo",
  "descricao": "Descrição do cargo"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "nome": "Novo Cargo",
    "descricao": "Descrição do cargo",
    "ativo": true,
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
  },
  "message": "Cargo criado com sucesso"
}
```

### 3. Obter Cargo por ID

```http
GET /api/cargos/:id
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "Operador",
    "descricao": "Operador de equipamentos pesados",
    "ativo": true,
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
  }
}
```

### 4. Atualizar Cargo

```http
PUT /api/cargos/:id
Content-Type: application/json

{
  "nome": "Operador Atualizado",
  "descricao": "Nova descrição",
  "ativo": true
}
```

### 5. Excluir Cargo

```http
DELETE /api/cargos/:id
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cargo excluído com sucesso"
}
```

## 🔧 Implementação no Backend

### 1. Arquivo: `src/routes/cargos.js`

```javascript
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Listar cargos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { ativo, search } = req.query;
    
    let query = supabase
      .from('cargos')
      .select('*')
      .order('nome', { ascending: true });
    
    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true');
    }
    
    if (search) {
      query = query.ilike('nome', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cargos',
      error: error.message
    });
  }
});

// Criar cargo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    
    if (!nome || !nome.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nome do cargo é obrigatório'
      });
    }
    
    const { data, error } = await supabase
      .from('cargos')
      .insert({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        ativo: true
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Já existe um cargo com este nome'
        });
      }
      throw error;
    }
    
    res.status(201).json({
      success: true,
      data,
      message: 'Cargo criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar cargo',
      error: error.message
    });
  }
});

// Obter cargo por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('cargos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Cargo não encontrado'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter cargo',
      error: error.message
    });
  }
});

// Atualizar cargo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;
    
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome.trim();
    if (descricao !== undefined) updateData.descricao = descricao?.trim() || null;
    if (ativo !== undefined) updateData.ativo = ativo;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('cargos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Cargo não encontrado'
        });
      }
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Já existe um cargo com este nome'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      data,
      message: 'Cargo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cargo',
      error: error.message
    });
  }
});

// Excluir cargo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se há funcionários usando este cargo
    const { data: funcionarios, error: checkError } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('cargo', id)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (funcionarios && funcionarios.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir cargo que está sendo usado por funcionários'
      });
    }
    
    const { error } = await supabase
      .from('cargos')
      .delete()
      .eq('id', id);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Cargo não encontrado'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Cargo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir cargo',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. Atualizar `src/server.js`

```javascript
// Adicionar a rota de cargos
app.use('/api/cargos', require('./routes/cargos'));
```

### 3. Atualizar `package.json` (se necessário)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.9.2",
    "uuid": "^9.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  }
}
```

## 🔄 Atualização da API de Funcionários

### Modificar `src/routes/funcionarios.js`

```javascript
// Na função de listar funcionários, incluir dados do cargo
const { data: funcionarios, error } = await supabase
  .from('funcionarios')
  .select(`
    *,
    cargos!inner(nome, descricao)
  `)
  .order('nome', { ascending: true });
```

## 🧪 Testes

### 1. Teste de Criação de Cargo

```bash
curl -X POST http://localhost:3001/api/cargos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nome": "Teste Cargo",
    "descricao": "Cargo para teste"
  }'
```

### 2. Teste de Listagem

```bash
curl -X GET http://localhost:3001/api/cargos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Validações

### 1. Nome do Cargo
- Obrigatório
- Único (não pode haver dois cargos com o mesmo nome)
- Máximo 255 caracteres

### 2. Descrição
- Opcional
- Máximo 1000 caracteres

### 3. Exclusão
- Não permitir excluir cargo que está sendo usado por funcionários
- Verificar se cargo existe antes de excluir

## 🔒 Segurança

### 1. Autenticação
- Todas as rotas requerem token JWT válido
- Verificar permissões do usuário (apenas admins podem criar/editar cargos)

### 2. Validação de Dados
- Sanitizar entrada de dados
- Validar tipos de dados
- Prevenir SQL injection (usando Supabase)

## 🚀 Deploy

### 1. Executar Migração

```sql
-- Executar no Supabase Dashboard ou via CLI
CREATE TABLE cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir dados iniciais
INSERT INTO cargos (nome, descricao, ativo) VALUES
('Operador', 'Operador de equipamentos pesados', true),
('Sinaleiro', 'Responsável por sinalização em obras', true),
('Técnico Manutenção', 'Técnico responsável pela manutenção de equipamentos', true),
('Supervisor', 'Supervisor de equipe e operações', true),
('Mecânico', 'Mecânico especializado em equipamentos pesados', true),
('Engenheiro', 'Engenheiro responsável por projetos e obras', true),
('Chefe de Obras', 'Responsável pela coordenação geral das obras', true);
```

### 2. Reiniciar Servidor

```bash
# Parar o servidor atual
pm2 stop sistema-gruas

# Iniciar novamente
pm2 start src/server.js --name sistema-gruas
```

## 📊 Monitoramento

### 1. Logs
- Adicionar logs para todas as operações de cargo
- Monitorar erros de validação
- Acompanhar performance das consultas

### 2. Métricas
- Número de cargos criados por dia
- Cargos mais utilizados
- Taxa de erro nas operações

---

**Desenvolvido por**: Sistema de Gerenciamento de Guindastes  
**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025
