# Paginação - Endpoint Relações Grua-Obra

## 📋 Resumo

Este documento descreve a implementação de paginação no endpoint `/api/livro-grua/relacoes-grua-obra` para melhorar a performance e experiência do usuário.

## 🎯 Objetivo

Adicionar suporte a paginação no endpoint que lista relações grua-obra, permitindo que o frontend carregue os dados em páginas menores ao invés de carregar todos os registros de uma vez.

---

## 🔌 Endpoint Atual

**GET** `/api/livro-grua/relacoes-grua-obra`

**Localização:** `backend-api/src/routes/livro-grua.js` (linha ~31)

---

## 📝 Parâmetros de Query

O endpoint deve aceitar os seguintes parâmetros de query:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | integer | Não | 1 | Número da página (começa em 1) |
| `limit` | integer | Não | 10 | Quantidade de itens por página |
| `funcionario_id` | integer | Não | - | ID do funcionário para filtrar (já existe) |

### Exemplos de URLs

```
GET /api/livro-grua/relacoes-grua-obra?page=1&limit=9
GET /api/livro-grua/relacoes-grua-obra?page=2&limit=18
GET /api/livro-grua/relacoes-grua-obra?page=1&limit=9&funcionario_id=123
```

---

## 📤 Resposta Esperada

### Formato da Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "grua_id": "grua-123",
      "obra_id": 76,
      "data_inicio_locacao": "2025-01-15",
      "data_fim_locacao": "2025-12-31",
      "status": "Ativa",
      "valor_locacao_mensal": 31600.00,
      "observacoes": "Observações...",
      "grua": {
        "id": "grua-123",
        "tipo": "Grua Torre",
        "modelo": "Modelo X",
        "fabricante": "Fabricante Y"
      },
      "obra": {
        "id": 76,
        "nome": "Obra X",
        "endereco": "Rua Y",
        "cidade": "Recife",
        "estado": "PE",
        "status": "Em Andamento"
      }
    }
    // ... mais itens
  ],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Campos de Paginação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pagination.page` | integer | Página atual |
| `pagination.limit` | integer | Itens por página |
| `pagination.total` | integer | Total de registros (sem paginação) |
| `pagination.totalPages` | integer | Total de páginas |
| `pagination.hasNext` | boolean | Se existe próxima página |
| `pagination.hasPrev` | boolean | Se existe página anterior |

**Alternativa (compatibilidade):** Se preferir, pode retornar os campos de paginação no nível raiz:

```json
{
  "success": true,
  "data": [...],
  "total": 45,
  "page": 1,
  "limit": 9,
  "totalPages": 5
}
```

---

## 🔧 Implementação Sugerida

### 1. Atualizar o Endpoint

```javascript
router.get('/relacoes-grua-obra', async (req, res) => {
  try {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      })
    }

    // Obter parâmetros de paginação
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    
    // Validar parâmetros
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Página deve ser maior que 0'
      })
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit deve estar entre 1 e 100'
      })
    }

    // Calcular offset
    const offset = (page - 1) * limit

    // Verificar se o usuário é Administrador ou Gerente
    const userLevel = getRoleLevel(user.role)
    const isAdminOrManager = userLevel >= 8

    let query = supabaseAdmin
      .from('grua_obra')
      .select(`
        id,
        grua_id,
        obra_id,
        data_inicio_locacao,
        data_fim_locacao,
        status,
        valor_locacao_mensal,
        observacoes,
        gruas (
          id,
          tipo,
          modelo,
          fabricante
        ),
        obras (
          id,
          nome,
          endereco,
          cidade,
          estado,
          status
        )
      `, { count: 'exact' }) // Adicionar count para obter total
      .in('status', ['Ativa', 'Pausada'])
      .order('obras(nome)', { ascending: true })
      .order('gruas(id)', { ascending: true })
      .range(offset, offset + limit - 1) // Aplicar paginação

    // Se NÃO for admin/gerente, filtrar apenas obras onde o funcionário está alocado
    if (!isAdminOrManager) {
      const funcionarioId = user.funcionario_id
      
      if (!funcionarioId) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          message: 'Usuário não está associado a um funcionário'
        })
      }

      // Buscar obras onde o funcionário está alocado
      const { data: obrasFuncionario, error: obrasError } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('obra_id')
        .eq('funcionario_id', funcionarioId)
        .eq('status', 'ativo')
      
      if (obrasError) {
        console.error('Erro ao buscar obras do funcionário:', obrasError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar obras do funcionário',
          error: obrasError.message
        })
      }

      if (obrasFuncionario && obrasFuncionario.length > 0) {
        const obraIds = obrasFuncionario.map(o => o.obra_id)
        query = query.in('obra_id', obraIds)
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          message: 'Você não está alocado em nenhuma obra ativa no momento'
        })
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Erro ao buscar relações grua-obra:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar relações',
        error: error.message
      })
    }

    // Transformar os dados
    const relacoes = (data || [])
      .filter(row => row.gruas && row.obras)
      .map(row => ({
        id: row.id,
        grua_id: row.grua_id,
        obra_id: row.obra_id,
        data_inicio_locacao: row.data_inicio_locacao,
        data_fim_locacao: row.data_fim_locacao,
        status: row.status,
        valor_locacao_mensal: row.valor_locacao_mensal,
        observacoes: row.observacoes,
        grua: row.gruas,
        obra: row.obras
      }))

    // Calcular informações de paginação
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    res.json({
      success: true,
      data: relacoes,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasNext: hasNext,
        hasPrev: hasPrev
      },
      filteredByUser: !isAdminOrManager
    })

  } catch (error) {
    console.error('❌ ERRO FATAL ao listar relações grua-obra:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})
```

### 2. Principais Mudanças

1. **Parâmetros de Query:**
   - Adicionar leitura de `page` e `limit` dos query params
   - Validar valores (page >= 1, limit entre 1 e 100)

2. **Supabase Query:**
   - Adicionar `{ count: 'exact' }` no `.select()` para obter o total
   - Usar `.range(offset, offset + limit - 1)` para aplicar paginação

3. **Cálculo de Offset:**
   - `offset = (page - 1) * limit`

4. **Resposta:**
   - Incluir objeto `pagination` com todas as informações necessárias
   - Manter compatibilidade com formato atual adicionando campos no nível raiz também

---

## ✅ Validações

### Validação de Parâmetros

```javascript
// Validar página
if (page < 1) {
  return res.status(400).json({
    success: false,
    message: 'Página deve ser maior que 0'
  })
}

// Validar limit
if (limit < 1) {
  return res.status(400).json({
    success: false,
    message: 'Limit deve ser maior que 0'
  })
}

if (limit > 100) {
  return res.status(400).json({
    success: false,
    message: 'Limit não pode ser maior que 100'
  })
}
```

---

## 🔍 Testes

### Casos de Teste

1. **Paginação básica:**
   ```
   GET /api/livro-grua/relacoes-grua-obra?page=1&limit=9
   ```
   - Deve retornar 9 itens (ou menos se não houver)
   - `pagination.page` deve ser 1
   - `pagination.hasNext` deve ser `true` se houver mais páginas

2. **Segunda página:**
   ```
   GET /api/livro-grua/relacoes-grua-obra?page=2&limit=9
   ```
   - Deve retornar itens 10-18
   - `pagination.hasPrev` deve ser `true`

3. **Última página:**
   ```
   GET /api/livro-grua/relacoes-grua-obra?page=5&limit=9
   ```
   - Deve retornar apenas os itens restantes
   - `pagination.hasNext` deve ser `false`

4. **Sem parâmetros:**
   ```
   GET /api/livro-grua/relacoes-grua-obra
   ```
   - Deve usar valores padrão (page=1, limit=10)

5. **Valores inválidos:**
   ```
   GET /api/livro-grua/relacoes-grua-obra?page=0&limit=-1
   ```
   - Deve retornar erro 400

6. **Limit muito alto:**
   ```
   GET /api/livro-grua/relacoes-grua-obra?limit=200
   ```
   - Deve retornar erro 400 (limite máximo: 100)

---

## 📊 Exemplo de Resposta Completa

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "grua_id": "G001",
      "obra_id": 76,
      "data_inicio_locacao": "2025-01-15",
      "data_fim_locacao": "2025-12-31",
      "status": "Ativa",
      "valor_locacao_mensal": 31600.00,
      "observacoes": null,
      "grua": {
        "id": "G001",
        "tipo": "Grua Torre",
        "modelo": "Modelo X",
        "fabricante": "Fabricante Y"
      },
      "obra": {
        "id": 76,
        "nome": "Obra Teste",
        "endereco": "Rua Teste, 123",
        "cidade": "Recife",
        "estado": "PE",
        "status": "Em Andamento"
      }
    }
    // ... mais 8 itens (total de 9 por página)
  ],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "filteredByUser": false
}
```

---

## 🔄 Compatibilidade

### Backward Compatibility

Para manter compatibilidade com código que já usa o endpoint:

1. **Sem parâmetros de paginação:** Retornar todos os registros (comportamento atual)
2. **Com parâmetros:** Aplicar paginação

**OU**

Sempre aplicar paginação com valores padrão:
- `page=1` se não fornecido
- `limit=10` se não fornecido

**Recomendação:** Sempre aplicar paginação com valores padrão para melhor performance.

---

## 📝 Checklist de Implementação

- [ ] Adicionar leitura de parâmetros `page` e `limit`
- [ ] Adicionar validação de parâmetros
- [ ] Adicionar `{ count: 'exact' }` no select do Supabase
- [ ] Adicionar `.range(offset, offset + limit - 1)` na query
- [ ] Calcular informações de paginação (totalPages, hasNext, hasPrev)
- [ ] Atualizar resposta para incluir objeto `pagination`
- [ ] Testar com diferentes valores de page e limit
- [ ] Testar com usuários admin e não-admin
- [ ] Validar que filtros de funcionário ainda funcionam
- [ ] Documentar mudanças no código

---

## 🚨 Observações Importantes

1. **Performance:** Paginação reduz significativamente o tempo de resposta quando há muitos registros.

2. **Filtros:** Os filtros de funcionário (para não-admins) devem ser aplicados ANTES da paginação, para que o total seja calculado corretamente.

3. **Ordenação:** Manter a ordenação atual (`obras(nome)`, `gruas(id)`) para consistência.

4. **Limite Máximo:** Recomendado limitar `limit` a 100 para evitar sobrecarga do servidor.

5. **Cache:** Considerar cache para contagens totais se a performance for um problema.

---

**Última atualização:** Janeiro 2025

