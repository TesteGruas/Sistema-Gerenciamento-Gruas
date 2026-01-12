# 🧪 Guia de Teste Rápido - Gerenciamento de Obras

## ⚡ Teste Rápido (5 minutos)

### 1️⃣ Teste de Orçamento Obrigatório
```
1. Acesse: /dashboard/obras/nova
2. Tente criar obra SEM selecionar cliente
   → Deve mostrar erro: "É obrigatório vincular um orçamento aprovado"
3. Selecione cliente COM orçamento aprovado
   → Deve buscar automaticamente e pré-preencher dados
```

### 2️⃣ Teste de Responsáveis IRBANA
```
1. Aba: "Responsável Técnico"
2. Verifique 3 seções coloridas:
   🔵 Responsável pelos Equipamentos (azul)
   🟢 Responsável pelas Manutenções (verde)
   🟣 Responsável pela Montagem/Operação (roxo)
3. Verifique dados pré-preenchidos
4. Crie obra e verifique no banco se foram salvos 3 registros
```

### 3️⃣ Teste de Sinaleiros Integrados
```
1. Aba: "Funcionários" (não mais "Sinaleiros" separado)
2. Verifique duas seções:
   - Sinaleiros da Obra (topo)
   - Funcionários da Obra (abaixo)
3. Adicione sinaleiro externo
4. Tente salvar sem documentos → deve bloquear
```

### 4️⃣ Teste de Documentos Adicionais
```
1. Aba: "Documentos"
2. Role até "Documentos Adicionais do Equipamento"
3. Faça upload de:
   - Manual Técnico
   - Termo de Entrega
   - Plano de Carga
   - Aterramento
4. Crie obra e verifique uploads
```

### 5️⃣ Teste de Dados Técnicos no Orçamento
```
1. Acesse: /dashboard/orcamentos/novo
2. Selecione grua
3. Aba: "Técnico"
4. Preencha TODOS os campos técnicos detalhados
5. Salve e aprove orçamento
6. Crie obra → dados devem estar pré-preenchidos
```

---

## 🔍 Verificações Visuais

### ✅ Checklist Visual na Criação de Obra

**Aba "Dados da Obra":**
- [ ] Seção "Dados de Montagem do Equipamento" visível
- [ ] Todos os campos técnicos presentes

**Aba "Documentos":**
- [ ] ART e Apólice (já existiam)
- [ ] **NOVO:** Manual Técnico
- [ ] **NOVO:** Termo de Entrega
- [ ] **NOVO:** Plano de Carga
- [ ] **NOVO:** Aterramento

**Aba "Responsável Técnico":**
- [ ] Responsável da Obra (Cliente) - card verde
- [ ] **NOVO:** Card "Responsáveis Técnicos IRBANA"
- [ ] 3 seções dentro do card IRBANA

**Aba "Grua":**
- [ ] Mensagem: "Os dados técnicos devem ser definidos no orçamento"
- [ ] Campos técnicos ainda editáveis (para ajustes)

**Aba "Funcionários":**
- [ ] **NOVO:** Seção "Sinaleiros" no topo
- [ ] Seção "Funcionários" abaixo
- [ ] Não há mais aba "Sinaleiros" separada

**Aba "Valores":**
- [ ] Nome da aba é "Valores" (não "Custos Mensais")
- [ ] Títulos e descrições atualizados

---

## 🎯 Teste Completo End-to-End

### Cenário: Criar Obra Completa

**Passo 1: Preparar Orçamento**
```
1. /dashboard/orcamentos/novo
2. Cliente: [Selecione ou crie]
3. Dados básicos da obra
4. Selecionar grua
5. Aba "Técnico" → Preencher TODOS os campos técnicos
6. Aba "Custos" → Preencher valores mensais
7. Salvar e APROVAR orçamento
```

**Passo 2: Criar Obra**
```
1. /dashboard/obras/nova
2. Selecionar cliente → Deve buscar orçamento automaticamente
3. Verificar pré-preenchimento:
   ✅ Nome da obra
   ✅ Endereço, cidade, estado
   ✅ Valores
   ✅ Custos mensais
   ✅ Datas

4. Aba "Dados da Obra":
   ✅ Preencher "Dados de Montagem do Equipamento"

5. Aba "Documentos":
   ✅ Upload ART
   ✅ Upload Apólice
   ✅ Upload Manual Técnico
   ✅ Upload Termo de Entrega
   ✅ Upload Plano de Carga
   ✅ Upload Aterramento

6. Aba "Responsável Técnico":
   ✅ Preencher responsável da obra
   ✅ Verificar 3 responsáveis IRBANA pré-preenchidos

7. Aba "Grua":
   ✅ Selecionar grua
   ✅ Verificar dados técnicos pré-preenchidos do orçamento

8. Aba "Funcionários":
   ✅ Adicionar sinaleiro interno
   ✅ Adicionar sinaleiro externo (com documentos completos)
   ✅ Adicionar funcionários

9. Aba "Valores":
   ✅ Verificar custos mensais pré-preenchidos

10. Criar obra → Verificar sucesso
```

**Passo 3: Validações**
```
✅ Obra criada com sucesso
✅ orcamento_id vinculado
✅ Todos os documentos enviados
✅ 4 responsáveis técnicos salvos (1 obra + 3 IRBANA)
✅ Sinaleiros salvos
✅ Dados técnicos da grua salvos
```

---

## 🐛 Testes de Validação

### Teste 1: Bloqueio sem Orçamento
```
❌ Tentar criar obra sem cliente com orçamento
✅ Deve mostrar erro: "É obrigatório vincular um orçamento aprovado"
```

### Teste 2: Bloqueio de Sinaleiro sem Documentos
```
❌ Tentar salvar sinaleiro externo sem documentos completos
✅ Deve mostrar erro listando documentos faltando
```

### Teste 3: Validação de Campos Obrigatórios
```
❌ Tentar criar obra sem ART ou Apólice
✅ Deve mostrar erro de campos obrigatórios
```

---

## 📊 Verificações no Banco de Dados

### SQL para Verificar Implementação

```sql
-- 1. Verificar obras com orçamento vinculado
SELECT id, nome, orcamento_id 
FROM obras 
WHERE orcamento_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar responsáveis técnicos IRBANA
SELECT 
  rt.id,
  rt.obra_id,
  o.nome as obra_nome,
  rt.nome,
  rt.tipo,
  rt.crea,
  rt.crea_empresa
FROM responsaveis_tecnicos rt
JOIN obras o ON o.id = rt.obra_id
WHERE rt.tipo LIKE 'irbana%'
ORDER BY rt.obra_id, rt.tipo;

-- 3. Verificar documentos de sinaleiros
SELECT 
  s.id,
  s.nome,
  s.tipo,
  COUNT(d.id) as total_documentos,
  COUNT(CASE WHEN d.status = 'aprovado' THEN 1 END) as documentos_aprovados
FROM sinaleiros_obra s
LEFT JOIN documentos_sinaleiro d ON d.sinaleiro_id = s.id
WHERE s.tipo = 'reserva'
GROUP BY s.id, s.nome, s.tipo
HAVING COUNT(d.id) < 3 OR COUNT(CASE WHEN d.status = 'aprovado' THEN 1 END) < 3;

-- 4. Verificar dados técnicos salvos nas gruas da obra
SELECT 
  og.obra_id,
  o.nome as obra_nome,
  g.name as grua_nome,
  og.tipo_base,
  og.altura_final,
  og.velocidade_giro,
  og.velocidade_elevacao,
  og.potencia_instalada,
  og.voltagem
FROM obra_gruas og
JOIN obras o ON o.id = og.obra_id
JOIN gruas g ON g.id = og.grua_id::text
WHERE og.tipo_base IS NOT NULL
ORDER BY og.obra_id;
```

---

## 🎨 Mudanças Visuais Principais

### Antes vs Depois

**ANTES:**
- Aba separada "Sinaleiros"
- Aba "Custos Mensais"
- Dados técnicos apenas na criação de obra
- Apenas 1 responsável técnico

**DEPOIS:**
- ✅ Sinaleiros integrados em "Funcionários"
- ✅ Aba "Valores"
- ✅ Dados técnicos no orçamento (principal) + obra (ajustes)
- ✅ 4 responsáveis técnicos (1 obra + 3 IRBANA)

---

## 📱 URLs para Teste

```
Criar Obra:        /dashboard/obras/nova
Editar Obra:       /dashboard/obras/[id]
Listar Obras:      /dashboard/obras
Criar Orçamento:   /dashboard/orcamentos/novo
Editar Orçamento:  /dashboard/orcamentos/[id]
```

---

## ✅ Checklist Final

Antes de considerar completo, verifique:

- [ ] Todas as migrations aplicadas
- [ ] Backend atualizado e rodando
- [ ] Frontend atualizado e rodando
- [ ] Teste de criação completa de obra funcionando
- [ ] Validações de bloqueio funcionando
- [ ] Uploads de documentos funcionando
- [ ] Dados técnicos sendo salvos corretamente
- [ ] Responsáveis IRBANA sendo salvos
- [ ] Sinaleiros com validação funcionando

---

**Tempo estimado para teste completo: 15-20 minutos**

