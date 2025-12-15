# 🖥️ Validação Visual - Telas e Funções

Este documento mostra visualmente onde encontrar e como validar cada funcionalidade implementada.

---

## 1. 📋 Aluguéis de Casas - Novos Campos

### 🖼️ Tela: Formulário de Novo Aluguel

```
┌─────────────────────────────────────────────────────────────┐
│  Criar Novo Aluguel                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Residência ───────────────────────────────────────┐   │
│  │ Selecione a Residência *                            │   │
│  │ [Dropdown com residências disponíveis]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Funcionário ──────────────────────────────────────┐   │
│  │ Selecione o Funcionário *                            │   │
│  │ [Busca de funcionário]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Contrato ─────────────────────────────────────────┐   │
│  │ Data de Início *        Valor Mensal (R$) *         │   │
│  │ [2025-02-28]            [1000.00]                   │   │
│  │                                                       │   │
│  │ Dia Vencimento         Subsídio (%)                 │   │
│  │ [5]                    [20]                          │   │
│  │                                                       │   │
│  │ ☑ Descontar da folha                                │   │
│  │                                                       │   │
│  │ ┌─ NOVOS CAMPOS ───────────────────────────────┐   │   │
│  │ │ Tipo de Sinal        Valor do Depósito (R$)  │   │   │
│  │ │ [Caução ▼]           [1000.00]                │   │   │
│  │ │                                               │   │   │
│  │ │ Período da Multa (dias)  Contrato            │   │   │
│  │ │ [30]                    [Escolher arquivo]   │   │   │
│  │ │                         📄 contrato.pdf      │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Observações                                                │
│  [Textarea...]                                              │
│                                                             │
│  [Cancelar]  [Criar Aluguel]                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Função: Validação no Frontend

**Arquivo:** `app/dashboard/financeiro/alugueis/page.tsx`

```typescript
// Linha ~163: Função handleCriarAluguel
const handleCriarAluguel = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validação dos campos obrigatórios
  if (!residenciaId || !funcionarioId || !dataInicio || !valorMensal) {
    toast({
      title: 'Campos obrigatórios',
      description: 'Por favor, preencha todos os campos obrigatórios.',
      variant: 'destructive',
    })
    return
  }

  try {
    // ... código existente ...
    
    await AlugueisAPI.criar({
      // ... outros campos ...
      contrato: {
        dataInicio,
        valorMensal: parseFloat(valorMensal),
        diaVencimento: parseInt(diaVencimento),
        descontoFolha,
        porcentagemDesconto: porcentagemDesconto ? parseFloat(porcentagemDesconto) : undefined,
        // NOVOS CAMPOS
        tipoSinal: tipoSinal || undefined,
        valorDeposito: valorDeposito ? parseFloat(valorDeposito) : undefined,
        periodoMulta: periodoMulta ? parseInt(periodoMulta) : undefined,
        contratoArquivo: contratoArquivoUrl || undefined,
      },
      // ...
    })
  }
}
```

### 🔧 Função: Validação no Backend

**Arquivo:** `backend-api/src/routes/alugueis-residencias.js`

```javascript
// Linha ~34: Schema de validação
const aluguelSchema = Joi.object({
  // ... campos existentes ...
  tipo_sinal: Joi.string().valid('caucao', 'fiador', 'outros').allow(null, '').optional(),
  valor_deposito: Joi.number().min(0).allow(null).optional(),
  periodo_multa: Joi.number().integer().min(0).allow(null).optional(),
  contrato_arquivo: Joi.string().allow(null, '').optional(),
  // ...
})
```

### ✅ Como Testar

1. **Acesse:** `http://localhost:3000/dashboard/financeiro/alugueis`
2. **Clique:** Botão "Novo Aluguel"
3. **Preencha:** Todos os campos, incluindo os novos
4. **Verifique:** No console do navegador (F12) > Network > veja a requisição POST
5. **Confirme:** No banco de dados se os valores foram salvos

---

## 2. 📦 Estoque - Reorganização de Categorias

### 🖼️ Tela: Formulário de Novo Item

```
┌─────────────────────────────────────────────────────────────┐
│  Cadastrar Novo Item                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nome do Item *          Categoria *                        │
│  [Cabo de Aço 12mm]     [Ferramentas ▼]                    │
│                                                             │
│  Descrição                                                 │
│  [Textarea...]                                              │
│                                                             │
│  ┌─ NOVA SEÇÃO: Classificação ────────────────────────┐   │
│  │ Classificação *                                       │   │
│  │ [Componente (Partes do ativo) ▼]                    │   │
│  │                                                       │   │
│  │ Opções:                                               │   │
│  │ • Componente (Partes do ativo)                       │   │
│  │ • Item (Consumíveis)                                  │   │
│  │ • Ativo (Imobilizados)                               │   │
│  │ • Complemento (Peças que compõem ativos)            │   │
│  │                                                       │   │
│  │ Descrição: Componentes: Partes do ativo | Itens:     │   │
│  │ Consumíveis | Ativos: Imobilizados | Complementos:    │   │
│  │ Peças dos ativos                                      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Aparece APENAS quando "Ativo" é selecionado ──────┐   │
│  │ Subcategoria do Ativo *                              │   │
│  │ [Grua ▼]                                            │   │
│  │                                                      │   │
│  │ Opções:                                              │   │
│  │ • Grua                                               │   │
│  │ • Equipamento (Complemento de Grua)                  │   │
│  │ • Ferramenta                                         │   │
│  │ • Ar Condicionado                                    │   │
│  │ • Câmera                                             │   │
│  │ • Auto                                               │   │
│  │ • PC                                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Outros campos...]                                         │
│                                                             │
│  [Cancelar]  [Cadastrar]                                    │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Função: Validação Condicional

**Arquivo:** `app/dashboard/estoque/page.tsx`

```typescript
// Linha ~1254: Renderização condicional da subcategoria
{formData.classificacao_tipo === "ativo" && (
  <div className="space-y-2">
    <Label htmlFor="subcategoria_ativo">Subcategoria do Ativo *</Label>
    <Select
      value={formData.subcategoria_ativo}
      onValueChange={(value) => setFormData({ ...formData, subcategoria_ativo: value as any })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione a subcategoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grua">Grua</SelectItem>
        <SelectItem value="equipamento_grua">Equipamento (Complemento de Grua)</SelectItem>
        <SelectItem value="ferramenta">Ferramenta</SelectItem>
        <SelectItem value="ar_condicionado">Ar Condicionado</SelectItem>
        <SelectItem value="camera">Câmera</SelectItem>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value="pc">PC</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}
```

### 🔧 Função: Envio para API

```typescript
// Linha ~819: Criar produto com classificação
const produtoResponse = await estoqueAPI.criarProduto({
  nome: formData.nome,
  // ... outros campos ...
  classificacao_tipo: formData.classificacao_tipo || undefined,
  subcategoria_ativo: formData.classificacao_tipo === "ativo" 
    ? formData.subcategoria_ativo || undefined 
    : undefined,
} as any)
```

### ✅ Como Testar

1. **Acesse:** `http://localhost:3000/dashboard/estoque`
2. **Clique:** Botão "Novo Item"
3. **Teste 1:** Selecione "Componente" → Subcategoria NÃO deve aparecer
4. **Teste 2:** Selecione "Item" → Subcategoria NÃO deve aparecer
5. **Teste 3:** Selecione "Ativo" → Subcategoria DEVE aparecer
6. **Teste 4:** Tente salvar Ativo sem subcategoria → Deve validar/erro
7. **Teste 5:** Selecione "Complemento" → Subcategoria NÃO deve aparecer

---

## 3. 🔧 Checklist de Manutenção - OK/MANUTENÇÃO

### 🖼️ Tela: Checklist de Manutenção

```
┌─────────────────────────────────────────────────────────────┐
│  Checklist de Manutenção                                    │
│  Marque os itens que foram verificados durante a manutenção│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Eletricidade ──────────────────────────────────────┐   │
│  │                                                       │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Tensão máxima de alimentação    [OK] [MANUT.] │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Conexões terras restantes      [OK] [MANUT.]  │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Isolamento dos cabos            [OK] [MANUT.]  │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ ... (mais itens)                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Maquinaria ────────────────────────────────────────┐   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Nível/saia da torre            [OK] [MANUT.] │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │ ... (mais itens)                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Salvar Manutenção]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Função: Toggle de Status

**Arquivo:** `components/livro-grua-manutencao.tsx`

```typescript
// Linha ~174: Função toggleChecklistItem
const toggleChecklistItem = (key: string, status: 'ok' | 'manutencao' | null) => {
  const newChecklist = {
    ...checklist,
    [key]: checklist[key] === status ? null : status
  }
  setChecklist(newChecklist)
  setFormData({
    ...formData,
    checklist: newChecklist
  })
}
```

### 🔧 Função: Renderização dos Botões

```typescript
// Linha ~348: Renderização com botões
{itens.map((item) => {
  const statusAtual = checklist[item.key] || null
  return (
    <div key={item.key} className="flex items-center justify-between p-3 rounded-md border">
      <Label className="text-sm font-medium flex-1">
        {item.label}
      </Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={statusAtual === 'ok' ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleChecklistItem(item.key, 'ok')}
          className={statusAtual === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          OK
        </Button>
        <Button
          type="button"
          variant={statusAtual === 'manutencao' ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleChecklistItem(item.key, 'manutencao')}
          className={statusAtual === 'manutencao' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
        >
          MANUTENÇÃO
        </Button>
      </div>
    </div>
  )
})}
```

### ✅ Como Testar

1. **Acesse:** `http://localhost:3000/dashboard/gruas/[id]/livro`
2. **Clique:** "Nova Manutenção"
3. **Preencha:** Data e Funcionário
4. **Teste 1:** Clique em "OK" de um item → Botão fica verde
5. **Teste 2:** Clique em "MANUTENÇÃO" de outro item → Botão fica amarelo
6. **Teste 3:** Clique novamente no mesmo botão → Desmarca
7. **Teste 4:** Salve e verifique no banco se o JSON foi salvo corretamente

### 🔍 Verificação no Banco

```sql
-- Verificar checklist salvo
SELECT 
  id,
  grua_id,
  checklist,
  tipo_entrada
FROM livro_grua_entradas
WHERE tipo_entrada = 'manutencao'
ORDER BY created_at DESC
LIMIT 1;

-- Exemplo de resultado esperado:
-- checklist: {"tensao_maxima_alimentacao": "ok", "isolamento_cabos": "manutencao", ...}
```

---

## 4. 📝 Formulários Personalizados - Estrutura

### 🖼️ Estrutura de Banco (Diagrama)

```
┌─────────────────────────────────────────────────────────────┐
│  formularios_personalizados_gruas                          │
├─────────────────────────────────────────────────────────────┤
│  id (UUID) PK                                              │
│  nome (VARCHAR)                                            │
│  tipo (VARCHAR) CHECK ('checklist' | 'manutencao')         │
│  grua_id (VARCHAR) FK → gruas(id)                          │
│  obra_id (INTEGER) FK → obras(id)                          │
│  ativo (BOOLEAN)                                           │
│  descricao (TEXT)                                          │
│  created_at, updated_at                                    │
│  created_by, updated_by                                    │
│  UNIQUE(grua_id, tipo) ← Limita 1 por grua e tipo         │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  formularios_personalizados_itens                          │
├─────────────────────────────────────────────────────────────┤
│  id (UUID) PK                                              │
│  formulario_id (UUID) FK                                   │
│  ordem (INTEGER)                                           │
│  categoria (VARCHAR)                                        │
│  descricao (TEXT)                                          │
│  tipo_item (VARCHAR) CHECK ('checkbox'|'texto'|'numero'|'data')│
│  obrigatorio (BOOLEAN)                                     │
│  permite_anexo (BOOLEAN)                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  formularios_personalizados_respostas                      │
├─────────────────────────────────────────────────────────────┤
│  id (UUID) PK                                              │
│  formulario_id (UUID) FK                                   │
│  item_id (UUID) FK                                         │
│  resposta (TEXT)                                            │
│  status (VARCHAR) CHECK ('ok'|'manutencao'|'pendente')     │
│  anexos (TEXT[])                                           │
│  funcionario_id (INTEGER) FK                               │
│  data_preenchimento (TIMESTAMP)                            │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Função: Validação de Constraint UNIQUE

**Arquivo:** `backend-api/database/migrations/20250228_create_formularios_personalizados_gruas.sql`

```sql
-- Constraint que garante apenas 1 formulário por grua e tipo
CONSTRAINT unique_formulario_grua_tipo UNIQUE (grua_id, tipo)
```

### ✅ Como Testar (SQL)

```sql
-- 1. Criar primeiro formulário (deve funcionar)
INSERT INTO formularios_personalizados_gruas (
  nome, tipo, grua_id, ativo
) VALUES (
  'Checklist Personalizado 1', 'checklist', 'GRUA001', true
);

-- 2. Tentar criar segundo formulário do mesmo tipo (deve FALHAR)
INSERT INTO formularios_personalizados_gruas (
  nome, tipo, grua_id, ativo
) VALUES (
  'Checklist Personalizado 2', 'checklist', 'GRUA001', true
);
-- Erro esperado: duplicate key value violates unique constraint

-- 3. Criar formulário de tipo diferente (deve funcionar)
INSERT INTO formularios_personalizados_gruas (
  nome, tipo, grua_id, ativo
) VALUES (
  'Manutenção Personalizada', 'manutencao', 'GRUA001', true
);
-- Deve funcionar (tipo diferente)
```

---

## 📊 Resumo Visual das Validações

### ✅ Checklist Rápido

```
┌─────────────────────────────────────────────────────────┐
│  VALIDAÇÃO RÁPIDA                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [✓] Aluguéis: Novos campos aparecem no formulário     │
│  [✓] Aluguéis: Valores salvam no banco                 │
│  [✓] Estoque: Classificação aparece                    │
│  [✓] Estoque: Subcategoria aparece quando "Ativo"      │
│  [✓] Manutenção: Botões OK/MANUTENÇÃO aparecem         │
│  [✓] Manutenção: Botões mudam de cor ao clicar         │
│  [✓] Formulários: Tabelas criadas no banco             │
│  [✓] Formulários: Constraint UNIQUE funciona           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Pontos de Atenção

### ⚠️ Aluguéis
- Upload de arquivo atualmente apenas salva o nome
- Para produção, implementar upload real para storage

### ⚠️ Estoque
- Validação de subcategoria obrigatória para Ativos pode precisar ser adicionada no frontend

### ⚠️ Manutenção
- Verificar se o formato do checklist no banco está correto (JSON)

### ⚠️ Formulários
- Estrutura de banco pronta, mas rotas e interface ainda não implementadas

---

**Última Atualização:** 2025-02-28

