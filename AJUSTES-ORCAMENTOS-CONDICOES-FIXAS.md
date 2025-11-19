# Ajustes: Campos de Orçamento e Condições Fixas

## 📋 Resumo das Alterações Necessárias

### 1. ✅ Templates Criados
**Arquivo:** `lib/templates-orcamento.ts`
- Templates pré-definidos para todas as condições fixas
- Funções auxiliares para gerenciar templates

### 2. ✅ Componente de Diálogo Criado
**Arquivo:** `components/orcamento-condicoes-dialog.tsx`
- Diálogo com abas para editar todas as condições
- Botão "Restaurar Padrão" quando texto foi editado
- Pré-preenchimento automático com templates

### 3. ⚠️ Alterações Necessárias na Página de Orçamentos

#### Arquivo: `app/dashboard/orcamentos/novo/page.tsx`

**3.1. Adicionar campos no formData (linha ~92):**
```typescript
const [formData, setFormData] = useState({
  // ... campos existentes ...
  
  // Adicionar estes campos:
  condicoes_gerais: '',
  logistica: '',
  garantias: ''
})
```

**3.2. Importar templates e componente:**
```typescript
import { TEMPLATES_ORCAMENTO } from "@/lib/templates-orcamento"
import { OrcamentoCondicoesDialog } from "@/components/orcamento-condicoes-dialog"
```

**3.3. Adicionar estado para o diálogo:**
```typescript
const [isCondicoesDialogOpen, setIsCondicoesDialogOpen] = useState(false)
```

**3.4. Pré-preencher com templates ao criar novo orçamento:**
```typescript
// No useEffect ou ao inicializar
useEffect(() => {
  if (!formData.escopo_incluso) {
    setFormData(prev => ({
      ...prev,
      escopo_incluso: TEMPLATES_ORCAMENTO.escopo_incluso,
      responsabilidades_cliente: TEMPLATES_ORCAMENTO.responsabilidades_cliente,
      condicoes_comerciais: TEMPLATES_ORCAMENTO.condicoes_comerciais,
      condicoes_gerais: TEMPLATES_ORCAMENTO.condicoes_gerais,
      logistica: TEMPLATES_ORCAMENTO.logistica,
      garantias: TEMPLATES_ORCAMENTO.garantias
    }))
  }
}, [])
```

**3.5. Adicionar botão para abrir diálogo de condições:**
Na aba "Condições", adicionar um botão:
```typescript
<Button 
  type="button"
  variant="outline"
  onClick={() => setIsCondicoesDialogOpen(true)}
>
  <FileText className="w-4 h-4 mr-2" />
  Editar Todas as Condições
</Button>
```

**3.6. Adicionar campos de texto para condicoes_gerais, logistica e garantias:**
Na aba "Condições", após "Condições Comerciais", adicionar:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Condições Gerais</CardTitle>
    <CardDescription>
      Termos e condições gerais do contrato
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Textarea
      value={formData.condicoes_gerais}
      onChange={(e) => setFormData({ ...formData, condicoes_gerais: e.target.value })}
      rows={8}
      placeholder="Condições gerais do contrato..."
    />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Logística</CardTitle>
    <CardDescription>
      Detalhes sobre transporte, montagem e desmontagem
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Textarea
      value={formData.logistica}
      onChange={(e) => setFormData({ ...formData, logistica: e.target.value })}
      rows={6}
      placeholder="Detalhes logísticos..."
    />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Garantias</CardTitle>
    <CardDescription>
      Garantias oferecidas pela locadora
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Textarea
      value={formData.garantias}
      onChange={(e) => setFormData({ ...formData, garantias: e.target.value })}
      rows={6}
      placeholder="Garantias do contrato..."
    />
  </CardContent>
</Card>
```

**3.7. Adicionar o componente de diálogo:**
No final do componente, antes do fechamento:
```typescript
<OrcamentoCondicoesDialog
  open={isCondicoesDialogOpen}
  onOpenChange={setIsCondicoesDialogOpen}
  condicoes={{
    escopo_incluso: formData.escopo_incluso,
    responsabilidades_cliente: formData.responsabilidades_cliente,
    condicoes_comerciais: formData.condicoes_comerciais,
    condicoes_gerais: formData.condicoes_gerais,
    logistica: formData.logistica,
    garantias: formData.garantias
  }}
  onSave={(condicoes) => {
    setFormData({
      ...formData,
      ...condicoes
    })
  }}
/>
```

**3.8. Garantir que os campos sejam enviados no handleSave:**
No `handleSave`, verificar se os campos estão sendo enviados:
```typescript
const orcamentoData = {
  // ... outros campos ...
  escopo_incluso: formData.escopo_incluso,
  responsabilidades_cliente: formData.responsabilidades_cliente,
  condicoes_comerciais: formData.condicoes_comerciais,
  condicoes_gerais: formData.condicoes_gerais,
  logistica: formData.logistica,
  garantias: formData.garantias
}
```

### 4. ⚠️ Verificar Página de Edição de Orçamento

**Arquivo:** `app/dashboard/orcamentos/[id]/page.tsx` (se existir)

- Garantir que ao carregar um orçamento existente, os campos sejam preenchidos
- Se os campos estiverem vazios, pré-preencher com templates
- Adicionar o mesmo diálogo de condições

### 5. ✅ Comunicação Medições ↔ Orçamento

**Já implementado:**
- ✅ Trigger automático atualiza `total_faturado_acumulado` quando medição é finalizada
- ✅ Campo `ultima_medicao_periodo` é atualizado
- ✅ API de medições já está integrada

**Verificar:**
- Se a página de orçamentos mostra o total faturado acumulado
- Se há uma seção/aba de "Medições" no orçamento
- Se é possível gerar medições a partir do orçamento

---

## 🧪 Como Testar

1. **Criar Novo Orçamento:**
   - Acesse "Novo Orçamento"
   - Verifique se os campos de condições estão pré-preenchidos
   - Clique em "Editar Todas as Condições"
   - Edite algum texto e salve
   - Verifique se foi salvo

2. **Editar Orçamento Existente:**
   - Abra um orçamento existente
   - Verifique se os campos aparecem
   - Se estiverem vazios, devem ser pré-preenchidos

3. **Gerar PDF:**
   - Gere o PDF do orçamento
   - Verifique se todas as condições aparecem no PDF

4. **Medições:**
   - Crie uma medição para um orçamento
   - Finalize a medição
   - Verifique se o orçamento foi atualizado com o total faturado

---

## 📝 Notas

- Os templates são editáveis, mas há opção de restaurar ao padrão
- Todos os campos são opcionais (podem ficar vazios)
- Os templates são apenas sugestões, podem ser completamente personalizados
- A comunicação entre medições e orçamento é automática via triggers do banco

