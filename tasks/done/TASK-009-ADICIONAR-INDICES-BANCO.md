# 📋 TASK-009: Adicionar Índices no Banco de Dados

**ID da Task:** TASK-009  
**Título:** Criar Índices em Foreign Keys e Campos Frequentes  
**Fase:** 2  
**Módulo:** Performance - Banco de Dados  
**Arquivo(s):** 
- `backend-api/database/migrations/YYYY-MM-DD_add_indexes.sql`
- Tabelas existentes no banco

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Criar índices no banco de dados para melhorar performance de queries, especialmente em:
- Foreign keys (para JOINs mais rápidos)
- Campos usados frequentemente em WHERE
- Campos usados em ORDER BY
- Campos usados em GROUP BY

Atualmente, algumas queries podem estar lentas devido à falta de índices adequados.

---

## 🎯 Objetivos

- [ ] Auditar queries lentas e identificar campos sem índices
- [ ] Criar índices em todas as foreign keys
- [ ] Criar índices em campos frequentemente usados em filtros
- [ ] Criar índices compostos quando apropriado
- [ ] Verificar índices existentes e remover duplicados
- [ ] Documentar índices criados

---

## 📋 Situação Atual

### Índices Existentes

- ✅ Alguns índices podem já existir
- ⚠️ Não há auditoria completa de índices
- ⚠️ Foreign keys podem não ter índices
- ⚠️ Campos de filtro podem não ter índices

### Integrações Existentes

- ✅ Banco de dados PostgreSQL (Supabase)
- ✅ Migrations organizadas
- ⚠️ Necessário auditar estrutura atual

---

## 🔧 Ações Necessárias

### Banco de Dados

- [ ] Auditar estrutura atual:
  - Listar todas as tabelas
  - Listar todas as foreign keys
  - Listar índices existentes
  - Identificar queries lentas

- [ ] Criar migration `YYYY-MM-DD_add_indexes.sql` com índices:

  **Índices em Foreign Keys:**
  ```sql
  -- Obras
  CREATE INDEX IF NOT EXISTS idx_obras_cliente_id ON obras(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_obras_responsavel_tecnico_id ON obras(responsavel_tecnico_id);
  
  -- Gruas
  CREATE INDEX IF NOT EXISTS idx_gruas_fabricante_id ON gruas(fabricante_id);
  
  -- Grua Obra (relacionamento)
  CREATE INDEX IF NOT EXISTS idx_grua_obra_obra_id ON grua_obra(obra_id);
  CREATE INDEX IF NOT EXISTS idx_grua_obra_grua_id ON grua_obra(grua_id);
  
  -- Funcionários
  CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_id ON funcionarios(empresa_id);
  CREATE INDEX IF NOT EXISTS idx_funcionarios_cargo_id ON funcionarios(cargo_id);
  
  -- Orçamentos
  CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_id ON orcamentos(obra_id);
  CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
  
  -- Medições
  CREATE INDEX IF NOT EXISTS idx_medicoes_obra_id ON medicoes(obra_id);
  CREATE INDEX IF NOT EXISTS idx_medicoes_orcamento_id ON medicoes(orcamento_id);
  
  -- Locações
  CREATE INDEX IF NOT EXISTS idx_locacoes_obra_id ON locacoes(obra_id);
  CREATE INDEX IF NOT EXISTS idx_locacoes_grua_id ON locacoes(grua_id);
  
  -- Ponto Eletrônico
  CREATE INDEX IF NOT EXISTS idx_ponto_eletronico_funcionario_id ON ponto_eletronico(funcionario_id);
  CREATE INDEX IF NOT EXISTS idx_ponto_eletronico_data ON ponto_eletronico(data);
  
  -- Financeiro
  CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_obra_id ON lancamentos_financeiros(obra_id);
  CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_grua_id ON lancamentos_financeiros(grua_id);
  CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_data ON lancamentos_financeiros(data);
  
  -- RH
  CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
  CREATE INDEX IF NOT EXISTS idx_certificados_colaborador_id ON certificados(colaborador_id);
  CREATE INDEX IF NOT EXISTS idx_documentos_colaborador_id ON documentos_admissionais(colaborador_id);
  ```

  **Índices em Campos de Filtro:**
  ```sql
  -- Status
  CREATE INDEX IF NOT EXISTS idx_obras_status ON obras(status);
  CREATE INDEX IF NOT EXISTS idx_gruas_status ON gruas(status);
  CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
  
  -- Datas
  CREATE INDEX IF NOT EXISTS idx_obras_data_inicio ON obras(data_inicio);
  CREATE INDEX IF NOT EXISTS idx_obras_data_fim ON obras(data_fim);
  CREATE INDEX IF NOT EXISTS idx_grua_obra_data_inicio ON grua_obra(data_inicio);
  CREATE INDEX IF NOT EXISTS idx_grua_obra_data_fim ON grua_obra(data_fim);
  
  -- Busca
  CREATE INDEX IF NOT EXISTS idx_obras_nome ON obras USING gin(to_tsvector('portuguese', nome));
  CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes USING gin(to_tsvector('portuguese', nome));
  ```

  **Índices Compostos:**
  ```sql
  -- Para queries com múltiplos filtros
  CREATE INDEX IF NOT EXISTS idx_obras_cliente_status ON obras(cliente_id, status);
  CREATE INDEX IF NOT EXISTS idx_grua_obra_obra_data ON grua_obra(obra_id, data_inicio);
  CREATE INDEX IF NOT EXISTS idx_ponto_funcionario_data ON ponto_eletronico(funcionario_id, data);
  ```

- [ ] Verificar índices existentes antes de criar:
  - Usar `IF NOT EXISTS` para evitar erros
  - Ou verificar se índice já existe

- [ ] Executar migration e verificar:
  - Índices criados com sucesso
  - Performance melhorada
  - Sem impacto negativo

### Documentação

- [ ] Documentar índices criados:
  - Tabela
  - Campos indexados
  - Tipo de índice
  - Razão (query otimizada)

- [ ] Criar guia de quando criar novos índices

---

## 🔌 Estrutura de Índices

### Tipos de Índices

1. **B-tree (padrão):** Para comparações, ordenação, range queries
2. **GIN (Generalized Inverted Index):** Para busca full-text
3. **Compostos:** Para queries com múltiplos filtros

### Quando Criar Índice

- Foreign keys (sempre)
- Campos usados em WHERE frequentemente
- Campos usados em ORDER BY
- Campos usados em JOIN
- Campos usados em GROUP BY
- Campos usados em busca full-text

### Quando NÃO Criar Índice

- Tabelas muito pequenas (< 1000 linhas)
- Campos atualizados muito frequentemente
- Campos com baixa seletividade (ex: boolean com 50/50)

---

## ✅ Critérios de Aceitação

- [ ] Migration criada com todos os índices necessários
- [ ] Índices em todas as foreign keys
- [ ] Índices em campos de filtro frequentes
- [ ] Índices compostos onde apropriado
- [ ] Migration executada com sucesso
- [ ] Performance de queries melhorada
- [ ] Documentação atualizada
- [ ] Sem impacto negativo em INSERT/UPDATE

---

## 🧪 Casos de Teste

### Teste 1: Query com JOIN
**Dado:** Query com JOIN em foreign key indexada  
**Quando:** Executar query  
**Então:** Deve ser mais rápida que antes

### Teste 2: Query com Filtro
**Dado:** Query filtrando por campo indexado  
**Quando:** Executar query  
**Então:** Deve usar índice e ser rápida

### Teste 3: Query com Ordenação
**Dado:** Query ordenando por campo indexado  
**Quando:** Executar query  
**Então:** Deve usar índice para ordenação

### Teste 4: INSERT Performance
**Dado:** Tabela com muitos índices  
**Quando:** Inserir novo registro  
**Então:** Performance não deve degradar significativamente

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-003 - Criar endpoint performance gruas (índices melhoram queries)
- TASK-010 - Implementar paginação (índices melhoram performance)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "5.1 Queries de Banco"
- Documentação PostgreSQL sobre índices
- Estrutura atual do banco de dados

---

## 💡 Notas Técnicas

1. **Índices em Foreign Keys:** PostgreSQL não cria índices automaticamente em foreign keys. Sempre criar manualmente.

2. **Índices Compostos:** Criar quando queries frequentemente filtram por múltiplos campos juntos.

3. **Full-Text Search:** Usar GIN index para busca em texto. Requer configuração de `to_tsvector`.

4. **Manutenção:** Índices precisam de manutenção. PostgreSQL faz automaticamente, mas monitorar.

5. **Impacto em INSERT/UPDATE:** Muitos índices podem tornar INSERT/UPDATE mais lentos. Balancear.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Muitos índices podem tornar INSERT/UPDATE mais lentos
  - **Mitigação:** Criar apenas índices necessários, monitorar performance

- **Risco 2:** Índices podem ocupar muito espaço
  - **Mitigação:** Monitorar tamanho, remover índices não utilizados

- **Risco 3:** Índices podem não ser usados se query não for otimizada
  - **Mitigação:** Verificar planos de execução, otimizar queries

---

## 📊 Estimativas

**Tempo Estimado:** 2-3 dias  
**Complexidade:** Média  
**Esforço:** Médio

**Breakdown:**
- Auditoria: 4 horas
- Criar migration: 4-6 horas
- Testes e ajustes: 4-6 horas
- Documentação: 2 horas

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

