# ⚡ Guia Rápido - Tarefas de Integração

Um guia de referência rápida para começar a trabalhar nas tarefas de integração.

---

## 🚀 Início Rápido

### 1️⃣ Escolha uma Fase
```
📂 tasks/
├── FASE-1-FINANCEIRO.md      ← Comece aqui (ALTA prioridade)
├── FASE-2-RH.md
├── FASE-3-OPERACIONAL.md
└── FASE-4-PWA.md
```

### 2️⃣ Escolha uma Task
Dentro de cada fase, escolha uma task baseada em:
- **Prioridade:** 🔴 ALTA > 🟡 MÉDIA > 🟢 BAIXA
- **Dependências:** Tarefas sem bloqueios
- **Sua experiência:** Frontend, Backend, ou Fullstack

### 3️⃣ Execute o Workflow
```
0. Acessa mcp supabase (ja temos)
1. Implementar
2. Atualizar progresso
```

---

## 🔄 Workflow Detalhado

### Passo 1: Implementar

#### A) Criar API Frontend (se necessário)
```bash
# Criar arquivo em /lib/
touch lib/api-nome-modulo.ts
```

**Template básico:**
```typescript
import api from './api';

export interface TipoData {
  id: number;
  campo: string;
}

export const getNomeModulo = async (): Promise<TipoData[]> => {
  const response = await api.get('/api/nome-modulo');
  return response.data;
};

export const getNomeModuloById = async (id: number): Promise<TipoData> => {
  const response = await api.get(`/api/nome-modulo/${id}`);
  return response.data;
};

export const createNomeModulo = async (data: Omit<TipoData, 'id'>): Promise<TipoData> => {
  const response = await api.post('/api/nome-modulo', data);
  return response.data;
};

export const updateNomeModulo = async (id: number, data: Partial<TipoData>): Promise<TipoData> => {
  const response = await api.put(`/api/nome-modulo/${id}`, data);
  return response.data;
};

export const deleteNomeModulo = async (id: number): Promise<void> => {
  await api.delete(`/api/nome-modulo/${id}`);
};
```

#### B) Implementar Endpoints Backend
```bash
# Criar rota em backend-api/src/routes/
touch backend-api/src/routes/nome-modulo.js
```

**Template básico:**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET todos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tabela');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tabela WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST criar
router.post('/', async (req, res) => {
  try {
    const { campo1, campo2 } = req.body;
    const result = await pool.query(
      'INSERT INTO tabela (campo1, campo2) VALUES ($1, $2) RETURNING *',
      [campo1, campo2]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT atualizar
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { campo1, campo2 } = req.body;
    const result = await pool.query(
      'UPDATE tabela SET campo1 = $1, campo2 = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [campo1, campo2, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tabela WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Não encontrado' });
    }
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
```

#### C) Atualizar Componente Frontend
```typescript
// Remover imports de mock-data
// import { mockData } from '@/lib/mock-data'; // ❌ REMOVER

// Adicionar import da nova API
import { getNomeModulo, createNomeModulo } from '@/lib/api-nome-modulo'; // ✅

// Usar React Query ou useEffect
const { data, isLoading, error } = useQuery(['nome-modulo'], getNomeModulo);
```


### Passo 2: Atualizar Progresso
```bash
# Editar tasks/PROGRESSO.md
# Marcar task como concluída ✅
# Atualizar percentuais
# Commit
git add tasks/PROGRESSO.md
git commit -m "docs: atualiza progresso - módulo Y concluído"
git push origin develop
```

---

## 🐛 Troubleshooting

### Problema: API retorna 404
**Solução:**
1. Verificar se a rota foi registrada no `server.js`
2. Verificar se o endpoint está correto
3. Verificar logs do servidor

### Problema: CORS Error
**Solução:**
1. Verificar configuração de CORS no backend
2. Verificar se a URL da API está correta no frontend
3. Verificar variáveis de ambiente

### Problema: Dados não aparecem no frontend
**Solução:**
1. Verificar console do navegador
2. Verificar Network tab para ver requisições
3. Verificar se os dados estão sendo retornados pela API
4. Verificar se o estado está sendo atualizado corretamente

### Problema: Testes falhando
**Solução:**
1. Verificar logs dos testes
2. Verificar se o banco de dados de teste está configurado
3. Verificar se as dependências estão instaladas
4. Rodar `npm install` novamente

---


## 🎯 Checklist de Cada Task

### Antes de Começar
- [ ] Ler task completa na documentação da fase


### Durante Desenvolvimento
- [ ] Remover dados mock
- [ ] Implementar API backend
- [ ] Implementar API frontend
- [ ] Atualizar componentes
- [ ] Adicionar tratamento de erros
- [ ] Adicionar loading states
- [ ] Adicionar validações


---

## 💡 Dicas Importantes

1. **Commits Pequenos:** Faça commits frequentes e pequenos
2. **Teste Sempre:** Teste cada mudança antes de commitar
3. **Code Review:** Sempre peça review de outro desenvolvedor
4. **Documentação:** Documente decisões importantes
5. **Perguntas:** Não hesite em perguntar se tiver dúvidas
6. **Backup:** Sempre trabalhe em branches, nunca direto na main/develop
7. **Performance:** Considere performance desde o início
8. **Segurança:** Valide todas as entradas de dados

---

## 🎓 Próximos Passos

1. **Ler documentação completa da Fase 1:** `FASE-1-FINANCEIRO.md`
2. **Escolher primeira task:** Comece com prioridade ALTA
3. **Configurar ambiente:** Instalar dependências, configurar DB
4. **Começar desenvolvimento:** Seguir workflow acima
5. **Pedir ajuda quando necessário:** Não fique travado!

---

**Boa sorte! 🚀**

Se tiver qualquer dúvida, consulte a documentação completa ou pergunte à equipe.

