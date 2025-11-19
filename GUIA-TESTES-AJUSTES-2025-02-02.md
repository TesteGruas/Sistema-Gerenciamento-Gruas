# Guia de Testes - Ajustes do Sistema (02/02/2025)

Este guia detalha como testar cada funcionalidade implementada, incluindo passos de preparação e caminhos de acesso.

---

## 🔧 Preparação Inicial

### 1. Executar Migrations no Banco de Dados

**IMPORTANTE:** Execute as migrations na ordem correta!

```bash
# Conecte-se ao banco de dados PostgreSQL/Supabase
# Execute cada migration na ordem:

# 1. Ajustes de Componentes
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250202_ajustes_componentes_grua.sql

# 2. Integração Componentes com Estoque
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250202_integrar_componentes_estoque.sql

# 3. Campos Técnicos da Grua
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250202_campos_tecnicos_grua.sql

# 4. Expansão de Orçamentos (se ainda não foi executada)
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250202_expandir_orcamentos.sql

# 5. Medições Mensais
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250202_medicoes_mensais_orcamentos.sql
```

**OU via Supabase Dashboard:**
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo de cada migration e execute na ordem

### 2. Reiniciar o Backend

```bash
cd backend-api

# Instalar dependências (se necessário)
npm install

# Parar o servidor atual (Ctrl+C se estiver rodando)
# Iniciar o servidor
npm run dev
# ou
npm start
```

**Verificar se o servidor iniciou corretamente:**
- Deve aparecer: "Servidor rodando na porta XXXX"
- Verificar se não há erros de importação das novas rotas

### 3. Recompilar o Frontend

```bash
# Na raiz do projeto (não dentro de backend-api)

# Para desenvolvimento (hot reload)
npm run dev

# Para produção (build completo)
npm run build
npm start
```

**Verificar se compilou sem erros:**
- Não deve haver erros de TypeScript
- Verificar se os novos imports estão corretos

---

## 📋 Testes por Funcionalidade

---

## 1. ✅ Ajustes no Cadastro de Componentes

### Caminho de Acesso:
```
Dashboard → Gruas → [Selecionar uma Grua] → Aba "Componentes"
```

### O que testar:

#### 1.1. Campo de Localização
1. Clique em "Adicionar Componente"
2. Verifique o campo "Localização" (deve ser um dropdown)
3. Teste todas as opções:
   - ✅ Obra X
   - ✅ Almoxarifado
   - ✅ Oficina
   - ✅ Em trânsito
   - ✅ Em manutenção

#### 1.2. Campo de Obra (quando "Obra X" selecionado)
1. Selecione "Obra X" no dropdown de Localização
2. **Deve aparecer** um novo dropdown "Selecione a Obra"
3. Verifique se a lista de obras carrega corretamente
4. Selecione uma obra
5. Salve o componente e verifique se a obra foi salva

#### 1.3. Campo Vida Útil (%)
1. No formulário de componente, encontre "Vida Útil"
2. Teste o **slider** (arraste de 0 a 100)
3. Teste o **input numérico** (digite valores)
4. Verifique que valores acima de 100 são limitados a 100
5. Verifique que valores negativos são limitados a 0
6. Salve e verifique se o valor foi persistido

#### 1.4. Campos de Dimensões
1. No formulário, encontre a seção "Dimensões (opcional)"
2. Preencha:
   - Altura (m)
   - Largura (m)
   - Comprimento (m)
   - Peso (kg)
3. Verifique que aceita valores decimais (ex: 1.50)
4. Salve e verifique se os valores foram salvos
5. Edite o componente e verifique se os valores aparecem corretamente

#### 1.5. Campos Removidos
1. Verifique que **NÃO existe** mais o campo "Data de Instalação"
2. Verifique que **NÃO existe** mais o campo "Danificada"
3. Verifique que o status "Danificado" ainda existe no dropdown de Status

### Resultado Esperado:
- ✅ Todos os novos campos aparecem e funcionam
- ✅ Campos removidos não aparecem mais
- ✅ Validações funcionam corretamente
- ✅ Dados são salvos no banco

---

## 2. ✅ Integração de Componentes com Estoque

### Caminho de Acesso:
```
Dashboard → Estoque
```

### O que testar:

#### 2.1. Componentes Aparecem no Estoque
1. Acesse a página de Estoque
2. Verifique se há uma coluna ou filtro para "Tipo de Item" (Produto/Componente)
3. Verifique se os componentes aparecem na lista
4. Verifique se mostra:
   - Nome do componente
   - Quantidade disponível
   - Quantidade em uso
   - Valor total

#### 2.2. Sincronização Automática
1. Crie um novo componente em uma grua
2. Vá para a página de Estoque
3. **O componente deve aparecer automaticamente** (sem precisar fazer nada)
4. Verifique se as quantidades estão corretas

#### 2.3. Movimentações Automáticas
1. Instale um componente em uma obra (via histórico de componentes)
2. Vá para Estoque → Movimentações
3. **Deve aparecer uma movimentação automática** de "Saída"
4. Verifique se a quantidade disponível diminuiu

#### 2.4. Remoção de Componente
1. Remova um componente de uma obra
2. Vá para Estoque → Movimentações
3. **Deve aparecer uma movimentação automática** de "Entrada"
4. Verifique se a quantidade disponível aumentou

### Resultado Esperado:
- ✅ Componentes aparecem no estoque automaticamente
- ✅ Quantidades são sincronizadas automaticamente
- ✅ Movimentações são registradas automaticamente
- ✅ Valores totais são calculados corretamente

---

## 3. ✅ Campos Técnicos Obrigatórios no Cadastro de Grua

### Caminho de Acesso:
```
Dashboard → Gruas → [Criar Nova Grua] ou [Editar Grua Existente]
```

### O que testar:

#### 3.1. Criar Nova Grua
1. Clique em "Nova Grua" ou "Adicionar Grua"
2. Verifique que os seguintes campos são **obrigatórios** (aparecem com *):
   - ✅ Fabricante
   - ✅ Tipo (dropdown: Grua Torre, Grua Torre Auto Estável, Grua Móvel)
   - ✅ Lança (metros)
   - ✅ Altura Final (metros)
   - ✅ Ano
   - ✅ Tipo de Base
   - ✅ Capacidade 1 cabo (kg)
   - ✅ Capacidade 2 cabos (kg)
   - ✅ Potência Instalada (KVA)
   - ✅ Voltagem
   - ✅ Velocidade de Rotação (rpm)
   - ✅ Velocidade de Elevação (m/min)

#### 3.2. Validação de Campos
1. Tente salvar sem preencher um campo obrigatório
2. **Deve aparecer mensagem de erro** indicando o campo obrigatório
3. Preencha todos os campos obrigatórios
4. Salve e verifique se foi criado com sucesso

#### 3.3. Editar Grua Existente
1. Abra uma grua existente para edição
2. Verifique se todos os campos técnicos aparecem
3. Se algum campo estiver vazio, deve ter um valor padrão
4. Altere alguns valores e salve
5. Verifique se as alterações foram salvas

#### 3.4. Visualização
1. Na listagem de gruas, verifique se os novos campos aparecem
2. Na visualização detalhada, verifique se todos os campos técnicos são exibidos

### Resultado Esperado:
- ✅ Todos os campos obrigatórios são validados
- ✅ Mensagens de erro aparecem quando campos estão vazios
- ✅ Gruas existentes recebem valores padrão
- ✅ Dados são salvos corretamente

---

## 4. ✅ Renomeação do Módulo de Configuração

### Caminho de Acesso:
```
Dashboard → Gruas → [Selecionar uma Grua] → Botão "Especificações Técnicas"
```

### O que testar:

#### 4.1. Nome e Título
1. Acesse uma grua
2. Verifique que o botão agora se chama **"Especificações Técnicas"** (não mais "Configurações")
3. Clique no botão
4. Verifique que o título da página é **"Especificações Técnicas"**
5. Verifique o subtítulo: "Visualização somente leitura das especificações técnicas da grua"

#### 4.2. Funcionalidades Removidas
1. Verifique que **NÃO existe** mais o botão "Nova Configuração"
2. Verifique que **NÃO existem** botões "Editar" nos cards
3. Verifique que **NÃO existem** botões "Excluir" nos cards
4. Verifique que só existe botão "Visualizar" (ícone de olho)

#### 4.3. Visualização Somente Leitura
1. Clique em "Visualizar" em uma especificação
2. Verifique que o diálogo é **somente leitura**
3. Verifique que **NÃO existe** botão "Editar Configuração"
4. Verifique que só existe botão "Fechar"

#### 4.4. Navegação
1. Na listagem de gruas, verifique que o botão também se chama "Especificações Técnicas"
2. Teste a navegação de volta

### Resultado Esperado:
- ✅ Nome alterado em todos os lugares
- ✅ Funcionalidades de edição/criação removidas
- ✅ Módulo é somente leitura
- ✅ Visualização funciona corretamente

---

## 5. ✅ Expansão do Módulo de Orçamentos

### Caminho de Acesso:
```
Dashboard → Orçamentos → [Criar Novo] ou [Editar Existente]
```

### O que testar:

#### 5.1. Dados do Cliente Expandidos
1. Crie ou edite um orçamento
2. Verifique os campos de cliente:
   - ✅ Nome
   - ✅ CNPJ/CPF
   - ✅ Endereço
   - ✅ Bairro
   - ✅ CEP
   - ✅ Cidade
   - ✅ Estado
   - ✅ Telefone
   - ✅ Email
   - ✅ Contato

#### 5.2. Dados da Obra
1. Verifique os campos de obra:
   - ✅ Nome da Obra
   - ✅ Tipo
   - ✅ Endereço
   - ✅ Cidade
   - ✅ Bairro
   - ✅ CEP
   - ✅ Engenheiro Responsável
   - ✅ Contato

#### 5.3. Dados da Grua
1. Verifique os campos de grua:
   - ✅ Modelo
   - ✅ Lança
   - ✅ Altura Final
   - ✅ Base
   - ✅ Ano
   - ✅ Potência
   - ✅ Capacidade 1 cabo
   - ✅ Capacidade 2 cabos
   - ✅ Voltagem

#### 5.4. Valores Fixos
1. Procure pela seção "Valores Fixos"
2. Adicione um item:
   - Tipo: Locação ou Serviço
   - Descrição
   - Quantidade
   - Valor Unitário
   - Valor Total (calculado automaticamente)
   - Observações
3. Salve e verifique se foi salvo

#### 5.5. Custos Mensais
1. Procure pela seção "Custos Mensais"
2. Adicione um item:
   - Tipo
   - Descrição
   - Valor Mensal
   - Obrigatório (checkbox)
   - Observações
3. Salve e verifique se foi salvo

#### 5.6. Tabela de Horas Extras
1. Procure pela seção "Tabela de Horas Extras"
2. Adicione linhas:
   - Tipo: Operador, Sinaleiro ou Equipamento
   - Dia da Semana: Sábado, Domingo/Feriado ou Normal
   - Valor/Hora
3. Salve e verifique se foi salvo

#### 5.7. Serviços Adicionais
1. Procure pela seção "Serviços Adicionais"
2. Adicione um item:
   - Tipo
   - Descrição
   - Quantidade
   - Valor Unitário
   - Valor Total (calculado)
   - Observações
3. Salve e verifique se foi salvo

#### 5.8. Campos Gerais
1. Verifique os campos:
   - ✅ Prazo de Locação (meses)
   - ✅ Data Início Estimada
   - ✅ Tolerância (dias)
   - ✅ Escopo Incluso (texto longo)
   - ✅ Responsabilidades do Cliente (texto longo)
   - ✅ Condições Comerciais (texto longo)
   - ✅ Condições Gerais (texto longo)
   - ✅ Logística (texto longo)
   - ✅ Garantias (texto longo)

### Resultado Esperado:
- ✅ Todos os campos aparecem e funcionam
- ✅ Dados são salvos corretamente
- ✅ Cálculos automáticos funcionam
- ✅ Validações funcionam

---

## 6. ✅ Módulo de Medições Mensais

### Caminho de Acesso:
```
Dashboard → Orçamentos → [Selecionar um Orçamento] → Aba "Medições" ou "Medições Mensais"
```

### O que testar:

#### 6.1. Gerar Medição Automática
1. Acesse um orçamento que tenha custos mensais cadastrados
2. Clique em "Gerar Medição Automática" ou "Nova Medição"
3. Selecione o período (formato: YYYY-MM, ex: 2025-02)
4. Marque as opções:
   - ✅ Aplicar valores do orçamento
   - ✅ Incluir horas extras
   - ✅ Incluir serviços adicionais
5. Clique em "Gerar"
6. **A medição deve ser criada automaticamente** com:
   - Custos mensais copiados do orçamento
   - Tabela de horas extras copiada
   - Serviços adicionais copiados

#### 6.2. Criar Medição Manual
1. Clique em "Nova Medição"
2. Preencha:
   - Número da medição
   - Período (YYYY-MM)
   - Data da medição
   - Mês de referência (1-12)
   - Ano de referência
3. Adicione custos mensais
4. Adicione horas extras (preencha quantidade de horas)
5. Adicione serviços adicionais
6. Adicione aditivos (adicionais e descontos)
7. Salve

#### 6.3. Cálculo Automático
1. Após criar/editar uma medição, verifique:
   - ✅ Valor Mensal Bruto (soma dos custos mensais)
   - ✅ Valor de Aditivos (soma dos adicionais)
   - ✅ Valor de Custos Extras (horas extras + serviços)
   - ✅ Valor de Descontos (soma dos descontos)
   - ✅ **Valor Total** (calculado automaticamente: Mensal + Aditivos + Extras - Descontos)

#### 6.4. Finalizar Medição
1. Abra uma medição com status "Pendente"
2. Clique em "Finalizar Medição"
3. **O status deve mudar para "Finalizada"**
4. Vá para o orçamento relacionado
5. **O campo "Total Faturado Acumulado" deve ser atualizado automaticamente**
6. **O campo "Última Medição Período" deve ser atualizado**

#### 6.5. Histórico Mensal
1. No orçamento, procure por "Histórico de Medições" ou "Medições Mensais"
2. **Deve aparecer uma lista de todas as medições** ordenadas por período
3. Clique em uma medição para ver detalhes
4. Verifique se mostra:
   - Período
   - Status
   - Valor total
   - Data de finalização (se finalizada)

#### 6.6. Editar Medição
1. Abra uma medição com status "Pendente"
2. Edite valores de horas extras (quantidade de horas)
3. Adicione/remova serviços adicionais
4. Adicione/remova aditivos
5. Salve
6. **Os valores devem ser recalculados automaticamente**

#### 6.7. Deletar Medição
1. Tente deletar uma medição "Pendente" → **Deve funcionar**
2. Tente deletar uma medição "Finalizada" → **Deve dar erro** (não pode deletar finalizada)

### Resultado Esperado:
- ✅ Geração automática funciona
- ✅ Cálculos são automáticos e corretos
- ✅ Finalização atualiza o orçamento
- ✅ Histórico mostra todas as medições
- ✅ Validações funcionam

---

## 7. ✅ Sistema de Relatórios

### 7.1. Relatório de Orçamento (PDF GR2025064-1)

### Caminho de Acesso:
```
Dashboard → Orçamentos → [Selecionar um Orçamento] → Botão "Gerar PDF" ou "Imprimir"
```

**OU via API diretamente:**
```
GET /api/relatorios/orcamentos/:id/pdf
```

### O que testar:

1. Acesse um orçamento completo (com todos os dados preenchidos)
2. Clique em "Gerar PDF" ou "Baixar PDF"
3. **O PDF deve ser baixado automaticamente**
4. Abra o PDF e verifique:
   - ✅ Cabeçalho com número do orçamento
   - ✅ Dados do cliente completos
   - ✅ Dados da obra completos
   - ✅ Dados da grua completos
   - ✅ Tabela de valores fixos
   - ✅ Tabela de custos mensais com total
   - ✅ Tabela de horas extras
   - ✅ Tabela de serviços adicionais
   - ✅ Condições gerais
   - ✅ Logística
   - ✅ Garantias
   - ✅ Seção de assinaturas
   - ✅ Rodapé com número de páginas

### Resultado Esperado:
- ✅ PDF é gerado sem erros
- ✅ Todos os dados aparecem corretamente
- ✅ Formatação está correta
- ✅ Layout é idêntico ao modelo GR2025064-1

---

### 7.2. Relatório de Medições Mensais (PDF)

### Caminho de Acesso:
```
Dashboard → Orçamentos → [Selecionar um Orçamento] → "Relatório de Medições"
```

**OU via API diretamente:**
```
GET /api/relatorios/medicoes/:orcamento_id/pdf
```

### O que testar:

1. Acesse um orçamento que tenha pelo menos uma medição
2. Clique em "Relatório de Medições" ou "Gerar PDF de Medições"
3. **O PDF deve ser baixado automaticamente**
4. Abra o PDF e verifique:
   - ✅ Cabeçalho com dados do orçamento e cliente
   - ✅ Resumo geral (total de medições, finalizadas, total faturado)
   - ✅ Detalhamento mês a mês:
     - Período e status
     - Custos mensais
     - Horas extras detalhadas
     - Serviços adicionais
     - Aditivos
     - Resumo do mês (valores parciais)
     - Total do mês
     - Total acumulado até o mês
   - ✅ Rodapé com número de páginas

### Resultado Esperado:
- ✅ PDF é gerado sem erros
- ✅ Todas as medições aparecem
- ✅ Cálculos estão corretos
- ✅ Histórico completo é exibido

---

### 7.3. Relatório de Componentes + Estoque (PDF)

### Caminho de Acesso:
```
Dashboard → Estoque → "Relatório de Componentes" ou "Gerar PDF"
```

**OU via API diretamente:**
```
GET /api/relatorios/componentes-estoque/pdf?grua_id=X&localizacao_tipo=Y&status=Z&obra_id=W
```

### O que testar:

#### 7.3.1. Sem Filtros
1. Acesse a página de Estoque
2. Clique em "Relatório de Componentes" ou "Gerar PDF"
3. **O PDF deve ser baixado automaticamente**
4. Abra o PDF e verifique:
   - ✅ Resumo geral (total de componentes, disponível, em uso, valor total)
   - ✅ Seção de componentes alocados
   - ✅ Seção de componentes retornados/danificados
   - ✅ Seção de movimentações recentes (30 dias)

#### 7.3.2. Com Filtros
1. Aplique filtros (grua, localização, status, obra)
2. Gere o PDF
3. **O PDF deve mostrar apenas os componentes filtrados**

#### 7.3.3. Conteúdo do PDF
1. Verifique a seção "Componentes Alocados":
   - Nome, Grua, Localização, Quantidade Alocada, Vida Útil, Status
2. Verifique a seção "Componentes Retornados/Danificados":
   - Nome, Grua, Status, Quantidades, Vida Útil
3. Verifique a seção "Movimentações Recentes":
   - Data, Componente, Tipo, Quantidade, Valor Total

### Resultado Esperado:
- ✅ PDF é gerado sem erros
- ✅ Filtros funcionam corretamente
- ✅ Todas as seções aparecem
- ✅ Dados estão corretos

---

## 🐛 Troubleshooting

### Erro: "Tabela não existe"
**Solução:** Execute as migrations no banco de dados (veja Preparação Inicial)

### Erro: "Cannot find module"
**Solução:** 
```bash
# Backend
cd backend-api
npm install

# Frontend
npm install
```

### Erro: "Route not found"
**Solução:** Verifique se o servidor backend foi reiniciado após adicionar as novas rotas

### Erro: "Permission denied"
**Solução:** Verifique se você está logado e tem as permissões necessárias:
- `obras:visualizar` para visualizar
- `obras:editar` para criar/editar

### Componentes não aparecem no Estoque
**Solução:** 
1. Verifique se os triggers foram criados (migration 20250202_integrar_componentes_estoque.sql)
2. Crie um novo componente e verifique se aparece automaticamente
3. Se não aparecer, verifique os logs do banco de dados

### Medição não atualiza o Orçamento
**Solução:**
1. Verifique se os triggers foram criados (migration 20250202_medicoes_mensais_orcamentos.sql)
2. Verifique se a medição foi finalizada (status = 'finalizada')
3. Verifique os logs do banco de dados

### PDF não é gerado
**Solução:**
1. Verifique se o PDFKit está instalado: `npm list pdfkit` (no backend-api)
2. Verifique os logs do servidor backend
3. Verifique se a rota está registrada no server.js

---

## ✅ Checklist de Testes

Use este checklist para garantir que tudo foi testado:

- [ ] Componentes: Campo Localização funciona
- [ ] Componentes: Campo Obra aparece quando "Obra X" selecionado
- [ ] Componentes: Vida Útil com slider funciona
- [ ] Componentes: Dimensões podem ser preenchidas
- [ ] Componentes: Campos removidos não aparecem
- [ ] Estoque: Componentes aparecem automaticamente
- [ ] Estoque: Movimentações são registradas automaticamente
- [ ] Gruas: Campos técnicos obrigatórios validam corretamente
- [ ] Gruas: Gruas existentes têm valores padrão
- [ ] Configurações: Nome alterado para "Especificações Técnicas"
- [ ] Configurações: Funcionalidades de edição removidas
- [ ] Orçamentos: Todos os novos campos aparecem
- [ ] Orçamentos: Valores fixos podem ser adicionados
- [ ] Orçamentos: Custos mensais podem ser adicionados
- [ ] Orçamentos: Tabela de horas extras funciona
- [ ] Orçamentos: Serviços adicionais podem ser adicionados
- [ ] Medições: Geração automática funciona
- [ ] Medições: Cálculo automático está correto
- [ ] Medições: Finalização atualiza o orçamento
- [ ] Medições: Histórico mostra todas as medições
- [ ] Relatórios: PDF de orçamento é gerado
- [ ] Relatórios: PDF de medições é gerado
- [ ] Relatórios: PDF de componentes é gerado

---

## 📞 Suporte

Se encontrar problemas durante os testes:
1. Verifique os logs do backend (`console.log` ou arquivo de log)
2. Verifique os logs do frontend (Console do navegador)
3. Verifique os logs do banco de dados (Supabase Dashboard → Logs)
4. Consulte o arquivo `CHANGELOG-AJUSTES-2025-02-02.md` para mais detalhes

---

**Boa sorte com os testes! 🚀**

